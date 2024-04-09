<template>
  <div class="text-h3">Ad hoc Event</div>
  <q-space />
  <q-separator />
  <div class="q-ml-md">
    <q-input
    v-model="evName"
    filled 
    label="A Goal"
    lazy-rules
    item-aligned
    :rules="[ val => val && val.length > 0 || 'Please type a goal']"
    />
    <div class="radio-select">
      <q-radio class="q-mx-md" v-model="own" val="misc" label="Misc" />
      <q-radio class="q-mx-md" v-model="own" val="self" label="By Self" />
    </div>
    
    <div v-if="pGoals" ><!--style="width: 100%;"  label="Select Parent Goal"-->
      <q-select class="q-gutter-md"
      v-model="daP"
      :options="pGoals"
      option-value="id"
      option-label="title"
      :disable="own!='misc'"
      :label="labely"
      popupContentClass="q-px-md"
      :options-selected-class="goalyColor('c')"
      :label-color="goalyColor('l')"
      />
    </div>
    
    <div>
      duration
      <q-knob
      :min="15"
      :max="120"
      :thickness="0.22"
      :step="5"
      v-model="duration"
      show-value
      label="Duration"
      size="75px"
      color="teal"
      track-color="grey-3"
      class="q-ma-md"
      />
    </div>
  </div>
  <div class="q-mx-md" style="text-align: center;">
    <q-btn flat align="center" label="Cancel" color="primary" @click="$emit('doCancel')"/>
    
    <q-btn elevated color="primary" @click="onClicked"> Add </q-btn>
  </div> 
          <!--
            style="text-align: center;"
            @click="showDefaultEvtByType = !showDefaultEvtByType"
            passing in function prop and then invoke doCancel() worked! huh..but finicky that it's better to emit!
          -->
</template>
<script>
//import { defineComponent } from 'vue' --see about using this...
  export default {  //this be Options Vue notation
    name: 'adHocEvent',
    props: {
      mainGoals: Array,
      //doCancel: Function, // can execute function BUT better to emit...
    },
    data(){
        return {
            aTitle : "",
            daP : null,   //huh seems to work! an m surprised it show the correct stuff even!
            own :"misc",
            duration:15
        }
    },
    emits: [
      //'update:model-value', //redundant since not writing back to parent?--or should have this still for binding via v-model? >>no need
      'saveEvent',
      'doCancel'
    ],
    computed: {
        pGoals:{
            get(){return this.mainGoals},  //no massaging?~? guess not
        },
        evName:{
            get(){return this.aTitle},
            set(value){
                //console.log("setting title", value)
                this.aTitle = value
            }
        },
        labely:{
          get(){
            return this.own =='misc' ? this.daP == null ? 'Defaut Misc. PGoal' : 'Of Parent Goal' : 'Select Parent Goal' //umm sheesh
          }
        },
        //goalyColor:{
        //  get(l){
        //    return this.daP == null ? '' : l == 'c' ? 'bg-'+this.daP.bgcolor : this.daP.bgcolor
        //  }
          //optionsSelectedClass="bg-red"
          //labelColor="green"
        //}

    },
    methods: {
      goalyColor(l){
        return this.daP == null ? '' : l == 'c' ? 'bg-'+this.daP.bgcolor : this.daP.bgcolor
      },
      onClicked () {
        //console.log('huh trying to add event', this.aTitle, this.daP)
        this.$emit('saveEvent', this.aTitle, this.daP, this.own,this.duration)

        //reset--toTest**
        this.own = 'own'
        this.daP = null
        this.duration = 15
      }
    }
}
</script>
<style lang="sass" scoped>
.radio-select
  margin: 0 auto
  padding: 20px
  width: 100%
</style>
