<template>
    <q-page padding> <!-- class="flex flex-center"-->
      <!--<q-splitter
      v-model="splitterModel"
      :limits="[50, 100]"
      style="height: 600px"
    >  //limits here mean that :before slot doesnt get less than 50%-->

    <!--<template v-slot:before> -->
      <div class="q-px-md">
        <navigation-bar
            @today="onToday"
            @prev="onPrev"
            @next="onNext"
        />
        <i class="row justify-center q-pa-sm">Click on Day header for that day's Moods </i>
        <div class="row justify-center">
            <div class="q-px-md" style="display: flex; max-width: 800px; width: 100%;height: 500px;overflow: auto;"><!--class="row justify-center items-center" use 'no-scroll' to disallow scrolling border: 1px solid #ddd>>-->
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
                @click-head-day="onClickHeadDay"
                ><!--redundant handlers
                @click-interval="onClickInterval"
                @click-head-intervals="onClickHeadIntervals"
                @click-date="onClickDate"
                @click-time="onClickTime"
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
                          <q-tooltip>
                            <div class="lineyy"><!--div seems to work for line break!! maxHeight="100%" maxWidth="100%"-->
                              {{ event.details }}
                            </div>
                            </q-tooltip> 
                        </span>
                      </div>
                    </template>
                  </template>
                </q-calendar>
            </div>
        </div>
      </div>
    <!--</template>-->

    <!--<template v-slot:separator>
      <q-avatar color="primary" class="q-px-md" text-color="white" size="40px" icon="drag_indicator" />
    </template> -->

      <q-toggle v-model="showTree" :label="label" color="teal" class="q-pa-md" /> <!--align="center"-->

      <q-slide-transition>
        <div v-if="showTree" class="q-pa-md"> <!--style="width: 1000px" with q-fab OR use q-scroll-area? -->

          <div v-if="treeGoals.length > 0" class="q-pa-md bg-grey-12" style="max-width: 400px"> <!-- class="row justify-center" -->
            <div class="row justify-center"> Goals & Goal Events </div>
            <!--<div class="row justify-center caption"> Hover for Moods... </div>-->
            <q-separator />
            <!--<q-space/> have to be inside qComponent-->
            <br>
            <q-tree
              :nodes="treeGoals"
              node-key="label"
              v-model:expanded="expanded"
              no-connectors
              dense
              accordion
              ><!--:defaultExpandAll="showTree"  to expand all when toggled but too much-->
              <template v-slot:default-header="prop">
                  <div :class="classyColor(prop.node)">
                    <q-icon v-if="!prop.node.isChildren" :name="prop.expanded ? 'expand_less' : 'expand_more'" size="28px" class="q-mr-sm"/>
                    <div class="q-mr-sm text-weight-bold" size="28px">{{ prop.node.label }}</div>
                    <q-icon :name="prop.node.icon" />
                  </div>
                </template>
              <template v-slot:default-body="prop">
                  <div v-if="prop.node.isChildren">
                    <span class="text-weight-bold liney">  >> {{ prop.node.details }} </span> <!--for multiline gotta use .liney class -->
                    <q-tooltip v-if="prop.node.moods.length > 0">{{ "Moods::> " +prop.node.moods.join(',') }}</q-tooltip>
                  </div>
                  <span v-else class="text-weight-light text-black liney" >{{ prop.node.details }}</span>
                </template>
              </q-tree>
          </div>

          <div v-else class="column justify-center items-center">
            <br>
            <q-card>
              1. Add some Goals first. A schedulable goal is one with a parent Goal--can have multiple related goals with the same parent.
            </q-card>
            <q-separator />
            <q-card>
              2. Go to Schedule to see a daily schedule. Drag scheduled events to new timeslots or click in calendar to add an event.
            </q-card>
            <q-separator />
            <q-card>
              3. Reload a saved daily schedule or defaults or choose minimal score events to schedule. Fix any scheduling conflicts.
            </q-card>
            <q-separator />
            <q-card>
              4. Save the daily schedule (dont forget to update their score as needed!)
            </q-card>
            <q-separator />
            <q-card>
              5. Check out the summary of all goals here!
            </q-card>
          </div>

        </div>

      </q-slide-transition>

    <!--</template>
    </q-splitter> -->
  </q-page>
