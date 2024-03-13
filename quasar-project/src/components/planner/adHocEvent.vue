<template>
    <div class="q-calendar__ellipsis">
        <div class="text-h6">adHocEvent</div>
        <div class="q-ml-md q-gutter-md">
            <q-input
                v-model="evName"
                filled
                label="A Goal"
                lazy-rules
                item-aligned
                :rules="[ val => val && val.length > 0 || 'Please type a goal']"
            />
        </div>
        <div v-if="pGoals" ><!--style="width: 100%;"-->
            <q-select class="q-ml-md"
            v-model="daP" 
            :options="pGoals"
            option-value="id"
            option-label="title"
            :disable="own!='misc'"
            label="Parent Goal" />
        </div> 
        <div class="radio-select">
            <q-radio v-model="own" val="misc" label="Misc" />
            <q-space />
            <q-radio v-model="own" val="self" label="Self" />
        </div>
        <div style="text-align: center;">
           <q-btn
            flat 
            label="Add" 
            color="primary" 
            @click="onClicked"/> 
        </div>
        
    </div>
</template>

<script>
  export default {  //this be Options Vue notation
    name: 'adHocEvent',
    props: {
      mainGoals: Array
    },
    data(){
        return {
            aTitle : "",
            daP : null,   //huh seems to work! an m surprised it show the correct stuff even!
            own :"misc"
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
        this.$emit('saveEvent', this.aTitle, this.daP, this.own)  //no need to reset vars??!? toTEST**
      }
    }
}
</script>
<style lang="sass" scoped>
.radio-select
  display: flex
  justify-content: center
  margin:0 auto
  width: 100%
  padding-inline:30px
</style>
