declare module '@nojaja/filecontainer' {
  /** FileContainer 型定義 */
  export class FileContainer {
    container: { projectName: string }
    /** 初期化 */
    init(): void
    /** ID 設定 */
    setId(id: number | string): void
    /** プロジェクト名取得 */
    getProjectName(): string
    /** プロジェクト名設定 */
    setProjectName(name: string): void
    /** 作成日時取得 */
    getCreatedTime(): number
    /** 作成日時設定 */
    setCreatedTime(time: number): void
    /** 最終更新日時取得 */
    getLastUpdatedTime(): number
    /** 最終更新日時設定 */
    setLastUpdatedTime(time: number): void
    /** コンテナ JSON 取得 */
    getContainerJson(): string
    /** コンテナ JSON 設定 */
    setContainerJson(json: string | null): void
    /** コンテナ設定 */
    setContainer(container: Record<string, unknown>): void
    /** ファイル一覧取得 */
    getFiles(): Array<{ name: string }>
    /** ファイル取得 */
    getFile(name: string): FileData | null
    /** ファイル保存 */
    putFile(file: FileData): void
  }

  /** FileData 型定義 */
  export class FileData {
    /** ファイル名取得 */
    getFilename(): string
    /** ファイル名設定 */
    setFilename(name: string): void
    /** 内容取得 */
    getContent(): string
    /** 内容設定 */
    setContent(content: string): void
    /** 説明取得 */
    getDescription(): string
    /** 説明設定 */
    setDescription(desc: string): void
  }
}
