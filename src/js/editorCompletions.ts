import * as monaco from 'monaco-editor'

let registered = false

/**
 * Monaco エディタに Markdown / PlantUML の補完候補を登録する。
 * 複数回呼ばれても一度だけ登録する。
 */
export function registerCompletions(): void {
  if (registered) return
  registered = true

  monaco.languages.registerCompletionItemProvider('markdown', {
    triggerCharacters: [],
    /**
     * 処理名: 補完候補提供
     * 処理概要: カーソル位置に応じた補完候補リストを返す
     * 実装理由: Markdown/PlantUML の文脈に応じた候補を提供するため
     * @param {monaco.editor.ITextModel} model - Monaco テキストモデル
     * @param {monaco.Position} position - 現在カーソル位置
     * @returns {monaco.languages.CompletionList} 補完候補リスト
     */
    provideCompletionItems(
      model: monaco.editor.ITextModel,
      position: monaco.Position
    ): monaco.languages.CompletionList {
      const wordInfo = model.getWordUntilPosition(position)
      const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordInfo.startColumn,
        endColumn: position.column
      }

      if (isInsideMermaidBlock(model, position)) {
        return { suggestions: getMermaidSuggestions(range) }
      }
      if (isInsidePlantUMLBlock(model, position)) {
        return { suggestions: getPlantUMLSuggestions(range) }
      } else {
        return { suggestions: getMarkdownSuggestions(range) }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

/**
 * 処理名: PlantUML ブロック内判定
 * 処理概要: カーソル位置がコードブロック内の PlantUML セクションにあるか判定する
 * 実装理由: コンテキストに応じた補完候補を提供するため
 * @param {monaco.editor.ITextModel} model - Monaco テキストモデル
 * @param {monaco.Position} position - 現在のカーソル位置
 * @returns {boolean} PlantUML ブロック内なら true
 */
function isInsidePlantUMLBlock(
  model: monaco.editor.ITextModel,
  position: monaco.Position
): boolean {
  const textBeforeCursor = model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  })
  const lastOpen = textBeforeCursor.lastIndexOf('```plantuml')
  if (lastOpen === -1) return false
  const afterOpen = textBeforeCursor.substring(lastOpen + '```plantuml'.length)
  return !afterOpen.includes('```')
}

/**
 * 処理名: Mermaidブロック内判定
 * 処理概要: カーソル位置がMermaidコードブロック内かどうかを判定する
 * 実装理由: Mermaid専用補完候補を提供する範囲を正確に特定するため
 * @param {monaco.editor.ITextModel} model - エディタのテキストモデル
 * @param {monaco.Position} position - 現在のカーソル位置
 * @returns {boolean} Mermaidブロック内であればtrue
 */
function isInsideMermaidBlock(
  model: monaco.editor.ITextModel,
  position: monaco.Position
): boolean {
  const textBeforeCursor = model.getValueInRange({
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  })
  const lastOpen = textBeforeCursor.lastIndexOf('```mermaid')
  if (lastOpen === -1) return false
  const afterOpen = textBeforeCursor.substring(lastOpen + '```mermaid'.length)
  return !afterOpen.includes('```')
}

const mermaidDiagramTemplates = [
  {
    label: 'graph TD',
    detail: 'フローチャート',
    insertText: [
      'graph TD',
      '  A[Start] --> B[Process]',
      '  B --> C{Decision}',
      '  C -->|Yes| D[End]',
      '  C -->|No| E[Back]'
    ].join('\n')
  },
  {
    label: 'sequenceDiagram',
    detail: 'シーケンス図',
    insertText: [
      'sequenceDiagram',
      '  participant Alice',
      '  participant Bob',
      '  Alice->>Bob: Hello',
      '  Bob-->>Alice: Hi'
    ].join('\n')
  },
  {
    label: 'stateDiagram-v2',
    detail: '状態図',
    insertText: [
      'stateDiagram-v2',
      '  [*] --> State1',
      '  State1 --> [*]'
    ].join('\n')
  },
  {
    label: 'gantt',
    detail: 'ガントチャート',
    insertText: [
      'gantt',
      'dateFormat  YYYY-MM-DD',
      'title Project schedule',
      'section Sprint 1',
      '  Design           :done,    des1, 2024-01-01,2024-01-05',
      '  Development      :active,  des2, 2024-01-06, 5d',
      'section Sprint 2',
      '  Testing          :         des3, after des2, 3d'
    ].join('\n')
  },
  {
    label: 'classDiagram',
    detail: 'クラス図',
    insertText: [
      'classDiagram',
      '  Class01 <|-- Class02 : Inheritance',
      '  Class01 : +int id',
      '  Class01 : +String name()',
      '  Class02 : +String description'
    ].join('\n')
  },
  {
    label: 'gitGraph',
    detail: 'Git グラフ',
    insertText: [
      'gitGraph',
      '  commit',
      '  branch develop',
      '  commit',
      '  checkout main',
      '  commit'
    ].join('\n')
  },
  {
    label: 'erDiagram',
    detail: 'ER 図',
    insertText: [
      'erDiagram',
      '  CUSTOMER ||--o{ ORDER : places',
      '  ORDER ||--|{ LINE-ITEM : contains',
      '  CUSTOMER }|..|{ DELIVERY-ADDRESS : uses'
    ].join('\n')
  },
  {
    label: 'journey',
    detail: 'ユーザージャーニー図',
    insertText: [
      'journey',
      '  title My working day',
      '  section Go to work',
      '    Make tea: 5: Me',
      '    Go upstairs: 3: Me',
      '    Do work: 1: Me, Cat',
      '  section Go home',
      '    Go downstairs: 5: Me',
      '    Sit down: 5: Me'
    ].join('\n')
  },
  {
    label: 'quadrantChart',
    detail: 'クアドラントチャート',
    insertText: [
      'quadrantChart',
      '  title Reach and engagement of campaigns',
      '  x-axis Low Reach --> High Reach',
      '  y-axis Low Engagement --> High Engagement',
      '  quadrant-1 We should expand',
      '  quadrant-2 Need to promote',
      '  quadrant-3 Re-evaluate',
      '  quadrant-4 May be improved',
      '  Campaign A: [0.3, 0.6]',
      '  Campaign B: [0.45, 0.23]'
    ].join('\n')
  },
  {
    label: 'xychart-beta',
    detail: 'XY チャート',
    insertText: [
      'xychart-beta',
      '  title "Sales Revenue"',
      '  x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]',
      '  y-axis "Revenue (in $)" 4000 --> 11000',
      '  bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]',
      '  line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]'
    ].join('\n')
  },
  {
    label: 'pie',
    detail: '円グラフ',
    insertText: [
      'pie',
      '  title Pets adopted by volunteers',
      '  "Dogs" : 20',
      '  "Cats" : 15',
      '  "Rabbits" : 10'
    ].join('\n')
  },
  {
    label: 'requirementDiagram',
    detail: '要求図',
    insertText: [
      'requirementDiagram',
      '  requirement R1 {',
      '    id: 1',
      '    text: "User can log in"',
      '  }',
      '  functionalRequirement FR1 {',
      '    id: 2',
      '    text: "System validates credentials"',
      '  }',
      '  R1 - traces -> FR1'
    ].join('\n')
  },
  {
    label: 'mindmap',
    detail: 'マインドマップ',
    insertText: [
      'mindmap',
      '  root((Mindmap))',
      '    Origins',
      '      Long history',
      '      Another branch',
      '    Research',
      '      ML',
      '      UX'
    ].join('\n')
  },
  {
    label: 'timeline',
    detail: 'タイムライン',
    insertText: [
      'timeline',
      '  title Project roadmap',
      '  2024-01-01 : Kickoff',
      '  2024-03-01 : First milestone',
      '  2024-06-01 : Release'
    ].join('\n')
  },
  {
    label: 'sankey',
    detail: 'サンキーチャート',
    insertText: [
      'sankey-beta',
      '',
      'A,B,5',
      'B,C,3',
      'A,C,2'
    ].join('\n')
  },
  {
    label: 'C4Context',
    detail: 'C4 コンテキスト図',
    insertText: [
      'C4Context',
      '  title System Context diagram for Internet Banking',
      '  Enterprise_Boundary(b1, "Bank") {',
      '    Person(customer, "Customer")',
      '    System(internet_banking, "Internet Banking System")',
      '  }'
    ].join('\n')
  }
]

/**
 * 処理名: Mermaidコードブロック整形
 * 処理概要: テキストをMermaidコードブロック形式のMarkdown文字列に変換する
 * 実装理由: 補完挿入時に正しいfenced code block形式を生成するため
 * @param {string} text - Mermaid図定義テキスト
 * @returns {string} Mermaidコードブロック形式のMarkdown文字列
 */
function formatMermaidCodeBlock(text: string): string {
  return ['```mermaid', text, '```'].join('\n')
}

/**
 * 処理名: MarkdownMermaidテンプレート補完候補取得
 * 処理概要: Markdownブロック用のMermaid図テンプレート補完候補一覧を返す
 * 実装理由: Markdownコンテキストでのコードブロック補完候補をMonacoに提供するため
 * @param {monaco.IRange} range - 補完を挿入する範囲
 * @returns {monaco.languages.CompletionItem[]} Mermaidテンプレート補完候補配列
 */
function getMarkdownMermaidTemplates(
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  const S = monaco.languages.CompletionItemKind.Snippet
  const InsertAsSnippet =
    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet

  return mermaidDiagramTemplates.map((template) => ({
    label: `mermaid: ${template.label}`,
    kind: S,
    detail: `Mermaid コードブロック (${template.detail})`,
    documentation: {
      value: formatMermaidCodeBlock(template.insertText)
    },
    insertText: formatMermaidCodeBlock(template.insertText),
    insertTextRules: InsertAsSnippet,
    range
  }))
}

// ---------------------------------------------------------------------------
// Markdown 補完候補
// ---------------------------------------------------------------------------

/**
 * 処理名: Markdown 補完候補取得
 * 処理概要: Markdown 構文の補完候補スニペットの配列を返す
 * 実装理由: Monaco エディタの Markdown 補完機能に候補を提供するため
 * @param {monaco.IRange} range - 補完を挿入する範囲
 * @returns {monaco.languages.CompletionItem[]} Markdown 補完候補の配列
 */
function getMarkdownSuggestions(
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  const S = monaco.languages.CompletionItemKind.Snippet
  const InsertAsSnippet =
    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet

  return [
    // --- 見出し ---
    {
      label: '# h1',
      kind: S,
      detail: '見出し 1',
      insertText: '# ${1:見出し}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '## h2',
      kind: S,
      detail: '見出し 2',
      insertText: '## ${1:見出し}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '### h3',
      kind: S,
      detail: '見出し 3',
      insertText: '### ${1:見出し}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '#### h4',
      kind: S,
      detail: '見出し 4',
      insertText: '#### ${1:見出し}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '##### h5',
      kind: S,
      detail: '見出し 5',
      insertText: '##### ${1:見出し}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '###### h6',
      kind: S,
      detail: '見出し 6',
      insertText: '###### ${1:見出し}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // --- テキスト装飾 ---
    {
      label: '**bold**',
      kind: S,
      detail: '太字',
      insertText: '**${1:テキスト}**',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '*italic*',
      kind: S,
      detail: '斜体',
      insertText: '*${1:テキスト}*',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '***bold italic***',
      kind: S,
      detail: '太字斜体',
      insertText: '***${1:テキスト}***',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '~~strikethrough~~',
      kind: S,
      detail: '取り消し線',
      insertText: '~~${1:テキスト}~~',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '`code`',
      kind: S,
      detail: 'インラインコード',
      insertText: '`${1:コード}`',
      insertTextRules: InsertAsSnippet,
      range
    },

    // --- リンク / 画像 ---
    {
      label: '[link](url)',
      kind: S,
      detail: 'リンク',
      insertText: '[${1:テキスト}](${2:url})',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '![image](url)',
      kind: S,
      detail: '画像',
      insertText: '![${1:alt}](${2:url})',
      insertTextRules: InsertAsSnippet,
      range
    },

    // --- リスト ---
    {
      label: '- list',
      kind: S,
      detail: '箇条書きリスト',
      insertText: '- ${1:項目}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '1. list',
      kind: S,
      detail: '番号付きリスト',
      insertText: '1. ${1:項目}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '- [ ] task',
      kind: S,
      detail: 'タスクリスト (未完)',
      insertText: '- [ ] ${1:タスク}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '- [x] task done',
      kind: S,
      detail: 'タスクリスト (完了)',
      insertText: '- [x] ${1:タスク}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // --- 引用 ---
    {
      label: '> blockquote',
      kind: S,
      detail: '引用',
      insertText: '> ${1:引用テキスト}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // --- コードブロック ---
    {
      label: '```code block```',
      kind: S,
      detail: 'コードブロック',
      insertText: '```${1:言語}\n${2:コード}\n```',
      insertTextRules: InsertAsSnippet,
      range
    },
    ...getMarkdownMermaidTemplates(range),

    // --- 水平線 ---
    {
      label: '---',
      kind: S,
      detail: '水平線',
      insertText: '---',
      range
    },

    // --- テーブル ---
    {
      label: '| table |',
      kind: S,
      detail: 'テーブル (3 列)',
      insertText:
        '| ${1:列1} | ${2:列2} | ${3:列3} |\n|---|---|---|\n| ${4:} | ${5:} | ${6:} |',
      insertTextRules: InsertAsSnippet,
      range
    },

    // --- PlantUML ブロック テンプレート ---
    {
      label: 'plantuml: sequence',
      kind: S,
      detail: 'PlantUML シーケンス図',
      documentation: {
        value:
          '```plantuml\n@startuml\nparticipant Actor1\nparticipant Actor2\nActor1 -> Actor2: メッセージ\n@enduml\n```'
      },
      insertText: [
        '@startuml',
        'participant ${1:Actor1}',
        'participant ${2:Actor2}',
        '',
        '${1:Actor1} -> ${2:Actor2}: ${3:メッセージ}',
        '${2:Actor2} --> ${1:Actor1}: ${4:レスポンス}',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: class',
      kind: S,
      detail: 'PlantUML クラス図',
      insertText: [
        '@startuml',
        'class ${1:ClassName} {',
        '  +${2:field}: ${3:Type}',
        '  +${4:method}(): ${5:ReturnType}',
        '}',
        '',
        'class ${6:OtherClass}',
        '${1:ClassName} --> ${6:OtherClass}',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: activity',
      kind: S,
      detail: 'PlantUML アクティビティ図',
      insertText: [
        '@startuml',
        'start',
        '',
        ':${1:処理1};',
        '',
        'if (${2:条件}?) then (yes)',
        '  :${3:処理2};',
        'else (no)',
        '  :${4:処理3};',
        'endif',
        '',
        'stop',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: usecase',
      kind: S,
      detail: 'PlantUML ユースケース図',
      insertText: [
        '@startuml',
        'actor ${1:Actor}',
        '',
        'rectangle ${2:System} {',
        '  usecase "${3:ユースケース1}" as UC1',
        '  usecase "${4:ユースケース2}" as UC2',
        '}',
        '',
        '${1:Actor} --> UC1',
        '${1:Actor} --> UC2',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: component',
      kind: S,
      detail: 'PlantUML コンポーネント図',
      insertText: [
        '@startuml',
        'component ${1:Component1}',
        'component ${2:Component2}',
        '',
        '${1:Component1} --> ${2:Component2}: ${3:uses}',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: state',
      kind: S,
      detail: 'PlantUML 状態遷移図',
      insertText: [
        '@startuml',
        '[*] --> ${1:State1}',
        '',
        '${1:State1} --> ${2:State2}: ${3:イベント}',
        '${2:State2} --> [*]',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: ER',
      kind: S,
      detail: 'PlantUML ER図',
      insertText: [
        '@startuml',
        'entity "${1:Entity1}" as e1 {',
        '  * ${2:id}: INT <<PK>>',
        '  --',
        '  ${3:name}: VARCHAR',
        '}',
        '',
        'entity "${4:Entity2}" as e2 {',
        '  * ${5:id}: INT <<PK>>',
        '  --',
        '  ${6:field}: VARCHAR',
        '}',
        '',
        'e1 ||--o{ e2 : ""',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'plantuml: mindmap',
      kind: S,
      detail: 'PlantUML マインドマップ',
      insertText: [
        '@startmindmap',
        '* ${1:中心}',
        '** ${2:トピック1}',
        '*** ${3:サブトピック}',
        '** ${4:トピック2}',
        '@endmindmap'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    }
  ]
}

/**
 * 処理名: Mermaid補完候補取得
 * 処理概要: Mermaidブロック内向けの図テンプレート補完候補一覧を返す
 * 実装理由: Mermaidブロック内でのスニペット補完をMonacoエディタに提供するため
 * @param {monaco.IRange} range - 補完を挿入する範囲
 * @returns {monaco.languages.CompletionItem[]} Mermaid補完候補配列
 */
function getMermaidSuggestions(
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  const S = monaco.languages.CompletionItemKind.Snippet
  const InsertAsSnippet =
    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet

  return mermaidDiagramTemplates.map((template) => ({
    label: template.label,
    kind: S,
    detail: `Mermaid ${template.detail}`,
    insertText: template.insertText,
    insertTextRules: InsertAsSnippet,
    range
  }))
}

// ---------------------------------------------------------------------------
// PlantUML ブロック内 補完候補
// ---------------------------------------------------------------------------

/**
 * 処理名: PlantUML 補完候補取得
 * 処理概要: PlantUML 構文の補完候補スニペットの配列を返す
 * 実装理由: Monaco エディタの PlantUML ブロック内補完機能に候補を提供するため
 * @param {monaco.IRange} range - 補完を挿入する範囲
 * @returns {monaco.languages.CompletionItem[]} PlantUML 補完候補の配列
 */
function getPlantUMLSuggestions(
  range: monaco.IRange
): monaco.languages.CompletionItem[] {
  const S = monaco.languages.CompletionItemKind.Snippet
  const K = monaco.languages.CompletionItemKind.Keyword
  const InsertAsSnippet =
    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet

  return [
    // ---- 共通 ----
    { label: '@startuml', kind: K, detail: '開始タグ', insertText: '@startuml', range },
    { label: '@enduml', kind: K, detail: '終了タグ', insertText: '@enduml', range },
    {
      label: 'title',
      kind: S,
      detail: 'タイトル',
      insertText: 'title ${1:タイトル}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'autonumber',
      kind: K,
      detail: '自動番号付け',
      insertText: 'autonumber',
      range
    },
    {
      label: 'skinparam',
      kind: S,
      detail: 'スタイル設定',
      insertText: 'skinparam ${1:パラメータ} ${2:値}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // ---- シーケンス図 ----
    {
      label: 'participant',
      kind: S,
      detail: '参加者',
      insertText: 'participant "${1:名前}" as ${2:alias}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'actor',
      kind: S,
      detail: 'アクター',
      insertText: 'actor "${1:名前}" as ${2:alias}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '-> (sync)',
      kind: S,
      detail: '同期メッセージ',
      insertText: '${1:A} -> ${2:B}: ${3:メッセージ}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '--> (async)',
      kind: S,
      detail: '非同期/戻りメッセージ',
      insertText: '${1:A} --> ${2:B}: ${3:メッセージ}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: '->> (non-blocking)',
      kind: S,
      detail: 'ノンブロッキングメッセージ',
      insertText: '${1:A} ->> ${2:B}: ${3:メッセージ}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'note right',
      kind: S,
      detail: '右側ノート',
      insertText: 'note right of ${1:参加者}\n  ${2:ノート内容}\nend note',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'note left',
      kind: S,
      detail: '左側ノート',
      insertText: 'note left of ${1:参加者}\n  ${2:ノート内容}\nend note',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'note over',
      kind: S,
      detail: '上部ノート',
      insertText: 'note over ${1:参加者}\n  ${2:ノート内容}\nend note',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'loop',
      kind: S,
      detail: 'ループ',
      insertText: 'loop ${1:条件}\n  ${2:処理}\nend',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'alt/else',
      kind: S,
      detail: '条件分岐',
      insertText:
        'alt ${1:条件1}\n  ${2:処理1}\nelse ${3:条件2}\n  ${4:処理2}\nend',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'opt',
      kind: S,
      detail: 'オプション',
      insertText: 'opt ${1:条件}\n  ${2:処理}\nend',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'group',
      kind: S,
      detail: 'グループ',
      insertText: 'group ${1:グループ名}\n  ${2:処理}\nend',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'activate',
      kind: S,
      detail: 'アクティベーション開始',
      insertText: 'activate ${1:参加者}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'deactivate',
      kind: S,
      detail: 'アクティベーション終了',
      insertText: 'deactivate ${1:参加者}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // ---- クラス図 ----
    {
      label: 'class',
      kind: S,
      detail: 'クラス定義',
      insertText:
        'class ${1:ClassName} {\n  +${2:field}: ${3:Type}\n  +${4:method}(): ${5:ReturnType}\n}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'interface',
      kind: S,
      detail: 'インターフェース',
      insertText: 'interface ${1:InterfaceName} {\n  +${2:method}(): ${3:ReturnType}\n}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'abstract class',
      kind: S,
      detail: '抽象クラス',
      insertText:
        'abstract class ${1:AbstractClass} {\n  +${2:method}(): ${3:ReturnType}\n}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'enum',
      kind: S,
      detail: '列挙型',
      insertText: 'enum ${1:EnumName} {\n  ${2:VALUE1}\n  ${3:VALUE2}\n}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'package',
      kind: S,
      detail: 'パッケージ',
      insertText: 'package "${1:パッケージ名}" {\n  ${2:}\n}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'namespace',
      kind: S,
      detail: '名前空間',
      insertText: 'namespace ${1:名前空間} {\n  ${2:}\n}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'extends (--|>)',
      kind: S,
      detail: '継承',
      insertText: '${1:Child} --|> ${2:Parent}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'implements (..|>)',
      kind: S,
      detail: 'インターフェース実装',
      insertText: '${1:Class} ..|> ${2:Interface}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'association (-->)',
      kind: S,
      detail: '関連',
      insertText: '${1:A} --> ${2:B}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'aggregation (o--)',
      kind: S,
      detail: '集約',
      insertText: '${1:Whole} o-- ${2:Part}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'composition (*--)',
      kind: S,
      detail: 'コンポジション',
      insertText: '${1:Whole} *-- ${2:Part}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // ---- アクティビティ図 ----
    { label: 'start', kind: K, detail: '開始', insertText: 'start', range },
    { label: 'stop', kind: K, detail: '停止', insertText: 'stop', range },
    { label: 'end', kind: K, detail: '終了', insertText: 'end', range },
    {
      label: ':action;',
      kind: S,
      detail: 'アクション',
      insertText: ':${1:アクション};',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'if/else (activity)',
      kind: S,
      detail: '条件分岐 (アクティビティ)',
      insertText:
        'if (${1:条件}?) then (yes)\n  :${2:処理1};\nelse (no)\n  :${3:処理2};\nendif',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'while (activity)',
      kind: S,
      detail: 'ループ (アクティビティ)',
      insertText:
        'while (${1:条件}?) is (yes)\n  :${2:処理};\nendwhile (no)',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'fork',
      kind: S,
      detail: '並行処理',
      insertText:
        'fork\n  :${1:処理1};\nfork again\n  :${2:処理2};\nend fork',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'partition',
      kind: S,
      detail: 'パーティション (スイムレーン)',
      insertText: 'partition ${1:パーティション名} {\n  :${2:処理};\n}',
      insertTextRules: InsertAsSnippet,
      range
    },

    // ---- 状態図 ----
    { label: '[*]', kind: K, detail: '初期/終了状態', insertText: '[*]', range },
    {
      label: 'state',
      kind: S,
      detail: '状態定義',
      insertText: 'state "${1:状態名}" as ${2:alias}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'state transition',
      kind: S,
      detail: '状態遷移',
      insertText: '${1:State1} --> ${2:State2}: ${3:イベント}',
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'state note',
      kind: S,
      detail: '状態ノート',
      insertText: 'note on link\n  ${1:ノート内容}\nend note',
      insertTextRules: InsertAsSnippet,
      range
    },

    // ---- テンプレート (ブロック内で使う場合も想定) ----
    {
      label: 'sequence diagram template',
      kind: S,
      detail: 'シーケンス図テンプレート',
      insertText: [
        '@startuml',
        'participant ${1:Actor1}',
        'participant ${2:Actor2}',
        '',
        '${1:Actor1} -> ${2:Actor2}: ${3:メッセージ}',
        '${2:Actor2} --> ${1:Actor1}: ${4:レスポンス}',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'class diagram template',
      kind: S,
      detail: 'クラス図テンプレート',
      insertText: [
        '@startuml',
        'class ${1:ClassName} {',
        '  +${2:field}: ${3:Type}',
        '  +${4:method}(): ${5:ReturnType}',
        '}',
        '',
        'class ${6:OtherClass}',
        '${1:ClassName} --> ${6:OtherClass}',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    },
    {
      label: 'activity diagram template',
      kind: S,
      detail: 'アクティビティ図テンプレート',
      insertText: [
        '@startuml',
        'start',
        '',
        ':${1:処理1};',
        '',
        'if (${2:条件}?) then (yes)',
        '  :${3:処理2};',
        'else (no)',
        '  :${4:処理3};',
        'endif',
        '',
        'stop',
        '@enduml'
      ].join('\n'),
      insertTextRules: InsertAsSnippet,
      range
    }
  ]
}
