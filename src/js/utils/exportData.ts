/**
 * 処理名: エクスポート用データ作成
 * 処理概要: 保存済みレコードから JSON 文字列とファイル名、実行日時を生成する
 * 実装理由: Settings と sidebar footer で同一フォーマットのエクスポートを再利用するため
 * @param {Record<string, unknown>} records - エクスポート対象のレコード
 * @param {Date} now - エクスポート実行日時
 * @returns {{ formattedJson: string, fileName: string, executedAt: string }} 生成結果
 */
export function createExportData(records: Record<string, unknown>, now: Date) {
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const fileName = `MemoPad_${year}${month}${day}${hour}.json`
  const formattedJson = JSON.stringify(records, null, 2)
  return {
    formattedJson,
    fileName,
    executedAt: now.toISOString()
  }
}

/**
 * 処理名: ファイル保存（レガシー互換）
 * 処理概要: Blob とダウンロードリンクを使って JSON を保存する
 * 実装理由: sidebar footer からも Download コンポーネントなしで同一保存を行うため
 * @param {string} content - 保存するテキスト
 * @param {string} filename - 保存ファイル名
 * @param {string} contentType - MIME タイプ
 */
export function saveAsLegacy(content: string, filename: string, contentType = 'application/json') {
  const blob = new Blob([content], { type: contentType })
  const nav = window.navigator as Navigator & { msSaveBlob?: (data: Blob, name: string) => void }
  if (typeof nav.msSaveBlob === 'function') {
    nav.msSaveBlob(blob, filename)
    return
  }

  const dltag = document.createElement('a')
  document.body.appendChild(dltag)
  dltag.href = window.URL.createObjectURL(blob)
  dltag.setAttribute('download', filename)
  dltag.click()
  dltag.remove()
}
