import m from 'mithril'
import stream from 'mithril/stream'
import Plan from '../models/plan'

export default {
    name: stream(''),
    buckets: [],
    oninit: vnode => {},
    view: vnode => m("div", [
        m("h2", "Create a new Plan"),
        m("form", {onsubmit: vnode.state.save.bind(vnode.state)}, [
            m(".form-element.form-group", [
                m("input[type=text][placeholder=Plan name].form-field", {oninput: m.withAttr('value', vnode.state.name)}),
                m("button.btn.sm.success", {onclick: e => (e.preventDefault(),vnode.state.buckets.push({name: stream(''), hour: stream(''), day: stream(''), month: stream('')}))}, "Add bucket")
            ]),
            m("table.table.responsive.border.hover", [
                m("thead", m("tr", [
                    m("th", "Bucket"),
                    m("th", "Hour"),
                    m("th", "Day"),
                    m("th", "Month"),
                    m("th", "")
                ])),
                m("tbody", vnode.state.buckets.map((bucket, idx) => m("tr", [
                    m("td", {'data-th': 'Bucket'}, m("input[placeholder=Name]", {value: bucket.name, oninput: m.withAttr('value', bucket.name)})),
                    m("td", {'data-th': 'Hour'}, m("input[type=number][placeholder=Hour]", {value: bucket.hour, oninput: m.withAttr('value', bucket.hour)})),
                    m("td", {'data-th': 'Day'}, m("input[type=number][placeholder=Day]", {value: bucket.day, oninput: m.withAttr('value', bucket.day)})),
                    m("td", {'data-th': 'Month'}, m("input[type=number][placeholder=Month]", {value: bucket.month, oninput: m.withAttr('value', bucket.month)})),
                    m("td", {'data-th': 'Remove'}, [
                        m("button.btn.sm.error", {onclick: () => {
                            vnode.state.buckets.splice(idx, 1)
                        }}, m.trust('<i class="icon-bin"></i>'), "Delete")
                    ])
                ])))
            ]),
            m("button.btn.sm.success", "Save")
        ])
    ]),
    save: function(e) {
        e.preventDefault();
        var plan = {
            name: this.name(),
            refills: {}
        };
        var tmp, t;
        var bu = this.buckets;
        var list = ["hour", "day", "month"];
        var l;
        for (t = 0; t < bu.length; ++t) {
            tmp = {};
            for (l = 0; l < list.length; ++l) {
                if (bu[t].hasOwnProperty(list[l])) {
                    tmp[list[l]] = parseInt(bu[t][list[l]]());
                }
            }
            plan.refills[bu[t].name] = tmp;
        }
        Plan.create(plan).then(() => m.route.set('/'))
        return false
    }
}