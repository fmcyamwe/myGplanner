<template>
  <q-btn
  color=""
  align="evenly"
  elevated
  dense
  no-wrap
  @click.prevent="onClicked"
  :disable="isDisabled"
  no-caps
  >
    <div>{{textLabel}}</div>
    <q-tooltip v-if="isDisabled">No Evts to Schedule...</q-tooltip> 
            <!--<q-tooltip>{{geee}}</q-tooltip> huh can have tooltip!!
            
            -->
  </q-btn>
</template>

<script>
import { defineComponent } from 'vue'
  export default defineComponent ({  //this be Options Vue notation
    name: 'schedBtn',
    props: {
      textLabel: String,
      isDisabled:{ //not passing in this flag and using disable prop hides tooltip!
        type: Boolean,
        default: false
        ////required: true,
      }
    },
    emits: [
      'doBtnAction'
    ],
    methods: {
      onClicked () {
        this.$emit('doBtnAction') //.prevent added on click -->
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
          />

          //other examples
          <q-btn
          class="q-mt-md"
          :text-color="saveScheduleDisabled ? 'grey' : 'blue' "
          elevated
          push
          align="evenly"                      
          label="SaveSchedule"                                
          :disable="saveScheduleDisabled"                      
          @click="doSaveSchedule"                      
          no-caps
          />

          <q-btn v-if="showTree || isViewingPast()"
          class="q-mt-md"
          text-color="green"                      
          elevated                      
          push                      
          align="evenly"                      
          :label="showTree ? 'HideTree' : 'ShowTree'"                      
          @click="() =>{ showTree ? resetFilter(): '' ; showTree = !showTree}"
          no-caps
          />
      -->