<template>
  <div>
    <SlideMenu ref="slideMenu">
      <SettingPage></SettingPage>
    </SlideMenu>
    <div class="wrapper">
      <div class="sidebar" :style="{ width : '200px' }">
        <NoteList :items="fileList" :onNew="newProject" :onSelect="loadProject"></NoteList>
        <AppFooter backgroundColor="#fff" >
          <div  @click="settingOpen"><UniconIcon name="setting" @click="settingOpen"></UniconIcon></div>
        </AppFooter>
      </div>
      <NoteContents></NoteContents>
    </div>
  </div>
</template>

<script>
import NoteList from '@/components/NoteList.vue'
import Contents from '@/components/Contents.vue'
import Footer from '@/components/Footer.vue'
import SlideMenu from '@/components/SlideMenu.vue'
import SettingPage from '@/components/SettingPage.vue'

export default {
  components: {
    NoteList,
    NoteContents: Contents,
    SlideMenu,
    SettingPage,
    AppFooter: Footer
  },
  computed: {
    /**
     * 処理名: ファイルリスト取得
     * 処理概要: ストアから最新のノートリストを返す
     * 実装理由: ストアの状態をサイドバーリストに反映するため
     * @returns {Array} ノートリスト
     */
    fileList() {
      return this.$store.getters.refreshFileList
    }
  },
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: ウィンドウサイズとサンプルアイテムの初期値を設定する
   * 実装理由: レイアウト管理に必要な初期状態を用意するため
   * @returns {{ width: number, height: number, items: Array }} 初期データ
   */
  data() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      items: [
        { name: 'いちご', uri: 'note_1583338656491', isActive: true },
        { name: 'りんご', uri: 'note_1583338656492', isActive: false },
        { name: 'みかん', uri: 'note_1583338656493', isActive: false },
        { name: 'Template - Weekly Planner', uri: 'note_1583338656495', isActive: false }
      ]
    }
  },
  methods: {
    /**
     * 処理名: リサイズハンドラ
     * 処理概要: ウィンドウリサイズ時に現在のサイズをステートに反映する
     * 実装理由: レイアウト計算に最新のウィンドウサイズを提供するため
     */
    handleResize: function() {
      this.width = window.innerWidth
      this.height = window.innerHeight
    },
    /**
     * 処理名: 新規プロジェクト作成
     * 処理概要: ストアに新規プロジェクト作成アクションをディスパッチする
     * 実装理由: サイドバーの新規作成ボタンとストアを接続するため
     */
    newProject() {
      this.$store.dispatch('newProject')
    },
    /**
     * 処理名: プロジェクト読み込み
     * 処理概要: 指定 URI のプロジェクトをストアに読み込む
     * 実装理由: ノートリストのアイテム選択時にエディタを切り替えるため
     * @param {string} uri - 読み込むノートのキー
     */
    loadProject(uri) {
      setTimeout(() => {
        this.$store.dispatch('loadProject', uri)
      }, 0)
    },
    /**
     * 処理名: 設定パネル開く
     * 処理概要: スライドメニューを開いて設定パネルを表示する
     * 実装理由: フッターの設定アイコンクリックとスライドメニューを接続するため
     * @param {Event} e - クリックイベント
     */
    settingOpen(e) {
      this.$refs.slideMenu.open(e)
    }
  },
  /**
   * 処理名: マウント後初期化
   * 処理概要: ウィンドウリサイズイベントリスナーを登録する
   * 実装理由: ウィンドウサイズ変更に追従するため
   */
  mounted: function() {
    window.addEventListener('resize', this.handleResize)
  },
  /**
   * 処理名: アンマウント前クリーンアップ
   * 処理概要: マウント時に登録したリサイズイベントリスナーを解除する
   * 実装理由: メモリリークを防ぐため
   */
  beforeUnmount: function() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style>
.wrapper {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    height: 100vh;
}
.sidebar {
  display: flex;
  flex-direction: column;
  flex: 0 0 200px;
  height: 100%;
  min-height: 0;
}
.blurIn {
    -webkit-animation: blurIn .3s ease both;
    animation: blurIn .3s ease both
}
.blurOut {
    -webkit-animation: blurOut .3s ease both;
    animation: blurOut .3s ease both
}

@-webkit-keyframes blurIn {
    0% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }

    100% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }
}

@keyframes blurIn {
    0% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }

    100% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }
}

@-webkit-keyframes blurOut {
    0% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }

    100% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }
}

@keyframes blurOut {
    0% {
        -webkit-filter: blur(10px);
        filter: blur(10px);
        opacity: .2
    }

    100% {
        -webkit-filter: blur(0);
        filter: blur(0);
        opacity: 1
    }
}
</style>
