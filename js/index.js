(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.FileData = mod.exports;
  }
})(this, function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var FileData = function () {
    function FileData(file, monaco) {
      _classCallCheck(this, FileData);

      if (file instanceof FileData) {
        this.file = file.getFileData;
      } else {
        this.file = {
          "filename": file && file["filename"] ? file["filename"] : "",
          "fileType": file && file["fileType"] ? file["fileType"] : "txt",
          "type": file && file["type"] ? file["type"] : "text/plain",
          "language": file && file["language"] ? file["language"] : "Markdown",
          "size": file && file["size"] ? file["size"] : 0,
          "truncated": file && file["truncated"] ? file["truncated"] : false,
          "content": file && file["content"] ? file["content"] : ""
        };
        this.editorData = {};
        if (file && file["filename"]) this.setFilename(file["filename"]);
        if (monaco) this.editorData.source.model.setValue(this.file["content"]);
        this.monaco = monaco;
      }
    }

    _createClass(FileData, [{
      key: "addEditorData",
      value: function addEditorData(key, caption, type) {
        this.editorData[key] = {
          caption: caption,
          model: monaco ? monaco.editor.createModel("", type) : null,
          state: null,
          decorations: []
        };
      }
    }, {
      key: "setLanguage",
      value: function setLanguage(language) {
        this.file["language"] = language;
      }
    }, {
      key: "getLanguage",
      value: function getLanguage() {
        return this.file["language"];
      }
    }, {
      key: "setFileType",
      value: function setFileType(fileType) {
        this.file["fileType"] = fileType;
      }
    }, {
      key: "getFileType",
      value: function getFileType() {
        return this.file["fileType"];
      }
    }, {
      key: "setType",
      value: function setType(type) {
        this.file["type"] = type;
      }
    }, {
      key: "getType",
      value: function getType() {
        return this.file["type"];
      }
    }, {
      key: "getSize",
      value: function getSize() {
        return this.file["size"];
      }
    }, {
      key: "setContent",
      value: function setContent(content) {
        if (this.monaco) {
          this.editorData.source.model.setValue(content);
        } else {
          this.file["content"] = content;
        }
      }
    }, {
      key: "getContent",
      value: function getContent() {
        return this.monaco ? this.editorData.source.model.getValue() : this.file["content"];
      }
    }, {
      key: "setFilename",
      value: function setFilename(filename) {
        this.file["filename"] = filename;
          this.setType("text/plain");
          this.setLanguage("Markdown");
          this.addEditorData("source", filename, "txt");
          this.addEditorData("html", "result(html)", "html");
        return;
      }
    }, {
      key: "getFilename",
      value: function getFilename() {
        return this.file["filename"];
      }
    }, {
      key: "setEditorData",
      value: function setEditorData(data) {
        this.editorData = data;
        if (monaco) this.file["content"] = this.editorData.source.model.getValue();
      }
    }, {
      key: "getEditorData",
      value: function getEditorData() {
        return this.editorData;
      }
    }, {
      key: "getFileData",
      value: function getFileData() {
        return this.file;
      }
    }, {
      key: "getFileDataJson",
      value: function getFileDataJson() {
        return JSON.stringify(this.getFileData());
      }
    }, {
      key: "remove",
      value: function remove() {
        this.file["content"] = "";
        this.file["truncated"] = true;
      }
    }]);

    return FileData;
  }();

  exports.default = FileData;


  if (typeof window != "undefined") {
    !window.FileData && (window.FileData = FileData);
  }
});
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./FileData.js"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./FileData.js"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.FileData);
    global.FileContainer = mod.exports;
  }
})(this, function (exports, _FileData) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _FileData2 = _interopRequireDefault(_FileData);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var FileContainer = function () {
    function FileContainer(monaco) {
      _classCallCheck(this, FileContainer);

      this.monaco = monaco;
      this.container = {
        id: null,
        files: {},
        "public": true,
        "created_at": "2017-10-29T05:45:01Z",
        "updated_at": "2017-11-14T12:41:14Z",
        "projectName": "",
        "description": ""
      };
      this.fileObjects = {};
    }

    _createClass(FileContainer, [{
      key: "setId",
      value: function setId(id) {
        this.container['id'] = id;
      }
    }, {
      key: "getId",
      value: function getId() {
        return this.container['id'];
      }
    }, {
      key: "setMonaco",
      value: function setMonaco(monaco) {
        this.monaco = monaco;
      }
    }, {
      key: "getMonaco",
      value: function getMonaco() {
        return this.monaco;
      }
    }, {
      key: "setProjectName",
      value: function setProjectName(projectName) {
        this.container['projectName'] = projectName;
      }
    }, {
      key: "getProjectName",
      value: function getProjectName() {
        return this.container['projectName'];
      }
    }, {
      key: "getFiles",
      value: function getFiles() {
        // 配列のキーを取り出す
        var ret = [];
        for (var key in this.container["files"]) {
          if (!this.container["files"][key]["truncated"]) {
            ret.push(key);
          }
        }
        return ret;
      }
    }, {
      key: "getFile",
      value: function getFile(filename) {
        if (filename in this.container["files"]) {
          if (!(filename in this.fileObjects)) {
            this.fileObjects[filename] = new _FileData2.default(this.container["files"][filename], this.monaco);
          }
          return this.fileObjects[filename];
        }
      }
    }, {
      key: "getFileRaw",
      value: function getFileRaw(filename) {
        if (filename in this.container["files"]) {
          return this.container["files"][filename];
        }
      }
    }, {
      key: "putFile",
      value: function putFile(file) {
        var filename = file.getFilename();
        this.container["files"][filename] = file.getFileData();
        return true;
      }
    }, {
      key: "renameFile",
      value: function renameFile(filename, newName) {
        var file = this.getFile(filename);
        file.setFilename(newName);
        this.putFile(file);
        delete this.container["files"][filename];
      }
    }, {
      key: "removeFile",
      value: function removeFile(filename) {
        var file = this.getFile(filename);
        file.remove();
        this.putFile(file);
      }
    }, {
      key: "init",
      value: function init() {
        this.container = {
          id: "",
          files: {},
          "public": true,
          "created_at": "2017-10-29T05:45:01Z",
          "updated_at": "2017-11-14T12:41:14Z",
          "description": ""
        };
        this.fileObjects = {};
      }
    }, {
      key: "setPublic",
      value: function setPublic(bool) {
        this.container["public"] = bool;
      }
    }, {
      key: "getPublic",
      value: function getPublic() {
        return this.container["public"];
      }
    }, {
      key: "setDescription",
      value: function setDescription(description) {
        this.container["description"] = description;
      }
    }, {
      key: "getDescription",
      value: function getDescription() {
        return this.container["description"];
      }
    }, {
      key: "setContainer",
      value: function setContainer(container) {
        this.container = container;
        this.fileObjects = {};
      }
    }, {
      key: "getContainer",
      value: function getContainer() {
        return this.container;
      }
    }, {
      key: "setContainerJson",
      value: function setContainerJson(container) {
        this.setContainer(JSON.parse(container));
        this.fileObjects = {};
      }
    }, {
      key: "getContainerJson",
      value: function getContainerJson() {
        return JSON.stringify(this.getContainer());
      }
    }, {
      key: "getGistData",
      value: function getGistData() {
        var gistdata = {
          "description": this.container["projectName"] + "\n" + this.container["description"],
          "public": this.container["public"],
          "files": this.container["files"]
        };
        return gistdata;
      }
    }, {
      key: "getGistJsonData",
      value: function getGistJsonData() {
        return JSON.stringify(this.getGistData());
      }
    }]);

    return FileContainer;
  }();

  exports.default = FileContainer;

  if (typeof window != "undefined") {
    !window.FileContainer && (window.FileContainer = FileContainer);
  }
});
(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['./model/FileData.js', './model/FileContainer.js'], factory);
  } else if (typeof exports !== "undefined") {
    factory(require('./model/FileData.js'), require('./model/FileContainer.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.FileData, global.FileContainer);
    global.indexBabel = mod.exports;
  }
})(this, function (_FileData, _FileContainer) {
  'use strict';

  var _FileData2 = _interopRequireDefault(_FileData);

  var _FileContainer2 = _interopRequireDefault(_FileContainer);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  //var monaco = null;
  var editor = null;
  var currentFile = null;
  var currentModelId = "source";


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
    $.UIkit.notify("load..", { status: 'success', timeout: 1000 });
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

    var file = $('<li ><a  class="file" data-url=""><input type="checkbox" class="fileSelect" > <i class="uk-icon-file uk-icon-mediu"></i> </a></li>');
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


  var fileContainer = new _FileContainer2.default();
  //保存処理
  function saveDraft(source) {
    // ローカルストレージに最新の状態を保存
    var name = 'draftContainer' + location.pathname.replace(/\//g, '.');
    localStorage.setItem(name, fileContainer.getContainerJson());
    console.log("draftContainer:" + fileContainer.getContainerJson());
    $.UIkit.notify("save..", { status: 'success', timeout: 1000 });
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
      var file = new _FileData2.default();
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

  var editorContainer = document.getElementById("container");

  //sourceのcompile
  function compile() {
    var parseData = marked(currentFile.getEditorData().source.model.getValue().trim());

    $("#child-frame").attr("srcdoc", parseData);
  }
  //View///////////////////////////////////////////////////
  $(function () {
    //エディタ初期化
    require.config({
      paths: {
        vs: "js/monaco-editor/min/vs"
      }
    });
    require(["vs/editor/editor.main"], function () {
      editor = monaco.editor.create(editorContainer, {
        automaticLayout: true,
        model: null
      });
      fileContainer.setMonaco(monaco);
      loadProject(function () {
        compile();
      });
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
       var file = new _FileData2.default();
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
    return JSON.stringify(str, function (key, value) {
      if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === "object" && value !== null) {
        if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(value);
      }
      if (key == "parentNode") return;
      return value;
    }, "\t");
  }
});
