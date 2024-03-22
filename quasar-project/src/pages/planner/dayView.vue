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

        <div v-if="loadDefault"><!--disable instead of hiding?!? TBD*** -->
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
        <!-- oldie but above is better
                    <q-btn
            class="q-mt-xl"
            color=""
            text-color="teal"
            elevated
            label="Schedule"
            @click="bringScorey"
            no-caps
          />
          <q-select borderless v-model="chosenScore" :options="scoreOptions" label="score" />
        -->
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
                 <q-tooltip>{{ event.time + ' - ' + event.title }}</q-tooltip>
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

     <q-dialog v-model="addEventDialog" transition-show="rotate" transition-hide="rotate">
      <!-- either newEvent || pick existing event style="padding: 2px 2px;-->
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
        <div class="q-ml-md event-select">
          <ad-hoc-event
            :mainGoals="storedMainG"
            @save-Event="onAddNewEvent"
          />
          <q-btn flat label="Cancel" color="primary" @click="adHocEventDialog = !adHocEventDialog"/>
        </div>
      </q-card>
     </q-dialog>

     <q-dialog v-model="pickEventDialog" transition-show="rotate" transition-hide="rotate">
      <q-card> <!--style="padding: 2px 2px;"-->
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
        <!-- could start being too much goals...break down by parentGoal?!? tbd**-->     
      </q-card>
     </q-dialog>
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
   <br><!-- in store.getSubGoals ...oldie >> events but allEvents also accessible when not returned? -->
   <div class="scroll overflow-auto" style="height: 360px; width: 100%;">
       <div v-for="(event, index) in storedEvents" :key="index" class="col-12" style="font-size: 10px; line-height: 10px; max-height: 14px; min-height: 14px; padding: 2px 2px; white-space: nowrap;">
         {{ event }}
         <q-space />
       </div>
   </div>
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
import { applyClasses, applyStyles } from '../util/utiFunc'
import addGoalForm from '../planner/viewAllGoals.vue'
import GoalyEnd from '../../components/planner/goalyEnd.vue'
import adHocEvent from '../../components/planner/adHocEvent.vue'
import schedBtn from '../../components/planner/schedBtn.vue'
import schedDropBtn from '../../components/planner/reloadDropDBtn.vue'
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
  adHocEvent,
  schedBtn,
  schedDropBtn
},
data () {
  const draggedItem = ref(null)
  const targetDrop = ref(null)

  const currentTime = ref(null)

  //const endTimesSet = ref(new Set())//ref(null) //set of end times for scheduled events for lookup when adjusting time!
  //const startTimesSet = ref(new Set())//ref(null) //bon same as above--just to know when starting an event
  
  const allEvents = ref(null)  //bring up all subgoals from storage by default //keep reference to it without change and not reload too much from storage?

  //const dailyScheduled = ref()//ref(new Map()) //shall be the daily scheduled and for currently viewed day--for saveSchedule..prolly

  const $q = useQuasar()
  let intervalId = null

  //let doReset = false //when going backward..reload defaults
  //let disableUpdates = false //not allow changes for past events..redudant

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
    
    //prioOptions:ref([]), //for priorities

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
    pickEventDialog:ref(false), //showing pick event to schedule dialog
    addEventDialog: ref(false),
    adHocEventDialog:ref(true),  //true by default 

    conflictReso:ref(false), //resolve conflict radiobutton dialog
    resoType: ref(''), //priority or score 
    toAddE:ref(null),
    disabledScoreEvts:ref({}),
    hasStarted:ref({}),  //just for happening now..toReview as too much variables esti! and should combine with disabledScoreEvts var above!

    disableSaveSchedule:ref(true),
    force:ref(false),  //skip confirming for default time changes
    showReloadBtn:ref(false), //when date has saved events that are not default--or reset day schedule to initial saved schedule..if user havent overwritten it? toReview**
    loadDefault:ref(true), //reload default events...
    showScoreBtn:ref(false), //schedule by score
    showPrio:ref(false)  //for showing prioritiy button...
  }
},
beforeMount() {
  this.mobile = isMobile()  //--for drag for range selection.
 
  //this should just load all events--nothing else--prolly
  //in onChange is where to setDate and other props...prolly..unless there is a reason that not doable there?
  //this.scheduledEvents = this.addPropsEventsTo(null, this.returnNewEvts(true)) //[...e] //does update!

  this.resetGoalEvts(true)
  //this.doReset = this.hasEventsForDate// oldie ..toSee if works...>>false //to not load up defaults too
  
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
    return this.chosenScore == null ? `By Score` : `Score > ${this.chosenScore}` 
  },
  chosenPrioLabel() { 
    return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
  },
  style () {
    return {
      top: this.timeStartPos + 'px'
    }
  },
  showForm() {return this.showGoalForm},
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
  parentGoalsMap() {
      const map = new Map()
      let mG = this.storedMainG //this.store.getMainGoals
      if (!mG){
          console.log('parentGoalsMap is empty or null', mG)
          return map
      }

      mG.forEach(obj => { 
          map.set(obj.id, obj);
      })
      //console.log('parentGoalsMap', map) //JSON.stringify(e)
      return map
  },
  //dropdown for adding evts that are not already scheduled.
  //when all are present, shows them all to change schduled timeslot 
  canbeScheduled() {
    let e = this.deepCopy(this.storedEvents)
        // filter out events that are already scheduled
    let difference =  e.filter(x => !this.scheduledEvents.find(item => item.id == x.id)); // these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1

    //console.log('canBeAdded difference is', difference)

    if (difference.length == 0) return e
    
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
  storedMainG(){
    return this.store.getMainGoals
  },
  //some computed for the range interval
  startEndTimes() { 
    const dates = []
    if (this.anchorDayTimeIdentifier !== false && this.otherDayTimeIdentifier !== false) {
      if (this.anchorDayTimeIdentifier <= this.otherDayTimeIdentifier) {
        console.log("startEndTimes..anchor <= less",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp)) //toSee...this how interval is calculated?!?
        dates.push(getDateTime(this.anchorTimestamp), getDateTime(this.otherTimestamp))
      }
      else {
        console.log("startEndTimes..anchor <= less",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp)) //toSee...remove
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
 },

 methods: {
  //testy(e,vt){
  //  console.log('testy tesy...hidin',e,vt)
  //},
  badgeClasses (event, type) {
    return applyClasses(event, type)
  },
  badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
    return applyStyles(event, type, timeStartPos, timeDurationHeight)
  },
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
  // get all events for the specified date--use scheduleMap instead...prolly**
  getDateEvents (dt) {
    const events = this.eventsMap[ dt ] || []
    if (events.length === 1) {
      events[ 0 ].side = 'full'
      
    }
    else if (events.length === 2) {
      console.log("getDateEvents...LENGTH is 2?",dt, events)
      // this example does no more than 2 events per day
      // check if the two events overlap and if so, select
      // left or right side alignment to prevent overlap
      const startTime = addToDate(parsed(events[ 0 ].date), { minute: parseTime(events[ 0 ].time) })
      const endTime = addToDate(startTime, { minute: events[ 0 ].duration })
      const startTime2 = addToDate(parsed(events[ 1 ].date), { minute: parseTime(events[ 1 ].time) })
      const endTime2 = addToDate(startTime2, { minute: events[ 1 ].duration })
      if (isBetweenDates(startTime2, startTime, endTime, true) || isBetweenDates(endTime2, startTime, endTime, true)) {
        events[ 0 ].side = 'left'
        events[ 1 ].side = 'right'
      }
      else {
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
      //this.disableUpdates = false
      return false
    }

    let onToday = getDayIdentifier(parsed(isToday))
    let viewing = getDayIdentifier(parsed(this.currentDate))

    if (viewing >= onToday) {
      //console.log('isViewingPast..nope future >', isToday, this.currentDate)
      //this.disableUpdates = false
      return false
    }
    //this.disableUpdates = true //so do not allow changes...redundant
    
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
      console.log("sameStart/END..FOUND", this.currentTime)
      this.doEnableEndNowBtn(this.currentTime,hasEnd, hasStart)
    }
  },
  setGoalsPrio(){ //add flag if have to filter current scheduled?--TBD
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
      if (this.scheduledEvents === this.allEvents){ //triple equal sign for reference check..never goes here though smh
        console.log("resetGoalEvts SAME")
      }

      if (newish){
        let e = this.deepCopy(this.storedEvents)
        this.allEvents = [...e]

        //console.log("resetGoalEvts",JSON.parse(JSON.stringify(this.allEvents)))
        return e
      }
      return this.allEvents  //here return same stuff...beware that not null***
  },
  //from the allEvents array that "should" contain all evts--might not be originals
  getLocalEvt(id){
      for(let i = 0; i< this.allEvents.length;i++){
          if (this.allEvents[i].id === id) return this.allEvents[i]  //OH freaking type check!!smh
      }
      return null
  },
  getScheduledEvent(id){
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
      let euhStart = hasStart ? val.start.time : timey  //just in case but redundant..toRemove***
      if (toComp == timey){
        console.log("doEnableEndNowBtn...FOUND", entry, val, hasStart,hasEnd )
        this.hasStarted[entry] = !hasEnd  //toTEST*** 
          //retVal.push(entry) //bon no need for object {}...toREview if ID arent enough smh
      }else if (euhStart == timey){ //just to see...toRemove**
        console.log("doEnableEndNowBtn...EUUH?!?!", entry, val, timey, euhStart)
      }
    }
  },
  // show/hide the endNow button
  enableEndNowBtn(evtID,starty, endy){
    //const now = parseDate(new Date()) 
    const now = parsed(this.currentDate)
    if (isBetweenDates(now, starty, endy, true)){ 
      this.hasStarted[evtID] = true
    }//else{
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

  //make clear the btn actions of dialog and execute ok/cancel actions....
  //need to pass callback vars?~? toSEE** (confirm that scope isnt violated!)
  timeChangeDialog(mess, okbtn,cancelbtn, executeOk, executeCancel){
    this.$q.dialog({
          title: 'Default Change?', //pass this too?!? 
          cancel: cancelbtn, //"Temp.Add",  //just change time for this day.
          ok:okbtn, //"Change", //yes   //to store.saveSubProp && change current (see if dont store what happens--TOTEST**)
          // position: 'bottom',
          message: mess
        }).onOk(() => {
            //return changeSubProp(true) //see if works...
            return executeOk()
        }).onCancel(() => {
            //is this also called on dismiss?!?
            console.log("Nope coolios, onCancel with temp.time add!!")
            //doUpdateEvt()
            executeCancel()
        }).onDismiss(() =>{
            console.log("dismissing..DO anything?!?") 
            //here dont add perhaps?!?toREVIEW***
            return false
        })

  },
  confirmAction(message, executeOk, executeCancel, executeDismiss=null){
    this.$q.dialog({
      title: 'Warning', //try to pass this in as well?!? tbd!
      cancel: true,
      //persistent:      
      // position: 'bottom',
      message: message
    }).onOk(() => {
        executeOk()
    }).onCancel(() => {
        //console.log('Cancelled confirmAction!!')
        executeCancel()
    }).onDismiss(() => {
      if(executeDismiss){
        console.log('confirmAction with dismiss!!') //toUse*** for cleanup maybe?!? 
        executeDismiss()
        return
      }
    })

  },
  radioChoiceDialog(mess,labels,onOk = null,onCancel = null){
    this.$q.dialog({
      title: mess,//'Alert',
      cancel: onCancel ? true : false, //false, //or check if onCancel != null
      persistent: true, //have to choose!
      //message: mess,
      options: {
        type: 'radio',
        model: '', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
        // inline: true           
        items: labels
       },
      }).onOk((data) => {
          if (onOk) {
            if(data == ''){ //invoked again to handle when user doesnt make selection!
              this.radioChoiceDialog(mess, labels,onOk,onCancel)
            }else {
              onOk(data)
            }
          }
      }).onCancel(() => {
          if (onCancel) {
            onCancel()
          }
      }).onDismiss(() => {
          // console.log('I am triggered on both OK and Cancel')
          console.log('radioChoiceDialog dismissed') 
      })
  },
  doNotify(messg, colorNotif = undefined, position = 'top'){
    this.$q.notify({ // also see about using >> this.$q.dialog
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
      this.loadDefault = defaultBool != null ? defaultBool : this.loadDefault
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
        }else{console.log("ERROR doRemove, dailyScheduled has no such item?@? ", item)}

        if(toDel){ //also update scheduleSets
          let hadStart = this.startTimesSet.delete(toDel.start.time)
          let hadEnd = this.endTimesSet.delete(toDel.end.time)
          if (!hadStart || !hadEnd){
            console.log("ERROR doRemove scheduleSets has no such item?@? ",toDel, item)
          }
        }
        //return //important to return esti
        break //or break is better ? 
      }
      //else{console.log("ERROR doRemove, NO item to delete?@? ", item)}
      //could get here when moving from other dates....or fast execution smh...toMonitor**
    }

    console.log("doRemove..looping FOR", i)
    //this.updateCurrentSchedule() //makes sense to add here...
    //not needed as already updating above ** see looping above  
    return
  },
  removeEvtInSchedule(evt, id=null){

    if(this.isViewingPast()){ //should prolly also check that it's schedule? ...also to not pass in hidden flag! toReview**
        this.doNotify("Removing from the past is a no no!")
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
    aRem, 
    function(){console.log('Cancelled remove')}) 

  },
  reset() { //reset variable for next use 
    this.draggedItem = null
    this.targetDrop = null
    //
    this.toAddE = null
    this.chosenScore = null
    this.chosenPrio = null

    this.possibleRange = null //enable after test**
  
  },
  //walk through conflict and resolve by scheduling higher priority evts..choose higher priority or use score...alert too
  fixConflicts(conflicts){ //BEWARE--checks in scheduledEvts!
      console.log("fixConflicts...Start", conflicts)
      
      const findhigherPrio = allEvts => {
          //return this.retrieveSameStart(starty) 
          let highest = 0
          let toRet = null
          for (let evt of allEvts) {
              let one = this.getScheduledEvent(evt)
              if (one){
                  let prt = this.parentGoalsMap.get(one.parentGoal) //would this work?--seems so!
                  if (prt){
                      if (prt.priority > highest){ //umm what happens when no priority? **toTest**
                           highest = prt.priority
                           toRet = one
                      }
                  }else{console.log('findhigherPrio..ERROR no PARENT found?',one)}

              }else{console.log('findhigherPrio..ERROR not found?',evt)}
          }
          console.log('findhigherPrio..Highest priority be',toRet, highest)
          return toRet
      }
      
      const mapToLabels = anEvt => {
          return { label: anEvt.title + " at " + anEvt.score, value: anEvt.id } // color: 'secondary' >>should prolly see look**
      }
     
      for (let conflict of conflicts) {
        let pick = null //see if better than picks[]
        let cIDs = this.retrieveSameStart(conflict.at)
        console.log("fixConflicts...results", cIDs, conflict)
        //this.conflictReso = true //so do it for each conflict...umm would it give time for user selection? nah and seems $q.dialog is better!
        let conflictEvts = [] 
        let label = ""

        for (let id of cIDs) {
          let one = this.getScheduledEvent(id)
          if (one){
            conflictEvts.push(one)
            label += one.title +','
          }else{console.log("fixConflicts...ERROR not found?", id)}
        }

        //so for each conflict, dialog to choose how to resolve this...
        this.$q.dialog({
          title: 'Alert',
          cancel: false,
          persistent: true, //have to choose!
          // position: 'bottom',
          message: `${label} are conflicting.\n Choose how to solve this...`, //see if new line?
          options: {
            type: 'radio',
            model: 'opt1',
            // inline: true
            items: [ //huh could actually show the conflicts evts's title here instead?--bof this can be chosen in one of the options....
                { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
                { label: 'Resolve by lowest Score Interval', value: 'opt2' },
                { label: 'Pick event', value: 'opt3' }
              ]},
        }).onOk((data) => {
          if(data =='opt3'){//show another dialog to pick event...hopefully show? or use v-for with buttons? >>seems to show!
            this.$q.dialog({
              title: 'Alert',
              cancel: false,
              persistent: true, //have to choose!
              // position: 'bottom',
              message: 'Choose the event to schedule',
              options: {
                type: 'radio',
                model: '', //impact of this? or gotta use newArr[0].value? >>can select nothing if left blank*** ToFix!
                // inline: true
                items: conflictEvts.map(mapToLabels) //huh works!!
              },
            }).onOk((data) => {
              console.log('Chosen Manually', data)
              let one = this.getScheduledEvent(data)
              if(one){
                pick = one //proper? //s.push(data)
              }else{console.log('ERROR...Manually choice not find', data)}
            }).onCancel(() => {
              console.log('Cancelled loading..HUH?!?') //shouldnt get here as persistent
            }).onDismiss(() => {
              console.log('oooh dismissed inner...', pick) 
              this.pickConflictReso(pick, conflictEvts)
            })
                    
            //bon saveSchedule at end...prolly to not edit while we could still iterate over it!
            let f = this.updateCurrentSchedule() // to refresh times...prolly check return of fixConflicts? toReview
            console.log('fixConflicts inner...after conflicts?', f)
            this.updateButtons(true, null, null)
            //this.disableSaveSchedule = false //enable save schedule
          }else if (data =='opt2'){ //invoke parseScore and pick lowest score(huh semantic diff here as it's actually the one with the highest diff of score range!--**BEWARE )
            console.log('>>>> OK, Option Score', data)
                      
            let lowScore = 0
            let current = null
            for (let e of conflictEvts) {
              let daScore = this.parseScore(e.score)
              if(daScore > -1 && daScore >= lowScore) {
                lowScore = daScore
                current = e//e.id
              }else{console.log('ERROR...parseScore?',daScore, e)}
            }
                    
            if (current){
              console.log('Option Score Chosen', current)
              pick = current //could prolly forgo this...//.push(current.id) //?
            }//else?
          }else{ // >>opt1 >> invoke findhigherPrio 
              pick = findhigherPrio(cIDs)
              console.log('>>>> OK, Higher prio', data, pick)
          }

          console.log("Pick be", pick) ////for inner dialog this is empty...
        }).onCancel(() => {
          console.log('Cancelled loading...HUH?!?') //shouldnt get here!!!?
        }).onDismiss(() => {
          console.log('Dismissing...', pick) //for inner dialog this is empty...
          if (pick) {
            this.pickConflictReso(pick, conflictEvts)
            let f = this.updateCurrentSchedule() // to refresh endTimes
            console.log('fixConflicts outer...after conflicts?', f) //just check...
            this.updateButtons(true, null, null)
            this.disableSaveSchedule = false //enable save schedule
            //also the loadSaved btn**
          }
        })
      }
      return true //should return false in error? tbd** 
  },
  pickConflictReso(pick, conflicts){// keep only pick, removing the others...
      //this.conflictReso = false
      for (let e of conflicts) {
          if (e.id == pick.id) { //skip the pick
              console.log('Skipping choice!', e) 
          }else {
              console.log('Removing conflict event!', e) 
              this.doRemove(e) 
                  //any possibility of erasing something that is looked up in next conflicts iteration? Tbd and test!! 
                  //or add them to an array and do so after this loop?
              }
      }
      return
  },
  updateCurrentSchedule() { //should add flag to also check canEnableEditScore && enableEndNowBtn--todo**
    const mappy = new Map()

    let endTimes = new Set() //[]
    //const now = parseDate(new Date())

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

    })

    this.dailyScheduled = mappy

    this.endTimesSet = endTimes
    this.startTimesSet = startTimes

    return sameTime

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
      originalAt: evt.time, //keep original...needed still? tbd***
      for: evt.duration,
      start: startTime,
      end: endTime,
      score: evt.score
    })

    this.endTimesSet.add(endTime.time)
    this.startTimesSet.add(startTime.time)  //check for sameStart?!?

    return true //return true?
  },
  updateEvtInScheduleMaps(evID, timeyStart){ //add flag to add? toSee**
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
  evtIsOverlappingTimes(tStart, tEnd, eStart, eEnd){ 
    //custom to also return more info whether overlapping left(haut?), right(bas?), totalO(surrounding)
    //also uses getTimeIdentifier lib function via this.getTimeyNumber(timey) above
    
    let targetStart = this.getTimeyNumber(tStart)
    let targetEnd = this.getTimeyNumber(tEnd)

    let evtStart = this.getTimeyNumber(eStart)
    let evtEnd = this.getTimeyNumber(eEnd)

    //console.log("evtIsOverlappingTimes ORIG>>",tStart, tEnd, eStart, eEnd)
    //console.log("evtIsOverlappingTimes THEN>>",targetStart,targetEnd,evtStart,evtEnd) // >> 630 710 2000 2100

    if (targetStart === false || evtStart === false || targetEnd === false || evtEnd === false) {
      console.log("ERROR... evtIsOverlappingTimes error",targetStart,targetEnd,evtStart,evtEnd)
      return false
    }//else {console.log("evtIsOverlappingTimes",targetStart,targetEnd,evtStart,evtEnd)}

    let dir = false
    if(targetStart >= evtStart && targetStart < evtEnd){// overlap left...beware of '=' removal after &&
      //return 'bas'  //so target is EARLIER than scheduled evt...prolly?
      dir = 'bas'
    } 
    if (targetEnd >= evtStart && targetEnd <= evtEnd){ // overlap right ...see effect of not removing '=' as in above...prolly should?
      //return 'haut'  //so target is LATER than scheduled evt...prolly?
      dir = 'haut'
    }
    if((evtStart >= targetStart && targetEnd >= evtEnd) || (targetStart > evtStart && targetEnd < evtEnd)){ //have to also check opposite!!!
      //return 'surrounding'  //prolly? 
      dir = 'surrounding'
    }
    
    return dir //false

  },
  //rework of 'overlapOtherEvent' below and should replace it prolly
  //supposes that evID is not in dailyScheduled yet and return array of scheduled evts that might overlap!>>No longer true!
  //actually return the FIRST overlapping event as going through the whole map might find evts that are being added**BEWARE--tofix sometimes!
  hasOverlappingEvent(evID, targetTimestamp, duration) {
    //const mappyO = {}  //umm?!
    const mappyA = [] //grr bon this!
    
    let tStartAt = targetTimestamp //addToDate(targetTimestamp,{ minute: 0})
    let tEndsAt = addToDate(tStartAt, { minute: duration})

    //console.log(`hasOverlappingEvent for ${evID} at ${targetTimestamp.time} for ${duration}`, tStartAt, tEndsAt)

    this.dailyScheduled.forEach((value, key, map) => {
      if (key == evID){
        //skip self!
        //console.log(`${evID} skippin self ${key}`,value) //toSee if .for updates properly***
      }else{
        let oDirection = this.evtIsOverlappingTimes(tStartAt,tEndsAt,value.start,value.end)
        if (oDirection){
          console.log(`OverlappingConflict ${evID} en "${oDirection}" of evt:${key} at`,value.start.time)//tStartAt value
          // duration, tStartAt, tEndsAt, value.start, value.end 
          /* //not much better with keyd object mappyO[key] = {}
          nor array below
          if (!mappyO[key]){
            mappyO[key]= []
          }*/
        
          mappyA.push({ 
            target:evID,
            targetStart:tStartAt,
            direction:oDirection,
            inConflict:key 
          })
        }
      }
    })

    return mappyA //mappyO
  },
  //check for overlap while adding evts
  overlapCheckEvtsAdd(evts){ //, dt = null, doAdd = false
    //const overlaps = {} //[]//{}
    let euhOverlaps = {}  //umm into objects?!?

    //console.log(`overlapCheckEvtsAdd with evts length:${evts.length} on`, dt)

    for(let i = 0; i < evts.length; i++){
      let obj = evts[i]

      let startTime = addToDate(parsed(obj.date), { minute: parseTime(obj.time) })
          //let endTime = addToDate(startTime, { minute: obj.duration })

      //oldie >> 
      //let anyOverlap = this.overlapOtherEvent(obj.id, startTime, obj.duration) //evt could be there?!?..methink
          
      let oOth = this.hasOverlappingEvent(obj.id, startTime, obj.duration) //before add evt
      
      if(oOth.length > 0){ //anyOverlap
        console.log(`overlapCheckEvtsAdd at ${startTime.time} for ${obj.id}:"${obj.title.trim()}">>`,oOth.length) // obj //Object.keys(oOtherO).length //`${obj.id}::${obj.title}
        //this.$refs.calendar.scrollToTime(startTime.time, 350) //just to see...should put in own function maybe...issue with promise though...
        //this.scrollToEvent(startTime)
        
        //beware of semantics!
        let j = 0
        do {
          //key = currentScheduled
          //value = conflict evts to add!

          //overlaps[anyOverlap[j]] = obj //hopefully shouldnt overlap with many evts?!?--TOTEST with more than one**
          
        
          //if (!oOth[anyOverlap[j]]) {console.log()`ERROR??!? hasOverlappingEvent evt key not found?!?`, anyOverlap[j] ; continue} //shouldnt happen...prolly
          //euhOverlaps[j] = oOth[anyOverlap[j]] //bon toReview this**** no need to use object here...toREview**

          if(!euhOverlaps[obj.id]){ //bon keep in mind the obj.id is target!!
            euhOverlaps[obj.id]= []
          }
          euhOverlaps[obj.id].push(oOth[j])

          //console.log(`hasOverlappingEvent ${obj.id}`,j, oOth[j])
          if(j>0){
            console.log("WOAH WOAH, multiple overlaps with same obj!",j, obj,oOth[j])
            //should push to array in this case >>see above toTest***
            //>could have multiple default that are overlapping yes!
          }    
        } while (++j < oOth.length) //anyOverlap
      } else{
        this.addEvtPropsIntoSchedule(obj) //dt,
        
        //this.scheduledEvents.push(this.addPropsEventsTo(dt, [obj]))
        //let s = 
        //this.addEvtInScheduleMaps(obj) //check for error?!? toSee**
        //console.log(`Added evt: ${obj.id}:${obj.title}`,dt,anyOverlap,this.scheduledEvents.length)
      }   
    }

    //console.log(`overlapCheckEvtsAdd`,euhOverlaps)

    return euhOverlaps //overlaps
  },
  addEvtPropsIntoSchedule(event){ //maybe add flag here?...and //todo** change method to handle arrays?
    
    //addPropsEventsTo  //beware it returns an array!!
    //this.addPropsEventsTo(aDate, [event]) //prolly no need?!? toTest***
    
    this.scheduledEvents.push(event) //event

    //return this.updateCurrentSchedule()  //not too expensive to do all evts when just adding one?!? prolly...

    let added = this.addEvtInScheduleMaps(event) //toSee if better than above..this could be multiple?!? toSEE**

    if(!added){
      console.log(`addEvtPropsIntoSchedule:${event.title}..ERROR...NOT added?!?`, added)
    }
    
    //do below too prolly?!?...or let adjustCurrentTime?!? >>prolly have to...toDo***
    //let isToday = this.currentDate == today()
    //if (isToday){ //only allow for today
    //  this.canEnableEditScore(event.id,endTime)
    //  this.enableEndNowBtn(event.id, startTime, endTime)
    //}

  },
  addPropsEventsTo(aDate, events){
    let pMap = this.parentGoalsMap  //assumes that parentGoals present...

    //let e = this.allEvents 

    if (!events) { //|| !pMap
      this.doNotify("addPropsEventsTo BUT no goals to schedule...")
      return []
    }
    let toReload = []

    let fromParent = (evt) =>{
      let pgoal = pMap.get(evt.parentGoal)
      if(!pgoal){
          console.log("ERROR?!? no parent goal for:", evt) //could happen when adding ad-hoc
          evt.bgcolor = "grey" //default for goals (could be ad-hoc goals)
          evt.details = `${evt?.title}: ${evt?.time} -- ${evt?.duration}min`  
          evt.title  = `Ad-hoc:${evt?.title}` //oldie for evt.title >> "unknown"
      } else {
        evt.bgcolor = pgoal.bgcolor  //for weird colors, becomes transparent--beware**
        evt.details = `${pgoal.title.trim()}: ${evt?.time} -- ${evt?.duration}min` // (${pgoal?.priority})
      }
      return evt
    }

    events.forEach((obj) => {
          //let sav = events[obj.id]  //oldie that wasnt good with indexes...
          //let evt = fromParent(obj)
          let sav = this.getLocalEvt(obj.id)
          //console.log("addPropsEventsTo",JSON.parse(JSON.stringify(sav)),JSON.parse(JSON.stringify(obj)))
          if (sav){
              //obj.date = aDate, //OR  do >> aDate != null ? aDate : obj.date //umm set to itself and better to null this and change in the onChange //"date": "2023-07-22"
              //obj.time = sav.time, //save.time is what it was changed to...
              //obj.duration = sav.duration,//def gotta use duration in case it has changed!
              //obj.score = sav.atScore

              sav.duration = obj.duration
              sav.time = obj.time
              sav.date = aDate //OR  do >> aDate != null ? aDate : obj.date //umm set to itself and better to null this and change in the onChange //"date": "2023-07-22"

              //oldie oldie >> toReload.push(obj)
              //oldie >> toReload.push(fromParent(obj)) //works but should be 'sav' as it's the proper object with parentGoal, etc...below
              toReload.push(fromParent(sav))

          } else{console.log(`ERROR in addPropsEventsTo...Evt:not present!`,obj) } //when has been deleted--toHAndle***
    })

    //console.log("addPropsEventsTo", aDate,JSON.parse(JSON.stringify(toReload))) //events, typeof events

    return toReload
  },
  //skipAsk to skip asking user--force flag
  changeEvtTime(evID, timeyStart, skipAsk, doAdd=false) {
    //console.log(`changeEventTime ${evID} to ${timeyStart.time} with skip:${skipAsk}..adding:${doAdd}`,this.scheduledEvents.length)
    let evt = this.getScheduledEvent(evID)
    if (!evt){
      console.log(`changeEventTime NEW...${evID}`,doAdd)
      if(doAdd){
        let e = this.getLocalEvt(evID)
        if (!e){
          console.log('ERROR in changeEvtTime STILL NOT found?!?',e, evID, timeyStart, doAdd) //shouldnt happen!! typeof evID,
          return false
        }
        //console.log("changeEventTime addin...",JSON.parse(JSON.stringify(evt)))
        //let samey = this.addPropsEventsTo(this.currentDate,[addy])
        let evtArr = this.addPropsEventsTo(this.currentDate, [e])
        //console.log("changeEventTime afterProps",JSON.parse(JSON.stringify(evtArr)))
        this.addEvtPropsIntoSchedule(evtArr[0]) //this.currentDate,
        //console.log("changeEventTime addin...",JSON.parse(JSON.stringify(evt)))
        evt = evtArr[0] //should be one item....prolly
      } else {
        console.log('ERROR in changeEvtTime not found, not adding!', evID, timeyStart, doAdd)
        return false
      }
    }

      let doUpdateEvt = () => {

        console.log(`Evt ${evID} moving ${evt.time} to ${timeyStart.time} with skip:${skipAsk}`) 

        evt.time = timeyStart.time  //this works even?!?
        this.updateEvtInScheduleMaps(evID, timeyStart) //should also change in scheduledEvents?!? tbd**

        //see if proper here....should be done in updateEvtInScheduleMaps() above---toTest**
        let endy = addToDate(timeyStart, { minute: parseInt(evt.duration)})
        this.canEnableEditScore(evID,endy)
        this.enableEndNowBtn(evID, timeyStart, endy)
      }


      let changeSubProp = (flag) => {
        //this.store.saveSubProp(evID, timeyStart.time, null)
        this.doSaveEvtProp(evID, timeyStart.time, null)
        doUpdateEvt()
        
        return flag
      }

    let oldy = evt.time 
    let mess = `Evt '${evt.title.trim()}' scheduled at ${oldy}. \n Change default time to ${timeyStart.time}? \n Cancel to Temp add.`

    //wrong time in message above!!--toFix**
    
    //not asking...except for inDefaults && !evt.canMove ..prolly(||)--tbd**
    if (evt?.inDefaults || !evt?.canMove){
      if (skipAsk) {
        console.log(`changeEventTime::skippin...BUT inDef: ${evt.inDefaults} and canMove:${evt.canMove}`)
        doUpdateEvt() //bon just skip!
        //this.timeChangeDialog(mess, "Change", "Temp.Add", function(){changeSubProp(true)}, function(){doUpdateEvt()}) //too much asking?
        //return
      }else{
        console.log(`changeEventTime::NOT skippin...BUT inDef: ${evt.inDefaults} and canMove:${evt.canMove}`)
        this.timeChangeDialog(mess, "Change", "Temp.Add", function(){changeSubProp(true)}, function(){doUpdateEvt()})
      }
    } else{ //asking
      //--for all except those evt?.canMove
      console.log(`changeEventTime::ASKIN?!? move:${evt?.canMove} inDef:${evt?.inDefaults}`,skipAsk) //test when get here***
      if (evt?.canMove){ //&& !inDefault ? >>TBD***
        doUpdateEvt()
        //return //true ?
      } else{
        this.timeChangeDialog(mess, "Change", "Temp.Add", function(){changeSubProp(true)}, function(){console.log(`Keeping ${evt.time} for ${evt.id}`,timeyStart.time); doUpdateEvt()})
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
      console.log(`${overlappedEvtID} of dura: ${overlappedEvt.for} moving <> ${dName} due to evt:${tEvt.id} of dura:${tEvt.duration} at ${targetTimestamp.time}...doAdd:${doAdd} and skipAsk:${skipAsk}`) //overlappedEvt

      //tEvt.time >> original Evt time but the targetTimestamp.time >> WHEN it should be scheduled at

      let overlappedEvtNew = null
      if (dragTimeInterval >= 0 ) { //>=0 ?!? yup // || goForward 
        overlappedEvtNew= addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) //overlappedEvt.for might be too much...
        let alternative = addToDate(targetTimestamp, { minute: parseInt(overlappedEvt.for) + 10 })
        console.log(`recurChangeTime:${overlappedEvtID}...FORWARD ${dName} for ${dragTimeInterval}`, overlappedEvtNew.time, alternative.time)
      } else {//remove instead of add.
        overlappedEvtNew = addToDate(targetTimestamp, { minute: -(parseInt(overlappedEvt.for) + 10)})
        //let alternative = addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) }) //toSee if overlappedEvt.for isnt too much? nope it's proper for backward...prlly
        console.log(`recurChangeTime:${overlappedEvtID}...BACKWARD ${dName} for ${dragTimeInterval}`, overlappedEvtNew.time) //,alternative.time
      }
      
      //console.log(`recurChangeTime...from>>${targetTimestamp.time}, to ${overlappedEvtNew.time}`, tEvt.duration)
            
      //oldie >> let anyOtherOverlap = this.overlapOtherEvent(overlappingEvtID, overlappedEvtNew, overlappedEvt.for) //overlappingEvts[i]
      let anyOtherOverlap = this.hasOverlappingEvent(overlappedEvtID, overlappedEvtNew, overlappedEvt.for)
      
      if(anyOtherOverlap.length > 0) {
        console.log(`WARNING WARNING...more overlaps for ${overlappedEvtID} at ${overlappedEvtNew.time}`,anyOtherOverlap)
        let i = 0
        let sizey = anyOtherOverlap.length
        let draggy = this.getScheduledEvent(overlappedEvtID)
        do {
          console.log(`CASCADING timeChange...doAdd:${doAdd}`,anyOtherOverlap[i], overlappedEvt, draggy) //should prolly skip when seeing own self?!?--todo**
          this.recurChangeTime(anyOtherOverlap[i].inConflict,draggy,overlappedEvtNew, true, doAdd) //umm doAdd flag not needed..toMonitor** //goForward,
          //skipAsk should be true as recursion implicitly force schedule change!
        } while (++i < sizey)
      }

      //umm not doing direction here?!? TOSEE***
      //is this the correct flow for time change?!?
      //use tEvt.duration?!? or should use direction +- timeDiff?!?
      this.changeEvtTime(overlappedEvtID, overlappedEvtNew, skipAsk) 
      //oldie >> overlappingEvtID //for overlapped it shouldnt need to add it...toMonitor though as passing in wrong evt!

      console.log(`recurChangeTime...OVERLAPPED:${overlappedEvtID} moved ${dName} to ${overlappedEvtNew.time}`,skipAsk)

      
      //umm targetDrop should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
      let draggedNewTime = targetTimestamp //(dragTimeInterval > 0 || goForward) ? addToDate(targetTimestamp, { minute: 0 })
                            //                      : addToDate(targetTimestamp, { minute: 0 }) 
      
      //the evt doing displacement stays the same...toReview**
      //changed = 
      this.changeEvtTime(tEvt.id, draggedNewTime, skipAsk, doAdd) //flag to add target in case...
      //worked = this.updateEvtInScheduleMaps(tEvt.id, draggedNewTime)

      console.log(`recurChangeTime...TARGET:${tEvt.id} went ${dName} to time>> ${draggedNewTime.time}`,skipAsk, doAdd) //goForward,
     
    } else{
      console.log("ERROR..ERROR overlapped event not found!", overlappedEvtID)
    }
  },
  fixAnOverlap(aConf, override = null){ //flag to override some of the basic functionality--toSee** if should use....

    let mainOpts = [
                  { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
                  { label: 'Choose by Score', value: 'opt2' },
                  { label: 'Choose one event', value: 'opt3' }
                  //Pick event--in all cases... prolly ,
                  // only show the force-scheduling both when !totalOverlap
              ]

    const evtLabels = anEvt => {
      return anEvt.title.trim() + " Priority = " + findPrio(anEvt) + " && Score:: " + anEvt.score
    }

    const findPrio = evt => {
      if (evt?.parentGoal){
        let prt = this.parentGoalsMap.get(evt.parentGoal)
        return prt?.priority
      }
      console.log('findhigherPrio..ERROR no PARENT found?',evt)
      return null //null or 0 ?!? toREview**
    }

    //when picks the unscheduled one > have to remove it and add unscheduled evt!
    const removeReplace = (toRem,toAdd) => { //do like this in order to keep context of `this.()`
        this.doRemove(toRem)
        console.log(`fixAnOverlap, adding ${toAdd.title} at ${toAdd.time}`, aConf) //prolly not correct time...and ugly!
        toAdd = this.addPropsEventsTo(this.currentDate,[toAdd]) //just in case...

        this.addEvtPropsIntoSchedule(toAdd[0]) //this.currentDate, //could this overlap again?!? prolly not?!?
        return //here?
    }

    const forceAdd = (toChange, toAdd,conf) => {
      let goF = conf.direction == 'haut'

      toAdd = this.addPropsEventsTo(this.currentDate,[toAdd])
      //oldie >> this.addEvtPropsIntoSchedule(this.currentDate,toAdd)

      //let starty= addToDate(parsed(toAdd.date), { minute: parseTime(toAdd.time) }) 
      //no need as already in conf.targetStart >>toMonitor continued use!

      console.log(`forceAdd changing evt:${toChange.id} to ${conf?.targetStart?.time} goFwd>>${goF}`) //due to ${.title}.  //toAdd, //conf
      
      
      //skipAsk user as should force!
      this.recurChangeTime(toChange.id,toAdd[0],conf.targetStart, true, true) //skipAsk and doAdd flags...//goF,

      //this.changeEvtTime(toChange.id,starty,false) 
      // not better than above as doesnt space evts properly nor check overlapps!!
    }

    const aNotif = (title) => {
      this.doNotify(`Cancelling to keep "${title}"`, "positive",'bottom')
    }

    let toAdd = this.getLocalEvt(aConf.target) //number
    let currScheduled = this.getScheduledEvent(aConf.inConflict) 
    if (!currScheduled || !toAdd ){console.log("fixAnOverlap...ERROR no evts found!!",aConf);return}

    if (aConf.direction !== 'surrounding'){ //add force to schedule both evts
      mainOpts.push({ label: `Force in '${toAdd.title.trim()}' at ${aConf?.targetStart?.time}`, value: 'opt4' })  //`Force both`
    }

    this.$q.dialog({
      title: 'Warning--Resolve Overlap',
      //class:"absolute-center", 
      //style:"display: flex; justify-content: center;", //ugly
      cancel: true, //"As-is",
      persistent: true, //have to choose! 
      // position: 'bottom',
      message: `Event: '${toAdd.title.trim()}' Overlaps with Scheduled '${currScheduled.title.trim()}'.
      \nResolve or Cancel to keep '${currScheduled.title.trim()}'`, //'${currScheduled.title.trim()}'
      options: {
        type: 'radio',
        model: 'opt1',
        // inline: true
        items: mainOpts
      },
    }).onOk((data) => {
      if (data =='opt3'){
        let m = 'Pick one event...'
        let labels = [
          {label: evtLabels(toAdd),value: toAdd.id },
          {label: evtLabels(currScheduled),value: currScheduled.id }
        ]
        this.radioChoiceDialog(m,labels,
        function(d){if(d == toAdd.id){removeReplace(currScheduled,toAdd);return} else {console.log('OPT3,chose scheduled', d, override);/*if(override){removeReplace(toAdd,currScheduled)};*/ return }}, //to see if returns closes parent dialog
        function(){aNotif(currScheduled.title.trim())}) //console.log('OPT3...cancelling') return?!? 
        //what does cancelling do?!?
      }else if (data =='opt2') {
        let m = 'Pick event by Score'
        let labels = [
          {label: `"${toAdd.title.trim()}" with Score:: ${toAdd.score} = ${this.parseScore(toAdd.score)}`,value: toAdd.id },
          {label: `"${currScheduled.title.trim()}" with Score:: ${currScheduled.score} = ${this.parseScore(currScheduled.score)}`, value: currScheduled.id }
        ]
        //choiceDialog
        this.radioChoiceDialog(m,labels,
      function(d){d == toAdd.id ? removeReplace(currScheduled,toAdd) : console.log('OPT2, chose scheduled', d,override);/*if(override){removeReplace(toAdd,currScheduled)}*/}, //return?
      function(){aNotif(currScheduled.title.trim())}) //console.log('OPT2...cancelling') return?
      }else if (data =='opt1'){
        let m = 'Pick event by Priority'
        let labels = [
          {label: `"${toAdd.title.trim()}" with Priority = ${findPrio(toAdd)}`,value: toAdd.id },
          {label: `"${currScheduled.title.trim()}" with Priority = ${findPrio(currScheduled)}`,value: currScheduled.id }
        ]
        //choiceDialog
        this.radioChoiceDialog(m,labels,
        function(d){if (d == toAdd.id){ removeReplace(currScheduled,toAdd);return} else{ console.log('OK OPT1, chose scheduled', d,override); /*if(override){removeReplace(toAdd,currScheduled)};*/ return }},
        function(){aNotif(currScheduled.title.trim()); return }) //console.log('OPT1...cancelling')
          //return //here? as those above dont do shit!
          //--maybe cause of second choice?!?--bon toSEE**
      }else{ 
          //OPT4..FORCING
        forceAdd(currScheduled,toAdd,aConf)
      }
    }).onCancel(() => {
        //console.log("Nope coolios, keeping scheduled...", this.scheduledEvents)
        this.doNotify(`Keeping scheduled "${currScheduled.title.trim()}"`, "positive",'bottom') // without conflicts!
        if(override){
          console.log("huh override... coolios") //should prolly cancel the drag/drop?
        }
    }).onDismiss(() => {
        //console.log("bon dismissing...fixAnOverlap with choice.") 
        //first dialog goes out of view >> nothing to do 
        return //? doesnt seem to be negative...toMonitor**
    })

  },
  handleOverlaps(conflicts){ //with local recursive method...
    /* 8: {direction: "haut",inConflict: 8,target: 1} */

    if (conflicts.length === 0) {
        return []
    }

    const popped = conflicts.pop()
    this.handleOverlaps(conflicts)

    this.fixAnOverlap(popped)  //could it be empty? >>yup

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
        
        console.log("doLoadNotPresent:evts",JSON.parse(JSON.stringify(evts)))
        
        let arr = Object.keys(evts).map((key) => savedEvtFunc(key,evts[key]))
        //this.scheduledEvents = this.addPropsEventsTo(null, toReload)
        this.scheduledEvents = this.addPropsEventsTo(onDate, arr) //arr
        

        //console.log("doLoadNotPresent:scheduled",JSON.parse(JSON.stringify(this.scheduledEvents)))
        //console.log(`doLoadNotPresent for ${onDate} with ${evts.length}`,toReload, this.scheduledEvents, this.dailyScheduled.size)

        //should make sure that evts.length == this.scheduledEvents.length--todo**
        //console.log(JSON.parse(JSON.stringify(c)))
          
        let e = this.updateCurrentSchedule() //just checks for startTimes only TOFIX**
          
        if (e.size > 0 && !inPast){//review overlaps in futur only
          console.log('doLoadNotPresent..FIX overlaps!!',e, onDate, inPast)
          this.doNotify(`${inPast ? 'past': 'future'}: ${onDate} with Some overlaps to fix!`, "warning",'bottom')

          this.fixConflicts(e)
          
          //this.disableSaveSchedule = false  //conflicts as user could change schedule?TBD**
        }else {
          this.showReloadBtn = false
          this.disableSaveSchedule = true
          this.doNotify(`Loaded schedule for ${inPast ? 'past': 'future'}:: ${onDate}`, "positive",'bottom')
        }
      }

      let OverlapCheckLoadToday = () => {
        let evts = this.getEventsForDate(onDate)
        if (!evts) {console.log(`ERROR no evts found for today:${onDate} ?!?`, evts); return}

        console.log("OverlapCheckLoadToday:evts",JSON.parse(JSON.stringify(evts))) //not an array but object...smh


        let arr = Object.keys(evts).map((key) => savedEvtFunc(key,evts[key])) //?!? ,id=key //[...evts[key]]

        //let arry = Object.entries(evts).map((key) => savedEvtFunc(key[0],key[1])) //works as well but using above...toSee**

        //console.log("OverlapCheckARR",JSON.parse(JSON.stringify(arr))) //, typeof arr
        //console.log("OverlapCheckARRY", arry, typeof arry)

        let toReload = this.addPropsEventsTo(onDate, arr) //evts

        console.log(`OverlapCheckLoadToday ${onDate} loading:${toReload.length}`,this.scheduledEvents, this.dailyScheduled.size) 

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
          console.log("Overlaps toHandle >>", toHandle) //object
          //also it might get re-ordered as keys be int?!? >>yup does!! smh
            
          for (let key in toHandle) {
            if (!toHandle[key] || !toHandle[key][0]){
              console.log("loadForDate...ERROR no local found",key) //,conflicts
              //return
              continue //prolly continue?
            }

            let toH = toHandle[key]
              //console.log(`handlin...${key}`)  //there could be multiple overlapps...

            this.handleOverlaps(toH)
          }

          this.showReloadBtn = hasSavedEvents
          this.disableSaveSchedule = false

          this.resetButtons(hasSavedEvents,inPast)

          return //needed in order to properly enable btns! 
        }

        this.evtStartedOrPassed(parseDate(new Date()))
        this.disableSaveSchedule = true  //prolly better
         
      } else {//past || future 
          doLoadNotPresent()  
          this.allowScoreEdit(inPast) // enable scoreEdit...disable score edit in future!!
      }
    } else {
      this.showReloadBtn = false //prolly for clearing when viewing diff days?!? tbd
      this.disableSaveSchedule = true  //see if proper here
    }
   
    if(inPast || onDate !== today()) { //adjustTime for past && futur 
        //console.log("adjusting time for past/future", onDate,this.scheduledEvents.length)
        this.adjustCurrentTime()
    }

    console.log(`loadForDate...got here too fast? ${hasSavedEvents} >> inPast:${inPast}`) 
    this.reset()
    this.resetButtons(hasSavedEvents,inPast) //not using this.hasEventsForDate as shows default button again!

  },
  scheduleDefaults(flag){ //schedule InDefaults Evts with flag to overwrite/add to schedule 
    this.scheduledEvents = []
    this.updateCurrentSchedule()

    let dEvts = this.deepCopy(this.store.fetchDefaults()) //resets reference >>does!
    //console.log(`InDefault:${this.currentDate}`,dEvts)

    let isTod = this.isViewingToday()
    let inPast = this.isViewingPast()

    this.showReloadBtn = this.hasEventsForDate 

    //do the below before or after...toReview***
    this.resetButtons(true,inPast) //not using this.hasEventsForDate as shows default button again! 
    this.disableSaveSchedule = !(dEvts.length > 0) //false
    //this.reset() //umm prolly not? in case have other buttons...toMonitor**

    if(isTod){ //do overlap check for today only...

      let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
  
      if(flag == 'add'){ 
        let orig = toReload.length
        toReload = toReload.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
        console.log(`scheduleDefaults..ADDIN from ${orig} to `,toReload.length)
      }

      let euhOverlaps = this.overlapCheckEvtsAdd(toReload) //no need for date prolly  //this.currentDate

      if(Object.keys(euhOverlaps).length > 0) {
        console.log(`scheduleDefaults overlaps on:${this.currentDate} ${dEvts.length} == ${toReload.length} ?!? of size:`, Object.keys(euhOverlaps).length) 
        for (let key in euhOverlaps) {
          if (!euhOverlaps[key] || !euhOverlaps[key][0]){
            console.log("scheduleDefaults...ERROR no local found",key) //,conflicts
            //return
            continue //prolly continue?
          }
          
          let toH = euhOverlaps[key]
          console.log(`scheduleDefaults::handlin...${key}`)  //there could be multiple overlapps...

          this.handleOverlaps(toH)
        }
      }
      this.evtStartedOrPassed(parseDate(new Date())) //this okay here ?!?
      
      return //here?!? or no need...toSee

    } else { //schedule without check for past/future
      if (inPast) {
        this.scheduledEvents = this.addPropsEventsTo(this.currentDate, dEvts) //[...e]  //e
      } else { 
        let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
        if(flag == 'add'){//still check for add flag in future though
          let orig = toReload.length
          toReload = toReload.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
          console.log(`scheduleDefaults..ADDIN in future ${this.currentDate} from ${orig} to `,toReload.length)
        }
        this.scheduledEvents = toReload
      }
      
      //let e = this.addPropsEventsTo(this.currentDate, this.returnNewEvts(true)) //instead of assigning with >> this.scheduledEvents = ...
      let sameStart = this.updateCurrentSchedule()
      console.log('doLoadDefault..sameStart?', sameStart)

      inPast ? this.allowScoreEdit(true) : this.allowScoreEdit(false)

    }

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
      //if (!map[ event.date ]) {  
      //    map[ event.date ] = []   //toUse
      //}
      //let hasSaved = this.hasEventsForDate //for later use to showReloadBtn?

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
     this.showReloadBtn = false //think false make sense....//toSave !== void 0 //hasSaved //!this.showReloadBtn //toggle reloadBtn---toSee*

     this.doNotify(`doSaveSchedule for ${this.currentDate}`, "positive", "top")

     return
  },
  onAddNewEvent(goalTitle, parentGoal, own, interval){
    console.log("Adding Event eh...", goalTitle, parentGoal, own, interval, this.possibleRange)

    if (!this.possibleRange){
      //console.log("umm not a range selection", this.startEndTimes)  //just in case it's single cell selction
      this.possibleRange = this.startEndTimes
    }

    let timeStart = parseTimestamp(this.possibleRange[0])
    //let tosee = parsed(this.possibleRange[0])
    let timeEnd = interval > 15 ? addToDate(timeStart, { minute: parseInt(interval)}) : addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15}) 
    //oldie >> 15 mins for when single timeslot selection

    //below redundant when set the interval...smh
    let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

    console.log("With times as ", goalTitle, parentGoal, own)
    console.log(`from ${timeStart.time} till ${timeEnd.time}.Duration:${duration}`)
    
    let subID = null 
    if(own == "self"){ //add it as self >>so create parent goal with this as subgoal
      //disregards whether a parent was selected*** ToReview!

      let pId = this.store.addMainGoal(goalTitle, "", "purple-10", 2)  //default color and priority
      if (pId) {
        console.log("wooh SELF parent created",pId)

        subID = this.store.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false) //canMove and notInDefaults
        //any issue with .value?
        
      } else {//could be for first first parentGoal---toTest**
        console.log("ERROR? no pID", pId)
        //
        //return? or just add it?tbd
      }
    } else { //just add it to Misc parentGoal(that have all one-off kind of stuff)
      if (parentGoal){
        //add it to parentGoal
        subID = this.store.addSubGoal(parentGoal.id,goalTitle,'1on5',timeStart.time, duration,false, false) //!canMove and notInDefaults

      }else { //any Misc parentGoal available?
        let pMisc = this.store.getGoalByTitle("Misc")  
        //could also filter by those present? >> this.storedMainG
        if(!pMisc){
          let iD = this.store.addMainGoal("Misc", "", "grey-10", 2)  //default color and priority
          if (iD) {
            console.log("No Misc pgoal...created",iD)
            subID = this.store.addSubGoal(iD,goalTitle,'1on5',timeStart.time, duration,true, false) //canMove and notInDefaults
          }
        } else{
          console.log("Woo found Misc pgoal", pMisc)
          subID = this.store.addSubGoal(pMisc.id,goalTitle,'1on5',timeStart.time, duration,false, false)//!canMove and notInDefaults
        }
      }
    }

    if (subID) {
      this.resetGoalEvts(true)//needed to refresh goals...//parentGoal map not updated at this point mais bon...
      
      let oOth = this.hasOverlappingEvent(subID, timeStart, duration)
      //this.resetGoalEvts(true) 
      if (oOth.length > 0) {
        //console.log("onAddNewEvent...OVERLAPS", oOth)
        //let euhOverlaps = this.overlapCheckEvtsAdd(toReload, onDate) //no need for this and can invoke handleOverlaps()? or have to use this?!?
        for(let i = 0; i < oOth.length; i++){
            let toH = oOth[i]
            console.log("onAddNewEvt, OVERLAPS handling",toH)
            this.fixAnOverlap(toH)
        }
      } else {
        ////this definitely needed as prolly wont show event!!
        let toAdd = this.addPropsEventsTo(this.currentDate,[{ //this.currentDate,
          id: subID,
          time: timeStart.time,
          title: goalTitle,
          score: '1on5',
          duration: duration,
          canMove: parentGoal ? false : true  //when pGoal then assume it cannot move otherwise should by default...prolly 
        }])
        console.log(`onAddNewEvt, addEvtPropsIntoSchedule: ${subID} at ${timeStart.time}`) //,toAdd
        
        this.addEvtPropsIntoSchedule(toAdd[0])
      }

      //this.doSaveSchedule()  //bon toReview if shouldnt save immediately but give choice to user to add some more!!
      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate

    } else{
      console.log("BOO ERROR no subID:(",subID)
      this.doNotify("Error adding this event :(", "negative")
    }

    this.addEventDialog = false
    this.reset()
  },
  onChooseEvent(){ //so hide the main dialog and show the pickEvent dialog
    this.addEventDialog = false
    this.pickEventDialog = true
  },
  onPickEvent() {
    
    this.pickEventDialog = false

    //this.draggedItem = this.toAddE

    if(!this.toAddE){
      console.log("onPickEvent...ERROR nill", this.toAddE)
      return 
    }
    //console.log(`I be picking`,JSON.parse(JSON.stringify(this.toAddE))) //${this.toAddE.id} :: ${this.toAddE.title}

    let addy = this.getScheduledEvent(this.toAddE.id)
    //let isNew = false //to skip ask for moving evt around

    if (!addy){
      //console.log("onPickEvent...NEW", addy, this.toAddE)
      addy = this.toAddE
      
      console.log(`onPickEvent...adding ${addy.id}:${addy.title.trim()} from ${addy.time} to ${this.targetDrop.timestamp.time} with force?`, this.force)

      //let samey = this.addPropsEventsTo(this.currentDate,[addy]) // add it with default and then continue....no need as added later
      //console.log(`onPickEvent...after PropsEventsTo`,JSON.parse(JSON.stringify(samey)))

      let doForce = this.isViewingPast() ? true : this.force  //inPast >>just force!!
      
      let anyOverlap = this.hasOverlappingEvent(addy.id, this.targetDrop.timestamp, addy.duration)
      let sizey = anyOverlap.length
      if(sizey > 0) {
        console.log(`onPickEvent::hasOverlappingEvent of size: ${sizey} with force flag:${this.force} while viewing in past?${doForce}`) 
       
        // use this.handleOverlaps(toHandle)?!? 
        //could be better to leave as is in order to handle recursive overlaps
        let i = 0
        do {
            this.recurChangeTime(anyOverlap[i].inConflict,addy, this.targetDrop.timestamp,doForce, true) //anyOverlap[i].direction=='haut', 
        } while (++i < sizey)

        //return ?!? >>meh to set buttons below...toSee
      } else {

        console.log("onPickEvent NO overlaps...changing to targetDrop!", doForce)

        this.changeEvtTime(addy.id, this.targetDrop.timestamp, doForce, true)
      }
    } else {
      console.log("onPickEvent...NOT NEW?!?ERROR!", addy, this.toAddE) //shouldnt get here!!--ToSEE**
      return
    }

    console.log(`onPickEvent adding ${addy.id} complete. force:${this.force}`, this.scheduledEvents)
      
    
    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate  //toReview this shw***
    
    this.reset() //needed?!? prolly not
    //this.skipAsk = false //reset this though..sometime else as erased too fast--todo**
  },
  onEndNow(evtID){
    const now = parseDate(new Date())

    let hasEvts = this.hasEventsForDate //as changes too fast for reloadBtn
    console.log(`oooh doEndNow!!!`, evtID, now.time, hasEvts)


    //reduceDuration(evt)
   //so just remove the remaining duration of event when completed earlier than expected
    //so could also remove the event entirely if hasnt started eh**
    //or only allow this when inBetween the event? otherwise do nothing....ToReview**
    if(this.dailyScheduled.has(evtID)){
      let evt = this.dailyScheduled.get(evtID)
      let starty = evt.start
      let endy = evt.end

      if (isBetweenDates(now, starty, endy, true)){ //umm what if it's already completed evt?>>SHOULD edit score--todo
        //let diffy = diffTimestamp(now, starty) //prolly no need to check for negative as done above line ...hopefully**TOTEST
        
        let o = this.getTimeNumber(endy) - this.getTimeNumber(starty)  //how this larger?!? should be duration
        let anotherDiff = this.getTimeNumber(now) - this.getTimeNumber(starty) //duration of event with change

        console.log(`end data be:`,starty.time,endy.time, evt)

        console.log(`Great, REDUCING duration from ${o} to:`, anotherDiff)
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

  },
  onSaveScore(newVal, id){
    
    let ev = this.dailyScheduled.get(id)
    if (ev){
      //console.log(`oooh onSaveScore from ${ev.score} to ${newVal}`, id)
      ev.score = newVal
      //this.store.saveSubProp(id, null, newVal)
      this.doSaveEvtProp(id, null, newVal)

      const getEvt = taskID => {
        return this.scheduledEvents.find(item => item.id == taskID) 
      }

      let h = getEvt(id) //send changes down to child component...
      if (h){
          h.score = newVal
      }else{console.log('onSaveScore ERROR not found',h, id) }

    }else {
      console.log(`ERROR onSaveScore could not find event ${id}?!?`) //this would be baaad! 
    }
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
    }

    if (this.scheduledEvents.length > 0){
      this.confirmAction("Overwrite current Evts?",doOverwrite, doCancel)
    } else {
      doOverwrite()
    } 

    this.showReloadBtn = false

  },
  onLoadDefault(){
      let doCancel = () => {
          console.log('Aborting', this.currentDate) //,this.scheduledEvents
          //this.showReloadBtn = !this.isViewingPast() || this.hasEventsForDate  //toTest**
      }

      let doOk = (flag) => {
        //this.scheduledEvents = []
        //this.updateCurrentSchedule()
        
        this.scheduleDefaults(flag)
      }

      if (this.scheduledEvents.length > 0){
          //this.confirmAction("Overwrite current Evts?",doOk, doCancel)
        let labels = [
          {label: `Add Defaults to current day schedule`,value: 'add'},
          {label: `Overwrite and only schedule Defaults`,value: 'overwrite'}
        ]
        this.radioChoiceDialog("Currently have scheduled Events...",labels, function(d){console.log('OK LoadDefaults', d); doOk(d)}, doCancel) //make sure callbacks works
      } else{
          doOk('overwrite')
      }
  },
  choosePrio(e){
    //console.log('choosePrio',e,this.chosenPrio)
    let oldy = this.chosenPrio
    if (oldy && oldy == e){
      this.disablePrioBtn = true //to see...user should not reclick without changing it again...
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
  onReloadWithPrio(){
    if (this.chosenPrio == null) { //kinda redundant with disable flag...mais bon just in case...
      this.doNotify("Ayo select a priority!")
      return
    }
    //console.log('findSamePrio.',this.chosenPrio)
    //let e = this.store.fetchGoalsWithPrio(this.chosenPrio) //deepCopy? tbd**
    //const map = {}
    const filterCurrent =() => {
      return this.scheduledEvents.filter(evt => this.parentGoalsMap.get(evt.parentGoal)?.priority == this.chosenPrio)
    }

    let doCancel = () => { //do cancel is merge here maybe?!? TBD
      console.log('onReloadWithPrio..cancelling') //this.scheduledEvents
      this.reset()
      return //no handling of buttons?*? TOREVIEW
    }

    const findSamePrio = (flag) => {
      let toRet = []
      if(flag == 'overwrite' || flag == 'add'){
        let allEvts = this.deepCopy(this.storedEvents)
        //console.log('findSamePrio..overwriting!!',this.chosenPrio,flag) //allEvts
        for (let evt of allEvts) {
          //let one = this.getAnEvent(evt)
          let e = this.parentGoalsMap.get(evt.parentGoal)
          if (e?.priority == this.chosenPrio){
            toRet.push(evt)
                //}else{console.log('findhigherPrio..ERROR no PARENT found?',one)}
          }//else{console.log('findSamePrio..skipping',e?.priority)}
        }

        toRet = this.addPropsEventsTo(this.currentDate, toRet) //should do below...
        
        if(flag == 'add'){ //just add to schedule
          //let s = this.scheduledEvents.length
          //this.scheduledEvents.push(...toRet)
          // filter out events that are already scheduled..not too expensive?
          toRet =  toRet.filter(x => !this.scheduledEvents.find(item => item.id == x.id))

          console.log(`findSamePrio...ADDIN from ${this.scheduledEvents.length}`, toRet)
        }
      } else {
        toRet = filterCurrent()
        console.log('findSamePrio..filtering!!',this.chosenPrio,toRet)
      }

      if (this.isViewingToday()){
        let overlaps = this.overlapCheckEvtsAdd(toRet)
        if(Object.keys(overlaps).length > 0){
          console.log('onReloadWithPrio..overlaps!!',this.chosenScore,overlaps)
          for (let key in overlaps) {
            if (!overlaps[key] || !overlaps[key][0]){
              console.log("onReloadWithPrio...ERROR no local found",key) //,conflicts
              //return
              continue //prolly continue?
            }
          
            let toH = overlaps[key]
            //console.log(`onReloadWithScore >>handlin...${key}`)  //there could be multiple overlapps...

            this.handleOverlaps(toH)
          }

          let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
          console.log('onReloadWithPrio:enabledScoreEdit',toEnable)
        }else { //no overlapps...
          console.log(`onReloadWithPrio >>No overlaps!!...`, toRet.length)
          if(flag == 'add'){
            let f = this.scheduledEvents.concat(toRet) //diff || [] 
            this.scheduledEvents = f
          }else{
            this.scheduledEvents = toRet
          }
          this.updateCurrentSchedule()
          
          //this.allowScoreEdit(true) //disable score edit --to put into updateCurrentSchedule() prolly
        }
      } else {//just schedule them!
        if(flag == 'add'){
          let f = this.scheduledEvents.concat(toRet) //diff || [] //beware empty!!
          this.scheduledEvents = f
        }else{
          this.scheduledEvents = toRet
        }

        this.updateCurrentSchedule()
        console.log(`onReloadWithPrio scheduliin..`, this.scheduledEvents)
        this.allowScoreEdit(false) //disable score edit for future
      }
      
      //notify for empty perhaps...
      if (!this.scheduledEvents.length > 0){
        this.doNotify(`Empty for Priority =${this.chosenPrio} :(`, "warning",'bottom')
        this.disableSaveSchedule = true
        this.showReloadBtn = this.hasEventsForDate
        return
      }

      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate
    }


    if (this.scheduledEvents.length > 0){
      let labels = [
        {label: `Filter current by priority == ${this.chosenPrio}`,value: 'filter' }, //false  //cannot pass false as empty string evaluates to it...smh!
        {label: `Add to current Evts with priority == ${this.chosenPrio}`,value: 'add'},
        {label: `Overwrite and schedule All by priority == ${this.chosenPrio}`,value: 'overwrite'}
        ]
      this.radioChoiceDialog("Choose Resolution...",labels, function(d){console.log('OK ReloadWithPrio', d); findSamePrio(d)}, doCancel)
    }else{
      findSamePrio('overwrite')
    }
    
    //this.updateButtons(true,false, true)//TOTEST if not better to do below at call site***
    this.resetButtons(this.hasEventsForDate,this.isViewingPast())  

    this.disablePrioBtn = true //to see...user should not reclick without changing it again...

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
      return //no handling of buttons?*? TOREVIEW
    }

    const filterCurrent = () => {
      //for (let e of conflictEvts) {
      let toReload = []
      this.scheduledEvents.forEach((item) => {
        let daScore = this.parseScore(item.score)
        if (daScore > -1 && daScore >= this.chosenScore) {
          toReload.push(item)
        }//else{console.log('ERROR...parseScore?skippin',daScore, item)}
      })
      return toReload
    }
    
    const reloadEvtsWithScore = (flag) => {
      let e = [] //(flag == 'overwrite') ? this.store.fetchGoalsWithMinScore(this.chosenScore) : filterCurrent()
      if (flag == 'overwrite' || flag == 'add'){
        //could prolly do all this calculations here even with variables instead of at db!!--toReview
        //e = this.store.fetchGoalsWithMinScore(this.chosenScore) //deepCopy? no need
         
        e = this.addPropsEventsTo(this.currentDate, this.store.fetchGoalsWithMinScore(this.chosenScore) ) //dEvts
        //not sure why this works better for overlap handling as addPropsEventsTo is run again during overlapCheckEvtsAdd() below...?!?

        if(flag == 'add'){ //just add---also beware re-adding existing evt***
          //let s = this.scheduledEvents.length
          //this.scheduledEvents.push(...e)

          // filter out events that are already scheduled..not too expensive?
          e =  e.filter(x => !this.scheduledEvents.find(item => item.id == x.id))

        }
      } else {
      //  console.log('filtering by score:',this.chosenScore, flag)
        e = filterCurrent()
      }
      
      console.log(`reloadEvtsWithScore>'${flag}'::${this.chosenScore}`, this.currentDate,this.isViewingToday(), e)

      //check conflicts only for today
      if(this.isViewingToday()){
        let overlaps = this.overlapCheckEvtsAdd(e)
        //let oOth = this.hasOverlappingEvent(obj.id, startTime, obj.duration) //before add evt
        if(Object.keys(overlaps).length > 0){
          console.log('onReloadWithScore..overlaps!!',this.chosenScore,overlaps)
          for (let key in overlaps) {
            if (!overlaps[key] || !overlaps[key][0]){
              console.log("onReloadWithScore...ERROR no local found",key) //,conflicts
              //return
              continue //prolly continue?
            }
          
            let toH = overlaps[key]
            //console.log(`onReloadWithScore >>handlin...${key}`)  //there could be multiple overlapps...

            this.handleOverlaps(toH)
          }
          //Promise.resolve()
          //queueMicrotask(count)
    
          let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
          console.log('onReloadWithScore:enabledScoreEdit',toEnable)
        }else { //no overlapps...
          console.log(`onReloadWithScore >>No overlaps!!...`, e)
          if(flag == 'add'){
            let f = this.scheduledEvents.concat(e) //(diff||[]
            this.scheduledEvents = f
            //this.updateCurrentSchedule() //to not run too fast?!? smh
          }else{
            this.scheduledEvents = e
            //this.updateCurrentSchedule()
          }
          this.updateCurrentSchedule() //doesnt not run too fast?!?
          //this.allowScoreEdit(true) //disable score edit --to put into updateCurrentSchedule() prolly
        }
        
      } else { //just schedule them!
        if(flag == 'add'){
          let f = this.scheduledEvents.concat(e) //diff||[] //works? beware of undefined?!?
          this.scheduledEvents = f
        }else{
          this.scheduledEvents = e
        }
        console.log(`onReloadWithScore scheduliin..`, this.scheduledEvents)
        this.updateCurrentSchedule()
        this.allowScoreEdit(false) //disable score edit for future
      }
    
      //notify for empty perhaps...toTest that doesnt between operations...
      if (!this.scheduledEvents.length > 0){
        this.doNotify(`Empty for Score >=${this.chosenScore} :(`, "warning",'bottom')
        this.disableSaveSchedule = true
        this.showReloadBtn = this.hasEventsForDate
        this.disableScoreBtn = true  //toSee**
        return
      }

      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate
    }

    if (this.scheduledEvents.length > 0) {
      //this.confirmAction("Overwrite current?",getEvts, doCancel)
      let labels = [
       {label: `Filter current by Interval Score >= ${this.chosenScore}`,value: 'filter'}, //false  //cannot pass false as empty string evaluates to it...smh!
       {label: `Add to current Evts with Interval Score >= ${this.chosenScore}`,value: 'add'},
       {label: `Overwrite and schedule All by Interval Score >= ${this.chosenScore}`,value: 'overwrite'}
       //should also add!! smh
      ]
      this.radioChoiceDialog("Schedule change...",labels, function(d){reloadEvtsWithScore(d)}, doCancel) //console.log('OK ReloadWithScore', d); 
    }else{
      reloadEvtsWithScore('overwrite')
    }

    //this.updateButtons(true,true, false)//TOTEST below
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
      console.log("onDrop to time-interval", scope.timestamp.time)
      targetTimey = scope.timestamp
    } else {
      if(type === 'goal-item' && this.targetDrop){ //check targetDrop in case didnt drag much and still in same spot
        console.log("Dropping goal-item!!",e, type, this.targetDrop.timestamp) //scope is undefined here
        targetTimey = this.targetDrop.timestamp
      }else {
        console.log("Cannot drop here YO!!",e, type, scope, this.targetDrop) //shouldnt happen? >>could if dropping too high in header as if going to prev/next day
        return
      }
    }
    
    if (!targetTimey) {console.log("ERROR...no timestamp YO!!",e, type, scope, this.targetDrop); return}

    //oldie >> 
    //let anyOverlap = this.overlapOtherEvent(draggy.id, targetTimey, draggy.duration)
    let anyOverlap =  this.hasOverlappingEvent(draggy.id, targetTimey, draggy.duration) //review for drag/drop as above line better?
    
    let sizey = anyOverlap.length
    if(sizey > 0) {
      console.log("WOAH WOAH onDrop...overlapp!", anyOverlap) //, hasOverlap
      let i = 0
      do {
        //this.fixAnOverlap(anyOverlap[i]) //works?!? >> does but not applicable for this case as should just push the evt(instead of giving options to resolve/choose!)
        //could maybe check for 'surrounding' and invoke it..otherwise use recurChangeTime()
        //anyOverlap[i].direction == "surrounding" ? this.fixAnOverlap(anyOverlap[i], true) : this.recurChangeTime(anyOverlap[i].inConflict, draggy, targetTimey, false, false)
        if(anyOverlap[i].inConflict == anyOverlap[i].target){
          console.log("EUUUH...self overlap?!?", anyOverlap) 
          //continue //? nope wouldnt move!
        }
        this.recurChangeTime(anyOverlap[i].inConflict, draggy, targetTimey,false)
      } while (++i < sizey)
    } else {
      //so no overlapp, just change dragged event time--ask User**
      let changed = this.changeEvtTime(draggy.id, targetTimey, false)
      //should test changed?@? Tbd--toTesT path ***
      //let worked = this.updateEvtInScheduleMaps(draggy.id, targetTimey)
      console.log("onDrop no overlap complete",changed, draggy.id,targetTimey)  //worked,
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate

    //this.reset() //prolly no need?
    //this.updateButtons(null, true, null, null) //no need as well..prolly
      
  },
  //problematic to activate this when evt has score enabled smh...toReview workaround with btn
  onDblClickEvent(e, event) {  
     //console.log("double click eh...", e, event)
    
    if(this.isViewingPast()){ //should prolly also check that it's schedule? 
        this.doNotify("Removing from the past is a no no!") //not likey if it's score editing that goes on!--toReview**
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

    //so here propose selection to add an event to the schedule
    //...dialog box to select from all subgoals
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
    console.log('onMouseDownTime', { scope, event })
    if (isLeftClick(event)) {
      console.log('onMouseDownTime and its a leftClick event')
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
    console.log('onMouseUpTime', { scope, event })
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
      //console.log('onToday..continuing without saving!',this.currentDate)
      this.$refs.calendar.moveToToday()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule()
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction("Save schedule changes?",doSave, doContinue)
    } else {
      doContinue()
    }
    //oldie >> this.$refs.calendar.moveToToday()
  },
  onPrev () {
    console.log('onPrev', this.currentDate)
    //this.doReset = true
    let doContinue = () => {
      //console.log('onPrev..continuing without saving!',this.currentDate)
      this.$refs.calendar.prev()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule()
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!--should navigate after? via ()=>{this.doSaveSchedule;doContinue}
      this.confirmAction("Save schedule changes?",doSave, doContinue)  //this.doSaveSchedule
      
    } else {
      doContinue() //oldie >> this.$refs.calendar.prev()
    }
   
  },
  onNext () {
    //console.log('onNext', this.currentDate)

    let doContinue = () => {
      //console.log('onNext..continuing without saving!',this.currentDate)
      this.$refs.calendar.next()
    }
    

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule()
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction("Save schedule changes?",doSave, doContinue)
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

.event-select
  display: flex
  flex-direction: column
  justify-content: center
  width: 100%
  padding: 2px

.event-select
  display: flex
  flex-direction: column
  justify-content: center
  width: 100%
  padding: 2px
</style>