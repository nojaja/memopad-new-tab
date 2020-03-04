import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import marked from 'marked';
import * as monaco from 'monaco-editor'

var editor = null;
var currentFile = null;
var currentModelId = "source";

import FileData from './model/FileData.js'
import FileContainer from './model/FileContainer.js'

// loads the Icon plugin
UIkit.use(Icons);

  //１つ目のファイルを開く
  function openFirst() {
    fileOpen(fileContainer.getFiles()[0]);
    $("#filelist").children("li").removeClass("uk-active");
    $("#filelist li:first").addClass("uk-active");
  }

  //Fileを開く
  function fileOpen(filename) {
    currentFile = fileContainer.getFile(filename);
    currentModelId = "source";
    var source = currentFile.getContent();
    var data = currentFile.getEditorData();

    for (var key in data) {
      var i = 0;
      if (key == currentModelId) {
        editor.setModel(data[currentModelId].model);
        editor.restoreViewState(data[currentModelId].state);
        editor.focus();
      }
      i++;
    };
    compile();
  }
  // iframe内のコンテンツを更新
  function refreshView(content) {
    // iframe内のコンテンツを更新
    $("#child-frame").attr("srcdoc", content);
  }
  //プロジェクトファイルの読み込み
  function loadProject(cb) {
    UIkit.notification("load..", { status: 'success', timeout: 1000 });
    $("#filelist").html('<li><i class="uk-icon-spinner uk-icon-spin"></i></li>');
    //iframeの初期化
    refreshView("");
    //localから取得
      var doc = localDraft();
      if (doc) {
        fileContainer.setContainerJson(doc);
        fileContainer.setProjectName(doc.projectName || "new project");
        refreshFileList();
        openFirst();
        return cb ? cb(doc) : true;
      }
  }
  //File一覧の更新
  function refreshFileList() {
    $("#title").empty();
    $("#title").text(fileContainer.getProjectName());

    $("#filelist").empty();

    var file = $('<li ><a  class="file" data-url=""><input type="checkbox" class="uk-checkbox fileSelect" > <i uk-icon="file"></i> </a></li>');
    file.on("click", function (event) {
      fileOpen($(event.target).attr("data-uri"));
      $("#filelist").children("li").removeClass("uk-active");
      $(event.target.parentElement).addClass("uk-active");
    });

    fileContainer.getFiles().forEach(function (val, i) {
      console.log(i, val);
      var _file = file.clone(true);
      _file.find('.fileSelect').attr('data-uri', val);
      _file.children('.file').attr('data-uri', val);
      _file.children('.file').append(val);
      $("#filelist").append(_file);
    });
  }

var fileContainer = new FileContainer();
  //保存処理
  function saveDraft(source) {
    // ローカルストレージに最新の状態を保存
    var name = 'draftContainer' + location.pathname.replace(/\//g, '.');
    localStorage.setItem(name, fileContainer.getContainerJson());
    console.log("draftContainer:" + fileContainer.getContainerJson());
    UIkit.notification("save..", { status: 'success', timeout: 1000 });
  }
  //読み込み処理
  function localDraft() {
    // ページが読み込まれたら、ローカルストレージから状態を読み込む
    var name1 = 'draftContainer' + location.pathname.replace(/\//g, '.');

    var name2 = 'draft' + location.pathname.replace(/\//g, '.');

    if (localStorage.getItem(name1)) {
      fileContainer.setContainerJson(localStorage.getItem(name1));
    } else {
      var source = JSON.parse(localStorage.getItem(name2)) || null;
      var file = new FileData();
      file.setFilename("index.md");
      file.setContent(source);
      fileContainer.putFile(file);
    }
    console.log("fileContainer:" + fileContainer.getContainerJson());
    return fileContainer.getContainerJson();
  }

  //URLパラメータ取得（未使用
  var arg = new Object();
  var pair = location.search.substring(1).split('&');
  for (var i = 0; pair[i]; i++) {
    var kv = pair[i].split('=');
    arg[kv[0]] = kv[1];
  }

  //sourceのcompile
  function compile() {
    var parseData = marked(currentFile.getEditorData().source.model.getValue().trim());

    $("#child-frame").attr("srcdoc", parseData);
  }
  //View///////////////////////////////////////////////////
  $(function () {
//エディタ初期化
var editorContainer = document.getElementById("container");
editor = monaco.editor.create(editorContainer, {
  value: 'console.log("Hello, world")',
  language: 'javascript'
});

/*
    editor = monaco.editor.create(editorContainer, {
        automaticLayout: true,
        model: null
      });
*/

      fileContainer.setMonaco(monaco);
      loadProject(function () {
        compile();
      });


    //名前変更処理
    $("#fileRename").on("click", function (event) {
      $('.fileSelect:checkbox:checked').each(function () {
        var filename = $(this).attr("data-uri");
        UIkit.modal.prompt('<p>Rename File Name</p>', filename, function (newName) {
          console.log('newName ' + newName);

          fileContainer.renameFile(filename, newName);
          refreshFileList();
        }, function () {
          console.log('Rejected.');
          return;
        });
      });
    });

    //削除処理
    $("#fileDelete").on("click", function (event) {
      $('.fileSelect:checkbox:checked').each(function () {
        var filename = $(this).attr("data-uri");
        UIkit.modal.confirm('<p>Delete ' + filename + ' File </p>', function () {
          console.log('filename ' + filename);
          fileContainer.removeFile(filename);
          refreshFileList();
        }, function () {
          console.log('Rejected.');
          return;
        });
      });
    });
    //新規ファイル作成処理
    $("#newfile").on("click", function (event) {
      //日付をファイル名にする
      var today = new Date();
      var newFile = ""+today.getFullYear()+"/"+(today.getMonth()+1)+"/"+today.getDate()+" "+today.getHours()+":"+today.getMinutes()+"";
      var content = ""+today.getFullYear()+"/"+(today.getMonth()+1)+"/"+today.getDate()+" "+today.getHours()+":"+today.getMinutes()+"\n";
       //ファイルデータ作成
      var file = new FileData();

       file.setFilename(newFile);
       file.setContent(content);
       fileContainer.putFile(file);
       //ファイルリスト更新
       refreshFileList();
    });

var savetimer = false;
var previewtimer = false;
    //操作の検知
    $('#container').bind('blur keydown keyup keypress change', function () {
      if (currentFile) {
        var currentState = editor.saveViewState();
        var currentModel = editor.getModel();
        var data = currentFile.getEditorData();
        data[currentModelId].state = currentState;
        currentFile.setEditorData(data);
        fileContainer.putFile(currentFile);
      }
    });
    //変更の検知
    $('#container').bind('keyup change', function () {
      if (currentFile) {
        if (previewtimer != false)  clearTimeout(previewtimer);
        previewtimer = setTimeout(function() {
          //ここに遅延実行する処理の内容
          compile();
          previewtimer = false;
        }, 500);

        if (savetimer != false)  clearTimeout(savetimer);
        savetimer = setTimeout(function() {
          //ここに遅延実行する処理の内容
          saveDraft();
          savetimer = false;
        }, 5000);

      }
    });
    //ショートカットキー操作
    $(window).keydown(function (e) {
      if (e.keyCode === 120) {//F9
        compile();
        return false;
      }
      if (e.ctrlKey) {
        if (e.keyCode === 83) {//Ctrl+S
          saveDraft();
          return false;
        }
      }
    });
  });

  //デバッグ用
function stringify(str) {
  var cache = [];
  return JSON.stringify(
    str,
    function(key, value) {
      if (typeof value === "object" && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      if (key == "parentNode") return;
      return value;
    },
    "\t"
  );
}

