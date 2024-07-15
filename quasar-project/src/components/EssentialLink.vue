<template>
  <q-item
    clickable
    tag="a"
    :to="link"
    @click="$emit('reset')"
  >
  <!--
    @click="clicky()"
    target="_blank"  >> opens new tab
    :href="link"-->
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true
    },

    caption: {
      type: String,
      default: ''
    },

    link: {
      type: String,
      default: '#'
    },

    icon: {
      type: String,
      default: ''
    },

    //clicky: { //to reset drawer but have to use 'emits' below
    //  type: Function,
    //  default() {
    //    return 'Default function'
    //  }
    //},
  },
  emits: [ 'reset']
})
</script>
