<template>
    <!-- either newEvent || pick existing event -->
    <q-dialog v-model="showDefaultOption" transition-show="rotate" transition-hide="rotate" no-esc-dismiss @before-hide="gonHide">
         <!-- style="padding: 2px 2px;
            no-esc-dismiss perhaps and have to use cancel? >>could also handle it by acting as Cancel btn?!? meh better to handle just dismiss from outside as more natural...
            ////@escape-key="gonESC" is not needed
            OR
            no-backdrop-dismiss to not allow dismiss by clicking outside?!?
        -->

        <q-card v-if="showPickyDialog">
          <div class="q-ma-md event-select">
            <!--<select-event
              :unscheduled="allUnscheduled"
              :unscheduledParents="unscheduledPGoals"
              :toBalance="balance"
              :at="selectedTime"
              @on-Pick-Event="onAddClicked"
              @do-Cancel="onCancelBtn"
            />-->
            <altSelectEvent
              :allUnscheduled="unscheduledGoals"
              :unscheduledParents="unscheduledParents"
              :toBalance="balance"
              :at="selectedTime"
              @on-Pick-Event="onAddClicked"
              @do-Cancel="onCancelBtn"
            />
          </div>
        </q-card>
      
        <q-card v-else-if="showAddyDialog"> 
          <div class="q-ma-md event-select">
            <ad-hoc-event
              :mainGoals="parentGoals"
              :toBalance="balance"
              :at="selectedTime"
              @save-Event="adHocNewEvent"
              @do-Cancel="onCancelBtn"
            />
            <q-space/><!--better here?!?-->
          </div>
          <!--<q-space/>toSee look with space...nothing here-->
        </q-card>

        <q-card v-else class="q-mx-auto"> <!-- style="width: 100%;"-->
          <q-card-section>
            <div class="text-h6 choice">Ad hoc or Existing event</div>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn push label="Ad hoc" no-wrap no-caps color="primary" align="between" @click="onChooseAdHoc"/>
            <q-btn push label="Existing" no-wrap no-caps color="primary" align="between" @click="onChooseExisting"/>
          </q-card-actions>        
        </q-card>
    </q-dialog>
</template>
<script>
import {ref, defineAsyncComponent } from 'vue'  //defineComponent,
//import adHocEvent from '../../components/planner/adHocEvent.vue' 
//import selectEvent from '../../components/planner/selectEvent.vue'

