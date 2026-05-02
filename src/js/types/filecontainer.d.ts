declare module 'filecontainer' {
  export class FileContainer {
    container: { projectName: string }
    init(): void
    setId(id: number | string): void
    getProjectName(): string
    setProjectName(name: string): void
    getCreatedTime(): number
    setCreatedTime(time: number): void
    getLastUpdatedTime(): number
    setLastUpdatedTime(time: number): void
    getContainerJson(): string
    setContainerJson(json: string | null): void
    setContainer(container: any): void
    getFiles(): Array<{ name: string }>
    getFile(name: string): FileData | null
    putFile(file: FileData): void
  }

  export class FileData {
    getFilename(): string
    setFilename(name: string): void
    getContent(): string
    setContent(content: string): void
    getDescription(): string
    setDescription(desc: string): void
  }
}
