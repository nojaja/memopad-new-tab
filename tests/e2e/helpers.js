// @ts-check
const path = require('path');
const { chromium } = require('@playwright/test');

/** デフォルトのタイムアウト値 */
const DEFAULT_TIMEOUT = 30000;

/** テスト用のブラウザ設定 */
const BROWSER_OPTIONS = {
  headless: false,
  args: ['--allow-file-access-from-files', '--disable-web-security']
};

/** 起動とページ取得 */
async function setupTest() {
  const browser = await chromium.launch(BROWSER_OPTIONS);
  const context = await browser.newContext();
  const page = await context.newPage();

  // 簡易的なChrome APIモック
  await page.addInitScript(() => {
    // @ts-ignore
    window.chrome = {
      storage: {
        sync: {
          get: (key) => Promise.resolve({}),
          set: () => Promise.resolve()
        }
      }
    };
  });

  // コンソール監視
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') console.error('[ページエラー]', text);
    else if (type === 'warning') console.warn('[警告]', text);
    else console.log('[ページ]', text);
  });

  page.on('pageerror', err => console.error('[pageerror]', err.message));
  return { context, browser, page };
}

/** エディタ初期化の待機 */
async function waitForEditor(page) {
  const timeout = DEFAULT_TIMEOUT;
  try {
    await page.waitForSelector('#app', { state: 'visible', timeout });
    await page.waitForSelector('.editor', { state: 'visible', timeout });
    await page.waitForSelector('.monaco-editor', { state: 'visible', timeout });
    await page.waitForFunction(() => {
      try {
        const editor = document.querySelector('.monaco-editor');
        return !!(editor && editor.querySelector('.view-lines'));
      } catch (e) {
        return false;
      }
    }, { timeout });
  } catch (e) {
    console.error('エディタ初期化エラー:', e.message || e);
    throw e;
  }
}

/** エディタにテキストを設定する */
async function typeInEditor(page, text) {
  try {
    await waitForEditor(page);
    const result = await page.evaluate((content) => {
      try {
        // @ts-ignore - prefer global test hook if available
        const globalStore = (typeof window !== 'undefined' && window.__STORE__) ? window.__STORE__ : null;
        if (globalStore && typeof globalStore.dispatch === 'function') {
          try { globalStore.dispatch('update', content); } catch (e) { /* ignore */ }
          try {
            const fc = globalStore.state && globalStore.state.fileContainer
            const filename = (globalStore.getters && globalStore.getters.currentFile && globalStore.getters.currentFile.filename) || ''
            if (fc && filename && typeof fc.getFile === 'function') {
              const file = fc.getFile(filename)
              if (file && typeof file.setContent === 'function') {
                file.setContent(content)
                if (typeof fc.putFile === 'function') fc.putFile(file)
                if (typeof globalStore.commit === 'function') globalStore.commit('saveProject')
              }
            }
          } catch (e) { /* ignore */ }
        }
        const editorComponent = document.querySelector('.editor');
        // @ts-ignore
        const vueInstance = editorComponent?.__vue__;
        // @ts-ignore
        const editor = vueInstance?.$refs?.codeEditor?.getMonaco?.();
        if (editor && typeof editor.setValue === 'function') {
          editor.setValue(content);
        }
        if (vueInstance && typeof vueInstance.$emit === 'function') {
          vueInstance.$emit('update:source', content);
        }
        // 最終手段: ルートの store を直接 dispatch して確実に source を更新
        try {
          const root = document.querySelector('#app')?.__vue__;
          if (root && root.$store && typeof root.$store.dispatch === 'function') {
            root.$store.dispatch('update', content);
          }
          // さらに直接 fileContainer を書き換えて saveProject することで、アプリ側が確実に読み直すようにする
          if (root && root.$store && root.$store.state && root.$store.state.fileContainer) {
            const fc = root.$store.state.fileContainer;
            const filename = root.$store.getters?.currentFile?.filename || '';
            if (filename && typeof fc.getFile === 'function') {
              const file = fc.getFile(filename);
              if (file && typeof file.setContent === 'function') {
                file.setContent(content);
                if (typeof fc.putFile === 'function') fc.putFile(file);
                if (typeof root.$store.commit === 'function') root.$store.commit('saveProject');
              }
            }
          }
        } catch (e) {
          // ignore
        }
        if (editor && typeof editor.getValue === 'function') {
          return editor.getValue() === content;
        }
        const ta = document.querySelector('.editor textarea');
        if (ta) { ta.value = content; return true; }
        return false;
      } catch (e) {
        return false;
      }
    }, text);
    if (!result) throw new Error('テキスト設定に失敗しました');
  } catch (e) {
    console.error('typeInEditorエラー:', e);
    throw e;
  }
}

/** エディタのコンテンツを取得する */
async function getEditorContent(page) {
  try {
    await waitForEditor(page);
    const content = await page.evaluate(() => {
      try {
        const editorComponent = document.querySelector('.editor');
        // @ts-ignore
        const vueInstance = editorComponent?.__vue__;
        // @ts-ignore
        const editor = vueInstance?.$refs?.codeEditor?.getMonaco?.();
        if (editor && typeof editor.getValue === 'function') return editor.getValue();
        try {
          const root = document.querySelector('#app')?.__vue__;
          if (root && root.$store && root.$store.getters && typeof root.$store.getters.source !== 'undefined') {
            return root.$store.getters.source || '';
          }
        } catch (e) {
          // ignore
        }
        const ta = document.querySelector('.editor textarea');
        if (ta) return ta.value || ta.textContent || '';
        const viewLines = Array.from(document.querySelectorAll('.monaco-editor .view-line'));
        if (viewLines.length) return viewLines.map(el => el.textContent || '').join('\n');
        return '';
      } catch (e) {
        return '';
      }
    });
    return content || '';
  } catch (e) {
    console.error('getEditorContentエラー:', e);
    return '';
  }
}

/** クリーンアップ */
async function cleanup(browser) {
  try { await browser.close(); } catch (e) { /* ignore */ }
}

module.exports = {
  setupTest,
  waitForEditor,
  typeInEditor,
  getEditorContent,
  cleanup,
  DEFAULT_TIMEOUT,
  BROWSER_OPTIONS
};
