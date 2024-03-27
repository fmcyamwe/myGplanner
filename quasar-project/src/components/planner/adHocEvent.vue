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
            <div v-if="pGoals" ><!--style="width: 100%;"-->
                <q-select class="q-mx-md"
                v-model="daP" 
                :options="pGoals"
                option-value="id"
                option-label="title"
                :disable="own!='misc'"
                label="Select Parent Goal" />
            </div>
        
            <div>
                Duration
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
        <div style="text-align: center;">
           <q-btn
            flat 
            label="Add" 
            color="primary" 
            @click="onClicked"/> 
        </div> 
</template>

<script>
//import { defineComponent } from 'vue' --see about using this...
  export default {  //this be Options Vue notation
    name: 'adHocEvent',
    props: {
      mainGoals: Array
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
      'saveEvent'
    ],
    computed: {
        pGoals:{
            get(){return this.mainGoals},  //no massaging?~?
        },
        evName:{
            get(){return this.aTitle},
            set(value){
                //console.log("setting title", value)
                this.aTitle = value
            }
        }
    },
    methods: {
      onClicked () {
        //console.log('huh trying to add event', this.aTitle, this.daP)
        this.$emit('saveEvent', this.aTitle, this.daP, this.own,this.duration)

        //reset--toTest**
        this.own = 'own'
        this.P = null
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
