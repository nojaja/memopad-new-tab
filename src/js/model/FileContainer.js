/***********************************************
Copyright 2017 - 2018
***********************************************/
/* v1.0.0 */
import FileData from './FileData.js'

/*------------------------------------------------
  ファイル管理クラス FileContainer
------------------------------------------------*/
class FileContainer {
  constructor(monaco) {
    this.monaco = monaco;
    this.container = {
        id:null,
        files:{},
        "public": true,
        "created_at": "2017-10-29T05:45:01Z",
        "updated_at": "2017-11-14T12:41:14Z",
        "projectName": "",
        "description": ""
    };
    this.fileObjects={};
  }
  setId(id) {
    this.container['id'] = id;
  }
  getId() {
    return this.container['id'];
  }
  setMonaco(monaco) {
    this.monaco = monaco;
  }
  getMonaco() {
    return this.monaco;
  }
  setProjectName(projectName) {
    this.container['projectName'] = projectName;
  }
  getProjectName() {
    return this.container['projectName'];
  }

  getFiles() {
    // 配列のキーを取り出す
    var ret = []
    for (var key in this.container["files"]) {
      if(!this.container["files"][key]["truncated"]){
        ret.push(key);
      }
    }
    return ret;
  }

  getFile(filename) {
    if (filename in this.container["files"]) {
      if (!(filename in this.fileObjects)) {
        this.fileObjects[filename] = new FileData(this.container["files"][filename],this.monaco);
      }
      return this.fileObjects[filename];
    }
  }

  getFileRaw(filename) {
    if (filename in this.container["files"]) {
      return this.container["files"][filename];
    }
  }

  putFile(file) {
    var filename = file.getFilename();
    this.container["files"][filename] = file.getFileData();
    return true;
  }

  renameFile(filename,newName) {
    var file = this.getFile(filename);
    file.setFilename(newName);
    this.putFile(file);
    delete this.container["files"][filename];
  }

  removeFile(filename) {
    var file = this.getFile(filename);
    file.remove();
    this.putFile(file);
  }

  init() {
    this.container = {
        id:"",
        files:{},
        "public": true,
        "created_at": "2017-10-29T05:45:01Z",
        "updated_at": "2017-11-14T12:41:14Z",
        "description": ""
    };
    this.fileObjects={};
  }

  setPublic(bool) {
    this.container["public"] = bool;
  }
  getPublic() {
    return this.container["public"];
  }
  setDescription(description) {
    this.container["description"] = description;
  }
  getDescription() {
    return this.container["description"];
  }

  setContainer(container) {
    this.container = container;
    this.fileObjects={};
  }
  getContainer() {
    return this.container;
  }

  setContainerJson(container) {
    this.setContainer(JSON.parse(container));
    this.fileObjects={};
  }
  getContainerJson() {
    return JSON.stringify(this.getContainer());
  }

  getGistData() {
    var gistdata = {
       "description":  this.container["projectName"] +"\n" + this.container["description"],
       "public": this.container["public"],
       "files": this.container["files"]
    };
    return gistdata;
  }
  getGistJsonData() {
    return JSON.stringify(this.getGistData());
  }
}
export default FileContainer;
if (typeof window != "undefined") {
  !window.FileContainer && (window.FileContainer = FileContainer);
}
