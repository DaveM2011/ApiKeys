import '../scss/app.scss'
import m from 'mithril'
import Layout from './views/layout'
import PlanList from './views/planlist'
import PlanForm from './views/planform'
import PlanDetails from './views/plan'
import NewKey from './views/newkey'
import KeyList from './views/keylist'
import EditKey from './views/editkey'
m.route.prefix('')
m.route(document.body, '/', {
    '/': {
        render: () => m(Layout, m(PlanList))
    },
    '/plans/:plan': {
        render: vnode => m(Layout, m(PlanDetails, vnode.attrs))
    },
    '/newplan': {
        render: vnode => m(Layout, m(PlanForm, vnode.attrs))
    },
    '/newkey/:id': {
        render: vnode => m(Layout, m(NewKey, vnode.attrs))
    },
    '/keys': {
        render: vnode => m(Layout, m(KeyList, vnode.attrs))
    },
    '/editkey/:id': {
        render: vnode => m(Layout, m(EditKey, vnode.attrs))
    }
})