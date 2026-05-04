import Debug from '@/Debug'

describe('Debug', () => {
  let debug

  beforeEach(() => {
    debug = new Debug()
  })

  test('インスタンスが生成できる', () => {
    expect(debug).toBeTruthy()
  })

  test('単純なオブジェクトをJSON文字列化できる', () => {
    const result = debug.stringify({ key: 'value', num: 42 })
    const parsed = JSON.parse(result)
    expect(parsed.key).toBe('value')
    expect(parsed.num).toBe(42)
  })

  test('文字列をJSON文字列化できる', () => {
    const result = debug.stringify('hello')
    expect(result).toBe('"hello"')
  })

  test('数値をJSON文字列化できる', () => {
    const result = debug.stringify(123)
    expect(result).toBe('123')
  })

  test('配列をJSON文字列化できる', () => {
    const result = debug.stringify([1, 2, 3])
    expect(JSON.parse(result)).toEqual([1, 2, 3])
  })

  test('循環参照を含むオブジェクトで例外が発生しない', () => {
    const obj = { a: 1 }
    obj.self = obj
    expect(() => debug.stringify(obj)).not.toThrow()
    const result = debug.stringify(obj)
    expect(typeof result).toBe('string')
  })

  test('parentNode キーが除外される', () => {
    const obj = { name: 'test', parentNode: { id: 'parent' } }
    const result = debug.stringify(obj)
    const parsed = JSON.parse(result)
    expect(parsed.name).toBe('test')
    expect(parsed.parentNode).toBeUndefined()
  })

  test('nullをJSON文字列化できる', () => {
    const result = debug.stringify(null)
    expect(result).toBe('null')
  })

  test('ネストしたオブジェクトをJSON文字列化できる', () => {
    const obj = { a: { b: { c: 'deep' } } }
    const result = debug.stringify(obj)
    const parsed = JSON.parse(result)
    expect(parsed.a.b.c).toBe('deep')
  })
})
