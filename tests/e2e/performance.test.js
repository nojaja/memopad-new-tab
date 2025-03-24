const { test, expect } = require('@playwright/test');
const {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup,
  DEFAULT_TIMEOUT
} = require('./helpers');

test.describe('パフォーマンステスト', () => {
  let browser, context, page;

  test.beforeEach(async () => {
    const setup = await setupTest();
    browser = setup.browser;
    context = setup.context;
    page = setup.page;
  });

  test.afterEach(async () => {
    await cleanup(browser);
  });

  test('エディタの初期化が3秒以内に完了する', async () => {
    // パフォーマンスメトリクスの記録を開始
    await page.evaluate(() => {
      window.performanceMarks = {};
      window.performanceMarks.start = performance.now();
    });

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);

    // 初期化完了時間を記録
    const initializationTime = await page.evaluate(() => {
      window.performanceMarks.end = performance.now();
      return window.performanceMarks.end - window.performanceMarks.start;
    });

    console.log(`エディタ初期化時間: ${initializationTime}ms`);
    expect(initializationTime).toBeLessThan(3000); // 3秒以内
  });

  test('大きなテキストの編集がレスポンシブに動作する', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);

    // 1000行のテキストを生成
    const largeText = Array(1000).fill('これはテストのための長い行です。').join('\n');

    // 入力開始時間を記録
    const inputStartTime = await page.evaluate(() => {
      window.performanceMarks = {};
      window.performanceMarks.inputStart = performance.now();
      return window.performanceMarks.inputStart;
    });

    await typeInEditor(page, largeText);

    // 入力完了時間を記録
    const inputEndTime = await page.evaluate(() => {
      window.performanceMarks.inputEnd = performance.now();
      return window.performanceMarks.inputEnd;
    });

    const inputDuration = inputEndTime - inputStartTime;
    console.log(`大きなテキスト入力時間: ${inputDuration}ms`);

    // 各行の入力に平均100ms以下であることを確認
    const averageTimePerLine = inputDuration / 1000;
    expect(averageTimePerLine).toBeLessThan(100);
  });

  test('プレビューの生成が1秒以内に完了する', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);

    // 複雑なMarkdownを生成
    const complexMarkdown = Array(100)
      .fill('# 見出し\n\n- リストアイテム\n\n```js\nconsole.log("コード");\n```\n\n> 引用文\n')
      .join('\n');

    await typeInEditor(page, complexMarkdown);

    // プレビュー生成時間の計測開始
    const startTime = await page.evaluate(() => {
      window.performanceMarks = {};
      window.performanceMarks.previewStart = performance.now();
      return window.performanceMarks.previewStart;
    });

    // プレビューボタンをクリック
    const previewButton = await page.locator('button[title="プレビュー"]').first();
    await previewButton.click();

    // プレビューが表示されるまで待機
    const preview = await page.locator('.markdown-body');
    await expect(preview).toBeVisible();

    // プレビュー生成完了時間を記録
    const previewTime = await page.evaluate(() => {
      window.performanceMarks.previewEnd = performance.now();
      return window.performanceMarks.previewEnd - window.performanceMarks.previewStart;
    });

    console.log(`プレビュー生成時間: ${previewTime}ms`);
    expect(previewTime).toBeLessThan(1000); // 1秒以内
  });
});
