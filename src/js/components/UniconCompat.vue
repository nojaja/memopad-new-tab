<template>
  <IconWrapper
    :icon="iconName"
    :style="iconStyle"
    :width="width"
    :height="height"
    v-bind="$attrs"
  />
</template>

<script>
import { computed, defineComponent } from 'vue'
import { Icon } from '@iconify/vue'
import uilTrashAlt from '@iconify-icons/uil/trash-alt'
import uilEdit from '@iconify-icons/uil/edit'
import uilColumns from '@iconify-icons/uil/columns'
import uilEye from '@iconify-icons/uil/eye'
import uilExport from '@iconify-icons/uil/export'
import uilImport from '@iconify-icons/uil/import'
import uilBrightness from '@iconify-icons/uil/brightness'
import uilSetting from '@iconify-icons/uil/setting'
import uilBars from '@iconify-icons/uil/bars'
import uilTimes from '@iconify-icons/uil/times'
import uilSearchAlt from '@iconify-icons/uil/search-alt'
import ggSidebarOpen from '@iconify-icons/gg/sidebar-open'

const uilCircle = {
  body: '<circle cx="12" cy="12" r="10" />',
  width: 24,
  height: 24
}

const iconMap = {
  'trash-alt': uilTrashAlt,
  edit: uilEdit,
  columns: uilColumns,
  eye: uilEye,
  export: uilExport,
  import: uilImport,
  bright: uilBrightness,
  setting: uilSetting,
  bars: uilBars,
  times: uilTimes,
  'search-alt': uilSearchAlt,
  'gg:sidebar-open': ggSidebarOpen
}

export default defineComponent({
  name: 'UniconCompat',
  components: { IconWrapper: Icon },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      required: true
    },
    fill: {
      type: String,
      default: ''
    },
    width: {
      type: String,
      default: '24px'
    },
    height: {
      type: String,
      default: '24px'
    }
  },
  /**
   * 処理名: コンポーネントセットアップ
   * 処理概要: アイコン名・スタイルの算出プロパティを定義して返す
   * 実装理由: name prop をアイコンデータに変換し fill を CSS スタイルに変換するため
   * @param {object} props - コンポーネント props
   * @returns {{ iconName: object, iconStyle: object }} テンプレートで使用する算出値
   */
  setup(props) {
    const iconName = computed(/**
     * 処理名: アイコン名算出
     * 処理概要: name prop をアイコンマップで解決し未登録の場合は円形アイコンを返す
     * 実装理由: 未知のアイコン名でもフォールバック表示するため
     * @returns {object} アイコンデータ
     */
    () => iconMap[props.name] || uilCircle)
    const iconStyle = computed(/**
     * 処理名: アイコンスタイル算出
     * 処理概要: fill prop がある場合にカラースタイルオブジェクトを返す
     * 実装理由: fill prop をインラインスタイルとしてアイコンに適用するため
     * @returns {object} CSS スタイルオブジェクト
     */
    () => (props.fill ? { color: props.fill } : {}))

    return {
      iconName,
      iconStyle
    }
  }
})
</script>
