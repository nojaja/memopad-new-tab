// @ts-check
const path = require('path');
const { chromium } = require('@playwright/test');

/**
 * デフォルトのタイムアウト値
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * テスト用のブラウザ設定
 */
const BROWSER_OPTIONS = {
  headless: false,
  args: [
    '--allow-file-access-from-files',
    '--disable-web-security'
  ]
};

/**
 * テストのセットアップを行う
 * @returns {Promise<{context: any, browser: any, page: any}>}
 */
async function setupTest() {
  const browser = await chromium.launch(BROWSER_OPTIONS);
  const context = await browser.newContext();
  const page = await context.newPage();

  // Chrome APIのモックを設定
  await page.addInitScript(() => {
    // @ts-ignore
    window.chrome = {
      storage: {
        sync: {
          get: (key) => {
            const mockData = {
              notes: [],
              settings: {
                theme: 'light',
                fontSize: 16,
                autoSave: true,
                markdownOptions: {}
              }
            };
            return Promise.resolve({ [key]: mockData[key] });
          },
          set: () => Promise.resolve()
        }
      }
    };
  });

  // コンソールメッセージのハンドリングを設定
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    // エラーレベルに応じた処理
    switch(type) {
      case 'error':
        console.error(`🚨 [ページエラー] ${text}`);
        if (location.url) {
          console.error(`場所: ${location.url}:${location.lineNumber}`);
        }
        // 引数の詳細を表示（エラーオブジェクトの場合）
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => '<JSONValue取得不可>')));
        console.error('詳細:', args);
        break;
      case 'warning':
        console.warn(`⚠️ [警告] ${text}`);
        if (location.url) {
          console.warn(`場所: ${location.url}:${location.lineNumber}`);
        }
        break;
      default:
        if (type === 'debug' || type === 'info') {
          console.log(`ℹ️ [${type}] ${text}`);
        } else {
          console.log(`[${type}] ${text}`);
        }
    }
  });

  // ページエラーイベントをキャッチ
  page.on('pageerror', error => {
    console.error('🔥 [ページエラー]', error.message);
    console.error('スタックトレース:', error.stack);
  });

  // JSエラーをキャッチ
  page.on('crash', () => {
    console.error('💥 ページがクラッシュしました');
  });

  return { context, browser, page };
}

/**
 * エディタが利用可能になるまで待機する
 * @param {any} page
 * @returns {Promise<void>}
 */
async function waitForEditor(page) {
  const timeout = DEFAULT_TIMEOUT;
  
  try {
    // コンテナの存在確認
    await page.waitForSelector('#app', {
      state: 'visible',
      timeout: timeout
    });

    console.log('アプリケーションコンテナを確認しました。');

    // エディタコンテナの表示待機
    await page.waitForSelector('.editor', { 
      state: 'visible',
      timeout: timeout
    });

    console.log('エディタコンテナを確認しました。');

    // メインのMonacoエディタの表示待機
    await page.waitForSelector('.monaco-editor', { 
      state: 'visible',
      timeout: timeout
    });

    console.log('Monacoエディタを確認しました。');

    // エディタの基本構造を確認
    await Promise.all([
      page.waitForSelector('.monaco-editor .overflow-guard', { state: 'visible', timeout }),
      page.waitForSelector('.monaco-editor .view-lines', { state: 'visible', timeout }),
      page.waitForSelector('.monaco-editor .view-line', { state: 'visible', timeout })
    ]);

    console.log('エディタの基本構造を確認しました。');

    // Monaco Editorの初期化完了を待機
    await page.waitForFunction(() => {
      try {
        const editor = document.querySelector('.monaco-editor');
        // @ts-ignore
        // Monaco APIの存在確認
        // @ts-ignore
        if (!window.monaco || !window.monaco.editor) {
          console.log('Monaco APIが読み込まれていません');
          return false;
        }

        // Vueコンポーネントの確認
        const editorComponent = document.querySelector('.editor');
        if (!editorComponent) {
          console.log('エディタコンポーネントが見つかりません');
          return false;
        }

        // MonacoエディタのDOM要素の確認
        const monacoEditor = document.querySelector('.monaco-editor');
        if (!monacoEditor || !monacoEditor.querySelector('.view-lines')) {
          console.log('Monacoエディタの要素が見つかりません');
          return false;
        }

        // エディタのレンディング確認
        const hasContent = monacoEditor.querySelector('.view-line') !== null;
        if (!hasContent) {
          console.log('エディタのコンテンツが読み込まれていません');
          return false;
        }

        return true;
      } catch (e) {
        console.error('エディタの初期化確認中にエラー:', e);
        return false;
      }
    }, { timeout: timeout });

    console.log('エディタの初期化が完了しました。');

  } catch (error) {
    console.error('エディタの初期化中にエラーが発生しました:', error.message);
    throw error;
  }
}

