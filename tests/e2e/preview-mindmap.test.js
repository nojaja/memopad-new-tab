const { test, expect } = require('@playwright/test');
const {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup,
  DEFAULT_TIMEOUT
} = require('./helpers');

const mindmapMarkdown =
  "```mermaid\n" +
  "mindmap\n" +
  "  root((Mindmap))\n" +
  "    Origins\n" +
  "      Long history\n" +
  "      Another branch\n" +
  "    Research\n" +
  "      ML\n" +
  "      UX\n" +
  "```\n";

test.describe('Mermaid mindmap プレビュー表示テスト', () => {
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

  test('エディタ経由でmindmapを入力し、プレビューで正しく表示される', async () => {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await waitForEditor(page);
    await typeInEditor(page, mindmapMarkdown);

    const editorContent = await getEditorContent(page);
    console.log('editor content (debug):', editorContent.slice(0, 300));

    // デバッグ: ルートストアの source を確認
    const storeSource = await page.evaluate(() => {
      try {
        // テスト用フックがあればそれを優先
        // @ts-ignore
        const globalStore = typeof window !== 'undefined' ? window.__STORE__ : undefined;
        if (globalStore && globalStore.getters) return globalStore.getters.source || '';
        const root = document.querySelector('#app')?.__vue__;
        return root?.$store?.getters?.source || '';
      } catch (e) { return ''; }
    });
    console.log('store source (debug):', storeSource.slice(0, 300));
    const containerInfo = await page.evaluate(() => {
      try {
        // @ts-ignore
        const globalStore = typeof window !== 'undefined' ? window.__STORE__ : undefined;
        const store = globalStore || document.querySelector('#app')?.__vue__?.$store;
        if (!store) return null;
        const fc = store.state?.fileContainer;
        const current = store.getters?.currentFile || {};
        const files = (fc && typeof fc.getFiles === 'function') ? fc.getFiles() : null;
        const json = (fc && typeof fc.getContainerJson === 'function') ? fc.getContainerJson() : null;
        return { current, files, json: json ? String(json).slice(0, 500) : null };
      } catch (e) { return null }
    });
    console.log('containerInfo (debug):', containerInfo);

    // プレビューボタンをクリック
    const previewButton = await page.locator('button[title="show preview pane(F10)"]').first();
    await previewButton.click();

    // 少し待って iframe の内容を確認（デバッグ）
    const frame = page.frameLocator('#child-frame');
    const contentHtml = await frame.locator('#content').innerHTML().catch(() => '');
    console.log('iframe content (debug):', contentHtml.slice(0, 1000));

    // Mermaid mindmapが描画されるまで待機（iframe内）
    const mermaidSvg = frame.locator('.mermaid svg').first();
    await expect(mermaidSvg).toBeVisible({ timeout: DEFAULT_TIMEOUT });

    // 成功時のスクリーンショットを保存
    await mermaidSvg.screenshot({ path: 'test-results/success-preview.png' });

    // mindmapノードのテキストが含まれるか検証
    await expect(mermaidSvg).toContainText('Origins');
    await expect(mermaidSvg).toContainText('Research');
    await expect(mermaidSvg).toContainText('Long history');
    await expect(mermaidSvg).toContainText('ML');
  });
});
