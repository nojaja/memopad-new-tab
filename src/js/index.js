import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'
// import marked from 'marked';
import md from 'markdown-it'
import emoji from 'markdown-it-emoji'
import * as monaco from 'monaco-editor'

import FileData from './model/FileData.js'
import FileContainer from './model/FileContainer.js'

import Debug from './Debug.js'
require('webpack-jquery-ui')
var css = require('webpack-jquery-ui/css') // ommit, if you don't want to load basic css theme

var editor = null
var currentFile = null
var currentModelId = 'source'

// loads the Icon plugin
UIkit.use(Icons)

var fileContainer = new FileContainer()

var noteKeyList = []

// URLパラメータ取得（未使用
const arg = new Object()
const pair = location.search.substring(1).split('&')
for (const i = 0; pair[i]; i++) {
  const kv = pair[i].split('=')
  arg[kv[0]] = kv[1]
}

// Model///////////////////////////////////////////////////

// ファイル一覧の読み込み処理
function loadNoteKeyList () {
  // ページが読み込まれたら、ローカルストレージから状態を読み込む
  const name = 'noteKeyList'
  noteKeyList = []
  if (localStorage.getItem(name)) {
    noteKeyList = JSON.parse(localStorage.getItem(name))
  }
  console.log('loadNoteKeyList:' + noteKeyList)
  return noteKeyList
}

// ファイル一覧の保存処理
function saveNoteKeyList (noteName) {
  // ページが読み込まれたら、ローカルストレージから状態を読み込む
  const name = 'noteKeyList'
  noteKeyList.push(noteName)
  localStorage.setItem(name, JSON.stringify(noteKeyList))
}

// ファイル一覧の削除処理
function deleteNoteKeyList (noteName) {
  noteKeyList = noteKeyList.filter((v) => v !== noteName)// リストから対象を消して新しいリストにする
  const name = 'noteKeyList'
  localStorage.setItem(name, JSON.stringify(noteKeyList))
}

// プロジェクトの新規作成処理
function newProject () {
  const noteId = Date.now() + Math.floor(1e4 + 9e4 * Math.random())
  const noteName = 'note_' + noteId
  const today = new Date()
  const content = '' + today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + '\n'

  fileContainer.init()
  const file = new FileData()
  file.setFilename('index.md')
  file.setContent(content)
  fileContainer.putFile(file)
  console.log('fileContainer:' + fileContainer.getContainerJson())
  fileContainer.setProjectName(noteName)

  saveNoteKeyList(noteName)// ファイル一覧の保存
  saveProject()// プロジェクトの保存

  console.log('noteKeyList:' + noteKeyList)
}

// プロジェクトの読み込み処理
function loadProject (noteName) {
  console.log('loadProject:' + noteName)
  if (localStorage.getItem(noteName)) {
    fileContainer.setContainerJson(localStorage.getItem(noteName))
    console.log('fileContainer:' + fileContainer.getContainerJson())
  } else { // 存在しない場合は新規作成する
    newProject()
  }
  fileOpen(fileContainer.getFiles()[0])// プロジェクト内のファイルを開く

  const label = fileContainer.getFile(fileContainer.getFiles()[0]).getContent().split('\n')[0] || fileContainer.getProjectName()
  console.log(label)
  $('#filelist').children('li').removeClass('uk-active')
  $('#filelist').find('[data-name=' + fileContainer.getProjectName() + ']').addClass('uk-active')

  return fileContainer.getContainerJson()
}

// プロジェクトの保存処理
function saveProject (cb) {
  // ローカルストレージに最新の状態を保存
  localStorage.setItem(fileContainer.getProjectName(), fileContainer.getContainerJson())
  console.log(fileContainer.getProjectName() + ':' + fileContainer.getContainerJson())
  // refreshFileList();
  return cb ? cb() : true
}

// プロジェクト内のFileを開く
function fileOpen (filename) {
  currentFile = fileContainer.getFile(filename)
  currentModelId = 'source'
  const source = currentFile.getContent()
  const data = currentFile.getEditorData()

  for (var key in data) {
    if (key == currentModelId) {
      editor.setModel(data[currentModelId].model)
      editor.restoreViewState(data[currentModelId].state)
      editor.focus()
    }
  };
  compile()
}

// View///////////////////////////////////////////////////

// １つ目のファイルを開く
function openFirst () {
  loadProject(noteKeyList[0])
  // $("#filelist").children("li").removeClass("uk-active");
  // $("#filelist li:first").addClass("uk-active");
}

// 初回の読み込み
function initLoad (cb) {
  UIkit.notification('load..', { status: 'success', timeout: 1000 })
  $('#filelist').html('<li><div uk-spinner></div></li>')
  // iframeの初期化
  refreshView('')
  noteKeyList = loadNoteKeyList()// ファイル一覧の読み込み処理
  refreshFileList()
  openFirst()
  return cb ? cb(noteKeyList) : true
}