import { doLog,deepCopy } from '../../pages/util/utiFunc'
//export default defineComponent ({  //this be Options Vue notation
export default {
  name: 'schedDialog',
  components:{
    adHocEvent: defineAsyncComponent(() => import('../../components/planner/adHocEvent.vue')), //seems good for loading on demand!
    //selectEvent: defineAsyncComponent(() => import('../../components/planner/selectEvent.vue')),
    altSelectEvent: defineAsyncComponent(() => import('../../components/planner/altSelectEvent.vue')), //rework of selectEvent above
  },
  props: {
    parentGoals: Array,
    canBeScheduled: Array, //array of objects...
    balance:Number,
    selectedTime:String //for adhoc selected time
  },
  data(){
    return{
      showPickDialog:ref(false),
      showAdHocDialog:ref(false),
      show:ref(true), //for default dialog show/hide//true by default...
      unscheduledP:ref({}), //[] //filter by parents in selectEvent
      unscheduledParents:ref({}),
    }
  },
  emits: [
    'adHocEvent',
    'onPickEvent',
    'euhHidin'
  ],
  computed: {
    showDefaultOption:{
        get(){return this.show},
        set(value){
            this.show = value
        }
    },
    showPickyDialog:{
      get(){return this.showPickDialog},
      set(value){
        this.showPickDialog = value
      }
    },
    showAddyDialog:{
      get(){return this.showAdHocDialog},
      set(value){
        this.showAdHocDialog = value
      }
    },
    unscheduledGoals:{ //rework of allUnscheduled to fix obj reference that saved pg,ic and color when filtered smh
      get(){
        this.canBeScheduled.forEach((obj) => {
          if(!this.unscheduledParents[obj.parentGoal]){
            //console.log(`unscheduledGoals::ADDING`,obj.parentGoal,obj.title)
            let a = this.parentGoals.find(item => item.id == obj.parentGoal)
            if(a){
              this.unscheduledParents[a?.id] = {id:a?.id,title:a?.title.trim(),ic:a?.icon,color:a.bgcolor} 
            }else{console.log(`unscheduledGoals::ERROR ERROR >>parent not found!!`,obj.parentGoal,obj)}//shouldnt happen!!
          }//else{//present...nothing to do
           // console.log(`unscheduledGoals::Parent Already present`,obj.parentGoal,obj.title)
          //}
        })

        return this.canBeScheduled
      }
    },
    /*unscheduledPGoals:{ //redundant --toRemove**
      get(){
        //console.log(`unscheduledPGoals`,JSON.parse(JSON.stringify(this.unscheduledP)))
        //umm try to turn into array here mayhaps?--not too expensive?
        let ret = []
        for (let key in this.unscheduledP){ //this.unscheduledP
          ret.push(this.unscheduledP[key]) //this.unscheduledP
        }
        //console.log(`unscheduledPGoals`,JSON.parse(JSON.stringify(this.unscheduledP)),JSON.parse(JSON.stringify(ret)))
        doLog(`schedDialog::unscheduledPGoals`,this.unscheduledP,ret) //JSON.parse(JSON.stringify(this.unscheduledP)),JSON.parse(JSON.stringify(ret))
        return ret //this.unscheduledP
      },
      //set(value){ //no need..
      //  
      //}
    },*/
    /*allUnscheduled:{
        get(){
          //console.log(`allUnscheduled`,JSON.parse(JSON.stringify(this.canBeScheduled)), JSON.parse(JSON.stringify(this.parentGoals)) )

          this.canBeScheduled.forEach((obj) => { //have to use deep-copy here as reference make changes saved to localStorage --toReview***

            let a = this.parentGoals.find(item => item.id == obj.parentGoal)
            
            a ? obj.color = a.bgcolor : obj.color = ''
            obj.pg = a?.title.trim() //useful for label--could move into this.unscheduledP ? toReview**
            obj.ic = a?.icon //toSee if can use instead of 'pg' above..toReview**

            //this.unscheduledP.push({id:a?.id,title:a?.title.trim()}) //toSee** if anything else..or could just push whole pGoal?
            !this.unscheduledP[a?.id] ? this.unscheduledP[a?.id] = {id:a?.id,title:a?.title.trim()} : '' //console.log(`allUnscheduled..present!`,this.unscheduledP[a?.id])
            //if(!this.unscheduledP[a?.id]){
            //}
          })

          //console.log(`allUnscheduled..AFTER..needed?`,JSON.parse(JSON.stringify(this.canBeScheduled)))
          return this.canBeScheduled
        },
    }*/
  },
  methods: {
    onAddClicked(toAdd,forceFlag,useBalance,newDura){
      //console.log(`onPickEvent..emitting`,toAdd,forceFlag)
      this.$emit('onPickEvent',toAdd,forceFlag,useBalance,newDura)
      this.reset()
    },
    adHocNewEvent(aTitle, daP, own, duration,useBalance) {
      //console.log(`addAdHocEvent..emitting`,aTitle, daP, own, duration)
      this.$emit('adHocEvent',aTitle, daP, own, duration,useBalance)
      this.reset() 
    },
    onChooseExisting(){ // hide the main dialog and show the pickEvent dialog
      //toSee if doing it here better instead of triggering in parent? >>waay better in here!
      
      this.showPickyDialog = !this.showPickyDialog

      //reset showAddyDialog?!? no need prolly
    },
    onChooseAdHoc(){ // hide the main dialog and show the Ad-Hoc Event dialog
     
      this.showAddyDialog = !this.showAddyDialog  //to show ad-hoc

      //this.showPickyDialog = !this.showPickyDialog // no need to toggle prolly
    },
    gonHide(){ 
      //console.log(`gonHide...about to hide...showPicky: showAdHoc`, this.showPickyDialog,this.showAddyDialog,this.selectedTime)

      this.$emit('euhHidin') //needed to reset parent's  
    },
    //gonESC(){ //thrown bfre before-hide >>no need with no-esc-dismiss flag!
    //    console.log(`gonESC...ESC?!?`)
       // this.$emit('euhHidin')
    //},
    onCancelBtn(){
      let wasSelect = this.showPickyDialog
      let wasAdHoc = this.showAddyDialog
      
      if (wasSelect){ //was using Select dialog
        this.showPickyDialog = !this.showPickyDialog

      } else { //was on ad-hoc dialog  //should do in own if?!?no need!

        this.showAddyDialog = !this.showAddyDialog
        //console.log(`onCancelBtn...AddHocDialog?${wasAdHoc} now: and select:`,this.showAddyDialog,wasSelect)
      }
      //console.log(`onCancelBtn...was Select?${wasSelect} or adHoc?${wasAdHoc}`,this.showPickyDialog,this.showAddyDialog)
         
      //call reset()? prolly no need
    },
    reset(){ 
      //console.log(`RESETTIN..`,this.showAddyDialog,this.showPickyDialog)
      this.showAddyDialog = false
      this.showPickyDialog = false

    }
  }
} //)
</script>
<style lang="sass" scoped>
.radio-select
  display: flex
  justify-content: center
  margin:0 auto
  width: 100%
  padding-inline:30px
.choice
  justify-content: center
  align-items: center
  text-align: center
  margin:0 auto

@media (max-width: 500px)
  .choicey
    font-size: 0.8em
  .forMobile
    display: block
    z-index: 9
</style>

<!-- original stuff
      q-dialog v-model="addEventDialog" transition-show="rotate" transition-hide="rotate">
       -- either newEvent || pick existing event style="padding: 2px 2px;--
      <q-card v-if="adHocEventDialog">
        <q-card-section>
          <div class="text-h6">Ad hoc or Existing event</div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn flat label="Add hoc" color="primary" @click="adHocEventDialog = !adHocEventDialog"/>
          <q-btn flat label="Existing" color="primary" @click="onChooseEvent"/>
        </q-card-actions>        
      </q-card>
      <q-card v-else>
        <div class="q-mx-md event-select">
          <ad-hoc-event
            :mainGoals="storedMainG"
            @save-Event="onAddNewEvent"
          />
          <q-btn flat label="Cancel" color="primary" @click="adHocEventDialog = !adHocEventDialog"/>
        </div>
      </q-card>
     </q-dialog>

     <q-dialog v-model="pickEventDialog" transition-show="rotate" transition-hide="rotate">
      <q-card> --style="padding: 2px 2px;"--
        <q-card-section>
          <div class="text-h3">Select event</div>
        </q-card-section>
        <q-separator />
        <div class="q-ml-md event-select">
          <q-select
          v-model="toAddE" 
          :options="canbeScheduled"
          option-value="id"
          option-label="title"
          label="Sub Goal"
          item-aligned
          popupContentClass="q-gutter-md"
          />
        </div>
        <q-card-actions align="center">
          <q-checkbox dense v-model="force" label="Force" color="teal" class="q-pa-sm" />
        </q-card-actions>
        <q-card-actions align="evenly">
          <q-btn elevated label="Add" color="primary" class="q-mr-md" @click="onPickEvent"/>
        </q-card-actions>
      </q-card>
     </q-dialog> 
    -->
   