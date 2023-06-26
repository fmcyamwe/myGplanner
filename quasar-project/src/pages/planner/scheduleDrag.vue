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
          v-model="selectedDate"
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
          :selected-start-end-dates="startEndDates" >>need for/used for range selection!

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
          <!-- wonder if putting the day-container above in day-body below would work? 
            >>dont seem so...scope variable prolly not available -->
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
                <!--just to see if the above events fire(yes except @touchstart.stop="(e) => onTouchStart(e, event)") 
                and draggable?yup with draggable flag
                  @dragenter.prevent @dragover.prevent
                  @dragover.stop="(e) => onDragOver(e, event)"
                  @drop.stop="onDrop" >>this drop doesnt fire

                  @click.prevent="(e) => onClickEvent(e, event)" //this one uses counter for doubleclick but not needed
                -->
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
    
      <!--goalDialog below doesnt popup :(

      v-model="showD"
      <q-layout view="Lhh lpR fff" container class="bg-white text-dark">
      style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;"
    
      <goal-dialog
        v-model:show-dialog="showD"
        style="height: 360px; width: 100%;"
        class="bg-white text-dark"
      /> -->
    
    </div>
    <br>
    <div class="scroll overflow-auto" style="height: 360px; width: 100%;">
        <div v-for="(event, index) in store.getSubGoals" :key="index" class="col-12" style="font-size: 10px; line-height: 10px; max-height: 14px; min-height: 14px; padding: 2px 2px; white-space: nowrap;">
          {{ event }}
        </div>
        <!-- using computed 'getLocGoals' also works!-->
    </div>
  </div>
  <!--<q-btn
        class="q-mt-xl"
        color="Green"
        text-color="blue"
        elevated
        label="Schedule"
        @click="prompt"
        no-caps
    /> -->
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
    <!--"store.resetAll"
    "showD = true"

    @click="showD = !showD"
    -->
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

export default defineComponent({
  name: 'ScheduleDrag',
  components: {
    NavigationBar,
    QCalendarDay,
    addGoalForm,
    //goalDialog
  },
  //setup () { //okay to use setup methods? >>nope error as this is Options API
  //  onBeforeMount(() => {
  //      console.log("onBeforeMount")
  //  })
  //},
  data () {
    const draggedItem = ref('')
    const targetDrop = ref(null) 
    const currentDate = ref(null)
    const currentTime = ref(null)
    const timeStartPos = ref(0)
    //const intervalId = ref(null)  //moved in return to see if update current time >>nope no change

    const allEvents = ref([])

    const $q = useQuasar()
 

    /* needed below in return or warning when reading during render and fails
    const anchorTimestamp = ref(null) //start time for range
    const otherTimestamp = ref(null)   //end time for range...diff with anchorTimestamp should be duration**
    const mouseDown = ref(false)
    const mobile = ref(true) //find ways to determine this and set it beforeMount**
    */

    return {
      selectedDate: today(),
      events: [],
      calendar: ref(null), //umm wasnt here...any diff? with moving and update now? >>nope
      store:useGoalStore(),

      anchorTimestamp: ref(null), //start time for range
      otherTimestamp: ref(null),   //end time for range...diff with anchorTimestamp should be duration**
      mouseDown: ref(false),
      mobile: ref(true),
      showD: ref(false),
      //startEndDates: ref(null)
      intervalId:ref(null),
      counter: 0,

      showGoalForm: ref(false)
    }
  },
  beforeMount() {
    let e = this.loadGoals
    let pMap = this.parentGoalsMap

    this.mobile = isMobile()  //--for drag for range selection...before with this.isMobile
    //locale.value = getLocale()

    if (!e) { //|| !pMap
        console.log("no goals to schedule...")
        this.events = []
        //this.mobile = false 
        return
    }

    e.forEach((obj) => {
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

    console.log("onBeforeMount", e)//JSON.stringify(e)
    
    this.events = e //does update!!

    //this.allEvents = e
    

  },
  beforeUnmount() {
    clearInterval(this.intervalId) //for showing current time
  },
  mounted() {
    this.adjustCurrentTime()
    // now, adjust the time every minute
    
    this.intervalId = setInterval(() => {
        this.adjustCurrentTime()
    }, 60000)
  },
  computed: {
    showForm() {return this.showGoalForm},
    // convert the events into a map of lists keyed by date
    eventsMap () {
      const map = {}
      // this.events.forEach(event => (map[ event.date ] = map[ event.date ] || []).push(event))
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
        //test for null here--todo**
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
    loadGoals () { 
        //should add the parent's bgcolor for scheduling and other info here? prolly not...toREview

      return this.store.getSubGoals //so should not invoke it as a function!!
      //console.log('getSubGoals', JSON.stringify(e))
      
      //return e
    },
    style () {  //style = computed(() => {
      return {
        top: this.timeStartPos + 'px'
      }
    },
    //some computed for the range interval most like...
    //computed(() => {
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
    //})
    },
    anchorDayTimeIdentifier() {//= computed(() => {
      if (this.anchorTimestamp !== null) {
        return getDayTimeIdentifier(this.anchorTimestamp)
      }
      return false
    },
    //})
    otherDayTimeIdentifier() { //= computed(() => {
      if (this.otherTimestamp !== null) {
        return getDayTimeIdentifier(this.otherTimestamp)
      }
      return false
    }
    //})
  },
  methods: {
    doSchedule() {
      this.events = this.allEvents
      /*this.$q.dialog({
        title: 'Alert',
       // position: 'bottom',
        message: 'Schedule?'
          }).onOk(() => {
             this.events = this.allEvents
          }).onCancel(() => {
             console.log('Cancelled scheduling')
          })//.onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          //})
        */
    },
    onDragStart(e, item) { 
        console.log("onDragStart", e, item)
        
        //save the moved item
        this.draggedItem = item
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
    },
    onDragEnter (e, type, scope) {
      //console.log('insideDragEnter',e.preventDefault) // e,type,scope
      if(type === 'goal-item'){
        console.log('onDragEnter..goal-item',e, scope) //, e,type,scope
        e.preventDefault()
      } else {
        console.log('onDragEnter...calendar', e, scope) //e,type,scope 
        this.targetDrop = scope //this shouldnt be empty--add better guardrails around...TODO**
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
    onDrop(e, type, scope) { //other drag functions above need for this to fire >>especially 'onDragOver' above
        console.log("onDrop", e, type, scope)//JSON.stringify(item)
        if (type === 'interval') { //when dragged to head, it would be a whole day event
            console.log("onDrop...normal move")
            //this.canEventBeMoved(scope) //no need for this and should just drop event..
            this.draggedItem.time = scope.timestamp.time
            //this.store.saveNewGTime(this.draggedItem.id, this.draggedItem.time)  //should just send whole event?
        } else {
          if(type === 'goal-item'){
            console.log("Dropping goal-item!!",e, type, scope,this.targetDrop) //scope is undefined here
            //console.log("intervale with !!",this.targetDrop)
            //this.canEventBeMoved(this.targetDrop)
            //this.canEventBeMoved2(this.targetDrop)
            this.checkOverlap(this.targetDrop)
          } else {
            console.log("Cannot drop here YO!!",e, type, scope) //shouldnt happen?
          }
        }
        
    },
    checkOverlap(targetDrop){
      let overlappingEvent = null
      
      let targetStartAt = addToDate(targetDrop.timestamp,{ minute: 0 }) //start of dropped...have to use option{minute:1} >>check works with 0
      let targetEndsAt = addToDate(targetStartAt, { minute: this.draggedItem.duration }) //end of dropped event

      this.events.forEach((obj) => {
         if (obj.id == this.draggedItem.id){ 
            //console.log("skipping sameness", obj.title)
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
                this.$q.notify({ // also see about using >> this.$q.dialog
                        color: 'negative',
                        position: 'top', //see using 'bottom'
                        message: `${obj.title} Cannot be moved ...`,
                        icon: 'report_problem'
                    })
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
        
        overlappingEvent.time = newTime.time

        this.draggedItem.time = targetDrop.timestamp.time
      }else {
        console.log("no overlapping event dropped on...")
      }

    },
    canEventBeMoved2(targetDrop) { 
      let droppedOn = null

      //getDateTime(targetDrop.timestamp) ////2023-06-10 13:45
      
      let targetStartAt = addToDate(targetDrop.timestamp,{ minute: 1 }) //start of drop...have to use option{minute:1}
      let targetEndsAt = addToDate(targetStartAt, { minute: this.draggedItem.duration }) //end of dropped event
      
      console.log("canEventBeMoved2", targetStartAt, targetEndsAt) //yup >> date: '2023-06-10', time: '13:46', year: 2023, month: 6, day: 10, …}

      this.events.forEach((obj) => {
         if (obj.id == this.draggedItem.id){ 
            //console.log("skipping sameness", obj.title)
            //continue; //not syntactic valid with forEach use smh
          }else {
            //check if obj is already present in the range
            let objStart = addToDate(parsed(obj.date), { minute: parseTime(obj.time) })
            let objEnd = addToDate(objStart, { minute: obj.duration })

            if (isBetweenDates(targetStartAt, objStart, objEnd, true) || isBetweenDates(targetEndsAt, objStart, objEnd, true)) {
              console.log("WOAH dropping on top of?", obj.title, objStart, objEnd) //same as date above!
              if (obj.canMove){
                droppedOn = obj
              } else {
                this.$q.notify({ // also see about using >> this.$q.dialog
                        color: 'negative',
                        position: 'top', //see using 'bottom'
                        message: `${obj.title} Cannot be moved ...`,
                        icon: 'report_problem'
                    })
                }
            }
            //test to see if better to use the below function... 
            //>>seems to work better than isBetweenDates when it's not a total matching drop?
            if(isOverlappingDates(targetStartAt, targetEndsAt, objStart, objEnd)) {
                console.log("ALSO overlapping!")
            }

          }
      })

      if(droppedOn) {
        let newTime = addToDate(targetDrop.timestamp, { minute: this.draggedItem.duration + 10 })

          //should decide whether to move it down or up?
          //by checking whether there is another event up or down

          //also 

          console.log("moving2 same?",newTime)
        
          droppedOn.time = newTime.time

          this.draggedItem.time = targetDrop.timestamp.time
      }else {
        console.log("nothing dropped on...")
      }

          /*
          //isOverlappingDates(startTimestamp, endTimestamp, firstTimestamp, lastTimestamp)
          //isBetweenDates(timestamp, startTimestamp, endTimestamp, useTime) //so timestamp is between startTimestamp and endTimestamp


          const startTime = addToDate(parsed(events[ 0 ].date), { minute: parseTime(events[ 0 ].time) })
          const endTime = addToDate(startTime, { minute: events[ 0 ].duration })
          const startTime2 = addToDate(parsed(events[ 1 ].date), { minute: parseTime(events[ 1 ].time) })
          const endTime2 = addToDate(startTime2, { minute: events[ 1 ].duration })
          if (isBetweenDates(startTime2, startTime, endTime, true) || isBetweenDates(endTime2, startTime, endTime, true)) {

          */
    },

      //check if can be dropped and no other event is already there
      //in case another event is && !canMove >>small qDialog to tell error, otherwise displace the other event a bit(could do lots of move with this at worst though?)
      //in case no other event >> then do drop and save new time
    //cycle through other events if one is already scheduled in the timeslot 
    canEventBeMoved(targetDrop) { 
      let canMove = true
      let droppedOn = null

      let targetStartAt = targetDrop.timeStartPos(targetDrop.timestamp.time) //start of drop
      let targetEndsAt = targetDrop.timeDurationHeight(this.draggedItem.duration) + targetStartAt //end of dropped event

      console.log("canEventBeMoved", targetStartAt, targetEndsAt)
       
      this.events.forEach((obj) => {
        if (obj.id == this.draggedItem.id){ 
            //console.log("skipping sameness ", obj)
            //continue; //not syntactic valid with forEach use smh
        }else {

          //canEventBeMoved 2044 2100
          //no problem with drop banana cake 2072 2184

          //check if obj is already present in the range
          let objStart = targetDrop.timeStartPos(obj.time)
          let objEnd = targetDrop.timeDurationHeight(obj.duration) + objStart
          //(totally on top and is the shorter event)  || (on top and starts earlier than the current event) || (start later than current event and goes on longer--this one could prolly be reduced/simplified? toSee)
          if((targetStartAt >= objStart && targetEndsAt <= objEnd) || (targetStartAt <= objStart && targetEndsAt > objStart) || (targetStartAt >= objStart && targetStartAt <= objEnd && targetEndsAt >= objEnd))
          {
           //start >= first && start <= last || end >= first && end <= last || first >= start && end >= last;
           //try to use 'isBetweenDates' or import 'isOverlappingDates' for line above comparison!! but need timestamp prolly...

            console.log("WOAH dropping on top of?", obj.title, objStart, objEnd)
            
            canMove = false

            //if obj.canMove >> move it a lil down by changing obj.time
            //if !obj.canMove >> q.dialog about error and nothing to do 
            if (obj.canMove){
              droppedOn = obj  //wonder if could change time here? or bad while doing iteration? prolly latter..toTry
            } else {
              this.$q.notify({ // also see about using >> this.$q.dialog
                        color: 'negative',
                        position: 'top', //see using 'bottom'
                        message: 'Cannot move this event where an unmovable event already is...',
                        icon: 'report_problem'
                    })
            }

          } else {
            console.log("no problem with drop", obj.title, objStart, objEnd)
            
          }
        }
      })

      if (!canMove) {
        //should see if can move the current goal-item down...
        //also determine if should re-arrange the rest of the events!
        if (droppedOn) { //droppedOn
          let tDateTime = getDateTime(targetDrop.timestamp)
          let newTime = addToDate(targetDrop.timestamp, { minute: this.draggedItem.duration + 10 }) 
          //should decide whether to move it down or up?
          //by checking whether there is another event up or down

          console.log("moving event from...to...",tDateTime, newTime) //, droppedOn.duration  
        
          droppedOn.time = newTime.time

          this.draggedItem.time = targetDrop.timestamp.time
          //this.store.saveNewGTime(this.draggedItem.id, this.draggedItem.time)  //should just send whole event?
        } else {
          console.log("how did you end up here?!?") //shouldnt happen?
        }
      }
      return canMove
    },
    onTouchStart (e, item) { 
        //test touch..is it emitted?
        // >>doesnt seem so but make sense as it's a drag event
        console.log("onTouchStart", JSON.stringify(e))
        console.log("onTouchStart", JSON.stringify(item))
    },
    doRemove (item) {
      let currentSize = this.events.length
      for( var i = 0; i < currentSize; i++){ 
            if ( this.events[i].id === item.id) { 
                this.events.splice(i, 1)
                console.log("removed spliced!", item)
                return //important to return esti
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
    onClickEvent(e, event) { //testing double click---replaced by the above
    //and seems to take precedence over the calendar's click event...
    //is it cause it's higher? nope...prolly cause in inner child?
      //console.log("onClick eh...", e) //JSON.stringify
      console.log("onClick eh...", e, event)

      //so here try to change the score of the subGoal(should be done after event has passed/completed?) 

      //double-click to remove goal-item?
      this.counter++
      if(this.counter == 1) {
         this.timer = setTimeout(() => {
            console.log("do delete?..", event)
         }, 300)

         return
      } //else {
        clearTimeout(this.timer)  
        this.counter = 0

        console.log("no delete?..", event)
      //}

    },  
    onMouseEnter(data) { //this fires!
    //could maybe set a variable here and use it when the drag is over?
        //console.log("onMouseEnter", data.scope)
        //this.draggedItem = data.scope.timestamp.time
        console.log("onMouseAt", data) //this.draggedItem
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
    adjustCurrentTime() {
      const now = parseDate(new Date())
      console.log("adjustin...",now, this.currentTime)
      this.currentDate = now.date
      this.currentTime = now.time
      this.timeStartPos = this.$refs.calendar.timeStartPos(this.currentTime, false)
    },
    hasDate (days) {
      return this.currentDate
        ? days.find(day => day.date === this.currentDate)
        : false
    },
    ///......
    /*goalsData () { //this works 
      //oldie >> let e = this.store.getStoredGoals  //mainGoals

      let e = this.loadGoals //store.getSubGoals 

      e.forEach((obj) => {
        obj.date = today()
      })

      console.log('goalsData today:', JSON.stringify(e))

      this.events = e  
      
      return e
    },*/
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
    getEvents (dt) {
      // get all events for the specified date
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
    onClickDate (data) {
      console.log('onClickDate', data)
    },
    onClickTime (data) {
      console.log('onClickTime', data)
    },
    onClickInterval (data) {
      console.log('onClickInterval', data)
    },
    onClickHeadIntervals (data) {
      console.log('onClickHeadIntervals', data)
    },
    onClickHeadDay (data) {
      console.log('onClickHeadDay', data)
    },
    prompt () {
       //for dialog goal--works but not properly and throws a console error
      //const $q =  useQuasar()
      
      this.$q.dialog({
        component: aGoalTest,// goalForm,
        parent:this, //helps?
        // props forwarded to your custom component
        componentProps: {
          goalTitle: 'something',
          goalType: 'something',
          pGoal: 'something',
          mainGoals: ['something','another','andAlso'],
          details: 'some details',
          priority: 7,
          bgcolor: 'blue',
          showSubG: 'false',
          time: '',
          score: '5on7',
          duration: 30,
          canMove: 'true'
        },
        /*title: 'Prompt with native attributes',
        message: 'Please type a value between 0 and 10:',
        prompt: {
          model: 2,
          type: 'number',

          // native attributes:
          min: 0,
          max: 10,
          step: 2
        },*/
        //cancel: true,
        //persistent: true
      }).onOk(data => {
        console.log('>>>> OK, received', data)
      }).onCancel(() => {
        console.log('>>>> Cancel')
      }).onDismiss(() => {
        console.log('I am triggered on both OK and Cancel')
      })
    },
    /*onAdd () {
        console.log('onAdd some test event')
        let timestamp = parseTimestamp(today())
        timestamp = addToDate(timestamp, { day: 1 })
       let toAdd =  {
          id: 5,
          title: 'A Toasty test',
          details: 'Planning some goals',
          date: timestamp.date,
          time: '14:00',
          duration: 34,
          bgcolor: 'teal-3',
          icon: 'fas fa-utensils'
        }
        this.events.unshift(toAdd) //works? >>huh yes!!
    } */
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