// File一覧の更新
function refreshFileList () {
  $('#filelist').empty()

  const file = $('<li data-url=""><a class="file"> <i class="filename"></i></a></li>')
  file.on('click', function (event) {
    saveProject(function () {
      loadProject($(event.currentTarget).attr('data-uri'))
    })
    // $("#filelist").children("li").removeClass("uk-active");
    // $(event.target.parentElement).addClass("uk-active");
  })

  console.log('noteKeyList' + noteKeyList)
  noteKeyList.forEach(function (val, i) {
    console.log(i, val)
    const tmpfileContainer = new FileContainer()
    tmpfileContainer.setContainerJson(localStorage.getItem(val))

    const label = tmpfileContainer.getFile(tmpfileContainer.getFiles()[0]).getContent().split('\n')[0] || val
    console.log(label)

    const _file = file.clone(true)
    // _file.find('.fileSelect').attr('data-uri', val);
    _file.attr('data-uri', val)
    _file.find('.filename').text(' ' + label)
    $('#filelist').append(_file)
  })
}

// iframe内のコンテンツを更新
function refreshView (content) {
  // iframe内のコンテンツを更新
  $('#child-frame').attr('srcdoc', content)
}

// sourceのcompile
function compile () {
//    const parseData = marked(currentFile.getEditorData().source.model.getValue().trim());
  const parseData = md({
    linkify: true,
    typography: true
  })
    .use(emoji)
    .render(currentFile.getEditorData().source.model.getValue().trim())
  const htmlheader = `
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link href="./css/github-markdown-css.css" rel="stylesheet"></link>
</head>
<body>
`
  const htmlfooter = `
</body>
</html>
`

  refreshView(htmlheader + parseData + htmlfooter)
}

// View///////////////////////////////////////////////////
$(function () {
  // エディタ初期化
  const editorContainer = document.getElementById('container')
  editor = monaco.editor.create(editorContainer, {
    automaticLayout: true,
    model: null
  })
  fileContainer.setMonaco(monaco)
  initLoad(function () {
    // compile();
  })

  $('.resizer').on('resize', function (event) {
    editor.layout()
  })

  // 名前変更処理
  $('#fileRename').on('click', function (event) {
    $('#filelist').find('.uk-active').each(function () {
      const filename = $(this).attr('data-uri')
      UIkit.modal.prompt('<p>Rename File Name</p>').then(function (newName) {
        console.log('newName ' + newName)

        fileContainer.renameFile(filename, newName)
        refreshFileList()
      }, function () {
        console.log('Rejected.')
      })
    })
  })

  // 削除処理
  $('#fileDelete').on('click', function (event) {
    $('#filelist').find('.uk-active').each(function () {
      const filename = $(this).attr('data-uri')
      UIkit.modal.confirm('<p>Are you sure to delete this note? (' + filename + ') </p>').then(function () {
        console.log('filename ' + filename)
        // fileContainer.removeFile(filename);
        deleteNoteKeyList(filename)
        refreshFileList()
      }, function () {
        console.log('Rejected.')
      })
    })
  })

  // 新規ファイル作成処理
  $('#newfile').on('click', function (event) {
    newProject()
    refreshFileList()// ファイルリストの更新
  })

  var savetimer = false
  var previewtimer = false
  // 操作の検知
  $('#container').bind('blur keydown keyup keypress change', function () {
    if (currentFile) {
      const currentState = editor.saveViewState()
      const currentModel = editor.getModel()
      const data = currentFile.getEditorData()
      data[currentModelId].state = currentState
      currentFile.setEditorData(data)
      fileContainer.putFile(currentFile)// ファイルをコンテナに反映
    }
  })

  // 変更の検知
  $('#container').bind('keyup change', function () {
    if (currentFile) {
      if (previewtimer != false) clearTimeout(previewtimer)
      previewtimer = setTimeout(function () {
        // ここに遅延実行する処理の内容
        compile()
        previewtimer = false
      }, 500)

      if (savetimer != false) clearTimeout(savetimer)
      savetimer = setTimeout(function () {
        // ここに遅延実行する処理の内容
        saveProject()
        UIkit.notification('save..', { status: 'success', timeout: 1000 })
        savetimer = false
      }, 5000)
    }
  })
  $('.resizer').resizable()

  // ショートカットキー操作
  $(window).keydown(function (e) {
    if (e.keyCode === 120) { // F9
      compile()
      return false
    }
    if (e.ctrlKey) {
      if (e.keyCode === 83) { // Ctrl+S
        saveProject()
        UIkit.notification('save..', { status: 'success', timeout: 1000 })
        return false
      }
    }
  })
})
