const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup,
  DEFAULT_TIMEOUT
} = require('./helpers');

const mermaidCases = [
  {
    title: 'Mermaid sankey-beta のプレビューとスクリーンショット',
    fileName: 'test-results/preview-sankey-beta.png',
    markdown:
      '```mermaid\n' +
      'sankey-beta\n' +
      '\n' +
      'A,B,5\n' +
      'B,C,3\n' +
      'A,C,2\n' +
      '```\n',
    expectedTexts: ['A', 'B', 'C']
  },
  {
    title: 'Mermaid mindmap のプレビューとスクリーンショット',
    fileName: 'test-results/preview-mindmap.png',
    markdown:
      '```mermaid\n' +
      'mindmap\n' +
      '  root((Mindmap))\n' +
      '    Origins\n' +
      '      Long history\n' +
      '      Another branch\n' +
      '    Research\n' +
      '      ML\n' +
      '      UX\n' +
      '```\n',
    expectedTexts: ['Origins', 'Research', 'Long history', 'ML']
  },
  {
    title: 'Mermaid requirementDiagram のプレビューとスクリーンショット',
    fileName: 'test-results/preview-requirementDiagram.png',
    markdown:
      '```mermaid\n' +
      'requirementDiagram\n' +
      '  requirement R1 {\n' +
      '    id: 1\n' +
      '    text: "User can log in"\n' +
      '  }\n' +
      '  functionalRequirement FR1 {\n' +
      '    id: 2\n' +
      '    text: "System validates credentials"\n' +
      '  }\n' +
      '  R1 - traces -> FR1\n' +
      '```\n',
    expectedTexts: ['User can log in', 'System validates credentials']
  }
];

test.describe('Mermaid 各種テンプレート プレビューとスクリーンショット', () => {
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

  for (const item of mermaidCases) {
    test(item.title, async () => {
      await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
      await waitForEditor(page);
      await typeInEditor(page, item.markdown);

      const editorContent = await getEditorContent(page);
      expect(editorContent).toContain(item.markdown.trim().slice(0, 20));

      const previewButton = await page.locator('button[title="show preview pane(F10)"]').first();
      await previewButton.click();

      const frame = page.frameLocator('#child-frame');
      const mermaidSvg = frame.locator('.mermaid svg').first();
      await expect(mermaidSvg).toBeVisible({ timeout: DEFAULT_TIMEOUT });

      const dir = path.dirname(item.fileName);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await mermaidSvg.screenshot({ path: item.fileName });

      for (const expectedText of item.expectedTexts) {
        await expect(mermaidSvg).toContainText(expectedText);
      }
    });
  }
});
