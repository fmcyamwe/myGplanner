<!--for showing end-Now button and updating the goal score when ending-->
<template>
    <div class="title q-calendar__ellipsis"><!--q-mr-xs q-mb-xs q-px-sm -->
      <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
        <div style="max-width: 25px; min-width: 25px;"></div> $emit('endNow', id)
      -->
      {{ title +':'+ score}}
      <q-tooltip>{{ details }}</q-tooltip>

        <q-btn
        no-caps
        class="button"
        label="End-Now"
        :style="endNowBtnStyle"
        @click="wannaEnd"
        />
        <!--
        :label="EndNow"
        <div class="ellipsis">  :style="userStyle"  class="inputBtn"
          {{ title }}
          <q-tooltip>{{ details + ' at: '+ startTime }}</q-tooltip>
        </div>-->

        <q-popup-edit v-model="aScore" :disable="disabledScore" v-slot="scope" auto-save>
           <!--disabledScoreEvts[event.id] for disable && onSaveScore(e,id). 
          rmv this to see >> @save="(e)=>$emit('saveScore', e, id)" 
          autofocus 
        -->
       
          <q-input v-model="scope.value" dense @keyup.enter="scope.set">
            <template #after>
              <q-btn
              flat dense color="positive" icon="check_circle"
              @click.stop.prevent="scope.set"
              />
              <q-separator :vertical="true"/>
                  <q-btn
                  label="Del"
                  flat dense color="negative" icon="delete_forever"
                  @click="onDelete"
                  />
              </template>
            </q-input>
            <!-- >>oldie >>counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...
            now though no need for @keyup.enter="scope.set" toSee how it works!-->

            <!--<template> --doesnt like the v-slot it seems---have to be in input as above!!===also having >> v-slot="after" seems to bork it(have to use #after)...see why later!!
              <q-btn
              flat dense color="negative" icon="cancel"
              @click.stop.prevent="scope.cancel"
               :disable="scope.validate(scope.value) === false || scope.initialValue === scope.value"
            />
            </template> -->
        </q-popup-edit>
      </div>
</template>
  
<script>
import { defineComponent,ref } from 'vue'

  export default defineComponent ({  //this be Options Vue notation
    name: 'GoalyEnd',
    props: {
      disabledScore: Boolean,
      title: String, //g.Title
      id: Number, //
      startTime: String, //redundant--toRemove
      //endNow: Boolean, //button to end now
      details: String, //?!? not needed prolly--toRemove
      score: String, //score to update
      happeningNow: Boolean, //to show the endNow button

      //workDate: String,
      //amount: String,
      //daysOver: Number
    },
    emits: [
      //'update:model-value', //redundant since not writing back to parent?--or should have this still for binding via v-model? >>no need
      'saveScore',
      'endNow',
      'deleteNow'
    ],
    computed: { //bon use other methods as these are not useful...
      aScore:{
        get(){return this.score},
        set(value){
          console.log(`aScore getting set`,value, this.id) 
          this.$emit('saveScore', value, this.id) //check if auto-save does update it...
        },
        cancel(){ //doesnt do anything...toRemove
          console.log(`aScore remove?`, this.id) 
        }
      },
      /*overdueIconStyle () {
        return {
          color: (this.daysOver === 0 ? 'inherit' : 'red'),
          'max-width': '25px',
          'min-width': '25px'
        
      },}*/
      userIconStyle () {
        return {
          color: this.disabledScore === true ? 'red' : 'blue',
          cursor: 'pointer'
        }
      },
      //labelBtnStyle () { //for edit or end --not needed since using popup-edit?..or actually need it?~? FML....toTest***
      //  return (this.disabledScore === false && this.happeningNow === true) ? 'Edit' : 'EndNow'
      //},
      endNowBtnStyle () {  //for displaying the button and hide it when otherwise...not complicated?toReview
        return {
          display: (this.disabledScore === true && this.happeningNow === true) ? 'block' : 'none', //oldie>>this.happeningNow === true ? 'block' : 'none'
          'text-align': 'right',
          'margin-left': '32em',
          'height':'auto'   // auto
        }
      }
    },
    watch: {
      title (val) {
         console.log('titleValue:', val)
      }
    },
    methods: {
      onDelete () { //no need for @click="(e) => onDelete(e)"...phew!
        //console.log('huh delete?',this.id)
        this.$emit('deleteNow', this.id) //no need for this.id either!!--toReview**
      },
      wannaEnd(){
        console.log("eeeuh wish to end for", this.id, this.disabledScore ,this.happeningNow )
        this.$emit('endNow', this.id)
      }
    }
  })
</script>
<style lang="sass" scoped>
.inputBtn
  text-align: center
.goal-item
  border: 1px solid transparent
  box-shadow: 0 1px 5px rgb(0 0 0 / 20%), 0 2px 2px rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 12%)
  border-radius: 4px
  vertical-align: top
  padding: 2px
  margin: 2px
  margin-bottom: 4px
  font-size: 12px
  &:hover
    border: 1px solid rgba(0,140,200,.8)
.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%
</style>