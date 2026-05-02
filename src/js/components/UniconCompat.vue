<template>
  <Icon
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
  'search-alt': uilSearchAlt
}

export default defineComponent({
  name: 'UniconCompat',
  components: { Icon },
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
  setup(props) {
    const iconName = computed(() => iconMap[props.name] || uilCircle)
    const iconStyle = computed(() => (props.fill ? { color: props.fill } : {}))

    return {
      iconName,
      iconStyle
    }
  }
})
</script>
