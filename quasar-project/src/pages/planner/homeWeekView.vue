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
                :interval-height="mostEvts * 3"
                @change="onChange"
                @click-date="onClickDate"
                @click-time="onClickTime"
                @click-interval="onClickInterval"
                @click-head-intervals="onClickHeadIntervals"
                @click-head-day="onClickHeadDay"
                > <!--way to calculate interval-height and set it dynamically to see all events properly>> if too many add more height space...-->

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
                </template><!--huh get stuff from diff places..for head-day-event vs day-body below...toReview? -->

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
               label="Daily Calendar"
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

          <div v-if="treeGoals.length > 0" class="q-pa-xl bg-grey-12" style="max-width: 400px">
            <div class="row justify-center"> Goals & Goal Events </div>
            <q-separator />
            <!--<q-space/> have to be inside qComponent-->
            <br>
            <q-tree
              :nodes="treeGoals"
              node-key="label"
              v-model:expanded="expanded"
              no-connectors
              dense
              >
        
              <!--class="row items-center" :style="titleStyles(prop.node)"-->
              <template v-slot:default-header="prop">
                  <div :class="classyColor(prop.node)">
                    <q-icon :name="prop.node.icon || 'arrow'" size="28px" class="q-mr-sm"/>
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
import { applyClasses, applyStyles } from '../util/utiFunc'
import { useGoalStore } from 'stores/goalStorage'
//import { useQuasar } from 'quasar'
//import { isMobile } from '../util/isMobile'

/*const CURRENT_DAY = new Date()
function getCurrentDay (day) {
  const newDay = new Date(CURRENT_DAY)
  newDay.setDate(day)
  //console.log(`getCurrentDay for ${day}`)
  const tm = parseDate(newDay)
  return tm.date
}
*/

export default defineComponent({
  name: 'weekCalendar',
  components:{
    NavigationBar,
    QCalendar
  },
  data () {
    //const draggedItem = ref(null)
    //const targetDrop = ref(null)
    return {
      store:useGoalStore(),
      calendar: ref(null),
      currentDate: ref(today()),
      events: [], //should rename this...
      mostEvts:5, //huh just to set the interval-height for proper spacing..default or things are squished badly when empty
      treeGoals:ref([]), //umm ref does anything?!?
      expanded:ref([]) //to hold expanding parentGoals...
    }
  },
  beforeMount() {
    this.loadEvts()
    this.constructTree()
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
    classyColor(proppy){//bg-{color} or text-{color} in class
    return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
    },
    loadEvts(){
      let pMap = this.parentGoalsMap
      let mGoals = this.storedGoalsMap
      let allEvts = this.allEvents
      
      if (mGoals && pMap) {
        if (allEvts) {
          for (let dateKey in allEvts) {
            //console.log("allEvents:", dateKey, allEvts[dateKey])
            let dEvts = allEvts[dateKey]
            for (let evtId in dEvts) {
              let e = mGoals.get(parseInt(evtId))
              //console.log("eeee",evtId,e,parseInt(evtId))
              if(e){
                let prt = pMap.get(e.parentGoal)
                //console.log("eeee",prt)
                let eS = addToDate(parsed(dateKey), { minute: parseTime(dEvts[evtId].time)})
                let eE = addToDate(eS, { minute: parseInt(dEvts[evtId].duration)})
                this.events.push({
                  id: e.id,
                  title: e.title,
                  details: `${eS.time} - ${eE.time}`, //oldie >> "from:"+ prt.title, 
                  time: dEvts[evtId].time,//'10:00',
                  duration: dEvts[evtId].duration, //120,
                  date: dateKey,//getCurrentDay(1),
                  bgcolor:prt.bgcolor //'orange'
                })
              } //else{console.log(`ERROR: ${evtId} no exist!! on`,dateKey)}// when deleted >> toHANDLE***
            }
          }
        }
      } else {
        console.log("ERROR--no parent or goals!!REVIEW**")
        return
      }
    },
    constructTree(){
      this.treeGoals = this.store.fetchGoalsTree()
    },
    getEvents (dt) {
      // get all events for the specified date
      const events = this.eventsMap[ dt ] || []

      //console.log(`getEvents ${dt}`,events.length)

      if (events.length === 1) {
        events[ 0 ].side = 'full'
      }
      else if (events.length === 2) {
        // with no more than 2 events for day check if the two events overlap and if so, select left or right side alignment to prevent overlap 
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
      //console.log(`getEvents ${dt}`, events.length) //number of evts scheduled on this day...can use to calc largest interval height
      if (events.length > this.mostEvts){
        //console.log(`getEvents hiiigh ${dt}`,events.length)
        this.mostEvts = events.length
      }
      return events
    },
    badgeClasses (event, type) {
        return applyClasses(event, type)
    },
    badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
        return applyStyles(event, type, timeStartPos, timeDurationHeight)
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
      //let oldy = this.mostEvts
      this.mostEvts = 5 //to update the interval-height
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