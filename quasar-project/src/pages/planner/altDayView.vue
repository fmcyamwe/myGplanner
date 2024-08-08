<template>
    <q-page padding>
        <div class="subcontent">
            <q-splitter
              v-model="splitterPage"
              :limits="[30, 70]"
            >
                <template v-slot:before><!-- Scheduling buttons and Legend Tree in a Horiz. splitter-->
                    <q-splitter
                    v-model="splitterLegend"
                    horizontal
                    :limits="[20, 80]"
                    style="height: 100%"
                    >
                        <template v-slot:before> <!--Scheduling buttons -->
                            <div class="q-px-md boxy">
                                <div v-if="daSchedule.getProps().showReloadBtn"> 
                                    <sched-btn
                                    text-label="Reload"
                                    class="sched-btn"
                                    text-color="green"
                                    @do-btn-action="onReloadSaved"
                                    />
                                </div>
                
                                <div v-if="daSchedule.getProps().showClearBtn">
                                  <sched-btn
                                  text-label="Clear"
                                  class="sched-btn"
                                  text-color="lime-5"
                                  @do-btn-action="onClearDay"
                                  />
                                </div>
                
                                <div v-if="daSchedule.getProps().showLoadDefaults"><!--disable instead of hiding?!? meh -->
                                  <sched-btn
                                  :textLabel="defaultLabels"
                                  class="sched-btn"
                                  text-color="blue"
                                  @do-btn-action="onLoadDefault"
                                  />
                                </div>
                
                                <div v-if="daSchedule.getProps().showScoreBtn">
                                  <drop-dwn-btn
                                  class="sched-drop-btn"
                                  text-color="teal"
                                  :disableBtn="daSchedule.disableScoreBtn"
                                  :optionLabel="chosenScoreLabel"
                                  :daOptions="scoreOptions"
                                  @do-reload="doReloadWithScore"
                                  @choose-option="onChoosenScore"
                                  />
                                </div>
                                <div v-if="daSchedule.getProps().showPrioBtn">
                                  <drop-dwn-btn
                                  class="sched-drop-btn"
                                  text-color="teal"
                                  :disableBtn="daSchedule.getProps().disablePrioBtn"
                                  :optionLabel="chosenPrioLabel"
                                  :daOptions="allMainGPrio()"
                                  @do-reload="doReloadWithPrio"
                                  @choose-option="onChoosenPrio"
                                  />
                                </div>
                
                                <div v-if="daSchedule.getProps().showOneEachBtn"><!--disable instead of hidding?-->
                                  <sched-btn
                                  text-label="One Each"
                                  class="sched-btn"
                                  text-color="brown"
                                  @do-btn-action="onScheduleOneEach"
                                  />
                                </div>
                            </div>
                            <div class="row justify-center">
                                <q-btn
                                class="q-mt-md"
                                :text-color="saveScheduleDisabled ? 'grey' : 'blue' "
                                elevated
                                push
                                align="evenly"
                                label="SaveSchedule"
                                :disable="saveScheduleDisabled"
                                @click="doSaveSchedule"
                                no-caps
                                />
                                
                                <q-btn
                                class="q-mt-md"
                                text-color="green"
                                elevated
                                push
                                align="evenly"
                                label="TreeLegend"
                                @click="showTree = !showTree"
                                no-caps
                                />
                              </div> 
                              <br>
                        </template>
                        <template v-slot:after> <!--legend tree + jeSuis-->
                            <br>
                            <div v-if="treeGoals.length > 0" class="q-pa-sm bg-grey-12" style="max-width: 400px">
                                <div class="q-pa-sm row justify-center">
                                  {{labelGoals('s')}} 
                                </div>
                                <div class="row justify-center"> 
                                  <q-badge color="secondary" multi-line>
                                    {{labelGoals('b')}} mins
                                  </q-badge>
                                </div>
                                
                                <q-separator />
                                <br>
                                <!--<q-space/> have to be inside qComponent-->
                    
                                <!--oldie but q-select below better
                                  <q-input ref="filterRef" filled v-model="filter" label="Filter" class="q-pa-md q-gutter-sm">
                                  <template v-slot:append>
                                    <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
                                  </template>
                                </q-input> 
                  
                                huh suprised that isViewingPast() works below!
                                -->
                                
                                <div v-if="showTreeForm" class="q-gutter-md">
                                  <q-select
                                  label="'je-suis'"
                                  hint="Keyword >> Enter"
                                  hide-hint
                                  ref="filterRef"
                                  
                                  v-model="filter"
                                  use-input
                                  use-chips
                                  multiple
                                  :disable="isViewingPast()"
                                  hide-dropdown-icon
                                  input-debounce="0"
                                  new-value-mode="add-unique"
                                  class="q-gutter-sm"
                                  >
                                    <template v-slot:selected-item="scope">
                                      <q-chip
                                        removable
                                        dense
                                        @remove="scope.removeAtIndex(scope.index)"
                                        :tabindex="scope.tabindex"
                                        text-color="black"
                                        class="q-ma-none"
                                        style="width:80px"
                                      >
                                        {{ scope.opt }}
                                      </q-chip>
                                    </template>
                                    <template v-slot:append>
                                      <q-icon v-if="filter.length > 0 " name="clear" class="cursor-pointer" @click="resetFilter" />
                                    </template>
                                  </q-select>
                  
                                 <q-tree
                                  :nodes="treeGoals"
                                  node-key="label"
                                  :filter="filterString"
                                  :filter-method="myFilterMethod"
                                  v-model:expanded="expanded"
                                  no-connectors
                                  dense
                                  ><!-- 'default-expand-all' but too much -->
                                  <template v-slot:default-header="prop">
                                      <div :class="classyColor(prop.node)">
                                        <q-icon v-if="!prop.node.isChildren" :name="prop.node.icon || prop.expanded ? 'expand_less' : 'expand_more'" size="28px" right/>
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
                                <!--
                                  :on-remove="resetFiltery"  >> even with filterResults as Set or Map, issue with proper update when removed a mood
                                  --oh well gotta filter again smh
                                  
                                  :name="prop.node.icon || 'arrow'"
                                  class="q-mr-sm bg-red" 
                                  color="red"
                                -->
                                <div v-if="filter.length > 0" class="q-pa-md q-gutter-sm bg-grey-12" style="max-width: 400px">
                                  <sched-btn
                                  text-label="Add Moods"
                                  class="q-mt-xl sched-btn"
                                  text-color="red"
                                  @do-btn-action="onMoodAdd"
                                  />
                                </div>
                              </div>                    
                        </template>
                    </q-splitter>
                </template>

                <template v-slot:separator>
                    <q-avatar color="primary" class="q-px-md" text-color="white" size="40px" icon="drag_indicator" style="position: relative; top: 70%;"/> <!--nudge this down by 70 percent...huh-->
                </template>

                <template v-slot:after><!-- Calendar and dialogs...-->
                    <navigation-bar
                    @today="onToday"
                    @prev="onPrev"
                    @next="onNext"
                    />

                    <div v-if="scheduleMoodsLabel !=''" class="row">
                        <q-badge color="secondary" multi-line>
                          {{scheduleMoodsLabel}}
                        </q-badge>
                    </div>

                    <div class="row justify-center">
                        <div class="q-gutter-md" style="display: flex; max-width: 800px; width: 100%; height: 600px;">
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
                                      <div class="heady q-calendar__ellipsis">
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
                                      <q-tooltip>{{ '('+ event.id +') '+ event.title +' - '+ event.time + ' >> '+event.duration+'min' }}</q-tooltip>
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
                                  v-for="event in getDateEvents(timestamp.date)"
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
                                    @touchstart="(e) => onTouchStart(e, event)"
                                    @touchmove="(e) => onTouchEvt(e,event)"
                                    @touchend="(e) => onTouchEvt(e, event)"
                                    >
                                    <!-- 
                                      v-touch-hold:400:12:15.mouse="(e) => handleHold(e, event)" 
                                        on goaly-end or div above makes no diff!! but seem to log errors more in div
                                      
                                      <div class="title q-calendar__ellipsis"> -->
                                      <!--{{ event.title }}
                                      <q-tooltip>{{ event.time + ' - ' + event.details + ' :'+ event.score }}</q-tooltip> -->
                                      <!-- interfere with double click for removing when enabled..toSee if using component would help -->
                                      <!--auto-save needed but should find way to capture this as well as user could click outside popup without saving!-->
                                      
                                      <goaly-end
                                        :disabledScore="isDisabledScoreEdit[event.id]"
                                        :title="event.title"
                                        :id="event.id"
                                        :startTime="event.time"
                                        :score="event.score"
                                        :details="event.details"
                                        :notes="event.notes"
                                        :happeningNow="hasStarted[event.id] ? hasStarted[event.id] : false"
                                        @end-now="onEndNow"
                                        @save-score="onSaveScore"
                                        @add-mins="onAddMins"
                                        @delete-now="removeEvtInSchedule(event)"
                                        v-touch-hold:400:12:15.mouse="(e) => onTouchHold(e, event)"
                                        /><!--
                                          onclick="goalyClick(event)"
                                          ondblclick="goalyClick(event)"
                                          doesnt seem to work... even with @onclick
                                        -->
                                        
                                     
                                      <scoreEditDialog v-if="allowDialog[event.id]"
                                        :title="event.title"
                                        :id="event.id"
                                        :startTime="event.time"
                                        :score="event.score"
                                        :details="event.details"
                                        :notes="event.notes"
                                        :show-dialog="allowDialog[event.id]"
                                        @save-score="onSaveScore"
                                        @delete-now="removeEvtInSchedule(event)"
                                      />
                                  </div>
                                </template>
                              </template>
                          </q-calendar-day>
                        </div>
                    </div> 
                    <br>
                    <!--see about moving this outside of template--todo**-->
                    <sched-dialog v-if="addEventDialog"
                      :parentGoals="daSchedule.allPGoals()"
                      :canBeScheduled="canbeScheduled"
                      :balance="currentBalance"
                      @add-ad-hoc-event="onAddHocEvent"
                      @on-pick-event="onPickEvent"
                      @euh-hidin="closingDialog"
                    />             
                </template>
            </q-splitter>
        </div>
    </q-page>
