<template>
  <q-page padding>
    <div class="subcontent">
      <!--<q-splitter
      v-model="splitterModel"
      :limits="[50, 100]"
      style="height: 600px"
    > //limits here mean that :before slot doesnt get less than 50%-->

    <!--<template v-slot:before> -->
      <div class="q-pa-md">
        <navigation-bar
          @today="onToday"
          @prev="onPrev"
          @next="onNext"
        />

        <div class="row justify-center">
          <div style="display: flex; max-width: 800px; width: 100%;">
            <q-calendar-task
              ref="calendar"
              v-model="selectedDate"
              v-model:model-tasks="parsedTasks"
              v-model:model-footer="footerTasks"
              view="month"
              :task-width="240"
              :cell-width="75"
              task-key="key"
              :min-weekday-length="2"
              :weekday-class="weekdayClass"
              :day-class="dayClass"
              :footer-day-class="footerDayClass"
              :focus-type="['weekday', 'date', 'task']"
              dark
              focusable
              hoverable
              animated
              bordered
              @change="onChange"
              @moved="onMoved"
              @click-date="onClickDate"
              @click-day="onClickDay"
              @click-head-day="onClickHeadDay"
            >
            <template #head-tasks="{ /* scope */ }">
              <div
                class="header ellipsis q-ma-sm"
                style="font-weight: 600"
              >
                <div class="issue ellipsis q-px-xs">{{getViewedMonth}}</div>
                <div class="key">Key</div>
                <div class="logged">Logged</div>
              </div>
            </template>
    
            <template #task="{ scope }">
              <template
                v-for="task in getTasks(scope.start, scope.end, scope.task)"
                :key="task.key"
              >
                <div class="header ellipsis">
                  <div :class="badgeStyles(task)">
                    {{ scope.task.title }}
                      <!-- no need to use scope.task in param since scope.task==task  
                        for child arrow, have to delete their children array beforehand smh  -->
                  </div>
                  <div class="key">{{ scope.task.key }}</div>
                  <div class="logged">{{ sum(scope.start, scope.end, scope.task) }}</div>
                </div>
              </template>
            </template>
    
            <template #day="{ scope }">
              <template
              v-for="time in getLogged(scope.timestamp.date, scope.task.logged)"
              :key="time"
              >
                <div v-if="scope.task.children !== void 0"
                  class="logged-time"
                  style="font-weight: 800;"
                >
                  {{ time.logged }}
                </div>

                <div v-else
                  class="logged-time"
                >
                  {{ time.logged }}
                </div>
              </template>
            </template>
    
            <template #footer-task="{ scope }">
              <div class="summary ellipsis">
                <div class="title ellipsis">{{ scope.footer.title }}</div>
                <div class="total">{{ totals(scope.start, scope.end) }}</div>
              </div>
            </template>
    
            <template #footer-day="{ scope }">
              <div class="logged-time">{{ getLoggedSummary(scope.timestamp.date) }}</div>
            </template>
          </q-calendar-task>
          </div>
        </div>
        <br>
        <div v-if="tasks.length <= 0" class="column justify-center items-center">
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
    <!--</template>

    <template v-slot:separator>
      <q-avatar color="primary" class="q-px-md" text-color="white" size="40px" icon="drag_indicator" />
    </template>

    <template v-slot:after> -->
      <q-toggle 
      v-model="showTree" 
      :label="showTree ? 'Hide Legend' :'Show Legend'" 
      color="teal" 
      class="q-pa-md" /> <!--align="center"-->

      <q-slide-transition>
        <div v-if="showTree" class="q-pa-md">
          <div v-if="treeGoals.length > 0" class="q-pa-md bg-grey-12" style="max-width: 400px">
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
              accordion
              >
      
              <!--class="row items-center" :style="titleStyles(prop.node)"-->
              <template v-slot:default-header="prop">
                <div :class="classyColor(prop.node)">
                  <q-icon v-if="!prop.node.isChildren" :name="prop.expanded ? 'expand_less' : 'expand_more'" size="28px" class="q-mr-sm" />
                  <div class="q-mr-sm text-weight-bold" size="28px">{{ prop.node.label }}</div>
                  <q-icon :name="prop.node.icon" /> <!--no need but to see...-->
                </div>
              </template>
              <template v-slot:default-body="prop">
                <div v-if="prop.node.isChildren">
                  <span class="text-weight-bold">  >> {{ prop.node.details }} </span>
                  <q-tooltip v-if="prop.node.moods.length > 0">{{ "Moods::> " +prop.node.moods.join(',') }}</q-tooltip>
                </div>
                <span v-else class="text-weight-light text-black" >{{ prop.node.details }}</span>
              </template>
            </q-tree>
          </div>
        </div>
      </q-slide-transition>
      <!--<q-tab-panels
        v-model="panel"
        animated
        swipeable
        infinite
        class="bg-purple text-white shadow-2 rounded-borders"
      >
        <q-tab-panel v-for="(value, key) in daOptions" :name="key" :key="key">
          <div class="text-h6">{{key}}</div>
          {{ value[0].title }}
          <q-timeline color="secondary">
            <q-timeline-entry heading body="Timeline heading" />
            <q-timeline-entry v-for="e in value" :key="e.on" :title="e.title"
            :subtitle="e.on">
              {{ e.note }} -- {{e.score}}
            </q-timeline-entry>
          </q-timeline>
        </q-tab-panel>
      </q-tab-panels> -->

      <q-carousel
      v-if="Object.keys(daOptions).length > 0"
      v-model="panel"
      transition-prev="scale"
      transition-next="scale"
      swipeable
      animated
      control-color="white"
      padding
      infinite
      arrows
      class="bg-primary text-white shadow-2 rounded-borders">
        <q-carousel-slide v-for="(value, key) in daOptions" :name="key" :key="key">
          <!--<q-icon name="style" size="56px" /> class="q-mt-md text-center" class="column items-center"-->
          <div>
            <q-timeline :class="timelineColor(value[0].color)"><!--color="secondary" :title="e.score+'{{ fdf }}'" -->
              <q-timeline-entry heading :body="value[0].title" /><!--body="Timeline heading"  subtitle="February 22, 1986" :body="e.note" -->
              <q-timeline-entry v-for="e in value" :key="e.on" :title="e.score"
              :subtitle="e.on">
                {{ e.note }}
              </q-timeline-entry>
            </q-timeline>
          </div>
        </q-carousel-slide>
      </q-carousel>
    
  </div>
