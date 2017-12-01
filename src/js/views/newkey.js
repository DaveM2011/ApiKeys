import m from 'mithril'
import Key from '../models/key'
export default {
    key: null,
    oninit: vnode => Key.create(vnode.attrs.id).then(key => vnode.state.key = key),
    view: vnode => m("div", vnode.state.key && [
        m(".key", vnode.state.key.client_id),
        m(".key", vnode.state.key.client_secret)
    ]) || m(".key", "Generating key")
}