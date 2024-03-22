<template>
    <!--<div class="q-calendar__ellipsis"> this css class was fucking up look-->
       
        <!-- original
            <q-btn
            class="q-mt-xl"
            color=""
            text-color="blue"
            elevated
            label="Defaults"
            @click="onLoadDefault"
            no-caps
          />-->
        <q-btn
        color=""
        elevated
        @click="onClicked"
        no-caps
        >
            <div>{{textLabel}}</div>
        </q-btn>
        <!--<q-space /> -->
    <!--</div> -->
</template>

<script>
import { defineComponent } from 'vue'   //needed to have the intelliSense?!?
  export default defineComponent ({  //this be Options Vue notation
    name: 'schedBtn',
    props: {
      textLabel: String, //...label="Reload"
    },
    emits: [
      'doBtnAction'
    ],
    methods: {
      onClicked () { //this needed or can just invoke 'doBtnAction'? >>seems needed!
        //console.log('huh schedBtn',this.textLabel)
        this.$emit('doBtnAction')
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
