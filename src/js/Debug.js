class Debug {
  constructor () {
  }

  // デバッグ用stringify
  stringify (str) {
    var cache = []
    return JSON.stringify(
      str,
      function (key, value) {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return
          }
          // Store value in our collection
          cache.push(value)
        }
        if (key == 'parentNode') return
        return value
      },
      '\t'
    )
  }
}

export default Debug

if (typeof window !== 'undefined') {
  !window.Debug && (window.Debug = Debug)
}
