<template>
  <div class="q-pa-sm">
    <q-card>
      <q-card-section>
        <div class="text-h4 title">New Ad hoc Event</div> 
        <div class="q-mx-md do-center"> @ <em>{{ atTime }}</em></div>
      </q-card-section>
      <q-separator />
      
      <div class="q-mx-md event-select">
        <q-input
        v-model="evName"
        filled 
        label="Title"
        lazy-rules
        item-aligned
        :rules="[ val => val && val.length > 1 || 'Please type a goal']"
        />
        <div class="radio-select">
          <q-radio class="q-mx-xs" v-model="own" val="misc" label="Misc" />
          <q-radio class="q-mx-md" v-model="own" val="self" label="By Self" />
        </div>
      
        <div v-if="pGoals" ><!--style="width: 100%;"  label="Select Parent Goal"-->
          <q-select 
          :class="classy()"
          v-model="daP"
          :options="pGoals"
          option-value="id"
          option-label="title"
          :disable="own!='misc'"
          :label="labely"
          popupContentClass="q-px-sm"
          :options-selected-class="goalyColor('c')"
          :label-color="goalyColor('l')"
          >
            <template v-slot:before>
              <q-icon v-if="daP" :name="daP.icon" size="14px" class="q-mx-md q-pr-sm" />
            </template>
          </q-select>
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
      <q-card-actions class="q-px-xl">
        <!--<q-checkbox dense v-model="doForce" label="Force" color="teal"/> -->
        <q-checkbox dense v-model="useBalance" label="Use Balance" color="brown" /> <!--class="q-pa-sm"-->
      </q-card-actions>
      
      <div class="q-ma-md" style="text-align: center;">
        <q-btn flat align="center" label="Cancel" color="primary" @click="$emit('doCancel')"/>
        <q-btn elevated color="primary" align="between" @click="onClicked">       
          <div class="q-mx-xs" style="text-align:center;">
            Add 
          </div>
        </q-btn>
      </div>
      <br>
    </q-card>
  </div>
</template>
<script>
//import { defineComponent } from 'vue' --see about using this...
import { whenFrmtTime} from '../../pages/util/utiFunc'

  export default {  //this be Options Vue notation
    name: 'adHocEvent',
    props: {
      mainGoals: Array,
      toBalance:Number,
      at:String,
    },
    data(){
        return {
            aTitle : "",
            daP : null,   //huh seems to work! an m surprised it show the correct stuff even!
            own :"misc",
            duration:15,
            useBalance:false,
            atTime:whenFrmtTime(this.at)
            //doForce:false, //redundant as implicitely force
        }
    },
    emits: [
      //'update:model-value', //redundant since not writing back to parent?--or should have this still for binding via v-model? >>no need
      'saveEvent',
      'doCancel'
    ],
    computed: {
      pGoals:{
        get(){
          return this.mainGoals
        },  //no massaging?~? guess not
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
          return this.own =='misc' ? this.daP == null ? 'Defaut Misc. Parent' : 'Of Parent Goal' : 'Select Parent Goal' //umm sheesh
        }
      },
    },
    methods: {
      goalyColor(l){
        return this.daP == null ? '' : l == 'c' ? 'bg-'+this.daP.bgcolor + " "+ this.daP?.icon : this.daP.bgcolor
      },
      classy(){  //hannoying gutter class that messes up look when an option is selected
        return this.daP == null ? 'q-gutter-md q-px-md' : "q-px-md"
      },
      onClicked () {
        this.$emit('saveEvent', this.aTitle, this.daP, this.own,this.duration,this.useBalance)

        //reset
        this.own = 'misc'
        this.daP = null
        this.duration = 15

        this.useBalance = false
      }
    }
}
</script>
<style lang="sass" scoped>
.radio-select
  margin: 0 auto
  padding: 20px
  width: 100%
.event-select
  display: flex
  flex-direction: column
  justify-content: center
  text-align: center
  width: 100%
.do-center
  text-align: center
.title
  white-space: nowrap
  text-align:center
@media (max-width: 500px)
  .title
    white-space: break-spaces
    text-align: center
  .radio-select
    display: flex
    flex-direction: row
    justify-content: center
    margin: 0 auto
</style>