<template>
    <!-- either newEvent || pick existing event -->
    <q-dialog v-model="hideAdHocEventDialog" transition-show="rotate" transition-hide="rotate" no-esc-dismiss @before-hide="gonHide">
         <!-- style="padding: 2px 2px;
            no-esc-dismiss perhaps and have to use cancel? >>could also handle it by acting as Cancel btn?!? meh better to handle just dismiss from outside as more natural...
            ////@escape-key="gonESC" is not needed
            OR
            no-backdrop-dismiss to not allow dismiss by clicking outside?!?
        -->
        <q-card v-if="showDefaultEvtByType">
          <q-card-section>
            <div class="text-h6">Ad hoc or Existing event</div>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn flat label="Add hoc" color="primary" @click="showDefaultEvtByType = !showDefaultEvtByType"/>
            <q-btn flat label="Existing" color="primary" @click="onChooseExisting"/>
          </q-card-actions>        
        </q-card>
        <q-card v-else>
          <div class="q-ma-md event-select">
            <ad-hoc-event
              :mainGoals="storedGoals"
              @save-Event="addNewEvent"
              @do-Cancel="onCancelBtn"
            />
            <!-- bof moved into ad-hoc-event coliiis as dont work with flag >>onCancelPickEvent('ad-hoc')--meh can just look at current state!
                <q-btn flat align="center" label="Cancel" color="primary" @click="showDefaultEvtByType = !showDefaultEvtByType"/> -->
            <q-space/><!--better here?!?-->
          </div>
          <!--<q-space/>toSee look with space...nothing here-->
        </q-card>
    </q-dialog>

    <!--
        huh...can't i put all  q-cards into same dialog?!? see onChooseExisting..
    -->
    <q-dialog v-model="showPickEventDialog" transition-show="rotate" transition-hide="rotate" no-esc-dismiss @before-hide="gonHide">
        <q-card> <!--style="padding: 2px 2px;"-->
          <q-card-section>
            <div class="text-h3">Select event</div>
          </q-card-section>
          <q-separator />
          <div class="q-ma-md event-select">
            <!-- could start being too much goals...break down by parentGoal?!? tbd**-->
            <q-select
            v-model="toAddE" 
            :options="allScheduled"
            option-value="id"
            option-label="title"
            label="Sub Goal"
            item-aligned
            borderless
            popupContentClass="q-gutter-md"
            />
          </div>
          <q-card-actions align="center">
            <q-checkbox dense v-model="doForce" label="Force" color="teal" class="q-pa-sm" />
          </q-card-actions>
          <q-card-actions align="center">
            <q-btn flat label="Cancel" color="primary" @click="onCancelBtn"/>
            
            <q-btn elevated color="primary" @click="onAddClicked"> Add </q-btn>
          </q-card-actions>
          <!--<q-card-actions align="evenly">
            <q-btn flat align="center" label="Cancel" color="primary" @click="onCancelPickEvent"/>
          </q-card-actions>  -->
        </q-card>
       </q-dialog>
</template>
<script>
import { defineComponent, ref } from 'vue'
import adHocEvent from '../../components/planner/adHocEvent.vue'

export default defineComponent ({  //this be Options Vue notation
  name: 'schedDialog',
  components:{
    adHocEvent,
  },
  props: {
    //adHocEventDialog: Boolean, //not needed as local here...
    //doForce: Boolean, //same as above prolly
    //pickEventDialog: Boolean, //prolly no need as well...
    //addEventDialog: Boolean,
    //showDefaultEvtByType:Boolean, //this.addEventDialog 
    
    storedGoals: Array,
    canBeScheduled: Array, //array of objects...
    //toSchedule: Object  //umm usually? though is null at first...prolly no need as well!! 

  },
  data(){
    return{
        hideAdHocEventDialog:ref(true), //true by default...
        showPickEventDialog:ref(false),
        show:ref(true), //for default dialog show/hide

        doForce:ref(false), //force schedule and skip asking confirmation from user...
        toAddEE:ref(null), 
    }
  },
  emits: [
    //'onChooseEvent',
    'onAddNewEvent',
    'onPickEvent',
    'euhHidin'
  ],
  computed: {
    toAddE:{ //works?!? and passes value back to parent?@? toTest with toSchedule
        get(){return this.toAddEE}, //this.toSchedule
        set(value){
            this.toAddEE = value
        }
    },
    /*//prolly no need either?!? ? toSee if can just set doForce and send it back*** 
    force:{ 
        get(){return this.doForce},
        set(value){
            this.doForce = value
        }
    },*/
    showDefaultEvtByType:{ //reads and set locally? ...prolly no need if using cards with show/hide booleans?
        get(){return this.show},
        set(value){
            this.show = value
        }
    },
    allScheduled:{
        get(){return this.canBeScheduled},
        //set?!? >>no need!
    }
  },
  methods: {
    onAddClicked(){
       // console.log(`onPickEvent..emitting`,this.toAddE,this.force)
      this.$emit('onPickEvent',this.toAddE,this.doForce) 
      //also have to transmitt toAddE? toTest
    },
    addNewEvent(aTitle, daP, own, duration) {//pass in the arguments like so?!? >>yup
        //console.log(`addNewEvent..emitting`,aTitle, daP, own, duration)
      this.$emit('onAddNewEvent',aTitle, daP, own, duration)  
    },
    onChooseExisting(){ //
        //so hide the main dialog and show the pickEvent dialog
        //toSee if doing it here better instead of triggering in parent? >>waay better in here!
        //using cards in dialog ?!? toSee**
        this.hideAdHocEventDialog = true //false
        //this.show = false

        this.showPickEventDialog = true

        //this.$emit('onChooseEvent')
    },
    gonHide(){ 
        //console.log(`gonHide...about to hide?!?`)
        this.$emit('euhHidin')
    },
    //gonESC(){ //thrown bfre before-hide >>no need with no-esc-dismiss flag!
    //    console.log(`gonESC...ESC?!?`)
       // this.$emit('euhHidin')
    //},
    onCancelBtn(){ //data

        let wasPickEvt = this.showPickEventDialog

        console.log(`onCancelBtn...with PickDialog?${wasPickEvt}`)
        if (wasPickEvt){
             this.showPickEventDialog = false
        } else {
            this.showDefaultEvtByType = !this.showDefaultEvtByType //works?!? or have to change var?!? >>huh seems to work!!
        }
         
        //call reset() as well??!?
    },
    reset(){ //reset some vars...should use prolly
        //this.force = false  || this.doForce = false ?!? ...toTest*** with both

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
   