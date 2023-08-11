<template>
   <div v-if="showForm" class="q-gutter-md">
    <add-goal-form /> 
  </div> 

  <div v-if="!showForm" class="subcontent">
    <navigation-bar
      @today="onToday"
      @prev="onPrev"
      @next="onNext"
    />
    <div class="float-right"> <!--to do proper placing on the right-->
        <div v-if="reloadSaved">         
            <q-btn
              class="q-mt-xl"
              color=""
              text-color="green"
              elevated
              label="Load Saved"
              @click="doReloadSaved"
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
            @click="doLoadDefault"
            no-caps
          />
        </div>
        <div v-if="doSchedule"> <!--this could be a dropdown with a few choices of scheduling logic Todo properly**-->
          <q-btn
            class="q-mt-xl"
            color=""
            text-color="teal"
            elevated
            label="Schedule"
            @click="showGoalForm = !showGoalForm"
            no-caps
          />
        </div>
    </div>
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
                <div class="title q-calendar__ellipsis">
                  {{ event.title }}
                  <q-tooltip>{{ event.time + ' - ' + event.details + ' :'+ event.score }}</q-tooltip>
                  <!-- meh interfere with dhouble click for removing...Tosee if can enable it later somehow... -->
                  <!--auto-save needed but should find way to capture this as well as user could click outside popup without saving!-->
                  <q-popup-edit v-model="event.score" auto-save v-slot="scope" :disable="disabledScoreEvts[event.id]" @save="(e)=>saveScore(e,event.id)">
                    <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set" /> <!--counter and keyup.enter has to be scope.set or doesnt do anything nor trigger the saveScore() smh...-->
                  </q-popup-edit>
                  
                  <!--<goal-item
                    :modelValue="true"
                    :title="event.title"
                    :time="event.time"
                    :details="event.details"
                    /> 
                    -->
                </div>
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
          <div >
            <q-select
            v-model="toAddE" 
            :options="storedEvents"             
            option-value="id"
            option-label="title"
            label="Sub Goal"
            class="q-pa-sm event-select"
            /><!--bon todo** align items inside to be better viewed-->
          </div>
          <q-separator />
          <q-card-actions align="right">
            <q-btn flat label="Add" color="primary" @click="AddEvent"/>
          </q-card-actions>         
        </q-card>
      </q-dialog>
    
    </div>
    <br><!-- in store.getSubGoals ...oldie >> storedEvents but allEvents also accessible when not returned? -->
    <div class="scroll overflow-auto" style="height: 360px; width: 100%;">
        <div v-for="(event, index) in events" :key="index" class="col-12" style="font-size: 10px; line-height: 10px; max-height: 14px; min-height: 14px; padding: 2px 2px; white-space: nowrap;">
          {{ event }}
        </div>
    </div>
  </div>
  <div class="row justify-center" style="padding:60px;">
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
import aGoalTest from '../../components/planner/aGoalTest.vue'
import { useGoalStore } from 'stores/goalStorage'
import { useQuasar } from 'quasar'

function isLeftClick (e) {
  return e.button === 0
}

//umm try to move other function here as the above --Todo

