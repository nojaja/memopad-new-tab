// @ts-check
const { chromium } = require('@playwright/test');
const { BROWSER_OPTIONS, DEFAULT_TIMEOUT } = require('./helpers');

/**
 * 開発サーバーの状態を確認する
 * @param {any} page
 * @returns {Promise<void>}
 */
async function checkDevServer(page) {
  try {
    console.log('開発サーバーの状態を確認中...');
    
    await page.goto('http://localhost:3001', {
      timeout: DEFAULT_TIMEOUT,
      waitUntil: 'networkidle'
    });
    
    // 基本的なDOM構造の確認
    await page.waitForSelector('#app', {
      state: 'visible',
      timeout: DEFAULT_TIMEOUT
    });

    // Chrome APIのモックを設定
    await page.addInitScript(() => {
      window.chrome = {
        storage: {
          sync: {
            get: (key) => Promise.resolve({ [key]: [] }),
            set: () => Promise.resolve()
          }
        }
      };
    });


    // Monaco EditorのDOM要素が存在するかだけを確認（window.monacoの厳格なチェックは外す）
    const editorLoaded = await page.evaluate(() => {
      return document.querySelector('.monaco-editor') !== null;
    });

    if (!editorLoaded) {
      throw new Error('Monaco EditorのDOMが見つかりません。エディタの初期化に問題がある可能性があります。');
    }

    console.log('開発サーバーは正常に動作しています');
  } catch (error) {
    console.error('開発サーバーの確認中にエラーが発生しました:');
    console.error(`- ${error.message}`);
    console.error('以下の手順を試してください:');
    console.error('1. npm run serve が実行されていることを確認');
    console.error('2. ポート3001が利用可能であることを確認');
    console.error('3. Vite開発サーバーが正常に動作していることを確認');
    throw error;
  }
}

/**
 * グローバルセットアップ
 * テスト実行前の共通設定を行う
 */
async function globalSetup() {
  try {
    console.log('テスト環境のセットアップを開始します...');
    
    const browser = await chromium.launch(BROWSER_OPTIONS);
    const page = await browser.newPage();
    
    await checkDevServer(page);
    await browser.close();
    
    console.log('テスト環境の準備が完了しました。');
  } catch (error) {
    console.error('テスト環境のセットアップに失敗しました:', error);
    process.exit(1);
  }
}

module.exports = globalSetup;
