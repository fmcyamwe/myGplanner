<!--for showing end-Now button and updating the goal score when ending-->
<template>
    <div class="title q-calendar__ellipsis"><!--q-mr-xs q-mb-xs q-px-sm -->
      <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
        <div style="max-width: 25px; min-width: 25px;"></div> $emit('endNow', id)
      -->
      {{ title +' : '+ score}}
      <q-tooltip>{{ details + ' at: '+ startTime }}</q-tooltip>

        <q-btn
        no-caps
        class="button"
        label="End-Now"
        :style="endNowBtnStyle"
        @click="wannaEnd"
        />
        <!--
        :label="EndNow"
        <div class="ellipsis">  :style="userStyle"
          {{ title }}
          <q-tooltip>{{ endTime + ' - ' + details }}</q-tooltip>
        </div>-->

        <q-popup-edit v-model="aScore" :disable="disabledScore" v-slot="scope" auto-save>
           <!--disabledScoreEvts[event.id] for disable && onSaveScore(e,id). 
          rmv this to see >> @save="(e)=>$emit('saveScore', e, id)"-->
            <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set" /> 
            <!-- >>oldie >>counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...
            now though no need for @keyup.enter="scope.set" toSee how it works!-->
        </q-popup-edit>
      </div>
</template>
  
<script>
  export default {  //this be Options Vue notation
    name: 'GoalyEnd',
    props: {
      disabledScore: Boolean, //was modelValue--toSee if rename causes issue....
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
      'endNow'
    ],
    computed: { //bon use other methods as these are not useful...
      aScore:{
        get(){return this.score},
        set(value){
          console.log(`aScore getting set`,value, this.id) 
          this.$emit('saveScore', value, this.id) //check if auto-save does update it...
        }
      },
      overdueIconStyle () {
        return {
          color: (this.daysOver === 0 ? 'inherit' : 'red'),
          'max-width': '25px',
          'min-width': '25px'
        }
      },
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
          'margin-left': '32em',
          'height':'100%'   //toSee*** if takes container's row height //try >> inherit || auto
        }
      }
    },
    watch: {
      title (val) {
         console.log('titleValue:', val)
      }
    },
    methods: {
      onClicked () {
         console.log('huh a click doing nothing')
        this.$emit('update:model-value', !this.disabledScore)
      },
      wannaEnd(){
        console.log("eeeuh wish to end for", this.id, this.disabledScore ,this.happeningNow )
        this.$emit('endNow', this.id)
      }
    }
  }
</script>
<style lang="sass" scoped>
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