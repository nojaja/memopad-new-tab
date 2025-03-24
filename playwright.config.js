const { devices } = require('@playwright/test');
const { DEFAULT_TIMEOUT } = require('./tests/e2e/helpers');

/**
 * Playwrightの設定ファイル
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = {
  testDir: './tests/e2e',
  timeout: DEFAULT_TIMEOUT * 6, // テスト全体のタイムアウト
  forbidOnly: !!process.env.CI,
  retries: 3, // リトライ回数を3回に増やす
  workers: 1, // 常に1つずつ実行
  expect: {
    timeout: DEFAULT_TIMEOUT * 3
  },
  
  // レポート設定
  reporter: [
    ['list'],
    ['html', { open: 'never' }], // HTMLレポートを生成
    ['junit', { outputFile: 'test-results/junit.xml' }] // CI用のJUnitレポート
  ],

  use: {
    actionTimeout: DEFAULT_TIMEOUT * 2,
    navigationTimeout: DEFAULT_TIMEOUT * 2,
    
    // トレース設定
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    
    // Chrome拡張機能のテスト設定
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // デバッグ用設定
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Node.js v11.13.0との互換性を考慮したブラウザ設定
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-extensions-except=./dist',
        '--load-extension=./dist',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-file-access-from-files',
        '--disable-dev-shm-usage', // メモリ問題への対応
        '--disable-gpu', // GPUの問題を回避
        '--no-first-run', // 初回実行時の処理をスキップ
        '--window-size=1280,720' // ウィンドウサイズを固定
      ],
      timeout: DEFAULT_TIMEOUT * 4,
      slowMo: process.env.CI ? 0 : 100 // スローモーションを調整
    }
  },

  // プロジェクト設定
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        // Node.js v11.13.0との互換性のための追加設定
        launchOptions: {
          args: ['--no-zygote', '--no-sandbox']
        }
      }
    }
  ],

  // グローバル設定
  globalSetup: require.resolve('./tests/e2e/global-setup.js'),
  globalTimeout: process.env.CI ? DEFAULT_TIMEOUT * 15 : DEFAULT_TIMEOUT * 10
};
