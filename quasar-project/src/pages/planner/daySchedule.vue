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

    <div class="row justify-center">
      <div style="display: flex; max-width: 800px; width: 100%; height: 400px;">
        <q-calendar-day
          ref="calendar"
          v-model="currentDate"
          view="day"
          :drag-enter-func="onDragEnter"
          :drag-over-func="onDragOver"
          :drag-leave-func="onDragLeave"
          :drop-func="onDrop"
          animated
          bordered
          transition-next="slide-left"
          transition-prev="slide-right"
          no-active-date
          time-clicks-clamped
          :interval-minutes="15"
          :interval-count="96"
          :interval-height="28"
          :selected-start-end-dates="startEndTimes"
          @change="onChange"
          @moved="onMoved"
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
                  <q-tooltip>{{ event.time + ' - ' + event.details }}</q-tooltip>
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
                  <q-tooltip>{{ event.time + ' - ' + event.details }}</q-tooltip>
                  <!-- meh interfere with removing...Tosee if can enable it later somehow... 
                    <q-popup-edit v-model="event.score" auto-save v-slot="scope">
                    <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
                  </q-popup-edit>-->
                  
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
       <q-card>
          <q-card-section>
            <div class="text-h3">Pick event</div>
          </q-card-section>
          <q-separator />
          <q-select
            v-model="toAddE" 
            :options="store.getSubGoals"             
            option-value="id"
            option-label="title"
            label="Sub Goal" />
          <q-separator />
          <q-card-actions align="right">
            <q-btn flat label="Add" color="primary" @click="AddEvent"/>
          </q-card-actions>         
        </q-card>
      </q-dialog>
    
    </div>
    <br>
    <div class="scroll overflow-auto" style="height: 360px; width: 100%;">
        <div v-for="(event, index) in store.getSubGoals" :key="index" class="col-12" style="font-size: 10px; line-height: 10px; max-height: 14px; min-height: 14px; padding: 2px 2px; white-space: nowrap;">
          {{ event }}
        </div>
    </div>
  </div>
    <q-btn
        class="q-mt-xl"
        color="Green"
        text-color="blue"
        elevated
        label="ShowForm"
        @click="showGoalForm = !showGoalForm"
        no-caps
    />
    <q-btn
        class="q-mt-xl"
        color=""
        text-color="green"
        elevated
        label="Schedule"
        @click="doSchedule"
        no-caps
    />
