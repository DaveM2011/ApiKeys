import m from 'mithril'
import Plan from '../models/plan'
export default {
    oninit: Plan.loadList,
    view: () => m("div", [
        m("h2", "Available Plans"),
        m("a[href=/newplan].btn.sm.success", {oncreate: m.route.link}, m.trust('<i class="icon-plus"></i>'), "Add Plan"),
        m("table.table.responsive.border.hover", [
            m("thead", m("tr", [
                m("th", "ID"),
                m("th", "Name"),
                m("th", "")
            ])),
            m("tbody", Plan.list.map(plan => m("tr", {onclick: () => {
                m.route.set("/plan/" + plan.key)
            }}, [
                m("td", {'data-th': 'ID'}, plan.key),
                m("td", {'data-th': 'Name'}, plan.name),
                m("td", {'data-th': 'Actions'}, [
                    m("button.btn.sm", {onclick: e => {
                        e.preventDefault()
                        e.stopPropagation()
                        m.route.set("/newkey/" + plan.key)
                    }}, m.trust('<i class="icon-plus"></i>'), "New Key")
                ])
            ])))
        ])
    ])
}