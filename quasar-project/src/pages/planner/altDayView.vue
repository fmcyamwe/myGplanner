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
                                      <div v-if="prop.node.isChildren"> <!--onclick="klikaj('rad1')" test for maaaybe drag/drop or select..toSee-->
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
  getDayTimeIdentifier,
  parseTimestamp,
  diffTimestamp,
  addToDate
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarDay.sass'

import { defineAsyncComponent,ref } from 'vue' //defineComponent
import { isMobile } from '../util/isMobile'
import { applyClasses, applyStyles, whenFrmtTime,parseScore } from '../util/utiFunc'
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
    defaultLabels(){ //doesnt update for next day--toReview**
        let e = this.daSchedule.unscheduled()//.getSubGoals()
        
        let s = e.filter(evt => evt?.inDefaults && evt?.time != '').length// && !this.scheduledEvents.find(x => x.id == evt.id)).length
        return  s > 0 ? s+ " Defaults" : "Defaults"
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
      //let e = this.daSchedule.getSubGoals() //deepcopy? >>no need it seems....

      //let difference =  e.filter(x => !this.daSchedule.getAllEvts().find(item => item.id == x.id)) //this.scheduledEvents.find
      ///// these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1

      let diff = this.daSchedule.unscheduled()
      //console.log('canbeScheduled difference is', JSON.parse(JSON.stringify(difference)), JSON.parse(JSON.stringify(e)))

      //oldie >> id...prolly better to use parentGoal for grouping instead of id as subG can be added/removed.
      //--mais bon could end up with subGs out of order of creation...meh
      //ALSO with randomize id generation,latest might not have higher id than earlier goal!!
      let sorty = (a, b) => { 
        if (a.parentGoal > b.parentGoal) return 1; 
        if (a.parentGoal == b.parentGoal) return 0; 
        if (a.parentGoal < b.parentGoal) return -1;
      }

      if (diff.length == 0) { 
        let e = this.daSchedule.getSubGoals() //deepcopy? >>no need it seems...
        e.sort(sorty)
        //console.log('canbeScheduled no difference', difference.length, e.length)
        return e
      }

      diff.sort(sorty)

      //console.log('canbeScheduled AFTER sort ',JSON.parse(JSON.stringify(difference)))

      return diff
      
    },
    scheduleMoodsLabel(){
      let ret = ''

      let cMoods = this.daSchedule.getCurrentMoods()
      //console.log(`scheduleMoodsLabel..`,JSON.parse(JSON.stringify(cMoods))) //this.usingMoods)

      if (!Object.keys(cMoods).length > 0) {return ret }

      let aSet = new Set()
      for (let key in cMoods) { //this.daSchedule.usingMoods
        aSet.add(cMoods[key].join()) //join needed for uniqueness...or should do (*SeenNumber)?!? tbd**
        //i < 1 ? ret = ret + this.usingMoods[key] : ret = ret + ', ' + this.usingMoods[key]  //huh gotta add empty ret'' in front or single elt is as array!
        //i++ 
      }
      
      let i = 0
      for (let value of aSet){
        i < 1 ? ret = value : ret = ret + ', '+ value 
        i++ 
      }

      if (Object.keys(cMoods).length != aSet.size){ //check for size change...
        console.log(`scheduleMoodsLabel..prob change!`,JSON.parse(JSON.stringify(cMoods)),aSet, ret) //aSet, aSet.values(), 
      }
      
      return ret
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
    klikaj(e){ //test...toRemove
      console.log("klikaj...", this.currentDate, e)
    },
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
        
      if (code == 's'){//umm overkill? >> yup! >> could just count this.storedEvents....
        //toRedo** as overkill!!
          //console.log("labelGoals",this.storedEvents.length, JSON.parse(JSON.stringify(this.treeGoals)))
        for(const index in this.treeGoals) {
          let pG = this.treeGoals[ index ]
          //console.log("goally",pG)
          total += pG.children.length //.reduce(reducer, 0)
        }

        //return `Scheduled => ${this.scheduledEvents.length} out of ${total} \n`
          
        let e = this.daSchedule.getAllEvts()
        return `Scheduled => ${e.length} out of ${total} \n`
      }
      
      return `Balance: ${this.daSchedule.getCurrentBalance() || 0 } \n` //${this.currentBalance ? this.currentBalance : 0} \n
    
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
        //console.log('onMoodAdd')

        let toAddy = []
        const filt = this.filter.map(e => e.toLowerCase())

        this.treeGoals.filter(node => {
          if (node.children.length > 0){
            return node.children.find(u => {
              if(u?.moods.length > 0 && u?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1)) {
                //console.log(`onMoodAdd>>>moooo`, u)
                let n = u?.moods.filter(e => {
                  if(filt.indexOf(e.toLowerCase()) > -1) return e  //>>array
                })

                //console.log(`onMoodAdd>>>moooo`, u,n)
                //bon this seems better!!--saving mood match too...
                //oldie >> toAddy.push(u)
                toAddy.push({id: u.id, mood: n}) //huh no prob below!!
                return u
              }
            })//.map((element) => {
              //console.log(`onMoodAdd>>>filtering`, element)
              //return element  //works?!? >>nope..shows proper but doesnt return subGoal...
            //})
          }
            //node.children.length > 0 && node.children.find(u => u?.moods.length > 0 && u?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1))
        })

            //console.log(`onMoodAdd>>>toADD`,toAddy)
        if (toAddy.length > 0){
          toAddy = toAddy.filter(x => !this.daSchedule.getAllEvts().find(item => item.id == x.id)) //filter out already scheduled
          
          if(toAddy.length > 0){
            let res = this.daSchedule.scheduleByMood(toAddy)
            console.log(`onMoodAdd>>>`,filt,res,toAddy) 
            if(!res.canContinue){ //&& !anyOverlap.overlaps
              console.log("onMoodAdd::OVERLAPS?",res)
              if(res.overlaps && Object.keys(res.overlaps).length > 0){
                this.handleOverlaps(res.overlaps,null,'byMood')
              }else{ //prolly nothing?--toTest***
                this.doNotify(`Empty as no Moods :(`, "warning",'bottom')
              }
            }else{
              //allGood prolly
            }
          } else {
            this.doNotify(`Evts of Mood '${this.filterString}' already scheduled!`, "warning",'top')
          } 
        }else {
          this.doNotify(`Nothing to add :(`, "warning",'top')
        }
       
    },
    onScheduleOneEach(){

      let doAction = (flag) => {
          let res = this.daSchedule.scheduleOneEach(flag)
          console.log(`onScheduleOneEach::ACTION!!!`,JSON.parse(JSON.stringify(res)))
          if(!res.canContinue){
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'oneEach')
            }
            else{ //prolly nothing?--toTest***
              this.doNotify(`Empty for OneEach :(`, "warning",'bottom')
            }
          }
        }

      if (this.daSchedule.getAllEvts().length > 0) { //scheduledEvents.length
        let labels = [
          {label: `Add one Evt from Each parent Goals`,value: 'add'},
          {label: `Overwrite current with one random Evt from Each parent Goals`,value: 'overwrite'}
        ]

        this.radioChoiceDialog('Warning!!',
        `Date: ${this.currentDate} already have scheduled Events...`,
        labels,
        '',
        doAction,//this.daSchedule.scheduleOneEach, //onOk
        function(){console.log('One of Each....Aborting')} //cancel
        )
      } else{ //nothing scheduled--just overwrite
          //this.daSchedule.scheduleOneEach('overwrite')
          doAction('overwrite')
      }
    },
    onReloadSaved(){
      let hasEvents = this.daSchedule.hasEventsForDate()
      console.log('onReloadSaved',hasEvents)
      
      let doCancel = () => {
        console.log('Aborting', this.currentDate,this.scheduledEvents, hasEvents)
        //this.showReloadBtn = !this.isViewingPast() || hasEvents 
        //toDO and Test**
      }
      let doOverwrite = () => {
        console.log('Overwriting')
        //this.scheduledEvents = []
        //this.updateCurrentSchedule()
        //this.loadForDate(this.currentDate, hasEvents, this.isViewingPast())
        this.daSchedule.loadEvtsForDay(false) //prolly bork here?..
        this.reset() //reloadSaved
      }
      
      if (this.daSchedule.getAllEvts().length > 0 && !this.daSchedule.isViewingPast()){
        let mess = hasEvents ? "Reload? saved schedule of: "+this.currentDate : "Overwrite current Evts?"
        this.confirmAction(mess,"OK", doOverwrite, doCancel)
      } else {
        doOverwrite()
      }
      /* 
      this.showReloadBtn = false
        this.showClearBtn = !this.isViewingPast() 
        */
    },
    onClearDay(){
        console.log('onClearDay',this.daSchedule.hasEventsForDate())
        if(this.daSchedule.isViewingPast()){
          this.doNotify("Editing past is no no!") //should confirm instead?!?meh
          return
        }

        let hasSaved = this.daSchedule.hasEventsForDate()

        //this.scheduledEvents = []
        //this.updateCurrentSchedule()
        //this.resetGoalEvts(true)
        this.daSchedule.resetSchedule()
        let mess = hasSaved ? `Cleared...Can still reload saved` : `Cleared daily schedule`
        this.doNotify(mess, "warning",'top')
        
        this.reset() //clearDay

        this.daSchedule.toggleActionBtns(hasSaved,'view') //enable if hadSavedEvts! 
        /*oldie
        this.showReloadBtn = hasSaved
        this.showLoadDefaults = true
        this.showClearBtn = false //hide btn of course
        this.disableSaveSchedule = !hasSaved  //enable if hadSavedEvts! 
        */
    },
    onLoadDefault(){
      //console.log('onLoadDefault') //this.daSchedule.showyReloadBtn() || this.daSchedule.showReloadBtn
      //this.daSchedule.toggle()
      //this.daSchedule.showReloadBtn=!this.daSchedule.showReloadBtn
      let doCancel = () => {
          console.log('Aborting', this.currentDate) //,this.scheduledEvents
          //this.showReloadBtn = !this.isViewingPast() || this.hasEventsForDate  //toTest**
      }

      let doOk = (flag) => {
        //this.scheduleDefaults(flag)
        let res = this.daSchedule.scheduleDefaults(flag)
        console.log('onLoadDefault',flag,res)
        if(!res.canContinue){ //&& !anyOverlap.overlaps
            console.log("onLoadDefault::OVERLAPS?",res)
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byDefaults')
            }else{ //prolly nothing?--toTest***
              this.doNotify(`Empty as no Defaults:(`, "warning",'bottom')
            }
          }else{
            //allGood prolly
          }
      }

      let e = this.daSchedule.unscheduledDefaults() //todo** use this length instead!!

      if (this.daSchedule.getAllEvts().length > 0){ //
        //let e = this.daSchedule.unscheduledDefaults()
        console.log('unscheduledDefaults', e,e?.length) //e
        
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
      }
    },
    onChoosenPrio(e){
      //console.log('choosenPrio',e,this.daSchedule.chosenPrio)
      this.daSchedule.onChoosenPrio(e) 
    },
    onChoosenScore(e){
      //console.log('choosenScore',e,this.daSchedule.chosenScore)
      this.daSchedule.onChoosenScore(e)  
    },
    doReloadWithPrio(){
      //console.log('doReloadWithPrio')
      if (this.daSchedule.chosenPrio == null) { //kinda redundant with disable flag...mais bon just in case...
        this.doNotify("Ayo select a priority!")
        return
      }

        let doCancel = () => { //do cancel is merge here maybe?!? TBD
          console.log('doReloadWithPrio..cancelling') //this.scheduledEvents
          this.reset() //reloadWithPrio
          return
        }
        let doAction = (flag) => {
          let res = this.daSchedule.scheduleSamePrio(flag)
          console.log(`scheduleSamePrio::ACTION!!!`,res)
          //this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
          
          if(!res.canContinue){ //&& !anyOverlap.overlaps
            console.log("scheduleSamePrio::OVERLAPS?",res)
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byPrio')
            }else{ //prolly nothing?--toTest***
              this.doNotify(`Empty for Priority == ${this.daSchedule.chosenPrio} :(`, "warning",'bottom')
            }
          }else{
            //allGood prolly
          }
        }

      let currentPrio = this.daSchedule.chosenPrio

      if (this.daSchedule.getAllEvts().length > 0){ //this.scheduledEvents.length
        let labels = [
            {label: `Filter current Evts by priority == ${currentPrio}`,value: 'filter' }, //false  //cannot pass false as empty string evaluates to it...smh!
            {label: `Add to schedule Evts with priority == ${currentPrio}`,value: 'add'},
            {label: `Overwrite current and schedule All of priority == ${currentPrio}`,value: 'overwrite'}
          ]
          
          this.radioChoiceDialog('',
          "Schedule change...",
          labels,
          '',
          doAction,
          doCancel)

      } else{ //no scheduled> just overwrite
        //this.daSchedule.scheduleSamePrio('overwrite')
        doAction('overwrite')
      }

      //this.showDefaultBtn(this.isViewingPast()) 
      
      //not allow reclick without changing prio again...todo>>use toggle() function***
      this.daSchedule.disablePrioBtn = true 
     
    },
    doReloadWithScore(){
      //console.log('doReloadWithScore')
      if (this.daSchedule.chosenScore == null) {
        this.doNotify("Ayo select a score!")
        return
      }

        let doCancel = () => { //do cancel is merge here maybe?!? TBD
          console.log('doReloadWithScore..cancelling',this.daSchedule.getAllEvts())
          this.reset() //reloadWithScore
          return
        }
        let doAction = (flag) => {
          let res = this.daSchedule.scheduleByScore(flag)
          //handle overlaps?@? toSee
          console.log(`scheduleByScore::ACTION!!!`,res)
          //this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
  
          if(!res.canContinue){ //&& !anyOverlap.overlaps
            console.log("scheduleByScore::OVERLAPS?",res)
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byScore')
            }else{ //prolly nothing?--toTest***
              //this.doNotify(`Error scheduleByScore :(`, "warning",'bottom')
              this.doNotify(`Empty for Score == ${this.daSchedule.chosenScore} :(`, "warning",'bottom')
            }
        }else{
          //allGood prolly
        }
      }

      let currentScore = this.daSchedule.chosenScore
      if (this.daSchedule.getAllEvts().length > 0) { //scheduledEvents
        let labels = [
          {label: `Filter current Evts by Interval Score >= ${currentScore}`,value: 'filter'}, //false  //cannot pass false as empty string evaluates to it...smh!
          {label: `Add to schedule Evts with Interval Score >= ${currentScore}`,value: 'add'},
          {label: `Overwrite current and schedule All of Interval Score >= ${currentScore}`,value: 'overwrite'}
        ]

        
        this.radioChoiceDialog('',
        "Schedule change...",
        labels,
        '',
        doAction,
        doCancel) //function(d){console.log('OK ReloadWithScore', d);reloadEvtsWithScore(d)}

      } else{ //no scheduled--just overwrite
        doAction('overwrite')
      }

      //this.showDefaultBtn(this.isViewingPast())

      //no reclick without changing score again...
      //todo>>use toggle() function*** OR during method invoke above**
      this.daSchedule.disableScoreBtn = true
        
    },
    doSaveSchedule(){
      console.log('doSaveSchedule')

      this.daSchedule.saveDaySchedule()

      this.doNotify(`Schedule saved for ${this.currentDate}`, "positive", "top")
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

        let canDrop =  this.daSchedule.canDropEvent(targetDrop, draggedItem)
        //hasOverlappingEvent(draggedItem.id, targetDrop, draggedItem.duration)
       
        console.log("doDroppy: "+from,canDrop,draggedItem)
        if (canDrop.canContinue){ //&& canDrop.overlaps == null){
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
          this.handleOverlaps(canDrop.overlaps,true,'onDrop')
        }

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

    closingDialog(){// close dialog
      //use class---todo**
      this.addEventDialog = false
      //this.reset() //just in case...toSee if not too much...
    },
    onPickEvent(addE,skipAsk,useBalance) { 
      console.log('onPickEvent',addE,skipAsk,useBalance)
    
      this.addEventDialog = false

      if(!addE){
        console.log("onPickEvent...ERROR nothing!", addE, skipAsk,useBalance)
        this.doNotify("No Goal selected...")
        this.reset() //onPickEvent
        return 
      }



        /*let saveSchedule = () => { //redundant--toRemove**
          let inPast = this.daSchedule.isViewingPast()
          if (inPast) {
            console.log("onPickEvent...inPast auto saveSchedule",inPast)
            this.daSchedule.saveDaySchedule()//doSaveSchedule() //onPickEvent
            this.daSchedule.disableSaveSchedule = true
            return
          }

          if(overlapSizey > 0){
            console.log("onPickEvent::saveSchedule..overlaps: "+overlapSizey,'useBalance?'+useBalance)
            if (useBalance){
              let balance = this.currentBalance //balance should be negative...methink
              let neB = balance + parseInt(addy?.duration) 

              console.log("onPickEvent::saveSchedule...useBalance",balance,neB)
              this.doNotify("oooh What is Owed PAID!gg! >>"+neB,"positive",'right')
              this.store.setBalance(neB)
              this.daSchedule.saveDaySchedule()//doSaveSchedule()  //onPickEvent
              this.daSchedule.disableSaveSchedule = true
            }//else{console.log("onPickEvent::saveSchedule...not using balance or doSaveSchedule...i guess!")}
          }else {
            console.log("onPickEvent::saveSchedule...no overlaps so no auto-save!!",overlapSizey,useBalance)
            //balance already handled before when no overlaps!! 
            this.daSchedule.disableSaveSchedule = false
          }
        }*/
    
      //let addy = null
      //console.log("onPickEvent...I be picking...no need to getScheduledEvent?", JSON.parse(JSON.stringify(addE)), addy, skipAsk,useBalance)

      //let overlapSizey = 0 //to know if had overlaps...for timeout

      //if (!addy){

        //addy = addE
        
        let doForce = this.daSchedule.isViewingPast() ? true : skipAsk //inPast >>just force!!

        //console.log(`onPickEvent::(${addE.id})' ${addE.title.trim()}' from ${addE.time} to ${this.targetDrop.timestamp.time} with force?${skipAsk} BUT Forcing?:${doForce}`,this.targetDrop.timestamp)

        let isClose = this.daSchedule.tooClose(this.targetDrop.timestamp, addE.duration) //this.tooClose(this.targetDrop.timestamp, addy.duration)//could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt** 
        
        if(isClose){
          console.log("onPickEvent::tooClose check FAIL!",isClose) // check actually helps when checking overlaps below as get wrong conflicts!! 
          if(isClose === true){
            this.doNotify("Picking event TOO close to midnight!")
            this.reset() //onPickEvent
            return
          }

          if(doForce){ 
            this.doNotify(`'${addE.title.trim()}' TOO close to a scheduled Evt Buuut..FORCING!`)
          } else{
            this.doNotify(`'${addE.title.trim()}' Not added as TOO close to a scheduled Evt`)
            this.reset() ////onPickEvent
            return 
          }
        }
        
        let res = this.daSchedule.onPickEvent(addE,this.targetDrop.timestamp,doForce,useBalance)

        
        //this.handleOverlaps(res.overlaps,null,'onPickEvt')//this.fixyOverlaps(euhOverlaps,null,"onPickEvt") //onPickEvt
        if(!res.canContinue){ //&& !anyOverlap.overlaps
          console.log("onPickEvent::OVERLAPS?",JSON.parse(JSON.stringify(res)))
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            this.handleOverlaps(res.overlaps,null,'onPickEvt')
          }
          else{ //prolly nothing?--toTest***
            this.doNotify(`Error onPickEvt :(`, "warning",'bottom')
          }
        }else{
          
          //console.log("onPickEvent::NO OVERLAPS",res)
      
        }
      
      //tODO***
      //setTimeout(saveSchedule, overlapSizey > 0 ? 5000 : 0); //should invoke after some time for overlaps to allow user choice...
      
      //this.showReloadBtn = this.hasEventsForDate  //when hasSaved evts as could potentially clear schedule!
      //this.showClearBtn = !(this.isViewingPast()) //oldie >> true //prolly

    },
    onAddHocEvent(goalTitle, parentGoal, own, interval){
      //console.log('onAddHocEvent',goalTitle, parentGoal, own, interval)
      if (!this.possibleRange){
        //console.log("umm onAddHocEvent... not a range selection", this.startEndTimes)  //just in case it's single cell selction
        this.possibleRange = this.startEndTimes
      }
      if (goalTitle.trim() == ""){
        this.doNotify("Empty Goal title...")
        this.addEventDialog = false
        this.reset() //AddHocEvent
        return
      }
      
      let timeStart = parseTimestamp(this.possibleRange[0])
      //let tosee = parsed(this.possibleRange[0])
      let timeEnd = interval > 15 ? addToDate(timeStart, { minute: parseInt(interval)}) : addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15}) 
      //oldie >> 15 mins for when single timeslot selection

      //below redundant when set the interval...smh
      let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

      let isClose = this.daSchedule.tooClose(timeStart, duration)
      if(isClose){ 
        console.log("onAddHocEvent::tooClose check FAIL!!",isClose) // check actually helps when checking overlaps below as get wrong conflicts!! 
        isClose === true ? this.doNotify(`'${goalTitle}' Not added as over midnight!`) : this.doNotify(`'${goalTitle}' Not added as too close to a scheduled Evt!!`) //created But Not....
          
        this.addEventDialog = false //needed still with closingDialog?!? >> yep as reverts to default choice dialog...
        //this.reset() //no need 
        return
      }

      let subID = this.daSchedule.saveNewGoal(timeStart,goalTitle, parentGoal, own,duration)//interval

      //console.log("onAddHocEvent::NEW",subID)

      this.addEventDialog = false  //close dialog

      //then attemot to add to schedule
      if (subID) {
        //this.resetGoalEvts(true) //update from storage....
      
        /*
        let oOth = this.daSchedule.hasOverlappingEvent(subID, timeStart, timeEnd)
      
        if (oOth.length > 0) {
          let euhOverlaps={}
          for(let i = 0; i < oOth.length; i++){
            let toH = oOth[i]
            if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
              
            if(i > 0){//for using fixMultiConflicts()
              //keep in mind the obj.id is target
              
              console.log(i+" WOAH WOAH,onAddHocEvent.. multiple overlaps with same target!",oOth[i].target)//>could have multiple default that are overlapping yes!
              //ummm this where using inConflict is wrong as evt CAN overlap with two others....
              if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
              if (oOth[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",oOth[i-1].inConflict); delete euhOverlaps[oOth[i-1].inConflict] }

              if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
                
              euhOverlaps[toH.target].unshift(oOth[i-1]) //also add previous as makes sense..
              euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
            } 
          }

          console.log("onAddHocEvent:: OVERLAPS >>",JSON.parse(JSON.stringify(euhOverlaps)))
          
          //todo** handle overlaps or return euhOverlaps
          //this.fixyOverlaps(euhOverlaps,null,'addNew') //adHocEvent

          //>>using flag seem bad for now But when choosing scheduled, helps to rem evt---umm...toSee if still needed**
          //oldie >> no need for flag? >>actually yes if handling overlaps after adding -- instead of checking first!
        } else {
          let toAdd = this.addPropsEventsTo(this.currentDate,[{ //this.currentDate,
            id: subID,
            time: timeStart.time,
            title: goalTitle,
            score: '2on5',
            duration: duration,
            canMove: parentGoal ? false : true  //when pGoal then assume it cannot move otherwise should by default...prolly 
          }])
          console.log(`onAddHocEvent, addEvtPropsIntoSchedule: ${subID} at ${timeStart.time}`) //,toAdd
          
          this.addEvtPropsIntoSchedule(toAdd[0])  //this.overlapCheckEvtsAdd(toAdd) //use this instead to fix any extra overlaps--redundant as would check overlap again...prolly

        }

        this.disableSaveSchedule = false
        this.showReloadBtn = this.hasEventsForDate
        this.showClearBtn = !(this.isViewingPast())  //shouldnt show in past!

        */

       //toTest that  getSubGoalByID() update and return newest!
       /* let newey =  this.daSchedule.getSubGoalByID(subID)
        if (!newey){
          console.log(`onAddHocEvent, NOT UP 2 DATE?!!!? :(`, subID,newey) 
          
          //then try to populate with below--which would be bad!!
          //newey = { //this.currentDate,
          //  id: subID,
          //  time: timeStart.time,
          //  title: goalTitle,
          //  score: '2on5',
          //  duration: duration,
          // canMove: parentGoal ? false : true  //when pGoal then assume it cannot move otherwise should by default...prolly 
          //} 
        } //else{}
        let euhOverlaps = this.daSchedule.addGoalsToSchedule([newey])

        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`onAddHocEvent overlaps on:${this.currentDate}. overlaps =${sizey}`,euhOverlaps) 
          
          //TODO** see if no need to redo object for multiConflicts above with 'withID' flag
          //this.fixyOverlaps(euhOverlaps,null,'byMood') //onAddHocEvent
        }
        
        this.disableSaveSchedule = false
        this.showReloadBtn = this.hasEventsForDate
        this.showClearBtn = !this.isViewingPast()  //incase have other evts?!?

        this.constructTree() //update to show newest

        return euhOverlaps

        //bon toReview if shouldnt save immediately but give choice to user to add some more!!---could pass in flag above to autoSave on dismiss(when inPast!!)--same here!!
        //this.doSaveSchedule()
        */

        let res = this.daSchedule.onAdHocEvent(subID)
        
        if (!res.canContinue){ //&& !anyOverlap.overlaps
          console.log("onAddHocEvent::OVERLAPS?",res,Object.keys(res.overlaps).length)
          if (res.overlaps == null){
            this.doNotify("Error Adding this event :(", "negative")
            console.log("onAddHocEvent::ERROR?",res)
            return
          } else {  
            this.handleOverlaps(res.overlaps,null,'adHocEvt')//this.fixyOverlaps(euhOverlaps,null,"onPickEvt") //onPickEvt
          }
  
        } else{
          //console.log("onAddHocEvent::ALLGOOD",res)
          this.constructTree() //update to show newest
        }

      } else{
        console.log("BOO ERROR no subID:(",subID)
        this.doNotify("Error creating and adding this event :(", "negative")
      }

      //this.addEventDialog = false  //still have to close dialog
      //this.reset()
    },
    handleOverlaps(overlaps,override = null,from =''){
      console.log('handleOverlaps >>',JSON.parse(JSON.stringify(overlaps)),"from:"+from)

        const prioLabel = (evt,f) => {
          if (evt?.parentGoal){
            let prt = this.daSchedule.parentGoalById(evt.parentGoal) //this.parentGoalsMap().get(evt.parentGoal)
            return f ? `Of '${prt?.title.trim()}' with Prio(${prt?.priority})` : `Of '${prt?.title.trim()}'`
          }
          console.log('prioLabel..ERROR no PARENT found?',evt)
          return '' //prolly empty string //oldie >> null
        }

        const evtLabels = (anEvt,how) => {
          switch (how) {
            case 'score':
              return `${prioLabel(anEvt,false)} > "${anEvt.title.trim()}" with Score:: ${anEvt.score} = ${parseScore(anEvt.score)}`
            case 'prio':
              return `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)}`
            default:  //pickEvt
              return `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)} && Score:: ${ anEvt.score}`
          }
        }

        const aNotif = (mess) => {
          this.doNotify(mess, "positive",'top') //`Cancelling to keep "${title}"`
        }

        const updateMoodLabel = (id) => { //redundant?...toRemove**
          this.daSchedule.deleteEvtMood(id)

          this.scheduleMoodsLabel //this.scheduleMoodsLabel >>to force label update smh
        }

        const doRem = (evt) => {
          
          //umm should use >> from.indexOf('byMood') ?? >> for now it's proper methink...
          
          //updateMoodLabel(evt.id) //redundant as should be done with removeScheduledEvt() below...
          
          let hasMood = this.daSchedule.getCurrentMoods()[evt.id]

          console.log(`handleOverlaps::doRem ${evt.id}:${evt.title}`,hasMood)

          //if (this.usingMoods[evt.id]){ 
          //  let b = this.usingMoods[evt.id] //meh
          //  delete this.usingMoods[evt.id]   
          //  console.log(`fixyOverlaps::doRem>>deleting Moody...`+evt.id,b,this.scheduleMoodsLabel)//to force label update smh //JSON.parse(JSON.stringify(Object.fromEntries(this.dailyScheduled.entries())))
          //}

          //this.doRemove(evt) //fixyOverlaps
          this.daSchedule.removeScheduledEvt(evt,hasMood)
          //if(hasMood){ //redundant as well...gets updated! yee!!
            //this.scheduleMoodsLabel //this.scheduleMoodsLabel >>to force label update smh
          //}
        }

        const removeReplace = (toRem,toAdd,aConf) => { 
          //at ${toAdd.time} with ovrd:${override}`, aConf)  //aConf.targetStart.date
          console.log(`handleOverlaps::removeReplace >> replacing>> ${toRem.id}) '${toRem.title.trim()}' WITH ${toAdd.id}) ${toAdd.title.trim()}`, aConf, 'from>'+from)

          //no need line below now...toTest***
          //toAdd = this.addPropsEventsTo(aConf.targetStart.date,[{...toAdd,time:aConf.targetStart.time}]) //proper change of time
        
          if(override){
            console.log("handleOverlaps::removeReplace...OVERRIDE from>>"+from) //,JSON.parse(JSON.stringify(toAdd))
            if (from == 'onDrop'){//for consistency with okChoice....
              doRem(toRem)
              return
            }

            console.log("handleOverlaps::removeReplace....OVERRIDE updating..."+from)
            //this.updateEvtInScheduleMaps(toAdd[0].id, aConf.targetStart)
            //console.log(`handleOverlaps`,this.startTimesSet,this.endTimesSet,JSON.parse(JSON.stringify(this.scheduledEvents)))
            
            this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart)
            return
          }
        
          doRem(toRem)

          //this.addEvtPropsIntoSchedule(toAdd[0]) //could this overlap again?!? YES >>handled below

          //let euhOverlaps = this.overlapCheckEvtsAdd(toAdd) //use this instead of above to fix extra overlaps
          let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:aConf.targetStart.time}],true)

          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`${from}>handleOverlaps::removeReplace:: OVERLAPS again from adding ${toAdd.id} overlaps =${sizey}`,toAdd,JSON.parse(JSON.stringify(euhOverlaps))) // to ${toReload.length}. on:${this.currentDate} 
            
            this.doNotify(`Extra Overlaps while adding ${toAdd[0].title.trim()}`, "warning",'top')
            return this.handleOverlaps(euhOverlaps,override,from+'nah') //handleOverlaps
          }

          //let f = this.updateCurrentSchedule() //update startTimes--no overlaps check but redundant now as using overlapCheckEvtsAdd()
          //if (f.size > 0){ // handle sameStart...shouldnt get here..prolly
          //  console.log('handleOverlaps::removeReplace::SameStart?!?', f)
          //  this.fixSameStart(f) //fixyOverlaps
          //}
          return
        }

        const forceAdd = (toChange, toAdd,conf) => {
          
          //const properT = addToDate(parsed(this.currentDate), { minute: parseTime(toChange.time) }) //just to see >>meh

          console.log(`from:${from}--forceAdd: ${toAdd.id})'${toAdd.title}' at ${toAdd.time}.
          \nChanging >>${toChange.id} from ${toChange.time} `,conf.targetStart.time)
          
          //console.log(conf, properT)

          if (conf.direction !== 'surrounding'){ //this in order to limit going in circles with overlapCheckEvtsAdd()...
            console.log(`fixyOverlaps::forceAdd >> recurChangeTime...`)
            
            //this.recurChangeTime(toChange.id,toAdd,conf.targetStart, true, true)//properT //skipAsk user as should force!
            
            this.daSchedule.recurChangeTime(toChange.id,toAdd,conf.targetStart,true)
          }else{
            console.log(`handleOverlaps::forceAdd: gonna overlapCheckEvtsAdd....`)
            
            //toAdd = this.addPropsEventsTo(conf.targetStart.date,[{...toAdd,time:conf.targetStart.time}])
            //let euhOverlaps = this.overlapCheckEvtsAdd(toAdd)

            let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:conf.targetStart.time}],true)
            let sizey = Object.keys(euhOverlaps).length
            if(sizey > 0) {
              console.log(`from:${from}>handleOverlaps::forceAdd:: OVERLAPS again of size:${sizey} from > `+toAdd.title,JSON.parse(JSON.stringify(euhOverlaps)))
              
              //Note*** see with adding 'nah' that no more circles--should be less prolly with recurChangeTime()
              this.doNotify(`Extra Overlaps while adding '${toAdd.title.trim()}' `, "warning",'top')
              return this.handleOverlaps(euhOverlaps,override,from+'nah') //handleOverlaps
            }
          }

          //let f = this.updateCurrentSchedule() //update startTimes--no overlaps check >> redundant now as using overlapCheckEvtsAdd()
          //if (f.size > 0){ // handle sameStart...shouldnt get here..prolly
          //  console.log('fixyOverlaps::forceAdd::SameStart?!?', f)
          //  this.fixSameStart(f) //fixyOverlaps
          //}//else{console.log('fixyOverlaps::forceAdd::NoSAME START',f)}

          //this.disableSaveSchedule = false
          //this.showDefaultBtn(this.isViewingPast())

          this.daSchedule.toggleActionBtns(true,from)  //toSee showDefaultBtn() above needed*** 
        }

        let onOkChoice = (og,c, toAdd,currScheduled,aConf) => {
          daChoice.push(c)
          if(c == toAdd.id){
            removeReplace(currScheduled,toAdd,aConf)
            aNotif(`by ${og}, Scheduling '${toAdd.title.trim()}'`)
          } else { 
            console.log(`onOkChoice::by ${og},chose scheduled ${c} ...with override?`, override, from)
            aNotif(`by ${og}, Keeping scheduled '${currScheduled.title.trim()}'`)

            if(from.indexOf('byMood') > -1){
              console.log("handleOverlaps::onOkChoice::Moood!! updates? from: "+from,toAdd.title.trim())
              
              //updateMoodLabel(toAdd.id) //still needed? toSee***
            }

            if(override){
              doRem(toAdd)
            }
          }
        }

        let cancelChoice = (toAdd,currScheduled) => {
          if(override){
            console.log("handleOverlaps::cancelChoice::OVERRIDE...coolios!!from:"+from,toAdd.title.trim())

            if (from == 'onDrop'){ //yup on drag/drop >>cancel should just revert to original..toMonitor
              aNotif(`Umm...not moving then....`)

              this.daSchedule.toggleActionBtns(false,'view')

              //this.disableSaveSchedule = true //disable saveSchedule
              //this.showReloadBtn = false
              //this.showClearBtn = false

              return 
            }

            doRem(toAdd)  //remove is proper in other cases though?...prolly

            aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
            return 
          }

          //smh cause it never gets into doRem() and using override flag would affect removeReplace() 
          //--toTest* using 'from' check maybe
          if(from.indexOf('byMood') > -1){
            console.log("handleOverlaps::Mood!!!!updates? from: "+from,toAdd.title.trim())
            
            //updateMoodLabel(toAdd.id) //toSee if still needed***
          }
          //if (this.usingMoods[toAdd.id]){
          //  let b = this.usingMoods[toAdd.id] //just to see....
          //  delete this.usingMoods[toAdd.id]
        
            //this.scheduleMoodsLabel >>to force label update smh
          //  console.log(`fixyOverlaps::cancelChoice>>deleting Moody...`+toAdd.id,b,this.scheduleMoodsLabel) //,JSON.parse(JSON.stringify(Object.fromEntries(this.dailyScheduled.entries())))) 
          //}

          aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
        }

        let onDismissy = (mess,id) => { //,c
          //console.log(mess,'from>>'+from,daChoice,id) //JSON.parse(JSON.stringify(c))
          
          //this.showDefaultBtn(this.isViewingPast())
          //to NOT enable even when no change...
          daChoice[0] == id ? this.daSchedule.toggleActionBtns(true,from) : console.log('no change '+from,daChoice[0], id)
        }

        const resolveChoice = (opt,toAdd,currScheduled,aConf) => {
          if (opt =='opt3') { //pick Evt
            let m = 'Pick one event...'
            let labels = [
              {label: evtLabels(toAdd,'def'),value: toAdd.id, color: 'secondary' }, 
              {label: evtLabels(currScheduled,'def'),value: currScheduled.id } 
            ]

            //aRadio(opt,'',m,labels,toAdd,currScheduled,aConf)////to extract dialog!  >>meh rendering issues...can review later maybe...

            this.radioChoiceDialog('',
              m,
              labels,
              '',
              function(d){onOkChoice("Event",d,toAdd,currScheduled,aConf)}, 
              null, //second dialog shouldnt have cancel...//oldie >> function(){console.log("chooseEvt::by Event...cancelling");daChoice.push('cancel')}, //daChoice = 'cancel' //cancelChoice(toAdd,currScheduled)
              function(){onDismissy('resolveChoice::byEvent... dismissing',toAdd.id)}
            )
            //console.log("chooseEvt::by Event...returnin...",daChoice) //runs first
            //return daChoice
          } else if (opt =='opt2'){ //by Score
            let m = 'Pick event by Score'
            let labels = [ //`"${currScheduled.title.trim()}" with Score:: ${currScheduled.score} = ${this.parseScore(currScheduled.score)}`
              {label: evtLabels(toAdd,'score'),value: toAdd.id,color: 'secondary' },
              {label: evtLabels(currScheduled,'score'), value: currScheduled.id } 
            ]
            
            this.radioChoiceDialog('',
              m,
              labels,
              '',
              function(d){onOkChoice("Score",d,toAdd,currScheduled,aConf)}, 
              null, //second dialog shouldnt have cancel..
              function(){onDismissy('resolveChoice::byScore... dismissing',toAdd.id)}
            )
            //console.log("chooseEvt::by Score...returnin...",daChoice) >> dont run too fast? >>does!
            //return daChoice
          } else if (opt =='opt1'){ //by Priority
            let m = 'Pick event by Priority'
            let labels = [
              {label: evtLabels(toAdd,'prio'),value: toAdd.id, color: 'secondary' }, 
              {label: evtLabels(currScheduled,'prio'),value: currScheduled.id } 
            ]

            this.radioChoiceDialog('',
              m,
              labels,
              '',
              function(d){onOkChoice("Priority",d,toAdd,currScheduled,aConf)},
              null, //second dialog shouldnt have cancel prolly...//oldie >> function(){console.log("chooseEvt::by Priority...cancelling");daChoice.push('cancel')}, //cancelChoice(toAdd,currScheduled)
              function(){onDismissy('resolveChoice::byPriority... dismissing',toAdd.id)}
            )
            //console.log("chooseEvt::by Priority...returnin...",daChoice) >> dont run too fast? >>does!
            //return daChoice
          } else if (opt =='opt0'){ //euh...drop==opt0
            console.log("resolveChoice::it's a dropppp...keeping as is....") 
            cancelChoice(toAdd,currScheduled) //or should just do it here...toSee**
          } else{ //OPT4..FORCING.
            //console.log("chooseEvt::by forceAdd...")
            forceAdd(currScheduled,toAdd,aConf)  
          }
        }

        const manualSolve = (opts,toAdd,currScheduled,aConf,autoSolve) => { //autoSolve flag to not add force in--can result in loop!
          if (aConf.direction !== 'surrounding' && !autoSolve){ //`Force both` to schedule both evts...
            if(from.indexOf('nah') > -1){//...except when previous loop added it!
              console.log("handleOverlaps::manualSolve NOT adding Force as from "+from) 
            } else {
              opts.push({ label: `Force in '${toAdd.title.trim()}'`, value: 'opt4' })  
              // at ${when(aConf?.targetStart?.time)} >> could have changed
            } 
          } else {
            console.log("handleOverlaps::manualSolve NO force option...direction!==surrounding?",aConf.direction !== 'surrounding', 'autoSolve?: '+ autoSolve, from)
          }

          let mess = ` '${toAdd.title.trim()}' Overlaps with Scheduled '${currScheduled.title.trim()}'.
          \nCancel to keep '${currScheduled.title.trim()}' at ${whenFrmtTime(currScheduled?.time)}` 
        
          this.radioChoiceDialog('Resolve Overlapping Events',
            mess,
            opts,
            'opt1', //toMonitor** if no opt1(prio)
            function(opt){//onOk
              resolveChoice(opt,toAdd,currScheduled,aConf)//JSON.parse(JSON.stringify(daChoice)))
            },
            function(){//onCancel
              console.log("handleOverlaps::manualSolve::cancelChoice>> from: "+from,daChoice)//,JSON.parse(JSON.stringify(daChoice)))  //daChoice
              cancelChoice(toAdd,currScheduled)
            },
            function(){//onDismiss //first dialog goes out of view >> nothing to do scheduledEvents
              console.log("handleOverlaps::onDismiss >"+from,daChoice)
            }
          )
        }

      let daChoice = []
      let toHandleSize = Object.keys(overlaps).length

      ///////////////////// START ///////////////////

      for (let key in overlaps) {
        console.log("handleOverlaps..Handling",key) //,JSON.parse(JSON.stringify(overlaps[key])))
        if (!overlaps[key] || !overlaps[key][0]){
          console.log("handleOverlaps...unknown key found",key) //could happen with fixMultiConflicts()--see below! 
          continue
        }
         //proper reset by iteration means declaring Opts here smh--would putting into lambda be better? toTry***
        let defaultOpts = [
          //{ label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
          //{ label: 'Choose by Score', value: 'opt2' },
          { label: 'Choose one event', value: 'opt3' }
        ]
        
        ///add relevant options....
        if (from == 'byScore'){
          defaultOpts.unshift({ label: 'Choose by Priority', value: 'opt1', color: 'secondary' })
        } else if (from == 'byPrio'){
          defaultOpts.unshift({ label: 'Choose by Score', value: 'opt2' })
        } else if (from == 'onDrop'){
          defaultOpts.unshift(
            { label: 'Leave as is!', value: 'opt0' },
            { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
            { label: 'Choose by Score', value: 'opt2' })
        } else { //default all!--adHocEvt,onPickEvt,byDefaults,byMoods
          defaultOpts.unshift(
            { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
            { label: 'Choose by Score', value: 'opt2' }
          )
        }

        let toH = overlaps[key]

        if (toH.length > 1) {//for multiple overlapps with same events
          console.log(`handleOverlaps::WOAH WOAH...multiple overlaps!!`) //,JSON.parse(JSON.stringify(toH))
          //todo below**
          if ("withID" in toHandle){
            //this.fixMultiConflicts(toH,override,from)
          }else {
            //this.multiConflicts(toH,override,from)
          }
          continue
        }

        const aConf = toH.pop() //toH.shift() to resolve in order? >>dont matter!

        let toAdd = this.daSchedule.getSubGoalByID(aConf.target) //getLocalEvt
        let currScheduled = this.daSchedule.findSchedEvent(aConf.inConflict) 
        
        if (!currScheduled || !toAdd ){console.log("handleOverlaps...ERROR ERROR no evts found!!!",aConf);return}

        //console.log("handleOverlaps...",JSON.parse(JSON.stringify(toAdd)),JSON.parse(JSON.stringify(currScheduled)))

        console.log(`handleOverlaps::adding ${toAdd.id}:${toAdd.title.trim()}(${toAdd.time})++${toAdd.duration} AT >> ${aConf?.targetStart?.time} -- ${aConf.direction} 
        Overlap with ${currScheduled.id}:${currScheduled.title.trim()}(${currScheduled.time})++${currScheduled.duration}`,override,'from:'+from,'toHandle='+toHandleSize) //aConf

        //case sensitive?!? toSEE***
        let toAddInclud = toAdd.title.trim().includes(currScheduled.title.trim())
        let scheduledInclud = currScheduled.title.trim().includes(toAdd.title.trim())

        //check also for the parent relation?--toSee...especially if too much for no reason....
        let toAddPrt = this.daSchedule.parentGoalById(toAdd.parentGoal) //this.parentGoalsMap().get(toAdd.parentGoal)
        let currSPrt = this.daSchedule.parentGoalById(currScheduled.parentGoal) //this.parentGoalsMap().get(currScheduled.parentGoal)

        let toAddPrtInclud = toAdd.title.trim().includes(currSPrt.title.trim())
        let currSPrtInclud = currScheduled.title.trim().includes(toAddPrt.title.trim())
        
        if (toAddPrtInclud || currSPrtInclud){ //auto-schedule...for parents!!---todo***
          //should schedule the subGoal!!! (Next of 'Me Me' parent)
          // OR (if cant for any reason?!?)
          // one of the subGoals of the parent? (parentGoal 'Next' with subgoals-Jobs,Massage,PmP/Pilot,etc)--which should be the one of scheduled or toAdd prolly
          //
          console.log(`handleOverlaps:: WOAH PARENT AUTO schedule`,toAddPrtInclud, currSPrtInclud,"Normal AUTO>>", toAddInclud, scheduledInclud,'direction == surrounding? >>', aConf.direction == 'surrounding')

        }

        if (toAddInclud || scheduledInclud){ //auto-schedule...shouldnt when can force?!? toMonitor**
          console.log(`handleOverlaps:: can AUTO schedule`,toAddInclud, scheduledInclud,'direction == surrounding? >>', aConf.direction == 'surrounding')
          //JSON.parse(JSON.stringify(toAdd)),JSON.parse(JSON.stringify(currScheduled))
          
          this.scrollToTime(aConf?.targetStart,'slow') //doesnt seem to work in first loop...second loop neither!! >does work when it's one iteration only!

          this.confirmAction(`"${toAdd.title.trim()}" related to Scheduled "${currScheduled.title.trim()}".
          \nAuto resolve Overlap?
          \nCancel/Dismiss for manual resolution.`,
          "Auto",
          function(){ //onOk
            if(toAddInclud){
              console.log(`auto schedule with removeReplace..with ORIG TIMES>>`,toAdd.time,currScheduled.time, aConf?.targetStart?.time)
              removeReplace(currScheduled,toAdd,aConf)
              aNotif(`Scheduling Evt '${toAdd.title.trim()}'`)  //check if shouldnt keep original time---toTest**
              return //?
            } else {
              console.log(`auto schedule with cancelChoice >> from: `,from)
              cancelChoice(toAdd,currScheduled)
              return 
            }
          },
          function(){ //onCancel
            console.log('Cancelling Auto-Solve...doing manual')
            //overlap might not be valid too with cascading changes!!!
            manualSolve(defaultOpts,toAdd,currScheduled,aConf,true)  //flag to pass on that could auto-resolve
          })

        } else {
            manualSolve(defaultOpts,toAdd,currScheduled,aConf,false)
        }

      }
    },
    onEndNow(id){
      console.log('onEndNow',id)
      this.daSchedule.endEvtNow(id) //todo**
    },
    onSaveScore(newScore, id,note=''){
      //console.log('onSaveScore',newScore, id,note)
      let dif = parseScore(newScore)
      if (dif < -1) {
        if (dif == -89) {
          console.log(`onSaveScore parsing error`,dif,newScore)
          this.doNotify("Score Parsing Error... YOU FOO! ")
        } else{
          this.doNotify("Score Error: higher# on lower#")
        }
        return
      }
      //check return?!? toSee...
      this.daSchedule.updateNoteScore(id,newScore,note)
    },
    onAddMins(id,mins){
        console.log('onAddMins',id,mins)
        this.daSchedule.addMinsToEvt(id,mins) //todo**
    },
    removeEvtInSchedule(evt){
      let doSave = false //just for moods.../default no need to save...

        let aRemove = () => { //autoSave=false 
          //this.doRemove(evt) //removeEvtInSchedule
          this.daSchedule.removeScheduledEvt(evt,doSave)
          
          if (doSave){ //autoSave
            //this.doNotify("removeEvtInSchedule..autoSave for: "+evt.title)
            console.log("removeEvtInSchedule..autoSave for: "+evt.title)
            
            //todo below? or would clear?...prolly remove just in case***
            //delete this.usingMoods[evt.id]

            //this.doSaveSchedule() //removeEvtInSchedule
            //this.disableSaveSchedule = true

            this.daSchedule.saveDaySchedule()
            return
          }

          //todo***
          //this.disableSaveSchedule = false  //allow saving schedule
          //this.showReloadBtn = this.hasEventsForDate
        }

      if(this.daSchedule.isViewingPast()){ //inPast--choose alternative.. Not for small evts as just addBalance
        if (evt.duration < 30){
          //console.log("removeEvtInSchedule...baah too smoll smoll",evt.title,evt.duration)
          this.doNotify("Removing from the past... Check BALANCE!") //oldie >> Removing from the past too smoll smoll is no no!
          this.daSchedule.addToBalance(evt)
          
          doSave = true
          aRemove() //(true) //this.doRemove(evt)
          return
        }

        this.chooseAlternatives(evt)
        return
      }

      if (!this.daSchedule.isViewingToday() && !this.mobile){//in futur >>no need confirming with user when inDesktop!
        doSave = this.daSchedule.getCurrentMoods()[evt.id] // this.usingMoods[evt.id] //oldie >>false  //should auto-save and flag to update labeling....
        aRemove() //(false)
        console.log('Removed future evt')
        return
      }

      let mess = `Remove "${evt.title}" from schedule?`

      let u = this.daSchedule.getCurrentMoods()[evt.id] 
      if (u){ //this.usingMoods[evt.id]
        console.log("removeEvtInSchedule with MOOD?!?", u)//this.usingMoods[evt.id])
        doSave = true 
        mess = mess + " With Mood "+u //this.usingMoods[evt.id]
      }

      this.confirmAction(mess,
      "Remove",
      aRemove,
      function(){console.log('Cancelled remove')}) 
      
    },
    chooseAlternatives(evt){
      //todo**
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
    scrollToTime (timey,speed=null) { 
      if (this.$refs.calendar){//just to see..gotta check first! >>doesnt seem to work in first loop...second loop neither!! >WORKs when it's one iteration only!
        let s = addToDate(timey, { minute: -30 }) //remove some minutes in order to center evt..
        console.log(`scrollToTime::gonna SCROLL`,timey.time, s.time, speed)
        this.$refs.calendar?.scrollToTime(s.time, speed ? speed=='fast'? 400 : 1000 : 500)  //whats point of the second number param?!? >>OH the speed of the scroll!!!
      }else {
        console.log(`scrollToTime::NO SCROLLY`,timey.time, JSON.parse(JSON.stringify(this.$refs)))
      }
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
    //could merge with above confirmTimeChange?---todo** maybe if behavior same...
    radioChoiceDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
      this.$q.dialog({
        title: title,//'Alert',
        cancel: onCancel ? true : false, //false, //or check if onCancel != null
        persistent: true, //have to choose!--see about passing in flag!!
        message: mess,
        options: {
          type: 'radio',
          model: selectedM, //oldie >>'', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
          // inline: true           
          items: labels
        },
        }).onOk((data) => {
            if (onOk) {
              if(data == ''){ //invoked again to handle when user doesnt make selection!
                this.radioChoiceDialog(title,mess, labels,selectedM, onOk,onCancel,onDismiss)
              }else {
                onOk(data)
              }
            }
        }).onCancel(() => {
            if (onCancel) {
              onCancel()
            }
        }).onDismiss(() => {
            if(onDismiss){ //for cleanup and other actions
              //console.log('radioyChoiceDialog::onDismiss!! executin...')
              onDismiss()
          }
        })
    },
    confirmAction(message, okbtn,executeOk, executeCancel, executeDismiss=null){ //should pass in cancel btn--todo**
      this.$q.dialog({
        title: 'Warning', //try to pass this in as well?!? tbd!
        cancel: true,
        ok: okbtn, //"Save",
        //persistent:      
        // position: 'bottom',
        //noBackdropDismiss  //should add this when user have to make choice
        message: message
      }).onOk(() => {
          executeOk()
      }).onCancel(() => {
          //console.log('Cancelled confirmAction!!')
          executeCancel()
      }).onDismiss(() => {
        if(executeDismiss){
          console.log('confirmAction with dismiss!!')
          executeDismiss()
          return
        }
      })
  },
  withDismissNotify(messg, colorNotif = undefined, position = 'top',timeout = null,dismiss = null){  //timeout=5000 //group=false
    this.$q.notify({
      color: colorNotif !== undefined ? colorNotif : 'negative',
      position: position,
      message: messg,
      icon: colorNotif == undefined ? 'report_problem' : 'thumb_up', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
      //group: group, //boolean | string | number;
      timeout: timeout ?? 5000, // time to display (in milliseconds)>>default is 5000
      closeBtn:"Okey",
      onDismiss:dismiss, //no need for ()
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