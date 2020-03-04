/***********************************************
Copyright 2017 - 2018
***********************************************/
/* v1.0.0 */

/*------------------------------------------------
  ファイル管理クラス FileContainer
------------------------------------------------*/
class FileData {
  constructor(file,monaco) {
    if(file instanceof FileData){
      this.file = file.getFileData
    }else{
      this.file = {
          "filename": file&&file["filename"]?file["filename"]:"",
          "fileType":  file&&file["fileType"]?file["fileType"]:"txt",
          "type":  file&&file["type"]?file["type"]:"text/plain",
          "language":  file&&file["language"]?file["language"]:"Markdown",
          "size":  file&&file["size"]?file["size"]:0,
          "truncated":  file&&file["truncated"]?file["truncated"]:false,
          "content":  file&&file["content"]?file["content"]:""
      };
      this.editorData = {};
      if( file&&file["filename"])this.setFilename(file["filename"]);
      if(monaco)this.editorData.source.model.setValue(this.file ["content"]);
      this.monaco = monaco;
    }
  }
  addEditorData(key,caption,type){
    this.editorData[key] = {
          caption : caption,
          model: (monaco)?monaco.editor.createModel("", type):null,
          state: null,
          decorations : []
        }
  }
  setLanguage(language) {
    this.file["language"] = language;
  }
  getLanguage() {
    return this.file["language"];
  }
  setFileType(fileType) {
    this.file["fileType"] = fileType;
  }
  getFileType() {
    return this.file["fileType"];
  }
  setType(type) {
    this.file["type"] = type;
  }
  getType() {
    return this.file["type"];
  }
  getSize(){
    return this.file["size"];
  }
  setContent(content) {
    if(this.monaco){
        this.editorData.source.model.setValue(content);
    }else{
        this.file["content"] = content;
    }
  }
  getContent() {
    return (this.monaco)?this.editorData.source.model.getValue():this.file["content"];
  }
  setFilename(filename) {
    this.file["filename"] = filename;
    if(filename.match(/md$/)){
      this.setType("text/plain");
      this.setLanguage("Markdown");
      this.addEditorData("source",filename,"txt");
      this.addEditorData("html","result(html)","html");
      return;
    }
    if(filename.match(/markdown$/)){
      this.setType("text/plain");
      this.setLanguage("Markdown");
      this.addEditorData("source",filename,"txt");
      this.addEditorData("html","result(html)","html");
      return;
    }
    if(filename.match(/txt$/)){
      this.setType("text/plain");
      this.setLanguage("text");
      this.addEditorData("source",filename,"txt");
      return;
    }
    if(filename.match(/json$/)){
      this.setType("application/json");
      this.setLanguage("json");
      this.addEditorData("source",filename,"json");
      return;
    }
    if(filename.match(/ahtml$/)){
      this.setType("text/html");
      this.setLanguage("ahtml");
      this.addEditorData("source",filename,"html");
      this.addEditorData("dom","dom tree","json");
      this.addEditorData("component","js component.js","javascript");
      this.addEditorData("app","js app.js","javascript");
      this.addEditorData("html","result(html)","html");
      return;
    }
    if(filename.match(/htm.?$/)){
      this.setType("text/html");
      this.setLanguage("html");
      this.addEditorData("source",filename,"html");
      return;
    }
    if(filename.match(/js$/)){
      this.setType("text/javascript");
      this.setLanguage("JavaScript");
      this.addEditorData("source",filename,"javascript");
      this.addEditorData("compiled","JS Compiled","javascript");
      return;
    }
    if(filename.match(/es6$/)){
      this.setType("text/javascript");
      this.setLanguage("JavaScript");
      this.addEditorData("source",filename,"javascript");
      this.addEditorData("compiled","JS Compiled","javascript");
      return;
    }
    if(filename.match(/scss$/)){
      this.setType("text/scss")
      this.setLanguage("scss");
      this.addEditorData("source",filename,"scss");
      this.addEditorData("compiled","CSS Compiled","css");
      return;
    }
    if(filename.match(/css$/)){
      this.setType("text/css")
      this.setLanguage("css");
      this.addEditorData("source",filename,"css");
      return;
    }
    this.addEditorData("source",filename,"txt");
    return;
  }
  getFilename() {
    return this.file["filename"];
  }

  setEditorData(data) {
    this.editorData = data;
    if(monaco)this.file["content"]=this.editorData.source.model.getValue();
  }
  getEditorData() {
    return this.editorData;
  }


  getFileData() {
    return this.file;
  }
  getFileDataJson() {
    return JSON.stringify(this.getFileData());
  }

  remove(){
    this.file["content"] = "";
    this.file["truncated"] = true;
  };
}

export default FileData;

if (typeof window != "undefined") {
  !window.FileData && (window.FileData = FileData);
}
