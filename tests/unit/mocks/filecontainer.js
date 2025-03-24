class FileData {
  constructor() {
    this.content = ''
    this.filename = ''
    this.description = ''
  }

  setContent(content) {
    this.content = content
  }

  setFilename(filename) {
    this.filename = filename
  }

  setDescription(description) {
    this.description = description
  }

  getContent() {
    return this.content
  }
}

class FileContainer {
  constructor() {
    this.container = {
      files: [],
      projectName: '',
      id: ''
    }
  }

  putFile(file) {
    this.container.files.push(file)
  }

  getFiles() {
    return this.container.files
  }

  setProjectName(name) {
    this.container.projectName = name
  }
}

module.exports = {
  FileContainer,
  FileData
}
