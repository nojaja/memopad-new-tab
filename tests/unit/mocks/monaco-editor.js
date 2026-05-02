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
  KeyMod: { CtrlCmd: 0 },
  KeyCode: { KeyS: 0 }
}
