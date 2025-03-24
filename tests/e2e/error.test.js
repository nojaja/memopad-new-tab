const { test, expect } = require('@playwright/test');
const {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup,
  DEFAULT_TIMEOUT
} = require('./helpers');

test.describe('エラーケースのテスト', () => {
  let browser, context, page;

  test.beforeEach(async () => {
    const setup = await setupTest();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;

    // コンソールエラーをキャッチ
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🚨 [テストエラー] ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.error('🔥 [ページエラー]', error.message);
    });
  });

  test.afterEach(async () => {
    await cleanup(browser);
  });

  test('大きすぎるファイルの読み込みを適切に処理する', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);

    // 大きなテキストを生成
    const largeText = 'A'.repeat(10 * 1024 * 1024); // 10MB
    
    // エラーダイアログが表示されることを確認
    const errorPromise = page.waitForSelector('.error-dialog', { timeout: 5000 });
    await typeInEditor(page, largeText);
    const errorDialog = await errorPromise;
    
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText('ファイルサイズが大きすぎます');
  });

  test('ストレージ容量不足時の保存エラーを適切に処理する', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);

    // Chrome storage APIをモックしてエラーを発生させる
    await page.evaluate(() => {
      const originalSet = chrome.storage.local.set;
      chrome.storage.local.set = (items, callback) => {
        callback(new Error('QUOTA_BYTES_PER_ITEM exceeded'));
      };
    });

    // テキストを入力して保存を試みる
    await typeInEditor(page, '保存に失敗するテキスト');
    
    // エラーダイアログの表示を確認
    const errorDialog = await page.locator('.error-dialog');
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText('保存できませんでした');
  });

  test('無効なMarkdown構文のプレビュー表示を適切に処理する', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);

    // 不正なMarkdown構文を入力
    const invalidMarkdown = '# Header\n[壊れたリンク](invalid:url)';
    await typeInEditor(page, invalidMarkdown);

    // プレビューボタンをクリック
    const previewButton = await page.locator('button[title="プレビュー"]').first();
    await previewButton.click();

    // プレビューが表示されることを確認
    const preview = await page.locator('.markdown-body');
    await expect(preview).toBeVisible();

    // エラーではなく、テキストとして表示されることを確認
    await expect(preview.locator('a')).toContainText('壊れたリンク');
    await expect(preview.locator('a')).toHaveAttribute('href', 'invalid:url');
  });
});
