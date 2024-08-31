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
                                <!--showDefaultBtn daSchedule.getProps().showLoadDefaults -->
                                <div v-if="showDefaultBtn"><!--disable instead of hiding?!? meh -->
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
                                :label="showTree ? 'HideTree':'ShowTree'"
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
                    <div v-if="showRemInstru" class="q-ma-xl column items-center instru"><!--class="column justify-center items-center"-->
                      <q-card>
                        Double click upcoming evt to remove it 
                      </q-card><q-separator />
                      <q-card>
                        Can also add note to a finished evt or remove it
                      </q-card><q-separator />
                      <q-card>
                        Click on time intervals to add events to schedule
                      </q-card>
                    </div>
                    <div v-if="showSchedInstru" class="q-ma-xl column items-center instru">
                      <q-card>
                        Use above Scheduling buttons to add events to schedule
                      </q-card><q-separator />
                      <q-card>
                        Can also use mood keyworks to filter/add associated goals.
                      </q-card><q-separator />
                      <q-card>
                        Click on time intervals to add events to schedule
                      </q-card>
                    </div>
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
                      By moods: 
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
                                        :disabledScore="daSchedule.isDisabledScoreEdit[event.id]"
                                        :title="event.title"
                                        :id="event.id"
                                        :startTime="event.time"
                                        :score="event.score"
                                        :details="event.details"
                                        :notes="event.notes"
                                        :happeningNow="daSchedule.hasStarted[event.id] ? daSchedule.hasStarted[event.id] : false"
                                        @end-now="onEndNow"
                                        @save-score="onSaveScore"
                                        @add-mins="onAddMins"
                                        @delete-now="removeEvtInSchedule(event)"
                                        v-touch-hold:400:12:15="(e) => onTouchHold(e, event)"
                                      />

                                      <div v-if="daSchedule.hasStarted[event.id]" 
                                      class="addmins-line"
                                      :style="styleDragLine(event, timeStartPos, timeDurationHeight)">
                                        <!--show line at bottom for addMins via drag bottom border evt
                                          left: 5px
                                          background-color: red
                                          border-top: red 2px solid
                                          border: 2px solid #d3d3d3
                                        -->
                                      
                                      </div>

                                      <mobileNoteScore v-if="showEvtMobile(event.id)"
                                        :title="event.title"
                                        :id="event.id"
                                        :startTime="event.time"
                                        :score="event.score"
                                        :details="event.details"
                                        :notes="event.notes"
                                        :show-dialog="showEvtMobile(event.id)"
                                        @save-score="onSaveScore"
                                        @delete-now="removeEvtInSchedule(event)"
                                        @euh-hidin="daSchedule.euhHidin(event.id)"
                                      />
                                  </div>
                                </template>
                              </template>
                          </q-calendar-day>
                        </div>
                    </div> 
                    <br>
                    <!--sched-dialog was here-->             
                </template>
            </q-splitter>
            <!--no issue when here-->
            <sched-dialog v-if="showEvtDialog"
            :parentGoals="daSchedule.allPGoals()"
            :canBeScheduled="canbeScheduled"
            :balance="currentBalance"
            @ad-hoc-event="onAddHocEvent"
            @on-pick-event="onPickEvent"
            @euh-hidin="closingDialog"
            />        
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
  addToDate,
  parsed,
  parseTime
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
  mobileNoteScore: defineAsyncComponent(() => import('../../components/planner/onScoreEditDialog.vue')),
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

        showEvtDialog: ref(false),

        currentDate: ref(today()),
        scoreOptions:ref([1,2,3,4,5,6,7,8]), //default score intervals
        
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

    this.daSchedule = new daySchedule(this.currentDate,this.mobile)

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
    chosenScoreLabel() {
        //return this.chosenScore == null ? `By Score` : `Score <= ${this.chosenScore}`
        return this.daSchedule.chosenScoreLabel()
    },
    chosenPrioLabel() {
        //return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}`
        return this.daSchedule.chosenPrioLabel()
    },
    style () {
        return {
            top: this.timeStartPos + 'px'
        }
    },
    showSchedInstru(){
      return this.getDateEvents(this.currentDate).length < 1 //&& !this.isViewingPast()
    },
    showRemInstru(){
      return this.getDateEvents(this.currentDate).length > 0 && !this.isViewingPast()
    },
    defaultLabels(){
        let e = this.daSchedule.unscheduled()
        
        let s = e.filter(evt => evt?.inDefaults && evt?.time != '').length// && !this.scheduledEvents.find(x => x.id == evt.id)).length
        return  s > 0 ? s+ " Defaults" : "Defaults"
    },
    showDefaultBtn(){
      let e = this.daSchedule.unscheduledDefaults()
      //console.log("showDefaultBtn...",e.length)
      return e.length > 0 && !this.isViewingPast()
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
      return this.daSchedule.currentSchedEventsMap()
    },
 },
