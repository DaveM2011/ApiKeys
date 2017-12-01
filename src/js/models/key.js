import m from 'mithril'
let Key = {
    list: [],
    loadList: () => {
        return m.request({
            method: "GET",
            url: "/key",
            withCredentials: true
        })
        .then(result => {
            Key.list = result.sort((a, b) => a.plan < b.plan)
        })
    },
    create: plan => m.request({
        method: "POST",
        url: "/key/" + plan,
        withCredentials: true
    }),
    changePlan: (key, plan) => {
        return m.request({
            method: "PUT",
            url: "/key/" + key + "/" + plan,
            withCredentials: true
        })
    },
    disable: key => {
        return m.request({
            method: "DELETE",
            url: "/key/" + key,
            withCredentials: true
        })
    }
}
export default Key