</template>
<script>

import {
  today,
  parseDate,
  QCalendarDay,
  getDateTime,
  getDayTimeIdentifier
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarDay.sass'

import { defineAsyncComponent,ref } from 'vue' //defineComponent
import { isMobile } from '../util/isMobile'
import { applyClasses, applyStyles, whenFrmtTime } from '../util/utiFunc'
import { useQuasar } from 'quasar'  //Platform

import daySchedule  from '../../models/aDaySchedule.js'


function isLeftClick (e) {
return e.button === 0
}

export default {
name: 'altDayCalendar',
components: {
  NavigationBar: defineAsyncComponent(() => import('../../components/NavigationBar.vue')), 
  QCalendarDay,//: defineAsyncComponent(() => import('@quasar/quasar-ui-qcalendar/src/index.js')), // with loadOnDemand, craps out...
  GoalyEnd: defineAsyncComponent(() => import('../../components/planner/goalyEnd.vue')),
  schedBtn: defineAsyncComponent(() => import('../../components/planner/schedBtn.vue')),
  dropDwnBtn: defineAsyncComponent(() => import('../../components/planner/dropDwnBtn.vue')),
  schedDialog: defineAsyncComponent(() => import('../../components/planner/schedDialog.vue')),
  scoreEditDialog: defineAsyncComponent(() => import('../../components/planner/onScoreEditDialog.vue')),
},
data () {
    let possibleRange = null //for adhoc scheduling...keep track of selected time range

    let intervalId = null
    const $q = useQuasar()

    const currentTime = ref(null) //needed?!? toReview***

    const selectedItem = ref(null)  //draggedItem //whether (touch/drag)
    const targetDrop = ref(null)

    const touchedItem = ref(null) //for touch mobile elt

    return {
        splitterPage: ref(35), // start--left side--before at 35%
        splitterLegend:ref(40),
        timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update
        
        //umm below into daySchedule class too? tbd***
        showTree: ref(false), //showing Legend Tree
        treeGoals:ref([]), 
        expanded:ref([]), //to hold expanding pGoal nodes...
        filter : ref([]),
        filterRef : ref(null),

        calendar: ref(null),

        isDisabledScoreEdit:ref({}),
        hasStarted:ref({}),  //just for happening now..should combine with isDisabledScoreEdit var above!
        mobileEnableScore:ref({}), //reverse of isDisabledScoreEdit...mobile and should be dynamically set when touch-repeat....
        allowDialog:ref({}),//non mais c'est fou lala! for showing mobile dialog still

        addEventDialog: ref(false), //rename to showEvtDialog---

        /*showReloadBtn:ref(false),
        showClearBtn:ref(false),
        showLoadDefaults:ref(true),
        showScoreBtn:ref(false),
        showPrioBtn:ref(false),
        showOneEachBtn:ref(false),

        disablePrioBtn: ref(true),  //to temp disable when selecting a new value...
        disableScoreBtn: ref(true),
        chosenScore:ref(null),
        chosenPrio:ref(null),*/

        currentDate: ref(today()), //toSee about moving in daySchedule class too ***
        scoreOptions:ref([1,2,3,4,5,6]), //no need for this in class prolly...
        
        anchorTimestamp: ref(null), //start time for range
        otherTimestamp: ref(null),   //end time for range...
        mouseDown: ref(false),
        mobile: ref(true),

        //daSchedule:ref(new daySchedule("euuh")), //gets created!
        daSchedule:ref(null) //huh updates!!
    }
},
beforeMount() {
    this.mobile = isMobile()

    this.daSchedule = new daySchedule("ouiii",this.currentDate)

    //console.log('beforeMount:',this.anotherSched.getData(),this.anotherSched.getAllPrio()) //,this.daSchedule.chosenPrioLabel()

    //so yeah have to use getters for every field i.e:those showBtns !!!

    //this.daSchedule.fetchDaySchedule(this.currentDate) >>works at least!!

    //this.resetGoalEvts(true) //no need!!

    this.constructTree()
},
mounted() {
  this.adjustCurrentTime()
  // adjust the time every minute
  this.intervalId = setInterval(() => {
      this.adjustCurrentTime()
  }, 60000)
},
beforeUnmount() {
  clearInterval(this.intervalId)
},
computed: {
    chosenScoreLabel() {  //updates!!
        //return this.chosenScore == null ? `By Score` : `Score >= ${this.chosenScore}`
        //console.log('chosenScoreLabel:',this.anotherSched.chosenScoreLabel(),this.anotherSched.chosenScoreLabel()) 
        return this.daSchedule.chosenScoreLabel() //daySchedule.
    },
    chosenPrioLabel() {  //updates!!
        //return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
        //console.log('chosenScoreLabel:',this.anotherSched.chosenPrioLabel(),this.anotherSched.chosenPrioLabel()) 
        return this.daSchedule.chosenPrioLabel() //daySchedule
    },
    style () {
        return {
            top: this.timeStartPos + 'px'
        }
    },
    defaultLabels(){
        let e = this.daSchedule.getSubGoals()
        //todo filter below***
        //this.allEvents.filter(evt => evt?.inDefaults && evt?.time != '' && !this.scheduledEvents.find(x => x.id == evt.id)).length
        return  e > 0 ? e+ " Defaults" : "Defaults"
    },
    saveScheduleDisabled(){
      return this.daSchedule.saveBtnEnabled() //this.disableSaveSchedule 
    },
    showTreeForm() {
        if (!this.showTree) {this.constructTree()}//umm still needed?!? toReview***
        return this.showTree
    },
    filterString(){ //sigh..did it just work better after placing at end of computed?!? >>dont work in methods section >> AT LEAST updates esti!!
        return this.filter.join()
    },
    currentBalance(){ //updates?
        return this.daSchedule.getCurrentBalance()
    },
    canbeScheduled(){
      let e = this.daSchedule.getSubGoals() //deepcopy?

      console.log('canbeScheduled', JSON.parse(JSON.stringify(e)))

      return e
      //todo***
      /*let difference =  e.filter(x => !this.scheduledEvents.find(item => item.id == x.id)); // these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1

      console.log('canbeScheduled difference is', JSON.parse(JSON.stringify(difference)))

      //oldie >> id...prolly better to use parentGoal for grouping instead of id as subG can be added/removed.
      //--mais bon could end up with subGs out of order of creation...meh
      //ALSO with randomize id generation,latest might not have higher id than earlier goal!!
      let sorty = (a, b) => { 
        if (a.parentGoal > b.parentGoal) return 1; 
        if (a.parentGoal == b.parentGoal) return 0; 
        if (a.parentGoal < b.parentGoal) return -1;
      }

      if (difference.length == 0) { 
        e.sort(sorty)
        //console.log('canbeScheduled no difference', difference.length, e.length)
        return e
      }

      difference.sort(sorty)

      //console.log('canbeScheduled AFTER sort ',JSON.parse(JSON.stringify(difference)))

      return difference*/
      
    },
    scheduleMoodsLabel(){
        //TODO**
        return ''
    },
    startEndTimes() { 
        const dates = []
        if (this.anchorDayTimeIdentifier !== false && this.otherDayTimeIdentifier !== false) {
        if (this.anchorDayTimeIdentifier <= this.otherDayTimeIdentifier) {
            //console.log("startEndTimes..anchor <= otherDayTime",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp))
            dates.push(getDateTime(this.anchorTimestamp), getDateTime(this.otherTimestamp))
        }
        else {
            //console.log("startEndTimes..otherDayTime <= anchor",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp))
            dates.push(getDateTime(this.otherTimestamp), getDateTime(this.anchorTimestamp))
        }
        }
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
    eventsMap () {
      
      //let b = 
      //const map = {}
      return this.daSchedule.currentSchedEventsMap()//forEach(event => {

      //console.log(`eventsMap multiple `,b)
      //return b
    }
},
methods:{
    adjustCurrentTime() {
      const now = parseDate(new Date())

      //console.log("adjustin...", this.currentDate, now)
      if (this.currentDate !== now.date){  //caused a jump back to current day smh
        //console.log("Not adjustin...", this.currentDate, now.date)
        this.timeStartPos = -10 //when null, doesnt change smh and 0 still shows...toMonitor if need to remove interval
        this.currentTime = ''
        return
      }
    
      this.currentDate = now.date 
      this.currentTime = now.time //'00:52'
      this.timeStartPos = this.$refs.calendar.timeStartPos(now.time, false)  
      //the above dont update in view >>cause was not in return!!


      //let hasEnd = (this.endTimesSet && this.endTimesSet.has(now.time))
      //let hasStart = (this.startTimesSet && this.startTimesSet.has(now.time))
      //if(hasEnd || hasStart){
        //console.log("sameStart/END..FOUND", this.currentTime,hasEnd, hasStart)
        //this.doEnableEndNowBtn(this.currentTime,hasEnd, hasStart)
      //}
    },
    hasDate (days) { //umm why again?!? for current time line? toTest*** when removed!
        return this.currentDate
        ? days.find(day => day.date === this.currentDate)
        : false
    },
    getDateEvents (dt) {
    
      //const events = this.anotherSched.currentSchedEventsMap()[dt] || []
      //const o = 
      return this.daSchedule.getDateEvents(dt)  //|| []
      // this.anotherSched.testEvts()
      
      //console.log("ALT::getDateEvents>>",dt, events,o)

      //return events //this.anotherSched.getDateEvents(dt)
    },
    constructTree(){
        this.treeGoals = this.daSchedule.fetchGoalsTree()
    },
    resetGoalEvts(){ //redundant flag = false
        return this.daSchedule.getSubGoals()//.getAllGoals()
    },
    allMainGPrio(){
     return this.daSchedule.getAllPrio()
    },
    resetFilter () {
        this.filter = []
        this.filterRef?.focus() //umm gotta ?. //oldie >> filterRef.value.focus()
    },
    myFilterMethod (node, filter) { // for mood filtering...calld on each node!!
   
        if (node.isChildren && node?.moods.length > 0){
            //console.log("myFilterMethod>> "+ node.id, node?.moods,filter) //,this.filter
            const filt = this.filter.map(e => e.toLowerCase()) //oldie..cannot use 'filter' var as it's a string here smh  
            let match = node?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1)//umm prolly good idea to lowerCase both!! 
            //if (match){console.log("myFilterMethod>>ooouh match "+node.id,node?.moods)} //this.filterResults.push(node.id);
            return node.label && match //node?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1) 
        }
    },
    labelGoals(code){
        let total = 0
        
        if (code == 's'){
        //umm overkill? >> yup! >> could just count this.storedEvents....
        //console.log("labelGoals",this.storedEvents.length, JSON.parse(JSON.stringify(this.treeGoals)))
        for(const index in this.treeGoals) { 
                let pG = this.treeGoals[ index ]
                //console.log("goally",pG)
                total += pG.children.length //.reduce(reducer, 0)
        }

        //return `Scheduled => ${this.scheduledEvents.length} out of ${total} \n`
        
        let e = this.daSchedule.getSubGoals() //toREDO wrong**
        return `Scheduled => ${e.length} out of ${total} \n`
        }
        return `Balance: ${this.currentBalance ? this.currentBalance : 0} \n`
    
    },
    badgeClasses (event, type) {
        return applyClasses(event, type)
    },
    badgeStyles (event, type, timeStartPos = undefined, timeDurationHeight = undefined) {
        return applyStyles(event, type, timeStartPos, timeDurationHeight)
    },
    classyColor(proppy){//bg-{color} or text-{color} in class
        return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
    },
    isViewingPast(){
      return this.daSchedule.isViewingPast()
    },
    onMoodAdd(){
        console.log('onMoodAdd')
        //TODO**
    },
    onReloadSaved(){
        console.log('onReloadSaved')
        /*let hasEvents = this.hasEventsForDate 
        //console.log('doReloadSaved:',this.currentDate,conflicts, hasEvents)

        let doCancel = () => {
            console.log('Aborting', this.currentDate,this.scheduledEvents, hasEvents)
            this.showReloadBtn = !this.isViewingPast() || hasEvents //toTest**
        }
        let doOverwrite = () => {
        this.scheduledEvents = []
        this.updateCurrentSchedule()
        this.loadForDate(this.currentDate, hasEvents, this.isViewingPast())
        this.reset() //reloadSaved
        }

        if (this.scheduledEvents.length > 0 && !this.isViewingPast()){
        let mess = hasEvents ? "Reload? saved schedule of: "+this.currentDate : "Overwrite current Evts?"
        this.confirmAction(mess,"OK", doOverwrite, doCancel)
        } else {
        doOverwrite()
        } 

        this.showReloadBtn = false
        this.showClearBtn = !this.isViewingPast() 
        */
    },
    onClearDay(){
        console.log('onClearDay')
        /*if(this.isViewingPast()){
        this.doNotify("Editing past is no no!") //should confirm instead?!?meh
        return
        }

        let hasSaved = this.hasEventsForDate

        this.scheduledEvents = []
        this.updateCurrentSchedule()
        this.resetGoalEvts(true)
        let mess = hasSaved ? `Cleared...Can still reload saved` : `Cleared daily schedule`
        this.doNotify(mess, "warning",'top')
        
        //reset?!?
        this.reset() //clearDay

        this.showReloadBtn = hasSaved
        this.showLoadDefaults = true
        this.showClearBtn = false //hide btn of course
        this.disableSaveSchedule = !hasSaved  //enable if hadSavedEvts! 
        */
    },
    onLoadDefault(){
        console.log('onLoadDefault') //this.daSchedule.showyReloadBtn() || this.daSchedule.showReloadBtn
        //this.daSchedule.toggle()
        //this.daSchedule.showReloadBtn=!this.daSchedule.showReloadBtn
      /*let doCancel = () => {
          console.log('Aborting', this.currentDate) //,this.scheduledEvents
          //this.showReloadBtn = !this.isViewingPast() || this.hasEventsForDate  //toTest**
      }

      let doOk = (flag) => {
        this.scheduleDefaults(flag)
      }

      if (this.scheduledEvents.length > 0){
        let e = this.unscheduledDefaults()
        //console.log('unscheduledDefaults', e?.length) //e
        
        let labels = [
          {label: `Add ${e?.length} Default Evts to current day schedule`,value: 'add'}, //or check for undefined?
          {label: `Overwrite and only schedule Defaults`,value: 'overwrite'}
        ]
        this.radioChoiceDialog('Warning!!',
        `Date: ${this.currentDate} already have scheduled Events...`,
        labels, 
        '',
        function(d){doOk(d)}, 
        doCancel)
      } else {
        doOk('overwrite')
      }*/
    },
    onChoosenPrio(e){
        console.log('choosePrio',e,this.daSchedule.chosenPrio)
        
        this.daSchedule.onChoosenPrio(e)  //updates?!? toSee**

        /*
        let oldy = this.chosenPrio
        if (oldy && oldy == e){
            this.disablePrioBtn = true //.user should not reclick without changing it again...
        }else {
            this.chosenPrio = e
            this.disablePrioBtn = false
        }*/
    },
    onChoosenScore(e){
        console.log('chooseScore',e)
        this.daSchedule.onChoosenScore(e)  //updates?!? toSee**
        /*let oldy = this.chosenScore
        if (oldy && oldy == e){
            this.disableScoreBtn = true //user should not reclick without changing it again...
        }else {
            this.chosenScore = e
            this.disableScoreBtn = false
        }*/
    },
    onScheduleOneEach(){
        console.log('onScheduleOneEach ')
        /*if (this.scheduledEvents.length > 0) {
            let labels = [
            {label: `Add one Evt from Each parent Goals`,value: 'add'},
            {label: `Overwrite current with one random Evt from Each parent Goals`,value: 'overwrite'}
            ]

            this.radioChoiceDialog('Warning!!',
            `Date: ${this.currentDate} already have scheduled Events...`,
            labels,
            '',
            this.scheduleOneEach, //onOk
            function(){console.log('One of Each....Aborting')} //cancel
            )
        } else{ //nothing scheduled--just overwrite
            this.scheduleOneEach('overwrite')
        } */
    },
    doReloadWithPrio(){
        console.log('doReloadWithPrio')
       /* if (this.chosenPrio == null) { //kinda redundant with disable flag...mais bon just in case...
            this.doNotify("Ayo select a priority!")
            return
        }

        let doCancel = () => { //do cancel is merge here maybe?!? TBD
            console.log('doReloadWithPrio..cancelling') //this.scheduledEvents
            this.reset() //reloadWithPrio
            return
        }

        if (this.scheduledEvents.length > 0){
        let labels = [
            {label: `Filter current Evts by priority == ${this.chosenPrio}`,value: 'filter' }, //false  //cannot pass false as empty string evaluates to it...smh!
            {label: `Add to schedule Evts with priority == ${this.chosenPrio}`,value: 'add'},
            {label: `Overwrite current and schedule All of priority == ${this.chosenPrio}`,value: 'overwrite'}
            ]
        
        this.radioChoiceDialog('',
        "Schedule change...",
        labels,
        '',
        this.scheduleSamePrio,
        doCancel)

        }else{ //no scheduled> just overwrite
        this.scheduleSamePrio('overwrite')
        }

        this.showDefaultBtn(this.isViewingPast()) 
        this.disablePrioBtn = true //not allow reclick without changing prio again...
        */
    },
    doReloadWithScore(){
        console.log('doReloadWithScore')
        /*if (this.chosenScore == null) {
        this.doNotify("Ayo select a score!")
        return
        }

        let doCancel = () => { //do cancel is merge here maybe?!? TBD
        console.log('doReloadWithScore..cancelling',this.scheduledEvents)
        this.reset() //reloadWithScore
        return
        }

        if (this.scheduledEvents.length > 0) {
        let labels = [
        {label: `Filter current Evts by Interval Score >= ${this.chosenScore}`,value: 'filter'}, //false  //cannot pass false as empty string evaluates to it...smh!
        {label: `Add to schedule Evts with Interval Score >= ${this.chosenScore}`,value: 'add'},
        {label: `Overwrite current and schedule All of Interval Score >= ${this.chosenScore}`,value: 'overwrite'}
        ]

        //huh works without using function literal!!--niice  this.reloadEvtsWithScore
        this.radioChoiceDialog('',
        "Schedule change...",
        labels,
        '',
        this.scheduleByScore, 
        doCancel) //function(d){console.log('OK ReloadWithScore', d);reloadEvtsWithScore(d)}

        } else{ //no scheduled--just overwrite
        this.scheduleByScore('overwrite')
        }

        this.showDefaultBtn(this.isViewingPast())

        this.disableScoreBtn = true //no reclick without changing score again...
        */
    },
    doSaveSchedule(){
        console.log('doSaveSchedule')
        /*let toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
    
        if (this.dailyScheduled.size < 1){ //clearing day
        toSave = null 
        } else {
        this.dailyScheduled.forEach( (value, key, map) => {
            toSave[key] = {  //minimalistic
            //id: key,
            //date: value.on, //redundant
            time: value.start.time,
            duration: value.for,
            //originalAt: value.originalAt,
            //atScore: value.score  //should save this? >>see below
            }
            //for isViewingPast..?>>bof

            if(this.usingMoods[key]){
            toSave[key].byMood = this.usingMoods[key]
            }
            if(value.notes !== void 0 && value?.notes !==''){
            console.log("doSaveSchedule",key, value?.notes,toSave[key].atScore, value?.score)
            toSave[key].atScore = value?.score  // toSave[key].atScore || value?.score ?!?
            toSave[key].notes = value?.notes
            ////umm overwrite old atScore..prolly? tbd**
            }
        })
        }

        //console.log("doSaveSchedule", JSON.parse(JSON.stringify(toSave)))
        this.store.saveDailySchedule(this.currentDate, toSave) 
        this.disableSaveSchedule = true 
        this.showReloadBtn = false
        this.showClearBtn = toSave != null //to clear...maybe...

        this.doNotify(`Schedule saved for ${this.currentDate}`, "positive", "top")

        return */
    },
    doDroppy(from, targetDrop, draggedItem){
      //console.log("doDroppy: "+from,targetDrop, draggedItem)//.duration,draggedItem.time)

      if(targetDrop && draggedItem){
        //todo** using schedule class!!
        let isClose = this.daSchedule.tooClose(targetDrop, draggedItem.duration)
        if(isClose){
          console.log("doDroppy::tooClose to>>",isClose) //could happen when dropping next to scheduled...
          if(isClose === true){
            this.doNotify("Dropping event TOO close to midnight!")
            this.reset() //onDrop
            return
          }
        }

        let canDrop =  this.daSchedule.dropEvent(targetDrop, draggedItem)
        //hasOverlappingEvent(draggedItem.id, targetDrop, draggedItem.duration)
       
        console.log("doDroppy: "+from,canDrop,draggedItem)
        if (canDrop.canDrop){ //&& canDrop.overlaps == null){
          let askUser = draggedItem?.inDefaults || !draggedItem?.canMove 
          //maybe check other flags?!? toTry later!!
          if (askUser){
            let mess = [`Evt "${draggedItem.title.trim()}" Aint move from ${whenFrmtTime(draggedItem.time)}.\n\u2800\n`,"\n\u2800\n",
            `Also Move time to ${whenFrmtTime(targetDrop.time)}? \n\u2800\n`,"\n\u2800\n",
            "Cancel or Dismiss to undo!\n\u2800\n","\n\u2800\n",
            `No selection to add at default ${whenFrmtTime(draggedItem.time)}`
            ].join('\n')

            const c = this.daSchedule  //huh works for below to keep context!!
            this.confirmTimeChange("Moving Evt's time",
              mess, 
              "Change", //okBtn
              `Temp.Move`,//`Temp.${doAdd ? 'Add':'Move'}`, //altbtn //oldie >>"Temp.Move"
              function(d){c.changeEvtTime(draggedItem, targetDrop,d)}, //onOk  //userChoice(d,evt,doAdd)
              function(){console.log(`changeEventTime::onCancel..>doing nothing for ${draggedItem.id})'${draggedItem.title.trim()}'`)}, //;keepAsIs() //doUpdateEvt()  //shouldnt cancel/dismiss NOT schedule?!?
              function(){console.log(`changeEventTime::onDismiss..keep as is>> ${draggedItem.id})'${draggedItem.title.trim()}'`)}//;keepAsIs(evt,doAdd)} //.scheduling at default time`);keepAsIs() 
              //onDismiss/...should prolly remove it actually!--or leave at default time?!?
              ) 

          }else{ //skip asking user...
            this.daSchedule.changeEvtTime(draggedItem, targetDrop,false)
          }
        
        }else{//else handle .overlaps
           console.log("doDroppy::can NOT Drop",canDrop)
        }
        

        //umm what about recurChangeTime ?!? smh ..toSee***

      } else{
        console.log("doDroppy null ERROR?", targetDrop,this.targetDrop, draggedItem, this.selectedItem )
        return
      }
    },

    reset() { //reset variable for next use 
      this.selectedItem = null
      this.targetDrop = null
      this.touchedItem = null 
      //
      //this.chosenScore = null
      //this.chosenPrio = null

      this.possibleRange = null 
    },
    /////Event handlers ///////////

    closingDialog(){// close dialog
      //use class---todo**
      this.addEventDialog = false
      //this.reset() //just in case...toSee if not too much...
    },
    onPickEvent(addE,skipAsk,useBalance) { 
        console.log('onPickEvent',addE,skipAsk,useBalance)
    },
    onAddHocEvent(goalTitle, parentGoal, own, interval){
        console.log('onAddHocEvent',goalTitle, parentGoal, own, interval)
    },
    onEndNow(id){
        console.log('onEndNow',id)
    },
    onSaveScore(newScore, id,note=''){
        console.log('onSaveScore',newScore, id,note)
    },
    onAddMins(id,mins){
        console.log('onAddMins',id,mins)
    },
    removeEvtInSchedule(evt){
      console.log('removeEvtInSchedule',evt)
    },
    onPrev(){
        this.$refs.calendar.prev()
    },
    onToday(){
        this.$refs.calendar.moveToToday()
    },
    onNext(){
        this.$refs.calendar.next()
    },
    onChange(){
      //console.log('ALT::onChange', this.currentDate)
      this.daSchedule.onChangeViewDate(this.currentDate)
    },
    onDragStart(e, item) {
      //console.log('onDragStart',e,item)
        
      if(this.daSchedule.isViewingPast()){
        this.doNotify("Editing past is no no!")
        e.preventDefault()        
        return
      }

      //keep track of moved
      this.selectedItem = item
     
    },
    onDragEnter(e, type, scope){
       // console.log('onDragEnter',e, type, scope)
      if(type === 'goal-item'){
        //console.log('onDragEnter..goal-item',e, scope) 
        // scope is undefined here hence saving it below
        e.preventDefault()
      } else {
        //ABSO necessary to save this as it's the last position before potential overlap with goal-item!
        //but not precise enough

        //let target = document.elementFromPoint(e.clientX, e.clientY)
        //console.log('onDragEnter...calendar', target) //e,type,scope

        this.targetDrop = scope
        e.preventDefault()
      }
      return true
    },
    onDragOver(e, type, scope){ //fires lot
        //console.log('onDragOver')
        e.preventDefault() //to allow drop

        return true
    },
    onDragLeave(e, type, scope){
        return false  //what if true?!?
    },
    onDragEnd(e){//umm why thig again? //can use to do cleanup maybe?
    },
    onDrop(e, type, scope){
      //console.log('onDrop',e, type, scope)

      let d = this.daSchedule.findSchedEvent(this.selectedItem.id)
      
      if (!d) {console.log("onDrop ERROR", d,this.selectedItem ); return}

      let targetTimey = null

      if (type === 'interval') {
        //console.log("onDrop to time-interval", scope.timestamp.time,draggy.title.trim(),draggy.time)
        targetTimey = scope.timestamp
      } else {
        if(type === 'goal-item' && this.targetDrop){ //check targetDrop in case didnt drag much and still in same spot
          //console.log("Dropping goal-item!!", type, this.targetDrop.timestamp) //,e, //scope is undefined here
          targetTimey = this.targetDrop.timestamp
        } else {
          console.log("Cannot drop here YO!!",e, type, scope, this.targetDrop) //shouldnt happen? >>could if dropping too high in header as if going to prev/next day
          return
        }
      }

      if (!targetTimey) {console.log("ERROR...no timestamp YO!!",e, type, scope, this.targetDrop); return}
      
      this.doDroppy("onDrop",targetTimey, this.selectedItem)

    },
    onClickTime(data){
      //console.log('onClickTime',data)
      this.addEventDialog = true
      
      //save the data to use later when checking that it can be scheduled!
        this.targetDrop = data.scope
    },
    onClickDate(data){ //redundant--toRemove**
        console.log('onClickDate',data)
    },
    onClickInterval (data){ //redundant--toRemove**
        console.log('onClickInterval',data)
    },
    onClickHeadIntervals(data){ //same as above
        console.log('onClickHeadIntervals',data)
    },
    onClickHeadDay(data){ //same as above
        console.log('onClickHeadDay',data)
    },
    onMouseEnter(data) {
        console.log("onMouseAt", data)
    },
    onMouseLeave(data) { //this fires!
        console.log("onMouseLeave", JSON.stringify(data))
    },
    ///Mouse event handler for range selection
    onMouseDownTime ({ scope, event }) {
        //console.log('onMouseDownTime', this.mobile,{ scope, event })
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
    //this actually unfurl(destructure) the data parameter in two with those {}
    //can also further destructure keeping only needed variables with { scope: { timestamp } }
    onMouseUpTime ({ scope, event }) {
        //console.log('onMouseUpTime', this.mobile, { scope, event })
        if (this.mobile !== true && isLeftClick(event)) {
            // mouse is up, capture last and cancel selection
            this.otherTimestamp = scope.timestamp
            this.mouseDown = false
        }

        if(!this.mousedown) {
        let rangy = this.startEndTimes
        if (rangy[1] == rangy[0]){ //to keep selection range in case of adding new event ad hoc!
            //console.log("DIDNT change", rangy)
            return
        }
        this.possibleRange = rangy
        console.log('onMouseUpTime range change', this.possibleRange)
        }
    },
    onMouseMoveTime ({ scope, event }) { //fires lots! when not on top of an event!
    //console.log('onMouseMoveTime', { scope, event })
        if (this.mobile !== true && this.mouseDown === true) {
        this.otherTimestamp = scope.timestamp
        }
    },
    onDblClickEvent(e, event) {
        console.log("onDblClickEvent", event)

        e.preventDefault()
    },
    onTouchStart(e, item){
        console.log('onTouchStart', e,item)
    },
    onTouchHold(e, item){
        console.log('onTouchHold', e,item)
    },
    onTouchEvt(e, item){
        console.log('onTouchEvt', e,item)
    },
    scrollToEvent (event) {
        this.$refs.calendar.scrollToTime(event.time, 350)
    },
    doNotify(messg, colorNotif = undefined, position = 'top'){
      this.$q.notify({
        color: colorNotif !== undefined ? colorNotif : 'negative',
        position: position,
        message: messg,
        icon: colorNotif == undefined ? 'report_problem' : 'thumb_up' //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
        //group?: boolean | string | number;
        //timeout?: number; // time to display (in milliseconds)>>default is 5000
      })
    },
      //for Evts time change
    confirmTimeChange(title, mess, okbtn, altbtn, executeOk, executeCancel,executeDismiss=null){
      this.$q.dialog({
        title: title, //oldie >>'Default Time Change?' 
        message: mess,
        cancel: false, //"Temp.Add",  //issue with dismiss though....no way to NOT execute this outside click--could use noBackdropDismiss but...>>bof make if false esti!!!
        ok:okbtn, //"Change", //yes
        options: {
          type: 'radio',
          model: '', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
          // inline: true           
          items:  [
            {label: okbtn +' and '+ altbtn,value: 'ok' },
            {label: altbtn ,value: 'alt' }
          ]
        },
        class:"overflow-wrap: break-word;",
        style:""
        //overflow-wrap: break-word;
        // style:"height: 100%;"
        // position: 'bottom',
        //noEscDismiss
        //noBackdropDismiss
            
        }).onOk((data) => {
          if(data == ''){
            console.log("confirmTimeChange onOk with no selection >>onDismiss")
            this.doNotify(`No selection made...Defaulting`, "positive",'bottom') //Leaving Evt as is!
            executeDismiss ? executeDismiss() : console.log("confirmTimeChange:: No Dismiss func to execute!")
            return
          }
          return executeOk(data)
        }).onCancel(() => { //still executed when clicking outside smh....
            console.log("confirmTimeChange>> executeCancel...")
            executeCancel()  
        })
    },
}
}

</script>
<style lang="sass" scoped>
.heady
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

.my-event
  position: absolute
  font-size: 12px
  justify-content: center
  margin: 0 1px
  text-overflow: ellipsis
  overflow: hidden
  cursor: pointer

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

.boxy
  display: block
  width: 100%
  height: 100%
  border: 1px solid #888
  border-radius: 10px
  box-sizing: border-box
  box-shadow: 0 0 8px 0 rgba(0,0,0,0.25)

.sched-btn
  display: block
  width: 100%
  height: 40px
  border: none
  text-align: center
  justify-content: center
  border-radius: 0
  background-color: white
  margin: 10px 0
  cursor: pointer

.sched-drop-btn
  display: block
  width: 100%
  height: 40px
  border: none
  text-align: center
  justify-content: center
  border-radius: 0
  background-color: white
  margin: 10px 0
  cursor: pointer
</style>