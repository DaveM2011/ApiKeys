import m from 'mithril'
let path = window.location.pathname.replace('/index.html', '')
let Key = {
    list: [],
    loadList: () => {
        return m.request({
            method: "GET",
            url: path + "/key",
            withCredentials: true
        })
        .then(result => {
            Key.list = result.sort((a, b) => a.plan < b.plan)
        })
    },
    create: plan => m.request({
        method: "POST",
        url: path + "/key/" + plan,
        withCredentials: true
    }),
    changePlan: (key, plan) => {
        return m.request({
            method: "PUT",
            url: path + "/key/" + key + "/" + plan,
            withCredentials: true
        })
    },
    disable: key => {
        return m.request({
            method: "DELETE",
            url: path + "/key/" + key,
            withCredentials: true
        })
    }
}
export default Key