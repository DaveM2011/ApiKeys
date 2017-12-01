import m from 'mithril'
import Plan from '../models/plan'
export default {
    oninit: vnode => Plan.load(vnode.attrs.plan),
    view: () => (Plan.current && m("div", [
        Plan.current.name && m("h2", "Request limits in ", Plan.current.name),
        m("table.table.responsive.border.hover", [
            m("thead", m("tr", [
                m("th", "Bucket"),
                m("th", "Hour"),
                m("th", "Day"),
                m("th", "Month")
            ])),
            m("tbody", Plan.current.refills && Object.keys(Plan.current.refills).map(name => m("tr", [
                m("td", {'data-th': 'Bucket'}, name),
                m("td", {'data-th': 'Hour'}, Plan.current.refills[name].hour),
                m("td", {'data-th': 'Day'}, Plan.current.refills[name].day),
                m("td", {'data-th': 'Month'}, Plan.current.refills[name].month)
            ])))
        ])
    ]))
}