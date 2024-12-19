<template>
  <q-page :padding="false" class="q-pa-md-md">
    <PageHeader :pageTitle="Title" :breadcrumb="Breadcrumb" />
    <div id="page-contents">
      <slot></slot>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ui-layoutadmin-page',

  props: {
    Title: String,
    Breadcrumb: Object,
  },

  created() {
    if (this.Title == null) throw 'Defina o título da página';
    if (this.Breadcrumb == null) throw 'Defina o breadcrumb da página';
  }

}
</script>