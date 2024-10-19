<template>
<div class="q-pa-md" style="max-width: 550px">
    <!--<q-list bordered padding> -->
    <q-separator spaced></q-separator>

    <q-item-label header>{{ title }}</q-item-label>  <!--List Header -->

    <q-item clickable v-ripple>
        <q-item-section top thumbnail class="q-ml-none">
          <!--<img src="https://cdn.quasar.dev/img/mountains.jpg"> -->
          <img :src="MImg" style="height: 140px; max-width: 150px" />
          <!--<q-img
          :src="mangaImage"
          spinner-color="white">
          </q-img>-->
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ chapter }}</q-item-label> <!-- Single line item-->
          <q-item-label caption>{{chapterLink}}</q-item-label>
        </q-item-section>

      </q-item>
</div>

</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChapterLink',
  props: {
    title: {
      type: String,
      required: true
    },

    chapter: {
      type: String,
      default: ''
    },

    chapterLink: {
      type: String,
      default: ''
    },

    MImg: {
      type: String,
      default: '#'
    }
  }
})
</script>