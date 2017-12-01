import m from 'mithril'
import Key from '../models/key'
import Plan from '../models/plan'
export default {
    oninit: Plan.loadList().then(Key.loadList),
    view: () => m("div", [
        m("h2", "Available Api Keys"),
        m("table.table.responsive.border.hover", [
            m("thead", m("tr", [
                m("th", "Key"),
                m("th", "Plan"),
                m("th", "Active"),
                m("th", "")
            ])),
            m("tbody", Key.list.map(key => m("tr", [
                m("td", {'data-th': 'Key'}, key.key),
                m("td", {'data-th': 'Plan'}, Plan.map[key.plan]),
                m("td", {'data-th': 'Active'}, key.active),
                m("td", {'data-th': 'Actions'}, m(".btn-group", [
                    m("button.btn.sm", {onclick: () => {
                        m.route.set("/editkey/" + key.key)
                    }}, m.trust('<i class="icon-tag"></i>'), "Change Plan"),
                    m("button.btn.sm.error", {onclick: () => {
                        Key.disable(key.key).then(Key.loadList)
                    }}, m.trust('<i class="icon-bin"></i>'), "Disable")
                ]))
            ])))
        ])
    ])
}