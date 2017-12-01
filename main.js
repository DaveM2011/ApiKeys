'use strict';
const db = require("@arangodb").db;
const _ = require('lodash');
const dd = require('dedent');
const joi = require('joi');
const createAuth = require('@arangodb/foxx/auth');
const createRouter = require('@arangodb/foxx/router');
const sessionsMiddleware = require('@arangodb/foxx/sessions');
const crypto = require("@arangodb/crypto");
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const ArangoError = require('@arangodb').ArangoError;
const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const keys = module.context.collection("keys");
const plans = module.context.collection("plans");

const Plan = require('./models/plan');
const ApiKey = require('./models/apikey');

const utils = require("./lib.js");
//const payForRoute = require("./pay.js");

const refillSchema = joi.object().keys({
    hour: joi.number().integer().optional().description("Hourly refill rate"),
    day: joi.number().integer().optional().description("Daily refill rate"),
    month: joi.number().integer().optional().description("Monthly refill rate")
});
const refillsSchema = joi.object().pattern(/\.*/, refillSchema.unknown(false)).description("Definition of buckets");
const planSchema = {
    refills: refillsSchema,
    name: joi.string().required().description("Name of the plan")
};
const keyType = joi.string().required();

const router = createRouter();
module.context.use(router);

let payTransaction = function (params) {
    //var db2 = require("@arangodb").db;
    let key = params.apiKey;
    let cost = params.cost;
    let type = params.type;
    let account;
    try {
        account = keys.document(key);
    } catch (err) {
        // Could not read the account info.
        // It is invalid
        throw "invalid key: " + key
    }
    if (account.disabled) {
        // The account is disabled
        throw "invalid key: " + key
    }
    let update = {};
    if (account.hasOwnProperty("lastUpdate")) {
        update.lastUpdate = account.lastUpdate;
    }
    if (account.hasOwnProperty("buckets")) {
        update.buckets = account.buckets;
    }
    let refills = plans.document(account.plan).refills;
    utils.refillBuckets(update, refills);
    if (!update.buckets.hasOwnProperty(type)) {
        // This bucket is not defined for this user
        throw "No " + type + " requests left for key: " + key;
    }
    if (cost === undefined) {
        cost = 1;
    }
    if (cost <= 0) {
        // Free route
        return;
    }
    let current = update.buckets[type];
    for (let p in current) {
        if (current.hasOwnProperty(p)) {
            if (current[p] < cost) {
                throw "No " + type + " requests left for key: " + key;
            }
            if (current[p] !== Infinity) {
                current[p] -= cost;
            }
        }
    }
    //require("console").log(update);
    keys.update(key, update);
    return
};

let payForRoute = (req, res, next) => {
    try {
        const key = req.pathParams.key;
        if (key) {
            try {
                let result = db._executeTransaction({
                    collections: {
                        write: keys.name(),
                        read: plans.name()
                    },
                    action: payTransaction,
                    params: {
                        apiKey: key,
                        type: 'globby',
                        cost: 1
                    }
                });
            } catch (e) {
                res.throw(403, e)
            }
        }
    } finally {
        next();
    }
}

let payForClient = (req, res, next) => {
    try {
        const key = req.queryParams.client_id
        if (key) {
            try {
                let result = db._executeTransaction({
                    collections: {
                        write: keys.name(),
                        read: plans.name()
                    },
                    action: payTransaction,
                    params: {
                        apiKey: key,
                        type: 'globby',
                        cost: 1
                    }
                })
            } catch (e) {
                res.throw(403, e)
            }
        } else {
            res.throw(403, JSON.stringify(req.queryParams))
        }
    } finally {
        next()
    }
}

let payForClient2 = {
    register (endpoint) {
        //db.log.insert({got: 'here'});
        endpoint.queryParam('client_id', keyType.description('The client id'));
        return function (req, res, next) {
            db.log.insert({got: 'here2'});
            try {
                const key = req.queryParams.key;
                if (key) {
                    db.log.insert({got: key});
                    try {
                        let result = db._executeTransaction({
                            collections: {
                                write: keys.name(),
                                read: plans.name()
                            },
                            action: payTransaction,
                            params: {
                                apiKey: key,
                                type: 'globby',
                                cost: 1
                            }
                        });
                    } catch (e) {
                        res.throw(403, e)
                    }
                }
            } finally {
                next();
            }
        }
    }
}

let getKey = (key) => {
    let apikey = keys.document(key);
    let plan = plans.document(apikey.plan);
    utils.refillBuckets(apikey, plan.refills);
    keys.update(key, apikey);
    return {
        apikey: apikey._key,
        name: apikey.name,
        buckets: apikey.buckets,
        refill: plan.refills,
        active: !apikey.disabled,
        lastUpdate: apikey.lastUpdate,
        scope: apikey.scope,
        plan: plan.name
    }
}

module.exports.payForRoute = payForRoute
module.exports.payForClient = payForClient
module.exports.payForClient2 = payForClient2
module.exports.getKey = getKey

router.get(function (req, res) {
    res.sendFile(module.context.fileName('build/index.html'));
})
.response(['text/html'])
.summary('Application');

