const { test, expect } = require('@playwright/test');
const {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup,
  DEFAULT_TIMEOUT
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

test.describe('基本機能のテスト', () => {
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

  test('新規タブでメモ帳が表示される', async () => {
    // ページを開く
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // エディタが表示されるまで待機
    await waitForEditor(page);
    
    // メインエディタが表示されていることを確認
    const editor = await page.locator('.monaco-editor[data-uri]').first();
    await expect(editor).toBeVisible();
    
    // エディタが編集可能な状態であることを確認
    const editorContent = await page.locator('.monaco-editor[data-uri] .view-lines').first();
    await expect(editorContent).toBeVisible();
  });

  test('メモの内容が保存される', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // テストデータを入力
    const testMemo = '# テストメモ\nこれはテストメモです。';
    await typeInEditor(page, testMemo);
    
    // 自動保存を待機
    await page.waitForTimeout(2000);
    
    // ページをリロード
    await page.reload({ waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // エディタの安定化を待機
    await page.waitForTimeout(2000);
    
    // 保存された内容を確認
    const content = await getEditorContent(page);
    expect(content).toContain('# テストメモ');
    expect(content).toContain('これはテストメモです。');
  });

  test('Markdownプレビューが正しく表示される', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // テストデータを入力
    const testMarkdown = '# プレビューのテスト\n\n- リスト1\n- リスト2\n\n**太字テスト**';
    await typeInEditor(page, testMarkdown);
    
    // プレビューボタンをクリック
    const previewButton = await page.locator('button[title="プレビュー"]').first();
    await previewButton.click();
    
    // プレビューが表示されるまで待機
    const preview = await page.locator('.markdown-body').first();
    await expect(preview).toBeVisible();
    
    // プレビューの内容を確認
    await expect(preview.locator('h1')).toContainText('プレビューのテスト');
    await expect(preview.locator('ul li')).toHaveCount(2);
    await expect(preview.locator('strong')).toContainText('太字テスト');
  });

  test('新規タブの作成と切り替えが正常に動作する', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    
    // 初期タブの内容を入力
    await typeInEditor(page, '最初のタブの内容');
    
    // 新規タブボタンをクリック
    const newTabButton = await page.locator('button[title="新規タブ"]').first();
    await newTabButton.click();
    
    // 新しいタブが選択されるまで待機
    await waitForEditor(page);
    
    // 新しいタブに内容を入力
    await typeInEditor(page, '新しいタブの内容');
    
    // 2つのタブが存在することを確認
    const tabs = await page.locator('.tab-item');
    await expect(tabs).toHaveCount(2);
    
    // 最初のタブに戻る
    await tabs.first().click();
    await waitForEditor(page);
    
    // 最初のタブの内容を確認
    const content = await getEditorContent(page);
    expect(content).toBe('最初のタブの内容');
  });
});
