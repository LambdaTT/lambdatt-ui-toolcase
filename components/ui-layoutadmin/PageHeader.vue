<template>
  <div class="row">
    <div class="col-12 col-md-6 q-pa-md q-pa-md-none">
      <h4 class="gt-xs">{{ pageTitle }}</h4>
      <div class="lt-sm text-h5 q-mt-md">{{ pageTitle }}</div>
    </div>
    <div class="col-12 col-md-6">
      <q-breadcrumbs class="q-mb-md q-pt-lg q-pr-md float-right">
        <q-breadcrumbs-el v-for="(item, index) in breadcrumb" :key="index" :label="item.label" :icon="item.icon"
          :to="item.to" />
      </q-breadcrumbs>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ui-layoutadmin-pageheader',

  props: {
    pageTitle: String,
    breadcrumb: Array
  }
}
</script>
