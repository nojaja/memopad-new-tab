const { test, expect } = require('@playwright/test');
const {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup
} = require('./helpers');

/**
 * コンソールログのハンドリングを設定する
 * @param {any} page
 */
async function setupConsoleHandler(page) {
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();
    
    // JSのコンパイルエラーや実行時エラーを検出
    if (type === 'error') {
      console.error(`🚨 [テストエラー] ${text}`);
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '<JSONValue取得不可>')));
      console.error('詳細:', args);
    } else if (type === 'warning') {
      console.warn(`⚠️ [警告] ${text}`);
    }
  });

  // JavaScriptのエラーをキャッチ
  page.on('pageerror', error => {
    console.error('🔥 [ページエラー]', error.message);
    console.error('スタックトレース:', error.stack);
  });
}

test.describe('メモ帳機能のテスト', () => {
  // 各テストで使用する変数
  let browser, context, page;

  test.beforeEach(async () => {
    // テストごとに新しいブラウザインスタンスをセットアップ
    const setup = await setupTest();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;

    // コンソールハンドラーを設定
    await setupConsoleHandler(page);
  });

  test.afterEach(async () => {
    // テスト終了後のクリーンアップ
    await cleanup(browser);
  });

  test('エディタの基本機能', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // メインエディタが表示されていることを確認
    const editor = await page.locator('.monaco-editor[data-uri]').first();
    await expect(editor).toBeVisible();
    
    // エディタの主要コンポーネントが表示されていることを確認
    const viewLines = await page.locator('.monaco-editor[data-uri] .view-lines').first();
    const scrollbar = await page.locator('.monaco-editor[data-uri] .scrollbar').first();
    await expect(viewLines).toBeVisible();
    await expect(scrollbar).toBeVisible();
  });

  test('メモの保存と読み込み', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // テストデータの入力と保存
    const testMemo = '# テストメモ\nこれはテストメモです。\n\n## 機能テスト\n- 保存のテスト\n- 読み込みのテスト';
    await typeInEditor(page, testMemo);
    
    // 自動保存を待機
    await page.waitForTimeout(2000);
    
    // ページをリロードして保存内容を確認
    await page.reload({ waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // エディタの安定化を待機
    await page.waitForTimeout(2000);
    const content = await getEditorContent(page);
    expect(content).toContain('# テストメモ');
    expect(content).toContain('これはテストメモです。');
    expect(content).toContain('## 機能テスト');
    expect(content).toContain('保存のテスト');
    expect(content).toContain('読み込みのテスト');
  });

  test('長文入力と保存', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // 長文のテストデータ
    const longText = Array(5).fill('これは長文テストのためのダミーテキストです。\n').join('');
    await typeInEditor(page, longText);
    
    // 自動保存を待機
    await page.waitForTimeout(2000);
    
    // ページをリロード
    await page.reload({ waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // エディタの安定化を待機
    await page.waitForTimeout(2000);
    
    const content = await getEditorContent(page);
    expect(content).toContain('これは長文テストのためのダミーテキストです。');
    expect(content.split('\n').length).toBeGreaterThanOrEqual(5);
  });
});
