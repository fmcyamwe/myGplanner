<template>
    <div class="subcontent">
      
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
              class="header ellipsis"
              style="font-weight: 600"
            >
              <div class="issue ellipsis">{{getViewedMonth}}</div>
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
                <div class="issue ellipsis">
                  {{ scope.task.title }}
                    <!--here for child, try to indent somehow...toDO**-->
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
              <div
                v-if="scope.task.children !== void 0"
                class="logged-time"
                style="font-weight: 800;"
              >
                {{ time.logged }}
              </div>
              <div
                v-else
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
    <div class="row justify-center items-center">
      <q-btn
         class="q-ma-xl"
         color="white"
         text-color="blue"
         unelevated
         to="/dayCalendar"
         label="Schedule"
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
     
      <!--<q-btn
          class="q-mt-xl"
          color="white"
          text-color="blue"
          unelevated
          to="/planner/eventSummary"
          label="Summary"
          no-caps
      /> -->
    </div>
    <div class="column justify-center items-center">
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
</template>

  <script>
  import {
    QCalendarTask,
    today,
    isBetweenDates,
    parsed,
    padNumber,
    getMonthNames
  } from '@quasar/quasar-ui-qcalendar/src/QCalendarTask.js'
  import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
  import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
  import '@quasar/quasar-ui-qcalendar/src/QCalendarTask.sass'
  
  import { defineComponent } from 'vue'
  import NavigationBar from '../../components/NavigationBar.vue'
  import { useGoalStore } from 'stores/goalStorage'
  import { useQuasar } from 'quasar'
  
  export default defineComponent({
    name: 'TaskDark',
    components: {
      NavigationBar,
      QCalendarTask
    },
    data () {
      return {
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
        $q : useQuasar() //umm $?
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
    beforeMount () {
      // adjust all the dates for the current month
      const date = new Date()
      const year = date.getFullYear()
      const month = padNumber((date.getMonth() + 1), 2)

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
      this.tasks = e //works? >>YEEEE

      console.log("weeee tasks:", this.tasks)
      
      const updateTask = task => {
        task.logged.forEach(logged => {
          // get last 2 digits from current date (day)
          const day = logged.date.slice(-2)
          //logged.
          const datey = [ year, padNumber(month, 2), padNumber(day, 2) ].join('-')
          //console.log("taks woulda been", datey, logged.date)
        })
      }
  
      this.tasks.forEach(task => {
        updateTask(task)
        if (task.children !== void 0) {
          task.children.forEach(child => { updateTask(child) })
        }
      })
    },
    methods: {
      getLogged (date, logged, extra = null) {  //extra for scope.task.title..just for logging below but prolly redundant!
        const val = []
        if (logged.length == 0){
          console.log("Empty getLogged?!?", date, extra) //just in case as should be caught at storage level
          return val
        }
        for (let index = 0; index < logged.length; ++index) {
          if (logged[ index ].date === date) {
            val.push({ logged: logged[ index ].logged })
            break
          }
        }
        return val
      },
  
      getLoggedSummary (date) {
        let total = 0
  
        const reducer = (accumulator, currentValue) => {
          if (date === currentValue.date) {
            return accumulator + currentValue.logged
          }
          return accumulator
        }
  
        for (const index in this.tasks) {
          const task = this.tasks[ index ]
          total += task.logged.reduce(reducer, 0)
        }
  
        return total
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
        return task.logged.reduce(reducer, 0)
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
        return tasks
      },
  
      weekdayClass (data) {
        return {
          'task__weekday--style': true
        }
      },
  
      dayClass (data) {
        return {
          'task__day--style': true
        }
      },
  
      footerDayClass (data) {
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
  
        return total
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

        console.log('onChange', monthy,data ) //this.allMonths,this.allMonths[monthy-1]
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
    //original Task data 
        /* {
            title: 'Task 1',
            key: 'TSK-584',
            logged: [
              { date: '2021-03-02', logged: 0.5 },
              { date: '2021-03-05', logged: 2.0 }
            ]
          },
          {
            title: 'Task 2',
            key: 'TSK-592',
            logged: [
              { date: '2021-03-06', logged: 3.5 },
              { date: '2021-03-08', logged: 4.0 }
            ]
          },
          {
            title: 'Task 3',
            key: 'TSK-593',
            logged: [
              { date: '2021-03-10', logged: 9 },
              { date: '2021-03-11', logged: 4.8 }
            ],
            expanded: false,
            children: [
              {
                title: 'Subtask 3.1',
                key: 'TSK-593.1',
                logged: [
                  { date: '2021-03-10', logged: 4.5 },
                  { date: '2021-03-11', logged: 2.4 }
                ]
              },
              {
                title: 'Subtask 3.2',
                key: 'TSK-593.2',
                logged: [
                  { date: '2021-03-10', logged: 4.5 },
                  { date: '2021-03-11', logged: 2.4 }
                ]
              }
            ]
          },
          {
            title: 'Task 4',
            key: 'TSK-594',
            logged: [
              { date: '2021-03-14', logged: 6.5 },
              { date: '2021-03-15', logged: 2.0 }
            ]
          },
          {
            title: 'Task 5',
            key: 'TSK-595',
            logged: [
              { date: '2021-03-12', logged: 1.5 },
              { date: '2021-03-18', logged: 2.0 }
            ]
          },
          {
            title: 'Task 6',
            key: 'TSK-596',
            logged: [
              { date: '2021-03-13', logged: 1.5 },
              { date: '2021-03-23', logged: 3.5 }
            ]
          },
          {
            title: 'Task 7',
            key: 'TSK-597',
            logged: [
              { date: '2021-03-19', logged: 0.75 },
              { date: '2021-03-26', logged: 2.25 }
            ]
          },
          {
            title: 'Task 8',
            key: 'TSK-598',
            logged: [
              { date: '2021-03-21', logged: 1.5 },
              { date: '2021-03-22', logged: 4.0 }
            ]
          },
          {
            title: 'Task 9',
            key: 'TSK-599',
            logged: [
              { date: '2021-03-26', logged: 6.5 },
              { date: '2021-03-27', logged: 3.5 }
            ]
          },
          {
            title: 'Task 10',
            key: 'TSK-600',
            logged: [
              { date: '2021-03-12', logged: 0.5 },
              { date: '2021-03-14', logged: 2.0 },
              { date: '2021-03-28', logged: 4.5 },
              { date: '2021-03-30', logged: 1.0 }
            ]
          }
        ],*/
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