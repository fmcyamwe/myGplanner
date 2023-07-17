<template>
  <q-page class="flex flex-center">
    <!--<img
      alt="Quasar logo"
      src="~assets/quasar-logo-vertical.svg"
      style="width: 200px; height: 200px"
    >-->
    <!--<button @click="addGoals">Add G's</button>-->
    <!--<div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/planner/addGoal"
        label="Do ADD"
        no-caps
      />
    </div> -->
    
    <!-- have to explicitly use route '/planner/daySlot' -->
    <div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/planner/daySchedule"
        label="Schedule"
        no-caps
      />
    </div>
    <div class="text-white text-center">
     <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/planner/viewGoals"
        label="Goals"
        no-caps
      />
    </div>
    <div class="text-white text-center">
      <q-btn
         class="q-mt-xl"
         color="white"
         text-color="blue"
         unelevated
         to="/planner/eventSummary"
         label="Summary"
         no-caps
       />
     </div>

    <div style="max-width: 800px; width: 100%;">
        <div class="row justify-center items-center">
        <q-separator vertical/>
        <q-btn flat dense label="Today" @click="onToday" />
        <q-separator vertical/>
        <q-btn flat dense label="Prev" @click="doCalendPrev" />
        <q-separator vertical/>
        <q-btn flat dense label="Next" @click="doCalendNext" />
        </div>
        <q-separator />
        <div style="overflow: hidden">
            <q-calendar
            ref="calendar"
            v-model="selectedDate"
            view="week"
            dark
            animated
            hoverable
            bordered
            short-weekday-label
            hour24-format
            transition-prev="slide-right"
            transition-next="slide-left"
            locale="en-us"
            style="height: 400px; overflow: hidden"
            @change="onChange"
            @click-date="onClickDate"
            @click-time="onClickTime"
            @click-interval="onClickInterval"
            @click-head-intervals="onClickHeadIntervals"
            @click-head-day="onClickHeadDay"
            />
            <!-- these events below are prolly outdate with versionwith the above ones firing properly
            @click:date2="onClickDate2"
            @click:day:header2="onClickDayHeader2"
            @click:interval2="onClickInterval2"
            @click:time2="onClickTime2"
            @click:interval:header2="onClickIntervalHeader2"

            @input="onModelChanged"
            -->
        </div>
    </div>
    <div class="scroll overflow-auto" style="height: 360px; width: 100%;">
        <div v-for="(event, index) in events" :key="index" class="col-12" style="font-size: 10px; line-height: 10px; max-height: 14px; min-height: 14px; padding: 2px 2px; white-space: nowrap;">
          {{ event }}
        </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, reactive, onBeforeMount } from 'vue'
import {
  QCalendar,
  today
  //padNumber,
 //isBetweenDates
} from '@quasar/quasar-ui-qcalendar/src/index.js'


export default defineComponent({
  name: 'MainPlanner',
  components:{
    QCalendar
  },
  /*data () {  //works but put them in refs below
    return {
      selectedDate: '',
      events: []
    }
  },*/
  setup() {
    const selectedDate = ref(today())
    const events=ref([]) //have to use .value to read/write
    const calendar = ref(null)
    const startDate = ref(today())
    const endDate = ref(today())

    //runs before stuff
    onBeforeMount(() => {
        console.log("onBeforeMount")

      // adjust all the dates for the current month so examples don't expire
      /*const date = new Date()
      const year = date.getFullYear()
      const month = padNumber((date.getMonth() + 1), 2)
      tasks.forEach(task => {
        task.logged.forEach(logged => {
          // get last 2 digits from current date (day)
          const day = logged.date.slice(-2)
          logged.date = [ year, padNumber(month, 2), padNumber(day, 2) ].join('-')
        })
      })*/
    })

    function doCalendNext () {
        //this.$refs.calendar.next() //? >> doesnt work with refs so better to use variable that is returned
        //console.log(JSON.stringify(this.events, null, 1)) //this.events not available when using data
        
        //console.log("Next clicked")
        calendar.value.next()
       //console.log(JSON.stringify(events.value, null, 1))
    }
    function doCalendPrev () {
        //this.$refs.calendar.prev() //same as Next above
        //console.log("Prev clicked")
        calendar.value.prev() 
    }
    function onChange (date) {
      //startDate.value = data.start
      //endDate.value = data.end
        //console.log("oooh changed")
        events.value.unshift(`Model changed: ${JSON.stringify(date)}`)
    }
    //function onModelChanged (date) {  //no idea when this is called...prolly deprecated
    //  console.log("Chaaanged")
    //  events.value.unshift(`Model changed: ${date}`)
    //}
    function onToday () {
        calendar.value.moveToToday()
        //events.value.unshift(`click:onToday:`) //${JSON.stringify(data)}
    }

    //The events that actually fire!-----------
    function onClickDate (data) { //The date button in format YYYY-MM-DD
      console.log('onClickDate', data)
      events.value.unshift(`click:date: ${JSON.stringify(data)}`)
    }
    function onClickTime (data) {//The slotted area to side of intervals
      console.log('onClickTime', data)
      events.value.unshift(`click:time: ${JSON.stringify(data)}`)
    }
    function onClickInterval (data) {//The interval area
      console.log('onClickInterval', data)
      events.value.unshift(`click:interval: ${JSON.stringify(data)}`)
    }
    function onClickHeadIntervals (data) { //The header area above the intervals
      console.log('onClickHeadIntervals', data)
      events.value.unshift(`click:interval:header: ${JSON.stringify(data)}`)
    }
    
    function onClickHeadDay (data) {//The header area?
      console.log('onClickHeadDay', data)
      events.value.unshift(`click:day:header: ${JSON.stringify(data)}`)
    }

    //function addGoals() {
    //  console.log("shoulda been addin...")
    //}

    return {
        selectedDate,
        events,
        calendar,
        doCalendPrev,
        doCalendNext,
        onChange,
        onToday,
        //addGoals,
        
        onClickDate,
        onClickTime,
        onClickInterval,
        onClickHeadIntervals,
        onClickHeadDay
    }
  },
  /*methods: {
    calendarNext () {
        //this.$refs.calendar.next()  //this fails 
        console.log("Next clicked")
        console.log(JSON.stringify(this.events, null, 1))
    },
    calendarPrev () {
        //this.$refs.calendar.prev()
        console.log("Prev clicked")
    },
    onModelChanged (date) {
      this.events.unshift(`Model changed: ${date}`)
      //console.log("Chaaange")
    },
    onClickDate2 (data) {
      this.events.unshift(`click:date2: ${JSON.stringify(data)}`)
    },
    onClickDayHeader2 (data) {
      this.events.unshift(`click:day:header2: ${JSON.stringify(data)}`)
    },
    onClickInterval2 (data) {
      this.events.unshift(`click:interval2: ${JSON.stringify(data)}`)
    },
    onClickTime2 (data) {
      this.events.unshift(`click:time2: ${JSON.stringify(data)}`)
    },
    onClickIntervalHeader2 (data) {
      this.events.unshift(`click:interval:header2: ${JSON.stringify(data)}`)
    }
  }*/
})
</script>
