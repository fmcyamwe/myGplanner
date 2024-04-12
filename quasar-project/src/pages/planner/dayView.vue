<template>
  <div v-if="showForm" class="q-gutter-md">
    <q-btn
      class="q-pl-xl justify-center"
      color=""
      text-color="green"
      elevated
      label="HideForm"
      @click="showGoalForm = !showGoalForm"
      no-caps
    />
     <add-goal-form /> 
  </div>
 
  <div v-if="!showForm" class="subcontent">
   <q-pull-to-refresh @refresh="onRefresh"> <!--have to put here or drag in calendar does this refresh when it shouldnt-->
    <navigation-bar
      @today="onToday"
      @prev="onPrev"
      @next="onNext"
    />
   
    <div class="float-right">
        <div v-if="showReloadBtn">
            <sched-btn
            text-label="Reload"
            class="q-mt-xl"
            text-color="green"
            @do-btn-action="onReloadSaved"
            />
        </div>
        <!--clear button, shown:scheduled evts and erase whole day, 
          changes to schedule like prio or score...
          basically when have stuff..
          also only for present and future
          ask for past?!?bof
        -->
        <div v-if="showClearBtn">
          <sched-btn
          text-label="Clear"
          class="q-mt-xl"
          text-color="lime-5"
          @do-btn-action="onClearDay"
          />
      </div>

        <div v-if="showLoadDefaults"><!--disable instead of hiding?!? TBD*** -->
          <sched-btn
          text-label="Defaults"
          class="q-mt-xl"
          text-color="blue"
          @do-btn-action="onLoadDefault"
          />
        </div>

        <div v-if="showScoreBtn">
          <sched-drop-btn
          class="q-mt-xl"
          text-color="teal"
          :disableBtn="disableScoreBtn"
          :optionLabel="chosenScoreLabel"
          :daOptions="scoreOptions"
          @do-reload="onReloadWithScore"
          @choose-option="chooseScore"
          />
        </div>

        <div v-if="showPrio">
          <sched-drop-btn
          class="q-mt-xl"
          text-color="teal"
          :disableBtn="disablePrioBtn"
          :optionLabel="chosenPrioLabel"
          :daOptions="setGoalsPrio()"
          @do-reload="onReloadWithPrio"
          @choose-option="choosePrio"
          />
        </div>
    </div>
   </q-pull-to-refresh>
   
   <div class="row justify-center">
     <div style="display: flex; max-width: 800px; width: 100%; height: 400px;">
       <q-calendar-day
         ref="calendar"
         view="day"
         v-model="currentDate"
         :drag-enter-func="onDragEnter"
         :drag-over-func="onDragOver"
         :drag-leave-func="onDragLeave"
         :drop-func="onDrop"
         animated
         bordered
         hoverable
         no-active-date
         transition-next="slide-left"
         transition-prev="slide-right"
         time-clicks-clamped
         :interval-minutes="15"
         :interval-count="96"
         :interval-height="28"
         :selected-start-end-dates="startEndTimes"
         @change="onChange"
         @click-date="onClickDate"
         @click-time="onClickTime"
         @click-interval="onClickInterval"
         @click-head-intervals="onClickHeadIntervals"
         @click-head-day="onClickHeadDay"
         @mousedown-time="onMouseDownTime"
         @mouseup-time="onMouseUpTime"
         @mousemove-time="onMouseMoveTime"
       >
       <!--
         dark
         @mouseenter-time="onMouseEnter"
         @mouseleave-time="onMouseLeave" works!!
         the drop-func seem to fire when other drag functions are present as well
         adding drag-start-func/drag-end in calendar as below doesnt do anything
         :drag-end-func="onDragEndy"
         :drag-start-func="onDragStarty"

         click-time and mouseup-time are almost the same with diff in event(PointerEvent vs MouseEvent)
         
         :interval-start="24" >>to start at 7am
         :interval-count="68" >>oldie
         :selected-start-end-dates="startEndTimes" >>need for/used for range selection!

         time-clicks-clamped >>what does that do? >>ngo for selecting interval-minute instead of the timestamp where clicked...
           **toTest impact of removing it for the adjustCurrentTime?

         see if touch-...events fire--TODO
         also diff between event-time or event-day?

         also remove one of onMoved or onChange as fires twice and have to redundant handle both**
         @moved="onMoved"
         -->
         <template #head-day-event="{ scope: { timestamp } }">
           <div style="display: flex; justify-content: center; flex-wrap: wrap; padding: 2px;">
             <template
               v-for="event in eventsMap[timestamp.date]"
               :key="event.id"
             >
               <q-badge
                 v-if="!event.time"
                 :class="badgeClasses(event, 'header')"
                 :style="badgeStyles(event, 'header')"
                 style="width: 100%; cursor: pointer; height: 12px; font-size: 10px; margin: 1px;"
               >
                 <div class="title q-calendar__ellipsis">
                   {{ event.title }}
                   <q-tooltip>{{ event.details }}</q-tooltip>
                 </div>
               </q-badge>
               <q-badge
                 v-else
                 :class="badgeClasses(event, 'header')"
                 :style="badgeStyles(event, 'header')"
                 style="margin: 1px; width: 10px; max-width: 10px; height: 10px; max-height: 10px; cursor: pointer"
                 @click="scrollToEvent(event)"
               >
                 <q-tooltip>{{ '('+ event.id +')' + event.title +' - '+ event.time  }}</q-tooltip>
               </q-badge>
             </template>
           </div>
         </template>

         <template #day-container="{ scope: { days }}">
           <template v-if="hasDate(days)">
             <div
               class="day-view-current-time-indicator"
               :style="style"
             />
             <div
               class="day-view-current-time-line"
               :style="style"
             />
           </template>
         </template>
         <template #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }">
           <template
             v-for="event in getDateEvents(timestamp.date)"
             :key="event.id"
           >
             <div
               v-if="event.time !== undefined"
               class="my-event"
               :class="badgeClasses(event, 'body')"
               :style="badgeStyles(event, 'body', timeStartPos, timeDurationHeight)"
               :draggable="true"
               @dblclick.prevent="(e) => onDblClickEvent(e, event)"
               @dragstart.stop="(e) => onDragStart(e, event)"
               @dragend.stop="onDragEnd"
               @drop="(e) => onDrop(e, 'goal-item', scope)"
               @dragenter="(e) => onDragEnter(e, 'goal-item', scope)"
               @dragover="(e) => onDragOver(e, 'goal-item', scope)"
              >
               <!--<div class="title q-calendar__ellipsis"> -->
                 <!--{{ event.title }}
                 <q-tooltip>{{ event.time + ' - ' + event.details + ' :'+ event.score }}</q-tooltip> -->
                 <!-- interfere with double click for removing when enabled..toSee if using component would help -->
                 <!--auto-save needed but should find way to capture this as well as user could click outside popup without saving!-->
                 
                 <!--<q-popup-edit v-model="event.score" auto-save v-slot="scope" :disable="disabledScoreEvts[event.id]" @save="(e)=>onSaveScore(e,event.id)">
                   <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set" /> 
                   //counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...
                    >>**DEF check if can trigger all the events properly in goaly-end!
                 </q-popup-edit>-->

                 
                 <goaly-end
                   :disabledScore="disabledScoreEvts[event.id]"
                   :title="event.title"
                   :id="event.id"
                   :startTime="event.time"
                   :score="event.score"
                   :details="event.details"
                   :happeningNow="hasStarted[event.id] ? hasStarted[event.id] : false"
                   @end-now="onEndNow"
                   @save-score="onSaveScore"
                   @delete-now="(e) =>removeEvtInSchedule(event,e)"
                  /><!--pass :hidden="flag" to hide delete btn when inPast? or handle it?-->

               <!--</div>-->
             </div>
           </template>
         </template>
       </q-calendar-day>
     </div>
     
     <!--
      showPickEventDialog=pickEventDialog >> dont work
      :doForce="force" works? as not a prop.... >>warning Extraneous non-props and doesnt open...
      :showDefaultEvtByType="addEventDialog" >>mutating prop error
     
     :parentGoals="storedMainG() || storedPG()
      -->
     <sched-dialog v-if="addEventDialog"
     :parentGoals="storedCompPG"
     :canBeScheduled="canbeScheduled"
     @on-add-new-event="onAddNewEvent"
     @on-pick-event="onPickEvent"
     @euh-hidin="closingDialog"
     />
         
    </div>
   <div class="row justify-center" >
     <q-btn
         class="q-mt-xl"
         color="Green"
         text-color="blue"
         elevated
         label="SaveSchedule"
         :disable="doDisableSaveSchedule"
         @click="doSaveSchedule"
         no-caps
     />
     <q-btn
         class="q-mt-xl"
         color=""
         text-color="green"
         elevated
         label="ShowForm"
         @click="showGoalForm = !showGoalForm"
         no-caps
     />
   </div>
   <br>
   <div v-if="treeGoals.length > 0" class="q-pa-xl bg-grey-12" style="max-width: 400px">
    <div class="row justify-center"> {{labelGoals()}} </div>
    <q-separator />
    <!--<q-space/> have to be inside qComponent-->
    <br>
    <q-tree
      :nodes="treeGoals"
      node-key="label"
      v-model:expanded="expanded"
      no-connectors
      dense
      default-expand-all>

      <!--class="row items-center" :style="titleStyles(prop.node)"-->
      <template v-slot:default-header="prop">
          <div :class="classyColor(prop.node)">
            <q-icon :name="prop.node.icon || 'arrow'" size="28px" class="q-mr-sm" />
            <div class="q-mr-sm text-weight-bold" size="28px">{{ prop.node.label }}</div>
          </div>
        </template>
      <template v-slot:default-body="prop">
          <div v-if="prop.node.isChildren">
            <span class="text-weight-bold">  >> {{ prop.node.details }} </span>
          </div>
          <span v-else class="text-weight-light text-black" >{{ prop.node.details }}</span>
        </template>
      </q-tree>
   </div>
  <!--<div class="scroll overflow-auto" style="height: 360px; width: 100%;"> text-white 
       <div v-for="(event, index) in storedEvents" :key="index" class="col-12" style="font-size: 14px; line-height: 10px; max-height: 14px; min-height: 14px; padding: 2px 2px; white-space: nowrap;">
         {{ event }}
         <q-space />
       </div>
   </div>-->
 </div>
