import { createApp } from 'vue'
import Dialog from '@/components/Dialog.vue'

interface DialogOptions {
  subject: string
  message: string
  ok: () => void
  cancel?: () => void
}

const DialogHelper = {
  showDialog(_context: unknown, { subject, message, ok, cancel }: DialogOptions): void {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = () => {
      dialogApp.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }

    const dialogApp = createApp(Dialog, {
      subject,
      message,
      onPrimary: () => { ok(); cleanup() },
      onSecondary: cancel ? () => { cancel(); cleanup() } : undefined
    })

    dialogApp.mount(container)
  }
}
export default DialogHelper