methods:{
    showEvtMobile(id){
      return this.daSchedule.showEvtNoteScoreMobile(id)
    },
    klikaj(e){ //test drag/drop...toRemove
      console.log("klikaj...", this.currentDate, e)
    },
    adjustCurrentTime() {
      const now = parseDate(new Date())

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

      let timeSets = this.daSchedule.getCurrentSchedTimesSets()

      let hasEnd = (timeSets.endSet && timeSets.endSet.has(now.time))
      let hasStart = (timeSets.startSet && timeSets.startSet.has(now.time))
      if(hasEnd || hasStart){
        //console.log("sameStart/END..FOUND", this.currentTime,hasEnd, hasStart)
        this.daSchedule.updateMinEndNowBtn(this.currentTime,hasEnd, hasStart)
        if (hasStart){this.doNotify(`Event Starting :)`, "positive",'bottom')}
      }
    },
    hasDate (days) { //umm why again?!? for current time line? toTest*** when removed!
        return this.currentDate
        ? days.find(day => day.date === this.currentDate)
        : false
    },
    getDateEvents (dt) {

      //oldie that didnt sort >>return this.daSchedule.getDateEvents(dt)  //|| []

        let sorty = (a, b) => {//sort by earlier timestamp!--too much?
          let timeDiff = diffTimestamp(a.sortTime,b.sortTime) 
          if (timeDiff > 0) return -1
          if (timeDiff == 0) return 0 
          if (timeDiff < 0) return 1
        }

      const events = this.eventsMap[ dt ] || []
      
      if (events.length === 1) {
        events[ 0 ].side = 'full'
      } else if (events.length === 2) {
        //console.log("getDateEvents...LENGTH is 2?",dt, events) //bof when actual scheduled is just two evts!--weird that it does this calculation...prolly when overlapping times? >> YEUP! very nice actually--prolly would need overlap check if more than 2 evts lool!
        // this example does no more than 2 events per day
        // check if the two events overlap and if so, select
        // left or right side alignment to prevent overlap
        /*const startTime = addToDate(parsed(events[ 0 ].date), { minute: parseTime(events[ 0 ].time) })
        const endTime = addToDate(startTime, { minute: events[ 0 ].duration })
        const startTime2 = addToDate(parsed(events[ 1 ].date), { minute: parseTime(events[ 1 ].time) })
        const endTime2 = addToDate(startTime2, { minute: events[ 1 ].duration })
        if (isBetweenDates(startTime2, startTime, endTime, true) || isBetweenDates(endTime2, startTime, endTime, true)) {
          console.log("getDateEvents...LENGTH==2..LEFT/RIGHT 'TWIX")  //,startTime, endTime,startTime2,endTime2
          //when two evts next to each other with some overlapp...
          events[ 0 ].side = 'left'
          events[ 1 ].side = 'right'
        } else {
          events[ 0 ].side = 'full'
          events[ 1 ].side = 'full'
        }*/
      }
    
    //console.log("daEvents...",JSON.parse(JSON.stringify(events))) //, JSON.parse(JSON.stringify(ev))) //events
  
    return events.sort(sorty) //errors out with this.sorty
    },
    constructTree(){
        this.treeGoals = this.daSchedule.fetchGoalsTree()
    },
    resetGoalEvts(){
        return this.daSchedule.getSubGoals()
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
      
      return `Balance: ${this.daSchedule.getCurrentBalance() || 0 } \n`
    },
    badgeClasses (event, type) {
        return applyClasses(event, type)
    },
    //toReview...doesnt show line
    styleDragLine (e,timeStartPos = undefined, timeDurationHeight = undefined) {
      let top = timeStartPos(e.time)
      let height = timeDurationHeight(e.duration)
      //this.timeStartPos is one that increases
      let at = top + height //or minus - ? 
      let anotherAt = this.timeStartPos + height
      
      //console.log("styleDragLine...",this.timeStartPos,top,height,at,anotherAt)//,this.daSchedule.hasStarted[e.id])//e,timeStartPos(e.time),timeDurationHeight(e.duration))
      const s = {}
      if (timeStartPos && timeDurationHeight) {
        s.top = at+ 'px'//timeStartPos(e.time) + 'px'
        //s.height = height + 'px'
        //or s.left?
      }
      s[ 'align-items' ] = 'flex-start'
      return s
        //return {
        //    top: this.timeStartPos + 'px'
        //}
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
      //console.log(`onMoodAdd>>>`, this.filterString) 
      let toAddy = []
      const filt = this.filter.map(e => e.toLowerCase())

      this.treeGoals.filter(node => {
        if (node.children.length > 0){
          return node.children.filter(u => { //using .find() only get first goal! >>.filter is better!
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

      //console.log(`onMoodAdd>>>toADD`, JSON.parse(JSON.stringify(toAddy)))

      if (toAddy.length > 0){
        toAddy = toAddy.filter(x => !this.daSchedule.getAllEvts().find(item => item.id == x.id)) //filter out already scheduled
        let sizey = toAddy.length
        if(sizey > 0){
          let res = this.daSchedule.scheduleByMood(toAddy)
          console.log(`onMoodAdd>>>`,filt,res,toAddy) 
          if(!res.canContinue){ //&& !anyOverlap.overlaps
            //console.log("onMoodAdd::OVERLAPS?",JSON.parse(JSON.stringify(res)))
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byMood')
            }else{
              this.doNotify(`Empty as no Moods :(`, "warning",'bottom') //nothing--toTest***
            }
          }else{//allGood prolly...
            this.doNotify(`Added ${sizey} Evts by Mood...doSave eh`, "positive")
            //console.log("onMoodAdd::Continue... ACTION Res>>",JSON.parse(JSON.stringify(res)))
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
            else{
              this.doNotify(`Empty? for OneEach :(`, "warning",'bottom') //toTest**
            }
          }else{//allGood no overlap
            this.doNotify(`Add by OneEach ...doSave eh`, "positive")
            //console.log("onScheduleOneEach::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
          }
        }
        let doCancel = () => { //do cancel
          console.log('onScheduleOneEach..Aborting',this.daSchedule.getAllEvts())
          this.reset() //OneEach
          return
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
        doAction, //onOk
        doCancel)
      } else{ //nothing scheduled--just overwrite
        doAction('overwrite')
      }
    },
    onReloadSaved(){
      let hasEvents = this.daSchedule.hasEventsForDate()
      console.log('onReloadSaved',hasEvents)
      
        let doCancel = () => {
          console.log('Aborting', this.currentDate,this.scheduledEvents, hasEvents)
          
        }
        let doOverwrite = () => {
          console.log('onReloadSaved::Overwriting',hasEvents)
          //this.scheduledEvents = []
          //this.updateCurrentSchedule()
          //this.loadForDate(this.currentDate, hasEvents, this.isViewingPast())
          let res = this.daSchedule.loadEvtsForDay(false)
          if(!res.canContinue){
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              console.log('onReloadSaved::OVERLAPPS',res.overlaps)
              this.handleOverlaps(res.overlaps,null,'view')
            }else{
              this.doNotify(`Reloaded schedule for ${this.currentDate}`, "positive",'bottom')
              
              if(this.isViewingPast() || this.currentDate !== today()) { //adjustTime for past && futur 
                //console.log("adjusting time for past/future", this.currentDate) //,this.scheduledEvents.length)
                this.adjustCurrentTime()
              }
            }
          }
          this.reset() //reloadSaved
        }
      
      if (this.daSchedule.getAllEvts().length > 0 && !this.isViewingPast()){
        let mess = hasEvents ? "Reload? saved schedule of: "+this.currentDate : "Overwrite current Evts?"
        this.confirmAction(mess,"OK", doOverwrite, doCancel)
      } else {
        doOverwrite()
      }
    },
    onClearDay(){
      let hasSaved = this.daSchedule.hasEventsForDate()
      //console.log('onClearDay',hasSaved)//this.daSchedule.hasEventsForDate())
        
      if(this.isViewingPast()){
        this.doNotify("Editing past is no no!")
        return
      }
      
      this.daSchedule.resetSchedule()
      let mess = hasSaved ? `Cleared...Can still Reload saved` : `Resetting...`
      this.doNotify(mess, "warning",'top')
        
      this.reset() //clearDay

      this.daSchedule.toggleActionBtns(hasSaved,'view') //enable if hadSavedEvts! 
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
          let res = this.daSchedule.scheduleDefaults(flag)
          console.log('onLoadDefault',flag,res)
          if(!res.canContinue){
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byDefaults')
            }else{
              this.doNotify(`Empty? as no Defaults:(`, "warning",'bottom')//-toTest***
            }
          }else{//allGood prolly...
            this.doNotify(`Add of Defaults ...doSave eh`, "positive")
          // console.log("onLoadDefault::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
          }
        }

      
      if (this.daSchedule.getAllEvts().length > 0){
        let e = this.daSchedule.unscheduledDefaults()
        console.log('onLoadDefault::unscheduledDefaults', e,e?.length) 
        
        let labels = [
          {label: `Add ${e?.length} Default Evts to current day schedule`,value: 'add'},
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

        let doCancel = () => { //do cancel 
          console.log('doReloadWithPrio..cancelling') //this.scheduledEvents
          this.reset() //reloadWithPrio
          return
        }
        let doAction = (flag) => {
          let res = this.daSchedule.scheduleSamePrio(flag)
          
          if(!res.canContinue){
            //console.log("scheduleSamePrio::OVERLAPS?",JSON.parse(JSON.stringify(res)))
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byPrio')
            }else{
              this.doNotify(`Empty for Priority == ${this.daSchedule.chosenPrio} :(`, "warning",'bottom') //toTest***
            }
          }else{//allGood no overlap
            this.doNotify(`${flag} for Priority == ${this.daSchedule.chosenPrio} ...doSave eh`, "positive")
            //console.log("doReloadWithPrio::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
          }
        }

      let currentPrio = this.daSchedule.chosenPrio

      if (this.daSchedule.getAllEvts().length > 0){
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
        doAction('overwrite')
      }

      //not allow reclick without changing prio again...
      this.daSchedule.disablePrioBtn = true 
     
    },
    doReloadWithScore(){
      //console.log('doReloadWithScore')
      if (this.daSchedule.chosenScore == null) {
        this.doNotify("Ayo select a score!")
        return
      }

        let doCancel = () => { //do cancel
          console.log('doReloadWithScore..cancelling',this.daSchedule.getAllEvts())
          this.reset() //reloadWithScore
          return
        }
        let doAction = (flag) => {
          let res = this.daSchedule.scheduleByScore(flag)
  
          //console.log(`scheduleByScore::ACTION!!!`,JSON.parse(JSON.stringify(res)))
          
          if(!res.canContinue){ //&& !anyOverlap.overlaps
            //console.log("scheduleByScore::OVERLAPS?",JSON.parse(JSON.stringify(res)))
            if(res.overlaps && Object.keys(res.overlaps).length > 0){
              this.handleOverlaps(res.overlaps,null,'byScore')
            }else{
              this.doNotify(`Empty for Score <= ${this.daSchedule.chosenScore} :(`, "warning",'bottom')
            }
          }else{//allGood no overlap prolly....
            this.doNotify(`${flag} for Score <= ${this.daSchedule.chosenScore} ...doSave eh`, "positive")
            //console.log("doReloadWithScore::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
          }
        }

      let currentScore = this.daSchedule.chosenScore
      if (this.daSchedule.getAllEvts().length > 0) { //scheduledEvents
        let labels = [
          {label: `Filter current Evts by Interval Score <= ${currentScore}`,value: 'filter'}, //false  //cannot pass false as empty string evaluates to it...smh!
          {label: `Add to schedule Evts with Interval Score <= ${currentScore}`,value: 'add'},
          {label: `Overwrite current and schedule All of Interval Score <= ${currentScore}`,value: 'overwrite'}
        ]

        
        this.radioChoiceDialog('',
        "Schedule change...",
        labels,
        '',
        doAction,
        doCancel)

      } else{ //no scheduled--just overwrite
        doAction('overwrite')
      }

      //no reclick without changing score again...todo>>use toggle() function?
      this.daSchedule.disableScoreBtn = true
        
    },
    doSaveSchedule(){
      this.daSchedule.saveDaySchedule()

      this.doNotify(`Schedule saved for ${this.currentDate}`, "positive", "top")
    },
    doDroppy(from, targetDrop, draggedItem){ //from param is redundant--toRemove*
      //console.log("doDroppy: "+from,targetDrop, draggedItem)//.duration,draggedItem.time)

      if(targetDrop && draggedItem){
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
       
        //console.log("doDroppy: "+from,canDrop,draggedItem)
        if (canDrop.canContinue){ //&& canDrop.overlaps == null){
          let askUser = draggedItem?.inDefaults || !draggedItem?.canMove 
          if (askUser){
            let pre = draggedItem?.inDefaults ? "Default at " : "Cannot Move from" 
            let mess = [`Evt "${draggedItem.title.trim()}" ${pre} ${whenFrmtTime(draggedItem.time)}.`, //shows misleading time--toFix**
            `\nAlso update to new time ${whenFrmtTime(targetDrop.time)}?`,
            "\nCancel or Dismiss to undo!\n\u2800\n",
            `\nNo selection to keep default ${whenFrmtTime(draggedItem.time)}`
            ].join('\n')

            const c = this.daSchedule  //huh works for below to keep context!!
            this.confirmTimeChange("Changing Evt's time",
              mess, 
              "Change", //okBtn
              `Temp.Move`,//`Temp.${doAdd ? 'Add':'Move'}`, //altbtn //oldie >>"Temp.Move"
              function(d){c.changeEvtTime(draggedItem, targetDrop,d)}, //onOk  //userChoice(d,evt,doAdd)
              function(){console.log(`doDroppy::onCancel..>doing nothing for ${draggedItem.id})'${draggedItem.title.trim()}'`)}, //;keepAsIs() //doUpdateEvt()  //shouldnt cancel/dismiss NOT schedule?!?
              function(){console.log(`doDroppy::onDismiss..keep as is>> ${draggedItem.id})'${draggedItem.title.trim()}'`)}//;keepAsIs(evt,doAdd)} //.scheduling at default time`);keepAsIs() 
              //onDismiss/...should prolly remove it actually!--or leave at default time?!?
              ) 

          }else{ //skip asking user...
            this.daSchedule.changeEvtTime(draggedItem, targetDrop,false)
          }
        
        }else{//else handle .overlaps
          //console.log("doDroppy::CANNOT Drop",JSON.parse(JSON.stringify(canDrop)))
          
          this.movedIntoConflict(canDrop.overlaps,false,from) //beware of override flag and from
          //this.handleOverlaps(canDrop.overlaps,true,'onDrop')
        }

      } else{
        console.log("doDroppy null ERROR?", targetDrop,this.targetDrop, draggedItem, this.selectedItem )
        return
      }
    },
    //single evt already scheduled overlap--same as handleOverlaps but no adding--changes rawSaved..
    //override applicable here! --addMins && onDrop
    movedIntoConflict(overlaps,override,from,addMins=0){ //addMins could be redundant..toSee**

      console.log('movedIntoConflict >>',JSON.parse(JSON.stringify(overlaps)),"from:"+from,addMins)

        const prioLabel = (evt,f) => {
          if (evt?.parentGoal){
            let prt = this.daSchedule.parentGoalById(evt.parentGoal) //this.parentGoalsMap().get(evt.parentGoal)
            return f ? `Of '${prt?.title.trim()}' (${prt?.priority})` : `Of '${prt?.title.trim()}'`
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
              return `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)} && Score:: ${ anEvt.score} for ${anEvt.duration} mins` //at ${whenFrmtTime(anEvt?.time)} >>misleading original evt time
          }
        }
        const aNotif = (mess,warn=false) => {
          this.doNotify(mess, warn? "warning":"positive",'top')
        }
        const updateMoodLabel = (id) => { //force label update
          this.daSchedule.deleteEvtMood(id)
          //this.scheduleMoodsLabel //no need for this
        }
        const doRemove = (evt) => {
          
          let hasMood = this.daSchedule.getCurrentMoods()[evt.id]

          console.log(`handleOverlaps::doRemove ${evt.id}:${evt.title}`)//,hasMood)

          this.daSchedule.removeScheduledEvt(evt,hasMood)
          
        }
        const removeReplace = (toRem,toAdd,aConf) => { 
          //at ${toAdd.time} with ovrd:${override}`, aConf)  //aConf.targetStart.date
          console.log(`movedIntoConflict::removeReplace >> replacing>> ${toRem.id}) '${toRem.title.trim()}' WITH ${toAdd.id}) ${toAdd.title.trim()}`, aConf, 'from>'+from)

          //no need line below now...toTest***
          //toAdd = this.addPropsEventsTo(aConf.targetStart.date,[{...toAdd,time:aConf.targetStart.time}]) //proper change of time
        
          if(override){
            console.log("movedIntoConflict::removeReplace...OVERRIDE from>>"+from) //,JSON.parse(JSON.stringify(toAdd))
            if (from == 'onDrop'){//for consistency with okChoice....
              doRemove(toRem)
              return
            }

            console.log("movedIntoConflict::removeReplace....OVERRIDE updating..."+from)
            //this.updateEvtInScheduleMaps(toAdd[0].id, aConf.targetStart)
            //console.log(`handleOverlaps`,this.startTimesSet,this.endTimesSet,JSON.parse(JSON.stringify(this.scheduledEvents)))
            
            this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart)
            return
          }
        
          doRemove(toRem)

          this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart)

          ////could this overlap again?!? YES ...could handle with below but toReview 
          // this.daSchedule.recurChangeTime(toChange.id,toAdd,conf.targetStart,from != 'onDrop') 

          /*let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:aConf.targetStart.time}],false)

          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`${from}>handleOverlaps::removeReplace:: OVERLAPS again from adding ${toAdd.id} overlaps =${sizey}`,toAdd,JSON.parse(JSON.stringify(euhOverlaps))) // to ${toReload.length}. on:${this.currentDate} 
            
            this.doNotify(`Extra Overlaps while adding ${toAdd[0].title.trim()}`, "warning",'top')
            return this.handleOverlaps(euhOverlaps,override,from+'nah') //handleOverlaps
          }*/

          return
        }
        const forceAddMins = (toChange,aConf) => {
          let addTo = this.daSchedule.findEvent(aConf.target)
          if (!addTo){console.log(`movedIntoConflict::forceAddMins>>NOT FOUND?!?`,aConf.target);return} //shouldnt happen
          
          let toAddy = this.daSchedule.getStoredRawEvt(aConf.target)
          if (toAddy){
            let newDura = addTo.duration + parseInt(addMins)
            console.log(`movedIntoConflict::forceAddMins>> HAS SAVED*** for:`+addTo.id,toAddy,JSON.parse(JSON.stringify(addTo)),newDura)

            Object.assign(addTo, toAddy, { duration: newDura }) //wonder if this good...
          }else{ // could use toAddy addin!!--shouldnt happen >>could if just newly added?..toMonitor
            console.log(`movedIntoConflict::forceAddMins >>NEWLY ADDED?!? Error?`,addTo.id,addTo,toAddy)
            //should just change duration of addTo --todo**
            Object.assign(addTo, { duration: newDura })
          }

          this.daSchedule.recurChangeTime(toChange.id,addTo,aConf.targetStart,false) 

          //this.daSchedule.doUpdateSchedule(addTo,aConf.targetStart) //no need as done in recurChangeTime

          this.daSchedule.saveDaySchedule()
          return
        }
        const forceAdd = (toChange, toAdd,conf) => { 
          
          //const properT = addToDate(parsed(this.currentDate), { minute: parseTime(toChange.time) }) //just to see >>meh

          console.log(`movedIntoConflict::forceAdd:${from} >>${toAdd.id})'${toAdd.title}' at ${toAdd.time}.
          \nChanging >>${toChange.id} from ${toChange.time} `,conf.targetStart.time)//,toAddy)
          
          //console.log(conf, properT)
          let toAddy = this.daSchedule.getStoredRawEvt(conf.target) //to not carry it around so much
          if (toAddy){
            console.log(`movedIntoConflict::forceAdd::CAN use SAVED***`,toAddy,JSON.parse(JSON.stringify(toAdd)))
             // should use enrich with saved toAddy
            Object.assign(toAdd, toAddy,{time:conf.targetStart.time}) 
          }


          if (conf.direction !== 'surrounding'){ //this in order to limit going in circles with overlapCheckEvtsAdd()...
            //let noAdd = from == 'onDrop'  
            //doAdd flag important for small time interval jump
            this.daSchedule.recurChangeTime(toChange.id,toAdd,conf.targetStart,false) 
          }else{
            console.log(`movedIntoConflict::forceAdd: gonna addGoalsToSchedule....`) //happens?!?

            let euhOverlaps = this.daSchedule.addGoalsToSchedule([toAdd],true) //,time:conf.targetStart.time
            let sizey = Object.keys(euhOverlaps).length
            if(sizey > 0) {
              console.log(`movedIntoConflict::forceAdd:: OVERLAPS again of size:${sizey} from >${from}>`+toAdd.title,JSON.parse(JSON.stringify(euhOverlaps)))
              
              //Note*** see with adding 'nah' that no more circles--should be less prolly with recurChangeTime()
              this.doNotify(`Extra Overlaps while adding '${toAdd.title.trim()}' `, "warning",'top')
              return this.handleOverlaps(euhOverlaps,override,from+'nah') //handleOverlaps
            }
          }

          this.daSchedule.toggleActionBtns(true,from)
          //console.log(`handleOverlaps`,this.daSchedule.getAllEvts())
        }
        let onOkChoice = (og,c, toAdd,currScheduled,aConf) => {
          daChoice.push(c)
          if(c == toAdd.id){
            removeReplace(currScheduled,toAdd,aConf)
            aNotif(`by ${og}, ${from == 'onDrop'? "Moving":"Adding"} '${toAdd.title.trim()}'`,true)
          } else { 
            console.log(`onOkChoice::by ${og},chose scheduled ${c} ...with override?`, override, from)
            aNotif(`by ${og}, Keeping '${currScheduled.title.trim()}'`)

            if(from.indexOf('byMood') > -1){
              //console.log("handleOverlaps::onOkChoice::Moood!! updates? from: "+from,toAdd.title.trim()) 
              updateMoodLabel(toAdd.id)
            }

            if(override){
              doRemove(toAdd)
            }
          }
        }
        let cancelChoice = (toAdd,currScheduled) => {
          if(override){
            console.log("handleOverlaps::cancelChoice::OVERRIDE...coolios!!from:"+from,toAdd.title.trim())

            if (from == 'onDrop'){ //yup on drag/drop >>cancel should just revert to original..toMonitor
              aNotif(`Umm...not moving then....`)

              this.daSchedule.toggleActionBtns(false,'view')//disable saveScheduleBtn

              return 
            }

            doRemove(toAdd)  //remove is proper in other cases though?...prolly
            aNotif(`Keeping '${currScheduled.title.trim()}'`)
            
            return 
          }

          //smh cause it never gets into doRem() and using override flag would affect removeReplace() 
          //--toTest* using 'from' check maybe
          if(from.indexOf('byMood') > -1){
            //console.log("handleOverlaps::cancelChoice >>Mood!!!!updates? from: "+from,toAdd.title.trim())
            updateMoodLabel(toAdd.id) //update label smh
          }
         
          this.daSchedule.toggleActionBtns(true,'view')

          aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
        }
        let onDismissy = (mess,id) => { //,c
          //console.log(mess,'from>>'+from,daChoice,id) //JSON.parse(JSON.stringify(c))

          //to NOT enable even when no change...
          daChoice[0] == id ? this.daSchedule.toggleActionBtns(true,from) : console.log('onDismissy::no change '+from,mess,daChoice[0], id)
        }
        const resolveChoice = (opt,toAdd,currScheduled,aConf) => {
          if (opt =='opt3') { //pick Evt
            let m = 'Pick one event...'
            let labels = [
              {label: evtLabels(toAdd,'def'),value: toAdd.id, color: 'secondary' }, 
              {label: evtLabels(currScheduled,'def'),value: currScheduled.id } 
            ]

            this.radioChoiceDialog('',
              m,
              labels,
              '',
              function(d){onOkChoice("Choice",d,toAdd,currScheduled,aConf)}, 
              null, //second dialog shouldnt have cancel...//oldie >> function(){console.log("chooseEvt::by Event...cancelling");daChoice.push('cancel')}, //daChoice = 'cancel' //cancelChoice(toAdd,currScheduled)
              function(){onDismissy('resolveChoice::byEvent... dismissing',toAdd.id)}
            )
            //console.log("chooseEvt::by Event...returnin...",daChoice) //runs first
            //return daChoice
          } else if (opt =='opt2'){ //by Score
            let m = 'Pick event by Score'
            let labels = [
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
            console.log("resolveChoice::it's a drop?...keeping as is....",from)
            //cancelChoice(toAdd,currScheduled)
            aNotif(`Umm...keeping as is then!`) //toTest** if works for all
          } else{ //OPT4..FORCING.
            //console.log("chooseEvt::by forceAdd...")
            forceAdd(currScheduled,toAdd,aConf)  
          }
        }
        //autoSolve flag to not add force in--can result in loop!
        const manualSolve = (opts,toAdd,currScheduled,aConf,autoSolve) => { 
          if (aConf.direction !== 'surrounding' && !autoSolve){ //`Force both` to schedule both evts...
            if(from.indexOf('nah') > -1){//...except when previous loop added it!
              console.log("movedIntoConflict::manualSolve NOT adding Force as from "+from) 
            } else {
              opts.push({ label: `Force in '${toAdd.title.trim()}'`, value: 'opt4' })  
              // at ${when(aConf?.targetStart?.time)} >> could have changed
            } 
          } //else {
            //console.log("handleOverlaps::manualSolve NO force option...direction!==surrounding?",aConf.direction !== 'surrounding', 'autoSolve?: '+ autoSolve, from)
          //}

          let mess = `Adding '${toAdd.title.trim()}' at ${whenFrmtTime(aConf.targetStart.time)} Overlaps with Scheduled '${currScheduled.title.trim()}' at ${whenFrmtTime(currScheduled?.time)}.
          \nCancel to keep '${currScheduled.title.trim()}' ` // ${whenFrmtTime(toAdd?.time)}
        
          let title = autoSolve ? 'Choose Auto Resolution' : 'Resolve Overlapping Events'
          this.radioChoiceDialog(title,
            mess,
            opts,
            'opt1',
            function(opt){//onOk
              resolveChoice(opt,toAdd,currScheduled,aConf)//JSON.parse(JSON.stringify(daChoice)))
            },
            function(){//onCancel
              console.log("movedIntoConflict>>manualSolve::cancelChoice? Notif?>> from: "+from,daChoice[0])//,JSON.parse(JSON.stringify(daChoice)))  //daChoice
              //cancelChoice(toAdd,currScheduled)
              aNotif(`Umm...keeping as is then!`) //works for all? toTest** if notif is good!
            })//,
            //function(){//onDismiss //first dialog goes out of view >> nothing to do scheduledEvents
            //  console.log("handleOverlaps>>manualSolve::onDismiss >"+from,daChoice[0])
            //}
          //)
        }
      
    ///////////////////// START ///////////////////     
      let daChoice = []
      let toHandleSize = Object.keys(overlaps).length  //should be one...prolly

      for (let key in overlaps) {
        if (!overlaps[key] || !overlaps[key][0]){//could happen with fixMultiConflicts()--see below! 
          console.log("movedIntoConflict...skipping unknown key",key) 
          continue
        }

        let toH = overlaps[key]
        if (toH.length > 1) { //umm still here eh smh
          if ("withID" in overlaps){
            console.log(`movedIntoConflict::WOAH WOAH...using oneToManyConflict!`+toHandleSize,JSON.parse(JSON.stringify(toH)))
            this.oneToManyConflict(toH,override,from)
          }else {
            console.log(`movedIntoConflict::WOAH WOAH...using manyToOneConflict!`+toHandleSize,JSON.parse(JSON.stringify(toH)))
            this.manyToOneConflict(toH,override,from)
          }
          continue
        }

          //proper reset by iteration means declaring Opts here --lambda be better? toTry***
        let defaultOpts = [
            //{ label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
            //{ label: 'Choose by Score', value: 'opt2' },
          { label: 'Choose one event', value: 'opt3' }
        ]

        
        if (from == 'onDrop'){ //add 'onAddMins' ? toSee**
          defaultOpts.unshift(
            { label: 'Leave as is!', value: 'opt0' },
            { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
            { label: 'Choose by Score', value: 'opt2' })
        } else { //default all!
          defaultOpts.unshift(
            { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
            { label: 'Choose by Score', value: 'opt2' })
          }
        
        //let toH = overlaps[key]
        const aConf = toH.pop() //toH.shift() to resolve in order? >>dont matter!

        let toAdd = this.daSchedule.getSubGoalByID(aConf.target)
        let currScheduled = this.daSchedule.findEvent(aConf.inConflict) 

        if (!currScheduled || !toAdd ){console.log("movedIntoConflict...ERROR ERROR no evts found!!!",aConf);return}

        let canAutoSolve = this.checkIncludedTitles(toAdd,currScheduled)
        //let toAddy = this.daSchedule.getStoredRawEvt(aConf.target) ////this is what should be used as was saved..otherwise lose saved notes-

        if (from == 'onAddMins'){ //just ask to move conflict evt down
          let reason = currScheduled?.inDefaults ? "In Defaults" : !currScheduled?.canMove ? "Cannot move" : "" //umm last one shouldnt be empty?
          //|| !currScheduled?.canMove
          //console.log("movedIntoConflict::onAddMins"+canAutoSolve,reason)

          let mess = `Adding ${addMins} mins to "${toAdd.title.trim()}" Overlaps with Scheduled "${currScheduled.title.trim()}" at ${whenFrmtTime(currScheduled.time)} as ${reason}.
            \nForce?
            \nCancel/Dismiss to Leave as is.`

            this.confirmAction(mess,  //todo--pass in title--forceAdd 
            "Add",
            function(){ //onOk
              forceAddMins(currScheduled,aConf)
            },
            function(){ //onCancel--Leave as is...
              //cancelChoice
              //this.daSchedule.toggleActionBtns(true,'view')
              aNotif(`Keeping as Is...`) //${currScheduled.title.trim()}'
            },
            function(){ //onDismiss--redundant...
              //this.daSchedule.toggleActionBtns(true,from)//no need as auto save schedule
              console.log(`movedIntoConflict >>onAddMins>> onDismiss`)
            })
        }else{ //from onDrop...check explicitely or? ...toSee if handles other**
          console.log(`movedIntoConflict::onDrop?`,from,canAutoSolve)
          if(canAutoSolve){
            console.log(`movedIntoConflict:: can AUTO schedule`,canAutoSolve.addIncSched, canAutoSolve.schdIncToAdd,'direction == surrounding? >>', aConf.direction == 'surrounding')
            //JSON.parse(JSON.stringify(toAdd)),JSON.parse(JSON.stringify(currScheduled))
          
            this.scrollToTime(aConf?.targetStart,'slow') 
            
              //should prolly use whenFrmtTime(aConf?.targetStart.time) below--todo**
            let mess = `"${toAdd.title.trim()}" at ${whenFrmtTime(toAdd.time)} related to Scheduled "${currScheduled.title.trim()}" at ${whenFrmtTime(currScheduled.time)}.
            \nAuto resolve Overlap?
            \nCancel/Dismiss to manually choose.`

            this.confirmAction(mess,
            "Auto",
            function(){ //onOk
              if(canAutoSolve.addIncSched){
                console.log(`Auto resolve::removeReplace..with TIMES>>`,toAdd.time,currScheduled.time, aConf?.targetStart?.time)
                removeReplace(currScheduled,toAdd,aConf)
                aNotif(`Removing Scheduled to Add '${toAdd.title.trim()}'`,true)
                daChoice.push(toAdd.id) //for dismiss below to toggleActionBtns()
                //return
              } else {
                console.log(`Auto resolve::cancelChoice >> from: `,from)
                cancelChoice(toAdd,currScheduled)
                daChoice.push(currScheduled.id) //for dismiss below to toggleActionBtns()
                //return 
              }
            },
            function(){ //onCancel
              //console.log('Cancelling Auto-Solve...doing manual')
              //overlap might not be valid too with cascading changes!!!
              manualSolve(defaultOpts,toAdd,currScheduled,aConf,true)  //flag to pass on that could auto-resolve
            },
            function(){ //onDismiss--just to enable saveSchedule btn
              //this.daSchedule.toggleActionBtns(true,from)
              onDismissy("Auto-dismiss",daChoice[0])
            })
          } else {
              manualSolve(defaultOpts,toAdd,currScheduled,aConf,false)
          }
        }
  
        /*if (from == 'onAddMins'){ //bumped into evt that is default or !canMove
          let toAddaay = this.daSchedule.findEvent(aConf.target) //gotta get what's in the schedule--important!!
          if (toAddy){
            
            let newDura = toAddaay.duration + parseInt(addMins)
            console.log(`movedIntoConflict::onAddMins>> HAS SAVED*** for:`+toAdd.id,toAdd,toAddy,toAddaay,newDura,canAutoSolve)
            
            //toAddaay
            Object.assign(toAddaay, toAddy, { duration: newDura })
            //beware to not overwrite duration or time...for drag/drop or addMins
          }else{ // could use toAddy addin!!--shouldnt happen >>could if just newly added?..toMonitor
            console.log(`movedIntoConflict::NO SAVED?!? Error?`,toAdd.id,toAddy)
          }

          console.log("movedIntoConflict...GONNA handle overlap",aConf.inConflict,aConf.targetStart,from != 'onDrop',toAddy,JSON.parse(JSON.stringify(toAddaay)))
            
          //forceAdd(currScheduled,toAddaay,aConf)
          this.daSchedule.recurChangeTime(currScheduled.id,toAddaay,aConf.targetStart,false) 

          this.daSchedule.doUpdateSchedule(toAddaay,aConf.targetStart)

          this.daSchedule.saveDaySchedule()

          //todo*** >>ckeck if can bump down currScheduled

            //this.daSchedule.recurChangeTime(currScheduled.id,toAdd,aConf.targetStart,false)//from != 'onDrop' 

            //bon still doesnt add min and pushing currScheduled down smh
            //use this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart) ?

            //let euhOverlaps = this.daSchedule.addToSchedule(toAdd,false)
            //console.log("onAddMins...After overlap",euhOverlaps) ///nope dont get added as already in!

            //or addtoSchedule? toSee as makes sense...see with flag>>nope still gotta add to schedule!
            //prolly next line better...>>nope no change too
            //this.daSchedule.changeEvtTime(toAdd, aConf.targetStart,false)

            return
        }*/ //else was here
      }
    },
    checkIncludedTitles(toAdd,sched){ //canAutoSchedule --toRename**
        //case sensitive?!? >>yup includes is case-sensitive!
        let toAddInclud = toAdd.title.trim().toLowerCase().includes(sched.title.trim().toLowerCase())
        let scheduledInclud = sched.title.trim().toLowerCase().includes(toAdd.title.trim().toLowerCase())

        //check also for the parent relation?--toSee...especially if too much for no reason....
        let toAddPrt = this.daSchedule.parentGoalById(toAdd.parentGoal) //this.parentGoalsMap().get(toAdd.parentGoal)
        let scheduledPrt = this.daSchedule.parentGoalById(sched.parentGoal) //this.parentGoalsMap().get(currScheduled.parentGoal)
        
        let toAddPrtInclud = toAdd.title.trim().toLowerCase().includes(scheduledPrt.title.trim().toLowerCase())
        let scheduledPrtInclud = sched.title.trim().toLowerCase().includes(toAddPrt.title.trim().toLowerCase())
        
        if (toAddPrtInclud || scheduledPrtInclud){ //auto-schedule...for parents!!---todo***
          //should schedule the subGoal!!! (Next of 'Me Me' parent)
          // OR (if cant for any reason?!?)
          // one of the subGoals of the parent? (parentGoal 'Next' with subgoals-Jobs,Massage,PmP/Pilot,etc)
          //--which should be the one of scheduled or toAdd prolly
          //
          console.log(`checkIncludedTitles:: WOAH PARENT AUTO schedule?--TODO***`,toAddPrtInclud, scheduledPrtInclud,"Normal AUTO>>", toAddInclud, scheduledInclud)//,'direction == surrounding? >>', aConf.direction == 'surrounding')

          //return ...todo**
        }

        if (toAddInclud || scheduledInclud){
          console.log(`checkIncludedTitles:: can AUTO schedule`,toAddInclud, scheduledInclud)//,'direction == surrounding? >>', aConf.direction == 'surrounding')
          return {
            addIncSched:toAddInclud,
            schdIncToAdd:scheduledInclud,
          }
        }
        return false //not too fast here? toTest**
    },
    handleOverlaps(overlaps,override = null,from =''){
      console.log('handleOverlaps >>',JSON.parse(JSON.stringify(overlaps)),"from:"+from)
      for (let key in overlaps) {
        //console.log("handleOverlaps..Handling",key) //,JSON.parse(JSON.stringify(overlaps[key])))
        if (!overlaps[key] || !overlaps[key][0]){//could happen with fixMultiConflicts()--see below! 
          console.log("handleOverlaps...skipping unknown key",key) 
          continue
        }

        let toH = overlaps[key]

        //handling many evts to same(one) evt overlaps
        //--either multiple evts to be added overlap with a single scheduled evt
        //--or single evt to add straddle multiple already scheduled(in middle or surrounding)
        //if (toH.length > 1) { //removed to use manyToOneConflict by default
          //console.log(`handleOverlaps::WOAH WOAH...multiple overlaps!!`,JSON.parse(JSON.stringify(toH)))

        if ("withID" in overlaps){
          console.log(`handleOverlaps::WOAH WOAH...using oneToManyConflict!`,JSON.parse(JSON.stringify(toH)))
          this.oneToManyConflict(toH,override,from)
        }else {
          console.log(`handleOverlaps::WOAH WOAH...using manyToOneConflict!`,JSON.parse(JSON.stringify(toH)))
          this.manyToOneConflict(toH,override,from)
        }
        continue
      }
    },
    handleOverlapss(overlaps,override = null,from =''){ //oldie --toRemove**
      console.log('handleOverlaps >>',JSON.parse(JSON.stringify(overlaps)),"from:"+from)

        const prioLabel = (evt,f) => {
          if (evt?.parentGoal){
            let prt = this.daSchedule.parentGoalById(evt.parentGoal) //this.parentGoalsMap().get(evt.parentGoal)
            return f ? `Of '${prt?.title.trim()}' (${prt?.priority})` : `Of '${prt?.title.trim()}'`
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
              return `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)} && Score:: ${ anEvt.score} for ${anEvt.duration} mins` //at ${whenFrmtTime(anEvt?.time)} >>misleading original evt time
          }
        }

        const aNotif = (mess,warn=false) => {
          this.doNotify(mess, warn? "warning":"positive",'top')
        }

        const updateMoodLabel = (id) => { //force label update
          this.daSchedule.deleteEvtMood(id)
          //this.scheduleMoodsLabel //no need for this
        }

        const doRemove = (evt) => {
          
          let hasMood = this.daSchedule.getCurrentMoods()[evt.id]

          console.log(`handleOverlaps::doRemove ${evt.id}:${evt.title}`)//,hasMood)

          this.daSchedule.removeScheduledEvt(evt,hasMood)
          
        }

        const removeReplace = (toRem,toAdd,aConf) => { 
          //at ${toAdd.time} with ovrd:${override}`, aConf)  //aConf.targetStart.date
          console.log(`handleOverlaps::removeReplace >> replacing>> ${toRem.id}) '${toRem.title.trim()}' WITH ${toAdd.id}) ${toAdd.title.trim()}`, aConf, 'from>'+from)

          //no need line below now...toTest***
          //toAdd = this.addPropsEventsTo(aConf.targetStart.date,[{...toAdd,time:aConf.targetStart.time}]) //proper change of time
        
          if(override){
            console.log("handleOverlaps::removeReplace...OVERRIDE from>>"+from) //,JSON.parse(JSON.stringify(toAdd))
            if (from == 'onDrop'){//for consistency with okChoice....
              doRemove(toRem)
              return
            }

            console.log("handleOverlaps::removeReplace....OVERRIDE updating..."+from)
            //this.updateEvtInScheduleMaps(toAdd[0].id, aConf.targetStart)
            //console.log(`handleOverlaps`,this.startTimesSet,this.endTimesSet,JSON.parse(JSON.stringify(this.scheduledEvents)))
            
            this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart)
            return
          }
        
          doRemove(toRem)

          //this.addEvtPropsIntoSchedule(toAdd[0]) //could this overlap again?!? YES >>handled below

          let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:aConf.targetStart.time}],true)

          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`${from}>handleOverlaps::removeReplace:: OVERLAPS again from adding ${toAdd.id} overlaps =${sizey}`,toAdd,JSON.parse(JSON.stringify(euhOverlaps))) // to ${toReload.length}. on:${this.currentDate} 
            
            this.doNotify(`Extra Overlaps while adding ${toAdd[0].title.trim()}`, "warning",'top')
            return this.handleOverlaps(euhOverlaps,override,from+'nah') //handleOverlaps
          }

          return
        }

        const forceAdd = (toChange, toAdd,conf,toAddy) => { 
          
          //const properT = addToDate(parsed(this.currentDate), { minute: parseTime(toChange.time) }) //just to see >>meh

          console.log(`handleOverlaps::forceAdd:${from} >>${toAdd.id})'${toAdd.title}' at ${toAdd.time}.
          \nChanging >>${toChange.id} from ${toChange.time} `,conf.targetStart.time)//,toAddy)
          
          //console.log(conf, properT)
          if (toAddy){
            console.log(`handleOverlaps::forceAdd::CAN use SAVED***`,toAddy,toAdd)
            Object.assign(toAdd, toAddy) // should use properly saved toAddy
          }


          if (conf.direction !== 'surrounding'){ //this in order to limit going in circles with overlapCheckEvtsAdd()...
            //let noAdd = from == 'onDrop'  //doAdd flag important for small time interval jump
            this.daSchedule.recurChangeTime(toChange.id,toAdd,conf.targetStart,from != 'onDrop') 
          }else{
            console.log(`handleOverlaps::forceAdd: gonna overlapCheckEvtsAdd....`) //happens?!?

            let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:conf.targetStart.time}],true)
            let sizey = Object.keys(euhOverlaps).length
            if(sizey > 0) {
              console.log(`handleOverlaps::forceAdd:: OVERLAPS again of size:${sizey} from >${from}>`+toAdd.title,JSON.parse(JSON.stringify(euhOverlaps)))
              
              //Note*** see with adding 'nah' that no more circles--should be less prolly with recurChangeTime()
              this.doNotify(`Extra Overlaps while adding '${toAdd.title.trim()}' `, "warning",'top')
              return this.handleOverlaps(euhOverlaps,override,from+'nah') //handleOverlaps
            }
          }

          this.daSchedule.toggleActionBtns(true,from)
          //console.log(`handleOverlaps`,this.daSchedule.getAllEvts())
        }

        let onOkChoice = (og,c, toAdd,currScheduled,aConf) => {
          daChoice.push(c)
          if(c == toAdd.id){
            removeReplace(currScheduled,toAdd,aConf)
            aNotif(`by ${og}, Adding '${toAdd.title.trim()}'`,true)
          } else { 
            console.log(`onOkChoice::by ${og},chose scheduled ${c} ...with override?`, override, from)
            aNotif(`by ${og}, Keeping '${currScheduled.title.trim()}'`)

            if(from.indexOf('byMood') > -1){
              //console.log("handleOverlaps::onOkChoice::Moood!! updates? from: "+from,toAdd.title.trim()) 
              updateMoodLabel(toAdd.id)
            }

            if(override){
              doRemove(toAdd)
            }
          }
        }

        let cancelChoice = (toAdd,currScheduled) => {
          if(override){
            console.log("handleOverlaps::cancelChoice::OVERRIDE...coolios!!from:"+from,toAdd.title.trim())

            if (from == 'onDrop'){ //yup on drag/drop >>cancel should just revert to original..toMonitor
              aNotif(`Umm...not moving then....`)

              this.daSchedule.toggleActionBtns(false,'view')//disable saveScheduleBtn

              return 
            }

            doRemove(toAdd)  //remove is proper in other cases though?...prolly
            aNotif(`Keeping '${currScheduled.title.trim()}'`)
            
            return 
          }

          //smh cause it never gets into doRem() and using override flag would affect removeReplace() 
          //--toTest* using 'from' check maybe
          if(from.indexOf('byMood') > -1){
            //console.log("handleOverlaps::cancelChoice >>Mood!!!!updates? from: "+from,toAdd.title.trim())
            updateMoodLabel(toAdd.id) //update label smh
          }
         

          this.daSchedule.toggleActionBtns(true,'view')

          aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
        }

        let onDismissy = (mess,id) => { //,c
          //console.log(mess,'from>>'+from,daChoice,id) //JSON.parse(JSON.stringify(c))

          //to NOT enable even when no change...
          daChoice[0] == id ? this.daSchedule.toggleActionBtns(true,from) : console.log('onDismissy::no change '+from,mess,daChoice[0], id)
        }

        const resolveChoice = (opt,toAdd,currScheduled,aConf,toAddy) => {
          if (opt =='opt3') { //pick Evt
            let m = 'Pick one event...'
            let labels = [
              {label: evtLabels(toAdd,'def'),value: toAdd.id, color: 'secondary' }, 
              {label: evtLabels(currScheduled,'def'),value: currScheduled.id } 
            ]

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
            let labels = [
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
            console.log("chooseEvt::by forceAdd...",toAddy)
            forceAdd(currScheduled,toAdd,aConf,toAddy)  
          }
        }
        //autoSolve flag to not add force in--can result in loop!
        const manualSolve = (opts,toAdd,currScheduled,aConf,autoSolve,toAddy) => { 
          if (aConf.direction !== 'surrounding' && !autoSolve){ //`Force both` to schedule both evts...
            if(from.indexOf('nah') > -1){//...except when previous loop added it!
              console.log("handleOverlaps::manualSolve NOT adding Force as from "+from) 
            } else {
              opts.push({ label: `Force in '${toAdd.title.trim()}'`, value: 'opt4' })  
              // at ${when(aConf?.targetStart?.time)} >> could have changed
            } 
          } //else {
            //console.log("handleOverlaps::manualSolve NO force option...direction!==surrounding?",aConf.direction !== 'surrounding', 'autoSolve?: '+ autoSolve, from)
          //}

          let mess = `Adding '${toAdd.title.trim()}' at ${whenFrmtTime(aConf.targetStart.time)} Overlaps with Scheduled '${currScheduled.title.trim()}' at ${whenFrmtTime(currScheduled?.time)}.
          \nCancel to keep '${currScheduled.title.trim()}' ` // ${whenFrmtTime(toAdd?.time)}
        
          let title = autoSolve ? 'Choose Auto Resolution' : 'Resolve Overlapping Events'
          this.radioChoiceDialog(title,
            mess,
            opts,
            'opt1',
            function(opt){//onOk
              resolveChoice(opt,toAdd,currScheduled,aConf,toAddy)//JSON.parse(JSON.stringify(daChoice)))
            },
            function(){//onCancel
              console.log("handleOverlaps>>manualSolve::cancelChoice>> from: "+from,daChoice[0])//,JSON.parse(JSON.stringify(daChoice)))  //daChoice
              cancelChoice(toAdd,currScheduled)
            })//,
            //function(){//onDismiss //first dialog goes out of view >> nothing to do scheduledEvents
            //  console.log("handleOverlaps>>manualSolve::onDismiss >"+from,daChoice[0])
            //}
          //)
        }

      let daChoice = []
      let toHandleSize = Object.keys(overlaps).length

      ///////////////////// START ///////////////////

      for (let key in overlaps) {
        //console.log("handleOverlaps..Handling",key) //,JSON.parse(JSON.stringify(overlaps[key])))
        if (!overlaps[key] || !overlaps[key][0]){//could happen with fixMultiConflicts()--see below! 
          console.log("handleOverlaps...skipping unknown key",key) 
          continue
        }
         //proper reset by iteration means declaring Opts here --lambda be better? toTry***
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

        //handling many evts to same(one) evt overlaps
        //--either multiple evts to be added overlap with a single scheduled evt
        //--or single evt to add straddle multiple already scheduled(in middle or surrounding)
        //if (toH.length > 1) { //removed to use manyToOneConflict**
          //console.log(`handleOverlaps::WOAH WOAH...multiple overlaps!!`,JSON.parse(JSON.stringify(toH)))

          if ("withID" in overlaps){
            console.log(`handleOverlaps::WOAH WOAH...using oneToManyConflict!`,JSON.parse(JSON.stringify(toH)))
            this.oneToManyConflict(toH,override,from)
          }else {
            console.log(`handleOverlaps::WOAH WOAH...using manyToOneConflict!`,JSON.parse(JSON.stringify(toH)))
            this.manyToOneConflict(toH,override,from)
          }
          continue
       //}

        const aConf = toH.pop() //toH.shift() to resolve in order? >>dont matter!

        let toAdd = this.daSchedule.getSubGoalByID(aConf.target)
        let toAddy = this.daSchedule.getStoredRawEvt(aConf.target) //this is what should be used as was saved..otherwise lose saved notes--todo bring it in forceAdd***
        let currScheduled = this.daSchedule.findSchedEvent(aConf.inConflict) 
        
        if (!currScheduled || !toAdd ){console.log("handleOverlaps...ERROR ERROR no evts found!!!",aConf);return}

        //console.log("handleOverlaps...>>toAddy",JSON.parse(JSON.stringify(toAddy)))//,JSON.parse(JSON.stringify(currScheduled)))

        console.log(`handleOverlaps::ToAdd ${toAdd.id}:${toAdd.title.trim()}(${toAdd.time})++${toAdd.duration} AT >> ${aConf?.targetStart?.time} \n -- ${aConf.direction} ---
        Scheduled ${currScheduled.id}:${currScheduled.title.trim()}(${currScheduled.time})++${currScheduled.duration}`,override,'from:'+from,'toHandle='+toHandleSize) //aConf

        //case sensitive?!? >>yup includes is case-sensitive!
        let toAddInclud = toAdd.title.trim().toLowerCase().includes(currScheduled.title.trim().toLowerCase())
        let scheduledInclud = currScheduled.title.trim().toLowerCase().includes(toAdd.title.trim().toLowerCase())

        //check also for the parent relation?--toSee...especially if too much for no reason....
        let toAddPrt = this.daSchedule.parentGoalById(toAdd.parentGoal) //this.parentGoalsMap().get(toAdd.parentGoal)
        let scheduledPrt = this.daSchedule.parentGoalById(currScheduled.parentGoal) //this.parentGoalsMap().get(currScheduled.parentGoal)
        
        let toAddPrtInclud = toAdd.title.trim().toLowerCase().includes(scheduledPrt.title.trim().toLowerCase())
        let scheduledPrtInclud = currScheduled.title.trim().toLowerCase().includes(toAddPrt.title.trim().toLowerCase())
        
        if (toAddPrtInclud || scheduledPrtInclud){ //auto-schedule...for parents!!---todo***
          //should schedule the subGoal!!! (Next of 'Me Me' parent)
          // OR (if cant for any reason?!?)
          // one of the subGoals of the parent? (parentGoal 'Next' with subgoals-Jobs,Massage,PmP/Pilot,etc)
          //--which should be the one of scheduled or toAdd prolly
          //
          console.log(`handleOverlaps:: WOAH PARENT AUTO schedule?--TODO`,toAddPrtInclud, scheduledPrtInclud,"Normal AUTO>>", toAddInclud, scheduledInclud,'direction == surrounding? >>', aConf.direction == 'surrounding')

        }

        if (toAddInclud || scheduledInclud){ //auto-schedule...shouldnt when can force?!? toMonitor**
          console.log(`handleOverlaps:: can AUTO schedule`,toAddInclud, scheduledInclud,'direction == surrounding? >>', aConf.direction == 'surrounding')
          //JSON.parse(JSON.stringify(toAdd)),JSON.parse(JSON.stringify(currScheduled))
          
          this.scrollToTime(aConf?.targetStart,'slow') 
          //above doesnt seem to work in first loop...second loop neither!! 
          //>>does work when it's one iteration only!

          //should prolly use whenFrmtTime(aConf?.targetStart.time) below--todo**
          let mess = `"${toAdd.title.trim()}" at ${whenFrmtTime(toAdd.time)} related to Scheduled "${currScheduled.title.trim()}" at ${whenFrmtTime(currScheduled.time)}.
          \nAuto resolve Overlap?
          \nCancel/Dismiss to manually choose.`

          this.confirmAction(mess,
          "Auto",
          function(){ //onOk
            if(toAddInclud){
              console.log(`Auto resolve::removeReplace..with TIMES>>`,toAdd.time,currScheduled.time, aConf?.targetStart?.time)
              removeReplace(currScheduled,toAdd,aConf)
              aNotif(`Removing Scheduled to Add '${toAdd.title.trim()}'`,true)
              daChoice.push(toAdd.id) //for dismiss below to toggleActionBtns()
              //return
            } else {
              console.log(`Auto resolve::cancelChoice >> from: `,from)
              cancelChoice(toAdd,currScheduled)
              daChoice.push(currScheduled.id) //for dismiss below to toggleActionBtns()
              //return 
            }
          },
          function(){ //onCancel
            //console.log('Cancelling Auto-Solve...doing manual')
            //overlap might not be valid too with cascading changes!!!
            manualSolve(defaultOpts,toAdd,currScheduled,aConf,true,toAddy)  //flag to pass on that could auto-resolve
          },
          function(){ //onDismiss--just to enable saveSchedule btn
            //this.daSchedule.toggleActionBtns(true,from)
            onDismissy("Auto-dismiss",daChoice[0])
          })
        } else {
            manualSolve(defaultOpts,toAdd,currScheduled,aConf,false,toAddy)
        }
      }
    },
    oneToManyConflict(conflicts,override = null,from=''){
      let label = ''

      let toAdd = null  
      let allEvts = []  //so diff from multiConflicts as would have multiple schduled evts in conflict with toAdd
      let toKeep = []
      let choices = new Map() //for user choices

      let targetStart = null //when...if has changed....

      let defaultOpts = [{ label: 'Pick one event', value: 'opt3' }]
          
        //const mapToLabels = anEvt => {
        //  let prt = this.daSchedule.parentGoalById(anEvt.parentGoal) //this.parentGoalsMap().get(anEvt.parentGoal)
        //  return { label: `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) for ${anEvt?.duration} mins`, value: anEvt.id }
        //}
        
        const findhighestPrio = evts => {
          return this.findhighestPrio(evts)
        }

        let smallestScoreInterval= (conflictEvts) => { //should handle possible error 
          return this.getSmallestScoreInterval(conflictEvts)
        }

        let removeConflicts = (toKeepArr, allConflicts) => { //toKeepArr should be single elt
          //console.log(`fixMultiConflicts::removeConflicts with toKeep=${toKeepArr.length} out of total:${allConflicts.length}`)

          let extraO = []  //arr?
          allConflicts.forEach((value, valueAgain, set) => {
            //console.log(`removeConflicts..checking`,value.id,toAdd,targetStart.time) //valueAgain
            if (toKeepArr.find(item => item.id == value.id)){
              if (value.id == toAdd.id){
                console.log(`removeConflicts::toAdd kept!>`+targetStart.time, value?.title.trim(),'at orig: '+value?.time,from)
                if (from == 'onDrop'){//nothing for onDrop as already in schedule...
                  console.log(`removeConflicts...NOTHING to do as from`+from)
                  //continue
                } else {
                  //let eee = this.addPropsEventsTo(this.currentDate,[{...value,time:targetStart.time}])
            
                  let choice = choices.has(value.id) ? choices.get(value.id) : ''  //bon see...

                  //this.addEvtPropsIntoSchedule(eee[0])
                  //let euhOverlaps = this.overlapCheckEvtsAdd(eee) //use this instead of above to fix extra overlaps
                  // false flag to skip overlap check--important!!
                  let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...value,time:targetStart.time}],false)
                  if(Object.keys(euhOverlaps).length > 0){
                    console.log(`removeConflicts::OVERLAP on add`,euhOverlaps,value,targetStart.time)
                    extraO.push(euhOverlaps) 
                  }else{
                    console.log(`removeConflicts::Great NO overlap`,value?.title.trim())
                    let mes = `${choice} Adding '${value?.title.trim()}' at ${whenFrmtTime(targetStart.time)}` //add parent?!? or more info? tbd**
                    this.doNotify(mes, "positive",'top')
                  }
                }
              } else { //nothing to do for scheduled
                console.log(`oneToManyConflict::removeConflicts....Keeping scheduled Evt!!`,targetStart, value.id)
                let mess = `${choices.has(value.id) ? choices.get(value.id) : ''} Keeping scheduled '${value?.title.trim()}'`
                this.doNotify(mess, "positive",'top') //at ${when(targetStart)}
              }
            } else {
              if (value.id != toAdd.id){ //remove scheduled..necessary as it's solving the overlap!
                console.log(`oneToManyConflict::removing scheduled...doNotify?`,value.id, value.title,value.time)
                
                //if (this.usingMoods[value.id]){ //toTest**
                let u = this.daSchedule.getCurrentMoods()[value.id] 
                //  delete this.usingMoods[value.id]
                //  console.log(`fixMultiConflicts::removeConflicts>>deleting Moody...`+value.id,this.scheduleMoodsLabel) //update label--toSee**
                //}

                //this.doRemove(value) //fixMultiConflicts
                this.daSchedule.removeScheduledEvt(value,u)
                //doNotify?!? bof prolly no need...toSee if below not too much!
                this.doNotify(`Removed scheduled '${value?.title.trim()}'`, "warning",'bottom')
              } else {//toAdd Not in those to keep...so nothing to do
                console.log(`removeConflicts::NOT adding original target`,toAdd.id)
              }
            }
          })

          if(extraO.length > 0) {//shouldnt be more than one?..can end in loop when not using flag to skip overlap check!
            console.log(`${from}> oneToManyConflict::removeConflict:: OVERLAPS again=${extraO.length}`,extraO)
            this.doNotify("More Overlaps to fix!!!", "warning",'top')
            return this.handleOverlaps(extraO[0],override,from+'nah')
          }

          //let f = this.updateCurrentSchedule()
          
          //if (f.size > 0){
           // console.log('fixMultiConflicts::removeConflicts::SAMESTART', f)
           // this.fixSameStart(f) //fixMultiConflicts
          //}

          //this.daSchedule.saveDaySchedule() //no need yet prolly...toReview**
        }

        const forceAdd = (evt,timey) => {
          console.log(`At ${timey.date}:${timey.time} forceAdd:${evt.id} ${evt.title} from ${evt.time} >>`+from,JSON.parse(JSON.stringify(toAdd)),allEvts.length,allEvts[allEvts.length-1])
   
          //this.recurChangeTime(allEvts[allEvts.length-1].id,evt,timey, true, true) //skipAsk user as should force!
          
          //let addy = this.addPropsEventsTo(timey.date,[{...evt,time:timey.time}]) //umm timey.date?!? toSEE**

          //let euhOverlaps = this.overlapCheckEvtsAdd(addy)
          let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...evt,time:timey.time}],true)
          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`${from} >oneToManyConflict::forceAdd:: OVERLAPS again from ${toAdd.length} overlaps =${sizey}`,JSON.parse(JSON.stringify(euhOverlaps)))
            
            this.doNotify(`Extra Overlaps while adding '${evt.title.trim()}'`, "negative",'top')
            //return this.fixyOverlaps(euhOverlaps,override,from+'nah') //fixMultiConflicts
            return this.handleOverlaps(euhOverlaps,override,from+'nah')
          }
        }

        let chooseEvt = (conflictEvts) => {
          this.radioChoiceDialog('',
              'Choose one Event to keep',
              conflictEvts.map(this.getEvtLabel),
              '',
              function(d){ //onOk
                //console.log('chooseEvt::chose',d)
                //if (d == currScheduled.id){//chosen scheduled...
                //    console.log('onOk::Chosen Scheduled', d,currScheduled.id) //should be same!!--no need for this...
                //}
                let e = conflictEvts.find(x => x.id == d)
                if(e){
                  toKeep.push(e)
                  choices.set(e.id,"By choice,")
                }else{console.log('chooseEvt::ERROR NOT FOUND!!',d);return} //can this happen?!? toMonitor**
                
                console.log(`chooseEvt::onOk >>${d} >> ${e?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
                return e
              }, 
              null, //onCancel--no need as have to choose!!!
              function(){//onDismiss
                //console.log('chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

                if (toKeep.length > 0 ) { //== conflicts.size te than main dialog!
                  console.log('chooseEvt::onDismiss >>set removeConflicts out of total='+conflictEvts.length, JSON.parse(JSON.stringify(toKeep))) //,allConfs
                  
                  setTimeout(() => {
                    removeConflicts(toKeep,conflictEvts)
                  }, 0)
                }
              }
          )
        }
    
      ////add relevant options....
      if (from == 'byScore'){
        defaultOpts.unshift({ label:'Resolve by Highest Priority', value: 'opt1', color: 'secondary'})
      } else if (from == 'byPrio'){
        defaultOpts.unshift({ label: 'Resolve by Shortest Score Interval', value: 'opt2'}) //Lowest Score Interval
      } else { //default all!--no force option here! 
        defaultOpts.unshift(
          { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
          { label: 'Resolve by Shortest Score Interval', value: 'opt2' }, //Lowest Score Interval
        )
      }
    
      ///////////////START ///////////

      for (let aConf of conflicts) {
        console.log("oneToManyConflict::Handling:> "+from,JSON.parse(JSON.stringify(aConf)))

        let aScheduled = this.daSchedule.findEvent(aConf.inConflict) //this.getScheduledEvent(aConf.inConflict)
        if (!aScheduled) {console.log("oneToManyConflict...ERROR ERROR no evts found!!!",aConf);return}
        
        allEvts.push(aScheduled)

        label += ` '${aScheduled?.title.trim()}',\n`

        if (!targetStart){
          targetStart = aConf?.targetStart
        } else{
          if (targetStart.time != aConf?.targetStart?.time){console.log("oneToManyConflict...ERROR Not same targetStart?!?",targetStart,  aConf?.targetStart,aConf.direction); }
        }

        let addin = this.daSchedule.getSubGoalByID(aConf.target) //this.getLocalEvt(aConf.target)
        if (!addin) {console.log("oneToManyConflict...ERROR ERROR local evt not found!!!",aConf);return}

        //if (addin.id != toAdd?.id){//should show at first conflict
        //  console.log("fixMultiConflicts...umm Not same ID?!?", addin, toAdd)
        //}
        
        toAdd = addin  //hopefully no overwrite...

        //add force to schedule all evts...crude way of checking defaultOpts mais bon...
        if (aConf.direction !== 'surrounding' && defaultOpts.length < 3){ 
          defaultOpts.push({ label: `Force in '${toAdd.title.trim()}'`, value: 'opt4' })  //at ${aConf?.targetStart?.time}${when(aConf?.targetStart?.time)} ?
        }
      }
      
      let mess =  `'${toAdd?.title.trim()}' conflicts with scheduled ${label} \n`
      
      allEvts.unshift(toAdd) //just for completeness..


      this.radioChoiceDialog('Solve Overlaps!!',
        mess,
        defaultOpts,
        '', //no selection at first..
        function(opt){ //onOk
          if(opt == 'opt3'){ //choose by Event
            chooseEvt(allEvts)
            //return ? //nothing?  //a//JSON.parse(JSON.stringify(a))
          } else if (opt =='opt2'){
            let a = smallestScoreInterval(allEvts)
            console.log('oneToManyConflict::ByScore',a.id,a?.title.trim(), a.score) //,a.details //JSON.parse(JSON.stringify(toKeep))
            toKeep.push(a)
            choices.set(a.id,`By shortest score interval (${a.score}),`)
          } else if (opt =='opt1'){
            let a = findhighestPrio(allEvts)
            console.log('oneToManyConflict::ByPriority',a.e.id,a?.e?.title.trim()) //, a.score,a.details,//JSON.parse(JSON.stringify(cIDs))
            toKeep.push(a.e)
            choices.set(a.e.id,`By highest priority (${a.prio}),`)
          } else { //opt4 > forceAdd
            console.log('oneToManyConflict::forceAdd...')
            forceAdd(toAdd,targetStart) //bon just force that one!
          }
        },
        null,//onCancel...null so that it's false for cancel btn! Cancel SHould keep scheduled!! --todo** //function(){},  >>
        function(){ //onDismiss.
          if (toKeep.length > 0) { //== conflicts.size
            console.log('oneToManyConflict::onDismiss Main >> removeConflicts from total='+allEvts.length,JSON.parse(JSON.stringify(toKeep)))
              
            setTimeout(() => {
              removeConflicts(toKeep,allEvts) 
            }, 0)
              
          }//else{}//no need mais bon in case did forceAdd? 
        }
      )
    },
    //when multiple evts to be added have conflict with single scheduled evt
    manyToOneConflict(conflicts,override = null,from=''){
  
      let label = ''

      let toAdd = []
      let currScheduled = null //SHOULD be one evt instead of using Set >>let allConfs = new Set()
      let toKeep = []

      let targetStart = null //when...if has changed....

      let forceAddy = new Map() //in case of forceAdd 
      let choices = new Map() //for user choices

      let defaultOpts = [{ label: 'Pick one event', value: 'opt3' }]
        
        const findhighestPrio = allEvts => {
          return this.findhighestPrio(allEvts)
        }

        let smallestScoreInterval = (conflictEvts) => { //should handle possible error 
          return this.getSmallestScoreInterval(conflictEvts)    
        }

        let removeConflicts = (toKeepArr, allConflicts) => { //toKeepArr should be single elt
          console.log(`manyToOneConflict::removeConflicts with toKeep=${toKeepArr.length} out of total:${allConflicts.length}`)//JSON.parse(JSON.stringify(allConflicts)))

            let extraO = []
            allConflicts.forEach((value, valueAgain, set) => {
              //console.log(`removeConflicts..checking`,value.id) //valueAgain
              if (toKeepArr.find(item => item.id == value.id)){
                let choice = choices.has(value.id) ? choices.get(value.id) : '' 
                let timey = forceAddy.has(value.id) ? forceAddy.get(value.id) : null
                console.log(`manyToOneConflict::removeConflicts:KEEEP..TIME? by>`+choice,value.id, value?.title.trim(),value?.time,targetStart,timey?.time)
              
                timey ? this.scrollToTime(timey,'slow') : console.log(`removeConflicts::cant scrolly as null`,timey) //could happen when keeping currentScheduled
                
                if (value.id != currScheduled.id){

                  let toAddy = this.daSchedule.getStoredRawEvt(value.id)  //run risk of overwriting? toTest**
                  if (toAddy){
                    console.log(`removeConflicts::CAN use SAVED for:`+value.id,toAddy)
                    Object.assign(value, toAddy) // should use properly saved toAddy
                  }

                  //have to check overlap so cant use recurChangeTime()
                  //could check !surrounding to use it still maybe? toSee...
                  let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...value,time:targetStart}],true) //,notes:currScheduled.notes
                  let sizey = Object.keys(euhOverlaps).length
                  if(sizey > 0) { 
                    extraO.push(euhOverlaps)
                    this.doNotify(`Extra Overlaps while adding '${value?.title.trim()}'`, "negative",'top')
                  } else {
                    //console.log(`manyToOneConflict::removeConflicts--no other overlap`,value?.title.trim())
                    let mes = `${choice} Adding '${value?.title.trim()}' at ${whenFrmtTime(targetStart)}` 
                    this.doNotify(mes, "warning",'top')
                  } 
                  
                } else { //nothing to do as keep scheduled..
                  //console.log(`manyToOneConflict::removeConflicts...Woo scheduled!!`,value?.title.trim()) //targetStart, value
                  this.doNotify(`${choice} Keeping scheduled '${value?.title.trim()}' `, "positive",'top') //at ${when(targetStart)}
                }
              } else {
                if (value.id == currScheduled.id){ //remove scheduled
                  console.log(`manyToOneConflict::removeConflicts...removing scheduled!!`,value.id, value.title)
                  
           
                  let u = this.daSchedule.getCurrentMoods()[value.id] 

                  this.daSchedule.removeScheduledEvt(value,u)
                  //doNotify?!? >>meh no need
                } //else {//nothing...no need to add it...prolly
                // console.log(`removeConflicts...NOT adding...`,value)
                //}
              }
            })

            if(extraO.length > 0) {//shouldnt be more than one... toTest**
              console.log(`${from} > manyToOneConflict::removeConflicts:: OVERLAPS again from ${toKeepArr.length} overlaps =${extraO.length}`,extraO) // to ${toReload.length}. on:${this.currentDate} 
              this.doNotify("More Overlaps to fix!!!", "warning",'top')
              
              return this.handleOverlaps(extraO[0],override,from+'nah') //manyToOneConflict
            }

            this.daSchedule.toggleActionBtns(true,from)
            

            //this.daSchedule.saveDaySchedule() //no need yet--could move up after removeEvt maybe...
        }

        let chooseEvt = (conflictEvts) => {
          this.radioChoiceDialog('',
              'Choose one Event to schedule',
              conflictEvts.map(e => this.getEvtLabel(e,false)), //could pass targetStart instead of false? toSee**
              '',
              function(d){ //onOk
                //console.log('chooseEvt::chose',d)
                //if (d == currScheduled.id){//chosen scheduled...
                //    console.log('onOk::Chosen Scheduled', d,currScheduled.id) //should be same!!--no need for this...
                //}
                let e = conflictEvts.find(x => x.id == d)
                if(e){
                  toKeep.push(e)
                  choices.set(e.id,"By pick,")
                }else{console.log('chooseEvt::ERROR NOT FOUND!!',d);return} //can this happen?!? toMonitor**
                
                //console.log(`chooseEvt::onOk >>${d} >> ${e?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
                return e
              }, 
              null, //onCancel--no need as have to choose!!!
              function(){//onDismiss
                //console.log('chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

                if (toKeep.length > 0 ) { //== conflicts.size te than main dialog!
                  console.log('chooseEvt::onDismiss >> LAST?', JSON.parse(JSON.stringify(toKeep))) //,allConfs
                  
                  setTimeout(() => {
                    removeConflicts(toKeep,conflictEvts)
                  }, 0)
                }
              }
          )
        }

        const forceAdd = (conflictEvts) => {
          let extraO = []  //arr?
          conflictEvts.forEach((obj) => {
            //console.log(`manyToOneConflict::forceAdd at ${obj?.time} > ${obj?.title?.trim()}`,JSON.parse(JSON.stringify(obj)))
            if (currScheduled.id == obj.id){
              console.log(`manyToOneConflict::forceAdd...SKIP scheduled`,currScheduled.title)
            } else {
              let timey = forceAddy.has(obj.id) ? forceAddy.get(obj.id) : null
              console.log(`manyToOneConflict::forceAdd...NEW:${obj.id} '${obj.title.trim()}' dura= ${obj.duration} origAt: ${obj.time} to>>`,timey.time,"from>>"+from,from != 'onDrop')

              this.scrollToTime(timey,'slow') 

              let toAddy = this.daSchedule.getStoredRawEvt(obj.id)
              if (toAddy){
                console.log(`forceAdd::CAN use SAVED*** for:`+obj.id,toAddy,JSON.parse(JSON.stringify(obj)))
                Object.assign(obj, toAddy,{time:timey.time}) // should use properly saved toAddy..
                //beware to not overwrite duration or time...for drag/drop or addMins
              }

              // seems better than addGoalsToSchedule() ...should check for !surrounding 
              //but it's implied when gets here !!
              this.daSchedule.recurChangeTime(currScheduled.id,obj,timey, from != 'onDrop') //skipAsk user as should force! 
        
              //let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...obj,time:timey.time}],true)
              
              /*let sizey = Object.keys(euhOverlaps).length
              if(sizey > 0) {
                console.log(`${from} forceAdd:: OVERLAPS!! ${conflictEvts.length} overlaps =${sizey}`,JSON.parse(JSON.stringify(euhOverlaps)),obj)
                
                this.doNotify(`Extra Overlaps while adding '${obj.title.trim()}'`, "negative",'top')
                //prolly cant do below in loop so have to add...
                //return this.handleOverlaps(euhOverlaps,override,from+'nah')
                extraO.push(euhOverlaps)
              }else{ //all good..
                //console.log(`manyToOneConflict::forceAdd>>Great NO overlap`,obj?.title.trim())
                let mes = `Force adding '${obj?.title.trim()}' at ${whenFrmtTime(timey.time)}`
                this.doNotify(mes, "positive",'top')
              }*/
            }
          })

          if(extraO.length > 0) { //redundant--toRemove**
            console.log(`${from}> manyToOneConflict::forceAdd:: OVERLAPS again=${extraO.length}`,extraO)
            this.doNotify("More Overlaps to fix!!>"+extraO.length, "warning",'top')

            //shouldnt be more than one?...todo still in loop just in case***
            //can still end in loop when not using flag to skip overlap check? toTest**
            //return this.handleOverlaps(extraO[0],override,from+'nah')
          }//*/

          this.daSchedule.toggleActionBtns(true,from)
          //this.daSchedule.saveDaySchedule() //not yet needed //manyToOneConflict
        }

          ////add relevant options....
      if (from == 'byScore'){
        defaultOpts.unshift({ label:'Resolve by Highest Priority', value: 'opt1', color: 'secondary'})
      } else if (from == 'byPrio'){
        defaultOpts.unshift({ label: 'Resolve by Shortest Score Interval', value: 'opt2'})
      } else { //default all!--no force option here! 
        defaultOpts.unshift(
          { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
          { label: 'Resolve by Shortest Score Interval', value: 'opt2' },
        )
      }

      ////////////START ///////////

      let hasSurr = false  //in case encounter surrounding>shouldnt offer force option!

      for (let aConf of conflicts) {
        console.log("manyToOneConflict::handling:>"+from,JSON.parse(JSON.stringify(aConf))) //toSee if have >> aConf.direction !== 'surrounding'  //+from,defaultOpts,

        let aScheduled = this.daSchedule.findEvent(aConf.inConflict) //this.getScheduledEvent(aConf.inConflict)
        if (!aScheduled) {console.log("manyToOneConflict...ERROR ERROR no evts found!!!",aConf);return}
        
        if (!currScheduled){
          currScheduled = aScheduled
          targetStart = aConf?.targetStart?.time
        } else{//below shouldnt happen?... return?
          if (currScheduled.id != aScheduled.id){console.log("manyToOneConflict::ERROR::ERROR Not same inConflict",currScheduled.id ,aScheduled.id); }  
        }
        let addin = this.daSchedule.getSubGoalByID(aConf.target) //this.getLocalEvt(aConf.target)
        if (!addin) {console.log("manyToOneConflict...ERROR ERROR local evt not found!!!",aConf);return}
       

        label += ` '${addin?.title.trim()}',\n`
        toAdd.push(addin)

        forceAddy.set(aConf.target,aConf?.targetStart) //...needed? >yup as have string time when should be timestamp...
        //add direction?!?--toSee**
        aConf.direction == 'surrounding' ? hasSurr = true : hasSurr = hasSurr  //umm...

        if (aConf?.targetStart?.time != targetStart){ //redundant...
          console.log(`manyToOneConflict::WELL WELL timey diff?`, targetStart, aConf?.targetStart?.time, aConf?.direction, addin.title)
          //nothin to do...prolly? >> as need to decide on one evt 'tween multiple evts >> but think possible in this case...
          //addForce = true
        }
      }

      if (hasSurr || from.indexOf('nah') > -1){ //force when not added in previous loop
        console.log("manyToOneConflict::NOT adding Force as from "+from,hasSurr) 
      } else { //toTest** that above doesnt get here somehow!
        defaultOpts.push({ label: `Force in > ${label}`, value: 'opt4'}) // 'Force Schedule them in'
      }

      let mess =  `${label} conflicts with scheduled '${currScheduled?.title.trim()}' at ${whenFrmtTime(currScheduled?.time)}.\n`
      
      //console.log(`manyToOneConflict...`,JSON.parse(JSON.stringify(currScheduled)))
      toAdd.unshift(currScheduled) //just for completeness.

      this.radioChoiceDialog('Many to One Overlaps!',
        mess,
        defaultOpts,
        '', //no selection at first..
        function(opt){ //onOk
          if(opt == 'opt3'){  //choose by Event
            chooseEvt(toAdd)
            //return ? //nothing?  //a//JSON.parse(JSON.stringify(a))
          } else if (opt =='opt2'){
            let a = smallestScoreInterval(toAdd)
            //console.log('manyToOneConflict::ByScore',a.id,a?.title.trim(), a.score) //,a.details //JSON.parse(JSON.stringify(toKeep))
            toKeep.push(a)
            choices.set(a.id,`By Shortest score interval (${a.score}),`)
          } else if (opt =='opt1') {
            let a = findhighestPrio(toAdd)
            //console.log('manyToOneConflict::ByPriority',a.e.id,a?.e?.title.trim()) //, a.score, a.details,//JSON.parse(JSON.stringify(cIDs))
            toKeep.push(a.e)
            choices.set(a.e.id,`By highest priority (${a.prio}),`)
          } else { //forceAdd...could leave other overlaps with cascading time change but oh well
            forceAdd(toAdd) 
            //no adding to toKeep and avoid triggering dismiss below!!
          }
        },
        null,//onCancel...null so that it's false for cancel btn! Cancel SHould keep scheduled!! --todo** //function(){},  >>
        function(){ //onDismiss.
          if (toKeep.length > 0) {
            console.log('manyToOneConflict::onDismiss Main >> LAST?',toKeep) //JSON.parse(JSON.stringify(toKeep))
              
            setTimeout(() => {
              removeConflicts(toKeep,toAdd)
            }, 0)
          }
        }
      )
    },
    reset() { //reset variable for next use 
      this.selectedItem = null
      this.targetDrop = null
      this.touchedItem = null 
     
      this.daSchedule.resetChosen() //explicit reset of dropdown chosenScore && chosenPrio values

      this.possibleRange = null 
    },
    closingDialog(){// close dialog
      this.showEvtDialog = false
    },
    onPickEvent(addE,skipAsk,useBalance) { 
      //console.log('onPickEvent',addE,skipAsk,useBalance)
    
      this.showEvtDialog = false

      if(!addE){
        console.log("onPickEvent...ERROR nothing!", addE, skipAsk,useBalance)
        this.doNotify("No Goal selected...")
        this.reset() //onPickEvent
        return 
      }
      
      let doForce = this.daSchedule.isViewingPast() ? true : skipAsk //inPast >>just force!!

      //console.log(`onPickEvent::(${addE.id})' ${addE.title.trim()}' from ${addE.time} to ${this.targetDrop.timestamp.time} with force?${skipAsk} BUT Forcing?:${doForce}`,this.targetDrop.timestamp)

      let isClose = this.daSchedule.tooClose(this.targetDrop.timestamp, addE.duration) //this.tooClose(this.targetDrop.timestamp, addy.duration)//could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt** 
        
      if(isClose){
        console.log("onPickEvent::tooClose check FAIL!",isClose) 
        if(isClose === true){
          this.doNotify("Picking event TOO close to midnight!")
          this.reset() //onPickEvent
          return          
        }

        if(doForce){ 
          this.doNotify(`'${addE.title.trim()}' TOO close Buuut..FORCING!`,"warning","top")
        } else{
          this.doNotify(`'${addE.title.trim()}' Not added as TOO close to a scheduled Evt`)
          this.reset() ////onPickEvent
          return 
        }
      }
        
      let res = this.daSchedule.onPickEvent(addE,this.targetDrop.timestamp,doForce,useBalance)
      
      //this.handleOverlaps(res.overlaps,null,'onPickEvt')//this.fixyOverlaps(euhOverlaps,null,"onPickEvt") //onPickEvt
      if(!res.canContinue){ //&& !anyOverlap.overlaps
        console.log("onPickEvent::OVERLAPS!",JSON.parse(JSON.stringify(res)))
        if(res.overlaps && Object.keys(res.overlaps).length > 0){
            
          this.handleOverlaps(res.overlaps,null,'onPickEvt')//todo** use doForce flag!!--could pass it instead of null for override? toSee**
        }
        else{ 
          this.doNotify(`Error? onPickEvt :(`, "negative",'bottom')//prolly nothing?--toTest***
        }
      }else{
        if (useBalance){
          console.log("onPickEvent::NO OVERLAPS")//,res,this.daSchedule.getCurrentBalance())
          this.doNotify("What is Owed PAID! gg!","positive",'top')
        }
      }
    },
    onAddHocEvent(goalTitle, parentGoal, own, interval,useBalance){
      //console.log('onAddHocEvent',goalTitle, parentGoal, own, interval,useBalance)
      if (!this.possibleRange){
        //console.log("umm onAddHocEvent... not a range selection", this.startEndTimes)  //just in case it's single cell selction
        this.possibleRange = this.startEndTimes
      }
      if (goalTitle.trim() == ""){
        this.doNotify("Empty Goal title...")
        this.showEvtDialog = false
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
          
        this.showEvtDialog = false //needed still with closingDialog?!? >> yep as reverts to default choice dialog...
        return
      }

      let subID = this.daSchedule.saveNewGoal(timeStart,goalTitle, parentGoal, own,duration)//interval


      this.showEvtDialog = false  //close dialog

      //then add to schedule
      if (subID) {

        let res = this.daSchedule.onAdHocEvent(subID,useBalance)
        
        if (!res.canContinue){ //&& !anyOverlap.overlaps
          console.log("onAddHocEvent::OVERLAPS?",res,Object.keys(res.overlaps).length)
          if (res.overlaps == null){
            this.doNotify("Error Adding this event :(", "negative")
            console.log("onAddHocEvent::ERROR?",JSON.parse(JSON.stringify(res)))
            return
          } else {  
            this.handleOverlaps(res.overlaps,null,'adHocEvt') //adHocEvt
            //should use below as it's single elt? >>meh handleOverlaps better for cascading time change?
            // this.movedIntoConflict(res.overlaps,null,'adHocEvt')
          }
  
        } else{
          //console.log("onAddHocEvent::ALLGOOD",res,this.possibleRange)
          this.constructTree() //update to show newest
          this.reset() //to clear this.possibleRange for next use
          this.doNotify("New adHoc Evt added!","positive",'top')
        }

      } else{
        console.log("BOO ERROR no subID:(",subID)
        this.doNotify("Error creating and adding this event :(", "negative")
      }
    },
    onEndNow(id){
        const doRemove = () =>{
          console.log(`onEndNow::removing and saving!`,id)
          let evt = this.daSchedule.findEvent(id) //findSchedEvent
          this.daSchedule.removeScheduledEvt(evt)
         
          //this.doSaveSchedule() //onEndNow 
          //yeah just gonna save automatically esti!
          this.daSchedule.saveDaySchedule()
        }

        const reduce =(dura) =>{
          console.log(`onEndNow::reducing!!!`,id,Number.isInteger(dura))
          this.daSchedule.reduceEvtDuration(id,dura)
        }
      
      let canEnd = this.daSchedule.canEndNow(id)

      if (!canEnd){//error if not number...undefined is ok!
        console.log('onEndNow...Can NOT end?',id,canEnd,Number.isInteger(canEnd))
      }else{
        this.confirmAction("Less than 10mins remove?\n Cancel to just EndNow","OK", doRemove,function(){reduce(canEnd)} )  //reduce
      }
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
      //console.log('onAddMins',id,mins)
      let res = this.daSchedule.addMinsToEvt(id,mins)

      if(!res.canContinue){ //&& !anyOverlap.overlaps
        if(res.overlaps && Object.keys(res.overlaps).length > 0){
          console.log("onAddMins::OVERLAPS!!"+mins,res) 

          return this.movedIntoConflict(res.overlaps,true,"onAddMins",mins)
  
        }else{ //toTest***
          this.doNotify(`Add ERROR:(`, "negative",'bottom')
        }
      }
      //this.daSchedule.saveDaySchedule() //save? nah ...
      //this.daSchedule.toggleActionBtns(true,'onAddMins')
    },
    removeEvtInSchedule(evt){
      let doSave = false //just for moods.../default no need to save...

        let aRemove = () => { //autoSave=false 
          //this.doRemove(evt) //removeEvtInSchedule
          this.daSchedule.removeScheduledEvt(evt,doSave)
          
          if (doSave){ //autoSave
            //this.doNotify("removeEvtInSchedule..autoSave for: "+evt.title)
            console.log("removeEvtInSchedule..autoSave for: "+evt.title)

            this.daSchedule.saveDaySchedule()
            return
          }

          //this.disableSaveSchedule = false  //allow saving schedule
          //this.showReloadBtn = this.hasEventsForDate
          this.daSchedule.toggleActionBtns(true,'view')
        }
      
      //inPast--choose alternative.. Not for small evts as just addBalance
      if(this.daSchedule.isViewingPast()){
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
    getEvtLabel(anEvt,atTime = null){ //flag to not add time as can be misleading when it's the original evt time but getting added at different time
      let prt = this.daSchedule.parentGoalById(anEvt.parentGoal)
       
      let l = `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) `
      
      //whenFrmtTime(atTime) >>in case passed in? toSee**
      l += atTime ? `@ ${whenFrmtTime(anEvt?.time)} ++ ${anEvt?.duration} mins` : `for ${anEvt?.duration} mins`
      //addTime ? l = l + `@ ${whenFrmtTime(anEvt?.time)} ++ ${anEvt?.duration} mins` : l = l +  `for ${anEvt?.duration} mins`
      return { label: l, value: anEvt.id } //`Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) @ ${whenFrmtTime(anEvt?.time)} ++ ${anEvt?.duration} mins`
          //return { label: anEvt.title.trim() + " for " + anEvt.duration + 'min. With score '+ '('+ anEvt.score + ')' +' At '+ anEvt.time , value: anEvt.id } // color: 'secondary'
    },
    getSmallestScoreInterval(evts){ //toReview*** as could return null
      let lowScore = 9  //upper start
      let current = null
      for (let e of evts) {
        let daScore = parseScore(e.score)
        if(daScore > -1 && daScore <= lowScore) {
          lowScore = daScore
          current = e//e.id
        }
      }

      if (current){
        //console.log('getSmallestScoreInterval::score interval', current.id,current?.title.trim(), current.score) //current) //,current.details
        return current
      }else{console.log('ERROR ERROR getSmallestScoreInterval::No current set?',lowScore, current,evts)} //shouldnt happen!!--toMonitor**
    },
    findhighestPrio(evts){
      let highest = 0
      let toRet = null
      
      for (let evt of evts) {
        if(evt.parentGoal){
          let prt = this.daSchedule.parentGoalById(evt.parentGoal) //this.parentGoalsMap().get(evt.parentGoal)
          if (prt){
            if (prt.priority > highest){ //umm what happens when no priority? **toTest**
              highest = prt.priority
              toRet = evt
            }
          }else{console.log('findhighestPrio::ERROR no PARENT found?',evt)}

        }else{console.log('findhighestPrio::ERROR EVT not found?',evt)}
      }

      //console.log('multiConflicts::findhighestPrio...',toRet?.title.trim(), highest) //allEvts
      //choices.set(toRet.id,`By highest priority (${highest}),`)
      return {e:toRet,prio:highest}
    },
    chooseAlternatives(evt){

        let sorty = (a, b) => { 
          if (a.parentGoal > b.parentGoal) return 1; 
          if (a.parentGoal == b.parentGoal) return 0; 
          if (a.parentGoal < b.parentGoal) return -1;
        }

      let alts = this.daSchedule.getAltEvts().sort(sorty)
      let now = parseDate(new Date())

      console.log('chooseAlternatives >>ALTS:',JSON.parse(JSON.stringify(alts)),now.date)
      
      let evtTimey = evt.time //for scheduling later
      let futureDatey = now.date

      let title = evt.title //for notes

        /*const mapToLabels = anEvt => {
          let prt = this.daSchedule.parentGoalById(anEvt.parentGoal) //parentGoalsMap().get(anEvt.parentGoal)
          return { label: `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) :: ${whenFrmtTime(anEvt?.time)} for ${anEvt?.duration} mins`, value: anEvt.id }
          //return { label: anEvt.title.trim() + " for " + anEvt.duration + 'min. With score '+ '('+ anEvt.score + ')' +' At '+ anEvt.time , value: anEvt.id } // color: 'secondary'
        }*/

        //umm this looks at current day schedule...
        //should look into next day as well?!?--toReview***
        const filterOutScheduled = evts => { 
          return evts.filter(x => !this.daSchedule.getAllEvts().find(item => item.id == x.id)) //this.actualEvts
        }

        const addInFutur = (eArr) => { // dialogs make it impo! to move into daySchedule class smh
          let startDay = addToDate(parsed(futureDatey),{ day: 0 }) //think need options >> yup! //SHOULD be sometime in present or future
          let altDay = addToDate(parsed(startDay.date), { day: 1 }) 
          //console.log("addInFutur...",futureDatey,startDay,altDay)//JSON.parse(JSON.stringify(toAdd))
          let EvtsOn = this.daSchedule.getEventsForDate(startDay.date) 
          let toSave = {}
          let toAddy = null  //bon hopefully no overwrite as should be one evt
          if (!EvtsOn){
            console.log("chooseAlternatives::addInFutur EMPTY for >>...",startDay.date)//could be null!
          } else {
            toSave = EvtsOn 
          }

          eArr.forEach(i => {
            //let 
            toAddy = this.daSchedule.getSubGoalByID(i) //this.getLocalEvt(i) //use the `alts` too?!?
            //console.log("addInFutur...",i,JSON.parse(JSON.stringify(toAddy)))

            if(toSave[i]){//Not override if already present!!
              console.log("addInFutur...ALREADY PRESENT",i,startDay.date,toAddy?.title.trim()) //JSON.parse(JSON.stringify(toAddy))
              this.doNotify(`Alternative '${toAddy?.title.trim()}' already present on ${startDay.date}. Moving it to next day`,'warning')
              let nexty = this.daSchedule.getEventsForDate(altDay.date)
              if(nexty){
                if (!nexty[i]){
                  nexty[i] = {
                    duration: toAddy?.duration,
                    time: evtTimey,
                    notes: `Alt replace for '${title}'`
                  }
                } else{
                  console.log("addInFutur...STILL PRESENT in next day:"+altDay.date,toAddy.title.trim()) //,JSON.parse(JSON.stringify(nexty))
                  this.doNotify(`Booo! Alt '${toAddy?.title.trim()}' also present on ${altDay.date} :(( ...Check BALANCE!`)
                  
                  this.daSchedule.addToBalance(toAddy)
                  return
                }
              } else {
                //console.log("addInFutur next day EMPTY for >>...",altDay.date)
                nexty = {}
                nexty[i] = {
                  duration: toAddy.duration,
                  time: evtTimey,
                  notes: `Alt replace for '${title}'`
                }
              }
              //this.store.saveDailySchedule(altDay.date, nexty)
              this.daSchedule.updateDaySchedule(altDay.date, nexty)
              this.doNotify(`Saving ${toAddy.title} in ${altDay.date}`, "positive",'bottom')
            } else { //just add it
              toSave[i] = {
                duration: toAddy.duration,
                time: evtTimey,
                notes: `Alt replace for '${title}'`
              }
            }
          })

          console.log("chooseAlternatives::addInFutur>>>",startDay.date, JSON.parse(JSON.stringify(toSave)))

          //this.doNotify(`Saving ${toAddy.title} in ${startDay.date}`, "positive",'bottom') //${JSON.stringify(toSave)}

          this.daSchedule.updateDaySchedule(startDay.date, toSave)
        }

        const remReplace =(eID) => {
          //this.doRemove(evt) //alts
          this.daSchedule.removeScheduledEvt(evt)

          let toAdd = alts.find(item => item.id == eID) //this.getLocalEvt(eID) //should use the `alts` var above..otherwise would be changing the scheduled time of evt.
          console.log("remReplace...Add at:",evtTimey,toAdd.title, 'usually at:'+toAdd.time) //JSON.parse(JSON.stringify(toAdd))

          //flag should be false to check overlap below? toTest***
          let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:evtTimey,notes: `Alt replace for '${title}'`}],true)

          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`chooseAlternatives::removeReplace:: OVERLAPS again from ${toAdd.length} overlaps =${sizey}`,toAdd,euhOverlaps)

            this.doNotify(`Extra Overlaps while adding ${toAdd[0].title.trim()}`, "warning",'top')
            
            return this.handleOverlaps(euhOverlaps,null,'alts') //chooseAlternatives
          }

          this.daSchedule.saveDaySchedule()//chooseAlternatives

          this.doNotify(`Added Alt replacement '${toAdd?.title}' at ${evtTimey}`, "positive",'bottom') 
          
        }

        const aProbNotif = (mess) => {
          this.doNotify(mess) //, "positive",'bottom'
        }
      
      alts = filterOutScheduled(alts)// filter to remove scheduled

      if (alts.length == 0) {
        aProbNotif("Removing not allowed! Alternatives already present!")
        return
      }

      this.checkBoxDialog('Gotta pick alternative!',
        'Select the first Evt to replace Removed + an Extra evt for next day (today)!',//mess,
        alts.map(e => this.getEvtLabel(e,false)), //mapToLabels
        alts[0].id, //'', //have to at least include first Alternative...>> bof no need as check the length of model!
        function(opt){ //onOk
          console.log('chooseAlternatives::opt',opt) //JSON.parse(JSON.stringify(toKeep))
          remReplace(opt.shift())
          if (opt.length > 0){
            addInFutur(opt)
          } else { //get here when only had one alts to choose from...prolly 
            console.log('chooseAlternatives::onOk...nothing to add?!?',alts.length,opt.length,alts.length - opt.length) //when diff=0 no need to show notif prolly 
            aProbNotif("No Alternative scheduled later :(")
          }
        },
        function(){//onCancel..
          console.log('chooseAlternatives::onCancel') //nothing to do...
        },
        //onDismiss >>no need
      )
    },
    onPrev(){
      let doContinue = () => {
        this.$refs.calendar.prev()
      }

      let doSave = () => {
        setTimeout(doContinue, 1000); //should navigate after save
        this.doSaveSchedule() //onPrev
      }

      if(!this.saveScheduleDisabled){ //handle when cx has some unsaved changes!
        this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
        
      } else {
        doContinue() //oldie >> this.$refs.calendar.prev()
      }
    },
    onToday(){
      let doContinue = () => {
        this.$refs.calendar.moveToToday()
      }

      let doSave = () => {
        setTimeout(doContinue, 1000);
        this.doSaveSchedule() //onToday
      }

      if(!this.saveScheduleDisabled){ //handle when cx has some unsaved changes!
        this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
      } else {
        doContinue()
      }
      //oldie >> this.$refs.calendar.moveToToday()
    },
    onNext(){
      let doContinue = () => {
        //console.log('onNext...continuing',this.currentDate)
        this.$refs.calendar.next()
      }
      
      let doSave = () => {
        setTimeout(doContinue, 1000);
        this.doSaveSchedule() //onNext
      }

      if(!this.saveScheduleDisabled){ //handle when cx has some unsaved changes!
        this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
      }else {
        doContinue()
      }
    },
    onChange(){
      let res =  this.daSchedule.onChangeViewDate(this.currentDate)
      if(!res.canContinue){
        if(res.overlaps && Object.keys(res.overlaps).length > 0){
          this.handleOverlaps(res.overlaps,null,'view')
        }else{
          this.doNotify(`Loaded schedule for ${this.currentDate}`, "positive",'bottom')
          
          if(this.isViewingPast() || this.currentDate !== today()) { //adjustTime for past && futur 
            //console.log("adjusting time for past/future", this.currentDate) //,this.scheduledEvents.length)
            this.adjustCurrentTime()
          }
        }
      }else{
        this.doNotify(`Empty for currentDay :(`, "warning",'bottom')
      }
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
      //console.log('onDragEnd',e)
      //e.preventDefault() //bof nope
      //return true //meh
    },
    onDrop(e, type, scope){
      //console.log('onDrop',e, type, scope)

      let d = this.daSchedule.findEvent(this.selectedItem.id) //findSchedEvent
      
      if (!d) {console.log("onDrop ERROR", d,this.selectedItem ); return} //shouldnt happen!

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
      this.showEvtDialog = true
      
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
        //console.log('onMouseDownTime', this.mobile)//,{ scope, event })
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
      //console.log("onDblClickEvent", event)

      //below unlikely as score edit comes up when inPast!!
     //...just in case!
      if(this.isViewingPast()){
        if (event.duration < 30){ //dont do this for small evts!
          console.log("onDblClickEvent..baah too smoll smoll",event.title,event.duration)
          this.doNotify("umm Removing from the past..Soo Check BALANCE!")
          this.daSchedule.addToBalance(event)
          //this.doRemove(event) //onDblClick
          this.daSchedule.removeScheduledEvt(event)
          return
        }
        this.chooseAlternatives(event)
        e.preventDefault()
        return
      }

      this.removeEvtInSchedule(event) 
      e.preventDefault() //to disable popupEdit...dont work smh event with using setTimeout above
    },
    onTouchStart(e, item){
      if(e.type == "touchstart"){ //fires once!
      
      //this.draggedItem = item
      this.selectedItem = item
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

      //let f = target.closest('.my-event')

      if(target.parentNode.classList.contains("my-event")){
        console.log("onTouchStart >>my-event-drag","isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],"showMobileDialog>> "+this.daSchedule.showMobileDialog[item.id]) //target,,this.mobileEnableScore[item.id]
        target.parentNode.classList.add("my-event-drag") //transform: skew(-20deg)
        this.touchedItem = target //keep track of it to see if gonna move OR touch-hold OR onScore edit OR dblClick for remove
      } else {
        //console.log("onTouchStart:WOOOAH inner touch?",target.parentNode,this.isDisabledScoreEdit[item.id],this.mobileEnableScore[item.id]) 
        //could happen if it's inner elt...so go up
        let f = target.closest('.my-event')
        target = target.parentNode
        if(target.parentNode.classList.contains("my-event")){
          console.log("onTouchStart >>PHEW..FOUND","isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],f) //target,,this.mobileEnableScore[item.id]
          target.parentNode.classList.add("my-event-drag") //transform: skew(-20deg)
          this.touchedItem = target //keep track of it to see if gonna move OR touch-hold OR onScore edit OR dblClick for remove
        }else{
          this.touchedItem = false //flag for later in case clicked on endNow, addMin btns....
          //console.log("onTouchStart:ERROR...Btn?",target, target.parentNode) //this.isDisabledScoreEdit[item.id],this.mobileEnableScore[item.id])  
          return //needed
        }
      }

        e.preventDefault() 
        //need to continue for touch-hold!...OR NOT? seems better for drag/drop smh

        return true //true?
      }
    
      console.log("onTouchStart::ERROR...UNKNOWN",e) //shouldnt happen as rest handled via handleTouchEvt()

      return
    },
    onTouchEvt(e, item){
      //console.log('onTouchEvt', e,item)

        const getTimey = (ariaLabel) => {
          let str = ariaLabel.split(' ')
          let tr = str[str.length-2] //12:30
          let s = addToDate(parsed(this.currentDate), { minute: parseTime(tr) })

          if(str[str.length-1] == 'PM'){ //for adding 12hrs to account when time is in PM 
            //let s = addToDate(parsed(this.currentDate), { minute: parseTime(tr) })
            if (s.hour == 12){//EXCEPT for noon!
              //console.log("getTimeyyyyy:",s)
              return s
            }
            
            return addToDate(parsed(this.currentDate), { hour: 12, minute: parseTime(tr)})
          }else { 
            if (s.hour == 12){////reset to 0 for midnight hour smh
              //let r = addToDate(parsed(this.currentDate), { hour: -12, minute: parseTime(tr) }) 
              //console.log("getTimeyyyyy:",parseTime(tr),s,r)
              return addToDate(parsed(this.currentDate), { hour: -12, minute: parseTime(tr) })  //r
            }
          }

          return s
        }

        let resetClass = (t) =>{
          let f = t.closest('.my-event')
          if (f.classList.contains("my-event-drag")) {
            f.classList.toggle("my-event-drag")
            //console.log("handleTouchEvt::resetClass>>REMOVED",f,t)
          }else{console.log("onTouchEvt::resetClass...AINT THERE!",f,t)}
          return
        }

      if (!this.selectedItem){ //should be populated** should return?!? tbd
        console.log("onTouchEvt NULL Item ?!? >> "+e.type,this.selectedItem,this.touchedItem)
        item = this.selectedItem
      }

      if(e.type == "touchmove"){ //fires a lot! --to simulate drag with updating the elt moving...
        if(this.isViewingPast()){ //present check only for move/end --
          this.doNotify("Editing past is no no!")  //meh same as below for grouping!
          //this.useGroupNotify("Editing past is no no!", null,'bottom',e.type)//for grouping>>'NoG' 
          e.preventDefault()
          e.stopPropagation()
          return
        }
        let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        if(target.ariaLabel){ //when moving into calendar's interval
          let s = getTimey(target.ariaLabel)
          if (this.targetDrop){ //-should skip when in same timestamp
            let changedBy = diffTimestamp(this.targetDrop,s) 
            let isSame = JSON.stringify(this.targetDrop) === JSON.stringify(s)
  
            if (isSame && changedBy == 0){ //--too much comparison? toReview
              //console.log("INTERVAL SAME...",isSame,s.time == this.targetDrop?.time, changedBy)
              return
            }
            //console.log("INTERVAL changed!!",isSame,s.time,this.targetDrop?.time,changedBy)
          }
          this.targetDrop = s

          e.preventDefault()
          return

        } else { ////no arialLabel...prolly when over another event! || or same one but in early stages of dragging?
          let f = target.closest('.my-event')
          if (f && !f.classList.contains("my-event-drag")) {
            //target.parentNode.classList.add("my-event-drag")
            console.log("onTouchEvt::move >>TO ADD AGAIN?!?",f,target, this.touchedItem)
          }//else{console.log("handleTouchMove:gooootIT",f,target)}
      
        }
        //e.preventDefault()
        return //true? tbd**
      }
      if(e.type == "touchend"){  
        
        let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

        //if(this.mobile){
        //  console.log("handleTouchEvt::END--ISMOBILE",target,this.touchedItem) //this.allowDialog[item.id]
        //}

        if(this.isViewingPast()){ //present check only for move/end --
          this.doNotify("Editing past is no no!")  //meh same as below for grouping!
          //this.useGroupNotify("Editing past is no no!", null,'bottom',e.type)//for grouping>>'NoG' 

          resetClass(this.touchedItem)  //still have to remove the drag class!
          e.preventDefault()
          e.stopPropagation()
          return
        }

        if(this.touchedItem){
          if(target.parentNode.classList.contains("my-event-drag")){ //on top of same Evt....
            console.log("onTouchEvt::END >>removing my-event-drag","isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],"mobileEnableScore>> "+this.daSchedule.mobileEnableScore[item.id])//target
            target.parentNode.classList.remove("my-event-drag")
          }else{
            let savedHas = this.touchedItem.parentNode.classList.contains("my-event-drag")
            if(savedHas){//then remove it still
              this.touchedItem.parentNode.classList.remove("my-event-drag")
            }else{
              console.log("onTouchEvt::END... target NO my-event-drag?",savedHas, target,target.parentNode )
            }
          }
        }else{
          //console.log("onTouchEvt.....EUUH nothing?",this.touchedItem, target) //could happen for those AddMin btns...
          return //continue default handling....
        }
      
        if(target.ariaLabel){
          let s = getTimey(target.ariaLabel)
          
          this.targetDrop = s
          
          this.doDroppy("onTouch",this.targetDrop, this.selectedItem)
        } else {
          console.log("onTouchEvt::END>>ERROR?OVERLAP?",e, target,target.parentNode,this.mobile,this.daSchedule.isDisabledScoreEdit[item.id])//,this.allowDialog[item.id])
          if(target.classList.contains("title")){
            console.log("onTouchEvt::END--has title!",this.targetDrop)

            this.doDroppy("onTouch",this.targetDrop, this.selectedItem)  //just drop on top to see--ToReview**
          }
        }

        e.preventDefault()
        e.stopPropagation() //needed?@? think so or would trigger other events...prolly...toMonitor***

        return
      }
      console.log("onTouchEvt::UNKNOWN",e) //shouldnt happen!!
    },
    onTouchHold({ evt, ...newInfo }, item){ //mobile onScore edit...
      //console.log('onTouchHold', evt,newInfo,item)
      
      if(!this.mobile){
        console.log("onTouchHold>>NOT MOBILE",evt.type,"mobileEnableScore>> "+this.daSchedule.mobileEnableScore[item.id]) 
        //with below active, doesnt complete drop!
        //---BUT seems to affect next click of btns >>huh just had to remove .mouse in handler name smh (mousedown usually)
        //evt.preventDefault()
        //evt.stopPropagation()
        return true //true?
      }
      let target = document.elementFromPoint(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY)

      //let oldy = this.daSchedule.showMobileDialog[item.id]

      //this.daSchedule.showMobileDialog[item.id] = this.daSchedule.mobileEnableScore[item.id]
      
      this.daSchedule.toggleEvtNoteScoreMobile(item.id)

      /*if(this.isViewingPast()){ //bon in past allowDialog as mobileEnableScore[item.id] never get set?!? why false--toReview**
        console.log("onTouchHold>> INPAST: toggle!", "isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],"oldy:: "+oldy,"mobileEnableScore>> "+ this.daSchedule.mobileEnableScore[item.id])
        
        this.daSchedule.showMobileDialog[item.id] = !this.daSchedule.isDisabledScoreEdit[item.id] //toTest** toggling isDisabledScoreEdit   //true
      }else{
        console.log("onTouchHold>> INPRESENT: ","isDisabledScoreEdit>> "+ this.daSchedule.isDisabledScoreEdit[item.id],oldy, "mobileEnableScore>> "+this.daSchedule.mobileEnableScore[item.id],"showMobileDialog>> "+this.daSchedule.showMobileDialog[item.id])
      }*/

      let f = target.closest('.my-event')
    
      if(target.classList.contains("title") && target.parentNode.classList.contains("my-event-drag")){ 
        console.log("onTouchHold...REMOVING my-event-drag",f)//,f,target.parentNode)// remove the 'my-event-drag' class as not a drag!!
        target.parentNode.classList.remove("my-event-drag")
      }else{
        if (f && f.classList.contains("my-event-drag")){//just toggle it...
          //console.log("onTouchHold--WRONG target... ",evt,target, target.parentNode,f) //could be cause of that transform on elt
          f.classList.toggle("my-event-drag") 
        }else{
          console.log("onTouchHold::class not found on Target!!",target,this.touchedItem)//could and need to use touchedItem
          if (this.touchedItem){ //use when not set to false in touch-start
            f = this.touchedItem.closest('.my-event') 
            if (f && f.classList.contains("my-event-drag")){
              f.classList.toggle("my-event-drag")
            }else{ console.log("ERROR...onTouchHold--class not found on Target!!",target,this.touchedItem)}//shouldnt happen!! 
          }
        }
      }

      if(this.daSchedule.isDisabledScoreEdit[item.id] && !this.daSchedule.mobileEnableScore[item.id]){  //remove evt..
        //f.classList.toggle("my-event-drag") //bof just do it here..toReview as toggle re-add the class
        console.log("onTouchHold::dblClicking!",this.daSchedule.showEvtNoteScoreMobile(item.id))
        this.onDblClickEvent(evt,item)
      }
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
    checkBoxDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
      //console.log('checkyBoxDialog::',labels.length)
      let sizey = labels.length
      let toValidate = sizey > 2 ? 2 : sizey  //so at min:2 for validate
      this.$q.dialog({
        title: title,
        message: mess,
        options: {
          type: 'checkbox',
          model: [],
          isValid: model => model.length > 0 && (model.length >= toValidate) , //also good >> model.includes(selectedM), //'opt2'
          // inline: true
          items: labels
        },
        cancel: true,
        persistent: true
      }).onOk(data => {
          // console.log('>>>> OK, received', data)
          onOk(data)
      }).onCancel(() => {
          if (onCancel) {
            onCancel()
          }
      }).onDismiss(() => {
          if(onDismiss){ //for cleanup and other actions
            //console.log('checkyBoxDialog::onDismiss!! executin...')
            onDismiss()
        }
      })
    },
    confirmAction(message, okbtn,executeOk, executeCancel, executeDismiss=null){ //should pass in cancel btn...maybe
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
          executeDismiss()
          return
        }
      })
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
    //prolly redundant--toSee** if used or remove
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

.addmins-line
  position: absolute
  z-index: 9
  background-color: #2196F3
  cursor: move
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
  
.my-event-drag
  outline: 1px dashed #213
  opacity: 0.7
  cursor: move
  transform: rotateY(45deg) translateZ(1em)
  transition: transform 100ms linear

@media (max-width: 500px)
  .instru
    display: none
</style>