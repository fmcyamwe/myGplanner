<template>
    
    <!--
        @onChooseEvent >> chooseExisting

        addEventDialog >> showDefaultEvtByType
        adHocEventDialog >> hideAdHocEventDialog
        pickEventDialog >> showPickEventDialog

        toAddE >> toSchedule

        v-model="showDefaultEvtByType"
    -->
    
    <q-dialog v-model="show" transition-show="rotate" transition-hide="rotate">
        <!-- either newEvent || pick existing event style="padding: 2px 2px;-->
        <q-card v-if="hideAdHocEventDialog">
          <q-card-section>
            <div class="text-h6">Ad hoc or Existing event</div>
          </q-card-section>
          <q-card-actions align="center">
            <q-btn flat label="Add hoc" color="primary" @click="hideAdHocEventDialog = !hideAdHocEventDialog"/>
            <q-btn flat label="Existing" color="primary" @click="onChooseExisting"/>
          </q-card-actions>        
        </q-card>
        <q-card v-else>
          <div class="q-mx-md event-select">
            <ad-hoc-event
              :mainGoals="storedGoals"
              @save-Event="addNewEvent"
            />
            <q-btn flat label="Cancel" color="primary" @click="hideAdHocEventDialog = !hideAdHocEventDialog"/>
          </div>
        </q-card>
    </q-dialog>

    <!--
        huh...can't i put all  q-cards into same dialog?!? see onChooseExisting..
    -->
    <q-dialog v-model="showPickEventDialog" transition-show="rotate" transition-hide="rotate">
        <q-card> <!--style="padding: 2px 2px;"-->
          <q-card-section>
            <div class="text-h3">Select event</div>
          </q-card-section>
          <q-separator />
          <div class="q-ml-md event-select">
            <q-select
            v-model="toAddE" 
            :options="allScheduled"
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
            <q-btn elevated label="Add" color="primary" class="q-mr-md" @click="onAddClicked"/>
          </q-card-actions>
          <!-- could start being too much goals...break down by parentGoal?!? tbd**-->     
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
    pickEventDialog: Boolean, //prolly no need...replaced by showPickEventDialog
    //addEventDialog: Boolean,
    //showDefaultEvtByType:Boolean, //this.addEventDialog 
    
    storedGoals: Array,
    canBeScheduled: Array, //array of objects...
    //toSchedule: Object  //umm usually? though is null at first...prolly no need as well!! 

  },
  data(){
    return{
        hideAdHocEventDialog:ref(true), //true by default...
        showPickEventDialog:ref(false), //toSee using here is better than have to bring down from parent...

        doForce:ref(false), //force schedule and skip asking confirmation from user...
        toAddEE:ref(null), 
        show:ref(true),

    }
  },
  emits: [
    //'onChooseEvent',
    'onAddNewEvent',
    'onPickEvent'
  ],
  computed: {
    toAddE:{ //works?!? and passes value back to parent?@? toTest with toSchedule
        get(){return this.toAddEE}, //this.toSchedule
        set(value){
            this.toAddEE = value
        }
    },
    force:{ //prolly no need either?!? can just set doForce ? toSee if can pass it back**
        get(){return this.doForce},
        set(value){
            this.doForce = value
        }
    },
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
    onAddClicked () {
        //showPickEventDialog = false
       // console.log(`onPickEvent..emitting`,this.toAddE,this.force)
      this.$emit('onPickEvent',this.toAddE,this.force) 
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
        this.hideAdHocEventDialog = false
        this.show = false

        this.showPickEventDialog = true

        //this.$emit('onChooseEvent')
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