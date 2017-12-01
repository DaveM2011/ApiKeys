import m from 'mithril'
export default {
    view: vnode => [
        m("header.head", [
            m(".logo"),
            m("nav.btn-group.f-r", [
                m("a[href='/'].btn.sm", {oncreate: m.route.link}, m.trust('<i class="icon-home"></i>'), "Plans"),
                m("a[href='/keys'].btn.sm", {oncreate: m.route.link}, m.trust('<i class="icon-lock"></i>'), "Keys")
            ])
        ]),
        m("main.main.container-fluid", vnode.children)
    ]
}