/**
 * エディタにテキストを入力する
 * @param {any} page
 * @param {string} text
 */
async function typeInEditor(page, text) {
  try {
    // エディタの初期化を待機
    await waitForEditor(page);

    // テキスト設定とその確認
    console.log('テキスト設定を開始...');
    const result = await page.evaluate(async (content) => {
      try {
        // @ts-ignore
        const monaco = window.monaco;
        if (!monaco?.editor) {
          console.error('Monaco editorが見つかりません');
          return { success: false, error: 'Monaco APIが見つかりません' };
        }

        // すべての設定方法を試行
        const methods = [
          {
            name: 'モデル経由',
            setter: () => {
              const model = monaco.editor.getModels()[0];
              if (!model) return false;
              model.setValue(content);
              return model.getValue() === content;
            }
          },
          {
            name: 'エディタインスタンス経由',
            setter: () => {
              const editorComponent = document.querySelector('.editor');
              // @ts-ignore
              const vueInstance = editorComponent?.__vue__;
              // @ts-ignore
              const editor = vueInstance?.$refs?.editor?.getMonaco?.();
              if (!editor) return false;
              editor.setValue(content);
              return editor.getValue() === content;
            }
          },
          {
            name: 'DOMイベント経由',
            setter: () => {
              const textarea = /** @type {HTMLTextAreaElement} */ (
                document.querySelector('.monaco-editor textarea.inputarea')
              );
              if (!textarea) return false;
              
              return new Promise((resolve, reject) => {
                let attemptCount = 0;
                const maxAttempts = 3;
                const getBackoffInterval = (attempt) => Math.min(100 * Math.pow(2, attempt), 1000);

                /**
                 * @typedef {Object} EditorState
                 * @property {boolean} hasEditor
                 * @property {boolean} hasModel
                 * @property {number} lineCount
                 * @property {any} viewState
                 * @property {any} selection
                 * @property {boolean} focused
                 * @property {string} [lastError]
                 * @property {number} [timestamp]
                 */

                /**
                 * エディタの現在の状態を収集する
                 * @returns {EditorState}
                 */
                const collectEditorState = () => {
                  const editorComponent = document.querySelector('.editor');
                  // @ts-ignore
                  const vueInstance = editorComponent?.__vue__;
                  // @ts-ignore
                  const editor = vueInstance?.$refs?.editor?.getMonaco?.();
                  const now = new Date();
                  return {
                    hasEditor: !!editor,
                    hasModel: !!editor?.getModel(),
                    lineCount: editor?.getModel()?.getLineCount() || 0,
                    viewState: editor?.saveViewState(),
                    selection: editor?.getSelection(),
                    focused: document.activeElement === textarea,
                    timestamp: now.getTime()
                  };
                };

                /**
                 * エディタ状態が有効かチェックする
                 * @param {EditorState} state
                 * @returns {boolean}
                 */
                const isValidEditorState = (state) => {
                  return state.hasEditor && 
                         state.hasModel && 
                         state.lineCount >= 0 && 
                         state.focused;
                };

                const trySetValue = async () => {
                  try {
                    // エディタの状態をチェック
                    const editorComponent = document.querySelector('.editor');
                    // @ts-ignore
                    const vueInstance = editorComponent?.__vue__;
                    // @ts-ignore
                    const editor = vueInstance?.$refs?.editor?.getMonaco?.();
                    if (!editor) {
                      throw new Error('エディタインスタンスが見つかりません');
                    }

                    // 1. フォーカスとクリア処理
                    textarea.focus();
                    textarea.select();
                    
                    // 2. 値を設定
                    //textarea.value = content;　← これだとeditorが値を持ってないため、getContent()で取得できない
                    editor.setValue(content);
                    console.log('テキストを設定:', editor.getValue());
                    
                    // 3. 段階的にイベントを発火
                    const events = [
                      new Event('focus', { bubbles: true }),
                      new InputEvent('beforeinput', {
                        bubbles: true,
                        data: content,
                        inputType: 'insertText'
                      }),
                      new InputEvent('input', {
                        bubbles: true,
                        data: content,
                        inputType: 'insertText'
                      }),
                      new Event('change', { bubbles: true })
                    ];

                    events.forEach(event => textarea.dispatchEvent(event));

                    // 4. 設定を検証
                    // イベントの反映を待機
                    await new Promise(r => setTimeout(r, 100));

                    const editorState = collectEditorState();
                    if (!isValidEditorState(editorState)) {
                      throw new Error(`エディタの状態が不正です: ${JSON.stringify(editorState, null, 2)}`);
                    }

                    const currentValue = editor.getValue();
                    const success = currentValue === content;

                    if (success) {
                      console.log('テキスト設定の検証に成功:', {
                        ...editorState,
                        value: currentValue,
                        expectedValue: content
                      });
                      resolve(true);
                      return;
                    }

                    if (attemptCount < maxAttempts - 1) {
                      const retryState = {
                        ...editorState,
                        currentValue,
                        expectedValue: content,
                        attempt: attemptCount + 1,
                        maxAttempts,
                        nextRetryIn: getBackoffInterval(attemptCount)
                      };
                      console.log('検証失敗 - 再試行:', retryState);
                      attemptCount++;
                      await new Promise(r => setTimeout(r, getBackoffInterval(attemptCount)));
                      await trySetValue();
                    } else {
                      const error = `検証失敗 - 期待値: "${content}", 実際: "${currentValue}"\n状態: ${JSON.stringify(editorState, null, 2)}`;
                      console.error(error);
                      resolve(false);
                    }
                  } catch (e) {
                    console.error(`エラー発生 (${attemptCount + 1}/${maxAttempts}):`, e);
                    try {
                      // エディタの状態を収集
                      const errorState = {
                        ...collectEditorState(),
                        error: e.message,
                        stack: e.stack,
                        attempt: attemptCount + 1,
                        maxAttempts
                      };

                      if (attemptCount < maxAttempts - 1) {
                        console.log('エラー状態:', JSON.stringify(errorState, null, 2));
                        console.log(`再試行 ${errorState.attempt}/${maxAttempts}`);
                        attemptCount++;
                        await new Promise(r => setTimeout(r, getBackoffInterval(attemptCount)));
                        await trySetValue();
                      } else {
                        console.error('最終エラー状態:', JSON.stringify(errorState, null, 2));
                        resolve(false);
                      }
                    } catch (innerError) {
                      console.error('エラー処理中に例外が発生:', innerError);
                      resolve(false);
                    }
                  }
                };

                trySetValue();
              });
            }
          }
        ];

        // 各メソッドを順に試行
        for (const method of methods) {
          try {
            const success = await method.setter();
            if (success) {
              console.log(`${method.name}での設定に成功`);
              return { success: true };
            }
          } catch (e) {
            console.error(`${method.name}での設定に失敗:`, e);
          }
        }

        return { success: false, error: 'すべての設定方法が失敗' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, text);

    if (!result.success) {
      throw new Error(`テキストの設定に失敗: ${result.error || '不明なエラー'}`);
    }

    // 設定後の状態を確認
    const content = await getEditorContent(page);
    if (content !== text) {
      throw new Error(`テキスト設定の検証に失敗: 期待値 "${text}", 実際の値 "${content}"`);
    }

    console.log('テキストの設定と検証が完了しました');
    
  } catch (error) {
    console.error('typeInEditor関数でエラー:', error);
    throw error;
  }
}

/**
 * エディタのテキスト内容を取得する
 * @param {any} page
 * @returns {Promise<string>}
 */
async function getEditorContent(page) {
  try {
    // エディタの初期化を確認
    await waitForEditor(page);

    // エディタの準備が完了するまで待機
    console.log('エディタの準備状態を確認中...');
    await page.waitForFunction(() => {
      try {
        // @ts-ignore
        const monaco = window.monaco;
        if (!monaco?.editor) {
          console.log('Monaco APIが利用できません');
          return false;
        }

        const editorComponent = document.querySelector('.editor');
        // @ts-ignore
        const vueInstance = editorComponent?.__vue__;
        // @ts-ignore
        const editor = vueInstance?.$refs?.editor?.getMonaco?.();
        if (!editor) {
          console.log('エディタインスタンスが見つかりません');
          return false;
        }

        const model = editor.getModel();
        if (!model) {
          console.log('エディタモデルが見つかりません');
          return false;
        }

        // ビューの状態を確認
        const viewLines = document.querySelector('.monaco-editor .view-lines');
        if (!viewLines || !viewLines.children.length) {
          console.log('ビューが正しくレンダリングされていません');
          return false;
        }

        // モデルとビューの同期を確認
        const lineCount = model.getLineCount();
        const viewLineCount = viewLines.children.length;
        if (lineCount === 0 || lineCount !== viewLineCount) {
          console.log(`モデルとビューが同期していません (model: ${lineCount}, view: ${viewLineCount})`);
          return false;
        }

        return true;
      } catch (e) {
        console.error('エディタの準備確認中にエラー:', e);
        return false;
      }
    }, { 
      timeout: DEFAULT_TIMEOUT,
      polling: 100  // より頻繁にチェック
    });
    console.log('エディタの準備が完了しました');

    let content = '';
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // API経由での取得を試行
      content = await page.evaluate(() => {
        /**
         * @typedef {Object} ContentState
         * @property {boolean} hasValue
         * @property {string} value
         * @property {string} source
         * @property {any} editorState
         * @property {string} [error]
         */

        /**
         * エディタの状態とコンテンツを収集
         * @returns {ContentState}
         */
        const getContent = () => {
          try {
            // @ts-ignore
            const monaco = window.monaco;
            const editorComponent = document.querySelector('.editor');
            // @ts-ignore
            const vueInstance = editorComponent?.__vue__;
            // @ts-ignore
            const editor = vueInstance?.$refs?.editor?.getMonaco?.();
            const editorState = {
              hasEditor: !!editor,
              hasModel: !!editor?.getModel(),
              lineCount: editor?.getModel()?.getLineCount() || 0,
              viewState: editor?.saveViewState(),
              timestamp: Date.now()
            };

            if (!editor) {
              return {
                hasValue: false,
                value: '',
                source: 'API',
                editorState,
                error: 'エディタが見つかりません'
              };
            }

            const value = editor.getValue();
            return {
              hasValue: !!value?.trim(),
              value: value?.trim() || '',
              source: 'API',
              editorState
            };
          } catch (e) {
            console.error('API経由の取得に失敗:', e);
            return {
              hasValue: false,
              value: '',
              source: 'API',
              editorState: { error: e.message, timestamp: Date.now() },
              error: e.message
            };
          }
        };

        const result = getContent();
        if (result.hasValue) {
          console.log('コンテンツ取得成功:', result);
        } else {
          console.error('コンテンツ取得失敗:', JSON.stringify(result));
        }
        return result.value;
      });

      if (content) break;

      // 一時的な待機を追加
      await page.waitForTimeout(100);

      // DOM経由での取得を試行
      content = await page.evaluate(() => {
        try {
          /**
           * @typedef {Object} DOMContentResult
           * @property {boolean} success
           * @property {string} value
           * @property {string} source
           * @property {string} [error]
           */

          /**
           * 指定されたセレクタから単一要素のテキストを取得
           * @param {string} selector
           * @returns {DOMContentResult}
           */
          const getTextFromSelector = (selector) => {
            try {
              const element = document.querySelector(selector);
              if (!element) {
                return {
                  success: false,
                  value: '',
                  source: `selector:${selector}`,
                  error: '要素が見つかりません'
                };
              }
              const text = element.textContent?.trim() || '';
              return {
                success: !!text,
                value: text,
                source: `selector:${selector}`
              };
            } catch (e) {
              return {
                success: false,
                value: '',
                source: `selector:${selector}`,
                error: e.message
              };
            }
          };

          /**
           * 指定されたセレクタから複数要素のテキストを取得
           * @param {string} selector
           * @returns {DOMContentResult}
           */
          const getTextFromElements = (selector) => {
            try {
              const elements = Array.from(document.querySelectorAll(selector));
              if (elements.length === 0) {
                return {
                  success: false,
                  value: '',
                  source: `elements:${selector}`,
                  error: '要素が見つかりません'
                };
              }
              const text = elements
                .map(el => el.textContent || '')
                .filter(text => text.trim())
                .join('\n');
              return {
                success: !!text,
                value: text,
                source: `elements:${selector}`
              };
            } catch (e) {
              return {
                success: false,
                value: '',
                source: `elements:${selector}`,
                error: e.message
              };
            }
          };

          // 各取得方法を試行
          const attempts = [
            { name: 'モデルビュー', fn: () => getTextFromElements('.monaco-editor .view-line span[class*="mtk"]') },
            { name: 'テキストエリア', fn: () => getTextFromSelector('.monaco-editor textarea.inputarea') },
            { name: 'コンテナ', fn: () => getTextFromSelector('.monaco-editor .view-lines') },
            { name: 'フォールバック', fn: () => getTextFromElements('.monaco-editor .view-line') }
          ];

          for (const { name, fn } of attempts) {
            const result = fn();
            if (result.success) {
              console.log(`${name}から取得成功:`, result);
              return result.value;
            }
            console.log(`${name}から取得失敗:`, result);
          }

          console.error('全ての取得方法が失敗');
          return '';
        } catch (e) {
          console.error('DOM経由の取得に失敗:', e);
          return '';
        }
      });

      if (content) break;

      // 待機してから再試行
      await page.waitForTimeout(500);
      console.log(`試行 ${attempt + 1}/${maxAttempts} 完了`);
    }

    if (!content) {
      console.error('エディタのコンテンツを取得できませんでした');
    } else {
      console.log('最終的に取得したコンテンツ:', content);
    }

    return content || '';
  } catch (e) {
    console.error('getEditorContent関数でエラー:', e);
    return '';
  }
}

/**
 * テスト環境をクリーンアップする
 * @param {any} browser
 */
async function cleanup(browser) {
  await browser.close();
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
