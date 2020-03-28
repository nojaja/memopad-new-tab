import Vue from 'vue'
import Dialog from '@/components/Dialog.vue'

const DialogHelper = {
  showDialog (context, { subject, message, ok, cancel }) {
    const DialogVM = Vue.extend(Dialog)
    const vm = new DialogVM({
      parent: context,
      propsData: {
        subject: subject,
        message: message,
        onPrimary () {
          ok()
          vm.close()
        },
        onSecondary () {
          cancel()
          vm.close()
        }
      }
    })
    vm.show()
  }
}
export default DialogHelper
