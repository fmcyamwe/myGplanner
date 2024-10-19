import { boot } from 'quasar/wrappers'
import VueDraggable from 'vuedraggable/src/vuedraggable'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
//export default boot(async (/* { app, router, ... } */) => {
  // something to do
//})


export default boot (({ Vue }) => {
  Vue.use(VueDraggable)
})

export {VueDraggable}
