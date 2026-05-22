import { createApp } from 'vue'
import App from '@/components/App.vue'
import store from '@/store'
import lang from '@/lang'
import UniconCompat from '@/components/UniconCompat.vue'
import './Debug'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const monacoEnvironmentTarget = self as unknown as {
	MonacoEnvironment?: {
		getWorker?: (_workerId: string, label: string) => Worker
	}
}

/**
 * 処理名: JSON ワーカー作成
 * 処理概要: Monaco の JSON 系ワーカーインスタンスを生成する
 * 実装理由: JSON 言語の補完・検証を UI スレッド外で実行するため
 * @returns {Worker} JSON ワーカー
 */
function createJsonWorker() {
	return new jsonWorker()
}

/**
 * 処理名: CSS ワーカー作成
 * 処理概要: Monaco の CSS 系ワーカーインスタンスを生成する
 * 実装理由: CSS/SCSS/LESS の解析処理を UI スレッド外で実行するため
 * @returns {Worker} CSS ワーカー
 */
function createCssWorker() {
	return new cssWorker()
}

/**
 * 処理名: HTML ワーカー作成
 * 処理概要: Monaco の HTML 系ワーカーインスタンスを生成する
 * 実装理由: HTML/Handlebars/Razor の解析処理を UI スレッド外で実行するため
 * @returns {Worker} HTML ワーカー
 */
function createHtmlWorker() {
	return new htmlWorker()
}

/**
 * 処理名: TypeScript ワーカー作成
 * 処理概要: Monaco の TypeScript 系ワーカーインスタンスを生成する
 * 実装理由: TypeScript/JavaScript の言語サービスを UI スレッド外で実行するため
 * @returns {Worker} TypeScript ワーカー
 */
function createTypeScriptWorker() {
	return new tsWorker()
}

/**
 * 処理名: デフォルトワーカー作成
 * 処理概要: Monaco の基本エディタワーカーインスタンスを生成する
 * 実装理由: 言語固有ワーカーがない場合でもエディタ機能を有効にするため
 * @returns {Worker} デフォルトエディタワーカー
 */
function createDefaultWorker() {
	return new editorWorker()
}

/**
 * 処理名: Monaco ワーカー選択
 * 処理概要: 言語ラベルに応じたワーカーインスタンスを生成する
 * 実装理由: MonacoEnvironment.getWorker から最適なワーカーを返すため
 * @param {string} label - Monaco の言語ラベル
 * @returns {Worker} 対応するワーカー
 */
function createWorkerByLabel(label: string) {
	switch (label) {
	case 'json':
		return createJsonWorker()
	case 'css':
	case 'scss':
	case 'less':
		return createCssWorker()
	case 'html':
	case 'handlebars':
	case 'razor':
		return createHtmlWorker()
	case 'typescript':
	case 'javascript':
		return createTypeScriptWorker()
	default:
		return createDefaultWorker()
	}
}

monacoEnvironmentTarget.MonacoEnvironment = {
	/**
	 * 処理名: Monaco ワーカー取得
	 * 処理概要: Monaco から要求されたラベルに対応するワーカーを返す
	 * 実装理由: Chrome 拡張環境で Worker 初期化警告を回避するため
	 * @param {string} _workerId - Monaco 管理用のワーカー識別子（未使用）
	 * @param {string} label - Monaco の言語ラベル
	 * @returns {Worker} 対応するワーカー
	 */
	getWorker(_workerId, label) {
		return createWorkerByLabel(label)
	}
}

const app = createApp(App)

app.use(store)
app.use(lang)
app.component('UniconIcon', UniconCompat)

app.mount('#app')

// テストから確実にアクセスできるようにグローバルに公開 (E2E 用フック)
// @ts-ignore
if (typeof window !== 'undefined') {
	// @ts-ignore
	window.__APP__ = app
	// @ts-ignore
	window.__STORE__ = store
}

store.dispatch('init')
