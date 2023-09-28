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
         <div v-if="reloadSaved">         
             <q-btn
               class="q-mt-xl"
               color=""
               text-color="green"
               elevated
               label="Load Saved"
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
           />
         </div>
         <div v-if="doSchedule">
               <q-btn-dropdown
                 split
                 color=""
                 class="q-mt-xl"
                 text-color="teal"
                 elevated
                 :label="chosenScoreLabel"
                 @click="onReloadWithScore"
                 no-caps
               >
                 <q-list>
                   <q-item v-for="e in scoreOptions" :key="e.id" clickable v-close-popup @click="chosenScore = e" >
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
               v-for="event in getEvents(timestamp.date)"
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
 
       <q-dialog v-model="showEventDialog" transition-show="rotate" transition-hide="rotate">
        <q-card> <!--style="padding: 2px 2px;"-->
           <q-card-section>
             <div class="text-h3">Pick event</div>
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
           <q-card-actions align="right">
             <q-btn flat label="Add" color="primary" @click="onAddEvent"/>
           </q-card-actions>         
        </q-card>
       </q-dialog>
       <!--<q-dialog v-model="conflictReso"> --redundant
        <q-card>
         <q-card-section>
          <div class="q-gutter-sm"> 
            <q-radio v-model="resoType" @click="reset" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="main" label="Priority" />
            <q-radio v-model="resoType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="sub" label="Score" />
          </div>
         </q-card-section>
         <q-separator />
         <q-card-actions align="right">
            <q-btn flat label="Pick" color="primary" @click="onPickConflictReso"/>
          </q-card-actions>
        </q-card>
       </q-dialog> -->  
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
import addGoalForm from '../planner/viewAllGoals.vue'
import GoalyEnd from '../../components/planner/goalyEnd.vue'
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
  },
  data () {
    const draggedItem = ref(null)
    const targetDrop = ref(null)

    const currentTime = ref(null)

    const endTimesSet = ref(null) //set of end times for scheduled events for lookup when adjusting time!
    const startTimesSet = ref(null) //bon same as above--just to know when starting an event
    
    const allEvents = ref(null)  //bring up all subgoals from storage by default //keep reference to it without change
    const dailyScheduled = ref(null) //shall be the daily scheduled and for currently viewed day--for saveSchedule..prolly

    const $q = useQuasar()
    let intervalId = null

    let doReset = false //when going backward..reload defaults

    return {
      currentDate: ref(today()),
      scoreOptions:ref([1,2,3,4,5]),
      chosenScore:ref(null),
      events: [], //should rename this...

      calendar: ref(null),
      store:useGoalStore(),

      anchorTimestamp: ref(null), //start time for range
      otherTimestamp: ref(null),   //end time for range...
      mouseDown: ref(false),
      mobile: ref(true),

      timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update

      showGoalForm: ref(false), //showing addGoal form
      showEventDialog:ref(false), //showing pick event to schedule dialog
      conflictReso:ref(false), //resolve conflict radiobutton dialog
      resoType: ref(''), //priority or score 
      toAddE:ref(null),
      disabledScoreEvts:ref({}),
      hasStarted:ref({}),  //just for happening now..toReview as too much variables esti! and should combine with disabledScoreEvts var above!

      disableSaveSchedule:ref(true),
      //skipReload:ref(false),  //not used
      reloadSaved:ref(false), //when date has saved events that are not default
      loadDefault:ref(true), //reload default events...
      doSchedule:ref(false), //toReview usage..should be for schedule from a particular logic...
    }
  },
  beforeMount() {
    this.mobile = isMobile()  //--for drag for range selection.
   
    //this should just load all events--nothing else--prolly
    //in onChange is where to setDate and other props...prolly..unless there is a reason that not doable there?
    //this.events = this.addPropsEventsTo(null, this.returnNewEvts(true)) //[...e] //does update!
    this.events = this.returnNewEvts(true)
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
      return this.chosenScore == null ? `Scheduled All` : `Schedule >${this.chosenScore}` 
    },
    showForm() {return this.showGoalForm},
    doDisableSaveSchedule(){
        return this.disableSaveSchedule 
    },
    eventsMap () {// convert the events into a map of lists keyed by date
      const map = {}
      this.events.forEach(event => {
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
        let mG = this.store.getMainGoals
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
        return this.events.find(item => item.id == taskID) 
      }

      e.forEach(obj => { 
           let h = hasEvt(obj.id)
           if (!h){
            toRet.push(obj)
           }else{console.log('hasEvt found',h) }
        })
    
      console.log('canBeAdded toRet is', toRet) */

      // filter out events that are already scheduled
      let difference =  e.filter(x => !this.events.find(item => item.id == x.id)); // these dont work >> !this.events.includes(x)  //this.events.indexOf(x) !== -1

      //console.log('canBeAdded difference is', difference)

      if (difference.length == 0) return e
      
      return difference
    },
    storedEvents(){
        return this.store.getSubGoals
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
          dates.push(getDateTime(this.anchorTimestamp), getDateTime(this.otherTimestamp))
        }
        else {
          dates.push(getDateTime(this.otherTimestamp), getDateTime(this.anchorTimestamp))
        }
      }
      //console.log("startEndTimes", dates)
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
    returnNewEvts(newish = false){
        if (this.events === this.allEvents){ //triple equal sign for reference check..never goes here though smh
          console.log("returnNewEvts SAME")
        }

        if (newish){
          let e = this.deepCopy(this.storedEvents)
          this.allEvents = [...e]
          return e
        }
        return this.allEvents  //here return same stuff...beware that not null***
    },
    addPropsEventsTo(to, events){
      let pMap = this.parentGoalsMap  //assumes that parentGoals present...

      if (!events) { //|| !pMap
        this.doNotify("addPropsEventsTo BUT no goals to schedule...")
        return []
      }
      
      events.forEach((obj) => {
        obj.date = to != null ? to : obj.date //umm set to itself and better to null this and change in the onChange //"date": "2023-07-22"
        let pgoal = pMap.get(obj.parentGoal)
        if(!pgoal){
            console.log("no parent goal for:", obj)
            obj.bgcolor = "red" //default for goals (could be ad-hoc goals)
            obj.details = "unknown"
        } else {
            obj.bgcolor = pgoal.bgcolor  //for weird colors, becomes transparent--beware**
            obj.details = "from:"+ pgoal.title
        }
      })

      console.log("addPropsEventsTo", to) //events, typeof events

      return events
    },
    //numeric date and time identifier for timestamp comparison
    getTimeNumber(timey) {
      if (timey !== null) {
        return getDayTimeIdentifier(timey)
      }
      return false
    },
    adjustCurrentTime() {
      const now = parseDate(new Date())

      //console.log("adjustin...", this.currentDate, now.date)
      if (this.currentDate !== now.date){  //caused a jump back to current day smh
        //console.log("Not adjustin...", this.currentDate, now.date)
        this.timeStartPos = -10 //when null, doesnt change smh and 0 still shows...toMonitor if need to remove interval
        this.currentTime = ''
        return
      }
    
      this.currentDate = now.date 
      this.currentTime = now.time //'00:52'
      this.timeStartPos = this.$refs.calendar.timeStartPos(this.currentTime, false)  
      //the above dont update in view >>cause was not in return!!

      if(this.startTimesSet && this.startTimesSet.has(now.time)){ //to show the endBtn
      let evtIDs = this.retrieveSameStart(now.time)
        console.log("sameStart..FOUND", evtIDs) //shouldnt be many but 'could'
        for (let i of evtIDs){
            this.hasStarted[i] = true
        }
     }
     
      //check map of end times(keys) to see if reached end of an event
     if(this.endTimesSet && this.endTimesSet.has(now.time)) { //not expensive? prolly ok for only endTimes and using key lookup
        //console.log("should got a notif?...",now.time)
        this.enableEditScore(now.time)
        this.doNotify(`WOOO at end of a scheduled event ${now.time}`, "positive")
     }else {
        //check that all events can have their score updated(would mean nothing else to do?)> enable the saving btn for saving the schedule
        if (!this.hasUncompletedEvents()){ 
            //so if any of them are still true >> nothing to do...otherwise 
            if (!this.disableSaveSchedule){return} //not show the notification every minute quand meme!

            this.doNotify(`WOOOHOO finished all events`,"positive")
            this.disableSaveSchedule = false
        }
     }
    },
    hasUncompletedEvents(){
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
    badgeClasses (event, type) {
      const isHeader = type === 'header'
      return {
        [ `text-white bg-${ event.bgcolor.toLocaleLowerCase() }` ]: true, //adding toLocaleLowerCase() to account for colors with uppercased first letter
        'full-width': !isHeader && (!event.side || event.side === 'full'),
        'left-side': !isHeader && event.side === 'left',
        'right-side': !isHeader && event.side === 'right',
        'rounded-border': true
      }
    },
    badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
      const s = {}
      if (timeStartPos && timeDurationHeight) {
        s.top = timeStartPos(event.time) + 'px'
        s.height = timeDurationHeight(event.duration) + 'px'
      }
      s[ 'align-items' ] = 'flex-start'
      return s
    },
    getAnEvent(id){
        for(let i = 0; i< this.events.length;i++){
            if (this.events[i].id === id) return this.events[i]
        }
        return null
    },
    addAnEvent(toAdd){
        console.log("oooh addAnEvent..ORIG",toAdd, this.currentDate) //make sure for currentDate
        //let e = {...toAdd, date: today()} //would this work? seems so..but date already present?
        
        //let d = today()
        //toAdd.date = d

        let e = this.addPropsEventsTo(this.currentDate, [toAdd])

        //console.log("addAnEvent..after",e[0], toAdd) //normally the same 

        this.events.push(toAdd) //should push e[0]
        let startTime = addToDate(parsed(toAdd.date), { minute: parseTime(toAdd.time) })
        let endTime = addToDate(startTime, { minute: toAdd.duration })

        this.dailyScheduled.set(toAdd.id, {
                start: startTime,
                end: endTime,
                on: toAdd.date,
                originalAt: toAdd.time,
                for: toAdd.duration,
                score:toAdd.score
            })
        
        this.endTimesSet.add(endTime.time)
        this.startTimesSet.add(startTime.time)

    },
    updateCurrentSchedule() { //update current schedule
      const mappy = new Map()

      let endTimes = new Set() //[]
      const now = parseDate(new Date())

      let sameTime = new Set()
      let startTimes = new Set()
    
      this.events.forEach(event => {
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

          //better to keep it here methink? >>meh unsightly but passing in the now so that it doesnt change during iteration...  
          this.canEnableEditScore(event.id, endTime, now)
          /*let diffy = diffTimestamp(now, endTime) //endTimes < now would be that evt hasnt ended!
          if(diffy > 0){//auto-enable for already completed events here by comparing with currentTime
            //console.log("diffy positive so evt has NOT ended",diffy, event.id)
            this.disabledScoreEvts[event.id] = true //for enabling score edit after end of event!
          }else {
            //console.log("saveCurrentSchedule evt has ended",diffy, event.id)
            this.disabledScoreEvts[event.id] = false //default is false prolly
          }*/

          this.enableEndNowBtn(event.id,startTime, endTime)
          //if (isBetweenDates(now, startTime, endTime, true)){ //to show the endNow button--toREview
          //  this.hasStarted[event.id] = true
          //}
        })

        this.dailyScheduled = mappy 

        this.endTimesSet = endTimes
        this.startTimesSet = startTimes
        
        console.log("done updateCurrentSchedule", startTimes, sameTime) 
        //,this.dailyScheduled, this.events, typeof this.endTimesSet)

        return sameTime

    },
    canEnableEditScore(evtID, endTime, useNow = null){  //should also set the show EndNow button here--todo**
        const now = useNow ? useNow : parseDate(new Date())
        let diffy = diffTimestamp(now, endTime) //endTimes < now would be that evt hasnt ended!
        //console.log(`canEnableEditScore for ${evtID}`,diffy)
        if(diffy > 0){//auto-enable for already completed events here by comparing with currentTime
            //console.log("diffy positive so evt has NOT ended",diffy, evtID)
            this.disabledScoreEvts[evtID] = true   //disable scoreEdit
        }else {
            //console.log("diffy negative so evt has ended",diffy,evtID)
            this.disabledScoreEvts[evtID] = false //enable score edit after end of event!
            this.hasStarted[evtID] = false  //umm bon hide when button when past as well
        }

    },
    enableEndNowBtn(evtID,starty, endy){//to show/hide the endNow button
      const now = parseDate(new Date())
      if (isBetweenDates(now, starty, endy, true)){ 
        this.hasStarted[evtID] = true
      }//else{
        //this.hasStarted[evtID] = false
      //}
    },
    // get all events for the specified date--use scheduleMap instead...prolly**
    getEvents (dt) {
      const events = this.eventsMap[ dt ] || []
      if (events.length === 1) {
        events[ 0 ].side = 'full'
        
      }
      else if (events.length === 2) {
        console.log("daEvents...LENGTH is 2?",events) //umm never gets here...huh
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

      console.log("overlapOtherEvent...targetTimes",targetStartAt.time,targetEndsAt.time)
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
              console.log(`${key} overlapOtherEvent added`, isTwix,totalOverlap)
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
             //umm should keep same time interval between the two events?!? meh but to explore latee**
                    
            
            let anyOtherOverlap = this.overlapOtherEvent(overlappingEvtID, overlappedEvtNew, overlappedEvt.for) //overlappingEvts[i]
            if(anyOtherOverlap.length > 0) {
                console.log("WARNING...more overlaps",anyOtherOverlap, overlappedEvtNew.time)
                
                let i = 0
                let sizey = anyOtherOverlap.length
                let draggy = this.getAnEvent(overlappingEvtID)
                
                do {
                    console.log("CASCADE recurChangeTime:",anyOtherOverlap[i], overlappedEvtNew.time, draggy.title)
                    this.recurChangeTime(anyOtherOverlap[i], draggy, overlappedEvtNew, goForward)        
                } while (++i < sizey)
            }
                    
            let [change, work] = this.changeEvtSchedule(overlappingEvtID, overlappedEvtNew)
            console.log("overlappedEvtNew..",change,work, overlappingEvtID, overlappedEvtNew)


            //umm targetDrop should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
            let draggedNewTime = dragDirection > 0 ? addToDate(targetTimestamp, { minute: 0 })
                                                    : addToDate(targetTimestamp, { minute: 0 }) 
                    
            let [changed, worked] = this.changeEvtSchedule(tEvt.id, draggedNewTime)
            
            console.log("recurChangeTime complete",changed, worked, tEvt.id, draggedNewTime)

        }else{console.log("ERROR overlapped event not found!", overlappingEvtID)}

    },
    changeEvtSchedule(evtID, timey){
        let changed = this.changeEventTime(evtID, timey)

        let worked = this.updateScheduleMaps(evtID, timey)
        
        return [changed, worked] //works when using array
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
    retrieveSameEnd(timey){ //to retrieve same endTimes
        let retVal = []
        for (let [entry, val] of this.dailyScheduled) {
            if (val.end.time == timey){
                console.log("retrieveSameEnd...FOUND", entry, val)
                retVal.push(entry) //bon no need for object {}...toREview if ID arent enough smh
            }
        }
        return retVal
    },
    enableEditScore(timeEnd) { //enables the editing of score after event has passed.
        //search for corresponding eventID and enable that one only //this.disabledScoreEvts[0] = false
        
        let evtIDs = this.retrieveSameEnd(timeEnd)
        console.log("enableEditScore...FOUND", evtIDs) //shouldnt be multiple but 'could'
        for (let i of evtIDs){
            this.disabledScoreEvts[i] = false
        }

        /* //oldie that was ok...
        for (let [entry, val] of this.dailyScheduled) { //allEvents
            //console.log("changeEditScore", entry, val)
            if (val.end.time == timeEnd){
                console.log("changeEditScore...FOUND", entry, val)
                this.disabledScoreEvts[entry] = false
            }
        }*/
    },
    updateScheduleMaps(evID, timeyStart){
        if(this.dailyScheduled.has(evID)){
            let evt = this.dailyScheduled.get(evID)
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
            }else{console.log("updateScheduleMaps-endTimesSet NOT FOUND?!?")} //this could happen? ToTest

            let hadStart = this.startTimesSet.delete(oldStart.time)
            if (hadStart){
                this.startTimesSet.add(timeyStart.time) 
            }else{console.log("updateScheduleMaps-startTimesSet NOT FOUND?!?")} //this could happen? ToTest

            this.canEnableEditScore(evID,newEndy)
            this.enableEndNowBtn(evID, timeyStart, newEndy)

            return true
        }else{
            console.log("updateScheduleMaps--euh not found?ERROR?",evID, timeyStart) 
            return false 
        }  
        
    },
    changeEventTime(evID, timeyStart) {
        console.log("changeEventTime",evID, timeyStart.time)
        for(let i = 0; i < this.events.length; i++) {
            let obj = this.events[i] //will changes stick ahubwo?!? seems so...but break doesnt return true? or seems to be evaluated earlier than dialog close?!?
            if (obj.id === evID){
                if (!obj.canMove){ //ask move un-movable
                  this.$q.dialog({
                    title: 'Alert',
                    cancel: true, //to have cancel button
                    // position: 'bottom',
                    message: `Move evt: ${obj.title} around to ${timeyStart.time}?`
                  }).onOk(() => {
                    obj.time = timeyStart.time
                  }).onCancel(() => {
                    this.doNotify(`${obj.title} Cancelled moving ...`)
                  })//.onDismiss(() => {
                            // console.log('I am triggered on both OK and Cancel')
                        //})
                    //break
                } else {
                  obj.time = timeyStart.time //do change to new time
                  
                  //ask if should be default...too much asking when it could be just for today? toREview
                  this.$q.dialog({
                    title: 'Alert',
                    cancel: "No", //huh can also use string for labelling! sweet!
                    // position: 'bottom',
                    message: `Make ${timeyStart.time} the default time for ${obj.title} ?`
                  }).onOk(() => {
                    //obj.time = timeyStart.time
                    this.store.saveSubProp(evID, timeyStart.time, null)
                  }).onCancel(() => {
                    //this.doNotify(`${obj.title} Cancelled moving ...`)
                    console.log("Nope cool, coolios")
                  })
                }
                return true //here work? yup
            }
        }
        return false 
    },
    doRemove (item) { //also should just remove it from the current schedule...NOT delete it completely!!
      let currentSize = this.events.length
      for( var i = 0; i < currentSize; i++){ 
            if ( this.events[i].id === item.id) { 
                this.events.splice(i, 1)
                console.log("removed event spliced!", item.title)

                if(this.dailyScheduled.has(item.id)){
                    this.dailyScheduled.delete(item.id)
                    //this.startEndMap.delete(item.id)
                }else{console.log("ERROR doRemove has no such item?@? ", item)}

                return //important to return esti
            }
      }
    },
    reset() { //reset variable for next use 
      this.draggedItem = null
      this.targetDrop = null
      //
      this.toAddE = null
      this.chosenScore = null
    },
    doNotify(messg, colorNotif = undefined, position = 'top'){
      this.$q.notify({ // also see about using >> this.$q.dialog
                        color: colorNotif !== undefined ? colorNotif : 'negative', //colorNotif,//'negative',
                        position: position, //see using 'bottom'
                        message: messg,
                        icon: colorNotif == undefined ? 'report_problem' : 'thumb_up' //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
                    })
    },
    updateButtons(reloadBool=null,defaultBool=null, scheduleBool=null){ 
      //if (reloadBool != null) {
        this.reloadSaved = reloadBool != null ? reloadBool : this.reloadSaved
      //}
      //if (defaultBool != null) { //sheesh dont check for falsy vals holmes!!
        this.loadDefault = defaultBool != null ? defaultBool : this.loadDefault
      //}
      //if (scheduleBool != null) {
        this.doSchedule = scheduleBool != null ? scheduleBool : this.doSchedule
      //}
    },
    fetchEventsForDate(aDate) { //toReview and use

      let evts = this.store.getEventsForDate(aDate) //this.deepCopy ?

      if (!evts) {console.log(`ERROR no evts found for ${aDate}...`, evts); return}
    
      let e = this.deepCopy(this.storedEvents)
      let toReload = []

      e.forEach((obj) => {
        let sav = evts[obj.id]
        if (sav){
          obj.date = aDate,//oldie >> sav.date, hopefully good?
          obj.time = sav.time, //save.time is what it was changed to...
          obj.duration = sav.duration, //umm just in case..but redundant
          //obj.score = sav.atScore

          toReload.push(obj)
        } //else{console.log(`Evt: ${obj.title} wasnt present!`)} 
      })


      toReload = this.addPropsEventsTo(null, toReload)

      this.events = toReload //[...toReload]

      this.updateCurrentSchedule()

    },
    /////////////////////////////// EVENT HANDLERS //////////////////////////
    onRefresh(done) {  //test to drag for refresh
        setTimeout(() => {
          this.loadSavedEvents(this.currentDate) //, false
          console.log('Refreshing...', this.currentDate)
          done()
        }, 1000)
    },
    doSaveSchedule() { //save the current schedule into localStorage
        console.log("doSaveSchedule for", this.currentDate)
        //const toSave = []
        const toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
        //if (!map[ event.date ]) {  
        //    map[ event.date ] = []   //toUse
        //}

        this.dailyScheduled.forEach( (value, key, map) => {
            toSave[key] = {  //minimalistic
                //id: key,
                //date: value.on, //redundant
                duration: value.for,
                time: value.start.time, //should be present and got the current (perhaps changed) timestart...add guardrail though to set to default originalAt?**Tbd
                //originalAt: value.originalAt,
                //atScore: value.score
              }
          })
    
        //minimum to save instead of duplicate stuff
            //oh id to link it afterwards
            //date(on)
            //time, >actual start(not original)
            //duration(in case changes prolly)
            //score?maybe
       this.store.saveDailySchedule(this.currentDate, toSave) 
       this.disableSaveSchedule = true 

       this.doNotify(`doSaveSchedule for ${this.currentDate}`, "positive", "top")
    },
    onAddEvent() {
      //console.log('I be adding', this.toAddE, this.targetDrop)
      
      this.showEventDialog = false

      //if no prob ask whether to keep this time going forward? ToSee later

      this.draggedItem = this.toAddE

      let addy = this.getAnEvent(this.toAddE.id)
      if (!addy){
        console.log("onAddEvent...NEW", addy, this.toAddE)
        addy = this.toAddE
        this.addAnEvent(this.toAddE)  // add it with default and then continue...
      }

      let anyOverlap = this.overlapOtherEvent(addy.id, this.targetDrop.timestamp, addy.duration)

      console.log("AddEvent anyOverlap", anyOverlap)
      let sizey = anyOverlap.length
      if(sizey > 0) {
        let i = 0
    
        do {
            this.recurChangeTime(anyOverlap[i],addy, this.targetDrop.timestamp, true)
        } while (++i < sizey)

      } else {
        
        //so already there...just change it
        if(this.dailyScheduled.has(addy.id)){
            let [changed, worked] = this.changeEvtSchedule(addy.id, this.targetDrop.timestamp) //this.toAddE
            console.log("AddEvent that was there complete",changed, worked,addy.id) //this.toAddE.id
        } else { 
            //not there...add new event to schedule--Should not get here!!
            console.log('ERROR ERROR NEW event with current events as:', this.events) //should NOT get here now**

        }
       
        //console.log("onAddEvent...got added eh", this.toAddE)
      }
      
      this.disableSaveSchedule = false //for saving schedule on change for this day...
      this.updateButtons(null, true, true)
      
      this.reset()
    },
    onPickConflictReso(pick, conflicts){// keep only pick, removing the others...
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

          console.log(`Great, REDUCING duration to:`, o, anotherDiff)
          for(let i = 0; i < this.events.length; i++) { //use filter here instead prolly--toImprove
            let obj = this.events[i]
            if (obj.id === evtID){
              obj.duration = anotherDiff
            }
          }
          this.dailyScheduled.set(evtID, {...evt, for:anotherDiff, end:now})
          
          this.endTimesSet.delete(endy.time) //make sure? tbd**

          this.endTimesSet.add(now.time) //also update this

        }else{
          console.log(`umm aint in the middle of this event! Nothing to do...`,now.time, starty.time, endy.time)
        }
      } else {
        console.log(`ERROR doEndNow not found!!!`, evtID)
        return
      }

      this.disabledScoreEvts[evtID] = false  //bon just allow this au moins as could just be updating score? tbd

    },
    onSaveScore(newVal, id){
      
      let ev = this.dailyScheduled.get(id)
      if (ev){
        console.log(`oooh onSaveScore from ${ev.score} to ${newVal}`, id)
        ev.score = newVal
        this.store.saveSubProp(id, null, newVal)  //should just send whole event?
      }else {
        console.log(`ERROR could not find event ${id}?!?`) //this would be baaad! 
      }
    },
    onDragStart(e, item) { 
        console.log("onDragStart", e, item) //.clientY to determine if going up or down? >>meh no need
        
        //save the moved item
        this.draggedItem = item
    },
    onDragEnter (e, type, scope) {
      //console.log('insideDragEnter',e.preventDefault) // e,type,scope
      if(type === 'goal-item'){
        console.log('onDragEnter..goal-item',e, scope) // scope is undefined here hence saving it below
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
      console.log('onDragEnd', this.endTimesSet, this.startTimesSet) // this.events,this.dailyScheduled,
    },
    onDrop(e, type, scope) { //other drag functions above need for this to fire >>especially 'onDragOver' above
        console.log("onDrop", e, type, scope)//JSON.stringify(item)
        let draggy = this.getAnEvent(this.draggedItem.id) //bon grab whole event..

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
        } else { //so no overlapp, just change dragged event time
            //oldie >> this.draggedItem.time = scope.timestamp.time
            //draggy.time = targetTimey.time  //this works...no need to put in function mais bon 

            let [changed, worked] = this.changeEvtSchedule(draggy.id, targetTimey) //this.draggedItem
            console.log("onDrop no overlap complete",changed, worked, draggy.id) //this.draggedItem
            
        }
        this.disableSaveSchedule = false //save schedule?

        this.reset()

        this.updateButtons(null, true, null)
        
    },
    onDblClickEvent(e, event) {
       //console.log("double click eh...", e, event)
       this.$q.dialog({
        title: 'Alert',
        cancel: true,
       // position: 'bottom',
        message: `Sure to remove evt: ${event.title} from today?`
          }).onOk(() => {
             this.doRemove(event)
             this.updateCurrentSchedule() // gotta do it here or it runs before...
             this.updateButtons(null, true, null)
             this.disableSaveSchedule = false //save schedule?
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

      //so here propose selection to add an event to the schedule
      //...dialog box to select from all subgoals
       this.showEventDialog = true
        
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
    onMouseUpTime ({ scope, event }) { 
      //this actually unfurl(destructure) the data parameter in two with those {}
      //can also further destructure keeping only needed variables with { scope: { timestamp } }

        console.log('onMouseUpTime', { scope, event })
        if (this.mobile !== true && isLeftClick(event)) {
            // mouse is up, capture last and cancel selection
            this.otherTimestamp = scope.timestamp
            this.mouseDown = false
        }

      /*if(!this.mousedown) { // test to see if can trigger a dialog--react on every mouse up though
        this.$q.dialog({
        title: 'Alert',
        message: 'Some message'
          }).onOk(() => {
             console.log('OK')
          }).onCancel(() => {
             console.log('Cancel')
          }).onDismiss(() => {
             console.log('I am triggered on both OK and Cancel')
          })
      }*/
      if(!this.mousedown) {
        let rangey = this.startEndTimes
        console.log('onMouseUpTime range', rangey)
        //so when range of selected time is different >> bring up dialog to add a subgoal** 
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
      this.$refs.calendar.moveToToday()
    },
    onPrev () {
      //console.log('onPrev', this.currentDate)
      this.doReset = true
      this.$refs.calendar.prev()
    },
    onNext () {
      this.$refs.calendar.next()
    },
    onChange (data) { //runs first after loading/reload > right after beforeMount() and before mounted()

      //console.log('onChange', data, this.currentDate) // JSON.stringify(data)
      
      let inDates = this.store.hasEventsForDate(this.currentDate)

      let isToday = today()

      //console.log('onChange', data, this.currentDate, isToday, inDates)
      if (data.start == this.currentDate && this.currentDate == isToday){
        console.log('onChange and all dates are ALIKE!')

        this.events = this.addPropsEventsTo(data.start,this.doReset ? this.returnNewEvts(true) : this.events)

        this.doReset = false //reset flag
      } else{
        console.log('onChange..something is different?', data.start, this.currentDate, isToday, inDates)
        
        this.events = this.addPropsEventsTo(this.currentDate, this.returnNewEvts(true))

        this.disableSaveSchedule = true //reset saveSchedule button

      }
      let e = this.updateCurrentSchedule()
      if (e.size > 0){
        console.log('onChange..has some conflicts', e)
        if (inDates){//in case not needed after reload...
            //let b = 
            this.onReloadSaved(e) //bon have to pass in the conflicts so can trigger the resolve in case of cancel smh..toREview**
        } else{
            this.fixConflicts(e) //choose score or priority dialog
        } 
        
      } else if (inDates){
        console.log('onChange and has saved DateEvts!!CHANGE?')
        //this.onReloadSaved() //bon bypassing this cause of dialog smh--toReview **
        this.fetchEventsForDate(this.currentDate)
        this.updateButtons(false,true,false)
        this.doNotify("Saved schedule Loaded", "info")
        this.reset()
        return
      }
       //else{
        //this.updateButtons(inDates,!inDates,!inDates) //toReview for the last flag--
      //}
      //let f = {at:"11:30",id: 2}
      //if (e.has(f)) { console.log('onChange..HASIT')} //bon cant check with object...weakSet?>>neither!

      this.updateButtons(inDates,!inDates,!inDates) //toReview for the last flag--
      
      //if (inDates){
      //  console.log('onChange and has saved DateEvts!!CHANGE?')
      //} else {
        //console.log('onChange NO saved evts', inDates)
      //}
    },
    fixConflicts(conflicts){ //walk through conflict and resolve by scheduling higher priority evts..choose higher priority or use score...alert too!

        const findhigherPrio = allEvts => { //or find the parent's priority here? toReview
            //return this.retrieveSameStart(starty) 
            let highest = 0
            let toRet = null
            for (let evt of allEvts) {
                let one = this.getAnEvent(evt)
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
        let parseScore = function(t){ //parses score and returns the difference btween the interval
            const tokens = t.split(/on/)
            if (tokens.length != 2) {//should be at most two variables....
                console.log(`parseScore error?${t}`, tokens)
                return -1
            }
            //console.log(`parseScore for ${t}`, tokens)
            return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!**to add guardrails...
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
                let one = this.getAnEvent(id)
                if (one){
                    conflictEvts.push(one)
                    label += one.title +','
                }else{console.log("fixConflicts...ERROR not found?", id)}
            }
            
            //let parsey = findhigherPrio(cIDs)

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
                    { label: 'Resolve by lowest Score', value: 'opt2' },
                    { label: 'Pick event', value: 'opt3' }
                ]},
                }).onOk((data) => {
                    if (data =='opt3'){//show another dialog to pick event...hopefully show? or use v-for with buttons? >>seems to show!
                        //const newArr = conflictEvts.map(mapToLabels)
                        this.$q.dialog({ //maybe ask user
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
                                let one = this.getAnEvent(data)
                                if(one){
                                    pick = one //proper? //s.push(data)
                                }else{console.log('ERROR...Manually choice not find', data)}
                            }).onCancel(() => {
                                console.log('Cancelled loading...') //shouldnt get here as persistent
                            }).onDismiss(() => {
                                console.log('oooh dismissed inner...', pick) 
                                this.onPickConflictReso(pick, conflictEvts)
                            })
                             //bon saveSchedule at end...prolly to not edit while we could still iterate over it!
                            let f = this.updateCurrentSchedule() // to refresh times...prolly check return of fixConflicts? toReview
                            console.log('fixConflicts inner...after conflicts?', f)
                            this.updateButtons(null, true, null)
                            this.disableSaveSchedule = false //enable save schedule
                    } else if (data =='opt2'){ //invoke parseScore and pick lowest score(huh semantic diff here as it's actually the one with the highest diff of score range!--**BEWARE )
                        console.log('>>>> OK, Option Score', data)
                        
                        let lowScore = 0
                        let current = null
                        for (let e of conflictEvts) {
                            let daScore = parseScore(e.score)
                            if (daScore > -1 && daScore >= lowScore) {
                                lowScore = daScore
                                current = e//e.id
                            }else{console.log('ERROR...parseScore?',daScore, e)}
                        }
                        if (current){
                            console.log('Option Score Chosen', current)
                            pick = current //could prolly forgo this...//.push(current.id) //?
                        }//else?
                    } else{ // >>opt1 >> invoke findhigherPrio 
                        pick = findhigherPrio(cIDs)
                        console.log('>>>> OK, Higher prio', data, pick)
                    }

                    console.log("Pick be", pick) ////for inner dialog this is empty...
                }).onCancel(() => {
                    console.log('Cancelled loading...') //shouldnt get here!!!?
                }).onDismiss(() => {
                    console.log('Dismissing...', pick) //for inner dialog this is empty...
                    if (pick) {
                        this.onPickConflictReso(pick, conflictEvts)
                        let f = this.updateCurrentSchedule() // to refresh endTimes
                        console.log('fixConflicts outer...after conflicts?', f) //just check...
                        this.updateButtons(null, true, null)
                        this.disableSaveSchedule = false //enable save schedule
                    }
                })
        
        }
        return true //should return false in error? tbd**
        
    },
    onReloadSaved(conflicts = null){ //toReview if not redundant**
      console.log('doReloadSaved:',this.currentDate) //toTest it's the current viewed day***

      //oldie >> this.askUser(this.currentDate) 
      this.$q.dialog({ //maybe ask user
        title: 'Alert',
        cancel: true,
       // position: 'bottom',
        message: 'Some saved schedule found, load it up?'
          }).onOk(() => {
            //this.loadSavedEvents(this.currentDate, true) //data.start
            this.fetchEventsForDate(this.currentDate)
            this.updateButtons(false,true,false)
            this.reset()
            return true
          }).onCancel(() => {
             console.log('Cancelled loading...')
             //no need for below invocations!!
             //this.addPropsEventsTo(this.currentDate, this.events)
             //this.setEvtsToDate(this.currentDate) //, false
             if (conflicts){
                console.log('dont wanna reload eh..fix conflicts then', conflicts)
                this.fixConflicts(conflicts)
             }
             this.updateButtons(true,false,true)
             return false
             
          })//.onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          //})
      
        //this.chosenScore = null //here >>nah invoke reset() above
    },
    onLoadDefault(){
      //console.log('doLoadDefault:',this.currentDate,this.events)
      this.events = null
      
      console.log('doLoadDefault:',this.currentDate) //,this.events, this.allEvents

      //let e = this.deepCopy(this.storedEvents) //see if resets reference >>does!
      //e = this.addPropsEventsTo(this.currentDate, e)

      this.events = this.addPropsEventsTo(this.currentDate, this.returnNewEvts(true))

      //this.events = e //[...e] 
      
      this.updateCurrentSchedule() //should also check conflicts here...todo**

      let inDates = this.store.hasEventsForDate(this.currentDate)

      this.updateButtons(inDates,false,true)
      this.disableSaveSchedule = true //reset saveSchedule button

      this.chosenScore = null 

    },
    onReloadWithScore(){
      
      if (this.chosenScore == null) {
        this.doNotify("Ayo select a score!")
        return
      }

      let e = this.store.fetchGoalsWithMinScore(this.chosenScore) //deepCopy? tbd**

      console.log('bringScorey:', this.currentDate,this.chosenScore, e)

      e = this.addPropsEventsTo(this.currentDate, e)

      this.events = e//[...e]

      this.updateCurrentSchedule() //should also check conflicts here...todo**

      this.updateButtons(false,true,true)

      this.disableSaveSchedule = false

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
</style>