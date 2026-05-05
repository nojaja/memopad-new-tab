/**
 * editorCompletions.ts のユニットテスト
 * Monaco エディタのモックを使用して補完登録をテストする
 */

const monaco = require('monaco-editor')

describe('editorCompletions', () => {
  let registerCompletions

  beforeAll(() => {
    // モジュールを一度だけロード
    const mod = require('@/editorCompletions')
    registerCompletions = mod.registerCompletions
  })

  test('registerCompletions が言語プロバイダを登録する', () => {
    registerCompletions()
    expect(monaco.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      'markdown',
      expect.objectContaining({
        triggerCharacters: expect.arrayContaining(['#', '*', '`']),
        provideCompletionItems: expect.any(Function)
      })
    )
  })

  test('registerCompletions を複数回呼んでも1回しか登録されない', () => {
    const callsBefore = monaco.languages.registerCompletionItemProvider.mock.calls.length
    registerCompletions()
    registerCompletions()
    // 追加で呼んでも calls 数は増えない
    expect(monaco.languages.registerCompletionItemProvider.mock.calls.length).toBe(callsBefore)
  })

  test('provideCompletionItems が Markdown 補完候補を返す（PlantUML ブロック外）', () => {
    const calls = monaco.languages.registerCompletionItemProvider.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const provider = calls[0][1]

    const mockModel = {
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 1 })),
      getValueInRange: jest.fn(() => '# 通常テキスト\n'),
      getLineContent: jest.fn(() => '# 通常テキスト')
    }
    const mockPosition = { lineNumber: 2, column: 1 }

    const result = provider.provideCompletionItems(mockModel, mockPosition)
    expect(result).toBeDefined()
    expect(Array.isArray(result.suggestions)).toBe(true)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  test('provideCompletionItems が PlantUML ブロック内で PlantUML 補完候補を返す', () => {
    const calls = monaco.languages.registerCompletionItemProvider.mock.calls
    const provider = calls[0][1]

    const mockModel = {
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 1 })),
      getValueInRange: jest.fn(() => '```plantuml\n@startuml\n'),
      getLineContent: jest.fn(() => '@startuml')
    }
    const mockPosition = { lineNumber: 2, column: 1 }

    const result = provider.provideCompletionItems(mockModel, mockPosition)
    expect(result).toBeDefined()
    expect(Array.isArray(result.suggestions)).toBe(true)
    expect(result.suggestions.length).toBeGreaterThan(0)
    const labels = result.suggestions.map(s => s.label)
    expect(labels.some(l => l.includes('@startuml') || l.includes('actor') || l.includes('participant'))).toBe(true)
  })

  test('PlantUML ブロックが閉じられた後は Markdown 補完になる', () => {
    const calls = monaco.languages.registerCompletionItemProvider.mock.calls
    const provider = calls[0][1]

    const mockModel = {
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 1 })),
      getValueInRange: jest.fn(() => '```plantuml\n@startuml\n@enduml\n```\n'),
      getLineContent: jest.fn(() => '')
    }
    const mockPosition = { lineNumber: 5, column: 1 }

    const result = provider.provideCompletionItems(mockModel, mockPosition)
    expect(result).toBeDefined()
    expect(Array.isArray(result.suggestions)).toBe(true)
    const labels = result.suggestions.map(s => s.label)
    expect(labels.some(l => l.includes('#') || l.includes('**'))).toBe(true)
  })

  test('provideCompletionItems が Mermaid ブロック外で Mermaid 補完候補を返す', () => {
    const calls = monaco.languages.registerCompletionItemProvider.mock.calls
    const provider = calls[0][1]

    const mockModel = {
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 1 })),
      getValueInRange: jest.fn(() => '# 通常テキスト\n'),
      getLineContent: jest.fn(() => '# 通常テキスト')
    }
    const mockPosition = { lineNumber: 2, column: 1 }

    const result = provider.provideCompletionItems(mockModel, mockPosition)
    const labels = result.suggestions.map(s => s.label)
    expect(labels.some(l => l.toLowerCase().includes('mermaid'))).toBe(true)
    expect(labels).toEqual(expect.arrayContaining(['mermaid: graph TD', 'mermaid: gantt', 'mermaid: classDiagram']))
  })

  test('provideCompletionItems が Mermaid ブロック内で Mermaid 補完候補を返す', () => {
    const calls = monaco.languages.registerCompletionItemProvider.mock.calls
    const provider = calls[0][1]

    const mockModel = {
      getWordUntilPosition: jest.fn(() => ({ startColumn: 1, endColumn: 1 })),
      getValueInRange: jest.fn(() => '```mermaid\ngraph TD\n'),
      getLineContent: jest.fn(() => 'graph TD')
    }
    const mockPosition = { lineNumber: 2, column: 1 }

    const result = provider.provideCompletionItems(mockModel, mockPosition)
    expect(result).toBeDefined()
    expect(Array.isArray(result.suggestions)).toBe(true)
    const labels = result.suggestions.map(s => s.label)
    expect(labels).toEqual(
      expect.arrayContaining([
        'graph TD',
        'sequenceDiagram',
        'stateDiagram-v2',
        'gantt',
        'classDiagram',
        'gitGraph',
        'erDiagram',
        'journey'
      ])
    )
  })
})
