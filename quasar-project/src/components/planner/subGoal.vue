<template>
<div class="q-pa-md" style="max-width: 550px">
    <!--<q-list bordered padding> -->
    <q-separator spaced></q-separator>

    <q-item-label header>{{ title }}</q-item-label>  <!--List Header -->

    <q-item clickable v-ripple>
        <q-item-section top thumbnail class="q-ml-none">
          <!--<img src="https://cdn.quasar.dev/img/mountains.jpg"> -->
          <!--<img :src="MImg" style="height: 140px; max-width: 150px" /> -->
          <!--<q-img
          :src="mangaImage"
          spinner-color="white">
          </q-img>-->
           <q-item-label>{{ score }}</q-item-label> 
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ time }}</q-item-label> <!-- Single line item-->
          <q-item-label caption>{{duration}}</q-item-label>
        </q-item-section>

      </q-item>
</div>

</template>

<script>
import { defineComponent } from 'vue'   //needed to have the intelliSense?!?

export default defineComponent ({  //this be Options Vue notation
  name: 'schedDropBtn',
  props: {
    optionLabel: String,//huh does stay reactive!
    disableBtn: Boolean, //same as above :)
    daOptions: Array //[Array, Object] accepting two possible values is problematic!
  },
  emits: [
    'doReload',
    'chooseOption'
  ],
  methods: {
    onClicked () { //this needed or can just invoke 'doBtnAction'? >>seems needed!
      this.$emit('doReload')
    },
    onSelect(v) {
      //console.log('huh schedDropBtn',v)
      this.$emit('chooseOption',v)
    }
  }
})
</script>
<style lang="sass" scoped>
.radio-select
  display: flex
  justify-content: center
  margin:0 auto
  width: 100%
  padding-inline:30px
</style>