router.get('/plan', function (req, res) {
    let result = [];
    let cursor = plans.all();
    while (cursor.hasNext()) {
      let doc = cursor.next();
      result.push({key: doc._key, name: doc.name});
    }
    res.json(result);
})
.response([Plan], 'A list of plans')
.summary('List all plans')
.description('Lists all available plans');

router.post('/plan', function (req, res) {
    let plan = req.body;
    let save = plans.save({
      refills: plan.refills,
      name: plan.name
    });
    res.json({
      id: save._key,
      name: plan.name
    });
}).body(planSchema, 'The plan')
.summary('Define new base plan')
.description(dd`This path is used to define a baseplan for
api key definitions.
This plan contains  default refresh rates and
new apikeys can be spawned from existing plans`);

router.get('/plan/:plan', function (req, res) {
    res.send(plans.document(req.pathParams.plan));
})
.pathParam("plan", keyType.description("The id of a plan"))
.response(Plan, 'The plan')
.summary('Load base plan')
.description('Show the basic information contained in this plan');

router.put("/plan/:plan", function(req, res) {
    let plan = req.pathParams.plan;
    let refills = req.pathParams.refills;
    res.json(plans.update(plan, {
        refills: refills
    }, {mergeObjects: false}));
})
.pathParam("plan", keyType.description("The id of a plan"))
.body(refillSchema, 'Refill')
.summary('Change base plan')
.description("Change the refill plan");

router.get("/key", function(req, res) {
    let result = [];
    let cursor = keys.all();
    while (cursor.hasNext()) {
      let doc = cursor.next();
      result.push({key: doc._key, plan: doc.plan, active: !doc.disabled});
    }
    res.json(result);
})
.response([ApiKey], 'A list of apikeys')
.summary('List all apikeys')
.description("Returns the list of all apikeys and their attached plan");

router.post("/key/:plan", function(req, res) {
    let plan = req.pathParams.plan;
    const meta = {
        _key: crypto.genRandomAlphaNumbers(32),
        plan: plan,
        secret: crypto.genRandomAlphaNumbers(32)
    };
    let newKey = keys.save(meta);
    Object.assign(newKey, meta);
    res.json({
        client_id: newKey._key,
        client_secret: newKey.secret
    });
})
.pathParam("plan", keyType.description("The id of a plan"))
.summary('Create a new apikey')
.description("Creates a new apikey using the given plan");

router.get('/key/:key', function(req, res) {
    try {
        let key = req.pathParams.key;
        let apikey = keys.document(key);
        let plan = plans.document(apikey.plan);
        utils.refillBuckets(apikey, plan.refills);
        keys.update(key, apikey);
        res.json({
            apikey: apikey._key,
            buckets: apikey.buckets,
            refill: plan.refills,
            active: !apikey.disabled,
            lastUpdate: apikey.lastUpdate
        });
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
          }
          if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
          }
          throw e;
    }
})
.pathParam('key', keyType.description('An apikey'))
.response([ApiKey], 'The key')
.summary('Show details of one apikey')
.description('Lists the details of one specific apikey. Includes it\'s current buckets and refill rates');

router.put('/key/:key/:plan', function(req, res) {
    try {
        let key = req.pathParams.key;
        let plan = req.pathParams.plan;
        let refills = plans.document(plan).refills;
        keys.update(key, {
            plan: plan,
            bucket: refills,
            disabled: false,
            lastUpdate: (new Date()).toISOString()
        }, {
            keepNull: false
        });
        res.json({
            plan: plan,
            bucket: refills,
            active: true,
            key: key
        });
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
          }
          if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
          }
          throw e;
    }
})
.pathParam('key', keyType.description('An apikey'))
.pathParam('plan', keyType.description('The id of a plan'))
.response([ApiKey], 'The key')
.summary('Change plan of apikey')
.description('Changes the plan used for an api key. Reactivates this apikey also');

router.delete("/key/:key", function(req, res) {
    let key = req.pathParams.key;
    keys.update(key, {
        disabled: true
    });
    res.json({
        active: false,
        key: key
    });
})
.pathParam("key", keyType.description("An apikey."))
.summary('Deactivate apikey')
.description('Deactivates this apikey');

router.get('/pay/:key', payForRoute, function(req, res) {
    try {
        res.json({success: true});
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
            throw httpError(HTTP_NOT_FOUND, e.message);
          }
          if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
            throw httpError(HTTP_CONFLICT, e.message);
          }
          throw e;
    }
})
.pathParam('key', keyType.description('An apikey'))
.response([ApiKey], 'The key')
.summary('Show details of one apikey')
.description('Lists the details of one specific apikey. Includes it\'s current buckets and refill rates');


/*router.use({
    register (endpoint) {
        //db.log.insert({got: 'here'});
        //endpoint.pathParam('key', keyType.description('An apikey'));
        return function (req, res, next) {
            db.log.insert({got: 'here2'});
            try {
                const key = req.pathParams.key;
                if (key) {
                    db.log.insert({got: key});
                    try {
                        let result = db._executeTransaction({
                            collections: {
                                write: keys.name(),
                                read: plans.name()
                            },
                            action: payTransaction,
                            params: {
                                apiKey: key,
                                type: 'globby',
                                cost: 1
                            }
                        });
                    } catch (e) {
                        res.throw(403, e)
                    }
                }
            } finally {
                next();
            }
        }
    }
});*/
