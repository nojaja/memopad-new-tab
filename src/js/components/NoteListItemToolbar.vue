<template>
  <ul
    class="noteListItem-toolbar"
    aria-label="note actions"
  >
    <li class="noteListItem-toolbarItem">
      <button
        type="button"
        class="noteListItem-actionButton"
        aria-label="delete note"
        title="delete note"
        @click.stop="onDelete(uri)"
      >
        <UniconIcon name="trash-alt" />
      </button>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'NoteListItemToolbar',
  props: {
    uri: {
      type: String,
      required: true
    },
    onDelete: {
      type: Function,
      required: false,
      default: /**
       * 処理名: onDelete デフォルトハンドラ
       * 処理概要: 削除イベントのデフォルトコールバック（何もしない）
       * 実装理由: 親から未指定時でも安全にクリック処理を実行可能にするため
       */
        function () {}
    }
  }
}
</script>
