import Vue from 'vue'
import Vuex from 'vuex'

import FileData from '../model/FileData.js'
import FileContainer from '../model/FileContainer.js'
import { debounce } from 'lodash'

import i18n from '../lang'

// import Debug from '../Debug.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    count: 0,
    editor: null,
    currentFile: {},
    currentModelId: 'source',
    fileContainer: new FileContainer(),
    noteKeyList: JSON.parse(localStorage.getItem('noteKeyList')) || []
  },
  getters: { // state の参照
    currentFile (state) {
      return state.currentFile
    },
    source (state) {
      return state.currentFile.file.content
    },
    // File一覧の更新
    refreshFileList (state) {
      // { name: 'いちご', uri: 'note_1583338656491', isActive: true },
      const items = []
      console.log('noteKeyList' + state.noteKeyList)
      state.noteKeyList.forEach(function (val, i) {
        const tmpfileContainer = new FileContainer()
        tmpfileContainer.setContainerJson(localStorage.getItem(val))

        // const label = tmpfileContainer.getFile(tmpfileContainer.getFiles()[0]).getContent().split('\n')[0] || val
        const tmpfile = tmpfileContainer.getFile(tmpfileContainer.getFiles()[0])
        const label = tmpfile.getDescription() || tmpfile.getContent().split('\n')[0] || val
        items.push({ name: label, uri: val, isActive: (state.currentFile.projectName === tmpfileContainer.container.projectName) })
      })
      return items.reverse()
    }
  },
  mutations: { // stateを変更する為の処理(同期処理のみ)
    updateTitle (state, title) {
      state.currentFile.file.description = title
      state.fileContainer.putFile(state.currentFile)
      this.dispatch('saveProject')
    },
    updateContent (state, content) {
      state.currentFile.file.content = content
      state.fileContainer.putFile(state.currentFile)
      this.dispatch('saveProject')
    },
    saveProject (state, cb) {
      console.log('mutations saveProject')
      // state.currentFile をfileContainerに格納
      // ローカルストレージに最新の状態を保存
      localStorage.setItem(state.fileContainer.getProjectName(), state.fileContainer.getContainerJson())
      console.log(state.fileContainer.getProjectName() + ':' + state.fileContainer.getContainerJson())
      // refreshFileList();
      // return cb ? cb() : true
    },
    // プロジェクトの読み込み処理
    loadProject (state, noteName) {
      console.log('loadProject:' + noteName)
      if (localStorage.getItem(noteName)) {
        state.fileContainer.setContainerJson(localStorage.getItem(noteName))
        // console.log('fileContainer:' + state.fileContainer.getContainerJson())
      } else { // 存在しない場合は新規作成する
        this.dispatch('newProject')
      }
      this.dispatch('fileOpen', state.fileContainer.getFiles()[0])// プロジェクト内のファイルを開く
      // this.fileOpen(state.fileContainer.getFiles()[0])// プロジェクト内のファイルを開く

      const label = state.fileContainer.getFile(state.fileContainer.getFiles()[0]).getContent().split('\n')[0] || state.fileContainer.getProjectName()
      console.log(label)
      // return fileContainer.getContainerJson()
    },
    // プロジェクトの新規作成処理
    newProject (state) {
      const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
      const noteName = 'note_' + noteId
      const today = new Date()
      const content = '' + today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + '\n'

      console.log('state.fileContainer:' + state.fileContainer)
      state.fileContainer.init()
      const file = new FileData()
      file.setFilename('index.md')
      file.setContent(content)
      file.setDescription(content)
      state.fileContainer.putFile(file)
      console.log('fileContainer:' + state.fileContainer.getContainerJson())
      state.fileContainer.setProjectName(noteName)

      this.dispatch('saveProject')// プロジェクトの保存
      this.dispatch('saveNoteKeyList', noteName)// ファイル一覧の保存
      console.log('noteKeyList:' + state.noteKeyList)
    },
    // プロジェクト内のFileを開く
    fileOpen (state, filename) {
      state.currentFile = state.fileContainer.getFile(filename)
      state.currentFile.projectName = state.fileContainer.container.projectName
    },
    loadNoteKeyList (state, noteName) { // ページが読み込まれたら、ローカルストレージから状態を読み込む
      const name = 'noteKeyList'
      this.noteKeyList = []
      if (localStorage.getItem(name)) {
        this.noteKeyList = JSON.parse(localStorage.getItem(name))
      }
      console.log('loadNoteKeyList:' + this.noteKeyList)
    },
    saveNoteKeyList (state, noteName) { // ローカルストレージに状態を保存する
      const name = 'noteKeyList'
      state.noteKeyList.push(noteName)
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
    },
    deleteProject (state) {
      const noteName = state.currentFile.projectName
      state.noteKeyList = state.noteKeyList.filter((v) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify(state.noteKeyList))
      this.dispatch('init')
    },
    openFirst (state) {
      if (state.noteKeyList.length === 0) {
        this.dispatch('newProject')
      }
      this.dispatch('loadProject', state.noteKeyList[state.noteKeyList.length - 1])
      console.log(i18n.tc('message.welcome'))
    }
  },
  actions: { // ミューテーションをコミットする関数(外部APIとの連携や非同期処理もここ)
    loadNoteKeyList (context) { // ページが読み込まれたら、ローカルストレージから状態を読み込む
      context.commit('loadNoteKeyList')
    },
    // ファイル一覧の保存処理
    saveNoteKeyList (context, noteName) { // ローカルストレージに状態を保存する
      context.commit('saveNoteKeyList', noteName)
    },
    // ファイル一覧の削除処理
    deleteNoteKeyList (context, noteName) {
      this.noteKeyList = this.noteKeyList.filter((v) => v !== noteName)// リストから対象を消して新しいリストにする
      const name = 'noteKeyList'
      localStorage.setItem(name, JSON.stringify(this.noteKeyList))
    },
    // プロジェクトの読み込み処理
    loadProject (context, noteName) {
      console.log('loadProject : ' + noteName)
      context.commit('loadProject', noteName)
    },
    // プロジェクトの保存処理
    saveProject (context, cb) {
      context.commit('saveProject', cb)
      debounce(function () {
        console.log('saveProject')
      }, 300)
    },
    fileOpen (context, filename) {
      context.commit('fileOpen', filename)
    },
    newProject (context) {
      context.commit('newProject')
    },
    updateTitle (context, title) {
      context.commit('updateTitle', title)
    },
    update (context, content) {
      context.commit('updateContent', content)
    },
    deleteProject (context) {
      context.commit('deleteProject')
    },
    init (context) {
      context.commit('openFirst')
    }
  }
})
