/**
 * Preview.vue プレビュー画面スクロール不可バグの再現テスト
 * 実装理由: buildIframeDocument が body に overflow: hidden を設定しており、
 *           iframe内コンテンツが長い場合でもスクロールできなくなる不具合を検知するため。
 */
const Preview = require('@/components/Preview.vue').default

describe('Preview.vue プレビュースクロール', () => {
  test('buildIframeDocument が body のスクロールを妨げる overflow: hidden を含まない', () => {
    const html = Preview.methods.buildIframeDocument.call({}, '<p>content</p>')

    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/)
    expect(styleMatch).not.toBeNull()
    expect(styleMatch[1]).not.toMatch(/overflow\s*:\s*hidden/)
  })
})
