<template>
    <q-btn-dropdown
    split
    dense
    align="evenly"
    color=""
    elevated
    :disable-main-btn= "disableBtn"
    :label="optionLabel"
    @click="onClicked"
    no-caps
    no-wrap
  >
  <!--huh can add something first i.e <div>ddd</div> -->
  <!--and pass in padding from parent!
    see about adding border to options below via class..
    class="q-px-xl"
  /> -->
  
  <q-list bordered padding>
      <q-item v-for="e in daOptions" :key="e" clickable v-close-popup @click="onSelect(e)" ><!--chooseScore(e)-->
        <q-item-section style="text-align: center;">
          <q-item-label>{{ e }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script>
import { defineComponent } from 'vue'   //needed to have the intelliSense?!?
export default defineComponent ({  //this be Options Vue notation
  name: 'dropDwnBtn',
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
    onClicked () {
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

    <!-- original
        <q-btn-dropdown
                split
                color=""
                class="q-mt-xl"
                text-color="teal"
                elevated
                :disable-main-btn= "disableScoreBtn"
                :label="chosenScoreLabel"
                @click="onReloadWithScore"
                no-caps
              >
              <q-list>
                  <q-item v-for="e in scoreOptions" :key="e.id" clickable v-close-popup @click="chooseScore(e)" >
                    <q-item-section>
                      <q-item-label>{{ e }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown> 
            -->