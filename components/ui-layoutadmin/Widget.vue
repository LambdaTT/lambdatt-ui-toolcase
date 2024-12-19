<template>
  <Card :Title="Title" :Icon="Icon" :HeaderBgColor="headerBgColor" :HeaderTextColor="headerTextColor" dense
    class="q-ma-sm">
    <template #actions>
      <slot name="actions"></slot>
    </template>

    <div style="min-height: 250px;">
      <slot></slot>
    </div>
    </Card>
</template>

<script>
export default {
  name: 'ui-layoutadmin-widget',

  props: {
    Icon: String,
    Title: String,
    HeaderBgColor: String,
    HeaderTextColor: String,
    OverflowY: String
  },

  data() {
    return {
      headerBgColor: 'grey-6',
      headerTextColor: 'white'
    }
  },

  mounted() {
    if (!!this.HeaderBgColor) this.headerBgColor = this.HeaderBgColor;
    if (!!this.HeaderTextColor) this.headerTextColor = this.HeaderTextColor;
  }
}
</script>