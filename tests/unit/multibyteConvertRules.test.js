const jmd = require('@/jmd.json')

function applyRules(text, rules) {
  let result = text
  rules.forEach((rule) => {
    result = result.replace(new RegExp(rule[0], 'gm'), rule[1])
  })
  return result
}

describe('multibyte convert rules', () => {
  test('全角スペース付き ・ を Markdown ネストリストへ変換できる', () => {
    const input = ['・アイテム1', '　・サブアイテム1-1', '　・サブアイテム1-2'].join('\n')
    const output = applyRules(input, jmd.RegExpList)

    expect(output).toBe(['- アイテム1', '  - サブアイテム1-1', '  - サブアイテム1-2'].join('\n'))
  })

  test('全角5段インデント付き ・ を変換できる', () => {
    const input = '　　　　　・第5階層'
    const output = applyRules(input, jmd.RegExpList)

    expect(output).toBe('          - 第5階層')
  })

  test('ルール順序を逆転すると期待どおり変換できない', () => {
    const conversionRule = ['^([ 　]*)・', '$1- ']
    const normalizeRule = ['^([ 　]*)　([ 　]*- )', '$1  $2']
    const wrongOrderedRules = [normalizeRule, conversionRule]

    const input = '　・サブアイテム'
    const output = applyRules(input, wrongOrderedRules)

    expect(output).not.toBe('  - サブアイテム')
  })
})
