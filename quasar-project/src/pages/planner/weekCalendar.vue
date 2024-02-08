<template>
    <q-page> <!-- class="flex flex-center"-->
        <navigation-bar
            @today="onToday"
            @prev="onPrev"
            @next="onNext"
        />
        <div class="row justify-center">
            <div style="display: flex; max-width: 800px; width: 100%;height: 400px;overflow: auto;"><!--class="row justify-center items-center" use 'no-scroll' to disallow scrolling border: 1px solid #ddd>>-->
                <q-calendar
                ref="calendar"
                v-model="currentDate"
                view="week"
                dark
                animated
                hoverable
                bordered
                transition-prev="slide-right"
                transition-next="slide-left"
                no-active-date
                :interval-minutes="30"
                :interval-count="48"
                :interval-height="20"
                @change="onChange"
                @click-date="onClickDate"
                @click-time="onClickTime"
                @click-interval="onClickInterval"
                @click-head-intervals="onClickHeadIntervals"
                @click-head-day="onClickHeadDay"
                >

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
                      >
                        <span class="title q-calendar__ellipsis">
                          {{ event.title }}
                          <q-tooltip>{{ event.details }}</q-tooltip>
                        </span>
                      </div>
                    </template>
                  </template>
                </q-calendar>
            </div>
        </div>
        <div class="row justify-center items-center">
            <q-btn
               class="q-ma-xl"
               color="white"
               text-color="blue"
               unelevated
               to="/summary"
               label="Summary"
               no-caps
            />
            <q-btn
               class="q-ma-xl"
               color="white"
               text-color="blue"
               unelevated
               to="/dayCalendar"
               label="Daily"
               no-caps
            />
          
            <q-btn
               class="q-ma-xl"
               color="white"
               text-color="blue"
               unelevated
               to="/viewGoals"
               label="Goals"
               no-caps
            />
          </div>
    </q-page>
</template>
<script>
import { defineComponent, ref} from 'vue'  //computed, onBeforeMount
import {
  QCalendar,
  today,
  addToDate,
  parseTimestamp,
  isBetweenDates,
  parsed,
  parseDate,
  parseTime
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import NavigationBar from '../../components/NavigationBar.vue'
import { isMobile } from '../util/isMobile'
import { applyClasses, applyStyles } from '../util/utiFunc'
import { useGoalStore } from 'stores/goalStorage'
//import { useQuasar } from 'quasar'

const CURRENT_DAY = new Date()
function getCurrentDay (day) {
  const newDay = new Date(CURRENT_DAY)
  newDay.setDate(day)
  //console.log(`getCurrentDay for ${day}`)
  const tm = parseDate(newDay)
  return tm.date
}

export default defineComponent({
  name: 'weekCalendar',
  components:{
    NavigationBar,
    QCalendar
  },
  data () {
    const draggedItem = ref(null)
    const targetDrop = ref(null)
    return {
      store:useGoalStore(),
      calendar: ref(null),
      currentDate: ref(today()),
      events: [], //should rename this...
    }
  },
  beforeMount() {
    this.loadEvts()
  },
  mounted() {
    console.log(`mounted`)
  },
  computed: {
    storedGoalsMap(){  //rename properly** todo
        const map = new Map()
        let mG = this.store.getSubGoals
        if (!mG){
            console.log('GoalsMap is empty or null', mG)
            return map
        }

        mG.forEach(obj => { 
            map.set(obj.id, obj);
        })
        //console.log('parentGoalsMap', map) //JSON.stringify(e)
        return map
    },
    allEvents(){
        return this.store.getAllDates
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

    storedEvents(){  //rename properly** todo
        return this.store.getSubGoals
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
      //console.log(`eventsMap`,map)
      return map
    },
  },
  methods: {
    loadEvts(){
        let pMap = this.parentGoalsMap
        let mGoals = this.storedGoalsMap
        let allEvts = this.allEvents

        //let e = this.store.fetchAllTaskSummary() 
        //should prolly have a diff method for just allEvents instead of doing it all here!!--TODO**

        console.log("returnNewEvts:", pMap,mGoals,allEvts)
      
        if (mGoals && pMap) {
            if (allEvts) {
                for (let dateKey in allEvts) {
                    //console.log("allEvents:", dateKey, allEvts[dateKey])
                    let dEvts = allEvts[dateKey]
                    for (let evtId in dEvts) {
                        //let euh = parseInt(evtId)
                        let e = mGoals.get(parseInt(evtId))
                        //console.log("eeee",evtId,euh,e,f)
                        if(e){
                            let prt = pMap.get(e.parentGoal)
                            //console.log("eeee",prt)
                            this.events.push({
                                id: e.id,
                                title: e.title,//'1st of the Month',
                                details: "from:"+ prt.title,
                                time: dEvts[evtId].time,//'10:00',
                                duration: dEvts[evtId].duration, //120,
                                date: dateKey,//getCurrentDay(1),
                                bgcolor:prt.bgcolor //'orange'
                            })

                        }else{console.log("ERROR?!?:", evtId,dateKey, dEvts)}  //prolly when deleted?!? ToReview**
                    }

                }
            }

        } else {
            console.log("ERROR--no parent or goals!!REVIEW**")
            return
        }

        /*   
        {
          id: 3,
          title: 'Meeting',
          details: 'Time to pitch my idea to the company',
          date: getCurrentDay(10),
          time: '10:00',
          duration: 120,
          bgcolor: 'red',
          icon: 'fas fa-handshake'
        },*/
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
      //console.log(`getEvents ${dt}`, events)
      return events
    },
    badgeClasses (event, type) {
        return applyClasses(event, type)
      /*const isHeader = type === 'header'
      return {
        [ `text-white bg-${ event.bgcolor }` ]: true,
        'full-width': !isHeader && (!event.side || event.side === 'full'),
        'left-side': !isHeader && event.side === 'left',
        'right-side': !isHeader && event.side === 'right',
        'rounded-border': true
      }*/
    },
    badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
        return applyStyles(event, type, timeStartPos, timeDurationHeight)
        /*const s = {} 
      if (timeStartPos && timeDurationHeight) {
        s.top = timeStartPos(event.time) + 'px'
        s.height = timeDurationHeight(event.duration) + 'px'
      }
      s[ 'align-items' ] = 'flex-start'
      return s*/
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
      //this.doReset = true  //umm should do it here too right? 
      this.$refs.calendar.next()
    },
    onClickDate (data) { //The date button in format YYYY-MM-DD
      console.log('onClickDate', data)
      //events.value.unshift(`click:date: ${JSON.stringify(data)}`)
    },
    onClickTime (data) {//The slotted area to side of intervals
      console.log('onClickTime', data)
      //events.value.unshift(`click:time: ${JSON.stringify(data)}`)
    },
    onClickInterval (data) {//The interval area
      console.log('onClickInterval', data)
      //events.value.unshift(`click:interval: ${JSON.stringify(data)}`)
    },
    onClickHeadIntervals (data) { //The header area above the intervals
      console.log('onClickHeadIntervals', data)
      //events.value.unshift(`click:interval:header: ${JSON.stringify(data)}`)
    },
    onClickHeadDay (data) { //date header where the date is....
      console.log('onClickHeadDay', data)
    },
    onChange (data) { //runs first after loading/reload > right after beforeMount() and before mounted()
        console.log('onChange', data)
    }
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
</style>