</template>
<script>
import {
  QCalendarDay,
  addToDate,
  parseTimestamp,
  isBetweenDates,
  isOverlappingDates,
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
    const currentDate = ref(null)
    const currentTime = ref(null)

    const endTimesArray = ref([]) //oldie >> allEvents
    const scheduledEvents = ref(null)  //shall replace daily scheduled and be source of truth for currently viewed day
    const startEndMap = ref(null) //umm map of start-end for scheduled events for easier overlapp lookup...toSee

    const $q = useQuasar()
    let intervalId = null

    return {
      currentDate: ref(today()), //rename to currentDate**
      events: [],
      calendar: ref(null), //umm wasnt here...any diff? with moving and update now? >>nope
      store:useGoalStore(),

      anchorTimestamp: ref(null), //start time for range
      otherTimestamp: ref(null),   //end time for range...diff with anchorTimestamp should be duration**
      mouseDown: ref(false),
      mobile: ref(true),
      //intervalId:ref(null), ////for showing current time >>nope
      timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update

      showGoalForm: ref(false), //showing addGoal form
      showEventDialog:ref(false),
      toAddE:ref(null)
    }
  },
  beforeMount() {
    let e = this.loadGoals

    this.mobile = isMobile()  //--for drag for range selection.
   
    this.events = [...e] //does update!!

    this.saveCurrentSchedule() //bon seem doesnt like putting this in loadGoals as it's computed!
    
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

    // convert the events into a map of lists keyed by date
    eventsMap () {
      const map = {}
      this.events.forEach(event => {
        if (!map[ event.date ]) {
          map[ event.date ] = []
        }
        map[ event.date ].push(event)
        if (event.days) {
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
    loadGoals() {
      let subGoals = [...this.store.getSubGoals] //copy so that changes dont go back in storage...toTest***
      let pMap = this.parentGoalsMap

      if (!subGoals) { //|| !pMap
        //console.log("no goals to schedule...")
        this.doNotify("no goals to schedule...")
        return []
      }
     
      subGoals.forEach((obj) => {
        obj.date = today()
        let pgoal = pMap.get(obj.parentGoal)
        if(!pgoal){
            console.log("no parent goal for:", obj)
            obj.bgcolor = "red" //default for goals (could be ad-hoc goals)
            obj.details = "unknown"
        } else {
            obj.bgcolor = pgoal.bgcolor
            obj.details = "from:"+ pgoal.title
        }
      })
      
      return subGoals
  
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
      console.log("startEndTimes", dates)
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
    //numeric date and time identifier for timestamp comparison
    getTimeNumber(timey) {
      if (timey !== null) {
        return getDayTimeIdentifier(timey)
      }
      return false
    },
    //save 
    saveCurrentSchedule() { //save in single map variable >>TODO**
      const map = new Map()
      const startEnd = new Map()
      let endTimes = []
    
      this.events.forEach(event => { 
          map.set(event.id, {
            on: event.date,
            at: event.time,
            for: event.duration
          })
          
          const startTime = addToDate(parsed(event.date), { minute: parseTime(event.time) })
          const endTime = addToDate(startTime, { minute: event.duration })
          startEnd.set(event.id, {
            start: startTime,
            end: endTime
            }
          )
          endTimes.push(endTime.time) //for checking when adjustCurrentTime()**toTest
        })

        this.scheduledEvents = map
        //console.log("done saveCurrentSchedule",this.scheduledEvents )

        this.startEndMap = startEnd
        console.log("done saveCurrentSchedule",this.startEndMap, endTimes)

        this.endTimesArray = endTimes
    },   
    overlapOtherEvent(evID, targetTimestamp, duration) {
      const mappy = []//{}
      let targetStartAt = addToDate(targetTimestamp,{ minute: 0}) 
      let targetEndsAt = addToDate(targetStartAt, { minute: duration}) //end of dropped event

      console.log("overlapOtherEvent...targetTimes",targetStartAt,targetEndsAt)
      let tStart = this.getTimeNumber(targetStartAt)
      let tEnd = this.getTimeNumber(targetEndsAt)
      
      if (tStart === false || tEnd === false) {
        console.log("ERROR... overlapOtherEvent targetTimestamp error",targetTimestamp)
        return mappy
      }

      this.startEndMap.forEach( (value, key, map) => {
        if (key == evID){ 
            console.log("skipping sameness overlapOtherEvent", evID, value)
        }else {
          let eStart = this.getTimeNumber(value.start)
          let eEnd = this.getTimeNumber(value.end)

          if (eStart !== false && eEnd !== false){

          //target overlap with event (at start OR end) >>could prolly just have used 'isOverlappingDates' smh 
          let isTwix = (tStart >= eStart && tStart <= eEnd) || (tEnd >= eStart && tEnd <= eEnd) //umm what if it's just at the line though?
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
    adjustCurrentTime() {
      const now = parseDate(new Date())
    
      this.currentDate = now.date
      this.currentTime = now.time //'00:52'
      this.timeStartPos = this.$refs.calendar.timeStartPos(this.currentTime, false)  
      //the above dont update in view >>cause was not in return!!

      //console.log("adjustin...", this.timeStartPos, this.currentTime)
      
      //could check map of end times(keys) to see if reached end of an event? 
        //--not expensive? maybe if save only endTimes?
     if(this.endTimesArray[now.time]) {
        console.log("should got a notif?...")
        this.doNotify("WOOO at end of a scheduled event", "positive")
     }
    },
    hasDate (days) { //see if this updates for adjustCurrentTime() above **
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
    /*droppingOnTopCheck(targetDrop, duration, evID){
      let targetStartAt = addToDate(targetDrop.timestamp,{ minute: 1 }) //start of dropped...have to use option{minute:1} >>check works with 0
      let targetEndsAt = addToDate(targetStartAt, { minute: duration}) //end of dropped event

      let earlierThanEnd = this.earlierthan2(evID,targetStartAt)
      let laterThanStart = this.comesafter2(evID,targetStartAt)

      let earlierThanStart = this.earlierthan2(evID,targetEndsAt)
      let laterThanEnd = this.comesafter2(evID,targetEndsAt)

      //so the intersection of both array "should" contain whichever overlapping event...hopefully...
      //the naming is confusing***--toFix
      console.log("droppingOnTopCheck", earlierThanEnd, laterThanStart)

      console.log("droppingOnTopCheck--euh?", earlierThanStart, laterThanEnd)

    },*/
    updateScheduleMaps(evID, timeyStart){
        if(this.scheduledEvents.has(evID) && this.startEndMap.has(evID)){
            let forsy = this.scheduledEvents.get(evID).for //umm would this work?
            this.scheduledEvents.set(evID, {
                on: timeyStart.date,
                at: timeyStart.time,
                for: forsy
            })

            this.startEndMap.set(evID, {
                start: timeyStart,
                end: addToDate(timeyStart, { minute: forsy })
            })
            return true
        }else return false  
        
    },
    changeEventSchedule(evID, timeyStart) {
        let worked = false
        this.events.forEach((obj) => { // return doesnt work in forEach...huh should optimize with for loop! todo**
            if (obj.id === evID){
                if (!obj.canMove){ //as for sure to move un-movable
                    this.$q.dialog({
                        title: 'Alert',
                    // position: 'bottom',
                        message: `Sure to move event ${obj.title} around?`
                        }).onOk(() => {
                            //sameNess.time = newTime.time
                            obj.time = timeyStart.time
                            worked = true
                        }).onCancel(() => {
                            //console.log('Cancelled Moviing')
                            this.doNotify(`${obj.title} Cancelled moving ...`)
                        })//.onDismiss(() => {
                            // console.log('I am triggered on both OK and Cancel')
                        //})
                } else {
                    //do change to new time
                    obj.time = timeyStart.time
                    //console.log(`changeEventSchedule of ${evID}`, timeyStart)
                    worked = true
                }
            }
        })
        return worked
    },
    checkOverlap(targetDrop, adding){ //to be replaced by overlapOtherEvent() >>todo***
      console.log("checkOverlap..timestamp:",targetDrop.timestamp)

      let overlappingEvent = null
      let sameNess = false
      
      let targetStartAt = addToDate(targetDrop.timestamp,{ minute: 0 })
      let targetEndsAt = addToDate(targetStartAt, { minute: this.draggedItem.duration }) //end of dropped event

      this.events.forEach((obj) => {
         if (obj.id == this.draggedItem.id){ 
            console.log("skipping sameness", obj.title)
            sameNess = obj //true
            //continue; //not syntactic valid with forEach use smh
          }else {
            //check if obj is already present in the range
            let objStart = addToDate(parsed(obj.date), { minute: parseTime(obj.time) })
            let objEnd = addToDate(objStart, { minute: obj.duration })

            //start >= first && start <= last || end >= first && end <= last || first >= start && end >= last
            
            //if(isOverlappingDates(targetStartAt, targetEndsAt, objStart, objEnd)) {//bon might be using dates smh
            if(isBetweenDates(targetStartAt, objStart, objEnd, true) || isBetweenDates(targetEndsAt, objStart, objEnd, true)){ //gotta use flag to use account for time
              console.log("WOAH dropping on top of?", obj.title)
              console.log("targetted to:", targetStartAt, targetEndsAt)
              console.log("current is:",objStart, objEnd)


              if (obj.canMove){
                overlappingEvent = obj
              } else {
                this.doNotify(`${obj.title} Cannot be moved ...`)
                /*this.$q.notify({ // also see about using >> this.$q.dialog
                        color: 'negative',
                        position: 'top', //see using 'bottom'
                        message: `${obj.title} Cannot be moved ...`,
                        icon: 'report_problem'
                    })*/
                  return false
              }
            }
          }
      })

      if(overlappingEvent) {
          //should decide whether to move it down or up? 
            //or just keep moving event down as would make sense that it moves forward in time?

          //still to check whether there is another event that would need to be pushed down recursively

        let newTime = addToDate(targetDrop.timestamp, { minute: this.draggedItem.duration + 10 })

        console.log("checkOverlap",newTime)
        
        overlappingEvent.time = newTime.time //move underneath 

        this.draggedItem.time = targetDrop.timestamp.time //change timescheduled
        return adding //dummy val for adding in parent...toReview**
      }else {
        console.log("no overlapping event dropped on?...", this.draggedItem) //make sure it's same
        let newTime = addToDate(targetDrop.timestamp, { minute: 0 })

        //so exists already...change time...for now(should maybe ask about double booking of same event? tbd)
        if (sameNess && adding){
          //let newTime = addToDate(targetDrop.timestamp, { minute: 0 })  //this.draggedItem.duration >>duration adds it too far

          console.log("sameNess adding",newTime)
          //sameNess.time = newTime.time 

          if (!sameNess.canMove){ //as for sure to move un-movable
            this.$q.dialog({
                title: 'Alert',
              // position: 'bottom',
                message: 'Sure to move event in today?'
                  }).onOk(() => {
                    sameNess.time = newTime.time
                  }).onCancel(() => {
                    //console.log('Cancelled Moviing')
                    this.doNotify(`${obj.title} Cancelled moving ...`)
                  })//.onDismiss(() => {
                    // console.log('I am triggered on both OK and Cancel')
                  //})
          } else {
            sameNess.time = newTime.time // just change the time of already scheduled event
          }

          return false //for changed timeslot
        } else if (adding) {//so just schedule-add the event to selected time...
           
          this.draggedItem.time = targetDrop.timestamp.time //change timescheduled
          this.events.push(this.draggedItem)

        }
        return adding //dummy val for adding in parent..toReview
      }

      //this.reset() //reset but after scheduling event perhaps
    },
    AddEvent() {
      console.log('I be adding', this.toAddE, this.targetDrop.timestamp)
      //this.toAddE
      this.showEventDialog = false

      //then add it to the map...after checking that it can be added...
      //-making sure it doesnt overlap with other stuff already
      //if it does..prolly .Notify
      //if no prob ask whether to keep this time going forward?

      this.draggedItem = this.toAddE 

      //let before = this.earlierthan(this.toAddE.id,this.toAddE.duration,this.targetDrop.timestamp)
      //let after = this.comesafter(this.toAddE.id,this.toAddE.duration,this.targetDrop.timestamp)
      //let before = this.earlierthan2(this.toAddE.id, this.targetDrop.timestamp)
      //let after = this.comesafter2(this.toAddE.id, this.targetDrop.timestamp)

      let anyOverlap = this.overlapOtherEvent(this.toAddE.id, this.targetDrop.timestamp, this.toAddE.duration)

      console.log("anyOverlap", anyOverlap)
      
      let add = this.checkOverlap(this.targetDrop, true) 
      if(add){//false means that the duplicate was changed time potentially...otherwise just wish to add new event
       // this.events.push(this.toAddE) //no need as added in 'checkOverlap'(should rename**)
       console.log("prolly added? lol")
      } else {
        console.log("umm not added")
      }
      this.reset()
    },
    doSchedule() { //toRemove**
      //this.events = this.allEvents
      console.log("nothing to do")
    },
    doRemove (item) { //also should just remove it from the current schedule...NOT delete it completely!!
      let currentSize = this.events.length
      for( var i = 0; i < currentSize; i++){ 
            if ( this.events[i].id === item.id) { 
                this.events.splice(i, 1)
                console.log("removed spliced!", item)
                return //important to return esti
            }
      }
    },
    reset() { //reset variable for next use 
      this.draggedItem = null
      this.targetDrop = null
    },
    doNotify(messg, colorNotif = undefined){
      this.$q.notify({ // also see about using >> this.$q.dialog
                        color: colorNotif !== undefined ? colorNotif : 'negative', //colorNotif,//'negative',
                        position: 'top', //see using 'bottom'
                        message: messg,
                        icon: colorNotif == undefined ? 'report_problem' : 'thumb_up' //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
                    })
    },
    /////////////////////////////// EVENT HANDLERS //////////////////////////
    onDragStart(e, item) { 
        console.log("onDragStart", e, item) //.clientY to determine if going up or down....
        
        //save the moved item
        this.draggedItem = item
    },
    onDragEnter (e, type, scope) {
      //console.log('insideDragEnter',e.preventDefault) // e,type,scope
      if(type === 'goal-item'){
        console.log('onDragEnter..goal-item',e, scope) // scope is undefined here hence saving it below
        e.preventDefault()
      } else {
        console.log('onDragEnter...calendar', e, scope) //e,type,scope 
        this.targetDrop = scope //ABSO necessary to save this as it's the last position before potential overlap with goal-item!  
        e.preventDefault()
      }
     
      return true
    },
    onDragOver (e, type, scope) { // needed for onDrop but nothing to do and fires A LOT
      //console.log('onDragOver', scope)
      e.preventDefault() //to allow drop

      return true
    },
    onDragLeave (e, type, scope) {
      //console.log('onDragLeave', scope)
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
      //console.log('onDragEnd', this.scheduledEvents, this.startEndMap) 
    },
    onDrop(e, type, scope) { //other drag functions above need for this to fire >>especially 'onDragOver' above
        console.log("onDrop", e, type, scope)//JSON.stringify(item)
        if (type === 'interval') { //when dragged to head, it would be a whole day event
            console.log("onDrop...normal move", scope)
            //this.canEventBeMoved(scope) //no need for this and should just drop event..
            this.draggedItem.time = scope.timestamp.time

            //also update maps
            let w = this.updateScheduleMaps(this.draggedItem.id, scope.timestamp)
            if (!w) {console.log("umm ERROR normal updateScheduleMaps failed?",this.draggedItem) }
            //this.store.saveNewGTime(this.draggedItem.id, this.draggedItem.time)  //should just send whole event?
        } else {
          if(type === 'goal-item'){
            console.log("Dropping goal-item!!",e, type, this.targetDrop.timestamp) //scope is undefined here
            //console.log("intervale with !!",this.targetDrop)
            //this.canEventBeMoved(this.targetDrop)
            //this.canEventBeMoved2(this.targetDrop)

            let anyOverlap = this.overlapOtherEvent(this.draggedItem.id, this.targetDrop.timestamp, this.draggedItem.duration)
            
            if(anyOverlap.length > 0) {
                console.log("overlapp!", anyOverlap) 
                let overlappedEvt = this.scheduledEvents.get(anyOverlap[0]) //should be one element...ToReview as could be multiple*** maybe put into a callable function that can be recursed on....
                if (overlappedEvt){
                    console.log(`dragDirection...target>>${this.targetDrop.timestamp.time}, underneath>>${overlappedEvt.at}, dragged>>${this.draggedItem.time}`)
                    //direction of drag(up or down) >>either - or + 
                    let dragDirection = parseTime(this.targetDrop.timestamp.time) - parseTime(this.draggedItem.time)
                   
                    console.log(`dragDirection...${dragDirection > 0 ? "goign down": "going up"}`)

                    //when dragDirection > 0 (going down)...otherwise going up...prolly
                    let overlappedEvtNew = dragDirection > 0 ? addToDate(this.targetDrop.timestamp, { minute: overlappedEvt.for + 10 }) //to review the adding of 10 minutes
                                                    : addToDate(this.targetDrop.timestamp, { minute: -(overlappedEvt.for) - 10 }) //toTest** 
                    
                        //umm should keep same time interval between the two events?!? meh

                    let changed = this.changeEventSchedule(anyOverlap[0], overlappedEvtNew)
                    console.log("overlappedEvtNew..",changed, overlappedEvtNew)

                    //test that newTime doesnt overlap with existing event--toDO** in recursive manner!
                    let anyOtherOverlap = this.overlapOtherEvent(anyOverlap[0], overlappedEvtNew, overlappedEvt.for)
                    if(anyOtherOverlap.length > 0) {console.log("There ARE other overlaps...",anyOtherOverlap)}
                    
                    let w = this.updateScheduleMaps(anyOverlap[0], overlappedEvtNew)
                    if (!w) {console.log("umm ERROR updateScheduleMaps failed?",anyOverlap[0]) }

                    //umm targetDrop should stays the same here!!--for dragging up keep interval of 10 minutes? 
                    let draggedNewTime = dragDirection > 0 ? addToDate(this.targetDrop.timestamp, { minute: 0 })
                                                    : addToDate(this.targetDrop.timestamp, { minute: 10 }) 
                    
                    let worked = this.changeEventSchedule(this.draggedItem.id, draggedNewTime)
                    console.log("onDrop overlapp complete",worked, draggedNewTime)

                    let e = this.updateScheduleMaps(this.draggedItem.id, draggedNewTime)
                    if (!e) {console.log("umm ERROR updateScheduleMaps failed?",this.draggedItem.id) }
                
                }else{console.log("ERROR overlapped event not found!",anyOverlap)}
            }

            //this.checkOverlap(this.targetDrop, false)
          } else {
            console.log("Cannot drop here YO!!",e, type, scope) //shouldnt happen?
          }
        }
        
    },
    onDblClickEvent(e, event) {
       console.log("double click eh...", e, event)
       this.$q.dialog({
        title: 'Alert',
       // position: 'bottom',
        message: 'Sure to remove event from today?'
          }).onOk(() => {
             this.doRemove(event)
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

      console.log('onClickTime', data)
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
    onMoved (data) {
      console.log('onMoved to', data.date) //only here can access .date

      //console.log(JSON.stringify(data))  // better looking mais bon
      this.events.forEach((obj) => {
        obj.date = data.date //today()
      })
    },
    onChange (data) {
      console.log('onChange', data) 
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