<template>
  <div>
    <select class="option" v-model="selectedInfo">
      <option v-for="item in dataItems" :value="item.value" :key="item.key">{{item.name}}</option>
    </select>
  </div>
</template>

<script>
export default {
    name: 'FilterSelect',
  components: {
  },
  computed: {
    selectedInfo: {
      get: /**
       * 処理名: 選択値ゲッター
       * 処理概要: 現在の選択値を返す
       * 実装理由: v-model の双方向バインディングのために算出プロパティを使用する
       * @returns {string} 現在の選択値
       */
      function() {
        return this.dataSelected
      },
      set: /**
       * 処理名: 選択値セッター
       * 処理概要: 新しい選択値を設定し onSelect コールバックを呼び出す
       * 実装理由: 選択変更を親コンポーネントに通知するため
       * @param {string} newValue - 新しい選択値
       */
      function(newValue) {
        this.dataSelected = newValue
        this.onSelect(newValue)
      }
    }
  },
  props: {
    selected: {
      type: String,
      required: false,
      default: /**
       * 処理名: selected デフォルト値
       * 処理概要: 選択値のデフォルトを空文字で初期化する
       * 実装理由: prop が渡されなかった場合の安全なデフォルト値
       * @returns {string} 空文字
       */
      function() { return '' }
    },
    items: {
      type: Array,
      required: false,
      default: /**
       * 処理名: items デフォルト値
       * 処理概要: 選択肢のデフォルトをテスト用の単一項目配列で初期化する
       * 実装理由: prop が渡されなかった場合の安全なデフォルト値
       * @returns {Array} デフォルト選択肢配列
       */
      function() { return [{ name: 'test', value: '' }] }
    },
    onSelect: {
      type: Function,
      required: false,
      default: /**
       * 処理名: onSelect デフォルトハンドラ
       * 処理概要: 選択変更時のデフォルトコールバック（コンソール出力）
       * 実装理由: prop が渡されなかった場合の安全なデフォルト実装
       * @param {string} newValue - 選択された値
       */
      function(newValue) { console.log(newValue) }
    }
  },
  /**
   * 処理名: コンポーネントデータ初期化
   * 処理概要: selected と items の初期値をローカルステートにコピーする
   * 実装理由: props を直接変更せず内部ステートとして管理するため
   * @returns {{ dataSelected: string, dataItems: Array }} 初期データ
   */
  data() {
    return {
      dataSelected: this.selected,
      dataItems: [...(this.items || [])]
    }
  },
  methods: {
  }
}
</script>

<style>
.option {
    background-color: rgba(255, 255, 255, 0.12);
    color: rgb(255, 255, 255);
    width: 200px;
    height: 40px;
    border-width: initial;
    border-style: initial;
    border-color: rgba(0, 0, 0, 0.26);
    border-image: initial;
    padding: 0px 16px;
    border-radius: 2px;
}
.option option {
    color: initial;
}
</style>
