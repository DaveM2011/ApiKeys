import m from 'mithril'
import Plan from '../models/plan'
import Key from '../models/key'
export default {
    oninit: Plan.loadList,
    view: vnode => m("div", [
        m("h2", "Select Plan for Api Key"),
        m("h2", vnode.attrs.id),
        m(".btn-group", Plan.list.map(plan => m("button.btn.sm", {onclick: () => {
            Key.changePlan(vnode.attrs.id, plan.key).then(() => (Plan.loadList().then(Key.loadList), m.route.set("/keys")))
        }}, plan.name)))
    ])
}