export default defineComponent({
  name: 'daySchedule',
  components: {
    NavigationBar,
    QCalendarDay,
    addGoalForm,
    //goalDialog
  },

  data () {
    const draggedItem = ref(null)
    const targetDrop = ref(null) 
    //const currentDate = ref(null)
    const currentTime = ref(null)

    const endTimesSet = ref(null) //set of end times for scheduled events for lookup when adjusting time!
    
    const allEvents = ref(null)  //bring up all subgoals from storage by default
    const dailyScheduled = ref(null) //shall be the daily scheduled and be source of truth for currently viewed day--toUse**

    const $q = useQuasar()
    let intervalId = null

    return {
      currentDate: ref(today()),
      //nowDate: ref(this.currentDate), //addToDate(parseTimestamp(today()), { day: 1 }).date 
      events: [],
      calendar: ref(null), //umm wasnt here...any diff? with moving and update now? >>nope
      store:useGoalStore(),

      anchorTimestamp: ref(null), //start time for range
      otherTimestamp: ref(null),   //end time for range...
      mouseDown: ref(false),
      mobile: ref(true),
      //intervalId:ref(null), ////for showing current time >>nope
      timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update

      showGoalForm: ref(false), //showing addGoal form
      showEventDialog:ref(false),
      toAddE:ref(null),
      disabledScoreEvts:ref({}),

      disableSaveSchedule:ref(true),
      //skipReload:ref(false),  //not used
      reloadSaved:ref(false), //when date has saved events that are not default
      loadDefault:ref(true), //reload default events...
      doSchedule:ref(false), //toReview usage..should be for schedule from a particular logic...
    }
  },
  beforeMount() {
    let e = this.loadGoals
    //console.log('After loadGoals', e)

    this.mobile = isMobile()  //--for drag for range selection.
   
    this.events =  [...e] //does update!

    //this.saveCurrentSchedule() //bon seem doesnt like putting this in loadGoals as it's computed! same way cant assignt events from loadGoals smh
    
    //this.skipReload = true //for the onChange....but nope
    
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
    showForm() {return this.showGoalForm},
    doDisableSaveSchedule(){ //umm was no need for this!?! smh but works well...maybe could do other calc here?
        return this.disableSaveSchedule 
    },

    // convert the events into a map of lists keyed by date
    eventsMap () {
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
    storedEvents(){
        let subGoals = JSON.parse(JSON.stringify(this.store.getSubGoals))

        //umm no massaging? TBD but maybe to add .date?!? 
        return subGoals
    },
    loadGoals() {
      //let subGoals = JSON.parse(JSON.stringify(this.store.getSubGoals)) //[...this.store.getSubGoals]
      //copy so that changes dont go back in storage... the JSON above seems to work at least
      //or use let arrCopy = Object.assign([], arr) //is also a 'shallow' copy smh

      return this.colisTest()
      /*let subGoals = this.storedEvents
      let pMap = this.parentGoalsMap

      if (!subGoals) { //|| !pMap
        //console.log("no goals to schedule...")
        this.doNotify("no goals to schedule...")
        return []
      }
     
      subGoals.forEach((obj) => {
        obj.date = null //oldie >>today() but better to null this and change in the onChange //"date": "2023-07-22"
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

      return subGoals */
  
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
    colisTest(d = null){
      let subGoals = this.storedEvents
      let pMap = this.parentGoalsMap

      if (!subGoals) { //|| !pMap
        //console.log("no goals to schedule...")
        this.doNotify("no goals to schedule...")
        return []
      }
     
      subGoals.forEach((obj) => {
        obj.date = d != null ? d : null //oldie >>today() but better to null this and change in the onChange //"date": "2023-07-22"
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

      console.log("colisTest", d, subGoals)  //colis can i get back original stuff?!? smh
      return subGoals

    },
    saveScore(newVal, id){
      
      let ev = this.allEvents.get(id)
      if (ev){
        console.log(`oooh saveScore from ${ev.score}`,newVal, id)
        ev.score = newVal
        this.disableSaveSchedule = false //to save schedule--toReview placing it here**
      }else {
        console.log(`ERROR could not find event ${id}?!?`) //this would be baaad! 
      }
    },
    //numeric date and time identifier for timestamp comparison
    getTimeNumber(timey) {
      if (timey !== null) {
        return getDayTimeIdentifier(timey)
      }
      return false
    },
    getAnEvent(id){
        for(let i = 0; i< this.events.length;i++){
            if (this.events[i].id === id) return this.events[i]
        }
        return null
    },
    addAnEvent(toAdd){
        console.log("oooh addAnEvent..ORIG",toAdd)
        let e = {...toAdd, date: today()} //would this work? seems so..but date already present?
        
        let d = today()
        toAdd.date = d

        console.log("addAnEvent..after",e, toAdd)

        this.events.push(toAdd)
        let startTime = addToDate(parsed(toAdd.date), { minute: parseTime(toAdd.time) })
        let endTime = addToDate(startTime, { minute: toAdd.duration })

        this.allEvents.set(toAdd.id, {
                start: startTime,
                end: endTime,
                on: toAdd.date,
                originalAt: toAdd.time,
                for: toAdd.duration,
                score:toAdd.score
            })
        
        this.endTimesSet.add(endTime.time)

    },
    //save 
    saveCurrentSchedule() {
      const mappy = new Map()
      //const startsEnds = new Map()
      let endTimes = new Set() //[]
      const now = parseDate(new Date())
    
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

          //this.disabledScoreEvts[event.id] = true  //uncomment when doing drag/drop stuff

          let diffy = diffTimestamp(now, endTime) //endTimes < now would be that evt hasnt ended!
          if(diffy > 0){//auto-enable for already completed events here by comparing with currentTime
            //console.log("diffy positive so evt has NOT ended",diffy, event.id)
            this.disabledScoreEvts[event.id] = true //for enabling score edit after end of event!
          }//else {
           // console.log("diffy negative so evt has ended",diffy, event.id)
           // this.disabledScoreEvts[event.id] = true //default is false prolly
          //}
        })

        this.allEvents = mappy 

        this.endTimesSet = endTimes
        
        console.log("done saveCurrentSchedule") //,this.endTimesSet, this.allEvents, this.events

    },
    adjustCurrentTime() {
      const now = parseDate(new Date())

      //console.log("adjustin...", this.currentDate, now.date)
      if (this.currentDate !== now.date){  //caused a jump back to current day smh
        console.log("Not adjustin...", this.currentDate, now.date)
        this.timeStartPos = -10 //when null, doesnt change smh and 0 still shows...toMonitor if need to remove interval
        this.currentTime = ''
        return
      }
    
      this.currentDate = now.date 
      this.currentTime = now.time //'00:52'
      this.timeStartPos = this.$refs.calendar.timeStartPos(this.currentTime, false)  
      //the above dont update in view >>cause was not in return!!

      
      //could check map of end times(keys) to see if reached end of an event? 
        //--not expensive? maybe if save only endTimes?
     if(this.endTimesSet.has(now.time)) { //this.endTimesArray[now.time]
        //console.log("should got a notif?...",now.time)
        this.changeEditScore(now.time)
        this.doNotify(`WOOO at end of a scheduled event ${now.time}`, "positive")
     }//else {
      //  console.log("nothin...",this.endTimesSet)
     //}
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
    // get all events for the specified date--use scheduleMap instead...prolly**
    getEvents (dt) {
      const events = this.eventsMap[ dt ] || []
      if (events.length === 1) {
        events[ 0 ].side = 'full'
      }
      else if (events.length === 2) {
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
      //console.log("daEvents...",events)
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

      this.allEvents.forEach( (value, key, map) => {
        if (key == evID){ 
            console.log("skipping sameness overlapOtherEvent")//, evID, value //umm should not skip this in case it's ad-hoc? >>meh could get into infi loop so prolly not!
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
  
        let overlappedEvt = this.allEvents.get(overlappingEvtID)
        if (overlappedEvt){                
            console.log(`dragDirection...target>>${targetTimestamp.time}, oldie at`,tEvt, overlappedEvt)
            //direction of drag(up or down) >>either - or + 
            let dragDirection = parseTime(targetTimestamp.time) - parseTime(tEvt.time)
                   
            console.log(`dragDirection...${dragDirection > 0 ? "goign down": "going up"}`)

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
                console.log("WARNING...There ARE overlaps",anyOtherOverlap, overlappedEvtNew)
                
                let i = 0
                let sizey = anyOtherOverlap.length
                let draggy = this.getAnEvent(overlappingEvtID)
                
                do {
                    console.log("recurChangeTime for anyOtherOverlap",anyOtherOverlap[i], overlappedEvtNew, draggy)
                    this.recurChangeTime(anyOtherOverlap[i], draggy, overlappedEvtNew, goForward)            
                } while (++i < sizey)
            }
                    
            let [change, work] = this.changeEvtSchedule(overlappingEvtID, overlappedEvtNew)
            console.log("overlappedEvtNew..",change,work, overlappingEvtID, overlappedEvtNew)


            //umm targetDrop should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
            let draggedNewTime = dragDirection > 0 ? addToDate(targetTimestamp, { minute: 0 })
                                                    : addToDate(targetTimestamp, { minute: 0 }) 
                    
            let [changed, worked] = this.changeEvtSchedule(tEvt.id, draggedNewTime)
            
            //let worked = this.changeEventSchedule(tEvt.id, draggedNewTime)
            console.log("recurChangeTime complete",changed, worked, tEvt.id, draggedNewTime)

                    //let e = this.updateScheduleMaps(tEvt.id, draggedNewTime)
                    //if (!e) {console.log("umm ERROR updateScheduleMaps failed?",tEvt.id) }
                
        }else{console.log("ERROR overlapped event not found!", overlappingEvtID)}

        //}

    },
    changeEvtSchedule(evtID, timey){
        let changed = this.changeEventSchedule(evtID, timey)

        let worked = this.updateScheduleMaps(evtID, timey)
        
        return [changed, worked] //works when using array
    },
    changeEditScore(timeEnd) { //enables the editing of score after event has passed.
        //search for corresponding eventID and enable that one only //this.disabledScoreEvts[0] = false
        
        for (let [entry, val] of this.allEvents) {
            //console.log("changeEditScore", entry, val)
            if (val.end.time == timeEnd){
                console.log("changeEditScore...FOUND", entry, val)
                this.disabledScoreEvts[entry] = false //actually works!
            }
        }
    },
    updateScheduleMaps(evID, timeyStart){
        if(this.allEvents.has(evID)){
            let forsy = this.allEvents.get(evID).for
            let oAt = this.allEvents.get(evID).originalAt
            let oldEnd = this.allEvents.get(evID).end
            let newEndy = addToDate(timeyStart, { minute: forsy })
            let scorey = this.allEvents.get(evID).score
            this.allEvents.set(evID, {
                on: timeyStart.date,
                originalAt: oAt, //timeyStart.time, >>keep origin time
                for: forsy,
                start: timeyStart,
                end: newEndy,
                score: scorey  //gaah dont leave stuff or think they take the original value smh
            })

            let hadEnd = this.endTimesSet.delete(oldEnd.time)
            if (hadEnd){
                console.log(`endTimesSet removed and added for ${evID}`, oldEnd.time,newEndy.time)
                this.endTimesSet.add(newEndy.time) 
            }else{console.log("updateScheduleMaps-endTimesSet NOT FOUND?!?")} //this could happen? ToTest

            return true
        }else{
            console.log("updateScheduleMaps--euh not found?ERROR?",evID, timeyStart) 
            return false 
        }  
        
    },
    changeEventSchedule(evID, timeyStart) {
        //let worked = false
        for(let i = 0; i < this.events.length; i++) {
            let obj = this.events[i] //will changes stick ahubwo?!? seems so...but break doesnt return true? or seems to be evaluated earlier than dialog close?!?
            if (obj.id === evID){
                if (!obj.canMove){ //as for sure to move un-movable
                    this.$q.dialog({
                        title: 'Alert',
                        cancel: true, //to have cancel button
                    // position: 'bottom',
                        message: `Sure to move event ${obj.title} around?`
                        }).onOk(() => {
                            //console.log('changeEventSchedule Moviing')
                            obj.time = timeyStart.time
                            //return true
                            //worked = true
                        }).onCancel(() => {
                            //console.log('Cancelled Moviing')
                            this.doNotify(`${obj.title} Cancelled moving ...`)
                        })//.onDismiss(() => {
                            // console.log('I am triggered on both OK and Cancel')
                        //})
                    //break
                } else {
                    //do change to new time
                    obj.time = timeyStart.time
                    //console.log(`changeEventSchedule of ${evID}`, timeyStart)
                    //return true
                    //worked = true
                    //break
                }
                return true //here work? yup
            }
        }
        return false 
    },
    AddEvent() {
      console.log('I be adding', this.toAddE, this.targetDrop)
      
      this.showEventDialog = false

      //then add it to the map...after checking that it can be added...
      //-making sure it doesnt overlap with other stuff already
      //if it does..prolly .Notify
      //if no prob ask whether to keep this time going forward?

      this.draggedItem = this.toAddE

      let addy = this.getAnEvent(this.toAddE.id)
      if (!addy){
        console.log("AddEvent ERROR? or...new?", addy, this.toAddE); 
        addy = this.toAddE
        //bon have to add it and then continue...
        this.addAnEvent(this.toAddE)
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
        if(this.allEvents.has(addy.id)){
            let [changed, worked] = this.changeEvtSchedule(addy.id, this.targetDrop.timestamp) //this.toAddE
            console.log("AddEvent that was there complete",changed, worked,addy.id) //this.toAddE.id
        } else { 
            //not there...add new event to schedule--Should not get here!!
            console.log('NEW NEW event with current events as:', this.events) //should NOT get here now**

            //this.events.push({...this.toAddE, date: today()})

            //console.log('NEW events as now',this.events) // this.toAddE, 

            //this.saveCurrentSchedule() //see if works better?  >>seems so!
            
            /*let worked = this.changeEventSchedule(this.toAddE.id, this.targetDrop.timestamp)
            console.log("AddEvent NEW complete",worked, this.targetDrop.timestamp)

            let e = this.updateScheduleMaps(this.toAddE.id, this.targetDrop.timestamp)
            if (!e) {console.log("umm ERROR updateScheduleMaps failed?",this.toAddE.id) }
            */
        }
       
        console.log("AddEvent...got added eh", this.toAddE)
        this.disableSaveSchedule = false //for saving schedule on change for this day...
      }
      
      this.reset()
    },
    doSaveSchedule() { //save the current schedule into localStorage
        console.log("doSaveSchedule for", this.currentDate)
        //const toSave = []
        const toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
        //if (!map[ event.date ]) {  
        //    map[ event.date ] = []   //toUse
        //}

        this.allEvents.forEach( (value, key, map) => {
            toSave[key] = {  //also use push in case of multiple same subGoals--todo prolly!
                //id: key,
                date: value.on,
                duration: value.for,
                time: value.start.time, //hopefully this present and got the current (perhaps changed) timestart...add guardrail though to set to default originalAt?**Tbd
                originalAt: value.originalAt,
                atScore: value.score
            }
            /*toSave.push({
                id: key,
                date: value.on,
                duration: value.for,
                time: value.start.time //hopefully this present and got the current (perhaps changed) timestart...add guardrail though to set to default originalAt?**Tbd
                //score? that is updated?toSee** maybe do actually!
            })*/

        })
    
        //minimum to save instead of duplicate stuff
            //oh id to link it afterwards
            //date(on)
            //time, >actual start(not original)
            //duration(in case changes prolly)
            //score?maybe
       this.store.saveDailySchedule(this.currentDate, toSave) 
    },
    doRemove (item) { //also should just remove it from the current schedule...NOT delete it completely!!
      let currentSize = this.events.length
      for( var i = 0; i < currentSize; i++){ 
            if ( this.events[i].id === item.id) { 
                this.events.splice(i, 1)
                console.log("removed event spliced!", item)

                if(this.allEvents.has(item.id)){ // && this.startEndMap.has(item.id)
                    this.allEvents.delete(item.id)
                    //this.startEndMap.delete(item.id)
                }else{console.log("ERROR doRemove has no such item?@? ", item)}

                return //important to return esti
            }
      }
    },
    loadSavedEvents(date, wannaChange){ //loads a date saved events...or changes the current events to the passed date
        console.log(`loadSavedEvents for ${date}...`)

        if (wannaChange){
            let evts = this.store.getEventsForDate(date)
            if (!evts) {console.log(`ERROR no evts found for ${date}...`, evts); return}
            
            this.events.forEach((obj) => {
                let sav = evts[obj.id]
                if (sav){
                    obj.date = sav.date, //today()
                    //obj.originalAt =  obj.time, //umm but adding this property where it shouldnt!!
                    obj.time = sav.time, //save.time is what it was changed to...
                    obj.duration = sav.duration,
                    obj.score = sav.atScore

                }else{console.log('hasDateEvts NOT found?!?', obj.id)} //shouldnt happen?!?
            }) 
        }else {
            this.events.forEach((obj) => {
                obj.date = date //data.start //today()
            })
        }
        this.saveCurrentSchedule() //refresh schedule still...prolly
    },
    reset() { //reset variable for next use 
      this.draggedItem = null
      this.targetDrop = null
      //
      this.toAddE = null //?!?
    },
    doNotify(messg, colorNotif = undefined){
      this.$q.notify({ // also see about using >> this.$q.dialog
                        color: colorNotif !== undefined ? colorNotif : 'negative', //colorNotif,//'negative',
                        position: 'top', //see using 'bottom'
                        message: messg,
                        icon: colorNotif == undefined ? 'report_problem' : 'thumb_up' //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
                    })
    },
    askUser(aDate){//maybe ask user
      this.$q.dialog({ 
        title: 'Alert',
        cancel: true,
       // position: 'bottom',
        message: 'Some saved schedule found, load it up?'
          }).onOk(() => {
            this.loadSavedEvents(aDate, true) //data.start
          }).onCancel(() => {
             console.log('Cancelled loading...')
             this.loadSavedEvents(aDate, false)
          })//.onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          //})
    },

    /////////////////////////////// EVENT HANDLERS //////////////////////////
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
      console.log('insideDragEnd',e) //check datatransfer for 'none' effect where no drop made
      /*e.currentTarget.style.opacity = '1.0'
      if (curChildEl) {
        curChildEl.classList.remove('drag-over-item')
      }
      if (curColEl) {
        curColEl.classList.remove('drag-over')
      }*/
      console.log('onDragEnd', this.allEvents, this.endTimesSet, this.events) //.values()
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
                console.log("Cannot drop here YO!!",e, type, scope, this.targetDrop) //shouldnt happen? could!
                return //just in case
            }
        }

        if (!targetTimey) {console.log("ERROR...no timestamp YO!!",e, type, scope, this.targetDrop); return}

        let anyOverlap = this.overlapOtherEvent(draggy.id, targetTimey, draggy.duration) //this.draggedItem
        let sizey = anyOverlap.length
        
        if(sizey > 0) {
            console.log("WOAH WOAH onDrop...normal move overlapp!", anyOverlap)
            let i = 0
            do {
                this.recurChangeTime(anyOverlap[i], draggy, targetTimey) //this.draggedItem
            } while (++i < sizey)
        } else { //so no overlapp, just change dragged event time
            //oldie >> this.draggedItem.time = scope.timestamp.time
            //draggy.time = targetTimey.time  //this works...no need to put in function mais bon 
            
            //also update maps
            //let w = this.updateScheduleMaps(draggy.id, targetTimey)
            //if (!w) {console.log("umm ERROR normal updateScheduleMaps failed?",this.draggedItem) }

            let [changed, worked] = this.changeEvtSchedule(draggy.id, targetTimey) //this.draggedItem
            console.log("onDrop no overlap complete",changed, worked, draggy.id) //this.draggedItem
            
            //this.store.saveNewGTime(this.draggedItem.id, this.draggedItem.time)  //should just send whole event?
        }
        this.disableSaveSchedule = false //save schedule?

        this.reset() //umm just reset....
        
    },
    onDblClickEvent(e, event) {
       console.log("double click eh...", e, event)
       this.$q.dialog({
        title: 'Alert',
        cancel: true,
       // position: 'bottom',
        message: 'Sure to remove event from today?'
          }).onOk(() => {
             this.doRemove(event)
             this.saveCurrentSchedule() // to refresh endTimes? gotta do it here or it runs before...
          }).onCancel(() => {
             console.log('Cancelled')
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
    onMouseMoveTime ({ scope, event }) {
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
      this.$refs.calendar.prev()
    },
    onNext () {
      this.$refs.calendar.next()
    },
    onChange (data) { //runs first after loading/reload > right after beforeMount() and before mounted()

      //console.log('onChange', data, this.currentDate) // JSON.stringify(data)
      
      //bof always at whichever day in calendar view--but shouldnt change but does automatically smh!

      //let [inDates, maybe] = this.store.hasEventsForDate(this.currentDate) //oldie
      let inDates = this.store.hasEventsForDate(this.currentDate)

      let isToday = today()

      //console.log('onChange', data, this.currentDate, isToday, inDates)
      if (data.start == this.currentDate && this.currentDate == isToday){
        console.log('onChange and all dates are alike!')

        this.loadSavedEvents(data.start, false) //bon just to have stuff on load...merge with else as it's same...todo**

      } else{
        console.log('onChange..something is different?', data, this.currentDate, isToday, inDates)
         //toReview though as doesnt actually reload defaults but just changes date for events already present***
         this.loadSavedEvents(data.start, false)

         this.updateButtons(false,null,true) //toSee--cannot load saved, default?, also choose a schedule prolly...

      }
      
      if (inDates){
        console.log('onChange and has saved DateEvts!!..should CHANGE!')
        //this.reloadSaved = true //show button to reload saved event
        this.updateButtons(true, true)

        //oldie >> this.askUser(data.start)

        //problem that below also changes the time to saved time when should still use old?
        //and adding originalAt would be bad
        
        /*if(wannaChange){
            this.events.forEach((obj) => {
                let sav = evts[obj.id]
                if (sav){
                    obj.date = sav.date, //today()
                    //obj.originalAt =  obj.time, //umm but adding this property where it shouldnt!!
                    obj.time =  obj.time,//sav.time, //save.time is what it was changed to...
                    obj.duration = sav.duration
                }else{console.log('hasDateEvts NOT found?!?', obj.id)} //shouldnt happen?!?
            })

            this.saveCurrentSchedule()
            return //to not keep going below....
        }else{console.log('Cancelled didnt wanna change :(')} */
 
      } else {
        console.log('onChange NO saved DateEvts', inDates)
        this.loadSavedEvents(data.start, false)

        this.updateButtons(false, true, true)

        //if(this.skipReload){
        //  console.log("umm onChange after onMoved?..skipping reload!")
        //  this.skipReload = false //reset though?!?toREview
        //  return
        //}

        //just change to new date..
        //toReview though as doesnt actually reload defaults but just changes date for events already present***
        //this.loadSavedEvents(data.start, false)

        //let e = this.loadGoals
        //this.events = [...e] //reload default...doesnt seem to update? >>yup as it assigns today's date smh
        //console.log("umm onChange...about to reload!")
        //this.saveCurrentSchedule()
      }

    //then have to also do the same thing as onMoved..
      //or replace this.events in case there is some events for this day?prolly when changing days...
      //def shouldnt do this again when it's viewing current day!!--mais bon have to...especially when moving back and forth between days!
      
      //this.events.forEach((obj) => {
      //  obj.date = data.start //today()
      //})

    },
    updateButtons(reloadBool=null,defaultBool=null, scheduleBool=null){ //omitting the first values would work?->gotta assign null!
      if (reloadBool != null) {
        this.reloadSaved = reloadBool
      }
      if (defaultBool != null) { //sheesh dont check for falsy vals holmes!!
        this.loadDefault = defaultBool  
      }
      if (scheduleBool != null) {
        this.doSchedule = scheduleBool
      }
    },
    doReloadSaved(){
      console.log('doReloadSaved:',this.currentDate) //toTest it's the current viewed day***

      this.askUser(this.currentDate) //no need for this here....toRemove later***
    },
    doLoadDefault(){
      console.log('doLoadDefault:',this.currentDate,this.events)
      this.events = null
      let e = this.colisTest(this.currentDate) //oldie >> this.loadGoals 
      this.events =  [...e]  //also this doesnt bring back the original time smdh...i.e: when clicked after a reload FML
      
      //console.log('doLoadDefault:',this.currentDate, this.events)
      
      this.loadSavedEvents(this.currentDate, false)  ////umm no point to pass currentDate above as changed here**toReview
      
      //this.saveCurrentSchedule()

      this.updateButtons(false,false,true)
    },

    //obsolete but kept for reference....tbd
    /*onMoved (data) { //bon removing this as redundant with onChange below!--ToMonitor and remove!--yup onChange is better!
      //console.log('onMoved to', data.date) //only here can access .date

      //runs after calendar's Next(), Prev()right before onChange() below when changing calendar days
      //doenst run for  today() tho?!? smh

      let isToday = today()

      //so check if current date is in storage
      let  inDates = this.store.hasEventsForDate(data.date)  //[inDates, maybe]
     

      console.log('onMoved to date', data.date,this.currentDate, isToday, inDates)

      this.disableSaveSchedule = true //should be?....prolly but toREview

      if (inDates){
        this.$q.dialog({ //maybe ask user, onCancel, just keep same order
            title: 'Alert',
            cancel: true,
        // position: 'bottom',
            message: 'Some saved schedule found, load it up?'
            }).onOk(() => {
                this.loadSavedEvents(data.date, true)
            }).onCancel(() => {
                console.log('Cancelled loading...')
                this.loadSavedEvents(data.date, false)
          })
          this.askUser(data.date)  //toBeware with the skipReload below!

          //this.skipReload = true //to not redo all this in onChange below
      }else { 
        console.log('onMoved NO DateEvts :(', inDates)
        //this.loadSavedEvents(data.date, false)

        if(this.skipReload){ //to not redo it...
          let e = this.loadGoals
          this.events = [...e] //reload default...could check date perhaps?
          this.saveCurrentSchedule()

          this.skipReload = false //**To see effect of this for below when moving between dates!
        }
      }
     
      //this.events.forEach((obj) => {
      //  obj.date = data.date //today()
      //})
    },*/
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