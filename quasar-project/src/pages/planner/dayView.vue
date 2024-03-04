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
              <q-btn
                class="q-mt-xl"
                color=""
                text-color="green"
                elevated
                label="Reload"
                @click="onReloadSaved"
                no-caps 
              />
          </div>
          <div v-if="loadDefault">
            <q-btn
              class="q-mt-xl"
              color=""
              text-color="blue"
              elevated
              label="Defaults"
              @click="onLoadDefault"
              no-caps
            /><!--disable instead of hiding?!? TBD*** -->
          </div>
          <div v-if="showScoreBtn">
                <q-btn-dropdown
                  split
                  color=""
                  class="q-mt-xl"
                  text-color="teal"
                  elevated
                  :disable-main-btn= "disableScoreBtn"
                  :label="chosenScoreLabel"
                  @click="onReloadWithScore"
                  no-caps
                >
                <!--"chosenScore == null"
                  <q-separator 
                    vertical
                    color="red"
                /> -->
                <q-list>
                    <q-item v-for="e in scoreOptions" :key="e.id" clickable v-close-popup @click="chooseScore(e)" >
                      <q-item-section>
                        <q-item-label>{{ e }}</q-item-label>
                      </q-item-section>
                    </q-item>
  
                  </q-list>
                </q-btn-dropdown>
          </div>
          <div v-if="showPrio">
            <q-btn-dropdown
              split
              color=""
              class="q-mt-xl"
              text-color="teal"
              elevated
              :disable-main-btn= "disablePrioBtn"
              :label="chosenPrioLabel"
              @click="onReloadWithPrio"
              no-caps
            ><!--"chosenPrio == null" -->
              <q-list>
                <q-item v-for="e in setGoalsPrio()" :key="e" clickable v-close-popup @click="choosePrio(e)" >
                  <q-item-section>
                    <q-item-label>{{ e }}</q-item-label>
                  </q-item-section>
                </q-item>

              </q-list>
            </q-btn-dropdown>
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
                    />

                 <!--</div> -->
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
            /><!-- could add popup-content-class="class" for popup class
             -->
          </div>
          <q-card-actions align="center">
            <q-checkbox dense v-model="skipAsk" label="Force" color="teal" class="q-pa-sm" />
          </q-card-actions>
          <q-card-actions align="evenly">
            <q-btn elevated label="Add" color="primary" class="q-mr-md" @click="onPickEvent"/>
          </q-card-actions>      
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
  getDayIdentifier,
  today,
  parsed,
  parseDate,
  parseTime
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
      //inPast: ref(false), //redudant prolly
      adHocEventDialog:ref(true),  //true by default 

      conflictReso:ref(false), //resolve conflict radiobutton dialog
      resoType: ref(''), //priority or score 
      toAddE:ref(null),
      disabledScoreEvts:ref({}),
      hasStarted:ref({}),  //just for happening now..toReview as too much variables esti! and should combine with disabledScoreEvts var above!

      disableSaveSchedule:ref(true),
      skipAsk:ref(false),  //skip confirming for default time changes
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
    //this.scheduledEvents = 
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

      /*//neat! but shorter below :)
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

      // filter out events that are already scheduled
      let difference =  e.filter(x => !this.scheduledEvents.find(item => item.id == x.id)); // these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1

      //console.log('canBeAdded difference is', difference)

      if (difference.length == 0) return e
      
      return difference
    },
    storedEvents(){  //make sure that this shouldnt be in methods to be evaluated when adding new events TODO**
        return this.store.getSubGoals
    },
    storedMainG(){
      return this.store.getMainGoals
    },
    style () {
      return {
        top: this.timeStartPos + 'px'
      }
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
    //testy(){
    //  console.log('testy tesy...hidin') //toSee if triggers
    //},
    badgeClasses (event, type) {
      return applyClasses(event, type)
    },
    badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
      return applyStyles(event, type, timeStartPos, timeDurationHeight)
    },
    //numeric date and time identifier for timestamp comparison
    getTimeNumber(timey) {
      if (timey !== null) {
        return getDayTimeIdentifier(timey)
      }
      return false
    },
    hasUncompletedEvents(){ //should use endTime to determine this--TOREDO***
        for (let entry in this.disabledScoreEvts) { //could also use >> let value of Object.values(user)
            //console.log("hasUncompletedEvents", entry,this.disabledScoreEvts[entry])
            if (this.disabledScoreEvts[entry]) return true
        }
        return false
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
        if(!e.size > 0){
            //this.prioOptions = e.values()
            console.log('ERROR...no Priority goals?', e)
            //return what?!?
        }
        return e.values()
    },
    resetGoalEvts(newish = false){
        if (this.scheduledEvents === this.allEvents){ //triple equal sign for reference check..never goes here though smh
          console.log("resetGoalEvts SAME")
        }

        if (newish){
          let e = this.deepCopy(this.storedEvents)
          this.allEvents = [...e]
          return e
        }
        return this.allEvents  //here return same stuff...beware that not null***
    },
    getLocalEvt(id){ //from the allEvents array that "should" contain all evts--might not be originals--see warning in reloadEvtsTo()
        for(let i = 0; i< this.allEvents.length;i++){
            if (this.allEvents[i].id === id) return this.allEvents[i]
        }
        return null
    },
    getScheduledEvent(id){
        for(let i = 0; i< this.scheduledEvents.length;i++){
            if (this.scheduledEvents[i].id == id) return this.scheduledEvents[i]  //bon dbl == works better smh
        }
        return null
    },
    addEvtPropsIntoSchedule(aDate, event){ 
      
      //addPropsEventsTo
      this.addPropsEventsTo(aDate, [event]) //beware it returns an array!!
      
      //addEvtToSchedule

      this.scheduledEvents.push(event)

      return this.updateCurrentSchedule()  //not too expensive to do all evts when just adding one?!? toReview**

      //do below too prolly?!?...or let adjustCurrentTime?!? >>prolly have to...toDo***
      //let isToday = this.currentDate == today()
      //if (isToday){ //only allow for today
      //  this.canEnableEditScore(event.id,endTime)
      //  this.enableEndNowBtn(event.id, startTime, endTime)
      //}

      //return //here should do that whole check for sameStart methink? toSee
    },
    addPropsEventsTo(aDate, events){
      let pMap = this.parentGoalsMap  //assumes that parentGoals present...

      if (!events) { //|| !pMap
        this.doNotify("addPropsEventsTo BUT no goals to schedule...")
        return []
      }
      
      events.forEach((obj) => {
        obj.date = aDate != null ? aDate : obj.date //umm set to itself and better to null this and change in the onChange //"date": "2023-07-22"
        let pgoal = pMap.get(obj.parentGoal)
        if(!pgoal){
            console.log("no parent goal for:", obj)
            obj.bgcolor = "grey" //default for goals (could be ad-hoc goals)
            obj.details = "unknown"
        } else {
            obj.bgcolor = pgoal.bgcolor  //for weird colors, becomes transparent--beware**
            obj.details = `${pgoal.title.trim()} (${pgoal?.priority}) - ${obj?.duration}min`
        }
      })
      //console.log("addPropsEventsTo", aDate,events) //events, typeof events

      return events
    },
    updateCurrentSchedule() {
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
      
      //let notToday = this.isViewingPast() || (this.currentDate != today())
      //let isToday = this.currentDate == today()
      
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
        
      console.log("done updateCurrentSchedule", startTimes, sameTime,this.scheduledEvents.length, this.dailyScheduled) 
     //,this.dailyScheduled, this.scheduledEvents, typeof this.endTimesSet)

      return sameTime

    },
    evtStartedOrPassed(currentTime){ //evtID, endTime
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
    doEnableEndNowBtn(timey,hasEnd, hasStart){ //to enable/disable endButton...should replace one of the functions for endBtn around--toDO** 

      for (let [entry, val] of this.dailyScheduled) {
        let toComp = hasEnd ? val.end.time : val.start.time  //bon should work..prolly both flags are mutually exclusive?
        let euhStart = hasStart ? val.start.time : timey  //just in case but redundant..toRemove***
        if (toComp == timey){
          console.log("doEnableEndNowBtn...FOUND", entry, val)
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
    /*retrieveSameEnd(timey){ //to retrieve same endTimes---redundant--TOREMOVE***
        let retVal = []
        for (let [entry, val] of this.dailyScheduled) {
            if (val.end.time == timey){
                console.log("retrieveSameEnd...FOUND", entry, val)
                retVal.push(entry) //bon no need for object {}...toREview if ID arent enough smh
            }
        }
        return retVal
    },*/
       
    // get all events for the specified date--use scheduleMap instead...prolly**
    getDateEvents (dt) {
      const events = this.eventsMap[ dt ] || []
      if (events.length === 1) {
        events[ 0 ].side = 'full'
        
      }
      else if (events.length === 2) {
        //console.log("daEvents...LENGTH is 2?",events)
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
    overlapOtherEvent(evID, targetTimestamp, duration) {
      const mappy = []//{}
      let targetStartAt = addToDate(targetTimestamp,{ minute: 0}) 
      let targetEndsAt = addToDate(targetStartAt, { minute: duration}) //end of dropped event

      //console.log("overlapOtherEvent...targetTimes",targetStartAt.time,targetEndsAt.time)
      let tStart = this.getTimeNumber(targetStartAt)
      let tEnd = this.getTimeNumber(targetEndsAt)
      
      if (tStart === false || tEnd === false) {
        console.log("ERROR... overlapOtherEvent targetTimestamp error",targetTimestamp)
        return mappy
      }

      this.dailyScheduled.forEach( (value, key, map) => {
        if (key == evID){
            //console.log("skipping sameness overlapOtherEvent")//, evID, value //umm should not skip this in case it's ad-hoc? >>meh could get into infi loop so prolly not!
        }else {
          let eStart = this.getTimeNumber(value.start)
          let eEnd = this.getTimeNumber(value.end)

          if (eStart !== false && eEnd !== false){

          //target overlap with event (at start OR end) >>could prolly just have used 'isOverlappingDates' smh 
          let isTwix = (tStart >= eStart && tStart < eEnd) || (tEnd >= eStart && tEnd <= eEnd) //umm what if it's just at the line though? >>gets included...so removing '=' for endTime..prolly others too but ToReview!!
          let totalOverlap = (eStart >= tStart && tEnd >= eEnd) //totalOverlap as it's larger event

            if (isTwix || totalOverlap) {
              console.log(`Key:${key} overlaping added. Tween:${isTwix}, TotalOverlap:${totalOverlap}`)
              mappy.push(key)
            } //else {console.log(`${key} overlapOtherEvent Good`)}
          } else {console.log("ERROR... overlapOtherEvent eventTimestamp error",value)}
        }
      });
      return mappy
    },
    recurChangeTime(overlappingEvtID, tEvt, targetTimestamp, goForward = false) { // goForward to push down overlapping evts as it's more natural
      let overlappedEvt = this.dailyScheduled.get(overlappingEvtID)
      if (overlappedEvt){
        console.log(`dragDirection...target>>${targetTimestamp.time}`) //, oldie at`,tEvt, overlappedEvt
        //direction of drag(up or down) >>either - or + 
        let dragDirection = parseTime(targetTimestamp.time) - parseTime(tEvt.time)
        console.log(`dragDirection...${goForward}: ${dragDirection > 0 ? "DOWN": "UP"}`)

            //when dragDirection > 0 (going down)...otherwise going up...prolly
            //let overlappedEvtNew = dragDirection > 0 ? addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) //parseInt(overlappedEvt.for) 
            //                                        : addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) }) 
                 
        let overlappedEvtNew = null
        if (dragDirection > 0 || goForward) { //toTest goForward!--especially for multiple overlapps!***
          overlappedEvtNew = addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) 
        } else {
          overlappedEvtNew = addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) }) //remove instead of add...
        }
          //umm should keep same time interval between the two events?!? meh but to explore laterrrr**
                    
        let anyOtherOverlap = this.overlapOtherEvent(overlappingEvtID, overlappedEvtNew, overlappedEvt.for) //overlappingEvts[i]
        
        if(anyOtherOverlap.length > 0) {
          console.log("WARNING...more overlaps",anyOtherOverlap, overlappedEvtNew.time)
          let i = 0
          let sizey = anyOtherOverlap.length
          let draggy = this.getScheduledEvent(overlappingEvtID)
          do {
            console.log("CASCADING recurChangeTime:",anyOtherOverlap[i], overlappedEvtNew.time, draggy.title)
            this.recurChangeTime(anyOtherOverlap[i], draggy, overlappedEvtNew, goForward)        
          } while (++i < sizey)
        }

        console.log("overlappedEvtNew..",change,work, overlappingEvtID, overlappedEvtNew,this.skipAsk)

        //umm not doing direction here?!? TOSEE***
        let changed = this.changeEvtTime(overlappingEvtID, overlappedEvtNew, false) 
        //let worked = this.updateEvtInScheduleMaps(overlappingEvtID, overlappedEvtNew)
     
        //umm targetDrop should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
        let draggedNewTime = dragDirection > 0 ? addToDate(targetTimestamp, { minute: 0 })
                                                    : addToDate(targetTimestamp, { minute: 0 }) 
        
        //have to askUSER --toReview**
        changed = this.changeEvtTime(tEvt.id, draggedNewTime, false)/// oldie >>true
        //worked = this.updateEvtInScheduleMaps(tEvt.id, draggedNewTime)
            
        console.log("changeTime complete",changed,overlappingEvtID, overlappedEvtNew, tEvt.id,draggedNewTime) //worked,

      }else{
        console.log("ERROR..ERROR overlapped event not found!", overlappingEvtID)
      }
    },
    /* to remove--return of array though :) 
    changeEvtSchedule(evtID, timey,skipAsk = false){
        let changed = this.changeEvtTime(evtID, timey, skipAsk)

        let worked = this.updateEvtInScheduleMaps(evtID, timey)
        
        return [changed, worked] //works when using array
    },*/
    updateEvtInScheduleMaps(evID, timeyStart){ //toREmove as well!!--after copy of .delete invoke***
        if(this.dailyScheduled.has(evID)){
            let evt = this.dailyScheduled.get(evID)
            //console.log("updateScheduleMaps",today(),evt)
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
            }else{console.log("updateEvtInScheduleMaps-startTimesSet NOT FOUND?!?")} //this could happen? ToTest

            let isToday = this.currentDate == today()
            if (isToday){ //only allow for today
                this.canEnableEditScore(evID,newEndy)
                this.enableEndNowBtn(evID, timeyStart, newEndy)
            }

            return true
        }else{
            console.log("updateEvtInScheduleMaps--euh not found?ERROR?",evID, timeyStart) 
            return false 
        }  
        
    },
    //skipAsk to skip asking user--force flag
    changeEvtTime(evID, timeyStart, skipAsk) {
      console.log("changeEventTime",evID, timeyStart,this.scheduledEvents.length, skipAsk)
      let evt = this.getScheduledEvent(evID)
      if (!evt){
        console.log('ERROR in changeEvtTime not found?',evt, evID, timeyStart) //toMonitor***
        return false
      }

      let doUpdateEvt = () => {  //this.skipAsk ?
        //this.addPropsEventsTo(this.currentDate,[addy])
        //this.addEvtToSchedule(addy)
        evt.time = timeyStart.time
        this.updateEvtInScheduleMaps(evID, timeyStart)
        
        //the above equivalent to invoking this.updateEvtInScheduleMaps...
      }

      //see if works...could pass in flag to also remove || add from `updateEvtInScheduleMaps`--toSEE
      let changeSubProp = (flag) => {
        //this.store.saveSubProp(evID, timeyStart.time, null)
        this.doSaveEvtProp(evID, timeyStart.time, null)
        doUpdateEvt()

        return flag
      }

      let oldy = evt.time 
      let mess = `"${evt.title}" scheduled at:${oldy}. Use ${timeyStart.time} as default time from now?`
      
      //not asking...except for inDefaults && !evt.canMove ..prolly(||)--tbd**
      if (skipAsk) {
        if (evt?.inDefaults && !evt?.canMove){
          console.log("changeEventTime::skipAsk but GOTTA!!",evt.inDefaults, evt.canMove)
          
          this.$q.dialog({
            title: 'Default Change?',
            cancel: "Temp.Add",  //no  just change current...for this day.
            ok:"Change", //yes   //to store.saveSubProp && change current (see if dont store what happens--TOTEST**)
            // position: 'bottom',
            message: mess
          }).onOk(() => {
              return changeSubProp(true) //see if works...
          }).onCancel(() => {
              //is this also called on dismiss?!?
              console.log("Nope coolios, onCancel with temp.time add!!")
              doUpdateEvt()
          }).onDismiss(() =>{
              console.log("changeEventTime...dismissing..DO?!?") //here dont add perhaps?!?toREVIEW***
              return false
          })
          
          //evt.time = timeyStart.time   //goes way too early so moving back
          //console.log("changeEventTime...Changed!!!")
        } else {
            console.log("changeEventTime::skipAsk NOT ASKING",evt.inDefaults, evt.canMove)
            doUpdateEvt()
            return true //see if works...
        }
      } else { //asking!!
          //--for all except those evt?.canMove
        if (evt?.canMove){ //&& !inDefault ? >>TBD***
          doUpdateEvt()
          return true
        }

        //also should prolly use this.$q.dialog above for clarity?!! --TOSEE**
        //return 
        this.confirmAction(mess,function(){changeSubProp(true)}, function(){console.log(`Keeping ${evt.time}`); doUpdateEvt()}) 
        //return false? TOSEE**
      }
      
    },
    confirmAction(message, executeOk, executeCancel){
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
        console.log('dismissing confirmAction!!') //toRemove after test with return below
        return
      })

    },
    //just remove it from the current schedule...NOT delete it completely!!
    doRemove (item) {
      let currentSize = this.scheduledEvents.length
      
      let i = 0
      for( i; i < currentSize; i++){
        if ( this.scheduledEvents[i].id === item.id) {
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
            if (!hadStart || !hadEnd){console.log("ERROR doRemove scheduleSets has no such item?@? ",toDel, item)}}
          //return //important to return esti
          break //or break is better ? 
        }else{console.log("ERROR doRemove, NO item to delete?@? ", item)}//could get here when moving from other dates....toReview**
      }

      console.log("doRemove..looping FOR", i)
      return this.updateCurrentSchedule() //makes sense to add here...not needed as already updating above ** see looping above  
    },
    reset() { //reset variable for next use 
      this.draggedItem = null
      this.targetDrop = null
      //
      this.toAddE = null
      this.chosenScore = null
      this.chosenPrio = null

      this.possibleRange = null //enable after test**
      //this.inPast = false
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
    //make the below a lambda func?!?
    reloadEvtsTo(dt, evts){ 
        
        let e = this.allEvents //**WARNING** >>below updates also changes this array when used later (times)**
        //oldie >> this.deepCopy(this.storedEvents)

        let toReload = []

        e.forEach((obj) => {
            let sav = evts[obj.id]
            if (sav){
                obj.date = dt,//oldie >> sav.date, hopefully good?
                obj.time = sav.time, //save.time is what it was changed to...
                obj.duration = sav.duration, //umm just in case..but redundant
                //obj.score = sav.atScore

                toReload.push(obj)
            } //else{console.log(`Evt: ${obj.title} wasnt present!`)} 
        })
        return toReload
    },
    scheduleSavedEvents(aDate) {

      let evts = this.getEventsForDate(aDate) //oldie that workd >> this.store.getEventsForDate(aDate)

      if (!evts) {console.log(`ERROR no evts found for ${aDate}...`, evts); return}

      console.log(`scheduleSavedEvents evts for ${aDate}`,evts,this.scheduledEvents, this.dailyScheduled.size) //, this.startTimesSet
    
      let toReload = this.reloadEvtsTo(aDate, evts)
     
      this.scheduledEvents = this.addPropsEventsTo(null, toReload)

       //toReload //[...toReload]

      return this.updateCurrentSchedule()

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
    showChoiceDialog(mess,labels,onOk = null,onCancel = null){
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
            //console.log('showChoiceDialog data', data)
            if (onOk) {
              if(data == ''){ //invoked again to handle when user doesnt make selection!
              //console.log('showChoiceDialog EMPTY?!?..redoin') 
                this.showChoiceDialog(mess, labels,onOk,onCancel)
              }else {
                onOk(data)
              }
            }
        }).onCancel(() => {
            if (onCancel) {
              onCancel()
            }
        }).onDismiss(() => {
                //prolly return choice to caller? tbd
            console.log('showChoiceDialog dismissed') 
        })
    },
    handleOverlaps(conflicts){
        const findPrio = evt => {
          if (evt?.parentGoal){
            let prt = this.parentGoalsMap.get(evt.parentGoal)
            return prt?.priority
          }
          
          console.log('findhigherPrio..ERROR no PARENT found?',evt)
          return null //null or 0 ?!? toREview**
        }

        const evtLabels = anEvt => {
            return anEvt.title.trim() + " Priority = " + findPrio(anEvt) + " && Score:: " + anEvt.score //scoreInterval(anEvt.score) 
        }

        const removeReplace = (toRem,toAdd) => { //do like this in order to keep context of `this.()`
          this.doRemove(toRem)
          //this.addAnEvent(toAdd)
          this.addEvtPropsIntoSchedule(this.currentDate,toAdd)
        }

        const choiceDialog = (mess,labels,onOk = null,onCancel = null) => { //oldie but loses `this.` context >> function(mess,labels,onOk = null,onCancel = null)
            this.$q.dialog({
                //title: 'Alert',
                title:mess, //make it bigger--toSee
                cancel: onCancel ? true : false, //oldie >> false, //or check if onCancel != null
                persistent: true, //have to choose!
                //message: mess,
                options: {
                    type: 'radio',
                    model: '', //can select nothing if left blank..handled below
                    // inline: true
                    items: labels
                    },
            }).onOk((data) => {
                //console.log('choiceDialog data', data)
                if (onOk) {
                    if(data ==''){//tohandle when user doesnt make selection!
                        console.log('choiceDialog EMPTY?!?..redoin') 
                        choiceDialog(mess, labels,onOk,onCancel)
                    }else {
                        onOk(data)
                    }   
                }
            }).onCancel(() => {
                if (onCancel) {
                    onCancel()
                }
            }).onDismiss(() => {
                //nothing to do...prolly
                //console.log('choiceDialog dismissed') 
            })
        }

        for (let key in conflicts) {
            //key is scheduled evt
            let currScheduled = this.getScheduledEvent(key)
            
            //value is the one to fix 
            let o = conflicts[key]
            let toAdd = null
            if(o){
                toAdd = this.getLocalEvt(o.id)
            }else{
                console.log("handleOverlaps...ERROR not found",key, conflicts)
                return //or continue?!?
            }

            //console.log(`handlingOverlaps ${key}`) //,currScheduled,toAdd

            this.$q.dialog({
                title: 'Overlap Warning',
                //class:"absolute-center", 
                //style:"display: flex; justify-content: center;", //ugly
                cancel: true, //"As-is",
                persistent: true, //have to choose! toREview if needed!
            // position: 'bottom',
                message: `Event: '${toAdd.title.trim()}' Overlaps with Scheduled '${currScheduled.title.trim()}'\n
                Resolve or Cancel to keep '${currScheduled.title.trim()}'`, //'${currScheduled.title.trim()}'
                options: {
                type: 'radio',
                model: 'opt1',
                // inline: true
                items: [ //huh could actually show the conflicts evts's title here instead?--bof this can be chosen in one of the options....
                    { label: 'Resolve by Priority', value: 'opt1', color: 'secondary' },
                    { label: 'Resolve by Score', value: 'opt2' },
                    { label: 'Pick event', value: 'opt3' }
                ]},
                }).onOk((data) => {
                    if (data =='opt3'){ //in case picks the unscheduled one > have to remove it and add unscheduled evt!
                        let m = 'Choose one event to keep...'
                        let labels = [
                            {label: evtLabels(toAdd),value: toAdd.id },
                            {label: evtLabels(currScheduled),value: currScheduled.id }
                            ]
                        choiceDialog(m, 
                        labels, 
                        function(d){d == toAdd.id ? removeReplace(currScheduled,toAdd) : console.log('OK OPT3, chose scheduled', d) },
                        function(){console.log('CANCEL OPT3')}
                        )
                    }else if (data =='opt2') {
                        let m = 'Pick event by Score'
                        let labels = [
                            {label: `"${toAdd.title.trim()}" with Score:: ${toAdd.score} >> ${this.parseScore(toAdd.score)}`,value: toAdd.id },//oldie >> scoreInterval(toAdd.score)
                            {label: `"${currScheduled.title.trim()}" with Score:: ${currScheduled.score} >> ${this.parseScore(currScheduled.score)}`,value: currScheduled.id } //toSee if label is good***
                        ]
                        choiceDialog(m, 
                        labels, 
                        function(d){d == toAdd.id ? removeReplace(currScheduled,toAdd) : console.log('OK OPT2, chose scheduled', d)},
                        function(){console.log('CANCEL OPT2')})
                    } else {
                        let m = 'Pick event by Priority'
                        let labels = [ //evtLabels(toAdd)
                            {label: `"${toAdd.title.trim()}" with Priority = ${findPrio(toAdd)}`,value: toAdd.id },
                            {label: `"${currScheduled.title.trim()}" with Priority = ${findPrio(currScheduled)}`,value: currScheduled.id }
                            ]
                        choiceDialog(m, 
                        labels, 
                        function(d){d == toAdd.id ? removeReplace(currScheduled,toAdd) : console.log('OK OPT1, chose scheduled', d)},
                        function(){console.log('CANCEL OPT1')})
                    }
                }).onCancel(() => {
                    console.log("Nope coolios, keeping scheduled...", this.scheduledEvents)    
                }).onDismiss(() => {
                    //console.log("bon dismissing...handleOverlaps with choice.") //first dialog goes out of view >> nothing to do 
                })
        }
    },
    loadWithOverlapCheck(dt) {
        let evts = this.getEventsForDate(dt)
        if (!evts) {console.log(`ERROR no evts found for today:${dt} ?!?`, evts); return}

        console.log(`evts loadWithOverlapCheck ${dt}`,evts) //,this.scheduledEvents, this.dailyScheduled

        let toReload = this.reloadEvtsTo(dt, evts)

        const overlaps = {} //[]//{}

        // check that no overlap now!!
        for(let i = 0; i < toReload.length; i++){
            
           let obj = toReload[i] //should be found so no need to check existence...

           let startTime = addToDate(parsed(obj.date), { minute: parseTime(obj.time) })
            //let endTime = addToDate(startTime, { minute: obj.duration })

            let anyOverlap = this.overlapOtherEvent(obj.id, startTime, obj.duration)
            if(anyOverlap.length > 0){
                //console.log("WARNING some overlaps..adding",anyOverlap.length, startTime.time, obj.title)
                let j = 0
                do {
                    //key = currentScheduled
                    //value = conflict evts to add!
                    overlaps[anyOverlap[j]] = obj //hopefully shouldnt overlap with many evts?!?--TOTEST with more than one**
                    if(j>0){
                        console.log("WOAH WOAH, multiple overlaps with same obj!",j)
                    }    
                } while (++j < anyOverlap.length)
            } else{
                //this.addPropsEventsTo(dt,[obj])
                //this.addEvtToSchedule(obj)
                this.addEvtPropsIntoSchedule(dt,obj)
                //console.log("Added evt",obj.id, obj.title)
            }
        }
        
        Object.keys(overlaps).length > 0  ? 
        this.doNotify(`${dt} with Some overlaps to fix!`, "warning",'bottom') :
        this.doNotify(`Loaded schedule for ${dt}`, "positive",'bottom')

        return overlaps
    },
    loadForDate(onDate, hasSavedEvents, inPast){
        let doLoad = () => {
            let e = this.scheduleSavedEvents(onDate) //just checks for startTimes only TOFIX**
           
            if (e.size > 0 && !inPast){ 
                console.log('loadForDate..REVIEW overlaps!!',e, onDate, inPast)
                this.fixConflicts(e)

                // when there are conflicts as user could change schedule?TBD**
                //should also this.disableSaveSchedule = false
            }else {
              this.showReloadBtn = false
              this.disableSaveSchedule = true
              this.doNotify(`Loaded schedule for ${onDate}`, "positive",'bottom')
            }
        }

        this.scheduledEvents = []
        this.updateCurrentSchedule() // reset maps as well...
        
        if(hasSavedEvents) {
          if (this.isViewingToday()){
            //do overlap check for today only...
           //this should not overdo it when looking at other days!--futur though?!?TBD***
           let toHandle = this.loadWithOverlapCheck(onDate)
           
           if(toHandle.size > 0) {
              console.log("handle overlaps >>", toHandle) //also it might get re-ordered as keys be int?!?TOREVIEW & TEST***
              this.handleOverlaps(toHandle)
              this.showReloadBtn = true
              //this.disableSaveSchedule = false
            }

            //let toEnable = 
            this.evtStartedOrPassed(parseDate(new Date()))
            this.disableSaveSchedule = true  //prolly better
           
          }else {//past || future 
              doLoad()  
              this.allowScoreEdit(inPast) // enable scoreEdit...disable score edit in future!!
          }
        }else {
          
          //prolly not needed but prolly for clearing when viewing diff days?!? tbd
          this.showReloadBtn = false
          
          this.disableSaveSchedule = true  //see if proper here
        }
     
        if(inPast || onDate !== today()) { 
            //console.log("adjusting time for past/future", onDate,this.scheduledEvents.length)
            this.adjustCurrentTime()
        }

        this.reset()
        this.resetButtons(hasSavedEvents,inPast) //not using this.hasEventsForDate as shows default button again! 

    },
    loadDefaultEvts(){
      
      this.scheduledEvents = []
      
      //console.log('doLoadDefault:',this.currentDate) //,this.scheduledEvents, this.allEvents

      //let e = this.deepCopy(this.storedEvents) //see if resets reference >>does!
      //e = this.addPropsEventsTo(this.currentDate, e)

      let e = this.deepCopy(this.store.fetchDefaults()) //deepCopy? tbd**

      console.log('doLoadDefault:', this.currentDate, e)

      this.scheduledEvents = this.addPropsEventsTo(this.currentDate, e) //[...e]  //e

      //let e = this.addPropsEventsTo(this.currentDate, this.returnNewEvts(true)) //instead of assigning with >> this.scheduledEvents = ...
      
      let inPast = this.isViewingPast()
      let sameStart = this.updateCurrentSchedule()

      if(inPast){
        console.log('doLoadDefault > enabling scoreEdit in past', this.currentDate, sameStart)
        this.allowScoreEdit(true)

      } else{ //present || future
        if(sameStart.size > 0){
          console.log('doLoadDefault:..REVIEW overlaps!!',sameStart, this.currentDate)
          this.fixConflicts(sameStart)
        }

        let isTod = this.isViewingToday()
        if(isTod){
          let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
          console.log('doLoadDefault:enabledScoreEdit',toEnable)
          //toEnable.forEach((item) => {
            //this.disabledScoreEvts[item] = isTod ? false : true
          //  this.enableEvtScoreEdit(item)
          //})
        } else{
          //console.log('doLoadDefault > disabling scoreEdit in future', this.currentDate, sameStart)
          this.allowScoreEdit(false)  //yup disable score edit in future!!
        }
      }

      this.showReloadBtn = this.hasEventsForDate

      //this.updateButtons(false,true, true)
      this.resetButtons(true,inPast) //not using this.hasEventsForDate as shows default button again! 
      this.disableSaveSchedule = false

      this.reset()
      //this.chosenScore = null
      //this.chosenPrio = null

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

       this.store.saveDailySchedule(this.currentDate, toSave) 
       this.disableSaveSchedule = true 

       this.doNotify(`doSaveSchedule for ${this.currentDate}`, "positive", "top")

       //return
    },
    onAddNewEvent(goalTitle, parentGoal, own){
      console.log("Adding Event eh...", goalTitle, parentGoal, own, this.possibleRange)

      if (!this.possibleRange){
        //console.log("umm not a range selection", this.startEndTimes)  //just in case it's single cell selction
        this.possibleRange = this.startEndTimes
      }

      let timeStart = parseTimestamp(this.possibleRange[0])
      //let tosee = parsed(this.possibleRange[0])
      let timeEnd = addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15 })  //as to account for extra 15 mins in selection or when single timeslot selection

      let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

      //console.log("With times as ", timeStart, timeEnd, duration)
      
      let subID = null 
      if(own == "self"){ //add it as self >>so create parent goal with this as subgoal
        //disregards whether a parent was selected*** ToReview!

        let pId = this.store.addMainGoal(goalTitle, "", "orange", 2)  //default color and priority
        if (pId) {
          console.log("wooh parent created",pId)

          subID = this.store.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,false) 
          //any issue with .value?
          
        } else {//could be for first first parentGoal---toTest**
          console.log("ERROR? no pID", pId)
          //
          //return? or just add it?
        }
      } else { //just add it to Misc parentGoal(that have all one-off kind of stuff)
        if (parentGoal){
          //add it to parentGoal
          subID = this.store.addSubGoal(parentGoal.id,goalTitle,'1on5',timeStart.time, duration,false)

        }else { //any Misc parentGoal available?
          let pMisc = this.store.getGoalByTitle("Misc")  
          //could also filter by those present? >> this.storedMainG
          if(!pMisc){
            console.log("ERROR? no Misc pgoal", this.storedMainG)
            let iD = this.store.addMainGoal("Misc", "", "purple", 2)  //default color and priority
            subID = this.store.addSubGoal(iD,goalTitle,'1on5',timeStart.time, duration,false) 
            
          } else{
            console.log("Woo found Misc pgoal", pMisc)
            subID = this.store.addSubGoal(pMisc.id,goalTitle,'1on5',timeStart.time, duration,false)
          }
        }
      }

      if (subID) {
        //this.addAnEvent({ //parentGoal map not updated at this point mais bon...
        this.addEvtPropsIntoSchedule(this.currentDate,{
            id: subID,
            time: timeStart.time,
            score: '1on5',
            duration: duration,
            canMove: parentGoal ? true : false //when pGoal then assume it can move otherwise, shouldnt by default...prolly 
        })

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
      //console.log('I be picking', this.toAddE, this.targetDrop, this.currentDate, this.isViewingPast())
      
      this.pickEventDialog = false

      //this.draggedItem = this.toAddE

      if(!this.toAddE){
        console.log("onPickEvent...ERROR nill", this.toAddE)
        return 
      }

      let addy = this.getScheduledEvent(this.toAddE.id)
      //let isNew = false //to skip ask for moving evt around
      if (!addy){ //>>redundant as filters for unscheduled evts anyway...
        //console.log("onPickEvent...NEW", addy, this.toAddE)
        addy = this.toAddE
        
        console.log(`onPickEvent...adding from ${addy.time} to `, addy.id, this.targetDrop.timestamp.time)

        let samey = this.addEvtPropsIntoSchedule(this.currentDate,addy) // add it with default and then continue..

        let anyOverlap = this.overlapOtherEvent(addy.id, this.targetDrop.timestamp, addy.duration)
        //above kinda redundant as already added via addEvtPropsIntoSchedule() but as default so prolly ok..
        
        if(anyOverlap.length > 0) {
          console.log("onPickEvent has Overlaps..HANDLED?", anyOverlap, this.skipAsk)// use this.handleOverlaps(toHandle) >> todo***
          let i = 0
          do {
              this.recurChangeTime(anyOverlap[i],addy, this.targetDrop.timestamp, this.skipAsk)//toReview*** flag as shouldnt NOT use 'this.skipAsk' here
          } while (++i < sizey)

          //return ?!? >>meh to set buttons below...toSee
        }else {

          console.log("onPickEvent NO overlaps...changing to targetDrop!", samey, this.skipAsk)

          this.changeEvtTime(addy.id, this.targetDrop.timestamp, this.skipAsk)
      
        }
      } else {
        console.log("onPickEvent...NOT NEW?!?ERROR!", addy, this.toAddE) //shouldnt get here!!--ToSEE**
        return
      }

      console.log("AddEvent complete",addy.id,this.skipAsk, this.scheduledEvents)
        
      
      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate
      
      this.reset() //needed?!? prolly not
      //this.skipAsk = false //reset this though..sometime else as erased too fast--todo**
    },
    onEndNow(evtID){
      const now = parseDate(new Date())

      console.log(`oooh doEndNow!!!`, evtID, now.time)

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
          let anotherDiff = this.getTimeNumber(now) - this.getTimeNumber(starty)

          console.log(`end data be:`,endy, starty, evt)

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
      this.showReloadBtn = this.hasEventsForDate

    },
    doSaveEvtProp(evtID, timey = null, score = null){
      this.store.saveSubProp(evtID, timey, score)  //should just send whole event?
      return 
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
        //this.loadForDate(this.currentDate, hasEvents, this.isViewingPast())
      } 

      this.showReloadBtn = false

    },
    onLoadDefault(){
        let doCancel = () => {
            console.log('Aborting', this.currentDate,this.scheduledEvents)
            //this.showReloadBtn = !this.isViewingPast() || this.hasEventsForDate  //toTest**
        }

        let doOk = () => {
          this.scheduledEvents = []
          this.updateCurrentSchedule()
          
          this.loadDefaultEvts()
        }

        if (this.scheduledEvents.length > 0){
            this.confirmAction("Overwrite current Evts?",doOk, doCancel)
        }else{
            this.loadDefaultEvts()
        }

    },
    choosePrio(e){
      console.log('choosePrio',e,this.chosenPrio)
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

      const findSamePrio = (flag) => {
          let toRet = []
          if(flag == 'overwrite'){
            let allEvts = this.deepCopy(this.storedEvents)
            console.log('findSamePrio..overwriting!!',this.chosenPrio,flag) //allEvts
            for (let evt of allEvts) {
              //let one = this.getAnEvent(evt)
              let e = this.parentGoalsMap.get(evt.parentGoal)
              if (e?.priority == this.chosenPrio){
                toRet.push(evt)
                  //}else{console.log('findhigherPrio..ERROR no PARENT found?',one)}
              }//else{console.log('findSamePrio..skipping',e?.priority)}
            }
          }else {
            toRet = filterCurrent()
            console.log('findSamePrio..filtering!!',this.chosenPrio,toRet)
          }


            //console.log('findhigherPrio..Highest priority be',toRet, highest)
            
            //oldie >> return toRet
          
            //console.log('findhigherPrio..Highest priority be',toRet, highest)
            
            //oldie >> return toRet
        this.scheduledEvents = this.addPropsEventsTo(this.currentDate,toRet)
        let samey = this.updateCurrentSchedule()

          //notify for empty perhaps...
        if (!this.scheduledEvents.length > 0){
          this.doNotify(`Empty for Priority =${this.chosenPrio} :(`, "warning",'bottom')
          this.disableSaveSchedule = true
          this.showReloadBtn = this.hasEventsForDate
          return
        }

        //check for conflicts?!
        if (samey.size > 0) {
          console.log('onReloadWithPrio..REVIEW overlaps!!',samey, this.currentDate)
          this.fixConflicts(samey)
        }

        if (this.isViewingToday()){
          let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
          console.log('onReloadWithPrio:enabledScoreEdit',toEnable)
        } else {
          this.allowScoreEdit(false) //disable score edit for future
        }
        this.disableSaveSchedule = false
        this.showReloadBtn = this.hasEventsForDate
      }

      let doCancel = () => { //do cancel is merge here maybe?!? TBD
          console.log('onReloadWithPrio..cancelling',this.scheduledEvents)
          this.reset()
          return //no handling of buttons?*? TOREVIEW
      }

      if (this.scheduledEvents.length > 0){
        let labels = [
          {label: `Filter current by priority = ${this.chosenPrio}`,value: 'filter' }, //false  //cannot pass false as empty string evaluates to it...smh!
          {label: `Overwrite and schedule by priority = ${this.chosenPrio}`,value: 'overwrite' }
          ]
        this.showChoiceDialog("Choose Resolution...",labels, function(d){console.log('OK ReloadWithPrio', d); findSamePrio(d)}, doCancel) //make sure callbacks works
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
      const filterCurrent = () => {
        //for (let e of conflictEvts) {
        let toReload = []
        this.scheduledEvents.forEach((item) => { //works?!? toTEST***
          let daScore = this.parseScore(item.score)
          if (daScore > -1 && daScore >= this.chosenScore) {
            toReload.push(item)
          }//else{console.log('ERROR...parseScore?skippin',daScore, item)}
        })
        return toReload
      }
      
      const reloadEvtsWithScore = (flag) => {
        let e = []
        if (flag == 'overwrite'){//overwrite all
          e = this.store.fetchGoalsWithMinScore(this.chosenScore) //deepCopy? >>should prolly do all this calculations here even with variables!!--todo***
        } else {
          console.log('filtering by score:',this.chosenScore, flag)
          e = filterCurrent()
        }
        
        console.log('onReloadWithScore', this.currentDate,this.chosenScore, e)

        this.scheduledEvents = this.addPropsEventsTo(this.currentDate, e)  //e//[...e]  //toTest if works proper here!

        let samey = this.updateCurrentSchedule()

        //notify for empty perhaps...
        if (!this.scheduledEvents.length > 0){
          this.doNotify(`Empty for Score >=${this.chosenScore} :(`, "warning",'bottom')
          this.disableSaveSchedule = true
          this.showReloadBtn = this.hasEventsForDate
          return
        }
        //check conflicts here...todo**
        if (samey.size > 0) {
          console.log('onReloadWithScore..REVIEW overlaps!!',samey, this.chosenScore)
          this.fixConflicts(samey)
        }

        if (this.isViewingToday()){
          let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
          console.log('onReloadWithScore:enabledScoreEdit',toEnable)
        } else {
          this.allowScoreEdit(false) //disable score edit for future
        }
        this.disableSaveSchedule = false
        this.showReloadBtn = this.hasEventsForDate
      }

      let doCancel = () => { //do cancel is merge here maybe?!? TBD
            console.log('onReloadWithScore..cancelling',this.scheduledEvents)
            this.reset()
            return //no handling of buttons?*? TOREVIEW
        }

      if (this.scheduledEvents.length > 0) {
        //this.confirmAction("Overwrite current?",getEvts, doCancel)
        let labels = [
         {label: `Filter current by Interval Score > ${this.chosenScore}`,value: 'filter' }, //false  //cannot pass false as empty string evaluates to it...smh!
         {label: `Overwrite and schedule by Interval Score > ${this.chosenScore}`,value: 'overwrite' }
        ]
        this.showChoiceDialog("Choose Resolution...",labels, function(d){reloadEvtsWithScore(d)}, doCancel) //console.log('OK ReloadWithScore', d); 
      }else{
        reloadEvtsWithScore('overwrite')
      }

      //this.updateButtons(true,true, false)//TOTEST below
      this.resetButtons(this.hasEventsForDate,this.isViewingPast())

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
      console.log('onDragEnd', this.endTimesSet, this.startTimesSet)
    },
    onDrop(e, type, scope) { //other drag functions above need for this to fire >>especially 'onDragOver' above
        //console.log("onDrop", e, type, scope)//JSON.stringify(item)
        let draggy = this.getScheduledEvent(this.draggedItem.id) //bon grab whole event..

        if (!draggy) {console.log("onDrop ERROR", draggy,this.draggedItem ); return}

        let targetTimey = null

        if (type === 'interval') { //when dragged to head, it would be a whole day event
            console.log("onDrop...normal move with scope", scope.timestamp)
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

        let anyOverlap = this.overlapOtherEvent(draggy.id, targetTimey, draggy.duration) //this.draggedItem
        let sizey = anyOverlap.length
        
        if(sizey > 0) {
            console.log("WOAH WOAH onDrop...overlapp!", anyOverlap)
            let i = 0
            do {
                this.recurChangeTime(anyOverlap[i], draggy, targetTimey) //this.draggedItem
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
        //this.updateButtons(null, true, null, null) //no need? toReview***
        
    },
    onDblClickEvent(e, event) {  //find way to activate this when evt has score enabled smh--todo***
       //console.log("double click eh...", e, event)
      
      if(this.isViewingPast()){ //should prolly also check that it's schedule? 
          this.doNotify("Removing from the past is a no no!") //not likey if it's score editing that goes on!--toReview**
          e.preventDefault()
          return
      }
      
      this.$q.dialog({
        title: 'Alert',
        cancel: true,
       // position: 'bottom',
        message: `Sure to remove evt: ${event.title} from today?`
      }).onOk(() => {
        this.doRemove(event)
        //this.updateCurrentSchedule() // gotta do it here or it runs before
        //...>>done in doRemove above
             
        //this.updateButtons(null, true, null, null) --TORE-ADD logic of which buttons**TODO
        this.disableSaveSchedule = false //allow saving schedule

        //this.showReloadBtn = true //
        this.showReloadBtn = this.hasEventsForDate
      }).onCancel(() => {
        console.log('Cancelled remove')
      })//.onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          //})
    },
    onClickDate (data) {
      console.log('onClickDate', data)
    },
    onClickTime (data) { 
      //**ariko wont this affect the scrolling? or would it be notificeable in mobile? ToSee**
      //tbd if shouldnt do this in clickInterval...
      console.log('onClickTime..event', data)

     //not allowed to change past loaded schedule--todo
      if(this.isViewingPast()){ //should prolly also check saved? shouldnt make no diff though
          //this.doNotify("Adding to the past is a no no!")
          //this.inPast = true //flag that it's adding to past...
          //return
      }

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

      if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
        this.confirmAction("Save schedule changes?",this.doSaveSchedule, doContinue)
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

      if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!--should navigate after? via ()=>{this.doSaveSchedule;doContinue}
        this.confirmAction("Save schedule changes?",this.doSaveSchedule, doContinue) 
        
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

      if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
        this.confirmAction("Save schedule changes?",this.doSaveSchedule, doContinue)
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