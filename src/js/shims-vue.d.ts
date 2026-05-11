declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}
