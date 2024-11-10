<template>
  <q-item
    clickable
    tag="a"
    dense
    :to="link"
    activeClass="g-link-active"
    style="margin: 0 auto"
  >
    <!--without activeClass only the caption shows lool toReview
    @click="$emit('reset')"
    target="_blank"  >> opens new tab
    :href="link"
    oldie for style but too much space>> style="margin: 0 1em 0 1em;"-->

    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" size="20px"/>
    </q-item-section>

    <q-item-section class="g-link">
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption class="g-caption">{{ caption }}</q-item-label>
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
  //emits: [ 'reset']
})
</script>
<style scoped lang="sass">
.g-link
  background-color: transparent
  margin-left: -30px

.g-link-active
  outline: 1px dashed gainsboro

@media (max-width: 500px)
  .g-link
    visibility: hidden
  .g-link>.g-caption
    visibility: visible
</style>