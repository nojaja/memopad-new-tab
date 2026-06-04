/**
 * デフォルト設定値の定義
 * @module utils/defaultConfig
 * @description エディタとマークダウン設定の共通デフォルト値を提供するモジュール
 */

/**
 * エディタとマークダウンのデフォルト設定値を返す
 * @returns {object} デフォルト設定オブジェクト
 */
export function getDefaultConfig() {
  return {
    editor: {
      automaticLayout: true,
      fontSize: 16,
      fontFamily: '',
      tabSize: 4,
      syncEditorToPreview: false,
      theme: 'vs',
      lineNumbers: 'on',
      insertSpaces: true,
      wrapping: false,
      wrappingColumn: 300,
      autoClosingBrackets: 'always',
      unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
      minimap: { enabled: false }
    },
    markdown: {
      basicOption: {
        html: true,
        breaks: true,
        linkify: true,
        typography: true
      },
      emoji: true,
      ruby: true,
      mermaid: true,
      uml: true,
      multimdTable: true,
      multimdTableOption: {
        multiline: true,
        rowspan: true,
        headerless: true
      },
      multibyteconvert: false,
      multibyteconvertList: []
    }
  }
}
