<template>
  <div class="row justify-center">
    <div class="col-12 text-left">
      <span class="q-py-md text-h6">{{ pageTitle }}</span>
    </div>
    <div class="col-12">
      <q-breadcrumbs class="q-py-sm text-caption">
        <q-breadcrumbs-el v-for="(item, index) in breadcrumb" :key="index" :label="item.label" :icon="item.icon"
          :to="item.to" />
      </q-breadcrumbs>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ui-layoutapp2-pageheader',

  props: {
    pageTitle: String,
    breadcrumb: Array
  },

  mounted(){
    if(!this.pageTitle) throw "The page title is undefined."
    if(!this.breadcrumb) throw "The breadcrumb is undefined."
  }
}
</script>