</template>
<script>
import { defineAsyncComponent, ref} from 'vue'  //computed, onBeforeMount  defineComponent
import {
  QCalendar,
  today,
  addToDate,
  parseTimestamp,
  isBetweenDates,
  parsed,
  diffTimestamp,
  parseTime
} from '@quasar/quasar-ui-qcalendar/src/index.js'
//import NavigationBar from '../../components/NavigationBar.vue'
import { applyClasses, applyStyles } from '../util/utiFunc'
import { useGoalStore } from 'stores/goalStorage'
import { useQuasar } from 'quasar'
import { isMobile } from '../util/isMobile'
import { NotifActions } from '../../boot/actions'; //toSee if instantiate plugin

/*const CURRENT_DAY = new Date()
function getCurrentDay (day) {
  const newDay = new Date(CURRENT_DAY)
  newDay.setDate(day)
  //console.log(`getCurrentDay for ${day}`)
  const tm = parseDate(newDay)
  return tm.date
}
*/

//export default defineComponent({ 
export default {
  name: 'weekCalendar',
  components:{
    NavigationBar: defineAsyncComponent(() => import('../../components/NavigationBar.vue')), //loadOnDemand
    QCalendar //: defineAsyncComponent(() => import('@quasar/quasar-ui-qcalendar/src/index.js')), //craps out when loading on demand as above
  },
  data () {
    //const draggedItem = ref(null)
    //const targetDrop = ref(null)
    const $q = useQuasar()

    return {
      store:useGoalStore(),
      calendar: ref(null),
      currentDate: ref(today()),
      events: [],
      mostEvts:5, //huh just to set the interval-height for proper spacing..default 5 or things are squished badly when empty
      treeGoals:ref([]),
      expanded:ref([]), //to hold expanding parentGoals...
      showTree:ref(false),
      moods:ref({}),
      mobile: ref(false),
      //splitterModel: ref(70) // start at 70% >>redundant
      todayEvts:ref({}) //just today--to update with notifs data
    }
  },
  beforeMount() {
    this.mobile = isMobile()
    this.loadEvts()
    this.constructTree()
    this.dayNotifData()
  },
  //mounted() { //redundant--toRemove**
  //  console.log(`mounted`)//,JSON.parse(JSON.stringify(this.treeGoals)))
  //},

  beforeUnmount() {
    //console.log(`beforeUnmount...do anything?!?`)
    //maybe clear notif storage?!?
    //NotifActions.clearStorage().then((res)=>{
    //  console.log("beforeUnmount::clearStorage",JSON.stringify(res))
    //})
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
    label(){ //could move inline...
      return this.showTree ? "Hide Legend" :"Show Legend"
    },
    allEvents(){ //prolly dont update***
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
    eventsMap () {// convert the events into a map of lists keyed by date
      const map = {}
      this.events.forEach(event => {
        if (!map[ event.date ]) {
          map[ event.date ] = []
        }

        event.sortTime = addToDate(parsed(event.date), { minute: parseTime(event.time) }) //sheesh too much?

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
    reload() { //reload variables with stuff from storage...redundant toRemove** with changes in loadEvts()
      //console.log("homeweekView::Reload") // yup does updates on removal of skipped 
   
      this.loadEvts(true) //flag to reset
    },
    loadEvts(reload=false){
      let pMap = this.parentGoalsMap
      let mGoals = this.storedGoalsMap
      let allEvts = this.store.getAllDates //oldie that dont update >> this.allEvents
      
      if (mGoals && pMap) {
        if (allEvts) {
          if (reload){
            //console.log("homeweekView::loadEvts >>Reset...")
            this.events = [] //reset
            this.moods = {}  //umm should?
          }

          for (let dateKey in allEvts) {
            let dEvts = allEvts[dateKey]

            dateKey == this.currentDate ? this.todayEvts = dEvts : '' //console.log("loadEvts>>skipped assign for: ", dateKey) // allEvts[dateKey]

            for (let evtId in dEvts) {
              let e = mGoals.get(parseInt(evtId))
              //console.log("eeee",evtId,e,parseInt(evtId))
              if(e){
                let prt = pMap.get(e.parentGoal)
                //console.log("eeee",prt)
                let eS = addToDate(parsed(dateKey), { minute: parseTime(dEvts[evtId].time)})
                let eE = addToDate(eS, { minute: parseInt(dEvts[evtId].duration)})
                //let notes = dEvts[evtId]?.notes
                let detz = ''
                if(dEvts[evtId].notes !== void 0 && dEvts[evtId]?.notes !== ''){
                  //console.log(`loadEvts::notes>>`,dEvts[evtId]?.notes, e.score,dEvts[evtId]?.atScore)
                  
                  detz = [`${eS.time} - ${eE.time}`,
                  `${dEvts[evtId]?.atScore ?? ''} >> ${e.score}`, //\n\r
                  `${dEvts[evtId]?.notes}`].join("\n\r") //\r not even needed it seems mais bon!
                  //detz = `${dEvts[evtId]?.notes}` //``+ "&#013;&#010;"+   //nope no multiLine*** smh 

                } else{
                  detz =  `${eS.time} - ${eE.time}`
                }
                if(dEvts[evtId].byMood !== void 0){
                  //console.log(`loadEvts::has moods>>`,dateKey,evtId,dEvts[evtId].byMood)
                  if(!this.moods[dateKey]){
                    this.moods[dateKey] = []
                  }
                  this.moods[dateKey].push(...dEvts[evtId].byMood)
                }

                //todo**review look of title,details info! especially with tooltips for header vs body evt!***
                this.events.push({
                  id: e.id,
                  title: e.title,
                  details: detz, //`${eS.time} - ${eE.time}`, //oldie >> "from:"+ prt.title, 
                  time: dEvts[evtId].time,
                  duration: dEvts[evtId].duration,
                  date: dateKey,//getCurrentDay(1),
                  bgcolor:prt.bgcolor //'orange'
                })
              } //else{console.log(`ERROR: ${evtId} no exist!! on`,dateKey)}// when deleted >> toHANDLE***
            }
          }
        }
        //console.log(`loadEvts::Moods>>`,this.moods)
      } else {
        console.log("ERROR--no parent or goals!!REVIEW**")
        return
      }
    },
    dayNotifData(){

      if (this.mobile){ //no need for browser
        //NotifActions.doPrint() //huh gets called!!
        
        //NotifActions.doPrint().then((res)=>{ //even better!!!
        //  console.log("homeView--beforeMount",JSON.stringify(res))
        //})
       //JSON.stringify(window.screen.orientation.type) //huh works!!

        let mGoals = this.storedGoalsMap

        NotifActions.getSkippedNotifs({date:this.currentDate}).then((res)=>{
          //console.log("getSkippedNotifs of: "+this.currentDate,JSON.stringify(this.todayEvts),JSON.stringify(res))
          let ids = res["skipped"]

          if(ids && Object.keys(ids).length > 0){
            //then retrieve and make remove from this.todayEvts
            const toArray = []
            //should be array..
            for (let id of ids){ //oldie >>for (let key in ids){
              //toArray.push(ids[key]); ////sortable.push([key, sched[key]]);
              toArray.push([id.id, id.evt]) //no point for evt as should be empty
            }

            if (Object.keys(this.todayEvts).length > 0){
              //console.log("WoooResults>> ",JSON.stringify(toArray), JSON.stringify(this.todayEvts)) // JSON.stringify(ids),
              
              let skipd = []
              for (let key in this.todayEvts){
                if(toArray.find(item => item[0] == key)){ //hopefully no cast needed?!?
                  delete this.todayEvts[key]
                  skipd.push(mGoals.get(parseInt(key))?.title ?? "") 
                  console.log(`dayNotifData::deleteSkipped>> `+key,JSON.stringify(skipd))
                }
              }
              //// save 
              this.store.saveDailySchedule(this.currentDate,this.todayEvts)
              // alert user 
              this.$q.notify({
                color: 'warning',
                position: 'top',
                message: `${skipd.join()} Skipped!!`,
                caption: `${this.currentDate} Schedule updated with Skipped ${ids.length} removal`, //need ',' separator?
                icon: 'thumb_down', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
                timeout: 3000 // time to display (in milliseconds)>>default is 5000 (5sec)
                //group?: boolean | string | number;
              })
              //reset by clearing skip key..clearStorage would erase whole storage!!
              //beware tho as does not remove other related keys--toReview**
              NotifActions.clearStoreKey({key:"skip"}).then((res)=>{
                console.log("dayNotifData::clearSkipKey",JSON.stringify(res))
                //should reload...
                //this.loadEvts() // work?!? >>nope smh
                this.reload() //this works!!
              })

            }else{//prolly clear storage!!--toReview but easy for testing
              console.log("GONCLEAR storage::mismatch!!")//, JSON.stringify(ids), JSON.stringify(this.todayEvts))
              NotifActions.clearStorage().then((res)=>{
                console.log("dayNotifData::clearStorage",JSON.stringify(res))
              })
            }
            
          }
        }).catch((err) => {
            console.log("dayNotifData::getSkippedNotifs>>ERROR",err)
            console.log(err)
        })

        NotifActions.getNotes().then((res)=>{ //use date too? toReview**
          //console.log("getNotes>>",JSON.stringify(res)) //getNotes>> {"notes":[{"id":5,"note":"Test test"}]}
          
          if ("notes" in res){
            let notes = res["notes"]
            const ids = []
            //console.log("getNotes>>",JSON.stringify(notes)) //bon isArray
            if(Array.isArray(notes)){
              let wnote = []
              for (let note of notes){ //object using >>  for (let key in this.todayEvts)
                if(note.id in this.todayEvts){ //huh no type issue
                  let clone = Object.assign({},{...this.todayEvts[note.id], notes:note.note})

                  console.log("dayNotifData::Setting Note>>",JSON.stringify(clone),JSON.stringify(this.todayEvts[note.id]))
                  
                  this.todayEvts[note.id] = clone 
                  wnote.push(mGoals.get(parseInt(note.id))?.title ?? "")
                  ids.push(note.id)
                }else{//could happen if evt deleted?!? toMonitor**
                  console.log("getNotes>>ERROR note Evts not found "+note.id,JSON.stringify(note),JSON.stringify(this.todayEvts))
                }
              }

              //// save 
              this.store.saveDailySchedule(this.currentDate,this.todayEvts)
              this.$q.notify({
                color: 'positive',
                position: 'top',
                message: `${wnote.join()} Evts had notes added!!`,
                //caption: `${this.currentDate} Schedule updated with Skipped ${ids.length} removal`, //need ',' separator?
                icon: 'thumb_up', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
                timeout: 3000 // time to display (in milliseconds)>>default is 5000 (5sec)
                //group?: boolean | string | number;
              })
              //console.log("dayNotifData::Saving Schedule>>",JSON.stringify(this.todayEvts))
            }else{//umm handle?!? do what?!?
              console.log("getNotes>>ERROR not array",JSON.stringify(notes),Array.isArray(notes))
            }

            //reset storeKey--todo** pass in 
            NotifActions.clearStoreKey({key:"notey",ids:ids}).then((res)=>{
              console.log("dayNotifData::clearNoteKey",JSON.stringify(res))
                //should reload...
                //this.loadEvts() // work?!? >>nope smh
                this.reload() //this works!!
              })
          }
        })
      }
    },
    constructTree(){
      this.treeGoals = this.store.fetchGoalsTree()
    },
    getEvents (dt) {// get all events for the specified date

      let sorty = (a, b) => {//sort by earlier timestamp!
        let timeDiff = diffTimestamp(a.sortTime,b.sortTime) 
        if (timeDiff > 0) return -1
        if (timeDiff == 0) return 0 
        if (timeDiff < 0) return 1
      }
      
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
      //console.log(`getEvents ${dt}`, events.length) //number of evts scheduled on this day...
      //can use to calculate largest interval height and set it dynamically to see all events properly >> if too many add more height space..
      if (events.length > this.mostEvts){
        //console.log(`getEvents hiiigh ${dt}`,events.length)
        this.mostEvts = this.mobile ? events.length+5 : events.length
      }
      return events.sort(sorty)
    },
    classyColor(proppy){//bg-{color} or text-{color} in class
      //console.log("classyColor",JSON.parse(JSON.stringify(proppy.details))) 
      return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
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
      this.$refs.calendar.prev()
    },
    onNext () {
      this.$refs.calendar.next()
    },
    /*onClickInterval (data) {//The interval area
      console.log('onClickInterval', data)
      //events.value.unshift(`click:interval: ${JSON.stringify(data)}`)
    },
    onClickDate (data) { //The date button in format YYYY-MM-DD
      console.log('onClickDate', data)
      //events.value.unshift(`click:date: ${JSON.stringify(data)}`)
    },
    onClickTime (data) {//The slotted area to side of intervals
      console.log('onClickTime', data)
      //events.value.unshift(`click:time: ${JSON.stringify(data)}`)
    },
    onClickHeadIntervals (data) { //The header area above the intervals
      console.log('onClickHeadIntervals', data)
    },*/
    onClickHeadDay ({ scope, event }) { //date header where the date is....
      let d = scope.timestamp.date
      let hasM = this.moods[d]
      let dayEvts = this.eventsMap[d]?.length ?? 0
      //console.log('onClickHeadDay',d,hasM,dayEvts) 
      if (hasM){  //toSee if can do it better as tooltip!
        this.$q.notify({
          color: 'positive',
          position: 'top',
          message: `${dayEvts} Scheduled with Moods: ${hasM.join()}`, //need ',' separator?
          icon: 'tag_faces', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
          multiLine:true,  //for max-width....
          timeout: 3000 // time to display (in milliseconds)>>default is 5000 (5sec)
          //group?: boolean | string | number;
      })
      }else{//no moods
        this.$q.notify({ 
          color: 'white', //color of whole dialog //default to black
          textColor: 'black', //message text color //default to white
          position: 'top',
          message: dayEvts > 0 ? `${dayEvts} Scheduled without Any Mood!` : `Empty and NO mood!!`,
          icon: dayEvts > 0 ? 'mood' : 'sentiment_neutral',//${dayEvts}
          iconColor: dayEvts > 0 ? 'positive' : "red",
          multiLine:true,  //to have max-width
          //closeBtn:true  //ugly close btn smh
          timeout: 3000
      })}
    },
    onChange (data) { //runs first after loading/reload > right after beforeMount() and before mounted()
      this.mostEvts = 5 //to update the interval-height
      //console.log('onChange', JSON.stringify(data))
    }
  }
}//)

</script>
<style lang="sass" scoped>
.my-event
  position: absolute
  font-size: 12px
  justify-content: center
  margin: 0 1px
  cursor: pointer

.title
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.lineyy
  white-space: pre-wrap
  overflow: scroll
  word-break: break-all
  
.liney
  white-space: pre-wrap
  word-break: break-all

.texty__dontWork4Multiline
  display: block
  text-overflow: ellipsis
  
</style>