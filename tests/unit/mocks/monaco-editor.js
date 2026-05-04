// monaco-editor mock for Jest
module.exports = {
  editor: {
    create: jest.fn(() => ({
      dispose: jest.fn(),
      getValue: jest.fn(() => ''),
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      layout: jest.fn(),
      getModel: jest.fn(() => null)
    })),
    createModel: jest.fn(),
    setTheme: jest.fn()
  },
  languages: {
    registerCompletionItemProvider: jest.fn(() => ({ dispose: jest.fn() })),
    CompletionItemKind: {
      Text: 0,
      Method: 1,
      Function: 2,
      Constructor: 3,
      Field: 4,
      Variable: 5,
      Class: 6,
      Interface: 7,
      Module: 8,
      Property: 9,
      Unit: 10,
      Value: 11,
      Enum: 12,
      Keyword: 13,
      Snippet: 14
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4
    }
  },
  Range: jest.fn(),
  KeyMod: { CtrlCmd: 0 },
  KeyCode: { KeyS: 0 }
}