</template>
<script>
import {
  QCalendarDay,
  addToDate,
  parseTimestamp,
  isBetweenDates,
  diffTimestamp,
  getDateTime,
  getDayTimeIdentifier,
  getTimeIdentifier, //should use this actually for overlap calc? toSee
  getDayIdentifier,
  today,
  parsed,
  parseDate,
  parseTime,  //isOverlappingDates
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarDay.sass'
import { defineComponent,ref } from 'vue'
import NavigationBar from '../../components/NavigationBar.vue'
import { isMobile } from '../util/isMobile'
import { applyClasses, applyStyles, pGColors } from '../util/utiFunc'
import addGoalForm from '../planner/goalForm.vue'
import GoalyEnd from '../../components/planner/goalyEnd.vue'
//import adHocEvent from '../../components/planner/adHocEvent.vue'
import schedBtn from '../../components/planner/schedBtn.vue'
import schedDropBtn from '../../components/planner/reloadDropDBtn.vue'
import schedDialog from '../../components/planner/schedDialog.vue'
import { useGoalStore } from 'stores/goalStorage'
import { useQuasar } from 'quasar'

function isLeftClick (e) {
return e.button === 0
}

//umm move other function here as the above? --ToReview

export default defineComponent({
name: 'dayCalendar',
components: {
  NavigationBar,
  QCalendarDay,
  addGoalForm,
  GoalyEnd,
  //adHocEvent,
  schedBtn,
  schedDropBtn,
  schedDialog
},
data () {
  const draggedItem = ref(null)
  const targetDrop = ref(null)

  const currentTime = ref(null)

  //const endTimesSet = ref(new Set())//ref(null) //set of end times for scheduled events for lookup when adjusting time!
  //const startTimesSet = ref(new Set())//ref(null) //bon same as above--just to know when starting an event
  
  const allEvents = ref(null)  //bring up all subgoals from storage by default //keep reference to it without change and not reload too much from storage?
  const pGoals = ref(null)  //smh parentGoals...see parentGs below

  const $q = useQuasar()
  let intervalId = null

  let possibleRange = null //for adhoc scheduling...keep track of selected time range


  return {
    currentDate: ref(today()),
    scoreOptions:ref([1,2,3,4,5]),
    chosenScore:ref(null),
    chosenPrio:ref(null),
    scheduledEvents: [], //for scheduled events currently viewed--can change...prolly no need to put in return BUT have to in order to be set initially and accessed.
    dailyScheduled:ref(new Map()), //not sure about using ref here and the two Sets below...toReview**
    endTimesSet: ref(new Set()),
    startTimesSet: ref(new Set()),

    disablePrioBtn: ref(true),  //to temp disable when selecting a new value...
    disableScoreBtn: ref(true),

    calendar: ref(null),
    store:useGoalStore(),

    anchorTimestamp: ref(null), //start time for range
    otherTimestamp: ref(null),   //end time for range...
    mouseDown: ref(false),
    mobile: ref(true),

    timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update

    showGoalForm: ref(false), //showing addGoal form
    //pickEventDialog:ref(false), //showing pick event to schedule dialog ..no need
    addEventDialog: ref(false),
    
    disabledScoreEvts:ref({}),
    hasStarted:ref({}),  //just for happening now..toReview as too much variables esti! and should combine with disabledScoreEvts var above!

    disableSaveSchedule:ref(true),
    //force:ref(false),  //skip confirming for default time changes--placed in inner component...
    showReloadBtn:ref(false), //when date has saved events that are not default--or reset day schedule to initial saved schedule..if user havent overwritten it? toReview**
    showLoadDefaults:ref(true), //load default events...
    showScoreBtn:ref(false), //schedule by score
    showPrio:ref(false),  //for showing prioritiy button...
    showClearBtn:ref(false),

    treeGoals:ref([]), 
    expanded:ref([]), //to hold expanding parentGoals...
    parentGs:ref(null) //test for reactivity!--redundant though--toRemove***
  }
},
beforeMount() {
  this.mobile = isMobile()  //--for drag for range selection.
 
  //this should just load all events--nothing else--prolly
  //in onChange is where to setDate and other props...prolly..unless there is a reason that not doable there?
  //this.scheduledEvents = this.addPropsEventsTo(null, this.returnNewEvts(true)) //[...e] //does update!

  this.resetGoalEvts(true)
  this.constructTree()
  
  //this.startTimesSet = new Set()
  //this.dailyScheduled = new Map()  //here it's not a proxy map...


},
beforeUnmount() {
  clearInterval(this.intervalId)
},
mounted() {
  this.adjustCurrentTime()
  // adjust the time every minute
  this.intervalId = setInterval(() => {
      this.adjustCurrentTime()
  }, 60000)
},

computed: {
  chosenScoreLabel() { 
    return this.chosenScore == null ? `By Score` : `Score >= ${this.chosenScore}` 
  },
  chosenPrioLabel() { 
    return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
  },
  style () {
    return {
      top: this.timeStartPos + 'px'
    }
  },
  showForm() { //return
    if (!this.showGoalForm) {this.constructTree();console.log(`newTree..`)}
    return this.showGoalForm
  },
  doDisableSaveSchedule(){
      return this.disableSaveSchedule 
  },
  hasEventsForDate(){ //add date param? default to null maybe...TBD 
    return this.store.hasEventsForDate(this.currentDate)
  },
  eventsMap () {// convert the events into a map of lists keyed by date
    const map = {}
    this.scheduledEvents.forEach(event => {
      if (!map[ event.date ]) {
        map[ event.date ] = []
      }
      map[ event.date ].push(event)
      if (event.days) {
        console.log(`eventsMap multiple days? event for ${event.date}`, event.days) //when this happens? could happen if add #days--except start from the event.date + #days---meh to see about useing
        let timestamp = parseTimestamp(event.date)
        let days = event.days
        do {
          timestamp = addToDate(timestamp, { day: 1 })
          if (!map[ timestamp.date ]) {
            map[ timestamp.date ] = []
          }
          map[ timestamp.date ].push(event)
        } while (--days > 0)
      }
    })
    //console.log("eventsMap", map)
    return map
  },
  /*parentGoalsMap() { //smh never seems to update!--moved in methods
      /*const map = new Map()
      //this.pGoals = this.storedCompPG
      //let mG = this.parentGs //smh neither >> this.storedCompPG// nope > this.storedPG()  //this.storedMainG()
      let mG =  this.storedCompPG
      if (!mG){ //!this.pGoals
          console.log('parentGoalsMap is empty or null', mG)
          return map
      }

      mG.forEach(obj => { //umm?!?this.storedMainG() //this.pGoals
          map.set(obj.id, obj);
      })

      console.log('parentGoalsMap', map) //JSON.stringify(e)
      
      //return map
      return this.bonAnother()  
  },*/
  //dropdown for adding evts that are not already scheduled.
  //when all are present, shows them all to change schduled timeslot 
  canbeScheduled() {
    let e = this.deepCopy(this.storedEvents)
    
    // filter out events that are already scheduled
    let difference =  e.filter(x => !this.scheduledEvents.find(item => item.id == x.id)); // these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1

    //console.log('canbeScheduled difference is', JSON.parse(JSON.stringify(difference)))
    
    //oldie >> id...prolly better to use parentGoal for grouping instead of id as subG can be added/removed.
    //--mais bon could end up with subGs out of order of creation...meh
    //ALSO with randomize id generation,latest might not have higher id than earlier goal!!
    let sorty = (a, b) => { 
      if (a.parentGoal > b.parentGoal) return 1; 
      if (a.parentGoal == b.parentGoal) return 0; 
      if (a.parentGoal < b.parentGoal) return -1;
    }

    if (difference.length == 0) {//return allGoals!
      e.sort(sorty)
      //console.log('canbeScheduled no difference', difference.length, e.length)
      return e
    }
    
    difference.sort(sorty)

    //console.log('canbeScheduled AFTER sort ',JSON.parse(JSON.stringify(difference)))
    
    return difference

    /*//neat! but shorter above :)
    const toRet = []
    
    const hasEvt = taskID => {
      return this.scheduledEvents.find(item => item.id == taskID) 
    }
    e.forEach(obj => { 
         let h = hasEvt(obj.id)
         if (!h){
          toRet.push(obj)
         }else{console.log('hasEvt found',h) }
      })
  
    console.log('canBeAdded toRet is', toRet) */
  },
  storedEvents(){
    return this.store.getSubGoals
  },
  //storedMainG(){ //see if moving in methods updates....
  //  return this.store.getMainGoals
  //},
  storedAlternatives(){ //umm good idea to put in computed? does it update?!?
    return this.store.fetchAlternativeEvts()
  },
  //some computed for the range interval
  startEndTimes() { 
    const dates = []
    if (this.anchorDayTimeIdentifier !== false && this.otherDayTimeIdentifier !== false) {
      if (this.anchorDayTimeIdentifier <= this.otherDayTimeIdentifier) {
        //console.log("startEndTimes..anchor <= otherDayTime",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp))
        dates.push(getDateTime(this.anchorTimestamp), getDateTime(this.otherTimestamp))
      }
      else {
        //console.log("startEndTimes..otherDayTime <= anchor",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp))
        dates.push(getDateTime(this.otherTimestamp), getDateTime(this.anchorTimestamp))
      }
    }
    return dates
  },
  anchorDayTimeIdentifier() {
    if (this.anchorTimestamp !== null) {
      return getDayTimeIdentifier(this.anchorTimestamp)
    }
    return false
  },
  otherDayTimeIdentifier() {
    if (this.otherTimestamp !== null) {
      return getDayTimeIdentifier(this.otherTimestamp)
    }
    return false
  },
  storedCompPG(){
    return this.storedPG()  //this.store.getMainGoals
  },
 },

 methods: {
  parentGoalsMap(){ //at least now it's up to date esti!! runs too much tho?!?
    const map = new Map()
    //this.pGoals = this.storedCompPG
    //let mG = this.parentGs //smh neither >> this.storedCompPG// nope > this.storedPG()  //this.storedMainG()
    //see about using 
    let mG =  this.storedPG()//this.storedCompPG >> will update here in methods? >>nope!
    if (!mG){
      console.log('parentGoalsMap is empty or null', mG)
      return map
    }

    mG.forEach(obj => {
      map.set(obj.id, obj);
    })

    //console.log('parentGoalsMap size>>', map.size) //JSON.stringify(e)
      
    return map
    
  },
  storedPG(){
    if (this.parentGs == this.store.getMainGoals){ //triple equal sign for reference check..never goes here though smh..see with double equal sign
      console.log("storedPG SAME!!!!") //ever get this?!? dont seem so... toMonitor**
      return this.parentGs 
    }

    this.parentGs = this.store.getMainGoals
    return this.parentGs
  },
  constructTree(){
    this.treeGoals = this.store.fetchGoalsTree()
  },
  badgeClasses (event, type) {
    return applyClasses(event, type)
  },
  badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
    return applyStyles(event, type, timeStartPos, timeDurationHeight)
  },
  classyColor(proppy){//bg-{color} or text-{color} in class
    return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
  },
  /*titleStyles(proppy){ //toRemove**
    const s = {}
    let isDig = /\d/g  //is a digit
    
    if (proppy && proppy.color && !proppy.isChildren){//smh workaround for the composed colors >> SO UGLY!!!--redone with classyColor() above
      let e = proppy.color.split('-')
      if (e.length > 1) {
        //console.log("titleStyles doubles>>", e)
        if (e[1].match(isDig)){
          //console.log("titleStyles isDIGS>>", e[1],e[0])
          s[ 'background-color' ] = `${e[0]}` //use first part
        }else{
          s[ 'background-color' ] = `${e[1]}`
        }
        return s //...prolly
      }
      //console.log("titleStyles not a splitty>>", e,proppy.color)
      s[ 'background-color' ] = `${proppy.color}` //'align-items' //'flex-start'
      
    }
   
    return s
  },*/
  //numeric date and time identifier for timestamp comparison
  getTimeNumber(timey) { //should rename properly--todo***!!
    if (timey !== null) {
      return getDayTimeIdentifier(timey)
    }
    return false
  },
  getTimeyNumber(timey) { // for time of day(less calculation than above)--prolly only use for time with same dates for testing**
    if (timey !== null) {
      return getTimeIdentifier(timey)
    }
    return false
  },
  labelGoals(){
    let total = 0
    
    //umm overkill? >> yup! >> could just count this.storedEvents....
    for(const index in this.treeGoals) { 
          let pG = this.treeGoals[ index ]
          //console.log("goally",pG)
          total += pG.children.length //.reduce(reducer, 0)
    }

    //console.log("labelGoals",this.storedEvents.length, JSON.parse(JSON.stringify(this.treeGoals)))
    return `In Schedule: ${this.scheduledEvents.length} out of ${total}`   //this.scheduledEvents.length  this.storedEvents.length
  },  
  // get all events for the specified date
  getDateEvents (dt) {
    const events = this.eventsMap[ dt ] || []
    if (events.length === 1) {
      events[ 0 ].side = 'full'
      
    }
    else if (events.length === 2) {
      //console.log("getDateEvents...LENGTH is 2?",dt, events) //bof when actual scheduled is just two evts!--weird that it does this calculation...prolly when overlapping times? >> YEUP! very nice actually--prolly would need overlap check if more than 2 evts lool!
      // this example does no more than 2 events per day
      // check if the two events overlap and if so, select
      // left or right side alignment to prevent overlap
      const startTime = addToDate(parsed(events[ 0 ].date), { minute: parseTime(events[ 0 ].time) })
      const endTime = addToDate(startTime, { minute: events[ 0 ].duration })
      const startTime2 = addToDate(parsed(events[ 1 ].date), { minute: parseTime(events[ 1 ].time) })
      const endTime2 = addToDate(startTime2, { minute: events[ 1 ].duration })
      if (isBetweenDates(startTime2, startTime, endTime, true) || isBetweenDates(endTime2, startTime, endTime, true)) {
        console.log("getDateEvents...LENGTH==2..LEFT/RIGHT 'TWIX")  //,startTime, endTime,startTime2,endTime2
        //toSee look and when does this occurs?!?--AT EDGE of day! two evts are next to each other(bleeding into next day!--huh handle? 
        //>part of evt into next...OR dont allow for evt to end past midnight?!?(easier) )
        events[ 0 ].side = 'left'
        events[ 1 ].side = 'right'
      } else {
        events[ 0 ].side = 'full'
        events[ 1 ].side = 'full'
      }
    }
    //console.log("daEvents...",events, dt)
    return events
  },
  hasDate (days) {
    return this.currentDate
      ? days.find(day => day.date === this.currentDate)
      : false
  },
  getEventsForDate(dt){ //couldnt put into methods section huh 
      return this.store.getEventsForDate(dt)
  },
  isViewingToday(){
      return today() == this.currentDate
  },
  isViewingPast(){ ///should return bool for past, futur ?
    let isToday = today()

    //data.start == 
    if (this.currentDate && this.currentDate == isToday){
      //console.log('onChange', data, this.currentDate, isToday, inDates)
      return false
    }

    let onToday = getDayIdentifier(parsed(isToday))
    let viewing = getDayIdentifier(parsed(this.currentDate))

    if (viewing >= onToday) { //.nope future >'
      
      return false
    }
    return true
  },
  adjustCurrentTime() {
    const now = parseDate(new Date())

    //console.log("adjustin...", this.currentDate, now)
    if (this.currentDate !== now.date){  //caused a jump back to current day smh
      //console.log("Not adjustin...", this.currentDate, now.date)
      this.timeStartPos = -10 //when null, doesnt change smh and 0 still shows...toMonitor if need to remove interval
      this.currentTime = ''
      return
    }
  
    this.currentDate = now.date 
    this.currentTime = now.time //'00:52'
    this.timeStartPos = this.$refs.calendar.timeStartPos(now.time, false)  
    //the above dont update in view >>cause was not in return!!


    let hasEnd = (this.endTimesSet && this.endTimesSet.has(now.time))
    let hasStart = (this.startTimesSet && this.startTimesSet.has(now.time))
    if(hasEnd || hasStart){
      //console.log("sameStart/END..FOUND", this.currentTime,hasEnd, hasStart)
      this.doEnableEndNowBtn(this.currentTime,hasEnd, hasStart)
    }
  },
  setGoalsPrio(){
      let e = this.store.fetchAllPrio()
      //let ar = Array.from(e.values())
      //console.log('setGoalsPrio',ar, typeof ar)
      if(!e.size > 0){
          //this.prioOptions = e.values()
          console.log('ERROR...no Priority goals?', e)
          return []
      }
      return Array.from(e.values())
  },
  resetGoalEvts(newish = false){
      if (this.scheduledEvents == this.allEvents){ //triple equal sign for reference check..never goes here though smh..see with double equal sign
        console.log("resetGoalEvts SAME")
      }

      if (newish){
        let e = this.deepCopy(this.storedEvents)
        this.allEvents = [...e]
        //console.log("resetGoalEvts",JSON.parse(JSON.stringify(this.allEvents)))
        //this.storedMainG  //would this update?!? >>does but computed method on top doesnt....moved in methods...
      
        //this.storedPG() //is it that by calling it, then next time as it hasnt changed it doesnt eval?(would have the most up to date stuff though...)--F! IT moved in methods!
        //console.log("resetGoalEvts newish>>pGoals",JSON.parse(JSON.stringify(this.parentGs)),this.bonAnother()) //JSON.parse(JSON.stringify(this.pGoals))
        return e
      }
      return this.allEvents  //here return same stuff...beware that not null***
  },
  getLocalEvt(id){//from the allEvents array that "should" contain all evts--might not be originals
      for(let i = 0; i< this.allEvents.length;i++){
          if (this.allEvents[i].id === id) return this.allEvents[i]  //OH freaking type check!!smh
      }
      return null
  },
  getScheduledEvent(id){ //currently scheduled
      for(let i = 0; i< this.scheduledEvents.length;i++){
          if (this.scheduledEvents[i].id == id) return this.scheduledEvents[i]  //bon dbl == works better smh
      }
      return null
  },
  doSaveEvtProp(evtID, timey = null, score = null){
    this.store.saveSubProp(evtID, timey, score)  //should just send whole event?
    return 
  },
  evtStartedOrPassed(currentTime){
    const mappy = []
   
    let compareTime = addToDate(currentTime,{ minute: 0})
    let tTime = this.getTimeNumber(compareTime)
   
    this.dailyScheduled.forEach((value, key, map)=> {
      let eStart = this.getTimeNumber(value.start)
      let eEnd = this.getTimeNumber(value.end)

      if (eStart !== false && eEnd !== false){

        let isTwix = (tTime >= eStart && tTime < eEnd) 
        //let hasEnded = eEnd >= tTime //&& tEnd <= eEnd) //umm what if it's just at the line though? >>gets included...so removing '=' for endTime..prolly others too but ToReview!!
        
        let hasEnded = tTime >= eEnd

        //let diffyEnd = diffTimestamp(eEnd, tTime) 
        //test to see if accurate! 
        //>> (diffyEnd > 0) >> so evt has NOT ended
        ////negative means it has ended...
        if (isTwix || hasEnded) {
          //console.log(`Evt:${key} > ongoing:${isTwix} or ended:${hasEnded}`) //, diffyEnd > 0, compareTime 
          mappy.push(key)
        }
        if (isTwix){//showEndBtn
          this.hasStarted[key] = true  
        }
        //if(hasEnded){
          //should disableScore prolly
          this.enableEvtScoreEdit(key, hasEnded)
        //}
      }else{
        console.log(`ERROR?!:${key} has no start/end?.`,value) //shouldnt happen--toTESST***
      }
    })

    return mappy

  },
  allowScoreEdit(flag){ 
    this.dailyScheduled.forEach( (value, key, map) => {
        this.disabledScoreEvts[key] = !flag   //need to inverse the flag!!
    })
  },
  enableEvtScoreEdit(evtID, flag){
    this.disabledScoreEvts[evtID] = !flag  //confirm flag inversion
  },
  //canEditScore()//when past || today(when evtStartedOrPassed)
  //enable score edit for already completed events by comparing with currentTime
  //enables the editing of score after event has passed.
  canEnableEditScore(evtID, endTime){ //, useNow = null
      //const now = useNow ? useNow : parsed(this.currentDate) //have to use currentDate for sho! //oldie >>parseDate(new Date())
      const now = parseDate(new Date()) //oldie >> didnt give currentTime >> parsed(this.currentDate)
      let diffy = diffTimestamp(now,endTime) //endTimes < now would be that evt hasnt ended!
    
      //console.log(`canEnableEditScore`,now,evtID,endTime)
      if(diffy > 0){ //so evt has NOT ended
          this.disabledScoreEvts[evtID] = true   //disable scoreEdit
      }else { //negative so evt has ended
          this.disabledScoreEvts[evtID] = false //enable score edit
          this.hasStarted[evtID] = false  //umm bon hide when button when past as well
      }

     // console.log(`canEnableEditScore for ${evtID}`,now,endTime,diffy, this.disabledScoreEvts[evtID])
  },
  //parses score and returns the difference btween the interval
  parseScore(t){
    const tokens = t.split(/on/)
    if (tokens.length != 2) {//should be at most two variables....
      console.log(`parseScore error?${t}`, tokens)
      return -1
    }
          //console.log(`parseScore for ${t}`, tokens)
    return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!**to add guardrails...
  },
  doEnableEndNowBtn(timey,hasEnd, hasStart){ //to enable/disable endButton...should replace one of the functions for endBtn around--toDO** 

    for (let [entry, val] of this.dailyScheduled) {
      let toComp = hasEnd ? val.end.time : val.start.time  //bon should work..prolly both flags are mutually exclusive?
      //let euhStart = hasStart ? val.start.time : timey  //just in case but redundant..toRemove**
      if (toComp == timey){
        //console.log(`doEnableEndNowBtn found hasStart:${hasStart}`, entry,JSON.parse(JSON.stringify(this.disabledScoreEvts[entry])) ) //val
        this.hasStarted[entry] = !hasEnd 
        this.disabledScoreEvts[entry] = !hasEnd //enable/disable score edit--toTEST...should use hasEnd?!? or hasStart?!?
      }
      //ELSE for hasStart to SHOW enableBtn--TODO? OR just test above?** 
    }
  },
  // show/hide the endNow button
  enableEndNowBtn(evtID,starty, endy){
    const now = parseDate(new Date()) 
    //const nowy = parsed(this.currentDate) //wrong as time is 00:00 

    //console.log("enableEndNowBtn...",nowy,now,isBetweenDates(now, starty, endy, true))

    isBetweenDates(now, starty, endy, true) ? this.hasStarted[evtID] = true : this.hasStarted[evtID] = false
    //if (isBetweenDates(now, starty, endy, true)){ 
      //this.hasStarted[evtID] = true
    //}//else{
      //this.hasStarted[evtID] = false
    //}
  },
  retrieveSameStart(timey){ //to retrieve same startTimes
      let retVal = []
      for (let [entry, val] of this.dailyScheduled) { 
          if (val.start.time == timey){
              //console.log("retrieveSameStart...FOUND", entry, val)
              retVal.push(entry) //bon no need for object {}...toREview if ID arent enough smh
          }
      }
      return retVal
  },
  //for Evts time change
  confirmTimeChange(title, mess, okbtn, altbtn, executeOk, executeCancel,executeDismiss=null){
    //let a = ''
    this.$q.dialog({
          title: title, //oldie >>'Default Time Change?' 
          message: mess,
          cancel: false, //"Temp.Add",  //issue with dismiss though....no way to NOT execute this outside click--could use noBackdropDismiss but...>>bof make if false esti!!!
          ok:okbtn, //"Change", //yes
          options: {
            type: 'radio',
            model: '', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
            // inline: true           
            items:  [
              {label: okbtn +' and '+ altbtn,value: 'ok' },
              {label: altbtn ,value: 'alt' } //should rename to make it clear...it aint cancel!!!
              //should also add choice for keep at default time?!?--tbd***
            ]
          },
          class:"overflow:visible",
          style:""
          
          //overflow-wrap: break-word;
          // style:"height: 100%;"
          // position: 'bottom',
          //noEscDismiss
          //noBackdropDismiss
          
          
        }).onOk((data) => {
          if(data == ''){
            console.log("confirmTimeChange onOk with no selection >>onDismiss")
            this.doNotify(`No selection made...Defaulting`, "positive",'bottom') //Leaving Evt as is!
            executeDismiss ? executeDismiss() : console.log("confirmTimeChange:: No Dismiss func to execute!")
            
            return//return executeCancel()
          }
          //a = data //keep it?!? to see inCancel below
          return executeOk(data)
        }).onCancel(() => { //still executed when clicking outside smh....
            console.log("confirmTimeChange>> executeCancel...")
            //a= 'cancel'
            executeCancel()  
        })//.onDismiss(() =>{ //no need prolly...could just check as in ok above?!?...nah seems needed!
          //  console.log("confirmTimeChange dismissing...ESC OR OUTSIDE click?") 
            //here dont add perhaps?!? >> bof cancel still executes so no point...
            
            //if (executeDismiss){
            //  console.log("confirmTimeChange would executeDismiss!!!") //toSee...would work?nah gets set all time smh  
            //  executeDismiss()
            //}
          //  return false
        //})

  },
  confirmAction(message, okbtn,executeOk, executeCancel, executeDismiss=null){
    this.$q.dialog({
      title: 'Warning', //try to pass this in as well?!? tbd!
      cancel: true,
      ok: okbtn, //"Save",
      //persistent:      
      // position: 'bottom',
      //noBackdropDismiss  //should add this when user have to make choice
      message: message
    }).onOk(() => {
        executeOk()
    }).onCancel(() => {
        //console.log('Cancelled confirmAction!!')
        executeCancel()
    }).onDismiss(() => {
      if(executeDismiss){
        console.log('confirmAction with dismiss!!')
        executeDismiss()
        return
      }
    })

  },
  radioChoiceDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
    this.$q.dialog({
      title: title,//'Alert',
      cancel: onCancel ? true : false, //false, //or check if onCancel != null
      persistent: true, //have to choose!--see about passing in flag!!
      message: mess,
      options: {
        type: 'radio',
        model: selectedM, //oldie >>'', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
        // inline: true           
        items: labels
       },
      }).onOk((data) => {
          if (onOk) {
            if(data == ''){ //invoked again to handle when user doesnt make selection!
              this.radioChoiceDialog(title,mess, labels,selectedM, onOk,onCancel,onDismiss)
            }else {
              onOk(data)
            }
          }
      }).onCancel(() => {
          if (onCancel) {
            onCancel()
          }
      }).onDismiss(() => {
          if(onDismiss){ //for cleanup and other actions
            //console.log('radioyChoiceDialog::onDismiss!! executin...')
            onDismiss()
        }
      })
  },
  checkBoxDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
    //console.log('checkyBoxDialog::',labels.length)
    let toValidate = labels.length
    this.$q.dialog({
      title: title,
      message: mess,
      options: {
        type: 'checkbox',
        model: [],
        isValid: model => model.length > 0 && model.length <= toValidate, //also good >> model.includes(selectedM), //'opt2'
        // inline: true
        items: labels
      },
      cancel: true,
      persistent: true
    }).onOk(data => {
        // console.log('>>>> OK, received', data)
        onOk(data)
    }).onCancel(() => {
        if (onCancel) {
          onCancel()
        }
    }).onDismiss(() => {
        if(onDismiss){ //for cleanup and other actions
          //console.log('checkyBoxDialog::onDismiss!! executin...')
          onDismiss()
      }
    })
  },
  doNotify(messg, colorNotif = undefined, position = 'top'){
    this.$q.notify({
      color: colorNotif !== undefined ? colorNotif : 'negative', //colorNotif,//'negative',
      position: position, //see using 'bottom'
      message: messg,
      icon: colorNotif == undefined ? 'report_problem' : 'thumb_up' //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
    })
  },
  updateButtons(defaultBool=null, scoreScheduleBool=null, priorityScheduleBool = null){ //reloadBool=null,
    //if (reloadBool != null) {
      //this.reloadSaved = reloadBool != null ? reloadBool : this.reloadSaved
    //}
    //if (defaultBool != null) { //sheesh dont check for falsy vals holmes!!
      this.showLoadDefaults = defaultBool != null ? defaultBool : this.showLoadDefaults
    //}
    //if (scheduleBool != null) {
      this.showScoreBtn = scoreScheduleBool != null ? scoreScheduleBool : this.showScoreBtn
    //}
      this.showPrio = priorityScheduleBool != null ? priorityScheduleBool :  this.showPrio
  },
  resetButtons(hasScheduled, viewingPast){ //determines what buttons to show.
      this.updateButtons(hasScheduled ? false : true, viewingPast ? false : true, viewingPast ? false : true)
  },
  //just remove it from the current schedule...NOT delete it completely!!
  doRemove (item) {
    let currentSize = this.scheduledEvents.length
    
    let i = 0
    for( i; i < currentSize; i++){
      if ( this.scheduledEvents[i].id == item.id) {
        this.scheduledEvents.splice(i, 1)
        //console.log("REMOVED event spliced!", item) //to see if has start/end. and not have to get/erase below...
        
        let toDel = null
        if(this.dailyScheduled.has(item.id)){
          toDel = this.dailyScheduled.get(item.id)
          this.dailyScheduled.delete(item.id)
        }else{console.log("doRemove ::> dailyScheduled has no such item?@? ERROR", item)}

        if(toDel){ //also update scheduleSets
          let hadStart = this.startTimesSet.delete(toDel.start.time)
          let hadEnd = this.endTimesSet.delete(toDel.end.time)
          if (!hadStart || !hadEnd){
            console.log(`doRemove ::> ERROR? scheduleSets has no such item?@? start:${hadStart}...end:${hadEnd}`, toDel, item.id + ' '+ item?.title.trim()+' '+ item?.details )
          }
        }
        break
      }
      //else{console.log("ERROR doRemove, NO item to delete?@? ", item)}
      //could get here when moving from other dates....or fast execution smh...toMonitor**
    }

    //console.log("doRemove..looping FOR", i)
    //this.updateCurrentSchedule() //makes sense to add here...
    //not needed as already updating above ** see looping above  
    return
  },
  chooseAlternatives(evt){

    let alts = this.storedAlternatives //deep copy??!?toSee

    let now = parseDate(new Date()) //>> actual current day >>now.date && now.time
    
    //this.currentDate >day looking at in calendar
    //console.log("chooseAlternatives..",this.currentDate,now, evt,JSON.parse(JSON.stringify(alts)))

    let evtTimey = evt.time //for scheduling later
    let futureDatey = now.date
      
      const mapToLabels = anEvt => {
        return { label: anEvt.title.trim() + " for " + anEvt.duration + 'min. at '+ anEvt.time + '('+ anEvt.score + ')', value: anEvt.id } // color: 'secondary'
      }

      const filterOutScheduled = evts => {//should filter to remove scheduled
        return evts.filter(x => !this.scheduledEvents.find(item => item.id == x.id))
      }


      const addInFutur = (eArr) => {
        let startDay = addToDate(parsed(futureDatey),{ day: 0 }) //think need options >> yup! //SHOULD be sometime in present or future
        let altDay = addToDate(parsed(startDay.date), { day: 1 }) 
        //console.log("addInFutur...",futureDatey,startDay,altDay)//JSON.parse(JSON.stringify(toAdd))
        let EvtsOn = this.getEventsForDate(startDay.date) 
        let toSave = {}
        if (!EvtsOn){
          console.log("addInFutur EMPTY for >>...",startDay.date)//could be null!
        } else {
          toSave = EvtsOn 
        }

        eArr.forEach(i => {
          let toAddy = this.getLocalEvt(i) //use the `alts` too?!?
          //console.log("addInFutur...",i,JSON.parse(JSON.stringify(toAddy)))

          if(toSave[i]){//Not override already present!!--BEWARE//could add it in 'altDay' ? toSee 
            console.log("addInFutur...ALREADY PRESENT",i,JSON.parse(JSON.stringify(toAddy)))
            this.doNotify(`Alternative '${toAddy?.title.trim()}'already present on ${startDay.date}. Moving it to next day`,'warning')
            let nexty = this.getEventsForDate(altDay.date)
            if(nexty){
              if (!nexty[i]){
                nexty[i] = {
                  duration: toAddy.duration,
                  time: evtTimey
                }
              }else{
                console.log("addInFutur...ALREADY PRESENT",toAddy,JSON.parse(JSON.stringify(nexty)))
                this.doNotify(`Alternative '${toAddy?.title.trim()}'also present on ${altDay.date}....smh`) //nothing else to do...
              }
            } else {
              console.log("addInFutur next day EMPTY for >>...",altDay.date)
              nexty = {}
              nexty[i] = {
                duration: toAddy.duration,
                time: evtTimey
              }
            }
            this.store.saveDailySchedule(altDay.date, nexty)
          } else { //just add it
            toSave[i] = {
              duration: toAddy.duration,
              time: evtTimey
            }
          }
        })
        //console.log("addInFutur>>>",JSON.parse(JSON.stringify(toSave)))

        this.store.saveDailySchedule(startDay.date, toSave)  //should check that not empty?!? toSEE**

      }

      const remReplace =(eID) => {
        this.doRemove(evt)

        let toAdd = alts.find(item => item.id == eID) //this.getLocalEvt(eID) //should use the `alts` var above..otherwise would be changing the scheduled time of evt.
        console.log("remReplace...Add at:",evtTimey,JSON.parse(JSON.stringify(toAdd)))
        toAdd = this.addPropsEventsTo(this.currentDate,[{...toAdd,time:evtTimey}])

        
        this.addEvtPropsIntoSchedule(toAdd[0]) //this.currentDate, //could this overlap again?!? YES >>toHandle!!

        let f = this.updateCurrentSchedule()
        console.log('chooseAlternatives::remReplace:END',f)  //weirdly have conflict with removed!--prolly cause of errors?
        this.doSaveSchedule() //enable...
        
      }
    
    alts = filterOutScheduled(alts)

    if (alts.length == 0) {
      this.doNotify("Removing not allowed! Alternatives already present!")
      return
    }

    this.checkBoxDialog('Gotta pick alternatives',
      'Select the first Evt to replace the removed and an Extra evt for later!',//mess,
      alts.map(mapToLabels),
      alts[0].id, //'', //have to at least include first Alternative...>> bof no need as check the length of model!
      function(opt){ //onOk
        console.log('chooseAlternatives::opt',opt) //JSON.parse(JSON.stringify(toKeep))
        remReplace(opt.shift())
        if (opt.length > 0){
          addInFutur(opt)
        }else{
          this.doNotify("Removing not allowed! Alternatives already scheduled!")
        }
      },
      function(){//onCancel..
        console.log('chooseAlternatives::onCancel') //nothing to do...
      },
      //function(){ //onDismiss.
      //  console.log('chooseAlternatives::onDismiss',futureDatey,evtTimey)
      //}
    )


  },
  removeEvtInSchedule(evt, id=null){ //no need for id--toRemove***

    if(this.isViewingPast()){
      if (evt.duration < 30){ //dont do this for small evts!
        //console.log("removeEvtInSchedule...baah too smoll smoll",evt.title,evt.duration)
        this.doNotify("Removing from the past too smoll smoll is no no!")
        return
      }
      this.chooseAlternatives(evt)
      return
    }
    
    //console.log("removeEvtInSchedule eh...", evt, id)
    let aRem = () => {
      this.doRemove(evt)
      
      this.disableSaveSchedule = false  //allow saving schedule
      this.showReloadBtn = this.hasEventsForDate

      //toReview above and >> this.updateButtons(null, true, null, null) 
      //logic of which buttons to show
      //--prolly should allow defaultBtn as well!! >>TODO***
    }

    if (!this.isViewingToday()){ //for futur schedule dont bother confirming with user!!
      aRem()
      console.log('Removed future evt')
      return
    }
    
    let mess = `Remove "${evt.title}" from schedule?`

    this.confirmAction(mess,
    "Remove",
    aRem, 
    function(){console.log('Cancelled remove')}) 

  },
  updateCurrentSchedule() {
    const mappy = new Map()

    let endTimes = new Set()

    let sameTime = new Set()
    let startTimes = new Set()

    
    if(this.scheduledEvents.length < 1){
      //console.log("updateCurrentSchedule NOTHING..returning....",this.dailyScheduled.size,this.startTimesSet.size) 
      this.dailyScheduled = mappy

      this.endTimesSet = endTimes
      this.startTimesSet = startTimes

      return sameTime //consistency!
    }
    
    this.scheduledEvents.forEach(event => {
      let startTime = addToDate(parsed(event.date), { minute: parseTime(event.time) })
      let endTime = addToDate(startTime, { minute: event.duration })

      mappy.set(event.id, { //startsEnds
        start: startTime,
        end: endTime,
        on: event.date,
        originalAt: event.time,
        for: event.duration,
        score:event.score
      })
      
      //endTimes.push(endTime.time) //for checking when adjustCurrentTime()
      endTimes.add(endTime.time) 
        
      startTimes.has(startTime.time) ? sameTime.add({at:startTime.time, id:event.id}) : startTimes.add(startTime.time)
       
      //this.disabledScoreEvts[event.id] = true  //uncomment when doing drag/drop stuff

      let isToday = this.currentDate == today() 
      if (isToday || !this.isViewingPast()){ //only allow for today and future
            //console.log(`addEvtInScheduleMaps --editScore today for: ${evt.id}`, startTime, endTime)
        this.canEnableEditScore(event.id,endTime)
        this.enableEndNowBtn(event.id, startTime, endTime)
      }

    })

    this.dailyScheduled = mappy

    this.endTimesSet = endTimes
    this.startTimesSet = startTimes

    return sameTime

  },
  addEvtPropsIntoSchedule(event){ //maybe add flag here?...and //todo** change method to handle arrays?
    
    //return this.updateCurrentSchedule()  //not too expensive to do all evts when just adding one?!? prolly...

    let added = this.addEvtInScheduleMaps(event)

    if(!added){
      console.log(`addEvtPropsIntoSchedule:${event.title}..ERROR...NOT added?!?`, added)
      return
    }

    this.scheduledEvents.push(event) //better in order to not pollute scheduleEvents array when couldnt add to scheduleMap above

  },
  addEvtInScheduleMaps(evt){
    if(this.dailyScheduled.has(evt.id)){
      console.log("addEvtInScheduleMaps with evt already added...ERROR?", evt)
      return false
    }

    let startTime = addToDate(parsed(evt.date), { minute: parseTime(evt.time) })
    let endTime = addToDate(startTime, { minute: evt.duration })

    this.dailyScheduled.set(evt.id, {
      on: evt.date,
      originalAt: evt.time, //keep original...needed still? >prolly not..toRemove**
      for: evt.duration,
      start: startTime,
      end: endTime,
      score: evt.score
    })

    this.endTimesSet.add(endTime.time)
    this.startTimesSet.add(startTime.time)  //check for sameStart?!?

    let isToday = this.currentDate == today() 
    if (isToday || !this.isViewingPast()){ //only allow for today and future
            //console.log(`addEvtInScheduleMaps --editScore today for: ${evt.id}`, startTime, endTime)
      this.canEnableEditScore(evt.id,endTime)
      this.enableEndNowBtn(evt.id, startTime, endTime)
    }

    return true //return true?
  },
  updateEvtInScheduleMaps(evID, timeyStart){
      if(this.dailyScheduled.has(evID)){
          let evt = this.dailyScheduled.get(evID)
          //console.log("updateEvtInScheduleMaps",evt,timeyStart)
          let forsy = evt.for
          let oAt = evt.originalAt
          let oldStart = evt.start
          let oldEnd = evt.end
          let newEndy = addToDate(timeyStart, { minute: forsy })
          let scorey = evt.score

          this.dailyScheduled.set(evID, {
            on: timeyStart.date,
            originalAt: oAt, //timeyStart.time, >>keep origin time
            for: forsy,
            start: timeyStart,
            end: newEndy,
            score: scorey  //gaah dont leave stuff or think they take the original value smh
          })

          let hadEnd = this.endTimesSet.delete(oldEnd.time)
          if (hadEnd){
              //console.log(`endTimesSet rem/add for ${evID} :: ${oldEnd.time} to ${newEndy.time}`)
              this.endTimesSet.add(newEndy.time) 
          }else{console.log("updateEvtInScheduleMaps-endTimesSet NOT FOUND?!?")} //this could happen? ToTest

          let hadStart = this.startTimesSet.delete(oldStart.time)
          if (hadStart){
              this.startTimesSet.add(timeyStart.time) 
          } else {
            console.log("updateEvtInScheduleMaps-startTimesSet NOT FOUND?!?",evID, timeyStart)
            //this could happen? yes....
          } 
          

          let isToday = this.currentDate == today() 
          if (isToday || !this.isViewingPast()){ //only allow for today and future
            //console.log(`updateEvtInScheduleMaps --editScore today for: ${evID}`,timeyStart.time, newEndy.time)
            this.canEnableEditScore(evID,newEndy)
            this.enableEndNowBtn(evID, timeyStart, newEndy)
          }

          return true
      }else{
          console.log("updateEvtInScheduleMaps--euh not found?ERROR?",evID, timeyStart) 
          return false 
      }  
      
  },
  evtIsOverlappingTimes(tStart, tEnd, eStart, eEnd){ //id for debug--should remove
    //custom to also return more info whether overlapping left(haut?), right(bas?), totalO(surrounding)
    //also uses getTimeIdentifier lib function via this.getTimeyNumber(timey) above
    
    let targetStart = this.getTimeyNumber(tStart)
    let targetEnd = this.getTimeyNumber(tEnd)

    let evtStart = this.getTimeyNumber(eStart)
    let evtEnd = this.getTimeyNumber(eEnd)

    //console.log("evtIsOverlappingTimes ORIG>>",tStart, tEnd, eStart, eEnd)
    //console.log("evtIsOverlappingTimes THEN>>"+id,targetStart,targetEnd,evtStart,evtEnd) // >> 805 830 500 535
    
    if (targetStart === false || evtStart === false || targetEnd === false || evtEnd === false) {
      console.log("ERROR... evtIsOverlappingTimes error",targetStart,targetEnd,evtStart,evtEnd)
      return false
    }//else {console.log("evtIsOverlappingTimes",targetStart,targetEnd,evtStart,evtEnd)}

    //so adding the '=' equal sign, also finds evts next to each other(without space in between) and that's a conflict--want some breather?!?
    //prolly better to have evts NEXT to each other!
    let dir = false
    if(targetStart > evtStart && targetStart <= evtEnd){// overlap left...beware of '=' removal after &&
      //return 'bas'  //so target is EARLIER than scheduled evt...prolly?
      dir = 'bas'
    } 
    if (targetEnd > evtStart && targetEnd <= evtEnd){ // overlap right ...see effect of not removing '=' as in above (evts can be next to each other!!)
      //return 'haut'  //so target is LATER than scheduled evt...prolly?
      dir = 'haut'
    }
    if((evtStart >= targetStart && targetEnd >= evtEnd) || (targetStart > evtStart && targetEnd < evtEnd)){ //have to also check opposite!!!
      //return 'surrounding'  //prolly? 
      dir = 'surrounding'
    }
    
    return dir //false

  },
  
  //supposes that evID is not in dailyScheduled yet and return array of scheduled evts that might overlap!
  //actually return the FIRST overlapping event as going through the whole map might find evts that are being added**BEWARE--tofix sometimes!
  hasOverlappingEvent(evID, targetTimestamp, duration) {
    const mappyA = []
    
    let tStartAt = targetTimestamp
    let tEndsAt = addToDate(tStartAt, { minute: duration})

    //console.log(`hasOverlappingEvent for ${evID} at ${targetTimestamp.time} for ${duration}`, tStartAt, tEndsAt)

    this.dailyScheduled.forEach((value, key, map) => {
      if (key == evID){//skip self!
        //console.log(`${evID} skippin self ${key}`,value)
      }else{
        let oDirection = this.evtIsOverlappingTimes(tStartAt,tEndsAt,value.start,value.end) //`${evID}->${key}`
        if (oDirection){
          //console.log(`OverlappingConflict ${evID} en "${oDirection}" of evt:${key} at`,value.start.time)//tStartAt value
          // duration, tStartAt, tEndsAt, value.start, value.end

          mappyA.push({ 
            target:evID,
            targetStart:tStartAt,
            direction:oDirection,
            inConflict:key 
          })
        }
      }
    })

    return mappyA
  },
  //check for overlap while adding evts
  overlapCheckEvtsAdd(evts){ //, dt = null, doAdd = false
   
    let euhOverlaps = {}  //umm into objects?!?

    //console.log(`overlapCheckEvtsAdd with evts`, JSON.parse(JSON.stringify(evts)))

    for(let i = 0; i < evts.length; i++){
      let obj = evts[i]

      let startTime = addToDate(parsed(obj.date), { minute: parseTime(obj.time) })
      //let endTime = addToDate(startTime, { minute: obj.duration })
          
      let oOth = this.hasOverlappingEvent(obj.id, startTime, obj.duration) //before add evt
      
      if(oOth.length > 0){
        //console.log(`overlapCheckEvtsAdd at ${startTime.time} for ${obj.id}:"${obj.title.trim()}">>`,oOth)  //oOth.length  // obj //Object.keys(oOtherO).length //`${obj.id}::${obj.title}
        
        //beware of semantics!
        let j = 0
        do {
          //key = currentScheduled
          //value = conflict evts to add!

          //overlaps[anyOverlap[j]] = obj //hopefully shouldnt overlap with many evts?!?--TOTEST with more than one**
   
          let oDets = oOth[j]

          //bon keep in mind the obj.id is target--the evt being added!
          //if(!euhOverlaps[obj.id]){
          //  euhOverlaps[obj.id]= []
          //}
          //euhOverlaps[obj.id].push(oDets)

          //instead of target> add by inConflict for better overlap resolution later--See multiConflicts()
          if(!euhOverlaps[oDets.inConflict]){
            euhOverlaps[oDets.inConflict]= []
          }
          euhOverlaps[oDets.inConflict].push(oDets)

          //console.log(`${j}-overlapCheckEvtsAdd for ${obj.id} conflict with ${oDets.inConflict}`, euhOverlaps[oDets.inConflict].length) //oOth[j]
          if(j>0){
            console.log("WOAH WOAH, multiple overlaps with same obj!",j, obj,oOth[j])
            //should push to array in this case >>see above toTest***
            //>could have multiple default that are overlapping yes!
          }    
        } while (++j < oOth.length)
      } else{
        this.addEvtPropsIntoSchedule(obj) //dt,
      }   
    }

    return euhOverlaps
  },
  updatedEvtDetails(evt){ //for updating details...tooltip--aint this too much just for parent'color and title?--meh
      let when = (timey) => {
        if(!timey) return ''

        let o = timey.split(':')
        return parseInt(o[0]) >= 12 ? "PM" : "AM" //let oAmPm = 
      }
  
    let prtGoal = this.parentGoalsMap().get(evt.parentGoal)
    if(!prtGoal){
          console.log("ERROR?!? no parent goal for:",JSON.parse(JSON.stringify(evt))) //could happen when adding ad-hoc
          evt.bgcolor = "grey" //default for goals (could be ad-hoc goals) 
          evt.title  = `Ad-hoc:${evt?.title} (${this.parseScore(evt?.score)})` //oldie for evt.title >> "unknown"  //or ${evt?.score} ?!?
          evt.details = `${evt?.title}: ${evt?.time}${when(evt?.time)} -- ${evt?.duration}min` 
      } else {
        //console.log("updatedEvtDetails",JSON.parse(JSON.stringify(evt))) //,JSON.parse(JSON.stringify(obj)))
        evt.bgcolor = prtGoal.bgcolor  //for weird colors, becomes transparent--beware**
       // evt.title  +=` (${this.parseScore(evt?.score)})`  //oldie that keeps using/adding to title >> ${evt.title.trim()}
        evt.details = `${evt?.time}${when(evt?.time)} -> ${evt?.duration}min -- ${evt?.inDefaults ? 'Dft:':':'}${evt?.canMove ? ':Mv:':':'}${evt?.isAlternative ? ':Alt':':'}` // ::${prtGoal.title.trim()} (${pgoal?.priority})
        // ${def ? def:''}${cM ? cM : ''}${alt ? alt : ''}`  //(${evt.id}) at...
      }
      return evt
  },
  addPropsEventsTo(aDate, events){ //beware it returns an array!!
    if (!events) { //|| !pMap
      this.doNotify("addPropsEventsTo BUT no goals to schedule...")
      return []
    }
    let toReload = []

    events.forEach((obj) => {
        //let sav = events[obj.id]  //oldie that wasnt good with indexes...
        
        let sav = this.getLocalEvt(obj.id)
        //console.log("addPropsEventsTo",JSON.parse(JSON.stringify(sav)),JSON.parse(JSON.stringify(obj)))
        if (sav){
          sav.duration = obj.duration //def gotta use duration in case it has changed!
          sav.time = obj.time
          sav.date = aDate //OR  do >> aDate != null ? aDate : obj.date //umm set to itself and better to null this and change in the onChange //"date": "2023-07-22"

          //oldie oldie >> toReload.push(obj)
          //oldie >> toReload.push(fromParent(obj)) //works but should be 'sav' as it's the proper overrided object with parentGoal, etc...below
          toReload.push(this.updatedEvtDetails(sav)) //oldie >>fromParent(sav))

        } else{console.log(`ERROR in addPropsEventsTo...Evt:not present!`,obj) } //when has been deleted--toHAndle?***
    })

    //console.log("addPropsEventsTo", aDate,JSON.parse(JSON.stringify(toReload))) //events, typeof events

    return toReload
  },
  //skipAsk to skip asking user--force flag
  changeEvtTime(evID, timeyStart, skipAsk, doAdd=false) {
    //console.log(`changeEventTime ${evID} to ${timeyStart.time} with skip:${skipAsk}..adding:${doAdd}`,this.scheduledEvents.length)
    let evt = this.getScheduledEvent(evID)
    let oldy = null //evt.time 
    if(evt){
      oldy = evt.time 
    } else {
      console.log(`changeEventTime::ADDIN ${evID} as aint in schedule with doAdd:${doAdd}`,timeyStart.time) //should go together...
      if(doAdd){
        //let e = 
        evt = this.getLocalEvt(evID)
        if (!evt){
          console.log('ERROR in changeEvtTime STILL NOT found?!?',e, evID, timeyStart, doAdd) //shouldnt happen!! typeof evID,
          return false
        }
        oldy = evt.time

        //below premature >> moved below
        //let evtArr = this.addPropsEventsTo(this.currentDate, [{...evt,time:timeyStart.time}]) //{...evt,time:timeyStart.time} >>bof doesnt work to just change time for invoking..
        //console.log("changeEventTime afterProps",JSON.parse(JSON.stringify(evtArr[0])))
        //this.addEvtPropsIntoSchedule(evtArr[0]) //should be one item....prolly
      } else {
        console.log('ERROR in changeEvtTime not found, not adding!', evID, timeyStart, doAdd)
        return false
      }
    }

      let doUpdateEvt = (evty,addy) => {
        console.log(`changeEventTime::DoUpdateEvt:: ${addy ? 'DOADD':'NOAdd'} (${evty.id})'${evty.title.trim()}' at->${evty.time} from ${oldy} to ${timeyStart.time} `,'canMove:'+evty?.canMove,'inDef:'+evty?.inDefaults,'skip?'+skipAsk)

        if (addy) {
          let evtArr = this.addPropsEventsTo(this.currentDate, [{...evty,time:timeyStart.time}])
          //console.log("doUpdateEvt:: afterProps",JSON.parse(JSON.stringify(evtArr[0])))
          this.addEvtPropsIntoSchedule(evtArr[0]) //should be one item....prolly
          return //prolly..
        }
        
        //shouldnt the below updateEvtInScheduleMaps() also be in the if statement?!?
        this.updateEvtInScheduleMaps(evID, timeyStart) //should also change in scheduledEvents?!? no need prolly...
        //if(!doAdd){ // update details..same as addPropsEventsTo() above >redundant
        evty.time = timeyStart.time
        this.updatedEvtDetails(evty)
        //}
        //console.log("doUpdateEvt:: !NOT doAdd afterProps",JSON.parse(JSON.stringify(evt)))
      }

      let keepAsIs = (evty,doAddy) => {  //schedule at default time--potential for overlap?!? prolly ...toSee and handle!!
        console.log(`changeEventTime::KeepAsIs (${evID}..${evty.id})'${evty.title.trim()}' to ${oldy} with ${doAddy ? 'DOADD':'NOAdd'}`,timeyStart.time,'canMove:'+evty?.canMove,'inDef:'+evty?.inDefaults,'skip?'+skipAsk)
        if (doAddy) { //needed?!? or would be already in?!? toSEE**
          let evtArr = this.addPropsEventsTo(this.currentDate, [{...evty,time:oldy}]) //{...evt,time:timeyStart.time} >>bof doesnt work to just change time for invoking..
          console.log("KeepAsIs::doAddy afterProps",JSON.parse(JSON.stringify(evtArr[0].time)))
          this.addEvtPropsIntoSchedule(evtArr[0]) //should be one item..prolly
          
          //return here?--toSee and make consistent with doUpdateEvt()
        } else { //toSEE when get here...should even?!?
          this.updateEvtInScheduleMaps(evID, oldy)
          evty.time = oldy
          this.updatedEvtDetails(evty)
          console.log("changeEventTime::keepAsIs:: !NOT! doAdd afterProps..",evID,evty.id) //,JSON.parse(JSON.stringify(evt)))
        }
      }
      
      let userChoice = (flag,evty,doAddy) => { 
        console.log(`changeEvtTime::userChoice ${flag} >> ${evty.id} to ${timeyStart.time}...`)
        if (flag == 'ok'){
          this.doSaveEvtProp(evID, timeyStart.time, null) //evty.id
        }
        //here doing temp.Move/add just changes the time..
        doUpdateEvt(evty,doAddy)
        
        return flag
      }

    //console.log(`changeEventTime::(${evt.id})'${evt.title.trim()}'...doAdd:${doAdd} > skipAsk:${skipAsk} ...Evt canMove:${evt?.canMove} inDef:${evt?.inDefaults}`) 
   
    //not asking...except for inDefaults && !evt.canMove ..prolly(||)
    if (evt?.inDefaults || !evt?.canMove){
      if (skipAsk) {
        //console.log(`changeEventTime::skippin...BUT inDef: ${evt.inDefaults} and canMove:${evt.canMove}`)
        doUpdateEvt(evt,doAdd) //bon just skip!
        //return
      } else{
        if (oldy == timeyStart.time){//when time hasnt changed --just return...EXCEPT when adding! >>toSee** if shouldnt do it in all cases tho!!!--when skipAsk=false ?!?
          console.log(`SAME TIME (${evt.id})'${evt.title.trim()}'..ASKIN with doAdd? ${doAdd} for updateEvt...`,oldy,timeyStart.time)
          if(doAdd){doUpdateEvt(evt,doAdd)}
          return
        } 

        
        let AmPm = timeyStart?.hour  >= 12 ? "PM" : "AM"
        let o = oldy.split(':')
        let oAmPm = parseInt(o[0]) >= 12 ? "PM" : "AM"
        
        let messA = 
        [`Evt '${evt.title.trim()}' by default at ${oldy}${oAmPm}.\n\u2800\n`,"\n\u2800\n",'\n\u2800\n',
        `Also Change default time to ${timeyStart.time}${AmPm}? \n\u2800\n`, "\n\u2800\n",'\n\u2800\n',
        "Cancel or Dismiss to undo!\n\u2800\n","\n\u2800\n",'\n\u2800\n',
        `No selection to schedule at default's ${oldy}${oAmPm}`]  
        
        let mess = messA.join("\n") ////bon as array?!? >> toSee >>STILL!! is it the dialog?!?

        //console.log(`Move`,messA,mess); //seems good here with that extra \n after cancel showing!!

        //bof see if multi-line >>nope even with r\n smh >>nor + "\n" +  >>Nor concatenation smh
        //shouldnt cancel/dismiss NOT schedule?!?

        this.confirmTimeChange('Default Time Change!',
        mess, 
        "Change", //okBtn >>temp btn below added in site as well for clarity
        `Temp.${doAdd ? 'Add':'Move'}`, //altbtnBtn //oldie >>"Temp.Add"
        function(d){userChoice(d,evt,doAdd);}, //onOk //toSee if var passing is good!!
        function(){console.log(`changeEventTime::onCancel...>doing nothing for ${evt.id})'${evt.title.trim()}'`,doAdd)},  //onCancel //;keepAsIs() //Temp add at ${timeyStart.time}${AmPm}`);doUpdateEvt()
        function(){console.log(`changeEventTime::onDismiss...keeping as is>> ${evt.id})'${evt.title.trim()}'`,doAdd);keepAsIs(evt,doAdd)} //scheduling at default time ${oldy}${oAmPm}`);keepAsIs()
        //onDismiss/...should prolly remove it actually!--or leave at default time?!?
        ) //onCancel //oldie>>doUpdateEvt()
        
      }
    } else { //asking for all except those evt?.canMove
      if (evt?.canMove){ //&& !inDefault ?
        doUpdateEvt(evt,doAdd)
        //return //true ?
      } else{
        if (oldy == timeyStart.time){//when time hasnt changed --just return...EXCEPT when adding!--toSee if shouldnt call all time? specially with skipAsk!!
          console.log(`SAME TIME! BEWARE~~ (${evt.id})'${evt.title.trim()}'...doAdd?${doAdd}..skipAsk?:${skipAsk}..returning!!`,oldy) //beware of this case!!!
          //if(doAdd){doUpdateEvt()}
          return //toSee if proper to return...
        } 

        let AmPm = timeyStart?.hour  >= 12 ? "PM" : "AM"
        let o = oldy.split(':')
        let oAmPm = parseInt(o[0]) >= 12 ? "PM" : "AM"
        
        let messA = [`Evt '${evt.title.trim()}' Not move from ${oldy}${oAmPm}.\n\u2800\n`,"\n\u2800\n",'\n\u2800\n',
        `Also Move time to ${timeyStart.time}${AmPm}? \n\u2800\n`,"\n\u2800\n",'\n\u2800\n',
        "Cancel or Dismiss to undo!\n\u2800\n","\n\u2800\n",'\n\u2800\n',
        `No selection to add at default ${oldy}${oAmPm} `
        ]
        //  to schedule at default ${oldy}${oAmPm}
        //No selection or Dismiss to undo! ` 

        // for only Temporary ${doAdd ? 'add':'move'}.
        //bof see if multi-line >>nope even with r\n smh 
        //&#8203 or U+200B
        //\n\u2800\n
        
        let mess = messA.join('\n') //toSee smh >>prolly also good! but cannot seem to fit?!?

        //console.log(`Move`,messA,mess);

        this.confirmTimeChange("Moving Evt's time",
        mess, 
        "Change", //okBtn
        `Temp.${doAdd ? 'Add':'Move'}`, //altbtn //oldie >>"Temp.Move"
        function(d){userChoice(d,evt,doAdd)}, //onOk //toSee with choice
        function(){console.log(`changeEventTime::onCancel..>doing nothing for ${evt.id})'${evt.title.trim()}'`,doAdd)}, //;keepAsIs() //doUpdateEvt()  //shouldnt cancel/dismiss NOT schedule?!?
        function(){console.log(`changeEventTime::onDismiss..keep as is>> ${evt.id})'${evt.title.trim()}'`,doAdd);keepAsIs(evt,doAdd)} //.scheduling at default time`);keepAsIs() 
        //onDismiss/...should prolly remove it actually!--or leave at default time?!?
        ) 
      }
    }
    
  },
  recurChangeTime(overlappedEvtID, tEvt, targetTimestamp, skipAsk = false, doAdd = false) { //goForward = false
    let overlappedEvt = this.dailyScheduled.get(overlappedEvtID)
    if (overlappedEvt){

      //umm using overlappedEvt to keep same time interval between the two events?!? >> meh but to explore later but no point with overlaps...
      
      //direction of drag(up or down) >>either - or + 
      //let dragTimeInterval = parseTime(targetTimestamp.time) - parseTime(tEvt.time)
      let dragTimeInterval = parseTime(overlappedEvt.start.time) - parseTime(targetTimestamp.time)
      
      let dName = `${dragTimeInterval > 0 ? "DOWN": "UP"}` //so down is forward in time..prlly
      //let dggyName = `${draggyInterval > 0 ? "DOWN": "UP"}`
      //console.log(`${overlappedEvtID} of dura: ${overlappedEvt.for} moving <> ${dName} due to evt:${tEvt.id} of dura:${tEvt.duration} at ${targetTimestamp.time}...doAdd:${doAdd} and skipAsk:${skipAsk}`) //overlappedEvt

      //tEvt.time >> original Evt time but the targetTimestamp.time >> WHEN it should be scheduled at

      let overlappedEvtNew = null
      if (dragTimeInterval >= 0 ) { //>=0 ?!? yup // also this add of extra 10 prolly lead to more overlap! should remove for too many evts!!--todo**
        overlappedEvtNew= addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) 
        let alternative = addToDate(targetTimestamp, { minute: parseInt(overlappedEvt.for) + 10 })//overlappedEvt.for might be too much...
        console.log(`recurChangeTime::${overlappedEvtID}...FORWARD ${dName} for ${dragTimeInterval} due to evt:${tEvt.id} at ${targetTimestamp.time} \n doAdd?:${doAdd}, skipAsk:${skipAsk} > New>`, JSON.parse(JSON.stringify(overlappedEvtNew.time)), 'alt:',alternative.time)
        //should use the closer time...avoid multiple overlaps later..
        let diffy = diffTimestamp(alternative,overlappedEvtNew)
        if(diffy > 0){ //so overlappedEvtNew is later...use alternative perhaps...toSEE***
          console.log(`recurChangeTime::DIFFY>>${diffy}...gonna use Alternative`,alternative.time)  //negative means alternative is worse and use overlappedEvtNew
          overlappedEvtNew = alternative
        }
      } else {//remove instead of add.
        overlappedEvtNew = addToDate(targetTimestamp, { minute: -(parseInt(overlappedEvt.for) + 10)})
        let alternative = addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) }) //toSee if overlappedEvt.for isnt too much? nope it's proper for backward...prlly
        let diffy = diffTimestamp(alternative,overlappedEvtNew) //toSee
        console.log(`recurChangeTime::${overlappedEvtID}...BACKWARD ${dName} for ${dragTimeInterval} due to evt:${tEvt.id} at ${targetTimestamp.time}.doAdd?:${doAdd}, skipAsk:${skipAsk} > New`, JSON.parse(JSON.stringify(overlappedEvtNew.time)), 'alt:'+alternative.time,'diffy='+diffy)
      }
      
      //console.log(`recurChangeTime...from>>${targetTimestamp.time}, to ${overlappedEvtNew.time}`, tEvt.duration)

      //&#8203 or U+200B ...
      
      let anyOtherOverlap = this.hasOverlappingEvent(overlappedEvtID, overlappedEvtNew, overlappedEvt.for)
      
      if(anyOtherOverlap.length > 0) {
        console.log(`WARNING WARNING::more Overlaps::recurChangeTime ${overlappedEvtID} at ${overlappedEvtNew.time}`,anyOtherOverlap.length, anyOtherOverlap)
        let i = 0
        let sizey = anyOtherOverlap.length
        let draggy = this.getScheduledEvent(overlappedEvtID)
        do {
          console.log(`CASCADING timeChange ${overlappedEvtID}-${draggy?.title} 'gon recurChangeTime::
          OLDie doAdd?:${doAdd}, OLDie skipAsk:${skipAsk}..gon be true`,anyOtherOverlap[i], '\n now at:'+overlappedEvt.start.time +' till '+overlappedEvt.end.time) 
          //should prolly skip when seeing own self?!?--toMonitor***
          if(anyOtherOverlap[i].inConflict == tEvt.id){ //should def break or goes in an infinite loop!!--when seeing original evt...
            console.log(`EUUUH...::recurChangeTime::self overlap?!?${overlappedEvtID}`, anyOtherOverlap[i]) 
            break  //or  return //?
          }
          //skipAsk should be true as recursion implicitly force schedule change--instead of using passed in.
          this.recurChangeTime(anyOtherOverlap[i].inConflict,draggy,overlappedEvtNew, true) //doAdd flag not needed?!?
          
          //umm shouldnt use this.fixyOverlaps() instead of recursion self?!? --toTry**
        } while (++i < sizey)
      }

      console.log(`recurChangeTime::OVERLAPPED: ${overlappedEvtID} ${dName} to ${overlappedEvtNew.time} ...skipAsk:${skipAsk} >> doAdd:${doAdd}`)
      //use tEvt.duration?!? or should use direction +- timeDiff?!?
      this.changeEvtTime(overlappedEvtID, overlappedEvtNew, skipAsk)
      
      //umm should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
      let draggedNewTime = targetTimestamp //(dragTimeInterval > 0 || goForward) ? addToDate(targetTimestamp, { minute: 0 })
                            //                      : addToDate(targetTimestamp, { minute: 0 }) 
      
      //the evt doing displacement stays the same.
      console.log(`recurChangeTime::TARGET:(${tEvt.id})${tEvt?.title.trim()} going ${dName} skipAsk:${skipAsk} >> doAdd:${doAdd} to time>> ${draggedNewTime.time}`) //goForward,

      this.changeEvtTime(tEvt.id, draggedNewTime, skipAsk, doAdd) //flag to add target in case...
      //worked = this.updateEvtInScheduleMaps(tEvt.id, draggedNewTime)

     
    } else{
      console.log("ERROR..ERROR recurChangeTime:: overlapped event not found!", overlappedEvtID)
    }
  },

  //Solve conflicts between scheduled and new Evts to be added!
   //'from' param could help with offering/removing some options--could go faster too instead of double choices--toSee**
  fixyOverlaps(toHandle,override = null,from=''){
    // 8: {direction: "haut",inConflict: 8,target: 1}

    let toHandleSize = Object.keys(toHandle).length

    let toKeep = []
    let removed = []

      const findPrio = evt => {
        if (evt?.parentGoal){
          let prt = this.parentGoalsMap().get(evt.parentGoal)
          return prt?.priority
        }
        console.log('findPrio..ERROR no PARENT found?',evt)
        return null //null or 0 ?!? toREview**
      }

      const evtLabels = anEvt => {
        return anEvt.title.trim() + " Priority = " + findPrio(anEvt) + " && Score:: " + anEvt.score
      }

      const aNotif = (mess) => {
        this.doNotify(mess, "positive",'bottom') //`Cancelling to keep "${title}"`
      }

      const doRem = (evt) => {
        //console.log(`fixyOverlaps:doRem ${evt.id}:${evt.title}`)
        removed.push(evt)
        this.doRemove(evt)
      }

      const doKeep = (evt) => { //prolly no need for this..toRemove
        toKeep.push(evt)
        //console.log(`fixyOverlaps:doKeep ${evt.id}:${evt.title}`)
      }

      //when picks the unscheduled one > have to remove it and add unscheduled evt!--except for drag/drop with ovrd flag
      const removeReplace = (toRem,toAdd,aConf) => { //lambda to keep context of `this.()`
        //toKeep.push(toAdd) //todo before it becomes an array./
        doKeep(toAdd)
        
        //console.log(`fixyOverlaps::removeReplace ${toRem.id}:${toRem.title.trim()} with ${toAdd.id}:${toAdd.title.trim()} at ${toAdd.time} with ovrd:${override}`, aConf)  //aConf.targetStart.date
        console.log(`removeReplace >> ${toRem.title.trim()} WITH ${toAdd.title.trim()}`,from, aConf)

        toAdd = this.addPropsEventsTo(aConf.targetStart.date,[{...toAdd,time:aConf.targetStart.time}]) //proper change of time
        if(override){
          console.log("fixyOverlaps:removeReplace...override>>from:"+from,JSON.parse(JSON.stringify(toAdd)))
          this.updateEvtInScheduleMaps(toAdd[0].id, aConf.targetStart)
          console.log(`fixyOverlaps`,this.startTimesSet,this.endTimesSet)
          return
        }

        //this.doRemove(toRem)
        doRem(toRem)

        this.addEvtPropsIntoSchedule(toAdd[0]) //this.currentDate, //could this overlap again?!? YES >>toHandle!!

        let f = this.updateCurrentSchedule() //to properly update schedule....
        console.log('fixyOverlaps::removeReplace::DONE', f)
        if (f.size > 0){ //umm handle other extra conflicts!!
            this.fixConflicts(f) 
        }

        return 
      }

      const forceAdd = (toChange, toAdd,conf) => {
        let goF = conf.direction == 'haut'

        doKeep(toAdd) //toKeep.push(toAdd)  //also add toChange?!?

        //console.log("forceYAdd",JSON.parse(JSON.stringify(toAdd)),JSON.parse(JSON.stringify(toChange)),conf)
        
        //no need below as added during recurChangeTime()
        //toAdd = this.addPropsEventsTo(this.currentDate,[toAdd]) //make sure it's still correct time...see removeReplace above!!

        console.log(`At ${conf?.targetStart?.time} forceAdd changing evtID:${toChange.id} from ${toChange.time} goFwd>>${goF}`,toAdd,conf,from) //due to ${.title}.  //toAdd, //conf
        
        //skipAsk user as should force! //toAdd[0]
        this.recurChangeTime(toChange.id,toAdd,conf.targetStart, true, true)

        //this.changeEvtTime(toChange.id,starty,false) // not better than above as doesnt space evts properly nor check overlapps!!
        
      }

      //extract the onOk and onCancel functions >>seems good :) 
      let okChoice = (og,c, toAdd,currScheduled,aConf) => {
        if(c == toAdd.id){
          removeReplace(currScheduled,toAdd,aConf)
        } else { 
          console.log(`by ${og},chose scheduled ${c}`, override)
          if(override){doRem(toAdd)}
          doKeep(currScheduled)
        }
      }

      let cancelChoice = (toAdd,currScheduled) => {
        aNotif(`Cancelling to keep scheduled '${currScheduled.title.trim()}'`) //by ${og}, ${currScheduled.id}-
        doKeep(currScheduled)
        if(override){
          console.log("huh OVERRIDE...fixyOverlaps::coolios removing>from:"+from,toAdd.title.trim())
          doRem(toAdd)
        }
      }

      let onDismissy = (mess) => {//so onDismiss here is where to prolly revert ALL*** todo maybe? or return array?!?
        console.log(mess,JSON.parse(JSON.stringify(removed)),JSON.parse(JSON.stringify(toKeep)),toHandleSize);
      }

      const chooseEvt = (opt,toAdd,currScheduled,aConf) => {
        if (opt =='opt3') { //pick Evt
          let m = 'Pick one event...'
          let labels = [
            {label: evtLabels(toAdd),value: toAdd.id },
            {label: evtLabels(currScheduled),value: currScheduled.id }
          ]

          //aRadio(opt,'',m,labels,toAdd,currScheduled,aConf)////to extract dialog!  >>meh rendering issues...can review later maybe...

          this.radioChoiceDialog('', 
            m,
            labels,
            '',
            function(d){okChoice("Event",d,toAdd,currScheduled,aConf)}, //if(d == toAdd.id){removeReplace(currScheduled,toAdd,aConf)} else { console.log('by Event,chose scheduled', d, override);if(override){doRem(toAdd)}; doKeep(currScheduled); }},
            function(){cancelChoice(toAdd,currScheduled)}, //aNotif(`Cancelling to keep "${currScheduled.title.trim()}"`); if(override){doRem(toAdd)}; //doKeep(currScheduled) ?!?...prolly
            function(){onDismissy('fixyOverlaps::opt3>>chooseEvt onDismiss by Event,remvd > Kept')}
          )

          //think returns would work here?! toTry**
        } else if (opt =='opt2'){ //by Score
          let m = 'Pick event by Score'
          let labels = [
            {label: `"${toAdd.title.trim()}" with Score:: ${toAdd.score} = ${this.parseScore(toAdd.score)}`,value: toAdd.id },
            {label: `"${currScheduled.title.trim()}" with Score:: ${currScheduled.score} = ${this.parseScore(currScheduled.score)}`, value: currScheduled.id }
          ]

          //aRadio(opt,'',m,labels,toAdd,currScheduled,aConf)

          
          this.radioChoiceDialog('',
            m,
            labels,
            '',
            function(d){okChoice("Score",d,toAdd,currScheduled,aConf)}, //if(d == toAdd.id){removeReplace(currScheduled,toAdd,aConf)} else{ console.log('by Score, chose scheduled', d,override);doKeep(currScheduled);if(override){doRem(toAdd)} }
            function(){cancelChoice(toAdd,currScheduled)}, //aNotif(`Cancelling to keep "${currScheduled.title.trim()}"`); if(override){doRem(toAdd)}; //doKeep(currScheduled) ?!?...prolly
            function(){onDismissy('fixyOverlaps::opt2>>chooseEvt onDismiss by Score,remvd > Kept')}
          )
          
          //think returns would work here!! toTry**
        } else if (opt =='opt1'){ //by Priority
          let m = 'Pick event by Priority'
          let labels = [
            {label: `"${toAdd.title.trim()}" with Priority = ${findPrio(toAdd)}`,value: toAdd.id },
            {label: `"${currScheduled.title.trim()}" with Priority = ${findPrio(currScheduled)}`,value: currScheduled.id }
          ]

          //aRadio(opt,'',m,labels,toAdd,currScheduled,aConf)
          this.radioChoiceDialog('',
            m,
            labels,
            '',
            function(d){okChoice("Priority",d,toAdd,currScheduled,aConf)}, //if (d == toAdd.id){ removeReplace(currScheduled,toAdd,aConf)} else { console.log('by Priority, chose scheduled', d,override); if(override){doRem(toAdd)}; doKeep(currScheduled) }
            function(){cancelChoice(toAdd,currScheduled)}, //aNotif(`Cancelling to keep "${currScheduled.title.trim()}"`); if(override){doRem(toAdd)}; //doKeep(currScheduled) ?!?...prolly
            function(){onDismissy('fixyOverlaps::opt1>>chooseEvt onDismiss by Priority,remvd > Kept')}
          )
          
          //think returns would work here!! toTry**
        } else{ //OPT4..FORCING...shouldnt have override flag!!
          forceAdd(currScheduled,toAdd,aConf)
        }
      }

    ///////////// START /////////

    let defaultOpts = [
        //{ label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
        //{ label: 'Choose by Score', value: 'opt2' },
        { label: 'Choose one event', value: 'opt3' }
    ]

    ////add relevant options....
    if (from == 'reloadScore'){
      defaultOpts.unshift({ label: 'Choose by Priority', value: 'opt1', color: 'secondary' })
    } else if (from == 'findSamePrio'){
      defaultOpts.unshift({ label: 'Choose by Score', value: 'opt2' })
    } else { //default all!
      defaultOpts.unshift(
        { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
        { label: 'Choose by Score', value: 'opt2' }
      )
    }

    //console.log("fixyOverlaps...START from>"+from,defaultOpts) //seems good!!

    for (let key in toHandle) {
      if (!toHandle[key] || !toHandle[key][0]){
        console.log("fixyOverlaps...ERROR no local found",key) //,conflicts
        continue //prolly continue?
      }
      
      let toH = toHandle[key]
      //console.log(`fixOverlaps::handlin...${key}`)  

      if (toH.length > 1) {//for multiple overlapps with same events
        console.log(`fixyOverlaps::WOAH WOAH...multiple overlaps!!`) //,JSON.parse(JSON.stringify(toH))
        this.multiConflicts(toH,from) //yup gotta pass in from too!..what about override?!?
        continue
      }

      const aConf = toH.pop()

      let toAdd = this.getLocalEvt(aConf.target) //number
      let currScheduled = this.getScheduledEvent(aConf.inConflict) 
      if (!currScheduled || !toAdd ){console.log("fixyOverlaps...ERROR ERROR no evts found!!!",aConf);return}

      console.log(`fixyOverlaps::adding ${toAdd.id}:${toAdd.title.trim()}(${toAdd.time})++${toAdd.duration} AT >> ${aConf?.targetStart?.time} --${aConf.direction} 
      \n Overlap with ${currScheduled.id}:${currScheduled.title.trim()}++${currScheduled.duration}`,override,'from:'+from) //aConf

      let mainOpts = defaultOpts 
      //[
        //{ label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
        //{ label: 'Choose by Score', value: 'opt2' },
        //{ label: 'Choose one event', value: 'opt3' }
      //]

      if (aConf.direction !== 'surrounding'){ //add force to schedule both evts
        mainOpts.push({ label: `Force in '${toAdd.title.trim()}' at ${aConf?.targetStart?.time}?`, value: 'opt4' })  //`Force both`
      }

      let mess = `'${toAdd.title.trim()}' Overlaps with Scheduled '${currScheduled.title.trim()}'.
      \nResolve or Cancel to keep '${currScheduled.title.trim()}'` 
      // at:${aConf?.targetStart?.time}

      this.radioChoiceDialog('Overlapping Events',
        mess,
        mainOpts,
        'opt1', //could be prob if no opt1...toMonitor**
        function(opt){//onOk
          chooseEvt(opt,toAdd,currScheduled,aConf)
        },
        function(){//onCancel // without conflicts!
          cancelChoice(toAdd,currScheduled)
          
          //aNotif(`Keeping scheduled "${currScheduled.title.trim()}"`) 
          //doKeep(currScheduled)
          //if(override){
          //  console.log("huh OVERRIDE... coolios removing",toAdd.title.trim())
            //removed.push(toAdd)
            //toKeep.push(currScheduled)
            //this.doRemove(toAdd)//should prolly remove...for drag/drop
          //  toRem(toAdd)
          //}
        },
        function(){//onDismiss
          console.log("fixyOverlaps::onDismiss,remvd > Kept",JSON.parse(JSON.stringify(removed)),JSON.parse(JSON.stringify(toKeep)),toHandleSize,from)
          //first dialog goes out of view >> nothing to do 

          //for below,when handled by multiConflicts() the removed/toKeep wont == toHandleSize 
          if (toKeep.length == toHandleSize || removed.length == toHandleSize ) {
            console.log(`fixyOverlaps::DONE?!? k=${toKeep.length},rm=${removed.length}`,toHandleSize)
          }

          //maybe >> this.updateCurrentSchedule() ??? >>toSee
        }
      )
    }

  },
  //when multiple evts to be added have conflict with single scheduled evt--used with fixyOverlaps!
  multiConflicts(conflicts,from=''){
    //let scheduled = null 
    let label = ''

    let toAdd = []
    let currScheduled = null //SHOULD be one evt instead of using Set >>let allConfs = new Set()
    let toKeep = []

    let targetStart = null //when...if has changed....

    let defaultOpts = [
                //{ label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
                //{ label: 'Resolve by lowest Score Interval', value: 'opt2' }, //should be more concise here--todo**
                { label: 'Pick one event', value: 'opt3' }
              ] //huh could actually show the conflicts evts's title here instead?--bof this can be chosen in one of the options....
    
      const mapToLabels = anEvt => {
          return { label: anEvt.title.trim() + " with (" + anEvt.score + ") for "+ anEvt?.duration+"mins", value: anEvt.id }
      }
      
      const findhighestPrio = allEvts => {
        let highest = 0
        let toRet = null

        for (let evt of allEvts) {
          //let one = this.getScheduledEvent(evt) //no need
          if(evt.parentGoal){
              let prt = this.parentGoalsMap().get(evt.parentGoal)
              if (prt){
                if (prt.priority > highest){ //umm what happens when no priority? **toTest**
                  highest = prt.priority
                  toRet = evt
                }
              }else{console.log('findhighestPrio..ERROR no PARENT found?',evt)}

          }else{console.log('findhighestPrio..ERROR EVT not found?',evt)}
        }

        console.log('multiConflicts::findhighestPrio...',toRet?.title.trim(), highest) //allEvts
        return toRet
      }

      let lowestScore = (conflictEvts) => { //umm toReview*** getting the lowestScore here or highest?!? >> highest..or most interval range!
        let lowScore = 0
        let current = null
        for (let e of conflictEvts) { //no need to pass conflictEvts?!?
          let daScore = this.parseScore(e.score)
          if(daScore > -1 && daScore >= lowScore) {
            lowScore = daScore
            current = e//e.id
          }else{console.log('multiConflicts::ERROR...parseScore?',daScore, e)}
        }

        if (current){
          console.log('multiConflicts::Score Chosen..lowest?', current.id,current?.title.trim(), current.score) //current) //,current.details
            
          //toKeep.push(current) //toSee if should use...
            
          return current
        }//else?--toHandle***
      }

      let removeConflicts = (toKeepArr, allConflicts) => { //toKeepArr should be single elt
        console.log(`multiConflicts::removeConflicts with toKeep=${toKeepArr.length} out of total:${allConflicts.length}`)

          allConflicts.forEach((value, valueAgain, set) => {
            //console.log(`removeConflicts..checking`,value.id) //valueAgain
            if (toKeepArr.find(item => item.id == value.id)){
              console.log(`multiConflicts::removeConflicts:KEEEP`,value.id, value?.title.trim(),targetStart)
              
              if (value.id != currScheduled.id){
                let eee = this.addPropsEventsTo(this.currentDate,[{...value,time:targetStart}])
                this.addEvtPropsIntoSchedule(eee[0])
              }else { //nothing to do for scheduled..
                console.log(`multiConflicts::removeConflicts...already scheduled!!`,targetStart, value)
              }
            } else {
              if (value.id == currScheduled.id){ //remove scheduled
                console.log(`multiConflicts::removeConflicts...removing scheduled!!`,value.id, value.title)
                this.doRemove(value)
              } //else {//nothing...no need to add it...prolly
               // console.log(`removeConflicts...NOT adding...`,value)
              //}
            }
          })

          //console.log(`removeConflicts:DONE`,toKeepArr.length) //get here after looping above? >>yeee 

          let f = this.updateCurrentSchedule() // to refresh endTimes..not available at call site!!
          console.log('multiConflicts::removeConflicts::DONE', f)
          if (f.size > 0){ //umm handle other extra conflicts!!
            this.fixConflicts(f) 
          }
      }

      let chooseEvt = (conflictEvts) => {
        this.radioChoiceDialog('',
            'Choose the event to schedule',
            conflictEvts.map(mapToLabels),
            '',
            function(d){ //onOk
              console.log('chooseEvt::chose',d)
              //if (d == currScheduled.id){//chosen scheduled...
              //    console.log('onOk::Chosen Scheduled', d,currScheduled.id) //should be same!!--no need for this...
              //}
              let e = conflictEvts.find(x => x.id == d)
              if(e){
                 toKeep.push(e)
              }else{console.log('chooseEvt::ERROR NOT FOUND!!',d);return} //can this happen?!? toMonitor**
              
              console.log(`chooseEvt::onOk >>${d} >> ${e?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
              return e
            }, 
            null, //onCancel--no need as have to choose!!!
            function(){//onDismiss
              //console.log('chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

              if (toKeep.length > 0 ) { //== conflicts.size te than main dialog!
                console.log('chooseEvt::LAST LAST?', JSON.parse(JSON.stringify(toKeep))) //,allConfs
                
                setTimeout(() => {
                  removeConflicts(toKeep,conflictEvts)
                }, 0)
              }
            }
        )
      }
    
    ////add relevant options....
    if (from == 'reloadScore'){
      defaultOpts.unshift({ label:'Resolve by Highest Priority', value: 'opt1', color: 'secondary'})
    } else if (from == 'findSamePrio'){
      defaultOpts.unshift({ label: 'Resolve by lowest Score Interval', value: 'opt2'}) //should be more concise here--todo**
    } else { //default all!--no force option here! 
      defaultOpts.unshift(
        { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
        { label: 'Resolve by lowest Score Interval', value: 'opt2' }, //concise--todo**
      )
    }

    for (let aConf of conflicts) {
      console.log("multiConflicts....handling:>",JSON.parse(JSON.stringify(aConf))) //toSee if have >> aConf.direction !== 'surrounding'  //+from,defaultOpts,

      let aScheduled = this.getScheduledEvent(aConf.inConflict)
      if (!aScheduled) {console.log("multiConflicts...ERROR ERROR no evts found!!!",aConf);return}
      
      if (!currScheduled){
        currScheduled = aScheduled
        targetStart = aConf?.targetStart?.time
      } else{
        if (currScheduled.id != aScheduled.id){console.log("multiConflicts...ERROR Not same inConflict",aScheduled.id);return } 
        
      }
      let addin = this.getLocalEvt(aConf.target)
      if (!addin) {console.log("multiConflicts...ERROR ERROR local evt not found!!!",aConf);return}

      label += ` '${addin?.title.trim()}',`
      toAdd.push(addin)

      if (aConf?.targetStart?.time != targetStart){ //just to see in case it could be forced in?!? toReview*** but shouldnt as need to decide on one evt 'tween multiple ones!
        console.log("multiConflicts...oh WELL timey timey", targetStart, aConf?.targetStart?.time, aConf.direction)
        //nothin to do...prolly
      }
    }

    let mess =  `${label} conflicts with scheduled '${currScheduled?.title.trim()}'\n
      Choose how to solve this...`
    
    toAdd.unshift(currScheduled) //just for completeness... prolly

    this.radioChoiceDialog('Overlap warning!!',
      mess,
      defaultOpts,
      '', //no selection at first..
      function(opt){ //onOk
        if(opt =='opt3'){
          chooseEvt(toAdd)
          //return ? //nothing?  //a//JSON.parse(JSON.stringify(a))
        } else if (opt =='opt2'){
          let a = lowestScore(toAdd)
          console.log('multiConflicts::opt2',a.id,a?.title.trim(), a.score) //,a.details //JSON.parse(JSON.stringify(toKeep))
          toKeep.push(a)
          //return
        } else {
          let a = findhighestPrio(toAdd)  //should return prio found for a notify mayhaps!! toKeep.push() at site instead --todo**
          console.log('multiConflicts::opt1',a.id,a?.title.trim(), a.score) //a.details,//JSON.parse(JSON.stringify(cIDs)),JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(toKeep)))
          //pick = a
          toKeep.push(a)
          //toRemove.add([...conflictEvts.filter(x => x.id != a.id)])
          //return a
        }
      },
      null,//onCancel...null so that it's false for cancel btn! Cancel SHould keep scheduled!! --todo** //function(){},  >>
      function(){ //onDismiss.
        if (toKeep.length > 0) { //== conflicts.size
          console.log('multiConflicts::MAIN LAST LAST?',JSON.parse(JSON.stringify(toKeep)))
            
          setTimeout(() => {
            removeConflicts(toKeep,toAdd)  //,allConfs //huh have use an inner lambda function!!
            //console.log(`fixConflicts::setTimeout::MAIN::DONE`,toKeep.length)
                  
          }, 0)
            
        }//else{console.log(`fixConflicts...END`)} //no need 
      }
    )
  },
  //walk through conflict and resolve by scheduling higher priority evts or use score...
  //BEWARE--Already scheduledEvts and uses SameStart times!!
  fixConflicts(conflicts){
    //let toSolve = conflicts.size
    console.log("fixConflicts...Start", conflicts,conflicts.size) //, JSON.parse(JSON.stringify(conflicts))
      
    
      const findhighestPrio = allEvts => {
          let highest = 0
          let toRet = null

          for (let evt of allEvts) {
              let one = this.getScheduledEvent(evt)
              if (one){
                  let prt = this.parentGoalsMap().get(one.parentGoal)
                  if (prt){
                      if (prt.priority > highest){ //umm what happens when no priority? **toTest**
                           highest = prt.priority
                           toRet = one
                      }
                  }else{console.log('findhighestPrio..ERROR no PARENT found?',one)}

              }else{console.log('findhighestPrio..ERROR EVT not found?',evt)}
          }

          console.log('fixConflicts::findhighestPrio...',toRet?.title.trim(), highest) //allEvts
          return toRet
      }
      
      const mapToLabels = anEvt => {
          return { label: anEvt.title + " at " + anEvt.score, value: anEvt.id } // color: 'secondary' >>should prolly see look**
      }

    let toKeep = [] //to keep...removing all other conflicts in the end!
    //let toRemove = new Set();
    let allConfs = new Set(); // for keeping all unique conflicts...
    let mainOpts = [
                { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
                { label: 'Resolve by lowest Score Interval', value: 'opt2' },
                { label: 'Pick event', value: 'opt3' }
              ] //huh could actually show the conflicts evts's title here instead?--bof this can be chosen in one of the options....
    
    
    for (let conflict of conflicts) {
      //let pick = null //see if better than picks[]
      let cIDs = this.retrieveSameStart(conflict.at)
      console.log("fixConflicts:conflict", JSON.parse(JSON.stringify(conflict)),JSON.parse(JSON.stringify(cIDs)) )
      
      let conflictEvts = [] 
      let label = ""

      //so for each conflict, dialog to choose how to resolve this...
      for (let id of cIDs) {
        let one = this.getScheduledEvent(id)
        if (one){
          conflictEvts.push(one)
          label += ` '${one?.title.trim()}',`
          allConfs.has(one) ? console.log(`Set already contain ${one.id}~${one.title}..skipping`) : allConfs.add(one)
        }else{console.log("fixConflicts...ERROR not found?", id)}
      }
      
      //toRemove.add(conflictEvts) //better? nah just adds them all!

        let onOk = (opt) => {
          console.log('onOk::Chosen Manually', opt)
          let one = this.getScheduledEvent(opt)
          if(one){
            //pick = one
            toKeep.push(one)
            //toRemove.add([...conflictEvts.filter(x => x.id != one.id)])
            return one
          } else {
            console.log('fixConflicts::onOk:: ERROR?!?! Not found', opt)  //can get here?!?! toTest**
            one = this.getLocalEvt(opt)
            if(one){
              //pick = one 
              toKeep.push(one)
              //toRemove.add([...conflictEvts.filter(x => x.id != one.id)])
              return one
            }else{console.log('fixConflicts::onOk:: ERROR ERROR..still not found!!!',opt);return false } //see about the return false.....
          } 
        }

        let lowestScore = () => { //umm toReview*** getting the lowestScore here or highest?!? >> highest..or most interval range!
          let lowScore = 0
          let current = null
          for (let e of conflictEvts) { //no need to pass conflictEvts?!?
            let daScore = this.parseScore(e.score)
            if(daScore > -1 && daScore >= lowScore) {
              lowScore = daScore
              current = e//e.id
            }else{console.log('fixConflicts::ERROR...parseScore?',daScore, e)}
          }
          
          if (current){
            console.log('fixConflicts::Score Chosen..lowest?', current.id,current?.title.trim(),current.details, current.score) //current) //
            //pick = current  
            toKeep.push(current)
            //toRemove.add([...conflictEvts.filter(x => x.id != current.id)])
            return current
          }//else?--toHandle***
        }

        let chooseEvt = () => { //pass in param...todo**
          //let eee = null
          this.radioChoiceDialog('',
            'Choose the event to schedule',
            conflictEvts.map(mapToLabels), //no need to pass conflictEvts?!? confirm dont use current loop's var!!
            '',
            function(d){
              let eee = onOk(d)
              //toKeep.push(eee)  //no need to push as already done in onOk...wait for return?!?
              console.log(`fixConflicts--chooseEvt::onOk >>${d} >> ${eee?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
              return eee
            }, 
            null,
            function(){//onDismiss
              console.log('fixConflicts--chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

              if (toKeep.length == conflicts.size) { //so last conflict...usually inner dialog has up to date than main dialog!
                console.log('fixConflicts--chooseEvt::LAST LAST?', JSON.parse(JSON.stringify(toKeep)),allConfs)
                
                setTimeout(() => {
                  removeConflicts(toKeep,allConfs)
                  console.log(`fixConflicts::setTimeout::chooseEvt::DONE`,toKeep.length)
                  
                  //let f = this.updateCurrentSchedule() // to refresh endTimes..runs after removeConflicts() //cant do here but in lambda smh
                  //console.log('fixConflicts::onDismiss::chooseEvt AFTER removeConflicts', f) //just check...
            
                  //this.disableSaveSchedule = false //enable save schedule
                  //this.updateButtons(false, null, null) //dont show default..prolly no need?!?
                    
                }, 0)
              }
            }
          )
        }

        let removeConflicts = (toKeepArr, allConflicts) => {
          allConflicts.forEach((value, valueAgain, set) => {
            //console.log(`removeConflicts..checking`,value.id) //valueAgain
            if (toKeepArr.find(item => item.id == value.id)){
              console.log(`fixConflicts::removeConflicts:KEEEP`,value.id, value?.title.trim())
            }else{
              this.doRemove(value)
            }
          })

          //console.log(`removeConflicts:DONE`,toKeepArr.length) //get here after looping above? >>yeee 

          let f = this.updateCurrentSchedule() // to refresh endTimes..not available at call site!!
          console.log('fixConflicts::removeConflicts::DONE', f)
          if (f.size > 0){ //umm handle other extra conflicts!!
            this.fixConflicts(f) 
          }
            
          //this needed?!? >>doesnt seems so!! --toMonitor**
          //this.disableSaveSchedule = false //enable save schedule
          //this.updateButtons(false, null, null) //dont show default..prolly no need?!?
        }

      let mess = `${label} scheduled at same ${conflict.at}.\n
      Choose how to solve this...`

      this.radioChoiceDialog('Overlap warning!!',
        mess,
        mainOpts,
        'opt1', 
        function(opt){ //onOk
          if(opt =='opt3'){
            chooseEvt()
            console.log('fixConflicts::opt3', JSON.parse(JSON.stringify(toKeep))) //runs too fast!! //JSON.parse(JSON.stringify(a))
            //return ? //nothing?  //a
          } else if (opt =='opt2'){
            ///console.log('fixConflicts::opt2',JSON.parse(JSON.stringify(toKeep)))
            return lowestScore()
          } else {
            let a = findhighestPrio(cIDs)
            console.log('fixConflicts::opt1',a.id,a?.title.trim(),a.details, a.score) //JSON.parse(JSON.stringify(cIDs)),JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(toKeep)))
            //pick = a
            toKeep.push(a) //only case that pushes here as already pushed in other cases....
            //toRemove.add([...conflictEvts.filter(x => x.id != a.id)])
            //return a
          }
        },
        null,//onCancel...null so that it's false for cancel btn!  //function(){}, 
        function(){ //onDismiss.
          console.log('fixConflicts::onDismiss Main >>',toKeep.length) //JSON.parse(JSON.stringify(toKeep))
          
          //toSolve -= 1
          //if (toSolve == 0){ //to have it executed at end end...but for choosing it's not yet complete...smdh  >>better use toKeep.length check
          if (toKeep.length == conflicts.size) {
            console.log('fixConflicts::MAIN LAST LAST?',JSON.parse(JSON.stringify(toKeep)),allConfs)
            
            setTimeout(() => {
              removeConflicts(toKeep,allConfs)  //huh have use an inner lambda function!!
              console.log(`fixConflicts::setTimeout::MAIN::DONE`,toKeep.length)
                    
            }, 0)
     
          }
        }
      )
      //in setTimeout() before....
      //let toActualRem = [] 
      //make sure that each set doesnt have previous chosen solution from toKeep...very inefficient!
      //for (let value of toRemove) {   //let [entry, val] 
      //  console.log('setTimeout::MAINaaa',value, typeof value) //entry, 
      //let eug = val.filter(x => !toKeep.find(item => item.id == x.id)) //slurp those not in toKeep  
      //toActualRem.push(eug)
      //}
      //console.log('fixConflicts::toActualRemove',JSON.parse(JSON.stringify(toActualRem)))

    }

    return true //should return false in error? tbd** >>even return?!?
  },
  loadForDate(onDate, hasSavedEvents, inPast){
      let savedEvtFunc = (key, val) => {
          return {
            id:parseInt(key),
            duration: val.duration, //30,
            time: val.time //"01:30"
          }
      }

      let doLoadNotPresent = () => {
        let evts = this.getEventsForDate(onDate)
        if (!evts) {console.log(`ERROR no evts found for ${onDate}...`, evts); return}
        
        console.log(`doLoadNotPresent ${onDate}::evts=${Object.keys(evts).length}`) //JSON.parse(JSON.stringify(evts))
        
        let arr = Object.keys(evts).map((key) => savedEvtFunc(key,evts[key]))
        this.scheduledEvents = this.addPropsEventsTo(onDate, arr) //arr
        
        //console.log("doLoadNotPresent:scheduled",JSON.parse(JSON.stringify(this.scheduledEvents)))
          
        let e = this.updateCurrentSchedule() //just checks for startTimes only TOFIX**
          
        if (e.size > 0 && !inPast){//review overlaps in futur only
          console.log(`doLoadNotPresent..FIX overlaps for ${onDate} in past:${inPast}`,e) //JSON.parse(JSON.stringify(e))
          this.doNotify(`${inPast ? 'past': 'future'}: ${onDate} with Some overlaps to fix!`, "warning",'bottom')

          this.fixConflicts(e)
          
          //this.disableSaveSchedule = false  //conflicts as user could change schedule?TBD**
        } else {
          this.showReloadBtn = false
          this.disableSaveSchedule = true
          this.doNotify(`Loaded schedule for ${inPast ? 'past': 'future'}:: ${onDate}`, "positive",'bottom')
        }

        //return e.size //'ouais' //see about return...especially for conflicts... >>no point as goes too fast!
      }

      let OverlapCheckLoadToday = () => {
        let evts = this.getEventsForDate(onDate)
        if (!evts) {console.log(`ERROR no evts found for today:${onDate} ?!?`, evts); return}

        //console.log("OverlapCheckLoadToday:evts", JSON.parse(JSON.stringify(evts))) //Object.keys(evts).length >> not an array but object...smh


        let arr = Object.keys(evts).map((key) => savedEvtFunc(key,evts[key])) //?!? ,id=key //[...evts[key]]

        //let arry = Object.entries(evts).map((key) => savedEvtFunc(key[0],key[1])) //works as well but using above...toSee**

        let toReload = this.addPropsEventsTo(onDate, arr) //evts

        console.log(`OverlapCheckLoadToday ${onDate} loading:${toReload.length} into current:${this.scheduledEvents.length} == ${this.dailyScheduled.size}`) 

        // check that no overlap !!
        let euhOverlaps = this.overlapCheckEvtsAdd(toReload) //, onDate
    
        Object.keys(euhOverlaps).length > 0  ?
        this.doNotify(`${onDate} with Some overlaps to fix!`, "warning",'bottom') :
        this.doNotify(`Loaded schedule for ${onDate}`, "positive",'bottom')

        return euhOverlaps //overlaps
      }

    // reset maps first...
    this.scheduledEvents = []
    this.updateCurrentSchedule()
      
    if(hasSavedEvents) {
      if (this.isViewingToday()){
        let toHandle = OverlapCheckLoadToday()
         
        if(Object.keys(toHandle).length  > 0) {
          console.log('Overlaps toHandle >>',JSON.parse(JSON.stringify(toHandle)))
          //also it might get re-ordered as keys be int?!? >>yup does!! smh
          
          this.fixyOverlaps(toHandle)
          
          this.showReloadBtn = hasSavedEvents
          this.showClearBtn = hasSavedEvents
          this.disableSaveSchedule = false

          this.evtStartedOrPassed(parseDate(new Date())) //umm missing?
          this.resetButtons(hasSavedEvents,inPast)

          return //needed in order to properly enable btns! 
        }

        this.evtStartedOrPassed(parseDate(new Date()))
        this.disableSaveSchedule = true  //prolly better
         
      } else {//past || future 
        doLoadNotPresent()  
        this.allowScoreEdit(inPast) // enable scoreEdit...disable score edit in future!!
        //console.log(`doLoadNotPresent return....`) //,anyConf //see if return is consistent...
        
        //set the showReloadBtn && default btn(hidden)
        //this.showReloadBtn = hasSavedEvents
        this.showClearBtn = !inPast //dont show in past!

       // this.resetButtons(hasSavedEvents,inPast) //umm redundant with invocation at end below?!?yup seems so
      }
    } else {
      this.showReloadBtn = false //prolly for clearing when viewing diff days?!? tbd
      this.showClearBtn = false
      this.disableSaveSchedule = true  //see if proper here
    }
   
    if(inPast || onDate !== today()) { //adjustTime for past && futur 
        console.log("adjusting time for past/future", onDate,this.scheduledEvents.length)
        this.adjustCurrentTime()
    }

    //console.log(`loadForDate...got here too fast? ${hasSavedEvents} >> inPast:${inPast}`) 
    this.reset()
    this.resetButtons(hasSavedEvents,inPast) //not using this.hasEventsForDate as shows default button again!

  },
  scheduleDefaults(flag){ //schedule InDefaults Evts with flag to overwrite/add to schedule 
    
    let dEvts = this.deepCopy(this.store.fetchDefaults()) //resets reference >>does!
    //console.log(`InDefault:${this.currentDate}`,dEvts)

    let inPast = this.isViewingPast()

    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = !inPast && dEvts.length > 0  //umm prolly AND...//oldie>> this.hasEventsForDate

    //do the below before or after.
    this.resetButtons(true,inPast)
    this.disableSaveSchedule = !(dEvts.length > 0) //false
    //this.reset() //umm prolly not... in case have other settings like onScore/Prio.

    if(this.isViewingToday()){ //do overlap check for today only...

      let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
  
      if(flag == 'add'){ 
        let orig = toReload.length
        toReload = toReload.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
        console.log(`scheduleDefaults..ADDIN from ${orig} to ${toReload.length}`,toReload)
      }

      console.log(`scheduleDefaults:${this.currentDate} with ${flag}`,toReload.length) //JSON.parse(JSON.stringify(toReload))
      
      let euhOverlaps = this.overlapCheckEvtsAdd(toReload) //no need for date prolly  //this.currentDate

      if(Object.keys(euhOverlaps).length > 0) {
        console.log(`scheduleDefaults overlaps on:${this.currentDate} ${dEvts.length} == ${toReload.length} ?!? of size:${Object.keys(euhOverlaps).length}`),  
        
        this.fixyOverlaps(euhOverlaps)
      }

      this.evtStartedOrPassed(parseDate(new Date()))
      
      return

    } else { //schedule without overlap check for past/future
        let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
        if(flag == 'add'){//still check for add flag in future though
          let orig = toReload.length
          toReload = toReload.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
          console.log(`scheduleDefaults..ADDIN to ${this.currentDate} of ${this.scheduledEvents.length} from ${orig} to `,toReload.length)
          let f = this.scheduledEvents.concat(toReload)
          this.scheduledEvents = f
        }else{
          this.scheduledEvents = toReload
        }
      
      //let e = this.addPropsEventsTo(this.currentDate, this.returnNewEvts(true)) //instead of assigning with >> this.scheduledEvents = ...
      let sameStart = this.updateCurrentSchedule()
      console.log('scheduleDefaults..sameStart?', sameStart)

      inPast ? this.allowScoreEdit(true) : this.allowScoreEdit(false)

    }
  },
  reset() { //reset variable for next use 
    this.draggedItem = null
    this.targetDrop = null
    //
    this.chosenScore = null
    this.chosenPrio = null

    this.possibleRange = null //enable after test**

  },
  deepCopy(obj){ //deep copy object
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item));
    }

    const copied = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        copied[key] = this.deepCopy(obj[key]);
      }
    }

    return copied;
  },
  /////////////////////////////// EVENT HANDLERS //////////////////////////
  onRefresh(done) {  //test to drag for refresh
      setTimeout(() => {
        //oldie >> this.fetchScheduledEvents(this.currentDate) //this.loadSavedEvents(this.currentDate) //, false
        this.scheduledEvents = []
        this.updateCurrentSchedule()
        this.resetGoalEvts(true)
       
        this.loadForDate(this.currentDate,this.hasEventsForDate,this.isViewingPast())
        
        done()
      }, 1000)
  },
  //save the current schedule into localStorage
  doSaveSchedule() {
      //console.log(`doSaveSchedule for ${this.currentDate}`,this.dailyScheduled)
      //const toSave = []
      let toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
    

      if (this.dailyScheduled.size < 1){ //clearing day
          toSave = null 
      } else {
          this.dailyScheduled.forEach( (value, key, map) => {
              toSave[key] = {  //minimalistic
                  //id: key,
                  //date: value.on, //redundant
                  duration: value.for,
                  time: value.start.time, //should be present and got the current (perhaps changed) timestart...add guardrail though to set to default originalAt?**Tbd
                  //originalAt: value.originalAt,
                  //atScore: value.score
              }
              //for isViewingPast...add flag? TODO** with logic to distinguish what was already there prolly...
          })
      }

     //console.log("doSaveSchedule", toSave)
     this.store.saveDailySchedule(this.currentDate, toSave) 
     this.disableSaveSchedule = true 
     this.showReloadBtn = false
     this.showClearBtn = toSave != null //to clear...maybe...

     this.doNotify(`doSaveSchedule for ${this.currentDate}`, "positive", "top")

     return
  },
  addParentGoal(title, details,color = "red-14", priority = 2){ //default color and priority 
    //let currentColors = {} //or array?!?
    let currentArr = []

    //to select random color..
    this.parentGoalsMap().forEach( (value, key, map) => { //extract already taken colors
      let bC = value.bgcolor
      //console.log(`bgcolor:${bC}`, key)
      //currentColors[bC] = key  //no need for key...could do >>currentColors[bC] = true ?!?  
      currentArr.push(bC) //OR even push in an array...
    })

    let AllColors = pGColors()

    let sizey = currentArr.length //Object.keys(currentColors).length >> //if (sizey > 1){
  
    if(sizey > 1){
      //while (currentArr.some(item => !pGColors.find(c => c == item))) {? //>>dont make sense as pGColors is superset!! 

      //choose random index of new color..from all those not already taken
      let i = sizey + 1
      while (currentArr.some(clr => AllColors[i] == clr)) { //while index is found in current colors...have a new index... expensive??!? toSee...
        console.log("addParentGoal::index with taken color...new random",i,AllColors[i])
        i = Math.floor(Math.random() * sizey)
      }

      let newy = AllColors[i]

      //console.log(`bgcolor..NEW:`,JSON.parse(JSON.stringify(newy)),JSON.parse(JSON.stringify(newC)))
      console.log(`addParentGoal::bgcolor..index ${i} from ${color} to: `,newy)  
      color = newy ? newy : color 

    }

    return this.store.addMainGoal(title, details, color, priority)
        
  },
  onAddNewEvent(goalTitle, parentGoal, own, interval){
   
    if (!this.possibleRange){
      console.log("umm onAddNewEvent... not a range selection", this.startEndTimes)  //just in case it's single cell selction
      this.possibleRange = this.startEndTimes
    }
    if (goalTitle.trim() == ""){
      this.doNotify("Empty Goal title...")
      this.addEventDialog = false
      this.reset()
      return
    }

    let timeStart = parseTimestamp(this.possibleRange[0])
    //let tosee = parsed(this.possibleRange[0])
    let timeEnd = interval > 15 ? addToDate(timeStart, { minute: parseInt(interval)}) : addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15}) 
    //oldie >> 15 mins for when single timeslot selection

    //below redundant when set the interval...smh
    let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

    console.log(`onAddNewEvent:${goalTitle} :${own}: from ${timeStart.time} till ${timeEnd.time}.Duration:${duration}`,interval)
    
    let subID = null 
    if(own == "self"){ //add it as self >> create parent goal with this as subgoal
      let pId = this.addParentGoal(goalTitle, goalTitle, "purple-10", 2) //oldie >>this.store.addMainGoal(goalTitle, "", "purple-10", 2)  //default color and priority
      if (pId) {
        console.log("SELF parent Goal created",pId)

        subID = this.store.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) //canMove and notInDefaults. isAlternative when duration<30
        
      } else {//could be for first first parentGoal---toTest**
        console.log("ERROR? no pID", pId)
        //
        //return? or just add it?tbd
      }
    } else { //just add it to Misc parentGoal(that have all one-off kind of stuff)
      if (parentGoal){//add it to parentGoal
        console.log("with parentGoal "+parentGoal.id,parentGoal?.title)
        subID = this.store.addSubGoal(parentGoal.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30) 
        //!canMove and notInDefaults. isAlternative when duration<30

      } else { //any Misc parentGoal available?
        let pMisc = this.store.getGoalByTitle("Misc")
        if(!pMisc){
          let iD = this.addParentGoal("Misc", "Miscellaneous", "grey-10", 2)
          if (iD) {
            console.log("NEW Misc pGoal created",iD)
            subID = this.store.addSubGoal(iD,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) 
            //canMove and notInDefaults.isAlternative when duration<30
          }
        } else{
          console.log("Woo!! Misc pGoal already exists!", pMisc.id) //
          subID = this.store.addSubGoal(pMisc.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30)
          //!canMove and notInDefaults.isAlternative when duration<30
        }
      }
    }

    if (subID) {
      this.resetGoalEvts(true) //update from storage....

      //let euhOverlaps = this.overlapCheckEvtsAdd(toAdd) //meh nah

      let isClose = this.tooClose(timeStart, duration)
      if(isClose){ 
        console.log("onAddNewEvent::tooClose check FAIL!!",isClose) // check actually helps when checking overlaps below as get wrong conflicts!! 
        isClose === true ? this.doNotify(`'${goalTitle}' created But Not added as over midnight!`) : this.doNotify(`'${goalTitle}' created But Not added as too close to a scheduled Evt!!`)
        
        this.addEventDialog = false //needed still with closingDialog?!? >> yep as reverts to default choice dialog...
        //this.reset() //no need 
        return
      }

      let oOth = this.hasOverlappingEvent(subID, timeStart, duration)
      
      if (oOth.length > 0) {
        let euhOverlaps={}
        for(let i = 0; i < oOth.length; i++){
            let toH = oOth[i]
            if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
            // >>shouldnt have more than one?!? toTest**
        }
        console.log("onAddNewEvt:: OVERLAPS handling",JSON.parse(JSON.stringify(euhOverlaps)))
        this.fixyOverlaps(euhOverlaps) //>>using flag seem bad for now But when choosing scheduled, helps to rem evt---umm should delete?!?...toMonitor***
        //oldie >> no need for flag? >>actually yes if handling overlaps after adding -- instead of checking first!
        
      } else {
        let toAdd = this.addPropsEventsTo(this.currentDate,[{ //this.currentDate,
          id: subID,
          time: timeStart.time,
          title: goalTitle,
          score: '2on5',
          duration: duration,
          canMove: parentGoal ? false : true  //when pGoal then assume it cannot move otherwise should by default...prolly 
        }])
        console.log(`onAddNewEvt, addEvtPropsIntoSchedule: ${subID} at ${timeStart.time}`) //,toAdd
        
        this.addEvtPropsIntoSchedule(toAdd[0])
      }

      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = !(this.isViewingPast())  //shouldnt show in past!

      this.constructTree() //update to show newest

      //bon toReview if shouldnt save immediately but give choice to user to add some more!!---could pass in flag above to autoSave on dismiss(when inPast!!)--same here!!
      //this.doSaveSchedule()

    } else{
      console.log("BOO ERROR no subID:(",subID)
      this.doNotify("Error creating and adding this event :(", "negative")
    }

    this.addEventDialog = false  //still have to close dialog
    //this.reset()
  },
  tooClose(timey, duration){ //too close to other evt--within 10min OR near end of day and would go into next...

    let compareTime = addToDate(timey,{ minute: 0})
    let tTime = this.getTimeNumber(compareTime)
    
    //could add duration to get endTime prolly...if needed.
    //let midnight = new Date() //issue when in future as would use current day's
    //let midnighty =new Date(timey.date) //meh midnight of day..not helpful
    let e = addToDate(timey, { day: 1}) //this proper to use next day's
    let midnightiey = new Date(e.date)
    //midnight.setDate() //? >>nah
    //midnight.setHours( 24 )
    //midnight.setMinutes( 0 )
    //midnight.setSeconds( 0 )
    //midnight.setMilliseconds( 0 )

    //midnighty.setHours( 24 )
    //midnighty.setMinutes( 0 )
    //midnighty.setSeconds( 0 )
    //midnighty.setMilliseconds( 0 )

    midnightiey.setHours( 24 )
    midnightiey.setMinutes( 0 )
    midnightiey.setSeconds( 0 )
    midnightiey.setMilliseconds( 0 )
    
    let middy = parseDate(midnightiey)
    
    let isClose = Math.floor((diffTimestamp(compareTime,middy)/1000)/60)  //minutes till midnight
    
    if (isClose < duration) {//so when isClose < duration, then would bleed into next day!!--Dont allow!!!
      console.log("tooClose to midnight eh...:(",isClose, e, midnightiey)
      return true 
    }
     //diffTimestamp(now,endTime) //endTimes < now would be that evt hasnt ended! 
    let toRet = false

    //check scheduled higher than timey BUT very close..
    this.dailyScheduled.forEach((value, key, map)=> {
      let eStart = this.getTimeNumber(value.start)
      //let eEnd = this.getTimeNumber(value.end) //no need 
      //let hasEnded = tTime >= eEnd
      let diff = eStart - tTime
      let another = diffTimestamp(compareTime,value.start) //,true flag to discard earlier evts!!! //using timey is same!
      let bo = Math.floor((another/1000)/60) //umm div by 0? seems ok...toMonitor***
      
      if (bo <= 10 && diff > 0){ //have to use duration to discard those in past? >>nah could just check negative!!
        console.log("tooClose...:("+key,diff,another,bo)
        toRet = key  //meh overwrites but oh well!
      }
    })

    return toRet
  },
  onPickEvent(addE,flag) { //flag is for skip Asking
    
    this.addEventDialog = false

    if(!addE){
      console.log("onPickEvent...ERROR nothing!", addE, flag)
      this.doNotify("No Goal selected...")
      this.reset()
      return 
    }
   
    let addy = this.getScheduledEvent(addE.id)

    //console.log("onPickEvent...I be picking", JSON.parse(JSON.stringify(addy)), addE, flag)

    if (!addy){

      addy = addE
      
      let doForce = this.isViewingPast() ? true : flag //this.force  //inPast >>just force!!

      console.log(`onPickEvent:: (${addy.id})'${addy.title.trim()}' from ${addy.time} to ${this.targetDrop.timestamp.time} with force?${flag} BUT Forcing?:${doForce}`)

      let isClose = this.tooClose(this.targetDrop.timestamp, addy.duration)//could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt** 
      if(isClose){
        console.log("onPickEvent::tooClose check FAIL!",isClose) // check actually helps when checking overlaps below as get wrong conflicts!! 
        if(isClose === true){
          this.doNotify("Picking event TOO close to midnight!")
          this.reset()
          return
        }

        if(doForce){ 
          this.doNotify(`'${addy.title.trim()}' TOO close to a scheduled Evt...forcing!`)
        } else{
          this.doNotify(`'${addy.title.trim()}' Not added as TOO close to a scheduled Evt`)
          this.reset()
          return 
        }
      }
      
      let anyOverlap = this.hasOverlappingEvent(addy.id, this.targetDrop.timestamp, addy.duration)
      let sizey = anyOverlap.length
      if(sizey > 0) {
        // oldie>> this.handleOverlaps(toHandle)?!? >>below better in order to handle recursive overlaps
        console.log(`onPickEvent::overlaps!!!`,JSON.parse(JSON.stringify(anyOverlap)))
        //let i = 0
        //do {
            //this.recurChangeTime(anyOverlap[i].inConflict,addy, this.targetDrop.timestamp,doForce, true) //anyOverlap[i].direction=='haut', 
        //} while (++i < sizey)

        //bon see about using fixyOverlaps() for consistency with addingNewEvent
        //PROBLEM though is losing the other params like force flag and doAdd...>>so far no problems and seem better actually!...toMonitor***
        let euhOverlaps={}
        for(let i = 0; i < sizey; i++){
            let toH = anyOverlap[i]
            if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
            // >>shouldnt have more than one?!? toTest**
        }
        
        // with force flag:${flag} while viewing in past?${this.isViewingPast()} and force:${doForce}
        console.log(`onPickEvent::OVERLAPS of size: ${sizey} and force:${doForce}`,JSON.parse(JSON.stringify(euhOverlaps))) 
        this.fixyOverlaps(euhOverlaps)
        
      } else {
        console.log("onPickEvent NO overlaps...changing to targetDrop with ", doForce)

        this.changeEvtTime(addy.id, this.targetDrop.timestamp, doForce, true)
      }
    } else {
      console.log("onPickEvent...NOT NEW?!?ERROR!", addy, addE) //shouldnt get here!!--ToSEE**
      return
    }

    //console.log(`onPickEvent for ${addy.id} complete with force:${flag}`, this.scheduledEvents.length) //this.force
      
    
    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate  //when hasSaved evts as could potentially clear schedule!
    this.showClearBtn = !(this.isViewingPast()) //oldie >> true //prolly

    
    //this.reset() //needed?!? prolly not..
    
  },
  //hide the main dialog and show the pickEvent dialog
  closingDialog(){ //should add flag to not actually closeDialog?!? >>no need as using single dialog now!
    //console.log("closingDialog...scheduleDialog") 
    
    this.addEventDialog = false
    this.reset() //just in case...toSee if not too much...
  },
  onEndNow(evtID){
    const now = parseDate(new Date())

    let hasEvts = this.hasEventsForDate //as changes too fast for reloadBtn

    //reduceDuration(evt)
   //so just remove the remaining duration of event when completed earlier than expected /so could also remove the event entirely if hasnt started eh
    if(this.dailyScheduled.has(evtID)){
      let evt = this.dailyScheduled.get(evtID)
      let starty = evt.start
      let endy = evt.end

      if (isBetweenDates(now, starty, endy, true)){ //umm what if it's already completed evt?>>SHOULD edit score--todo
        //let diffy = diffTimestamp(now, starty) //prolly no need to check for negative as done above line ...hopefully**TOTEST
        
        let o = this.getTimeNumber(endy) - this.getTimeNumber(starty)  //how this larger?!? should be duration
        let anotherDiff = this.getTimeNumber(now) - this.getTimeNumber(starty) //duration of event with change

        //console.log(`end data be:`,starty.time,endy.time) //evt

        console.log(`Great, ${evtID} REDUCING duration from ${o} to:`, anotherDiff)
        for(let i = 0; i < this.scheduledEvents.length; i++) { //use filter here instead prolly--toImprove
          let obj = this.scheduledEvents[i]
          if (obj.id === evtID){
            obj.duration = anotherDiff
          }
        }
        this.dailyScheduled.set(evtID, {...evt, for:anotherDiff, end:now})
        
        if(!this.endTimesSet.delete(endy.time)){ //make sure as should not happen--toTest**
          console.log(`ERROR endTimesSet item does not exist?!?`,evt, this.endTimesSet)
        }

        this.endTimesSet.add(now.time) //also update this

        //no action for startTimesSet methink

      }else{
        console.log(`umm aint in the middle of this event! Nothing to do...ERROR?`,now.time, starty.time, endy.time)
      }
    } else {
      console.log(`ERROR doEndNow not found!!!`, evtID)
      return
    }

    this.disabledScoreEvts[evtID] = false  //bon updating score
    
    //since enableSave--also show reloadBtn
    this.disableSaveSchedule = false
    this.showReloadBtn = hasEvts
    this.showClearBtn = !this.isViewingPast && this.scheduledEvents.length > 0 //true //prolly

  },
  onSaveScore(newVal, id){

    let ev = this.dailyScheduled.get(id)
    if (ev){
      let f = this.getLocalEvt(id)
      //console.log(`oooh onSaveScore from ${ev.score} to ${newVal}`, id,JSON.parse(JSON.stringify(f)))

      //also add check to do second value is higher than first...for later score calculations!
      //--should keep historical score change for goal?!? to see progres....toSee**tbd
      let dif = this.parseScore(newVal)
      if (dif < -1) {
        this.doNotify("Score Error: higher# on lower#")
        return
      }
      
      ev.score = newVal
      //this.store.saveSubProp(id, null, newVal)
      this.doSaveEvtProp(id, null, newVal)

      let h = this.getScheduledEvent(id) //send changes down to child component...
      if (h){
          h.score = newVal
      }else{console.log('onSaveScore ERROR not found',h, id) }

    }else {
      console.log(`ERROR onSaveScore could not find event ${id}?!?`) //this would be baaad! 
    }
  },
  onClearDay(){
    if(this.isViewingPast()){
      this.doNotify("Editing past is no no!") //should confirm instead?!?meh
      return
    }

    this.scheduledEvents = []
    this.updateCurrentSchedule()
    this.resetGoalEvts(true)
    this.doNotify(`Cleared daily schedule`, "warning",'top')
    
    //reset?!?
    this.reset()

    let hasSaved = this.hasEventsForDate
    //console.log(`onClearDay`, hasSaved)
    //btns to show/hide?
    this.showReloadBtn = hasSaved
    this.showLoadDefaults = true
    this.showClearBtn = false //hide btn of course
    this.disableSaveSchedule = !hasSaved  //enable if hadSavedEvts! 
    //prio/score?!?

  },
  onReloadSaved(){ //no need for conflicts >> conflicts = null

    let hasEvents = this.hasEventsForDate 
    //console.log('doReloadSaved:',this.currentDate,conflicts, hasEvents)

    let doCancel = () => {
          console.log('Aborting', this.currentDate,this.scheduledEvents, hasEvents)
          this.showReloadBtn = !this.isViewingPast() || hasEvents //toTest**
    }
    let doOverwrite = () => {
      this.scheduledEvents = []
      this.updateCurrentSchedule()
      this.loadForDate(this.currentDate, hasEvents, this.isViewingPast())
      this.reset()
    }

    if (this.scheduledEvents.length > 0 && !this.isViewingPast()){
      let mess = hasEvents ? "Reload? saved schedule of: "+this.currentDate : "Overwrite current Evts?"
      this.confirmAction(mess,"OK", doOverwrite, doCancel)
    } else {
      doOverwrite()
    } 

    this.showReloadBtn = false
    this.showClearBtn = !this.isViewingPast()  //toSee**

  },
  onLoadDefault(){
      let doCancel = () => {
          console.log('Aborting', this.currentDate) //,this.scheduledEvents
          //this.showReloadBtn = !this.isViewingPast() || this.hasEventsForDate  //toTest**
      }

      let doOk = (flag) => {
        this.scheduleDefaults(flag)
      }

      if (this.scheduledEvents.length > 0){
        let labels = [
          {label: `Add Defaults to current day schedule`,value: 'add'},
          {label: `Overwrite and only schedule Defaults`,value: 'overwrite'}
        ]
        this.radioChoiceDialog('Warning!!',
        `Day: ${this.currentDate} already have scheduled Events...`,
        labels, 
        '',
        function(d){console.log('OK LoadDefaults', d); doOk(d)}, 
        doCancel)
      } else{
          doOk('overwrite')
      }
  },
  choosePrio(e){
    //console.log('choosePrio',e,this.chosenPrio)
    let oldy = this.chosenPrio
    if (oldy && oldy == e){
      this.disablePrioBtn = true //.user should not reclick without changing it again...
    }else {
      this.chosenPrio = e
      this.disablePrioBtn = false
    }
  },
  chooseScore(e){
    //console.log('chooseScore',e)
    let oldy = this.chosenScore
    if (oldy && oldy == e){
      this.disableScoreBtn = true //user should not reclick without changing it again...
    }else {
      this.chosenScore = e
      this.disableScoreBtn = false
    }
  },
  findSamePrio(flag){

    const filterCurrent =() => {
      return this.scheduledEvents.filter(evt => this.parentGoalsMap().get(evt.parentGoal)?.priority == this.chosenPrio)
    }

    let toRet = []
    let isTod = this.isViewingToday()

    if(flag == 'overwrite' || flag == 'add'){
      let allEvts = this.deepCopy(this.storedEvents)
      //console.log('findSamePrio..overwriting!!',this.chosenPrio,flag) //allEvts
      //console.log(`findSamePrio for ${this.chosenPrio} with flag ${flag}..ALL`, JSON.parse(JSON.stringify(allEvts))) //, typeof colis
      for (let evt of allEvts) {
        let e = this.parentGoalsMap().get(evt.parentGoal)
        if (e?.priority == this.chosenPrio){
          toRet.push(evt)
        }//else{console.log('findSamePrio..skipping',e?.priority)}
      }
        
      if(flag == 'add'){ //just add to schedule
        //let s = this.scheduledEvents.length
        //this.scheduledEvents.push(...toRet)
        // filter out events that are already scheduled..not too expensive?
        toRet =  toRet.filter(x => !this.scheduledEvents.find(item => item.id == x.id))
      } else{ //for overwrite, also reset schedule....
        //e = colis
        this.scheduledEvents = []
        this.updateCurrentSchedule()
      }
      console.log(`findSamePrio...${flag} ADDIN to size: ${this.scheduledEvents.length} some evts = ${toRet.length}`, ) // JSON.parse(JSON.stringify(toRet))
    } else {
      toRet = filterCurrent()
      console.log('findSamePrio..filtering!!',this.chosenPrio,toRet)
    }

    //console.log(`findSamePrio>'${flag}'::${this.chosenPrio}`, this.currentDate,this.isViewingToday(), toRet)
    
    //conflicts checks for today only
    if (isTod && flag !='filter'){ //this.isViewingToday()
      toRet = this.addPropsEventsTo(this.currentDate, toRet)
      //console.log(`findSamePrio::addPropsEventsTo for ${flag}`,JSON.parse(JSON.stringify(toRet)),JSON.parse(JSON.stringify(this.scheduledEvents)))
      let overlaps = this.overlapCheckEvtsAdd(toRet)
      if(Object.keys(overlaps).length > 0){
        console.log(`findSamePrio${this.chosenPrio}...overlaps`,JSON.parse(JSON.stringify(overlaps)))

        this.fixyOverlaps(overlaps,null,'findSamePrio') //see second flag
        
        //return
        //this.updateCurrentSchedule()
        //let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
        //console.log('onReloadWithPrio:enabledScoreEdit',toEnable)
      } else { //no overlapps...
        console.log(`findSamePrio >>No overlaps!!...`,toRet.length)//JSON.parse(JSON.stringify(toRet)))
       
        this.updateCurrentSchedule() //doesnt not run too fast?!?
        //let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
        //console.log('onReloadWithPrio:enabledScoreEdit',toEnable)
      }
    } else {//just schedule them!
      //console.log(`findSamePrio...NOT TODAY!?`, this.currentDate)
      if(flag == 'filter'){
        this.scheduledEvents = toRet
      }else {
        toRet = this.addPropsEventsTo(this.currentDate, toRet)
        if(flag == 'add'){
          let f = this.scheduledEvents.concat(toRet) //diff || [] //beware empty!!
          this.scheduledEvents = f
        }else{ //overwrite
          this.scheduledEvents = toRet
        }
      }

      this.updateCurrentSchedule()
      //console.log(`findSamePrio scheduliin..`, JSON.parse(JSON.stringify(this.scheduledEvents)))
    }
      
    //notify for empty perhaps...
    if (!this.scheduledEvents.length > 0){
      this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
      this.disableSaveSchedule = true  //or should be false?!? if have cleared schedule perhaps...
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = false 
      return
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = true //toSee if shouldnt use >>!this.isViewingPast() 

  },
  onReloadWithPrio(){
    if (this.chosenPrio == null) { //kinda redundant with disable flag...mais bon just in case...
      this.doNotify("Ayo select a priority!")
      return
    }

    let doCancel = () => { //do cancel is merge here maybe?!? TBD
      console.log('onReloadWithPrio..cancelling') //this.scheduledEvents
      this.reset()
      return
    }

    if (this.scheduledEvents.length > 0){
      let labels = [
        {label: `Filter current by priority == ${this.chosenPrio}`,value: 'filter' }, //false  //cannot pass false as empty string evaluates to it...smh!
        {label: `Add to current Evts with priority == ${this.chosenPrio}`,value: 'add'},
        {label: `Overwrite and schedule All by priority == ${this.chosenPrio}`,value: 'overwrite'}
        ]
      
      this.radioChoiceDialog('',
      "Schedule change...",
      labels,
      '',
      this.findSamePrio,
      doCancel) //oldie when had local function >> function(d){console.log('OK ReloadWithPrio', d); 
    }else{
      this.findSamePrio('overwrite')
    }
    
    //this.updateButtons(true,false, true)//TOTEST if not better to do below at call site***
    this.resetButtons(this.hasEventsForDate,this.isViewingPast())  

    this.disablePrioBtn = true //to see...user should not reclick without changing it again...

  },
  reloadEvtsWithScore(flag){
      const filterCurrent = () => {
        let toReload = []
        this.scheduledEvents.forEach((item) => {
          let daScore = this.parseScore(item.score)
          if (daScore > -1 && daScore >= this.chosenScore) {
            toReload.push(item)
          }//else{console.log('ERROR...parseScore?skippin',daScore, item)}
        })
        return toReload
      }

    let e = []
    let isTod = this.isViewingToday()

    if (flag == 'overwrite' || flag == 'add'){
      const colis = this.store.fetchGoalsWithMinScore(this.chosenScore)//deepCopy? no need
      //console.log(`reloadEvtsWithScore SCORE`, JSON.parse(JSON.stringify(colis))) //, typeof colis

      if(flag == 'add'){// filter out events that are already scheduled..not too expensive?
        e =  colis.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) 
      } else{ //for overwrite, also reset schedule....
        e = colis
        this.scheduledEvents = []
        this.updateCurrentSchedule()
      }
     
    } else { //filter
      //console.log('filtering by score:',this.chosenScore, flag)
      e = filterCurrent()
      console.log(`reloadEvtsWithScore AFTER flag ${flag}`,this.scheduledEvents.length,JSON.parse(JSON.stringify(e))),JSON.parse(JSON.stringify(this.scheduledEvents))
    }
      
    //console.log(`reloadEvtsWithScore>'${flag}' >=${this.chosenScore}`, this.currentDate,this.scheduledEvents.length)  //isTod, e,

    if(isTod && flag !='filter' ){//check conflicts only for today..
      //console.log(`reloadEvtsWithScore...checking TODAY!`)
      e = this.addPropsEventsTo(this.currentDate, e)
      console.log(`reloadEvtsWithScore::addPropsEventsTo today for '${flag}'`,this.scheduledEvents.length, JSON.parse(JSON.stringify(e))) //,JSON.parse(JSON.stringify(this.scheduledEvents))
      let overlaps = this.overlapCheckEvtsAdd(e)
      //let oOth = this.hasOverlappingEvent(obj.id, startTime, obj.duration) //before add evt
      if(Object.keys(overlaps).length > 0){
        console.log(`onReloadWithScore ${this.chosenScore}...overlaps!!`,JSON.parse(JSON.stringify(overlaps)))

        this.fixyOverlaps(overlaps,false,'reloadScore') //false for override...
          //Promise.resolve()
          //queueMicrotask(count)

        //return //return instead? umm def not!--for btns below
        //this.updateCurrentSchedule()
        //let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
        //console.log('onReloadWithScore:enabledScoreEdit',toEnable)
      } else { //no overlapps...
        console.log(`onReloadWithScore >>NO OVERLAPS!!!...`)//, JSON.parse(JSON.stringify(e)))
        
        this.updateCurrentSchedule() //doesnt not run too fast?!?---it's like the above run even with overlap! and messes up this.scheduledEvents array!
      }
    } else { //just schedule them!
      console.log(`reloadEvtsWithScore... with flag '${flag}' on>`, this.currentDate,JSON.parse(JSON.stringify(this.scheduledEvents.length)), JSON.parse(JSON.stringify(e)))
      if(flag == 'filter'){
        this.scheduledEvents = e
      }else {
        e = this.addPropsEventsTo(this.currentDate, e )
        if(flag == 'add'){
          let f = this.scheduledEvents.concat(e) //diff||[] //works? beware of undefined?!?
          this.scheduledEvents = f
        }else{ //overwrite
          this.scheduledEvents = e
        }
      }
        
      //console.log(`onReloadWithScore scheduliin..`, JSON.parse(JSON.stringify(this.scheduledEvents)))
      this.updateCurrentSchedule()
      //this.allowScoreEdit(false) //disable score edit for future--no need as done during updateCurrentSchedule
    }
    
      //notify for empty perhaps...toTest that doesnt between operations...
    if (!this.scheduledEvents.length > 0){
      this.doNotify(`Empty for Score >= ${this.chosenScore} :(`, "warning",'bottom')
      this.disableSaveSchedule = true  //shouldnt be false?!?
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = false 
      //this.disableScoreBtn = true  //toSee**
      return
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = true

  },
  onReloadWithScore(){
    if (this.chosenScore == null) {
      this.doNotify("Ayo select a score!")
      return
    }
    //let toReload = []  //keep out here...seems to not have issue...toTest maybe**

    let doCancel = () => { //do cancel is merge here maybe?!? TBD
      console.log('onReloadWithScore..cancelling',this.scheduledEvents)
      this.reset()
      return
    }

    if (this.scheduledEvents.length > 0) {
      //this.confirmAction("Overwrite current?",getEvts, doCancel)
      let labels = [
       {label: `Filter current by Interval Score >= ${this.chosenScore}`,value: 'filter'}, //false  //cannot pass false as empty string evaluates to it...smh!
       {label: `Add to current Evts with Interval Score >= ${this.chosenScore}`,value: 'add'},
       {label: `Overwrite and schedule All by Interval Score >= ${this.chosenScore}`,value: 'overwrite'}
      ]

      //huh works without using function literal!!--niice  this.reloadEvtsWithScore
      this.radioChoiceDialog('',
      "Schedule change...",
      labels,
      '',
      this.reloadEvtsWithScore, 
      doCancel) //function(d){console.log('OK ReloadWithScore', d);reloadEvtsWithScore(d)} 
    }else{
      this.reloadEvtsWithScore('overwrite')
    }

    this.resetButtons(this.hasEventsForDate,this.isViewingPast()) //should bring up in lambda functions?!? toSee

    this.disableScoreBtn = true //to see...user should not reclick without changing it again...
  },
  onChange (data) { //runs first after loading/reload > right after beforeMount() and before mounted()

    this.loadForDate(data.start, this.hasEventsForDate,this.isViewingPast())
  },
  onDragStart(e, item) { 
      //console.log("onDragStart", e, item, this.currentDate) 
      //.clientY to determine if going up or down? >>meh no need

      ////not allowed to change past loaded schedule > should show dialog that not possible --todo**
      if(this.isViewingPast()){ //should prolly also check that it's schedule? shouldnt make no diff though
        this.doNotify("Editing past is no no!")
        e.preventDefault() 
        return
      }
      
      //save the moved item
      this.draggedItem = item
  },
  onDragEnter (e, type, scope) {
    //console.log('insideDragEnter',e.preventDefault) // e,type,scope
    if(type === 'goal-item'){
      //console.log('onDragEnter..goal-item',e, scope) // scope is undefined here hence saving it below
      e.preventDefault()
    } else {
      //console.log('onDragEnter...calendar', e, scope) //e,type,scope
      //ABSO necessary to save this as it's the last position before potential overlap with goal-item!
      //but not precise enough
      this.targetDrop = scope
      e.preventDefault()
    }
   
    return true
  },
  onDragOver (e, type, scope) { // needed for onDrop but nothing to do and fires A LOT
    //console.log('onDragOver', scope, type)
    e.preventDefault() //to allow drop

    return true
  },
  onDragLeave (e, type, scope) {
    //console.log('onDragLeave', scope, type)
    return false
  },
  onDragEnd (e) {
    //console.log('insideDragEnd',e) //check datatransfer for 'none' effect where no drop made
    /*e.currentTarget.style.opacity = '1.0'
    if (curChildEl) {
      curChildEl.classList.remove('drag-over-item')
    }
    if (curColEl) {
      curColEl.classList.remove('drag-over')
    }*/
    console.log('onDragEnd', this.startTimesSet,this.endTimesSet)
  },
  onDrop(e, type, scope) { //other drag functions above need for this to fire >>especially 'onDragOver' above
    //console.log("onDrop", e, type, scope)//JSON.stringify(item)
    let draggy = this.getScheduledEvent(this.draggedItem.id) //bon grab whole event..

    if (!draggy) {console.log("onDrop ERROR", draggy,this.draggedItem ); return}

    let targetTimey = null
    
    //when dragged to head, it would be a whole day event?
    if (type === 'interval') {
      //console.log("onDrop to time-interval", scope.timestamp.time,draggy.title.trim(),draggy.time)
      targetTimey = scope.timestamp
    } else {
      if(type === 'goal-item' && this.targetDrop){ //check targetDrop in case didnt drag much and still in same spot
        //console.log("Dropping goal-item!!", type, this.targetDrop.timestamp) //,e, //scope is undefined here
        targetTimey = this.targetDrop.timestamp
      }else {
        console.log("Cannot drop here YO!!",e, type, scope, this.targetDrop) //shouldnt happen? >>could if dropping too high in header as if going to prev/next day
        return
      }
    }
    
    if (!targetTimey) {console.log("ERROR...no timestamp YO!!",e, type, scope, this.targetDrop); return}

    //could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt** 
    let isClose = this.tooClose(targetTimey, draggy.duration)
    if(isClose){
      console.log("onDrop::tooClose check FAIL!",isClose) //toTest if valid for scheduled evts....
      if(isClose === true){
        this.doNotify("Dropping event TOO close to midnight!")
        this.reset()
        return
      }
    }

    let anyOverlap =  this.hasOverlappingEvent(draggy.id, targetTimey, draggy.duration) //review for drag/drop as above line better?
    
    let sizey = anyOverlap.length
    if(sizey > 0) {
      console.log("onDrop...OVERLAP!",sizey) //, JSON.parse(JSON.stringify(anyOverlap))
      let i = 0
      do {
        if(anyOverlap[i].inConflict == anyOverlap[i].target){
          console.log("EUUUH...self overlap?!?", anyOverlap[i]) 
          break //continue? nope wouldnt move!
        }
        console.log("onDrop...overlap handlin::",anyOverlap[i], anyOverlap[i].direction) //object
       
        //anyOverlap[i].direction == "surrounding" ? this.fixyOverlaps(anyOverlap, true) : this.recurChangeTime(anyOverlap[i].inConflict, draggy, targetTimey, true)
        //check for 'surrounding' and handle overlap... otherwise should just push the evt(instead of giving options to resolve/choose!) using recurChangeTime()
        
        if (anyOverlap[i].direction == "surrounding"){ //bon toReview** >> is fixyOverlaps below still necessary here or would be handled by recurChangeTime()?!? toSee***
          let euhOverlaps={}
          euhOverlaps[anyOverlap[i].inConflict] = anyOverlap[i] //.push(oDets) >>shouldnt have more than one?!? toTest**
          console.log("onDrop...SURROUNDING fixOverlap::",JSON.parse(JSON.stringify(euhOverlaps)))

          this.fixyOverlaps(euhOverlaps, true)  //beware override flag--this only place where it's used prolly
        } else{
          this.recurChangeTime(anyOverlap[i].inConflict, draggy, targetTimey, true) //doAdd= false...
        }
       
      } while (++i < sizey)
    } else {
      //so no overlapp, just change dragged event time--ask User
      this.changeEvtTime(draggy.id, targetTimey, false)
      console.log(`${draggy.id} onDrop no overlap complete to ${targetTimey.time}`)  //worked,
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = true  //toSee

    //reset prolly...
    this.reset()
  },
  //problematic to activate this when evt has score enabled smh...toReview workaround with btn
  onDblClickEvent(e, event) {  
     //console.log("double click eh...", e, event)
    
    if(this.isViewingPast()){ //below unlikely as score edit comes up...just in case!
      if (event.duration < 30){ //dont do this for small evts!
        console.log("onDblClickEvent..baah too smoll smoll",event.title,event.duration)
        this.doNotify("Removing from the past is a no no!")
        return
      }
      this.chooseAlternatives(event)
      e.preventDefault()
      return
    }

    this.removeEvtInSchedule(event)
  },
  onClickDate (data) {
    console.log('onClickDate', data)
  },
  onClickTime (data) { 
    //**ariko wont this affect the scrolling? or would it be notificeable in mobile? ToSee**
    //tbd if shouldnt do this in clickInterval...
    console.log('onClickTime..event', data)

    //so here propose selection to add an event to the schedule via dialog box to select from all subgoals
    this.addEventDialog = true
      
     //save the data to use later when checking that it can be scheduled!
    this.targetDrop = data.scope
  },
  onClickInterval (data) { //when clicking on interval of the time column(right side)
    console.log('onClickInterval', data)
  },
  onClickHeadIntervals (data) {
    console.log('onClickHeadIntervals', data)
  },
  onClickHeadDay (data) {
    console.log('onClickHeadDay', data)
  },

  onMouseEnter(data) {
      console.log("onMouseAt", data)
  },
  onMouseLeave(data) { //this fires!
      console.log("onMouseLeave", JSON.stringify(data))
  },
  ///Mouse event handler for range selection
  onMouseDownTime ({ scope, event }) {
    //console.log('onMouseDownTime', { scope, event })
    if (isLeftClick(event)) {
      //console.log('onMouseDownTime and its a leftClick event')
      if (this.mobile === true
        && this.anchorTimestamp !== null
        && this.otherTimestamp !== null
        && getDateTime(this.anchorTimestamp) === getDateTime(this.otherTimestamp)) { //for mobile selection
        this.otherTimestamp = scope.timestamp
        this.mouseDown = false
        return
      }
      // mouse is down, start selection and capture current--browser
      this.mouseDown = true
      this.anchorTimestamp = scope.timestamp
      this.otherTimestamp = scope.timestamp
    }
  },

  //this actually unfurl(destructure) the data parameter in two with those {}
  //can also further destructure keeping only needed variables with { scope: { timestamp } }
  onMouseUpTime ({ scope, event }) {
    //console.log('onMouseUpTime', { scope, event })
    if (this.mobile !== true && isLeftClick(event)) {
        // mouse is up, capture last and cancel selection
        this.otherTimestamp = scope.timestamp
        this.mouseDown = false
      }

    if(!this.mousedown) {
      let rangy = this.startEndTimes
      if (rangy[1] == rangy[0]){ //to keep selection range in case of adding new event ad hoc!
        //console.log("DIDNT change", rangy)
        return
      }
      this.possibleRange = rangy
      console.log('onMouseUpTime range change', this.possibleRange)
    }
  },
  onMouseMoveTime ({ scope, event }) { //fires lots! when not on top of an event!
  //console.log('onMouseMoveTime', { scope, event })
    if (this.mobile !== true && this.mouseDown === true) {
      this.otherTimestamp = scope.timestamp
    }
  },
  scrollToEvent (event) {
    this.$refs.calendar.scrollToTime(event.time, 350)
  },
  onToday () {
    let doContinue = () => {
      //console.log('onToday..continuing...',this.currentDate)
      this.$refs.calendar.moveToToday()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule()
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
    } else {
      doContinue()
    }
    //oldie >> this.$refs.calendar.moveToToday()
  },
  onPrev () {
    //console.log('onPrev', this.currentDate)
    let doContinue = () => {
      //console.log('onPrev....',this.currentDate)
      this.$refs.calendar.prev()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000); //should navigate after save
      this.doSaveSchedule()
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
      
    } else {
      doContinue() //oldie >> this.$refs.calendar.prev()
    }
   
  },
  onNext () {
    //console.log('onNext', this.currentDate)

    let doContinue = () => {
      //console.log('onNext...continuing',this.currentDate)
      this.$refs.calendar.next()
    }
    

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule()
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
    }else {
      doContinue()
    }
    //oldie >>this.$refs.calendar.next()
  },
}
})
</script>
<style lang="sass" scoped>
.my-event
  position: absolute
  font-size: 12px
  justify-content: center
  margin: 0 1px
  text-overflow: ellipsis
  overflow: hidden
  cursor: pointer
.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%
.text-white
  color: white
.bg-blue
  background: blue
.bg-green
  background: green
.bg-orange
  background: orange
.bg-red
    background: red
.bg-teal
  background: teal
.bg-grey
  background: grey
.bg-purple
  background: purple
.full-width
  left: 0
  width: calc(100% - 2px)
.left-side
  left: 0
  width: calc(50% - 3px)
.right-side
  left: 50%
  width: calc(50% - 3px)
.rounded-border
  border-radius: 2px

.day-view-current-time-indicator
  position: absolute
  left: -5px
  height: 10px
  width: 10px
  margin-top: -4px
  background-color: rgba(0, 0, 255, .5)
  border-radius: 50%

.day-view-current-time-line
  position: absolute
  left: 5px
  border-top: rgba(0, 0, 255, .5) 2px solid
  width: calc(100% - 5px)

</style>