</q-page>
</template>
<script>
import {
  QCalendarTask,
  today,
  isBetweenDates,
  parsed,
  parseDate,
  //padNumber,
  getMonthNames
} from '@quasar/quasar-ui-qcalendar/src/QCalendarTask.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTask.sass'
import { defineComponent,ref } from 'vue'
import NavigationBar from '../../components/NavigationBar.vue'
import { useGoalStore } from 'stores/goalStorage'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'summaryCalendar',
  components: {
    NavigationBar,
    QCalendarTask
  },
  data () {
    return {
      calendar: ref(null),
      selectedDate: today(),
      selectedMonth:'',
      allMonths : getMonthNames('long', 'en-US'), //'short', 'en-US'
      startDate: today(),
      endDate: today(),
      store: useGoalStore(),
      tasks: [],
      footerTasks: [
        { title: 'TOTALS' }
      ],
      $q : useQuasar(),
      treeGoals:[],
      expanded:[], //to hold expanding parentGoals...
      showTree:false,
      //splitterModel: ref(70) // start at 70% redundant
      daOptions:ref({}),//[], //or {}
      panel: ref(''),  //tab panels >>have grab at least one key in daOptions...otherwise blank
      //slide: ref('style'), //carousel test
    }
  },
  computed: {
    /**
    * Returns tasks between startDate and endDate (captured via onChange event)
    */
    parsedTasks () {
      const start = parsed(this.startDate)
      const end = parsed(this.endDate)
      const tasks = []
  
        for (let i = 0; i < this.tasks.length; ++i) {
          const task = this.tasks[ i ]
          for (let j = 0; j < task.logged.length; ++j) {
            const loggedTimestamp = parsed(task.logged[ j ].date)
            if (isBetweenDates(loggedTimestamp, start, end)) {
              tasks.push(task)
              break
            }
          }
        }
  
        return tasks
      },
      getViewedMonth(){
        return `Goaly in ${this.selectedMonth}`
      },
    },
    mounted() { ////to scroll to current date...no bueno :(
      
      console.log("weeee mounted...")
      //toTry** see if could with below
        //const now = parseDate(new Date())
        //this.currentDate = now.date 
        //this.currentTime = now.time //'00:52'
        //this.timeStartPos = this.$refs?.calendar?.timeStartPos(now.time, false)  
      
    },
    beforeMount () {
      // adjust all the dates for the current month
      //const date = new Date()
      //const year = date.getFullYear()
      //const month = padNumber((date.getMonth() + 1), 2)

      let e = this.store.fetchAllTaskSummary()//testTasks()

      if (e.length == 0) {
        this.$q.notify({ // also see about using >> this.$q.dialog
            color: 'negative',
            position: "center", //see using 'bottom'
            message: "No summary...please save a schedule to see more!",
            icon: 'warning' //others >>report_problem || warning || thumb_up || tag_faces
            })
        return
      }
      this.tasks = e
      const map = {}

      //console.log("weeee tasks:", this.tasks)
      
      const updateTask = (task,isChild=false,color='') => { //bon isChild flag kinda too much?
        task.logged.forEach(logged => {
          // get last 2 digits from current date (day)
          const day = logged.date.slice(-2)
          //logged.date = 2024-03-14 == 2024-03-14
          //const datey = [ year, padNumber(month, 2), padNumber(day, 2) ].join('-')
          //console.log("taks woulda been", datey, day, logged.date)
          if (isChild){ //&& 'notes' in logged
            //console.log("updateTask:: isChild NOTE",logged,task.key,task.title)//,isChild)
            
            if(!map[task.key]){
              map[task.key] = [] //map[logged.date] = []
              this.panel = task.key
            }
            //map[logged.date].push({ k: task.key, note: logged.notes, score:logged.atScore})
            map[task.key].push({ on: logged.date, note: logged.notes, score:logged.atScore,title:task.title,color:color})
          }
        })
      }

   

      this.tasks.forEach(task => {
        updateTask(task)
        if (task.children !== void 0) {
          task.children.forEach(child => { updateTask(child,true,task?.color) }) //meh toReview passing color like this....
        }
      })

      //console.log("weeee mappy:", map)
      this.daOptions = map  //should make sure dates are sorted--todo
      
      this.constructTree()
    },
    methods: {
      getLogged (date, logged, extra = null) {  //extra for scope.task.title..just for logging below but prolly redundant!
        const val = []
        if (logged.length == 0){
          console.log("ERROR...Empty getLogged?!?", date, extra) //just in case as should be caught at storage level
          return val
        }
        for (let index = 0; index < logged.length; ++index) {
          if (logged[ index ].date === date) {
            val.push({ logged: logged[ index ].logged })
            break
          }
        }
        //console.log("getLogged",val, extra)
        return val
      },
      classyColor(proppy){//bg-{color} or text-{color} in class
        return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
      },
      timelineColor(item){ //text-black
         return item != '' ? `bg-${item} text-white shadow-2 rounded-borders` : `bg-black text-white shadow-2 rounded-borders`
      },
      getLoggedSummary (date) {
        let total = 0
        //let num = 0
  
        const reducer = (accumulator, currentValue) => { 
          if (date === currentValue.date) {
            //num++ //this expensive!
            return accumulator + currentValue.logged
          }
          return accumulator
        }
  
        for (const index in this.tasks) {
          const task = this.tasks[ index ]
          total += task.logged.reduce(reducer, 0)
        }
  
        //console.log("getLoggedSummary",date, total, num) 
        return total.toFixed(2)
      },

      constructTree(){
        this.treeGoals = this.store.fetchGoalsTree()
        //console.log("constructTree", this.treeGoals.length) //
      },
  
      /**
       * Sums up the amount of time spent on a task
       * This only sums it up if the logged date falls
       * between the start and end times
       */
      sum (start, end, task) {
        const reducer = (accumulator, currentValue) => {
          const loggedTimestamp = parsed(currentValue.date)
          if (isBetweenDates(loggedTimestamp, start, end)) {
            return accumulator + currentValue.logged
          }
          return accumulator
        }
        let sT = task.logged.reduce(reducer, 0)
        return sT.toFixed(2)
      },
  
      /**
       * Determines if the passed in task has logged time
       * between the start and end times
       */
      getTasks (start, end, task) {
        const tasks = []
  
        for (let index = 0; index < task.logged.length; ++index) {
          //console.log(`in getTasks for ${task.title}`, task.logged)
          const loggedTimestamp = parsed(task.logged[ index ].date)
          if (isBetweenDates(loggedTimestamp, start, end)) {
            tasks.push(task)
            break
          }
        }
        //console.log("getTasks", start, end, task, tasks.length)
        return tasks
      },
      badgeStyles (task) {
        //console.log("badgeStyles",task,tasky)
        //const s = {}
        //s[ 'align-items' ] = 'flex-start'

        //let c = task.isChild ? 'white' : (task.color !== void 0 ? task.color : 'gold')  // default to white for child and gold for parent...
        //let b = task.isChild ? '20px' : '50px' //bon seem to work!
        //return {
        //  'color': c,
          //'padding':b,
        //}
        let a = task.isChild ? 'text-white' : `text-white bg-${task.color}`
        return `issue ellipsis ${a}`
      },
      weekdayClass (data) {
        //console.log("weekdayClass", data)
        return {
          'task__weekday--style': true
        }
      },
  
      dayClass (data) {
        //console.log("dayClass", data.scope.task)
        return {
          'task__day--style': true
        }
      },
  
      footerDayClass (data) {
        //console.log("footerDayClass", data)
        return {
          'task__footer--day__style': true
        }
      },
  
      /**
       * Sums up the amount of time spent for all tasks
       * between the start and end dates
       */
      totals (start, end) {
        let total = 0
        const reducer = (accumulator, currentValue) => {
          const loggedTimestamp = parsed(currentValue.date)
          if (isBetweenDates(loggedTimestamp, start, end)) {
            return accumulator + currentValue.logged
          }
          return accumulator
        }
  
        for (const task in this.tasks) {
          total += this.tasks[ task ].logged.reduce(reducer, 0)
        }
  
        return total.toFixed(2)
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
        console.log('onMoved', data)
      },
      onChange (data) {
        //console.log('onChange', data)

        //const start = parsed(this.startDate)
        let monthy = data.days[0].month  //meh this is good enough!

        console.log('onChange',monthy,this.selectedDate,data)//,data ) //this.allMonths,this.allMonths[monthy-1]
        this.selectedMonth = this.allMonths[monthy-1]

        this.startDate = data.start
        this.endDate = data.end
      },
      onClickDate (data) {
        console.log('onClickDate', data)
      },
      onClickDay (data) {
        console.log('onClickDay', data)
      },
      onClickHeadDay (data) {
        console.log('onClickHeadDay', data)
      }
    }
  })
</script>
<style lang="sass" scoped>
.header
  display: flex
  justify-content: space-between
  align-items: center
  width: 100%
  padding: 2px
  font-size: .9em
  .issue
    display: flex
    justify-content: flex-start
    align-items: center
    width: 80%
  .key
    display: flex
    justify-content: center
    width: 80px
  .logged
    display: flex
    justify-content: flex-end
    width: 80px
.summary
  display: flex
  justify-content: space-between
  align-items: center
  padding: 2px
  font-size: .9em
  font-weight: 700
  width: 100%
  .title
    display: flex
    justify-content: flex-start
  .total
    display: flex
    justify-content: flex-end
.logged-time
  display: flex
  justify-content: center
  align-items: center
  padding: 0
  margin: 0
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

@media (max-width: 500px)
  .key
    display: none
</style>

<style lang="sass">
.task__weekday--style
  font-size: 0.8em
  font-weight: 600
.task__day--style
  font-size: 0.8em
.task__footer--day__style
  font-size: 0.8em
  font-weight: 600
</style>