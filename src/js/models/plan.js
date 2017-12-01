import m from 'mithril'
let path = window.location.pathname.replace('/index.html', '')
let Plan = {
    list: [],
    map: {},
    loadList: () => m.request({
        method: "GET",
        url: path + "/plan",
        withCredentials: true
    }).then(result => {
        Plan.list = result
        Plan.list.forEach(p => Plan.map[p.key] = p.name)
    }),
    current: {},
    load: id => m.request({
        method: "GET",
        url: path + "/plan/" + id,
        withCredentials: true
    }).then(result => {
        Plan.current = result
    }),
    create: plan => m.request({
        method: "POST",
        url: path + "/plan",
        withCredentials: true,
        data: JSON.stringify(plan)
    })
}
export default Plan