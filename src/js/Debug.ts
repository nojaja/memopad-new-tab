class Debug {
  constructor() {}

  // デバッグ用stringify
  stringify(str: unknown): string {
    const cache: object[] = []
    return JSON.stringify(
      str,
      function(key: string, value: unknown) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value as object) !== -1) {
            // Circular reference found, discard key
            return
          }
          // Store value in our collection
          cache.push(value as object)
        }
        if (key === 'parentNode') return
        return value
      },
      '\t'
    )
  }
}

export default Debug

if (typeof window !== 'undefined') {
  const win = window as Window & { Debug?: typeof Debug }
  !win.Debug && (win.Debug = Debug)
}
