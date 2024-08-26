<template>
  <q-page padding>
  <div class="subcontent">
    <q-splitter
      v-model="splitterPage"
      :limits="[30, 70]"
    > <!--limits here mean that :before(left) slot 
      doesnt get squished for less than 20%-->
      <template v-slot:before><!-- Scheduling buttons and Legend Tree in a Horiz. splitter-->
        <q-splitter
        v-model="splitterLegend"
        horizontal
        :limits="[20, 80]"
        style="height: 100%"
        >
          <template v-slot:before> <!--Scheduling buttons -->
            <div class="q-px-md boxy" >
              
                <!-- <div class="float-right"
                  clear button, shown:scheduled evts and erase whole day, 
                  changes to schedule like prio or score...
                  basically when have stuff..
                  also only for present and future
                -->
                <div v-if="showReloadBtn">
                    <sched-btn
                    text-label="Reload"
                    class="sched-btn"
                    text-color="green"
                    @do-btn-action="onReloadSaved"
                    />
                </div>

                <div v-if="showClearBtn">
                  <sched-btn
                  text-label="Clear"
                  class="sched-btn"
                  text-color="lime-5"
                  @do-btn-action="onClearDay"
                  />
                </div>

                <div v-if="showLoadDefaults"><!--disable instead of hiding?!? meh -->
                  <sched-btn
                  :textLabel="defaultLabels"
                  class="sched-btn"
                  text-color="blue"
                  @do-btn-action="onLoadDefault"
                  />
                </div>

                <div v-if="showScoreBtn">
                  <drop-dwn-btn
                  class="sched-drop-btn"
                  text-color="teal"
                  :disableBtn="disableScoreBtn"
                  :optionLabel="chosenScoreLabel"
                  :daOptions="scoreOptions"
                  @do-reload="doReloadWithScore"
                  @choose-option="onChoosenScore"
                  />
                </div>
                <div v-if="showPrio">
                  <drop-dwn-btn
                  class="sched-drop-btn"
                  text-color="teal"
                  :disableBtn="disablePrioBtn"
                  :optionLabel="chosenPrioLabel"
                  :daOptions="allMainGPrio()"
                  @do-reload="doReloadWithPrio"
                  @choose-option="onChoosenPrio"
                  />
                </div>

                <div v-if="showOneEach"><!--disable instead of hidding?-->
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
        <q-pull-to-refresh @refresh="onRefresh"> <!--have to put here or drag in calendar does this refresh when it shouldnt-->
          <navigation-bar
            @today="onToday"
            @prev="onPrev"
            @next="onNext"
          />
        </q-pull-to-refresh>
        <div v-if="scheduleMoodsLabel !=''" class="row">
          <q-badge color="secondary" multi-line>
            {{scheduleMoodsLabel}}
          </q-badge>
        </div>
        <!-- v-touch-swipe.mouse.left.right="handleSwipe"-->
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
              <!--
                v-touch-repeat.mouse="(e) => handleRepeat(e, event)"  >>fucks up drag/drop in mobile smh
                v-touch-hold="handleHold"
                v-touch-swipe="handleSwipe"
                v-touch-hold="handleHold" in div below for mobile touch...
                      using mouse doesnt work i.e: v-touch-hold:600:12:15.mouse="handleHold"
                      also doesnt seem to fire >>fires when added to q-calendar tag above!

                dark
                @mouseenter-time="onMouseEnter"
                @mouseleave-time="onMouseLeave" works!!
                the drop-func seem to fire when other drag functions are present as well
                adding drag-start-func/drag-end in calendar as below doesnt do anything
                :drag-end-func="onDragEndy"
                :drag-start-func="onDragStarty"

                click-time and mouseup-time are almost the same with diff in event(PointerEvent vs MouseEvent)
                
                :interval-start="24" >>to start at 7am
                :interval-count="68" >>oldie
                :selected-start-end-dates="startEndTimes" >>need for/used for range selection!

                time-clicks-clamped >>what does that do? >>ngo for selecting interval-minute instead of the timestamp where clicked...
                  **toTest impact of removing it for the adjustCurrentTime?

                also remove one of onMoved or onChange as fires twice and have to redundant handle both**
                @moved="onMoved"
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
                            
                         
                          <mobileNoteScore v-if="allowDialog[event.id]"
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
        <sched-dialog v-if="addEventDialog"
          :parentGoals="storedCompPG"
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
  QCalendarDay,
  addToDate,
  parseTimestamp,
  isBetweenDates,
  diffTimestamp,
  getDateTime,
  getDayTimeIdentifier,
  getTimeIdentifier, //should use this actually for overlap calc? toSee
  getDayIdentifier,
  today,
  parsed,
  parseDate,
  parseTime,  //isOverlappingDates
} from '@quasar/quasar-ui-qcalendar/src/index.js'
import '@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass'
import '@quasar/quasar-ui-qcalendar/src/QCalendarDay.sass'
import { defineAsyncComponent,ref } from 'vue' //defineComponent
//import NavigationBar from '../../components/NavigationBar.vue'
import { isMobile } from '../util/isMobile'
import { applyClasses, applyStyles, pGColors } from '../util/utiFunc'
//import GoalyEnd from '../../components/planner/goalyEnd.vue'
//import schedBtn from '../../components/planner/schedBtn.vue'
//import dropDwnBtn from '../../components/planner/dropDwnBtn.vue'
//import schedDialog from '../../components/planner/schedDialog.vue'
//import scoreEditDialog from '../../components/planner/onScoreEditDialog.vue'
import { useGoalStore } from 'stores/goalStorage'
import { useQuasar } from 'quasar'  //Platform
//import { stop, prevent, stopAndPrevent } from 'quasar/src/utils/event'

//import 'drag-drop-touch'  //no likey smh

function isLeftClick (e) {
return e.button === 0
}


//export default defineComponent({
export default {
name: 'dayCalendar',
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
  const draggedItem = ref(null)  //toRename** >> selectedItem(whether touch/drag)
  const targetDrop = ref(null)

  const touchedItem = ref(null) //for touch mobile elt 

  const currentTime = ref(null)
  
  const allEvents = ref(null)  //bring up all subgoals from storage by default //keep reference to it without change and not reload too much from storage?--is it needed?!?
  const pGoals = ref(null)  //smh parentGoals...see parentGs below

  const $q = useQuasar()
  let intervalId = null

  let possibleRange = null //for adhoc scheduling...keep track of selected time range

  return {
    filter : ref([]),
    filterRef : ref(null),
    //filterResults : ref([]), //new Set() //toSee as used to keep track of results and show/hide moodyBtn--no need

    currentDate: ref(today()),
    scoreOptions:ref([1,2,3,4,5,6]),
    chosenScore:ref(null),
    chosenPrio:ref(null),
    hello:ref(null),
    scheduledEvents: [], //for scheduled events currently viewed--can change...prolly no need to put in return BUT have to in order to be set initially and accessed.
    dailyScheduled:ref(new Map()),
    endTimesSet: ref(new Set()),
    startTimesSet: ref(new Set()),

    dailyScheduledMap:ref(new Map()), //to replace both dailyScheduled and scheduledEvents above...

    disablePrioBtn: ref(true),  //to temp disable when selecting a new value...
    disableScoreBtn: ref(true),

    calendar: ref(null),
    store:useGoalStore(),

    anchorTimestamp: ref(null), //start time for range
    otherTimestamp: ref(null),   //end time for range...
    mouseDown: ref(false),
    mobile: ref(true),
    usingMoods:ref({}),  //ref(null)

    timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update

    showTree: ref(false), //showing Legend Tree
    //pickEventDialog:ref(false), //showing pick event to schedule dialog ..no need
    addEventDialog: ref(false), //rename to showEvtDialog---
    
    isDisabledScoreEdit:ref({}),
    hasStarted:ref({}),  //just for happening now..should combine with isDisabledScoreEdit var above!
    mobileEnableScore:ref({}), //reverse of isDisabledScoreEdit...mobile and should be dynamically set when touch-repeat....
    allowDialog:ref({}),//non mais c'est fou lala! for showing mobile dialog still

    disableSaveSchedule:ref(true),
    //force:ref(false),  //skip confirming for default time changes--placed in inner component...
    showReloadBtn:ref(false), //when date has saved events that are not default--or reset day schedule to initial saved schedule..
    showLoadDefaults:ref(true), //load default events...
    showOneEach:ref(false), //todo** bring oneEach,Score,Prio under same heritance--same funcs and shown at same time!
    showScoreBtn:ref(false), //schedule by score---should be merged with below as shown at same time--todo**
    showPrio:ref(false),  //for showing prioritiy button...
    showClearBtn:ref(false),

    splitterPage: ref(35), // start--left side--before at 35%
    splitterLegend:ref(40),
    treeGoals:ref([]), 
    expanded:ref([]), //to hold expanding parentGoals...
    parentGs:ref(null)
  }
},
beforeMount() {
  this.mobile = isMobile()  //--for drag for range selection.
 
  //this should just load all events--nothing else--prolly
  //in onChange is where to setDate and other props...prolly..unless there is a reason that not doable there?
  //this.scheduledEvents = this.addPropsEventsTo(null, this.returnNewEvts(true)) //[...e] //does update!

  this.resetGoalEvts(true)
  this.constructTree()
  //this.testyV() //toRemove***....test for now!
  
  //this.startTimesSet = new Set()
  //this.dailyScheduled = new Map()  //here it's not a proxy map...

},
beforeUnmount() {
  clearInterval(this.intervalId)
},
mounted() {
  this.adjustCurrentTime()
  // adjust the time every minute
  this.intervalId = setInterval(() => {
      this.adjustCurrentTime()
  }, 60000)
},

computed: {
  scheduleMoodsLabel() { 
    //console.log(`scheduleMoodsLabel..`,JSON.parse(JSON.stringify(this.usingMoods))) //this.usingMoods)
    let ret = ''

    if (!Object.keys(this.usingMoods).length > 0) {return ret }

    let aSet = new Set()
    for (let key in this.usingMoods) {
      aSet.add(this.usingMoods[key].join()) //join needed for uniqueness...or should do (*SeenNumber)?!? tbd**
      //i < 1 ? ret = ret + this.usingMoods[key] : ret = ret + ', ' + this.usingMoods[key]  //huh gotta add empty ret'' in front or single elt is as array!
      //i++ 
    }
    
    let i = 0
    for (let value of aSet){
      i < 1 ? ret = value : ret = ret + ', '+ value 
      i++ 
    }

    if (Object.keys(this.usingMoods).length != aSet.size){ //check for size change...
      console.log(`scheduleMoodsLabel..prob change!`,JSON.parse(JSON.stringify(this.usingMoods)),aSet, ret) //aSet, aSet.values(), 
    }
    
    return ret
  },
  chosenScoreLabel() { 
    return this.chosenScore == null ? `By Score` : `Score >= ${this.chosenScore}` 
  },
  chosenPrioLabel() { 
    return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
  },
  style () {
    return {
      top: this.timeStartPos + 'px'
    }
  },
  showTreeForm() { //return
    if (!this.showTree) {this.constructTree()}
    return this.showTree
  },
  saveScheduleDisabled(){
      return this.disableSaveSchedule 
  },
  hasEventsForDate(){ //add date param? default to null maybe...TBD 
    return this.store.hasEventsForDate(this.currentDate)
  },
  eventsMap () {// convert the events into a map of lists keyed by date
    const map = {}
    this.scheduledEvents.forEach(event => {
      if (!map[ event.date ]) {
        map[ event.date ] = []
      }
      map[ event.date ].push(event)
      //console.log(`eventsMap adding ${event.title.trim()},${event.time}`,event)
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
    
    return map
  },
  //parentGoalsMap() {} //smh never seems to update!--moved in methods
 
  //evts that are not already scheduled for dropdown selection
  canbeScheduled() {
    let e = this.deepCopy(this.storedSubGoals)
    
    // filter out events that are already scheduled
    let difference =  e.filter(x => !this.scheduledEvents.find(item => item.id == x.id)); // these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1

    //console.log('canbeScheduled difference is', JSON.parse(JSON.stringify(difference)))
    
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
    
    return difference
  },
  storedSubGoals(){
    return this.store.getSubGoals
  },
  storedAlternatives(){ //umm good idea to put in computed? does it update?!?--toSee
    return this.store.fetchAlternativeEvts()
  },
  //some computed for the range interval
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
  storedCompPG(){
    return this.storedPG()  //this.store.getMainGoals
  },
  currentBalance(){
    return this.store.currentBalance()
  },
  filterString(){ //sigh..did it just work better after placing at end of computed?!? >>dont work in methods section >> AT LEAST updates esti!!
    return this.filter.join()
  },
  defaultLabels(){
    let e = this.allEvents.filter(evt => evt?.inDefaults && evt?.time != '' && !this.scheduledEvents.find(x => x.id == evt.id)).length
    return  e > 0 ? e+ " Defaults" : "Defaults"
  }
 },

 methods: {
  testyV(){ //platform detection....to maaaybe not render stuff? would have to export $q and use it in template with div example below....
    //https://quasar.dev/options/platform-detection

    console.log("Platform detect:",this.$q.platform)
    //$q.platform.is.mobile
    /*
    <div v-if="$q.platform.is.desktop"> //$q.platform.is.mobile || $q.platform.is.electron
      I'm only rendered on desktop!
    </div>
    */
  },
  storedPG(){
    if (this.parentGs == this.store.getMainGoals){ //triple equal sign for reference check..never goes here though smh..see with double equal sign>> neither
      console.log("storedPG SAME!!!!")
      return this.parentGs 
    }

    this.parentGs = this.store.getMainGoals
    return this.parentGs
  },
  parentGoalsMap(){ //at least now it's up to date esti!! runs too much tho?!?---umm seems bad to do all the work too for each invocation!--toReview**
    const map = new Map()
    //this.pGoals = this.storedCompPG
    //let mG = this.parentGs //smh neither >> this.storedCompPG// nope > this.storedPG()  //this.storedMainG()
    let mG =  this.storedPG()//this.storedCompPG >> will update here in methods? >>nope!
    if (!mG){
      console.log('parentGoalsMap is empty or null', mG)
      return map
    }

    mG.forEach(obj => {
      map.set(obj.id, obj);
    })
      
    return map
    
  },
  constructTree(){
    this.treeGoals = this.store.fetchGoalsTree()
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
  //numeric date and time identifier for timestamp comparison
  getTimeNumber(timey) {
    if (timey !== null) {
      return getDayTimeIdentifier(timey)
    }
    return false
  },
  // for time of day(less calculation than above) --toUSE***
  getTimeyNumber(timey) { 
    if (timey !== null) {
      return getTimeIdentifier(timey)
    }
    return false
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

      return `Scheduled => ${this.scheduledEvents.length} out of ${total} \n`
    }
    return `Balance: ${this.currentBalance ? this.currentBalance : 0} \n`
    
  },  
  // get all events for the specified date
  getDateEvents (dt) {
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
      const startTime = addToDate(parsed(events[ 0 ].date), { minute: parseTime(events[ 0 ].time) })
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
      }
    }
    
    //console.log("daEvents...",JSON.parse(JSON.stringify(events))) //, JSON.parse(JSON.stringify(ev))) //events
  
    return events.sort(sorty) //errors out with this.sorty
    
  },
  hasDate (days) { //umm why again?!? for current time line? toTest*** when removed!
    
    return this.currentDate
      ? days.find(day => day.date === this.currentDate)
      : false
  },
  getEventsForDate(dt){ //couldnt put into methods section huh 
      return this.store.getEventsForDate(dt)
  },
  isViewingToday(){
      return today() == this.currentDate
  },
  isViewingPast(){
    let isToday = today()

    if (this.currentDate && this.currentDate == isToday){
      return false
    }

    let onToday = getDayIdentifier(parsed(isToday))
    let viewing = getDayIdentifier(parsed(this.currentDate))

    if (viewing >= onToday) { //.nope future >'
      
      return false
    }
    return true
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


    let hasEnd = (this.endTimesSet && this.endTimesSet.has(now.time))
    let hasStart = (this.startTimesSet && this.startTimesSet.has(now.time))
    if(hasEnd || hasStart){
      //console.log("sameStart/END..FOUND", this.currentTime,hasEnd, hasStart)
      this.doEnableEndNowBtn(this.currentTime,hasEnd, hasStart)
    }
  },
  allMainGPrio(){
      let e = this.store.fetchAllPrio()
      //let ar = Array.from(e.values())
      //console.log('setGoalsPrio',ar, typeof ar)
      if(!e.size > 0){
          //this.prioOptions = e.values()
          console.log('ERROR...no Priority goals?', e)
          return []
      }
      return Array.from(e.values()).sort()
  },
  resetGoalEvts(newish = false){
      if (this.scheduledEvents == this.allEvents){ //triple equal sign for reference check..never goes here though smh..see with double equal sign
        console.log("resetGoalEvts SAME")
      }

      if (newish){
        let e = this.deepCopy(this.storedSubGoals)
        this.allEvents = [...e]
        //console.log("resetGoalEvts",JSON.parse(JSON.stringify(this.allEvents)))
        //this.storedMainG  //would this update?!? >>does but computed method on top doesnt....moved in methods...
      
        //this.storedPG() //is it that by calling it, then next time as it hasnt changed it doesnt eval?(would have the most up to date stuff though...)--F! IT moved in methods!
        //console.log("resetGoalEvts newish>>pGoals",JSON.parse(JSON.stringify(this.parentGs)),this.bonAnother()) //JSON.parse(JSON.stringify(this.pGoals))
        return e
      }
      return this.allEvents
  },
  getLocalEvt(id){//from the allEvents array that "should" contain all evts--might not be originals
      for(let i = 0; i< this.allEvents.length;i++){
          if (this.allEvents[i].id === id) return this.allEvents[i]  //OH freaking type check!!smh--id should always be a number!!
      }
      return null
  },
  getScheduledEvent(id){ //currently scheduled
      for(let i = 0; i< this.scheduledEvents.length;i++){
          if (this.scheduledEvents[i].id == id) return this.scheduledEvents[i]  //bon dbl == works better smh
      }
      return null
  },
  doSaveEvtProp(evtID, timey = null, score = null){
    this.store.saveSubProp(evtID, timey, score)  //should just send whole event?
    return 
  },
  evtStartedOrPassed(currentTime){
    const mappy = []
   
    let compareTime = addToDate(currentTime,{ minute: 0})
    let tTime = this.getTimeNumber(compareTime)
   
    this.dailyScheduled.forEach((value, key, map)=> {
      let eStart = this.getTimeNumber(value.start)
      let eEnd = this.getTimeNumber(value.end)

      if (eStart !== false && eEnd !== false){

        let isTwix = (tTime >= eStart && tTime < eEnd) 
        //let hasEnded = eEnd >= tTime //&& tEnd <= eEnd) //umm what if it's just at the line though? >>gets included...so removing '=' for endTime..prolly others too but ToReview!!
        
        let hasEnded = tTime >= eEnd

        //let diffyEnd = diffTimestamp(eEnd, tTime) 
        //test to see if accurate! 
        //>> (diffyEnd > 0) >> so evt has NOT ended
        ////negative means it has ended...
        if (isTwix || hasEnded) {
          //console.log(`Evt:${key} > ongoing:${isTwix} or ended:${hasEnded}`) //, diffyEnd > 0, compareTime 
          mappy.push(key)
        }
        if (isTwix){//showEndBtn
          this.hasStarted[key] = true  
        }
        //if(hasEnded){
          //should disableScore prolly
          this.enableEvtScoreEdit(key, hasEnded)
        //}
      }else{
        console.log(`ERROR?!:${key} has no start/end?.`,value) //shouldnt happen?--toMonitor**
      }
    })

    return mappy

  },
  allowScoreEdit(flag){ 
    this.dailyScheduled.forEach( (value, key, map) => {
        this.isDisabledScoreEdit[key] = !flag   //need to inverse the flag!!
    })
  },
  enableEvtScoreEdit(evtID, flag){
    this.isDisabledScoreEdit[evtID] = !flag  //confirm flag inversion
  },
  //canEditScore()//when past || today(when evtStartedOrPassed)
  //enable score edit for already completed events by comparing with currentTime
  //enables the editing of score after event has passed.
  canEnableEditScore(evtID, endTime){ //, useNow = null
      //const now = useNow ? useNow : parsed(this.currentDate) //have to use currentDate for sho! //oldie >>parseDate(new Date())
      const now = parseDate(new Date()) //oldie >> didnt give currentTime >> parsed(this.currentDate)
      let diffy = diffTimestamp(now,endTime) //endTimes < now would be that evt hasnt ended!
    
      //console.log(`canEnableEditScore`,now,evtID,endTime)
      if(diffy > 0){ //so evt has NOT ended
          this.isDisabledScoreEdit[evtID] = true   //disable scoreEdit

          this.mobileEnableScore[evtID] = false 
      }else { //negative so evt has ended
          this.hasStarted[evtID] = false  //umm bon hide when button when past as well

          if(this.mobile){
            //console.log(`canEnableEditScore`,evtID,diffy,this.mobile) //should inverse this for mobile
           // this.mobileEnableScore[evtID] = true //true //--can edit score... should be false? or named proper?
            //return
            this.allowDialog[evtID] = false
          }
          this.mobileEnableScore[evtID] = true

          this.isDisabledScoreEdit[evtID] = false //enable score edit
      }

     // console.log(`canEnableEditScore for ${evtID}`,now,endTime,diffy, this.isDisabledScoreEdit[evtID])
  },
  //parses score and returns the difference btween the interval
  //the second value should be higher than the first...for later score calculations!
  parseScore(t){
    const tokens = t.split(/on/) 
    if (tokens.length != 2) {//should be at most two variables....
      //console.log(`parseScore error? >>${t}`, tokens)  
      return -89 //guardrails to distinguish with potensh error below*** could still fail with 'one' though smh..toReview***
    }
    //console.log(`parseScore for ${t}`, tokens)
    return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!
  },
  doEnableEndNowBtn(timey,hasEnd, hasStart){ //to enable/disable endButton...should replace one of the functions for endBtn around--toDO** 

    for (let [entry, val] of this.dailyScheduled) {
      let toComp = hasEnd ? val.end.time : val.start.time  //bon should work..prolly both flags are mutually exclusive?
      //let euhStart = hasStart ? val.start.time : timey  //just in case but redundant..toRemove**
      if (toComp == timey){
        //console.log(`doEnableEndNowBtn found hasStart:${hasStart}`, entry,JSON.parse(JSON.stringify(this.isDisabledScoreEdit[entry])) ) //val
        this.hasStarted[entry] = !hasEnd 
        this.isDisabledScoreEdit[entry] = !hasEnd //enable/disable score edit--toTEST...should use hasEnd?!? or hasStart?!?
      }
      //ELSE for hasStart to SHOW enableBtn--TODO? OR just test above?** 
    }
  },
  // show/hide the endNow button
  enableEndNowBtn(evtID,starty, endy){
    const now = parseDate(new Date()) 
    //const nowy = parsed(this.currentDate) //wrong as time is 00:00 

    //console.log("enableEndNowBtn...",nowy,now,isBetweenDates(now, starty, endy, true))

    isBetweenDates(now, starty, endy, true) ? this.hasStarted[evtID] = true : this.hasStarted[evtID] = false
    //if (isBetweenDates(now, starty, endy, true)){ 
      //this.hasStarted[evtID] = true
    //}//else{
      //this.hasStarted[evtID] = false
    //}
  },
  retrieveSameStart(timey){ //to retrieve same startTimes
      let retVal = []
      for (let [entry, val] of this.dailyScheduled) { 
          if (val.start.time == timey){
              //console.log("retrieveSameStart...FOUND", entry, val)
              retVal.push(entry) //bon no need for object {}
          }
      }
      return retVal
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
        isValid: model => model.length > 0 && (model.length == toValidate) , //also good >> model.includes(selectedM), //'opt2'
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
  useGroupNotify(messg, colorNotif = undefined, position = 'top',group=false,timeout=5000){ //prolly redundant--toREmove**
    this.$q.notify({
      color: colorNotif !== undefined ? colorNotif : 'negative',
      position: position,
      message: messg,
      icon: colorNotif == undefined ? 'report_problem' : 'thumb_up', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
      group: group, //boolean | string | number;
      timeout: timeout, // time to display (in milliseconds)>>default is 5000
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
  updateButtons(defaultBool=null, scoreScheduleBool=null, priorityScheduleBool = null){ //reloadBool=null,
    //if (reloadBool != null) {
      //this.reloadSaved = reloadBool != null ? reloadBool : this.reloadSaved
    //}
    //if (defaultBool != null) { //sheesh dont check for falsy vals holmes!!
      this.showLoadDefaults = defaultBool != null ? defaultBool : this.showLoadDefaults
    //}
    //if (scheduleBool != null) {
      this.showScoreBtn = scoreScheduleBool != null ? scoreScheduleBool : this.showScoreBtn
    //}
      this.showPrio = priorityScheduleBool != null ? priorityScheduleBool :  this.showPrio

      this.showOneEach = priorityScheduleBool != null ? priorityScheduleBool :  this.showOneEach
  },
  //just remove it from the current schedule...
  doRemove (item) {
    let currentSize = this.scheduledEvents.length
    
    if (!item){console.log("ERROR doRemove, NO item to delete?!?", item);return}

    let i = 0
    //let found = false 
    for( i; i < currentSize; i++){
      if ( this.scheduledEvents[i].id == item.id) {
        this.scheduledEvents.splice(i, 1)
        //console.log("REMOVED event spliced!", item) //to see if has start/end. and not have to get/erase below...
        
        let toDel = null
        if(this.dailyScheduled.has(item.id)){
          toDel = this.dailyScheduled.get(item.id)
          this.dailyScheduled.delete(item.id)
        }else{console.log("doRemove ::> dailyScheduled has no such item?@? ERROR", item)}

        if(toDel){ //also update scheduleSets
          let hadStart = this.startTimesSet.delete(toDel.start.time)
          let hadEnd = this.endTimesSet.delete(toDel.end.time)
          if (!hadStart || !hadEnd){
            console.log(`doRemove ::> ERROR? scheduleSets has no such item?@? start:${hadStart}...end:${hadEnd}`, toDel, item.id + ' '+ item?.title.trim()+' '+ item?.details )
          }
        }
        //found = true //just test
        break
      }
    }
    //if (!found){console.log("umm..DoRemove, not found?!?", item)}
  },
  addToBalance(evt){ //add to minus balance the duration of evt
    let balance = this.currentBalance
    let neB = balance - parseInt(evt?.duration) //gotta minus...
    this.store.setBalance(neB)
  },
  chooseAlternatives(evt){

    let alts = this.storedAlternatives //deep copy??!?toSee

    let now = parseDate(new Date()) //>> actual current day >>now.date && now.time
    
    //this.currentDate >day currently looked at in calendar
    //console.log("chooseAlternatives..",this.currentDate,now, evt,JSON.parse(JSON.stringify(alts)))

    let evtTimey = evt.time //for scheduling later
    let futureDatey = now.date
      
      const mapToLabels = anEvt => {
        let prt = this.parentGoalsMap().get(anEvt.parentGoal)
        return { label: `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) for ${anEvt?.duration} mins`, value: anEvt.id }
        //return { label: anEvt.title.trim() + " for " + anEvt.duration + 'min. With score '+ '('+ anEvt.score + ')' +' At '+ anEvt.time , value: anEvt.id } // color: 'secondary'
      }

      const filterOutScheduled = evts => {//should filter to remove scheduled
        return evts.filter(x => !this.scheduledEvents.find(item => item.id == x.id))
      }

      const addInFutur = (eArr) => {
        let startDay = addToDate(parsed(futureDatey),{ day: 0 }) //think need options >> yup! //SHOULD be sometime in present or future
        let altDay = addToDate(parsed(startDay.date), { day: 1 }) 
        //console.log("addInFutur...",futureDatey,startDay,altDay)//JSON.parse(JSON.stringify(toAdd))
        let EvtsOn = this.getEventsForDate(startDay.date) 
        let toSave = {}
        let toAddy = null  //bon hopefully no overwrite as should be one evt
        if (!EvtsOn){
          console.log("addInFutur EMPTY for >>...",startDay.date)//could be null!
        } else {
          toSave = EvtsOn 
        }

        eArr.forEach(i => {
          //let 
          toAddy = this.getLocalEvt(i) //use the `alts` too?!?
          //console.log("addInFutur...",i,JSON.parse(JSON.stringify(toAddy)))

          if(toSave[i]){//Not override if already present!!
            console.log("addInFutur...ALREADY PRESENT",i,startDay.date,toAddy?.title.trim()) //JSON.parse(JSON.stringify(toAddy))
            this.doNotify(`Alternative '${toAddy?.title.trim()}' already present on ${startDay.date}. Moving it to next day`,'warning')
            let nexty = this.getEventsForDate(altDay.date)
            if(nexty){
              if (!nexty[i]){
                nexty[i] = {
                  duration: toAddy.duration,
                  time: evtTimey
                }
              } else{
                console.log("addInFutur...STILL PRESENT in next day:"+altDay.date,toAddy.title.trim()) //,JSON.parse(JSON.stringify(nexty))
                this.doNotify(`Boo Alt '${toAddy?.title.trim()}' also present on ${altDay.date} :(( ...Check BALANCE!`)
                
                this.addToBalance(toAddy)
                return
              }
            } else {
              console.log("addInFutur next day EMPTY for >>...",altDay.date)
              nexty = {}
              nexty[i] = {
                duration: toAddy.duration,
                time: evtTimey
              }
            }
            this.store.saveDailySchedule(altDay.date, nexty)
            this.doNotify(`Saving ${toAddy.title} in ${altDay.date}`, "positive",'bottom')
          } else { //just add it
            toSave[i] = {
              duration: toAddy.duration,
              time: evtTimey
            }
          }
        })

        console.log("addInFutur>>>",startDay.date, JSON.parse(JSON.stringify(toSave)))

        //this.doNotify(`Saving ${toAddy.title} in ${startDay.date}`, "positive",'bottom') //${JSON.stringify(toSave)}

        this.store.saveDailySchedule(startDay.date, toSave)
      }

      const remReplace =(eID) => {
        this.doRemove(evt) //alts

        let toAdd = alts.find(item => item.id == eID) //this.getLocalEvt(eID) //should use the `alts` var above..otherwise would be changing the scheduled time of evt.
        console.log("remReplace...Add at:",evtTimey,toAdd.title, 'usually at:'+toAdd.time) //JSON.parse(JSON.stringify(toAdd))
        toAdd = this.addPropsEventsTo(this.currentDate,[{...toAdd,time:evtTimey}])
        
        //this.addEvtPropsIntoSchedule(toAdd[0])
        let euhOverlaps = this.overlapCheckEvtsAdd(toAdd) //use this instead of above to fix extra overlaps
        
        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`chooseAlternatives::removeReplace:: OVERLAPS again from ${toAdd.length} overlaps =${sizey}`,toAdd,euhOverlaps)

          this.doNotify(`Extra Overlaps while adding ${toAdd[0].title.trim()}`, "warning",'top')
          
          return this.fixyOverlaps(euhOverlaps,null,'alts') //chooseAlternatives
        }


        let f = this.updateCurrentSchedule()
        console.log('chooseAlternatives::remReplace:SAMESTART',f)
        if (f.size > 0){
            this.fixSameStart(f) //chooseAlternatives
        }
        this.doSaveSchedule() //chooseAlternatives

        this.doNotify(`Added Alt replacement '${toAdd[0].title}' at ${evtTimey}`, "positive",'bottom') 
        
      }

      const aProbNotif = (mess) => {
        this.doNotify(mess) //, "positive",'bottom'
      }
    
    alts = filterOutScheduled(alts)

    if (alts.length == 0) {
      aProbNotif("Removing not allowed! Alternatives already present!")
      return
    }

    this.checkBoxDialog('Gotta pick alternatives',
      'Select the first Evt to replace the removed and an Extra evt for later day (today)!',//mess,
      alts.map(mapToLabels),
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
  removeEvtInSchedule(evt){
    let doSave = false //just for moods.../default no need to save...

      let aRemLambda = () => { //autoSave=false 
        this.doRemove(evt) //removeEvtInSchedule
        
        if (doSave){ //autoSave
          //this.doNotify("removeEvtInSchedule..autoSave for: "+evt.title)
          console.log("removeEvtInSchedule..autoSave for: "+evt.title)
          delete this.usingMoods[evt.id]
          this.doSaveSchedule() //removeEvtInSchedule
          this.disableSaveSchedule = true
          return
        }

        this.disableSaveSchedule = false  //allow saving schedule
        this.showReloadBtn = this.hasEventsForDate
      }

    if(this.isViewingPast()){ //inPast--choose alternative.. Not for small evts as just addBalance
      if (evt.duration < 30){
        //console.log("removeEvtInSchedule...baah too smoll smoll",evt.title,evt.duration)
        this.doNotify("Removing from the past... Check BALANCE!") //oldie >> Removing from the past too smoll smoll is no no!
        this.addToBalance(evt)
        
        doSave = true
        aRemLambda() //(true) //this.doRemove(evt)
        return
      }
      
      this.chooseAlternatives(evt)
      return
    }

    
    if (!this.isViewingToday() && !this.mobile){//in futur >>no need confirming with user when inDesktop!
      doSave = this.usingMoods[evt.id] //oldie >>false  //should auto-save and flag to update labeling....
      aRemLambda() //(false)
      console.log('Removed future evt')
      return
    }
    
    let mess = `Remove "${evt.title}" from schedule?`

    if (this.usingMoods[evt.id]){
      console.log("removeEvtInSchedule with MOOD?!?", this.usingMoods[evt.id])
      doSave = true 
      mess = mess + " With Mood "+this.usingMoods[evt.id]
    }

    this.confirmAction(mess,
    "Remove",
    aRemLambda, 
    function(){console.log('Cancelled remove')}) //no dismiss

  },
  updateCurrentSchedule() { //just checks for startTimes only TOFIX**
    const mappy = new Map()

    let endTimes = new Set()

    let sameTime = new Set()
    let startTimes = new Set()

    
    if(this.scheduledEvents.length < 1){
      //console.log("updateCurrentSchedule NOTHING..returning....",this.dailyScheduled.size,this.startTimesSet.size) 
      this.dailyScheduled = mappy

      this.endTimesSet = endTimes
      this.startTimesSet = startTimes

      return sameTime //consistency!
    }
    
    this.scheduledEvents.forEach(event => {
      let startTime = addToDate(parsed(event.date), { minute: parseTime(event.time) })
      let endTime = addToDate(startTime, { minute: event.duration })

      mappy.set(event.id, { //startsEnds
        ...event, //bon toSee** effect of this spread for notes,etc 
        start: startTime,
        end: endTime,
        on: event.date,
        originalAt: event.time,
        for: event.duration,
        score:event.score
      })
      
      //endTimes.push(endTime.time) //for checking when adjustCurrentTime()
      endTimes.add(endTime.time) 
        
      startTimes.has(startTime.time) ? sameTime.add({at:startTime.time, id:event.id}) : startTimes.add(startTime.time)
       

      let isToday = this.currentDate == today() 
      if (isToday || !this.isViewingPast()){ //only allow for today and future
            //console.log(`addEvtInScheduleMaps --editScore today for: ${evt.id}`, startTime, endTime)
        this.canEnableEditScore(event.id,endTime)
        this.enableEndNowBtn(event.id, startTime, endTime)
      }

    })

    this.dailyScheduled = mappy

    this.endTimesSet = endTimes
    this.startTimesSet = startTimes

    return sameTime

  },
  addEvtPropsIntoSchedule(event){ //maybe add flag here? >>bof

    let added = this.addEvtInScheduleMaps(event)

    if(!added){ //could happen for drag/drop as not adding new
      //console.log(`addEvtPropsIntoSchedule:${event.title}...NOT added`, event) //JSON.parse(JSON.stringify(event)))
      return
    }

    this.scheduledEvents.push(event) //better in order to not pollute scheduleEvents array when couldnt add to scheduleMap above
  },
  addEvtInScheduleMaps(evt){
    if(this.dailyScheduled.has(evt.id)){
      //console.log("addEvtInScheduleMaps with evt already added...ERROR?", evt)
      return false
    }

    let startTime = addToDate(parsed(evt.date), { minute: parseTime(evt.time) })
    let endTime = addToDate(startTime, { minute: evt.duration })

    this.dailyScheduledMap.set((evt.id, {...evt,
      on: evt.date,
      //originalAt: evt.time, //keep original...needed still? >prolly not..toRemove**
      for: evt.duration,
      start: startTime,
      end: endTime,
      score: evt.score
    }))
    
    this.dailyScheduled.set(evt.id, {...evt, //toSee**
      on: evt.date,
      originalAt: evt.time, //keep original...needed still? >prolly not..toRemove**
      for: evt.duration,
      start: startTime,
      end: endTime,
      score: evt.score
    })

    this.endTimesSet.add(endTime.time)
    this.startTimesSet.add(startTime.time)  //check for sameStart?!?

    let isToday = this.currentDate == today() 
    if (isToday || !this.isViewingPast()){ //only allow for today and future
            //console.log(`addEvtInScheduleMaps --editScore today for: ${evt.id}`, startTime, endTime)
      this.canEnableEditScore(evt.id,endTime)
      this.enableEndNowBtn(evt.id, startTime, endTime)
    }

    return true //return true?
  },
  updateEvtInScheduleMaps(evID, timeyStart){
      if(this.dailyScheduled.has(evID)){
          let evt = this.dailyScheduled.get(evID)
          //console.log("updateEvtInScheduleMaps",evt,timeyStart)
          let forsy = evt.for
          let oAt = evt.originalAt
          let oldStart = evt.start
          let oldEnd = evt.end
          let newEndy = addToDate(timeyStart, { minute: forsy })
          let scorey = evt.score

          this.dailyScheduled.set(evID, {
            on: timeyStart.date,
            originalAt: oAt, //timeyStart.time, >>keep origin time
            for: forsy,
            start: timeyStart,
            end: newEndy,
            score: scorey  //gaah dont leave stuff or think they take the original value smh
          })

          let hadEnd = this.endTimesSet.delete(oldEnd.time)
          if (hadEnd){
              //console.log(`endTimesSet rem/add for ${evID} :: ${oldEnd.time} to ${newEndy.time}`)
              this.endTimesSet.add(newEndy.time) 
          }else{console.log("updateEvtInScheduleMaps-endTimesSet NOT FOUND?!?")} //this could happen? ToTest

          let hadStart = this.startTimesSet.delete(oldStart.time)
          if (hadStart){
              this.startTimesSet.add(timeyStart.time) 
          } else {
            console.log("updateEvtInScheduleMaps-startTimesSet NOT FOUND?!?",evID, timeyStart)
            //this could happen? yes....
          } 
          

          let isToday = this.currentDate == today() 
          if (isToday || !this.isViewingPast()){ //only allow for today and future
            //console.log(`updateEvtInScheduleMaps --editScore today for: ${evID}`,timeyStart.time, newEndy.time)
            this.canEnableEditScore(evID,newEndy)
            this.enableEndNowBtn(evID, timeyStart, newEndy)
          }

          return true
      }else{
          console.log("updateEvtInScheduleMaps--euh not found?ERROR?",evID, timeyStart) 
          return false 
      }  
      
  },
  evtIsOverlappingTimes(tStart, tEnd, eStart, eEnd){ //id for debug--should remove
    //custom to also return more info whether overlapping left(haut?), right(bas?), totalO(surrounding)
    //also uses getTimeIdentifier lib function via this.getTimeyNumber(timey) above
    
    let targetStart = this.getTimeyNumber(tStart)
    let targetEnd = this.getTimeyNumber(tEnd)

    let evtStart = this.getTimeyNumber(eStart)
    let evtEnd = this.getTimeyNumber(eEnd)

    //console.log("evtIsOverlappingTimes ORIG>>",tStart, tEnd, eStart, eEnd)
    //console.log("evtIsOverlappingTimes THEN>>"+id,targetStart,targetEnd,evtStart,evtEnd) // >> 805 830 500 535
    
    if (targetStart === false || evtStart === false || targetEnd === false || evtEnd === false) {
      console.log("ERROR... evtIsOverlappingTimes error",targetStart,targetEnd,evtStart,evtEnd)
      return false
    }//else {console.log("evtIsOverlappingTimes",targetStart,targetEnd,evtStart,evtEnd)}

    //so adding the '=' equal sign, also finds evts next to each other(without space in between) and that's a conflict--want some breather?!?
    //prolly better to have evts NEXT to each other!
    let dir = false
    if(targetStart > evtStart && targetStart < evtEnd){// overlap left...beware of '=' removal >>evts are next to each other!
      //return 'bas'  //so target is EARLIER than scheduled evt...prolly?
      dir = 'bas'
    } 
    if (targetEnd > evtStart && targetEnd < evtEnd){ // overlap right ...>> effects of removing '=' as above (evts can be next to each other!!)
      //return 'haut'  //so target is LATER than scheduled evt...prolly?
      dir = 'haut'
    }
    if((evtStart >= targetStart && targetEnd >= evtEnd) || (targetStart >= evtStart && targetEnd <= evtEnd)){ //have to also check opposite!!!
      //return 'surrounding'  //prolly? 
      dir = 'surrounding'
    }
    
    return dir //false

  },
  
  //supposes that evID is not in dailyScheduled yet and return array of scheduled evts that might overlap!
  //actually return the FIRST overlapping event as going through the whole map might find evts that are being added**BEWARE--tofix sometimes!
  hasOverlappingEvent(evID, targetTimestamp, duration) {
    const mappyA = []
    
    let tStartAt = targetTimestamp
    let tEndsAt = addToDate(tStartAt, { minute: duration})

    //console.log(`hasOverlappingEvent for ${evID} at ${targetTimestamp.time} for ${duration}`, tStartAt, tEndsAt)

    this.dailyScheduled.forEach((value, key, map) => {
      if (key == evID){//skip self!
        //console.log(`${evID} skippin self ${key}`,value)
      }else{
        let oDirection = this.evtIsOverlappingTimes(tStartAt,tEndsAt,value.start,value.end) //`${evID}->${key}`
        if (oDirection){
          //console.log(`OverlappingConflict ${evID} en "${oDirection}" of evt:${key} at`,value.start.time)//tStartAt value
          // duration, tStartAt, tEndsAt, value.start, value.end
          //if (this.startTimesSet.has(tStartAt.time)){console.log(`OverlappingConflict ${evID} same start`,tStartAt.time)} // ? sameTime.add({at:startTime.time, id:event.id})
          mappyA.push({ 
            target:evID,
            targetStart:tStartAt,
            direction:oDirection,
            inConflict:key 
          })
        }
      }
    })

    return mappyA
  },
  //check for overlap while adding evts
  overlapCheckEvtsAdd(evts){
   
    let euhOverlaps = {} 
    //console.log(`overlapCheckEvtsAdd with evts`, JSON.parse(JSON.stringify(evts)))

    for(let i = 0; i < evts.length; i++){
      let obj = evts[i]

      let startTime = addToDate(parsed(obj.date), { minute: parseTime(obj.time) })
      //let endTime = addToDate(startTime, { minute: obj.duration })
          
      let oOth = this.hasOverlappingEvent(obj.id, startTime, obj.duration) //before add evt
      
      if(oOth.length > 0){
        //console.log(`overlapCheckEvtsAdd at ${startTime.time} for ${obj.id}:"${obj.title.trim()}">>`,oOth)  //oOth.length  // obj //Object.keys(oOtherO).length //`${obj.id}::${obj.title}
        
        //beware of semantics!
        //TOTEST with more than one evts**
        let j = 0
        do {
          let oDets = oOth[j]

          //instead of target> add by inConflict
          // better overlap resolution later--See multiConflicts()
          if(!euhOverlaps[oDets.inConflict]){
            euhOverlaps[oDets.inConflict] = []
          }
          euhOverlaps[oDets.inConflict].push(oDets)

          //console.log(`${j}-overlapCheckEvtsAdd for ${obj.id} conflict with ${oDets.inConflict}`, euhOverlaps[oDets.inConflict].length) //oOth[j]
          if(j>0){
            //bon here better to use the obj.id as the evt being added!--case where using inConflict is wrong 
            //--See fixMultiConflicts() >> evt CAN overlap with two others....
            //if(!euhOverlaps[obj.id]){ //keep in mind the obj.id is target
            //  euhOverlaps[obj.id]= []
            //}
            //euhOverlaps[obj.id].push(oDets)

            //>could have multiple default that are overlapping yes!
            //
            console.log("WOAH WOAH, multiple overlaps with same obj!"+j, obj,oOth)
            if (oDets.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",oDets.inConflict); delete euhOverlaps[oDets.inConflict] }
            if (oOth[j-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",oOth[j-1].inConflict); delete euhOverlaps[oOth[j-1].inConflict] }

            if(euhOverlaps[obj.id]) { euhOverlaps[obj.id].push(oDets);console.log("WOAH obj.id already present?",obj.id); } else{ euhOverlaps[obj.id] = [oDets]} 
            
            euhOverlaps[obj.id].unshift(oOth[j-1]) //also add previous as makes sense..
            euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          }    
        } while (++j < oOth.length)
      } else{
        this.addEvtPropsIntoSchedule(obj)
      }   
    }

    console.log("overlapCheckEvtsAdd",JSON.parse(JSON.stringify(euhOverlaps)))

    return euhOverlaps
  },
  whenFrmtTime(timey){
    //let when = (timey) => {
    if(!timey) return ''
    
    let o = timey.split(':')
    return parseInt(o[0]) >= 12 ? timey+"PM" : timey+"AM" 
      //}

  },
  updatedEvtDetails(evt){ //for updating details...tooltip--aint this too much just for parent'color and title?--meh
  
    let prtGoal = this.parentGoalsMap().get(evt.parentGoal)
    if(!prtGoal){
      console.log("ERROR?!? no parent goal for:",JSON.parse(JSON.stringify(evt))) //could happen when adding ad-hoc
      evt.bgcolor = "grey" //default for goals (could be ad-hoc goals) 
      evt.title  = `Ad-hoc:${evt?.title} (${this.parseScore(evt?.score)})` //oldie for evt.title >> "unknown"  //or ${evt?.score} ?!?
      evt.details = `${evt?.title}: ${this.whenFrmtTime(evt?.time)} -- ${evt?.duration}min` 
    } else {
      //console.log("updatedEvtDetails",JSON.parse(JSON.stringify(evt))) //,JSON.parse(JSON.stringify(obj)))
      evt.bgcolor = prtGoal.bgcolor  //for weird colors, becomes transparent--beware**
      //evt.title  +=` (${this.parseScore(evt?.score)})`  //oldie that keeps using/adding to title >> ${evt.title.trim()}
      if (evt.jeSuis){
        evt.details = `Of '${prtGoal.title.trim()}' :: << ${evt.jeSuis.join(',')} >>`
      }else {
        evt.details = `Of '${prtGoal.title.trim()}' :: ${this.whenFrmtTime(evt?.time)} -> ${evt?.duration}min -- ${evt?.inDefaults ? 'Dft:':':'}${evt?.canMove ? ':Mv:':':'}${evt?.isAlternative ? ':Alt':':'}`
      }
    }

    //for later sorting.... too much?!?
    evt.sortTime = addToDate(parsed(evt.date), { minute: parseTime(evt.time) }) 

    //let anotherDiff = this.getTimeNumber(now) - this.getTimeNumber(starty) //duration of event with change
    //let another = diffTimestamp(compareTime,value.start)
    
    //console.log("updatedEvtDetails",JSON.parse(JSON.stringify(evt))) //,JSON.parse(JSON.stringify(obj)))

    return evt
  },
  addPropsEventsTo(aDate, events){
    if (!events) {
      this.doNotify("addPropsEventsTo BUT no goals to schedule...")
      return []
    }
    let toReload = []

    events.forEach((obj) => {
        //let sav = events[obj.id]  //oldie that wasnt good with indexes...
        
        //dailyScheduledMap
        let sav = this.getLocalEvt(obj.id) //here overwrites though....
        //console.log("addPropsEventsTo",JSON.parse(JSON.stringify(sav)),JSON.parse(JSON.stringify(obj)))
        if (sav){
          let clone = Object.assign({}, {...sav,date:aDate}, obj) //Object.assign({}, obj)
          
          //Object.assign(clone,{...sav,date:aDate})

          //console.log("addPropsEventsTo",JSON.parse(JSON.stringify(sav)),JSON.parse(JSON.stringify(obj)),JSON.parse(JSON.stringify(clone)))

          //sav.duration = obj.duration //def gotta use duration in case it has changed!
          //sav.time = obj.time
          //sav.date = aDate //OR  do >> aDate != null ? aDate : obj.date //umm set to itself and better to null this and change in the onChange //"date": "2023-07-22"

          //oldie oldie >> toReload.push(obj)
          //oldie >> toReload.push(fromParent(obj)) //works but should be 'sav' as it's the proper overrided object with parentGoal, etc...below
          toReload.push(this.updatedEvtDetails(clone)) //sav //oldie >>fromParent(sav))


        } else{console.log(`ERROR in addPropsEventsTo...Evt:not present!`,obj) } //when has been deleted prolly--toMonitor**
    })

    //console.log("addPropsEventsTo", aDate,JSON.parse(JSON.stringify(toReload))) //events, typeof events

    return toReload
  },
  //skipAsk to skip asking user--force flag. Also doesnt space evts properly nor check overlapps!!
  changeEvtTime(evID, timeyStart, skipAsk, doAdd=false) {
    //console.log(`changeEventTime ${evID} to ${timeyStart.time} with skip:${skipAsk}..adding:${doAdd}`,this.scheduledEvents.length)
    let evt = this.getScheduledEvent(evID)
    let oldy = null //evt.time 
    
    if(evt){
      oldy = evt.time 
    } else {
      //console.log(`changeEventTime::ADDIN ${evID} with doAdd:${doAdd} and skip:${skipAsk}`,timeyStart.time) //should go together...
      if(doAdd){
        //let e = 
        evt = this.getLocalEvt(evID)
        if (!evt){
          console.log('ERROR in changeEvtTime STILL NOT found?!?',e, evID, timeyStart, doAdd) //shouldnt happen!! typeof evID,
          return false
        }
        oldy = evt.time

      } else {
        console.log('ERROR in changeEvtTime not found, not adding!', evID, timeyStart, doAdd)
        return false
      }
    }

      let doUpdateEvt = (evty,addy) => {
        console.log(`changeEventTime::DoUpdateEvt:: ${addy ? 'DOADD':'NOAdd'} (${evty.id})'${evty.title.trim()}' from ${oldy} to ${timeyStart.time} 
        \ncanMove:${evty?.canMove}, inDef:${evty?.inDefaults},skip? ${skipAsk}`)

        if (addy) {
          let evtArr = this.addPropsEventsTo(this.currentDate, [{...evty,time:timeyStart.time}])
         // console.log("doUpdateEvt:: afterProps",JSON.parse(JSON.stringify(evtArr[0])),JSON.parse(JSON.stringify(evty)))
          this.addEvtPropsIntoSchedule(evtArr[0]) //should be one item....prolly
          
          this.showDefaultBtn(this.isViewingPast()) //changeEventTime::doUpdateEvt

          //return //prolly..>>nah otherwise drop doesnt update***
        }

        this.updateEvtInScheduleMaps(evID, timeyStart) //should also change in scheduledEvents?!? no need prolly...
        //if(!doAdd){ // update details..same as addPropsEventsTo() above >redundant
        evty.time = timeyStart.time
        this.updatedEvtDetails(evty)
        //}
        //console.log("doUpdateEvt:: !NOT doAdd afterProps",JSON.parse(JSON.stringify(evt)))
      }

      let keepAsIs = (evty,doAddy) => {  //schedule at default time--potential for overlap?!? prolly ...toSee and handle!!
        console.log(`changeEventTime::KeepAsIs (${evID})'${evty.title.trim()}' to ${oldy} with ${doAddy ? 'DOADD':'NOAdd'}`,timeyStart.time,'canMove:'+evty?.canMove,'inDef:'+evty?.inDefaults,'skip?'+skipAsk)
        if (doAddy) {
          if (oldy == ''){
            this.doNotify(`'${evty.title.trim()}' have unset default time! Not adding...`)
            return
          }

          let evtArr = this.addPropsEventsTo(this.currentDate, [{...evty,time:oldy}]) //{...evt,time:timeyStart.time} >>bof doesnt work to just change time for invoking..
          console.log("KeepAsIs::doAddy afterProps",JSON.parse(JSON.stringify(evtArr)))
          this.addEvtPropsIntoSchedule(evtArr[0]) //should be one item..prolly...
          
          this.showDefaultBtn(this.isViewingPast()) //changeEventTime::KeepAsIs

          return
        } else {
          this.updateEvtInScheduleMaps(evID, oldy)
          evty.time = oldy
          this.updatedEvtDetails(evty) //potensh to overwrite--toReview**
          console.log("changeEventTime::keepAsIs:: !NOT! doAdd afterProps..",evID,evty.id,JSON.parse(JSON.stringify(evt)) )
        }
      }
      
      let userChoice = (flag,evty,doAddy) => { 
        console.log(`changeEvtTime::userChoice ${flag} >> ${evty.id} to ${timeyStart.time}...`)
        if (flag == 'ok'){
          this.doSaveEvtProp(evID, timeyStart.time, null) //evty.id
        }
        //here doing temp.Move/add just changes the time..
        doUpdateEvt(evty,doAddy)
        
        return flag
      }

    //console.log(`changeEventTime::(${evt.id})'${evt.title.trim()}'...doAdd:${doAdd} > skipAsk:${skipAsk} ...Evt canMove:${evt?.canMove} inDef:${evt?.inDefaults}`) 
   
    //not asking...except for inDefaults && !evt.canMove ..prolly(||)
    if (evt?.inDefaults || !evt?.canMove){
      if (skipAsk) {
        doUpdateEvt(evt,doAdd) //bon just skip!
        //return
      } else {
        if (oldy == timeyStart.time){//when time hasnt changed --just return...EXCEPT when adding! >>toSee** if shouldnt do it in all cases tho!!!--when skipAsk=false ?!?
          console.log(`SAME TIME (${evt.id})'${evt.title.trim()}'..ASKIN with doAdd? ${doAdd} for updateEvt...`,oldy,timeyStart.time)
          if(doAdd){doUpdateEvt(evt,doAdd)}
          return
        } 

        
        //let AmPm = timeyStart?.hour  >= 12 ? "PM" : "AM"
        //let o = oldy.split(':')
        //let oAmPm = parseInt(o[0]) >= 12 ? "PM" : "AM"
        
        let messA = 
        [`Evt "${evt.title.trim()}" by default at ${this.whenFrmtTime(oldy)}.\n\u2800\n`,
        `Also Change default time to ${this.whenFrmtTime(timeyStart.time)}? \n\u2800\n`,
        "Cancel or Dismiss to undo!\n\u2800\n","\n\u2800\n",
        `No selection to schedule at default ${this.whenFrmtTime(oldy)}`]  
        
        let mess = messA.join("\n") ////bon as array?!? >> toSee >>STILL!! is it the dialog?!?

        //console.log(`Move`,messA,mess); //seems good here with that extra \n after cancel showing!!

        //bof see if multi-line >>nope even with r\n smh >>nor + "\n" +  >>Nor concatenation smh
        //---toTry** >> use class >> (see .liney)
        //shouldnt cancel/dismiss NOT schedule?!?

        this.confirmTimeChange('Default Time Change!',
        mess, 
        "Change", //okBtn >>temp btn below added in site as well for clarity
        `Temp.${doAdd ? 'Add':'Move'}`, //altbtnBtn //oldie >>"Temp.Add"
        function(d){userChoice(d,evt,doAdd);}, //onOk //toSee if var passing is good!!
        function(){console.log(`changeEventTime::onCancel...>doing nothing for ${evt.id})'${evt.title.trim()}'`,doAdd)},  //onCancel ////oldie>>doUpdateEvt() //;keepAsIs() //Temp add at ${timeyStart.time}${AmPm}`);doUpdateEvt()
        function(){keepAsIs(evt,doAdd)} //onDismiss >> scheduling at default time ${oldy}${oAmPm}`);keepAsIs()
        //console.log(`changeEventTime::onDismiss...keeping as is>> ${evt.id})'${evt.title.trim()}'`,doAdd);
        )  
      }
    } else { //asking for all except those evt?.canMove
      if (evt?.canMove){ //&& !inDefault ?
        doUpdateEvt(evt,doAdd)
      } else {
        if (oldy == timeyStart.time){//when time hasnt changed --just return...EXCEPT when adding!--toSee if shouldnt call all time? specially with skipAsk!!
          console.log(`SAME TIME! BEWARE~~ (${evt.id})'${evt.title.trim()}'...doAdd?${doAdd}..skipAsk?:${skipAsk}..returning!!`,oldy) //beware of this case!!!
          //if(doAdd){doUpdateEvt()}
          return //toSee if proper to return...
        } 

        //let AmPm = timeyStart?.hour  >= 12 ? "PM" : "AM"
        //let o = oldy.split(':')
        //let oAmPm = parseInt(o[0]) >= 12 ? "PM" : "AM"
        
        let messA = [`Evt "${evt.title.trim()}" Aint move from ${this.whenFrmtTime(oldy)}.\n\u2800\n`,"\n\u2800\n",
        `Also Move time to ${this.whenFrmtTime(timeyStart.time)}? \n\u2800\n`,"\n\u2800\n",
        "Cancel or Dismiss to undo!\n\u2800\n","\n\u2800\n",
        `No selection to add at default ${this.whenFrmtTime(oldy)}`
        ]
        //  to schedule at default ${oldy}${oAmPm}
        //No selection or Dismiss to undo! ` 

        // for only Temporary ${doAdd ? 'add':'move'}.
        //bof see if multi-line >>nope even with r\n smh 
        //---toTry** >> use class >> (see .liney)
        //&#8203 or U+200B
        //\n\u2800\n
        
        let mess = messA.join('\n') //toSee smh >>prolly also good! but cannot seem to fit?!?

        this.confirmTimeChange("Moving Evt's time",
        mess, 
        "Change", //okBtn
        `Temp.${doAdd ? 'Add':'Move'}`, //altbtn //oldie >>"Temp.Move"
        function(d){userChoice(d,evt,doAdd)}, //onOk //toSee with choice
        function(){console.log(`changeEventTime::onCancel..>doing nothing for ${evt.id})'${evt.title.trim()}'`,doAdd)}, //;keepAsIs() //doUpdateEvt()  //shouldnt cancel/dismiss NOT schedule?!?
        function(){console.log(`changeEventTime::onDismiss..keep as is>> ${evt.id})'${evt.title.trim()}'`,doAdd);keepAsIs(evt,doAdd)} //.scheduling at default time`);keepAsIs() 
        //onDismiss/...should prolly remove it actually!--or leave at default time?!?
        ) 
      }
    }
    
  },
  recurChangeTime(overlappedEvtID, tEvt, targetTimestamp, skipAsk = false, doAdd = false) { //goForward = false
    let overlappedEvt = this.dailyScheduled.get(overlappedEvtID)
    if (overlappedEvt){

      //umm using overlappedEvt to keep same time interval between the two events?!? >> meh but to explore later but no point with overlaps...
      
      //direction of drag(up or down) >>either - or + 
      //let dragTimeInterval = parseTime(targetTimestamp.time) - parseTime(tEvt.time)
      let dragTimeInterval = parseTime(overlappedEvt.start.time) - parseTime(targetTimestamp.time)
      
      let dName = `${dragTimeInterval > 0 ? "DOWN": "UP"}` //so down is forward in time..prlly
      //let dggyName = `${draggyInterval > 0 ? "DOWN": "UP"}`
      //console.log(`${overlappedEvtID} of dura: ${overlappedEvt.for} moving <> ${dName} due to evt:${tEvt.id} of dura:${tEvt.duration} at ${targetTimestamp.time}...doAdd:${doAdd} and skipAsk:${skipAsk}`) //overlappedEvt

      //tEvt.time >> original Evt time but the targetTimestamp.time >> WHEN it should be scheduled at

      let overlappedEvtNew = null
      if (dragTimeInterval >= 0 ) { //>=0 ?!? yup // also this add of extra 10 prolly lead to more overlap! should remove for too many evts!!--todo**
        overlappedEvtNew= addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) 
        let alternative = addToDate(targetTimestamp, { minute: parseInt(overlappedEvt.for) + 10 })//overlappedEvt.for might be too much...
        console.log(`recurChangeTime::${overlappedEvtID}...FORWARD ${dName} for ${dragTimeInterval} due to evt:${tEvt.id} at ${targetTimestamp.time} 
        \n doAdd?:${doAdd}, skipAsk:${skipAsk} > New>`, JSON.parse(JSON.stringify(overlappedEvtNew.time)), 'alt:',alternative.time)
        //should use the closer time...avoid multiple overlaps later..
        let diffy = diffTimestamp(alternative,overlappedEvtNew)
        if(diffy > 0){ //so overlappedEvtNew is later...use alternative perhaps? >> nah could sometimes add evt too close and have another overlap!! --especially during CASCADING timechange
          let bo = Math.floor((diffy/1000)/60)
          if (bo <= dragTimeInterval){ //toSee if would help with proper timechange during cascading...>so far so good!
            console.log(`recurChangeTime::${overlappedEvtID}....with duration:${overlappedEvt.for} vs evtDura:${tEvt.duration}...NOT using alternative!!`)
          } else {
            console.log(`recurChangeTime::DIFFY>>${diffy}...gonna use Alternative`,alternative.time)  //negative means alternative is worse and should use overlappedEvtNew
            overlappedEvtNew = alternative
          }
        }
      } else {//remove instead of add.
        overlappedEvtNew = addToDate(targetTimestamp, { minute: -(parseInt(overlappedEvt.for) + 10)})
        let alternative = addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) }) //toSee if overlappedEvt.for isnt too much? nope seems proper for backward...prlly
        let diffy = diffTimestamp(alternative,overlappedEvtNew) //toSee
        console.log(`recurChangeTime::${overlappedEvtID}...BACKWARD ${dName} for ${dragTimeInterval} due to evt:${tEvt.id} at ${targetTimestamp.time}
        \n doAdd?:${doAdd}, skipAsk:${skipAsk} > New`, overlappedEvtNew.time, 'alt:'+alternative.time,'diffy='+diffy)
      }

      //&#8203 or U+200B ...
      
      let anyOtherOverlap = this.hasOverlappingEvent(overlappedEvtID, overlappedEvtNew, overlappedEvt.for)
      
      if(anyOtherOverlap.length > 0) {
        //console.log(`WARNING WARNING::more Overlaps::recurChangeTime ${overlappedEvtID} at ${overlappedEvtNew.time}`,anyOtherOverlap.length, anyOtherOverlap)
        let i = 0
        let sizey = anyOtherOverlap.length
        let draggy = this.getScheduledEvent(overlappedEvtID)

        draggy ? this.doNotify(`Cascading time change while adding '${draggy?.title.trim()}' due to "${tEvt.title.trim()}"`, "warning",'top') : console.log(`ERROR::recurChangeTime ${overlappedEvtID} not found`)

        do {
          console.log(`WARNING CASCADING timeChange ${overlappedEvtID}-${draggy?.title} at: ${overlappedEvtNew.time} 'gon recurChangeTime::
          OLDie doAdd?:${doAdd}, OLDie skipAsk:${skipAsk}..gon be true \n now at: ${overlappedEvt.start.time}  till ${overlappedEvt.end.time}`, anyOtherOverlap[i]) 
          //should prolly skip when seeing own self?!?--toMonitor**
          //should def break or goes in an infinite loop!!--when seeing original evt...
          if(anyOtherOverlap[i].inConflict == tEvt.id){
            console.log(`EUUUH...::recurChangeTime::self overlap?!?${overlappedEvtID} ...breaking!`, anyOtherOverlap[i]) 
            break  //or  return //?
          }
          
          this.scrollToTime(overlappedEvtNew) //toSee**.huh seems to work...gotta check first!
         
          //skipAsk should be true as recursion implicitly force schedule change--instead of using passed in.
          this.recurChangeTime(anyOtherOverlap[i].inConflict,draggy,overlappedEvtNew, true) //doAdd flag prolly not needed...
          
          //umm shouldnt use this.fixyOverlaps() instead of recursion self?!? --toTry**
        } while (++i < sizey)
      }

      this.changeEvtTime(overlappedEvtID, overlappedEvtNew, skipAsk) //recurChangeTime
      console.log(`recurChangeTime::OVERLAPPED: ${overlappedEvtID} ${dName} to ${overlappedEvtNew.time} ...skipAsk:${skipAsk} >> doAdd:${doAdd}`)
      
      //umm should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
      let draggedNewTime = targetTimestamp //(dragTimeInterval > 0 || goForward) ? addToDate(targetTimestamp, { minute: 0 })
                            //                      : addToDate(targetTimestamp, { minute: 0 }) 
      
      //the evt doing displacement stays the same.
      console.log(`recurChangeTime::TARGET:(${tEvt.id})${tEvt?.title.trim()} going ${dName} skipAsk:${skipAsk} >> doAdd:${doAdd} to time>> ${draggedNewTime.time}`) //goForward,
      
      //flag to add target in case..
      this.changeEvtTime(tEvt.id, draggedNewTime, skipAsk, doAdd) //recurChangeTime
      //worked = this.updateEvtInScheduleMaps(tEvt.id, draggedNewTime)

     
    } else{
      console.log("ERROR..ERROR recurChangeTime:: overlapped event not found!", overlappedEvtID)
    }
  },

  //Solve conflicts between scheduled and new Evts to be added!
   //'from' param could help with offering/removing some options--could go faster too instead of double choices--toSee**
  fixyOverlaps(toHandle,override = null,from =''){
    // 8: {direction: "haut",inConflict: 8,target: 1}

      const prioLabel = (evt,f) => {
        if (evt?.parentGoal){
          let prt = this.parentGoalsMap().get(evt.parentGoal)
          return f ? `Of '${prt?.title.trim()}' with Prio(${prt?.priority})` : `Of '${prt?.title.trim()}'`
        }
        console.log('prioLabel..ERROR no PARENT found?',evt)
        return '' //prolly empty string //oldie >> null
      }

      const evtLabels = (anEvt,how) => {
        switch (how) {
          case 'score':
            return `${prioLabel(anEvt,false)} > "${anEvt.title.trim()}" with Score:: ${anEvt.score} = ${this.parseScore(anEvt.score)}`
          case 'prio':
            return `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)}`
          default:  //pickEvt
            return `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)} && Score:: ${ anEvt.score}`
        }
      }

      const aNotif = (mess) => {
        this.doNotify(mess, "positive",'top') //`Cancelling to keep "${title}"`
      }

      const updateMoodLabel = (id) => { //seems wrong to put here for some reason...toReview***
        if (this.usingMoods[id]){
          //let b = this.usingMoods[id] //just to see....
          delete this.usingMoods[id]
      
          //this.scheduleMoodsLabel >>to force label update smh
          console.log(`fixyOverlaps::updateMoodLabel>>...`+id,this.scheduleMoodsLabel) //,JSON.parse(JSON.stringify(Object.fromEntries(this.dailyScheduled.entries())))) 
        }else{
          console.log(`fixyOverlaps::updateMoodLabel>>NO mood by `+id,from)
        }
      }

      const doRem = (evt) => {
        console.log(`fixyOverlaps::doRem ${evt.id}:${evt.title}`)

        //umm should use >> from.indexOf('byMood') ?? >> for now it's proper methink...
        updateMoodLabel(evt.id)
        //if (this.usingMoods[evt.id]){ 
        //  let b = this.usingMoods[evt.id] //meh
        //  delete this.usingMoods[evt.id]   
        //  console.log(`fixyOverlaps::doRem>>deleting Moody...`+evt.id,b,this.scheduleMoodsLabel)//to force label update smh //JSON.parse(JSON.stringify(Object.fromEntries(this.dailyScheduled.entries())))
        //}

        this.doRemove(evt) //fixyOverlaps
      }

      const removeReplace = (toRem,toAdd,aConf) => { 
        //at ${toAdd.time} with ovrd:${override}`, aConf)  //aConf.targetStart.date
        console.log(`fixyOverlaps::removeReplace >> replacing>> ${toRem.id}) '${toRem.title.trim()}' WITH ${toAdd.id}) ${toAdd.title.trim()}`, aConf, 'from>'+from)

        toAdd = this.addPropsEventsTo(aConf.targetStart.date,[{...toAdd,time:aConf.targetStart.time}]) //proper change of time
       
        if(override){
          console.log("fixyOverlaps::removeReplace...OVERRIDE from>>"+from) //,JSON.parse(JSON.stringify(toAdd))
          if (from == 'onDrop'){//for consistency with okChoice....
            doRem(toRem)
            return
          }

          console.log("fixyOverlaps::removeReplace....OVERRIDE updating..."+from)
          this.updateEvtInScheduleMaps(toAdd[0].id, aConf.targetStart)
          console.log(`fixyOverlaps`,this.startTimesSet,this.endTimesSet,JSON.parse(JSON.stringify(this.scheduledEvents)))
          return
        }
      
        doRem(toRem)

        //this.addEvtPropsIntoSchedule(toAdd[0]) //could this overlap again?!? YES >>handled below

        let euhOverlaps = this.overlapCheckEvtsAdd(toAdd) //use this instead of above to fix extra overlaps
        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`${from}>fixyOverlaps::removeReplace:: OVERLAPS again from adding ${toAdd.length} overlaps =${sizey}`,toAdd,JSON.parse(JSON.stringify(euhOverlaps))) // to ${toReload.length}. on:${this.currentDate} 
          
          this.doNotify(`Extra Overlaps while adding ${toAdd[0].title.trim()}`, "warning",'top')
          return this.fixyOverlaps(euhOverlaps,override,from+'nah') //fixyOverlaps
        }

        let f = this.updateCurrentSchedule() //update startTimes--no overlaps check but redundant now as using overlapCheckEvtsAdd()
        if (f.size > 0){ // handle sameStart...shouldnt get here..prolly
          console.log('fixyOverlaps::removeReplace::SameStart?!?', f)
          this.fixSameStart(f) //fixyOverlaps
        }
        return 
      }

      const forceAdd = (toChange, toAdd,conf) => {
        
        const properT = addToDate(parsed(this.currentDate), { minute: parseTime(toChange.time) }) //just to see >>meh

        console.log(`from:${from}--forceAdd: ${toAdd.id})'${toAdd.title}' at ${toAdd.time}.
        \nChanging >>${toChange.id} from ${toChange.time} `,conf.targetStart.time)
        
        console.log(conf, properT)

        if (conf.direction !== 'surrounding'){ //this in order to limit going in circles with overlapCheckEvtsAdd()...
          //console.log(`fixyOverlaps::forceAdd >> recurChangeTime....`)
          this.recurChangeTime(toChange.id,toAdd,conf.targetStart, true, true)//properT //skipAsk user as should force!
        }else{
          console.log(`fixyOverlaps::forceAdd: gonna overlapCheckEvtsAdd....`)
          
          toAdd = this.addPropsEventsTo(conf.targetStart.date,[{...toAdd,time:conf.targetStart.time}])

          let euhOverlaps = this.overlapCheckEvtsAdd(toAdd)
          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`from:${from}>fixyOverlaps::forceAdd:: OVERLAPS again of size:${sizey} from > `+toAdd[0].title,JSON.parse(JSON.stringify(euhOverlaps)))
            
            //Note*** see with adding 'nah' that no more circles--should be less prolly with recurChangeTime()
            this.doNotify(`Extra Overlaps while adding '${toAdd[0].title.trim()}' `, "warning",'top')
            return this.fixyOverlaps(euhOverlaps,override,from+'nah') //fixyOverlaps
          }
        }

        let f = this.updateCurrentSchedule() //update startTimes--no overlaps check >> redundant now as using overlapCheckEvtsAdd()
        if (f.size > 0){ // handle sameStart...shouldnt get here..prolly
          console.log('fixyOverlaps::forceAdd::SameStart?!?', f)
          this.fixSameStart(f) //fixyOverlaps
        }//else{console.log('fixyOverlaps::forceAdd::NoSAME START',f)}

        this.disableSaveSchedule = false
        this.showDefaultBtn(this.isViewingPast())
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
            //console.log("fixyOverlaps::onOkChoice::moody? from: "+from,toAdd.title.trim())
            updateMoodLabel(toAdd.id)
          }

          if(override){
            doRem(toAdd)
          }
        }
      }

      let cancelChoice = (toAdd,currScheduled) => {
        if(override){
          console.log("fixyOverlaps::cancelChoice::OVERRIDE...coolios!!from:"+from,toAdd.title.trim())

          if (from == 'onDrop'){ //yup on drag/drop >>cancel should just revert to original..toMonitor
            aNotif(`Umm...not moving then....`)
            this.disableSaveSchedule = true //disable saveSchedule
            this.showReloadBtn = false
            this.showClearBtn = false

            return 
          }

          doRem(toAdd)  //remove is proper in other cases though?...prolly

          aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
          return 
        }

        //smh cause it never gets into doRem() and using override flag would affect removeReplace() 
        //--toTest* using 'from' check maybe
        if(from.indexOf('byMood') > -1){
          console.log("fixyOverlaps::cancelChoice::moody? from: "+from,toAdd.title.trim())
          updateMoodLabel(toAdd.id)
        }
        //if (this.usingMoods[toAdd.id]){
        //  let b = this.usingMoods[toAdd.id] //just to see....
        //  delete this.usingMoods[toAdd.id]
      
          //this.scheduleMoodsLabel >>to force label update smh
        //  console.log(`fixyOverlaps::cancelChoice>>deleting Moody...`+toAdd.id,b,this.scheduleMoodsLabel) //,JSON.parse(JSON.stringify(Object.fromEntries(this.dailyScheduled.entries())))) 
        //}

        aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
      }

      let onDismissy = (mess) => { //,c
        console.log(mess,'from>>'+from,this.scheduledEvents.length) //c,//f//JSON.parse(JSON.stringify(c))
        this.showDefaultBtn(this.isViewingPast())
      }

      let daChoice = []
      let toHandleSize = Object.keys(toHandle).length

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
            function(){onDismissy('fixyOverlaps::resolveChoice opt3>> by Event... dismissing')}
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
            function(){onDismissy('fixyOverlaps::resolveChoice opt2>> by Score... dismissing')}
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
            function(){onDismissy('fixyOverlaps::resolveChoice opt1>> by Priority... dismissing')}
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
            console.log("fixyOverlaps::manualSolve NOT adding Force as from "+from) 
          } else {
            opts.push({ label: `Force in '${toAdd.title.trim()}'`, value: 'opt4' })  
            // at ${when(aConf?.targetStart?.time)} >> could have changed
          } 
        } else {
          console.log("fixyOverlaps::manualSolve NO force option...direction!==surrounding?",aConf.direction !== 'surrounding', 'autoSolve?: '+ autoSolve, from)
        }

        let mess = ` '${toAdd.title.trim()}' Overlaps with Scheduled '${currScheduled.title.trim()}'.
        \nCancel to keep '${currScheduled.title.trim()}' at ${this.whenFrmtTime(currScheduled?.time)}` 
      
        this.radioChoiceDialog('Resolve Overlapping Events',
          mess,
          opts,
          'opt1', //toMonitor** if no opt1(prio)
          function(opt){//onOk
            resolveChoice(opt,toAdd,currScheduled,aConf)//JSON.parse(JSON.stringify(daChoice)))
          },
          function(){//onCancel
            console.log("fixyOverlaps::manualSolve::cancelChoice>> from: "+from,daChoice)//,JSON.parse(JSON.stringify(daChoice)))  //daChoice
            cancelChoice(toAdd,currScheduled)
          },
          function(){//onDismiss //first dialog goes out of view >> nothing to do scheduledEvents
            console.log("fixyOverlaps::onDismiss >"+from,daChoice)
          }
        )
      }

    ////////////////// START ///////////////////

    for (let key in toHandle) {
      if (!toHandle[key] || !toHandle[key][0]){
        console.log("fixyOverlaps...unknown key found",key) //could happen with fixMultiConflicts()--see below! 
        continue
      }

      //proper reset by iteration means declaring Opts here smh--would putting into lambda be better? toTry***
      let defaultOpts = [
        //{ label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
        //{ label: 'Choose by Score', value: 'opt2' },
        { label: 'Choose one event', value: 'opt3' }
      ]

      ////add relevant options....
      if (from == 'reloadScore'){
        defaultOpts.unshift({ label: 'Choose by Priority', value: 'opt1', color: 'secondary' })
      } else if (from == 'findSamePrio'){
        defaultOpts.unshift({ label: 'Choose by Score', value: 'opt2' })
      } else if (from == 'onDrop'){
        defaultOpts.unshift(
          { label: 'Leave as is!', value: 'opt0' },
          { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
          { label: 'Choose by Score', value: 'opt2' }
        )
      } else { //default all!
        defaultOpts.unshift(
          { label: 'Choose by Priority', value: 'opt1', color: 'secondary' },
          { label: 'Choose by Score', value: 'opt2' }
        )
      }

      let toH = toHandle[key]
      //console.log(`fixOverlaps::handlin...${key}`)  

      if (toH.length > 1) {//for multiple overlapps with same events
        console.log(`fixyOverlaps::WOAH WOAH...multiple overlaps!!`) //,JSON.parse(JSON.stringify(toH))
        if ("withID" in toHandle){
          console.log(`fixyOverlaps::using fixMultiConflicts!`)
          this.fixMultiConflicts(toH,override,from)
        }else {
          console.log(`fixyOverlaps::using multiConflicts!`)
          this.multiConflicts(toH,override,from)
        }
        continue
      }


      const aConf = toH.pop() //toH.shift() to resolve in order? >>dont matter!

      let toAdd = this.getLocalEvt(aConf.target) //number
      let currScheduled = this.getScheduledEvent(aConf.inConflict) 
      if (!currScheduled || !toAdd ){console.log("fixyOverlaps...ERROR ERROR no evts found!!!",aConf);return}

      console.log(`fixyOverlaps::adding ${toAdd.id}:${toAdd.title.trim()}(${toAdd.time})++${toAdd.duration} AT >> ${aConf?.targetStart?.time} -- ${aConf.direction} 
      Overlap with ${currScheduled.id}:${currScheduled.title.trim()}(${currScheduled.time})++${currScheduled.duration}`,override,'from:'+from,'toHandle='+toHandleSize) //aConf

      //case sensitive?!? toSEE***
      let toAddInclud = toAdd.title.trim().includes(currScheduled.title.trim())
      let scheduledInclud = currScheduled.title.trim().includes(toAdd.title.trim())

      //check also for the parent relation?--toSee...especially if too much for no reason....
      let toAddPrt = this.parentGoalsMap().get(toAdd.parentGoal)
      let currSPrt = this.parentGoalsMap().get(currScheduled.parentGoal)

      let toAddPrtInclud = toAdd.title.trim().includes(currSPrt.title.trim())
      let currSPrtInclud = currScheduled.title.trim().includes(toAddPrt.title.trim())
      if (toAddPrtInclud || currSPrtInclud){ //auto-schedule...for parents!!---todo***
        //should schedule the subGoal!!! (Next of 'Me Me' parent)
        // OR (if cant for any reason?!?)
        // one of the subGoals of the parent? (parentGoal 'Next' with subgoals-Jobs,Massage,PmP/Pilot,etc)--which should be the one of scheduled or toAdd prolly
        //
        console.log(`fixyOverlaps:: WOAH PARENT AUTO schedule`,toAddPrtInclud, currSPrtInclud,"Normal AUTO>>", toAddInclud, scheduledInclud,'direction == surrounding? >>', aConf.direction == 'surrounding')

      }
      
      if (toAddInclud || scheduledInclud){ //auto-schedule...shouldnt when can force?!? toMonitor**
        console.log(`fixyOverlaps:: can AUTO schedule`,toAddInclud, scheduledInclud,'direction == surrounding? >>', aConf.direction == 'surrounding')
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
  //when multiple evts to be added have conflict with single scheduled evt--used with fixyOverlaps!
  multiConflicts(conflicts,override = null,from=''){ //prolly no need for override--toRemove**
    //let scheduled = null 
    let label = ''

    let toAdd = []
    let currScheduled = null //SHOULD be one evt instead of using Set >>let allConfs = new Set()
    let toKeep = []

    let targetStart = null //when...if has changed....

    let forceAddy = new Map() //in case of forceAdd 
    let choices = new Map() //for user choices

    let defaultOpts = [
                //{ label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
                //{ label: 'Resolve by lowest Score Interval', value: 'opt2' }, //should be more concise here--todo**
                { label: 'Pick one event', value: 'opt3' }
              ] //huh could actually show the conflicts evts's title here instead?--bof this can be chosen in one of the options....
    
      const mapToLabels = anEvt => {
        let prt = this.parentGoalsMap().get(anEvt.parentGoal)
        return { label: `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) for ${anEvt?.duration} mins`, value: anEvt.id }
        //return { label: anEvt.title.trim() + " with (" + anEvt.score + ") for "+ anEvt?.duration+"mins", value: anEvt.id }
      }
      
      const findhighestPrio = allEvts => {
        let highest = 0
        let toRet = null

        for (let evt of allEvts) {
          if(evt.parentGoal){
              let prt = this.parentGoalsMap().get(evt.parentGoal)
              if (prt){
                if (prt.priority > highest){ //umm what happens when no priority? **toTest**
                  highest = prt.priority
                  toRet = evt
                }
              }else{console.log('multiConflicts::findhighestPrio..ERROR no PARENT found?',evt)}

          }else{console.log('multiConflicts::findhighestPrio..ERROR EVT not found?',evt)}
        }

        //console.log('multiConflicts::findhighestPrio...',toRet?.title.trim(), highest) //allEvts
        choices.set(toRet.id,`By highest priority (${highest}),`)
        return toRet
      }

      //umm getting highest interval score(so lowly scored)
      let highestScoreInterval = (conflictEvts) => {
        let lowScore = 0
        let current = null
        for (let e of conflictEvts) {
          let daScore = this.parseScore(e.score)
          if(daScore > -1 && daScore >= lowScore) {
            lowScore = daScore
            current = e//e.id
          }
        }

        if (current){
          console.log('multiConflicts::Largest Score interval', current.id,current?.title.trim(), current.score) //current) //,current.details
          return current

        }else{console.log('ERROR ERROR multiConflicts::highestScore...no current set?',lowScore, current,conflictEvts)} //shouldnt happen!!--toMonitor**
      }

      let removeConflicts = (toKeepArr, allConflicts) => { //toKeepArr should be single elt
        console.log(`multiConflicts::removeConflicts with toKeep=${toKeepArr.length} out of total:${allConflicts.length}`)

          let extraO = []
          allConflicts.forEach((value, valueAgain, set) => {
            //console.log(`removeConflicts..checking`,value.id) //valueAgain
            if (toKeepArr.find(item => item.id == value.id)){
              let choice = choices.has(value.id) ? choices.get(value.id) : '' 
              console.log(`multiConflicts::removeConflicts:KEEEP..TIME? by>`+choice,value.id, value?.title.trim(),value?.time,targetStart)
            
              if (value.id != currScheduled.id){
                let eee = this.addPropsEventsTo(this.currentDate,[{...value,time:targetStart}]) //umm use original time value?.time instead? tbd***
                
                //this.addEvtPropsIntoSchedule(eee[0])
                let euhOverlaps = this.overlapCheckEvtsAdd(eee) //use this instead of above to fix extra overlaps
                if(Object.keys(euhOverlaps).length > 0) { 
                  extraO.push(euhOverlaps)
                } else {
                  console.log(`multiConflicts::removeConflicts--no other overlap`,value?.title.trim())
                  let mes = `${choice} Adding '${value?.title.trim()}' at ${this.whenFrmtTime(targetStart)}` //add parent?!? or more info? tbd**
                  this.doNotify(mes, "positive",'top')
                } 
                
              } else { //nothing to do for scheduled..
                console.log(`multiConflicts::removeConflicts...already scheduled!!`,value?.title.trim()) //targetStart, value
                this.doNotify(`${choice} Keeping scheduled '${value?.title.trim()}' `, "positive",'top') //at ${when(targetStart)}
              }
            } else {
              if (value.id == currScheduled.id){ //remove scheduled
                console.log(`multiConflicts::removeConflicts...removing scheduled!!`,value.id, value.title)
                
                if (this.usingMoods[value.id]){
                  delete this.usingMoods[value.id]
                  console.log(`multiConflicts::removeConflicts>>deleting Moody...`+value.id,this.scheduleMoodsLabel) //label update...
                }
                

                this.doRemove(value) //multiConflicts
                //doNotify?!? >>meh no need
              } //else {//nothing...no need to add it...prolly
               // console.log(`removeConflicts...NOT adding...`,value)
              //}
            }
          })

          if(extraO.length > 0) {//shouldnt be more than one... toTest**
            console.log(`${from}>multiConflicts::removeConflicts:: OVERLAPS again from ${toKeepArr.length} overlaps =${extraO.length}`,extraO) // to ${toReload.length}. on:${this.currentDate} 
            this.doNotify("More Overlaps to fix!!!", "warning",'top')
             
            return this.fixyOverlaps(extraO[0],override,from+'nah') //multiConflicts
          }

          let f = this.updateCurrentSchedule()
          if (f.size > 0){
            console.log('multiConflicts::removeConflicts::SAMESTART!!', f)
            this.fixSameStart(f) //multiConflicts
          }
      }

      let chooseEvt = (conflictEvts) => {
        this.radioChoiceDialog('',
            'Choose the event to schedule',
            conflictEvts.map(mapToLabels),
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
              
              console.log(`chooseEvt::onOk >>${d} >> ${e?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
              return e
            }, 
            null, //onCancel--no need as have to choose!!!
            function(){//onDismiss
              //console.log('chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

              if (toKeep.length > 0 ) { //== conflicts.size te than main dialog!
                console.log('chooseEvt::LAST LAST?', JSON.parse(JSON.stringify(toKeep))) //,allConfs
                
                setTimeout(() => {
                  removeConflicts(toKeep,conflictEvts)
                }, 0)
              }
            }
        )
      }

      const forceAdd = (conflictEvts) => {
        conflictEvts.forEach((obj) => {
          //console.log(`multiConflicts::forceAdd at ${obj?.time} > ${obj?.title?.trim()}`,JSON.parse(JSON.stringify(obj)))
          if (currScheduled.id == obj.id){
            console.log(`multiConflicts::forceAdd...SKIP scheduled`,currScheduled.title)
          } else {
            let timey = forceAddy.has(obj.id) ? forceAddy.get(obj.id) : null
            console.log(`multiConflicts::forceAdd...NEW:${obj.id} '${obj.title.trim()}' origAt: ${obj.time}`,timey.time)

            //toSee** if shouldnt use overlapCheckEvtsAdd() as in fixMultiConflicts::removeConflicts
            //especially if multiple overlaps with cascading time change!!!
            this.recurChangeTime(currScheduled.id,obj,timey, true, true)//skipAsk user as should force!

          }
        })
        
        let f = this.updateCurrentSchedule()
        console.log('multiConflicts::forceAdd::DONE >>'+conflictEvts.length +" addySize="+forceAddy.size, f,this.dailyScheduled)

        if (f.size > 0){
          this.fixSameStart(f) //multiConflicts
        }
      }
    
    ////add relevant options....
    if (from == 'reloadScore'){
      defaultOpts.unshift({ label:'Resolve by Highest Priority', value: 'opt1', color: 'secondary'})
    } else if (from == 'findSamePrio'){
      defaultOpts.unshift({ label: 'Resolve by Largest Score Interval (low Score)', value: 'opt2'})
    } else { //default all!--no force option here! 
      defaultOpts.unshift(
        { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
        { label: 'Resolve by Largest Score Interval (low Score)', value: 'opt2' },
      )
    }

    ////////////START ///////////

    let hasSurr = false  //in case encounter surrounding>shouldnt offer force option!

    for (let aConf of conflicts) {
      console.log("multiConflicts....handling:>",JSON.parse(JSON.stringify(aConf))) //toSee if have >> aConf.direction !== 'surrounding'  //+from,defaultOpts,

      let aScheduled = this.getScheduledEvent(aConf.inConflict)
      if (!aScheduled) {console.log("multiConflicts...ERROR ERROR no evts found!!!",aConf);return}
      
      if (!currScheduled){
        currScheduled = aScheduled
        targetStart = aConf?.targetStart?.time
      } else{
        if (currScheduled.id != aScheduled.id){console.log("multiConflicts...ERROR Not same inConflict",currScheduled.id ,aScheduled.id); }  //return?
        
      }
      let addin = this.getLocalEvt(aConf.target)
      if (!addin) {console.log("multiConflicts...ERROR ERROR local evt not found!!!",aConf);return}

      label += ` '${addin?.title.trim()}',`
      toAdd.push(addin)

      forceAddy.set(aConf.target,aConf?.targetStart) //...needed? >yup as have string time when should be timestamp...
      aConf.direction == 'surrounding' ? hasSurr = true : hasSurr = hasSurr  //umm...

      //if (aConf?.targetStart?.time != targetStart){ //redundant...
      //  console.log(`multiConflicts...oh WELL timey timey`, targetStart, aConf?.targetStart?.time, aConf?.direction, addin.title)
        //nothin to do...prolly? >> as need to decide on one evt 'tween multiple evts >> but think possible in this case...
        //addForce = true
      //}
    }

    if (!hasSurr){
      defaultOpts.push({ label: 'Force Schedule them in', value: 'opt4'})
    }

    let mess =  `${label} conflicts with scheduled '${currScheduled?.title.trim()}' at ${this.whenFrmtTime(currScheduled?.time)}.
    \nChoose how to solve this...`
    
    toAdd.unshift(currScheduled) //just for completeness... prolly

    this.radioChoiceDialog('Overlap warning!!',
      mess,
      defaultOpts,
      '', //no selection at first..
      function(opt){ //onOk
        if(opt == 'opt3'){  //choose by Event
          chooseEvt(toAdd)
          //return ? //nothing?  //a//JSON.parse(JSON.stringify(a))
        } else if (opt =='opt2'){
          let a = highestScoreInterval(toAdd)
          console.log('multiConflicts::ByScore',a.id,a?.title.trim(), a.score) //,a.details //JSON.parse(JSON.stringify(toKeep))
          toKeep.push(a)
          choices.set(a.id,`By largest score interval (${a.score}),`)
        } else if (opt =='opt1') {
          let a = findhighestPrio(toAdd)  //should return prio found for a notify mayhaps!! toKeep.push() at site instead --todo**
          console.log('multiConflicts::ByPriority',a.id,a?.title.trim()) //, a.score, a.details,//JSON.parse(JSON.stringify(cIDs)),JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(toKeep)))
          toKeep.push(a)
          //choices.set(a.id,"By highest priority,") //done in func
        } else { //forceAdd...could leave other overlaps with cascading time change but oh well
          forceAdd(toAdd) 
          //no adding to toKeep and avoid triggering dismiss below!!
        }
      },
      null,//onCancel...null so that it's false for cancel btn! Cancel SHould keep scheduled!! --todo** //function(){},  >>
      function(){ //onDismiss.
        if (toKeep.length > 0) { //== conflicts.size
          console.log('multiConflicts::MAIN LAST LAST?',toKeep) //JSON.parse(JSON.stringify(toKeep))
            
          setTimeout(() => {
            removeConflicts(toKeep,toAdd)  //,allConfs //huh have use an inner lambda function!!
            //console.log(`fixConflicts::setTimeout::MAIN::DONE`,toKeep.length)
              
          }, 0)
            
        }//else{console.log(`fixConflicts...END`)} //no need 
      }
    )
  },
  //when multiple evts to be added have conflict with single scheduled evt
  //--used with fixyOverlaps! and is same as multiConflicts() above but using id instead of inConflict key 
  fixMultiConflicts(conflicts,override = null,from=''){
    //let scheduled = null 
    let label = ''

    //let toAdd = []  
    //let currScheduled = null //SHOULD be one evt instead of using Set >>let allConfs = new Set()
    
    let toAdd = null  
    let allEvts = []  //so diff from multiConflicts as would have multiple schduled evts in conflict with toAdd
    let toKeep = []
    let choices = new Map() //for user choices

    let targetStart = null //when...if has changed....

    let defaultOpts = [
                //{ label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
                //{ label: 'Resolve by lowest Score Interval', value: 'opt2' }, //should be more concise here--todo**
                { label: 'Pick one event', value: 'opt3' }
              ] //huh could actually show the conflicts evts's title here instead?--bof this can be chosen in one of the options....
    
      const mapToLabels = anEvt => {
        let prt = this.parentGoalsMap().get(anEvt.parentGoal)
        return { label: `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) for ${anEvt?.duration} mins`, value: anEvt.id }
      }
      
      const findhighestPrio = evts => {
        let highest = 0
        let toRet = null

        for (let evt of evts) {
          if(evt.parentGoal){
              let prt = this.parentGoalsMap().get(evt.parentGoal)
              if (prt){
                if (prt.priority > highest){ //umm what happens when no priority? **toTest**
                  highest = prt.priority
                  toRet = evt
                }
              }else{console.log('fixMultiConflicts::findhighestPrio..ERROR no PARENT found?',evt)}

          }else{console.log('fixMultiConflicts::findhighestPrio..ERROR EVT not found?',evt)}
        }
        //console.log('fixMultiConflicts::findhighestPrio...',toRet?.title.trim(), highest)
        choices.set(toRet.id,`By highest priority (${highest}),`)
        return toRet
      }

      let highestScoreInterval = (conflictEvts) => {
        let lowScore = 0
        let current = null
        for (let e of conflictEvts) {
          let daScore = this.parseScore(e.score)
          if(daScore > -1 && daScore >= lowScore) {
            lowScore = daScore
            current = e
          }
        }

        if (current){
          console.log('fixMultiConflicts::Largest score interval', current.id,current?.title.trim(), current.score) //current) //,current.details
            
          return current
        }else{
          console.log('ERROR ERROR fixMultiConflicts::highestScoreInterval...no current?',lowScore, current,conflictEvts)}// return default?--toMonitor**
      }

      let removeConflicts = (toKeepArr, allConflicts) => { //toKeepArr should be single elt
        //console.log(`fixMultiConflicts::removeConflicts with toKeep=${toKeepArr.length} out of total:${allConflicts.length}`)

        let extraO = []  //arr?
        allConflicts.forEach((value, valueAgain, set) => {
          //console.log(`removeConflicts..checking`,value.id) //valueAgain
          if (toKeepArr.find(item => item.id == value.id)){
            if (value.id == toAdd.id){
              console.log(`fixMultiConflicts::removeConflicts:inKeep toAdd at >`+targetStart.time,value.id, value?.title.trim(),value?.time)
              if (from == 'onDrop'){//nothing for onDrop as already in schedule...
                console.log(`removeConflicts...NOTHING to do as from`+from)
                //continue
              } else {
                let eee = this.addPropsEventsTo(this.currentDate,[{...value,time:targetStart.time}])
                let choice = choices.has(value.id) ? choices.get(value.id) : ''  //bon see...

                //this.addEvtPropsIntoSchedule(eee[0])
                let euhOverlaps = this.overlapCheckEvtsAdd(eee) //use this instead of above to fix extra overlaps
                if(Object.keys(euhOverlaps).length > 0){
                  extraO.push(euhOverlaps) 
                }else{
                  console.log(`fixMultiConflicts::removeConflicts--no other overlap adding`,value?.title.trim())
                  let mes = `${choice} Adding '${value?.title.trim()}' at ${this.whenFrmtTime(targetStart.time)}` //add parent?!? or more info? tbd**
                  this.doNotify(mes, "positive",'top')
                }
              }
            }else { //nothing to do for scheduled
              console.log(`fixMultiConflicts::removeConflicts....Keeping scheduled Evt!!`,targetStart, value.id)
              let mess = `${choices.has(value.id) ? choices.get(value.id) : ''} Keeping scheduled '${value?.title.trim()}'`
              this.doNotify(mess, "positive",'top') //at ${when(targetStart)}
            }
          } else {
            if (value.id != toAdd.id){ //remove scheduled..is it necessary ahubwo?!? meh prolly--toReview**
              console.log(`fixMultiConflicts::removing scheduled...doNotify?`,value.id, value.title,value.time)
              
              if (this.usingMoods[value.id]){ //toTest**
                delete this.usingMoods[value.id]
                console.log(`fixMultiConflicts::removeConflicts>>deleting Moody...`+value.id,this.scheduleMoodsLabel) //update label--toSee**
              }

              this.doRemove(value) //fixMultiConflicts
              //doNotify?!? bof prolly no need...toSee**
            } else {//toAdd Not in those to keep...so nothing to do
              console.log(`fixMultiConflicts::NOT adding original target`,toAdd.id)
            }
          }
        })

        if(extraO.length > 0) {//shouldnt be more than one... toTest**
          console.log(`${from}> fixMultiConflicts::removeConflict:: OVERLAPS again=${extraO.length}`,extraO)
          this.doNotify("More Overlaps to fix!!!", "warning",'top')
          return this.fixyOverlaps(extraO[0],override,from+'nah') //fixMultiConflicts
        }

        let f = this.updateCurrentSchedule()
        if (f.size > 0){
          console.log('fixMultiConflicts::removeConflicts::SAMESTART', f)
          this.fixSameStart(f) //fixMultiConflicts
        }
      }

      const forceAdd = (evt,timey) => {

        console.log(`At ${timey.date}:${timey.time} forceAdding:${evt.id} ${evt.title} from ${evt.time} >>`+from,JSON.parse(JSON.stringify(toAdd)),allEvts.length,allEvts[allEvts.length-1])
        
        //toSee as first > allEvts[0] is toAdd anyway
        //mais bon using overlapCheckEvtsAdd() is prolly better...toTest**
        //this.recurChangeTime(allEvts[allEvts.length-1].id,evt,timey, true, true) //skipAsk user as should force!
        
        let addy = this.addPropsEventsTo(timey.date,[{...evt,time:timey.time}]) //umm timey.date?!? toSEE**

        let euhOverlaps = this.overlapCheckEvtsAdd(addy)
        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`${from} >fixMultiConflicts::forceAdd:: OVERLAPS again from ${toAdd.length} overlaps =${sizey}`,JSON.parse(JSON.stringify(euhOverlaps)))
          
          this.doNotify(`Extra Overlaps while adding '${addy[0].title.trim()}'`, "warning",'top')
          return this.fixyOverlaps(euhOverlaps,override,from+'nah') //fixMultiConflicts
        }
      }

      let chooseEvt = (conflictEvts) => {
        this.radioChoiceDialog('',
            'Choose the event to schedule',
            conflictEvts.map(mapToLabels),
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
              
              console.log(`chooseEvt::onOk >>${d} >> ${e?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
              return e
            }, 
            null, //onCancel--no need as have to choose!!!
            function(){//onDismiss
              //console.log('chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

              if (toKeep.length > 0 ) { //== conflicts.size te than main dialog!
                console.log('chooseEvt::gon removeConflicts out of total='+conflictEvts.length, JSON.parse(JSON.stringify(toKeep))) //,allConfs
                
                setTimeout(() => {
                  removeConflicts(toKeep,conflictEvts)
                }, 0)
              }
            }
        )
      }
    
    ////add relevant options....
    if (from == 'reloadScore'){
      defaultOpts.unshift({ label:'Resolve by Highest Priority', value: 'opt1', color: 'secondary'})
    } else if (from == 'findSamePrio'){
      defaultOpts.unshift({ label: 'Resolve by Largest Score Interval (low Score)', value: 'opt2'}) //Lowest Score Interval
    } else { //default all!--no force option here! 
      defaultOpts.unshift(
        { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
        { label: 'Resolve by Largest Score Interval (low Score)', value: 'opt2' }, //Lowest Score Interval
      )
    }

    ////////////START ///////////

    for (let aConf of conflicts) {
      console.log("fixMultiConflicts....handling:>",JSON.parse(JSON.stringify(aConf))) //toSee if have >> aConf.direction !== 'surrounding'  //+from,defaultOpts,

      let aScheduled = this.getScheduledEvent(aConf.inConflict)
      if (!aScheduled) {console.log("fixMultiConflicts...ERROR ERROR no evts found!!!",aConf);return}
      
      allEvts.push(aScheduled)

      label += ` '${aScheduled?.title.trim()}',`

      if (!targetStart){
        targetStart = aConf?.targetStart
      } else{
        if (targetStart.time != aConf?.targetStart?.time){console.log("fixMultiConflicts...ERROR Not same targetStart?!?",targetStart,  aConf?.targetStart,aConf.direction); }  //return
      }

      let addin = this.getLocalEvt(aConf.target)
      if (!addin) {console.log("fixMultiConflicts...ERROR ERROR local evt not found!!!",aConf);return} //return?!?

      //if (addin.id != toAdd?.id){//should show at first conflict
      //  console.log("fixMultiConflicts...umm Not same ID?!?", addin, toAdd)
      //}
      
      toAdd = addin  //hopefully no overwrite...

      //add force to schedule all evts...crude way of checking defaultOpts mais bon...
      if (aConf.direction !== 'surrounding' && defaultOpts.length < 3){ 
        defaultOpts.push({ label: `Force in '${toAdd.title.trim()}'`, value: 'opt4' })  //at ${aConf?.targetStart?.time}${when(aConf?.targetStart?.time)} ?
      }
    }
    

    let mess =  `'${toAdd?.title.trim()}' conflicts with scheduled ${label} \n
      Choose how to solve this...`
    
    allEvts.unshift(toAdd) //just for completeness..

    this.radioChoiceDialog('Overlap warning!!',
      mess,
      defaultOpts,
      '', //no selection at first..
      function(opt){ //onOk
        if(opt == 'opt3'){ //choose by Event
          chooseEvt(allEvts)
          //return ? //nothing?  //a//JSON.parse(JSON.stringify(a))
        } else if (opt =='opt2'){
          let a = highestScoreInterval(allEvts)
          console.log('fixMultiConflicts::ByScore',a.id,a?.title.trim(), a.score) //,a.details //JSON.parse(JSON.stringify(toKeep))
          toKeep.push(a)
          choices.set(a.id,`By largest score interval (${a.score}),`)
        } else if (opt =='opt1'){
          let a = findhighestPrio(allEvts)  //should return prio found for a notify mayhaps!!
          console.log('fixMultiConflicts::ByPriority',a.id,a?.title.trim()) //, a.score,a.details,//JSON.parse(JSON.stringify(cIDs)),JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(toKeep)))
          toKeep.push(a)
          //choices.set(a.id,"By highest priority,")
        } else { //opt4 > forceAdd
          console.log('fixMultiConflicts::forceAdd...')
          forceAdd(toAdd,targetStart) //bon just force that one!
        }
      },
      null,//onCancel...null so that it's false for cancel btn! Cancel SHould keep scheduled!! --todo** //function(){},  >>
      function(){ //onDismiss.
        if (toKeep.length > 0) { //== conflicts.size
          console.log('fixMultiConflicts::MAIN gon removeConflicts from total='+allEvts.length,JSON.parse(JSON.stringify(toKeep)))
            
          setTimeout(() => {
            removeConflicts(toKeep,allEvts) 
          }, 0)
            
        }//else{}//no need mais bon in case did forceAdd? 
      }
    )
  },
  //walk through conflictsin *Already scheduledEvts and using SameStart times*(Beware!!)
  //resolve by priority evts or interval score or choosing evt
  fixSameStart(conflicts){
    
    //console.log("fixSameStart...Start", conflicts,conflicts.size) //, JSON.parse(JSON.stringify(conflicts))
      
      const findhighestPrio = allEvts => {
        let highest = 0
        let toRet = null
        
        for (let evt of allEvts) {
          let one = this.getScheduledEvent(evt)
          if (one){
            let prt = this.parentGoalsMap().get(one.parentGoal)
            if (prt){
              if (prt.priority > highest){ //umm what happens when no priority? **toTest**
                highest = prt.priority
                toRet = one
              }
            }else{console.log('findhighestPrio..ERROR no PARENT found?',one)}
          }else{console.log('findhighestPrio..ERROR EVT not found?',evt)}
        }
        //console.log('fixSameStart::findhighestPrio...',toRet?.title.trim(), highest) //allEvts
        choices.set(toRet.id,`By highest priority (${highest}),`)
        return toRet
      }
      
      const mapToLabels = anEvt => {
        let prt = this.parentGoalsMap().get(anEvt.parentGoal)
        return { label: `Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) for ${anEvt?.duration} mins`, value: anEvt.id }// color: 'secondary' 
      }

    let toKeep = [] //to keep...removing all other conflicts in the end!
    let allConfs = new Set() // for keeping all unique conflicts...
    let choices = new Map() //ummm
    let mainOpts = [
      { label: 'Resolve by Highest Priority', value: 'opt1', color: 'secondary' },
      { label: 'Resolve by Largest Score Interval (low Score)', value: 'opt2' }, //score that is low...//add for lowest score interval?!? toSee**
      { label: 'Pick event', value: 'opt3' }
    ]
    
    
    for (let conflict of conflicts) {
      //let pick = null //see if better than picks[]
      let cIDs = this.retrieveSameStart(conflict.at)
      console.log("fixSameStart:conflict", JSON.parse(JSON.stringify(conflict)),JSON.parse(JSON.stringify(cIDs)) )
      
      let conflictEvts = [] 
      let label = ""

      //so for each conflict, dialog to choose how to resolve this...
      for (let id of cIDs) {
        let one = this.getScheduledEvent(id)
        if (one){
          conflictEvts.push(one)
          label += ` '${one?.title.trim()}',`
          allConfs.has(one) ? console.log(`Set already contain ${one.id}~${one.title}..skipping`) : allConfs.add(one)
        }else{console.log("fixSameStart...ERROR not found?", id)}
      }

        let onOk = (opt) => {
          //console.log('onOk::Chosen Manually', opt)
          let one = this.getScheduledEvent(opt)
          if(one){
            toKeep.push(one)
            choices.set(one.id,"By pick,")
            return one
          } else { //redundant...mais bon!
            console.log('fixSameStart::onOk:: ERROR ERROR?!?! Not found', opt)  //can get here?!?! DEF NOT as sameStart imply being scheduled already
            one = this.getLocalEvt(opt)
            if(one){
              //pick = one 
              toKeep.push(one)
              choices.set(one.id,"By pick,")
              return one
            }else{console.log('fixSameStart::onOk:: ERROR ERROR..still not found!!!',opt);return false }
          } 
        }

        let highestScoreInterval = () => {
          let lowScore = 0
          let current = null
          for (let e of conflictEvts) { //no need to pass conflictEvts?!?
            let daScore = this.parseScore(e.score)
            if(daScore > -1 && daScore >= lowScore) {
              lowScore = daScore
              current = e
            }
          }
          
          if (current){
            console.log('fixSameStart::highestScore', current.id,current?.title.trim(),current.score)
            toKeep.push(current)
            choices.set(current.id,`By largest score interval (${current.score}),`)
            return current
          } else{
            console.log('ERROR ERROR fixSameStart::highestScore..nothing set?',lowScore, e)//return default? toSee**
          } 
        }

        //is having this lambda in the loop also seem better?(to deal with multi dialogs..)
        //--toTest*** with multiple conflicts and see if put outside would make waiting for dialog worse)
        let chooseEvt = () => {
          this.radioChoiceDialog('',
            'Choose the event to schedule',
            conflictEvts.map(mapToLabels), //no need to pass conflictEvts?!? confirm dont use current loop's var!!
            '',
            function(d){
              let eee = onOk(d)
              //toKeep.push(eee)  //no need to push as already done in onOk...wait for return?!?
              console.log(`fixSameStart--chooseEvt::onOk >>${d} >> ${eee?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
              return eee
            }, 
            null,
            function(){//onDismiss
              //console.log('fixSameStart--chooseEvt::onDismiss...PICK>>',toKeep.length) //JSON.parse(JSON.stringify(toKeep)),toRemove //pick.id,pick?.title.trim(),pick?.details

              if (toKeep.length == conflicts.size) { //so last conflict...usually inner dialog has up to date than main dialog!
                console.log('fixSameStart--chooseEvt::onDismiss...PICKLAST'+toKeep.length, toKeep) //,allConfs
                
                setTimeout(() => {
                  removeConflicts(toKeep,allConfs)
                  //console.log(`fixSameStart::setTimeout::chooseEvt::DONE`,toKeep.length)
                }, 0)
              }
            }
          )
        }

        let removeConflicts = (toKeepArr, allConflicts) => {
          allConflicts.forEach((value, valueAgain, set) => {
            //console.log(`removeConflicts..checking`,value.id) //valueAgain
            if (toKeepArr.find(item => item.id == value.id)){
              console.log(`fixSameStart::removeConflicts:KEEEP`,value.id, value?.title.trim())
              let choice = choices.has(value.id) ? choices.get(value.id) : ''  //bon see...
              let mes = `${choice} Keeping '${value?.title.trim()}' at ${this.whenFrmtTime(value?.time)}` //add parent?!? or more info? tbd**
              this.doNotify(mes, "positive",'top') 
              
            }else{
              if (this.usingMoods[value.id]){
                delete this.usingMoods[value.id]
                console.log(`fixSameStart::removeConflicts>>deleting Moody...`+value.id,this.scheduleMoodsLabel) //updates label  //this.usingMoods[value.id])
              }

              this.doRemove(value) //fixSameStart
            }
          })

          //console.log(`removeConflicts:DONE`,toKeepArr.length) //get here after looping above? >>yeee 

          let f = this.updateCurrentSchedule()
          if (f.size > 0){
            console.log('fixSameStart::removeConflicts::SAMESTART', f)
            this.fixSameStart(f) //fixSameStart
          }
            
          this.disableSaveSchedule = false //enable save schedule
        }

      let mess = `${label} scheduled at same ${this.whenFrmtTime(conflict.at)}.\n
      Choose how to solve this...`

      this.radioChoiceDialog('Same start time!!',
        mess,
        mainOpts,
        'opt1', 
        function(opt){ //onOk
          if(opt == 'opt3'){
            //choice = "By pick," 
            chooseEvt()
          } else if (opt =='opt2'){
            //choice = "By score interval,"
            return highestScoreInterval()
          } else {
            //choice = "By highest priority,"
            let a = findhighestPrio(cIDs)
            //console.log('fixSameStart::opt1',a.id,a?.title.trim(), a.score) //JSON.parse(JSON.stringify(cIDs)),JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(toKeep)))
            toKeep.push(a) //only case that pushes here as already pushed in other cases..should make consistent--todo***
          }
        },
        null,//onCancel...null so that it's false for cancel btn!
        function(){ //onDismiss.
          if (toKeep.length == conflicts.size) {
            console.log('fixSameStart::onDismiss Main with size='+toKeep.length,'conflicts='+allConfs.size) //JSON.parse(JSON.stringify(toKeep))
            
            setTimeout(() => {
              removeConflicts(toKeep,allConfs)
              //console.log(`fixSameStart::setTimeout::MAIN::DONE`,toKeep.length)       
            }, 0)
     
          }
        }
      )
     
    }

    return true //should return false in error? tbd** >>even return?!?
  },
  //toShow Def btn when has some Dfts not scheduled-
  showDefaultBtn(inPast){
    
    //let someDefs = this.allEvents.filter(evt => !this.scheduledEvents.find(x => evt?.inDefaults && x.id == evt.id))  //def wrong
    //or x.inDefaults and x.id == evt.id ? if evt doesnt have it?

    let unscheduledDefs = this.allEvents.some(evt => evt?.inDefaults && evt?.time != '' && !this.scheduledEvents.find(x => x.id == evt.id))
    // filter out isAlternative too?!?>>meh no need
    
    // console.log(`showDefBtn `,unscheduledDefs) //,JSON.parse(JSON.stringify(this.allEvents))

    this.updateButtons(inPast ? false : unscheduledDefs, inPast ? false : true, inPast ? false : true) //unscheduledDefs ? true : false,
  },
  getEventsForDatey(datey,checkOverlaps){ //checkOverlaps for today only...

      let savedEvtFunc = (key, val) => {
        if ('byMood' in val) {
          //console.log("savedEvtFunc::usingMoods?!?", this.usingMoods, val.byMood)
          this.usingMoods[key] = val.byMood ////.join() ?!? meh done later when getting label
        }

        let ret = {}
        if(val.notes !== void 0){
          //prevent overwrite on update by carrying it around...
          //console.log("savedEvtFunc::NOTES", key, val.notes, val.atScore, this.mobile)
          ret.notes = val.notes
          ret.atScore = val.atScore
        }
        ret.id = parseInt(key)
        ret.duration = val.duration, //30,
        ret.time = val.time //"01:30"
            
        return ret
      }

    let evts = this.getEventsForDate(datey)
        
    if (!evts) {console.log(`ERROR no evts found for today:${datey} ?!?`, evts); return}

    console.log(`getEventsForDate on:${datey} ?!?`, evts)

    let arr = Object.keys(evts).map((key) => savedEvtFunc(key,evts[key]))
    //let arry = Object.entries(evts).map((key) => savedEvtFunc(key[0],key[1])) //works as well but using above.
        
    let toReload = this.addPropsEventsTo(datey, arr)

    console.log(`OverlapCheckLoadToday ${datey} loading:${toReload.length} into current:${this.scheduledEvents.length}`)
    // JSON.parse(JSON.stringify(arr)),JSON.parse(JSON.stringify(toReload)) ) //,JSON.parse(JSON.stringify(toReload)))

    if(checkOverlaps){
      return this.overlapCheckEvtsAdd(toReload) //, onDate
    }

    //past||futur
    this.scheduledEvents = toReload
    //console.log("doLoadNotPresent:scheduled",JSON.parse(JSON.stringify(this.scheduledEvents)))
          
    //let e = this.updateCurrentSchedule()
    return this.updateCurrentSchedule()  //beware!! not same struct as with overlapCheckEvtsAdd() 

  },
  
  loadForDate(onDate, hasSavedEvents, inPast){
    // reset maps first...
    this.scheduledEvents = []
    this.usingMoods = {}  //ref(null)
    this.updateCurrentSchedule()
      
    if(hasSavedEvents) {
      if (this.isViewingToday()){ //present

        let euhOverlaps = this.getEventsForDatey(onDate,true) //oldie>>OverlapCheckLoadToday()
         
        if(Object.keys(euhOverlaps).length  > 0) {
          console.log('Overlaps toHandle >>',JSON.parse(JSON.stringify(euhOverlaps)))
          //also it might get re-ordered as keys be int?!? >>yup does!! smh
          
          Object.keys(euhOverlaps).length > 0  ?
          this.doNotify(`${onDate} with Some overlaps to fix!`, "warning",'bottom') :
          this.doNotify(`Loaded schedule for ${onDate}`, "positive",'bottom')

          this.fixyOverlaps(euhOverlaps) //loadForDate
          
          this.showReloadBtn = hasSavedEvents
          this.showClearBtn = hasSavedEvents
          this.disableSaveSchedule = false

          this.evtStartedOrPassed(parseDate(new Date()))

          this.showDefaultBtn(inPast)
        
          return
        }

        this.doNotify(`Loaded schedule for ${onDate}`, "positive",'bottom')

        this.evtStartedOrPassed(parseDate(new Date()))
        this.disableSaveSchedule = true
        this.showReloadBtn = false
        this.showClearBtn = ! hasSavedEvents

        //this.showDefaultBtn(hasSavedEvents,inPast)
        //return //needed if skip default reload btns below...but showshowDefaultBtnDefBtn() replacing...
         
      } else { //past || future
        let sameStart = this.getEventsForDatey(onDate,false) //oldie>>doLoadNotPresent()
        
        if (sameStart.size > 0 && !inPast){//review overlaps in futur only
          console.log(`doLoadNotPresent..SAMESTART inPast?${inPast} on ${onDate}`,sameStart.size) //JSON.parse(JSON.stringify(e))
          this.doNotify(`${onDate} with conflicts to fix!`, "warning",'bottom')  //${inPast ? 'past': 'future'}: 

          this.fixSameStart(sameStart)  //loadForDate
            
        } else {         
          this.showReloadBtn = false
          this.disableSaveSchedule = true
          this.doNotify(`Loaded schedule for ${inPast ? 'past': 'future'}:: ${onDate}`, "positive",'bottom')
        }

      
        this.allowScoreEdit(inPast) // enable scoreEdit...disable score edit in future!!
        
        //set the showReloadBtn && default btn(hidden)
        //this.showReloadBtn = hasSavedEvents
        this.showClearBtn = !inPast //dont show in past!
      }
    } else { // No SavedEvents
      this.showReloadBtn = false //prolly for clearing when viewing diff days?!? tbd
      this.showClearBtn = false
      this.disableSaveSchedule = true
    }
   
    if(inPast || onDate !== today()) { //adjustTime for past && futur 
      //console.log("adjusting time for past/future", onDate,this.scheduledEvents.length)
      this.adjustCurrentTime()
    }

    //console.log(`...got here too fast? ${hasSavedEvents} >> inPast:${inPast}`) 
    this.reset() //loadForDate

    this.showDefaultBtn(inPast)
  },
  reset() { //reset variable for next use 
    this.draggedItem = null
    this.targetDrop = null
    this.touchedItem = null 
    //
    this.chosenScore = null
    this.chosenPrio = null

    this.possibleRange = null //enable after test**
  },
  deepCopy(obj){ //deep copy object
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item));
    }

    const copied = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        copied[key] = this.deepCopy(obj[key]);
      }
    }

    return copied;
  },
  /////////////////////////////// EVENT HANDLERS //////////////////////////
  onRefresh(done) {  //test to drag for refresh
      setTimeout(() => {
        //oldie >> this.fetchScheduledEvents(this.currentDate) //this.loadSavedEvents(this.currentDate) //, false
        this.scheduledEvents = []
        this.updateCurrentSchedule()
        this.resetGoalEvts(true)
       
        this.loadForDate(this.currentDate,this.hasEventsForDate,this.isViewingPast())
        
        done()
      }, 1000)
  },
  //save the current schedule into localStorage
  doSaveSchedule() {
    let toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
    
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

     return
  },
  addParentGoal(title, details,color = "red-14", priority = 2){ //default color and priority 
    //let currentColors = {} //or array?!?
    let currentArr = []

    //to select random color..
    this.parentGoalsMap().forEach( (value, key, map) => { //extract already taken colors
      let bC = value.bgcolor
      //console.log(`bgcolor:${bC}`, key)
      //currentColors[bC] = key  //no need for key...could do >>currentColors[bC] = true ?!?  
      currentArr.push(bC) //OR even push in an array...
    })

    let AllColors = pGColors()

    let sizey = currentArr.length //Object.keys(currentColors).length >> //if (sizey > 1){
  
    if(sizey > 1){
      //while (currentArr.some(item => !pGColors.find(c => c == item))) {? //>>dont make sense as pGColors is superset!! 

      //choose random index of new color..from all those not already taken
      let i = sizey //oldie >>no clue how it didnt fail yet lool >> sizey + 1
      while (currentArr.some(clr => AllColors[i] == clr)) { //while index is found in current colors...have a new index... expensive??!? toSee...
        console.log("addParentGoal::index with taken color...new random",i,AllColors[i])
        i = Math.floor(Math.random() * sizey)
      }

      let newy = AllColors[i]

      //console.log(`bgcolor..NEW:`,JSON.parse(JSON.stringify(newy)),JSON.parse(JSON.stringify(newC)))
      //console.log(`addParentGoal::bgcolor..index ${i} from ${color} to: `,newy)  
      color = newy ? newy : color
    }

    return this.store.addMainGoal(title, details, color, priority)
        
  },
  onAddHocEvent(goalTitle, parentGoal, own, interval){
   
    if (!this.possibleRange){
      console.log("umm onAddHocEvent... not a range selection", this.startEndTimes)  //just in case it's single cell selction
      this.possibleRange = this.startEndTimes
    }
    if (goalTitle.trim() == ""){
      this.doNotify("Empty Goal title...")
      this.addEventDialog = false
      this.reset() //AddHocEvent
      return
    }

    this.addEventDialog = false //close dialog

    let timeStart = parseTimestamp(this.possibleRange[0])
    //let tosee = parsed(this.possibleRange[0])
    let timeEnd = interval > 15 ? addToDate(timeStart, { minute: parseInt(interval)}) : addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15}) 
    //oldie >> 15 mins for when single timeslot selection

    //below redundant when set the interval...smh
    let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

    console.log(`onAddHocEvent:${goalTitle} :${own}: from ${timeStart.time} till ${timeEnd.time}.Duration:${duration}`,interval)
    
    let subID = null 
    if(own == "self"){ //add it as self >> create parent goal with this as subgoal
      let pId = this.addParentGoal(goalTitle, goalTitle, "purple-10", 2) //oldie >>this.store.addMainGoal(goalTitle, "", "purple-10", 2)  //default color and priority
      if (pId) {
        //console.log("SELF parent Goal created",pId)
        subID = this.store.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) //canMove and notInDefaults. isAlternative when duration<30
      } else {
        console.log("ERROR? no pID", pId)//return? or just add it? could be for first first parentGoal---toTest**
      }
    } else { //just add it to Misc parentGoal(that have all one-off kind of stuff)
      if (parentGoal){//add it to parentGoal
        console.log("with parentGoal "+parentGoal.id,parentGoal?.title)
        subID = this.store.addSubGoal(parentGoal.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30) 
        //!canMove and notInDefaults. isAlternative when duration<30

      } else { //any Misc parentGoal available?
        let pMisc = this.store.getGoalByTitle("Misc")
        if(!pMisc){
          let iD = this.addParentGoal("Misc", "Miscellaneous", "grey-10", 2)
          if (iD) {
            console.log("NEW Misc pGoal created",iD)
            subID = this.store.addSubGoal(iD,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) 
            //canMove and notInDefaults.isAlternative when duration<30
          }
        } else{
          console.log("Woo!! Misc pGoal already exists!", pMisc.id) //
          subID = this.store.addSubGoal(pMisc.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30)
          //!canMove and notInDefaults.isAlternative when duration<30
        }
      }
    }

    if (subID) {
      this.resetGoalEvts(true) //update from storage....

      //let euhOverlaps = this.overlapCheckEvtsAdd(toAdd) //meh nah

      let isClose = this.tooClose(timeStart, duration)
      if(isClose){ 
        console.log("onAddHocEvent::tooClose check FAIL!!",isClose) // check actually helps when checking overlaps below as get wrong conflicts!! 
        isClose === true ? this.doNotify(`'${goalTitle}' created But Not added as over midnight!`) : this.doNotify(`'${goalTitle}' created But Not added as too close to a scheduled Evt!!`)
        
        this.addEventDialog = false //needed still with closingDialog?!? >> yep as reverts to default choice dialog...
        //this.reset() //no need 
        return
      }

      let oOth = this.hasOverlappingEvent(subID, timeStart, duration)
      
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
        this.fixyOverlaps(euhOverlaps,null,'addNew') //adHocEvent
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

      this.constructTree() //update to show newest

      //bon toReview if shouldnt save immediately but give choice to user to add some more!!---could pass in flag above to autoSave on dismiss(when inPast!!)--same here!!
      //this.doSaveSchedule()

    } else{
      console.log("BOO ERROR no subID:(",subID)
      this.doNotify("Error creating and adding this event :(", "negative")
    }

    //this.addEventDialog = false  //still have to close dialog
    //this.reset()
  },
  tooClose(timey, duration){ //too close to other evt--within 10min OR near end of day and would go into next...

    let compareTime = addToDate(timey,{ minute: 0})
    let tTime = this.getTimeNumber(compareTime)
    
    //could add duration to get endTime prolly...if needed.
    //let midnight = new Date() //issue when in future as would use current day's
    //let midnighty =new Date(timey.date) //meh midnight of day..not helpful
    let e = addToDate(timey, { day: 1}) //this proper to use next day's
    let midnightiey = new Date(e.date)
    //midnight.setDate() //? >>nah
    //midnight.setHours( 24 )
    //midnight.setMinutes( 0 )
    //midnight.setSeconds( 0 )
    //midnight.setMilliseconds( 0 )

    //midnighty.setHours( 24 )
    //midnighty.setMinutes( 0 )
    //midnighty.setSeconds( 0 )
    //midnighty.setMilliseconds( 0 )

    midnightiey.setHours( 24 )
    midnightiey.setMinutes( 0 )
    midnightiey.setSeconds( 0 )
    midnightiey.setMilliseconds( 0 )
    
    let middy = parseDate(midnightiey)
    
    let isClose = Math.floor((diffTimestamp(compareTime,middy)/1000)/60)  //minutes till midnight
    
    if (isClose < duration) {//so when isClose < duration, then would bleed into next day!!--Dont allow!!!
      console.log("tooClose to midnight eh...:(",isClose) // e, midnightiey
      return true 
    }
     //diffTimestamp(now,endTime) //endTimes < now would be that evt hasnt ended! 
    let toRet = false

    //check scheduled higher than timey BUT very close..
    this.dailyScheduled.forEach((value, key, map)=> {
      let eStart = this.getTimeNumber(value.start)
      //let eEnd = this.getTimeNumber(value.end) //no need 
      //let hasEnded = tTime >= eEnd
      let diff = eStart - tTime
      let another = diffTimestamp(compareTime,value.start) //,true flag to discard earlier evts!!! //using timey is same!
      let bo = Math.floor((another/1000)/60)

      if (bo <= 10 && diff > 0){ //have to use duration to discard those in past? >>nah could just check negative!!
        //console.log("tooClose...:("+key,diff,another,bo)
        toRet = key  //meh overwrites but oh well!
      }
    })

    return toRet
  },
  //skipAsk flag for force schedule
  //useBalance flag for updating what is owed!
  onPickEvent(addE,skipAsk,useBalance) { 
    
    this.addEventDialog = false

    if(!addE){
      console.log("onPickEvent...ERROR nothing!", addE, skipAsk,useBalance)
      this.doNotify("No Goal selected...")
      this.reset() //onPickEvent
      return 
    }

      let saveSchedule = () => {
        let inPast = this.isViewingPast()
        if (inPast) {
          console.log("onPickEvent...inPast auto saveSchedule")
          this.doSaveSchedule() //onPickEvent
          this.disableSaveSchedule = true
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
            this.doSaveSchedule()  //onPickEvent
            this.disableSaveSchedule = true
          }//else{console.log("onPickEvent::saveSchedule...not using balance or doSaveSchedule...i guess!")}
        }else {
          console.log("onPickEvent::saveSchedule...no overlaps so no auto-save!!",overlapSizey,useBalance)
          //balance already handled before when no overlaps!! 
          this.disableSaveSchedule = false
        }
      }
   
    //let addy = this.getScheduledEvent(addE.id) //redundant

    let addy = null
    //console.log("onPickEvent...I be picking...no need to getScheduledEvent?", JSON.parse(JSON.stringify(addE)), addy, skipAsk,useBalance)

    let overlapSizey = 0 //to know if had overlaps...for timeout

    if (!addy){

      addy = addE
      
      let doForce = this.isViewingPast() ? true : skipAsk //inPast >>just force!!

      console.log(`onPickEvent::(${addy.id})'${addy.title.trim()}' from ${addy.time} to ${this.targetDrop.timestamp.time} with force?${skipAsk} BUT Forcing?:${doForce}`)

      let isClose = this.tooClose(this.targetDrop.timestamp, addy.duration)//could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt** 
      if(isClose){
        console.log("onPickEvent::tooClose check FAIL!",isClose) // check actually helps when checking overlaps below as get wrong conflicts!! 
        if(isClose === true){
          this.doNotify("Picking event TOO close to midnight!")
          this.reset() //onPickEvent
          return
        }

        if(doForce){ 
          this.doNotify(`'${addy.title.trim()}' TOO close to a scheduled Evt Buuut..FORCING!`)
        } else{
          this.doNotify(`'${addy.title.trim()}' Not added as TOO close to a scheduled Evt`)
          this.reset() ////onPickEvent
          return 
        }
      }
      
      let anyOverlap = this.hasOverlappingEvent(addy.id, this.targetDrop.timestamp, addy.duration)
      //let sizey = anyOverlap.length
      overlapSizey = anyOverlap.length
      if(overlapSizey > 0) {
        
        //console.log(`onPickEvent::overlaps!!!`,JSON.parse(JSON.stringify(anyOverlap)))
        //let i = 0
        //do {
            //this.recurChangeTime(anyOverlap[i].inConflict,addy, this.targetDrop.timestamp,doForce, true) //anyOverlap[i].direction=='haut', 
        //} while (++i < sizey)

        //bon see about using fixyOverlaps() for consistency with addingNewEvent
        //PROBLEM though is losing the other params like force flag and doAdd...
        //>>so far no problems and seem better actually!...toMonitor**
        let euhOverlaps={}

        for(let i = 0; i < overlapSizey; i++){
          let toH = anyOverlap[i]
          if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
          // >>shouldnt have more than one?!? toTest or see below**
          if(i > 0){//for using fixMultiConflicts()
            //keep in mind the obj.id is target
            
            console.log(i+" WOAH WOAH,onPickEvent.. multiple overlaps with same target?",anyOverlap[i].target)//>could have multiple default that are overlapping yes!
            //ummm this where using inConflict is wrong as evt CAN overlap with two others....
            if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
            if (anyOverlap[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",anyOverlap[i-1].inConflict); delete euhOverlaps[anyOverlap[i-1].inConflict] }

            if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
              
            euhOverlaps[toH.target].unshift(anyOverlap[i-1]) //also add previous as makes sense..
            euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          } 
        }
        
        console.log(`onPickEvent::OVERLAPS of size: ${overlapSizey} and force:${doForce}`,JSON.parse(JSON.stringify(euhOverlaps))) 
        this.fixyOverlaps(euhOverlaps,null,"onPickEvt") //onPickEvt
        
        //toSee if continues below to saveSchedule!!!
      } else {
        //console.log("onPickEvent NO overlaps...to targetDrop!!>force", doForce,"useBalance:"+useBalance)

        //only balance without overlaps for now--
        if (useBalance){
          let balance = this.currentBalance //balance should be negative...methink
          let neB = balance + parseInt(addy?.duration) 

          console.log("onPickEvent...useBalance",balance,neB)
          this.doNotify("oooh What is Owed PAID!gg! >>"+neB,"positive",'center')
          this.store.setBalance(neB)  
        }

        this.changeEvtTime(addy.id, this.targetDrop.timestamp, doForce, true) //onPickEvent
      }
    } else {
      console.log("onPickEvent...NOT NEW?!?ERROR!", addy, addE) //shouldnt get here!!--ToSEE**
      return
    }

    //console.log(`onPickEvent for ${addy.id} complete with force:${skipAsk}`, this.scheduledEvents.length)
    
    //this.disableSaveSchedule = false //done in callback below
    setTimeout(saveSchedule, overlapSizey > 0 ? 5000 : 0); 
    //should invoke after some time for overlaps to allow user choice...

    this.showReloadBtn = this.hasEventsForDate  //when hasSaved evts as could potentially clear schedule!
    this.showClearBtn = !(this.isViewingPast()) //oldie >> true //prolly
    
  },
  //hide the main dialog and show the pickEvent dialog
  closingDialog(){ //should add flag to not actually closeDialog?!? >>no need as using single dialog now!
    //console.log("closingDialog...scheduleDialog") 
    
    this.addEventDialog = false
    this.reset() //just in case...toSee if not too much...
  },
  onEndNow(evtID){
    const now = parseDate(new Date())

    let hasEvts = this.hasEventsForDate //as changes too fast for reloadBtn

   //so just remove the remaining duration of event when completed earlier than expected /so could also remove the event entirely if hasnt started eh
    if(this.dailyScheduled.has(evtID)){
      let evt = this.dailyScheduled.get(evtID)
      let starty = evt.start
      let endy = evt.end

      if (isBetweenDates(now, starty, endy, true)){
        
        let o = this.getTimeNumber(endy) - this.getTimeNumber(starty)  //how this larger?!? should be duration
        let anotherDiff = this.getTimeNumber(now) - this.getTimeNumber(starty) //duration of event with change

        //console.log(`onEndNow::${evtID}`,starty.time,endy.time, anotherDiff,o) //evt

        const doReduce = () =>{
          console.log(`Great, ${evtID} REDUCING duration from ${o} to:`, anotherDiff)
          for(let i = 0; i < this.scheduledEvents.length; i++) {
            let obj = this.scheduledEvents[i]
            if (obj.id === evtID){
              obj.duration = anotherDiff
            }
          }
          this.dailyScheduled.set(evtID, {...evt, for:anotherDiff, end:now})
          
          if(!this.endTimesSet.delete(endy.time)){ //should not happen..prolly
            console.log(`ERROR endTimesSet item does not exist?!?`,evt, this.endTimesSet)
          }

          this.endTimesSet.add(now.time)

          //bon here is better? in case removed
          this.isDisabledScoreEdit[evtID] = false  //bon updating score ...umm seems to fuck it up though?...toSee
    
          this.doSaveSchedule() //onEndNow //yeah just gonna save automatically esti!
          this.disableSaveSchedule = true
          //since enableSave--also show reloadBtn
          
          this.showReloadBtn = hasEvts
          this.showClearBtn = !this.isViewingPast && this.scheduledEvents.length > 0
        }

        const doRemove = () =>{
          console.log(`onEndNow::removing and saving!`)
          this.doRemove(this.getLocalEvt(evtID)) //onEndNow

          this.doSaveSchedule() //onEndNow //yeah just gonna save automatically esti!
        }

        //so when < 10min >>ask for removal
        if (anotherDiff < 10){
          console.log(`onEndNow:: ${anotherDiff} less than 10 mins...REMOVE?`)
          this.confirmAction("Less than 10mins remove?\n Cancel to just EndNow","OK", doRemove, doReduce) 
        }else{
          doReduce()
        }
      }else{
        console.log(`umm aint in the middle of this event! Nothing to do...ERROR?`,now.time, starty.time, endy.time)
      }
    } else {
      console.log(`ERROR doEndNow not found!!!`, evtID)
      return
    }
  },
  onSaveScore(newScore, id,note=''){

    let ev = this.dailyScheduled.get(id) //JSON.parse(JSON.stringify(f)))
    if (ev){
     
      //--should keep historical score change for goal?!? to see progres....toSee**tbd
      let dif = this.parseScore(newScore)
      if (dif < -1) {
        if (dif == -89) {
          console.log(`onSaveScore parsing error`,dif,newScore)
          this.doNotify("Score Parsing Error... YOU FOO! ")
        } else{
          this.doNotify("Score Error: higher# on lower#")
        }
        return
      }
      
      this.doSaveEvtProp(id, null, newScore)   //this.store.saveSubProp(id, null, newVal)

      let h = this.getScheduledEvent(id) //send changes down to child component...
      let oldy = null
      if (h){
        oldy = h.score //to keep track below
        h.score = newScore
      }else{console.log('onSaveScore ERROR not found',h, id) }  //very baaad!
       
      if(note !==''){
        console.log(`onSaveScore::note ${id}from ${oldy} to ${newScore} with note>>`,note)
        ev.score = oldy ? oldy : newScore  //todo...fix buuug!
        ev.notes = note
        this.doSaveSchedule() //onSaveScore
      }

    }else {
      console.log(`ERROR onSaveScore could not find event ${id}?!?`) //this would be baaad! 
    }
  },
  onAddMins(evtID,mins){
    if(this.dailyScheduled.has(evtID)){
      let evt = this.dailyScheduled.get(evtID)
      //let starty = evt.start
      let endy = evt.end

      let newEndy = addToDate(endy,{ minute: parseInt(mins)})
      let newDura = parseInt(mins) + evt.for

      console.log(`onAddMins::${evtID} add ${mins} from ${evt.for} to> ${newDura}`,endy.time,newEndy.time) 

      let anyOverlap =  this.hasOverlappingEvent(evtID, evt.start, newDura)
      if (anyOverlap.length > 0){
        console.log(`onAddMins::huh some OVERLAPS`,anyOverlap) //toTest**
        let euhOverlaps={}

        for(let i = 0; i < anyOverlap.length; i++){
          let toH = anyOverlap[i]
          if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
         
          if(i > 0){//for using fixMultiConflicts()--unlinkely to happen here...toMonitor**
            //keep in mind the obj.id is target
            
            console.log(i+" WOAH WOAH,onAddMins..ERROR?!? multiple overlaps with same target?",anyOverlap[i].target)//>could have multiple default that are overlapping yes!
            //ummm this where using inConflict is wrong as evt CAN overlap with two others....
            if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
            if (anyOverlap[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",anyOverlap[i-1].inConflict); delete euhOverlaps[anyOverlap[i-1].inConflict] }

            if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
              
            euhOverlaps[toH.target].unshift(anyOverlap[i-1]) //also add previous as makes sense..
            euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          } 
        }

        console.log("onAddMins:: OVERLAPS >>",JSON.parse(JSON.stringify(euhOverlaps)))
        this.fixyOverlaps(euhOverlaps,null,'addMins') //addMins
        
      } else {
        
        //console.log(`Great, ${evtID} Ending at:${newEndy.time}`)
        for(let i = 0; i < this.scheduledEvents.length; i++) { //use filter here instead prolly--toImprove
          let obj = this.scheduledEvents[i]
          if (obj.id === evtID){
            obj.duration = newDura
          }
        }
        this.dailyScheduled.set(evtID, {...evt, for:newDura, end:newEndy})
        
        if(!this.endTimesSet.delete(endy.time)){ //make sure as should not happen--toTest**
          console.log(`ERROR endTimesSet item does not exist?!?`,evt, this.endTimesSet)
        }

        this.endTimesSet.add(newEndy.time)

        //save perhaps?! yeah...
        this.doSaveSchedule() //onAddMins
      }

    } else {
      console.log(`ERROR onAddMins EVT not found!!!`, evtID)
      return
    }
  },
  onClearDay(){
    if(this.isViewingPast()){
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
    //prio/score?!?

  },
  onReloadSaved(){ //no need for conflicts >> conflicts = null

    let hasEvents = this.hasEventsForDate 
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

  },
  onMoodAdd(){
    console.log(`onMoodAdd>>>`, this.filterString) //,this.filterResults //this.treeGoals,this.filterString
    //let toAdd = null
    let toAddy = []
    const filt = this.filter.map(e => e.toLowerCase())

    //toAdd = this.treeGoals.map((element) => {
    //  return {...element, children: element.children.length > 0 && element.children.find(u => u?.moods.length > 0 && u?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1))}
    //})
    //toAdd = this.treeGoals.filter(node => node.children.length > 0 && node.children.find(u => u?.moods.length > 0 && u?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1)))
    
    //have to filter again smh >> Could use this.filterResults but issue with proper update when a mood is removed
    //toAdd =
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
    })//.map((element) => {
      //    console.log(`onMoodAdd>>>filtering`, element)
      //    return element  //works here?!? >>nope returns treeNode still smh
      //  })

    //console.log(`onMoodAdd>>>toADD`,toAddy)
    if (toAddy.length > 0){
      toAddy = toAddy.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
      //then add them!!--no need for popup ask esti!!!
      toAddy.length > 0 ? this.scheduleByMood(toAddy) : this.doNotify(`Evts of Mood '${this.filterString}' already scheduled!`, "warning",'top')
    }else {
      this.doNotify(`Nothing to add :(`, "warning",'top')
    }
  },
  scheduleByMood(toAdd){
    let toReload = []
    for(let i = 0; i < toAdd.length; i++){
      
      //this.usingMoods.push(toAdd[i]) //array.push or below?!?>>below seems better?
      
      //this.usingMoods[toAdd[i].id]=toAdd[i]?.mood //>>moved below
      //toReload.push(this.getLocalEvt(toAdd[i].id))

      let local = this.getLocalEvt(toAdd[i].id)
      if (local && local.time != ''){
        toReload.push(local)
        this.usingMoods[toAdd[i].id]=toAdd[i]?.mood  //umm add already here?!? hard to undo in case of overlaps smh---toTest**
      }else { 
        //console.log(`scheduleByMood>>>no time eh >>`+ local?.title) //could be error?!? toMonitor**
        //this.doNotify(`Evts '${local?.title}' has no set time for scheduling, Manually Add them.`, "warning",'top')
        this.withDismissNotify(`Evt '${local?.title}' has no set time for scheduling, Manually Add it!`, "warning",'top',null,
        function(){ //onDismiss....
          console.log(`scheduleByMood>>>no time eh >> `+local?.title) //could be error?!? toMonitor**
        })
      }
    }

    //console.log(`scheduleByMood>>>toReload...`, toReload)

    toReload = this.addPropsEventsTo(this.currentDate, toReload)

    let euhOverlaps = this.overlapCheckEvtsAdd(toReload)

    let sizey = Object.keys(euhOverlaps).length
    if(sizey > 0) {
      //console.log(`scheduleByMood overlaps on:${this.currentDate} from ${toAdd.length} to ${toReload.length}. overlaps =${sizey}`),  
      
      this.fixyOverlaps(euhOverlaps,null,'byMood') //scheduleByMood
    }
    
    this.disableSaveSchedule = !toReload.length > 0 //false
    this.showReloadBtn = toReload.length > 0 && this.hasEventsForDate
    this.showClearBtn = !this.isViewingPast()  //incase have other evts?!?
  },
  unscheduledDefaults(){
    this.resetGoalEvts(true)

    return this.allEvents.filter(evt => evt?.inDefaults && evt?.time != '' && !this.scheduledEvents.find(x => x.id == evt.id))
  },
  removeNoTimes(evts,from){ //dont add evts without any time!
    if (evts.some(x => x.time == '')){
        let title = '' 
        evts = evts.filter(x => {
          if(x.time != ''){
            return x
          }
          title += `'${x?.title}'. `
        })

        //this.doNotify(`Evts ${title} without set time not scheduled, Manually Add them.`, "warning",'top') //defaults
        this.withDismissNotify(`Evts ${title} without set time not scheduled, Manually Add them.`, "warning",'top',null,
          function(){ //onDismiss....
            console.log(`${from}::dismiss >> `, title) //, JSON.parse(JSON.stringify(evts))
        })       
      }
      return evts

  },
  //schedule InDefaults Evts with flag to overwrite/add to schedule 
  scheduleDefaults(flag){

    let dEvts = this.deepCopy(this.store.fetchDefaults()) //resets reference >>does!
    let e = this.unscheduledDefaults()
    console.log('unscheduledDefaults', e) //e?.length
    //console.log(`InDefault:${this.currentDate}`,dEvts)

    let inPast = this.isViewingPast()

    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = !inPast && dEvts.length > 0

    if(this.isViewingToday()){ //Overlap check for today only...

      let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
  
      if(flag == 'add'){  //here should use the e var instead --todo**
        let orig = toReload.length
        toReload = toReload.filter(x => x?.inDefaults && !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled no need for >> x?.time != '' as done below 
        console.log(`scheduleDefaults..ADDIN from ${orig} to ${toReload.length}`) //toReload
      } else { //overwrite flag to reset first!
        this.scheduledEvents = []
        this.updateCurrentSchedule()
      }

      toReload = this.removeNoTimes(toReload,"scheduleDefaults")

      console.log(`scheduleDefaults:${this.currentDate} with '${flag}'`,toReload.length,this.scheduledEvents.length) //JSON.parse(JSON.stringify(toReload))
      
      let euhOverlaps = this.overlapCheckEvtsAdd(toReload) //no need for date prolly  //this.currentDate

      let sizey = Object.keys(euhOverlaps).length
      if(sizey > 0) {
        console.log(`scheduleDefaults overlaps on:${this.currentDate} from ${dEvts.length} to ${toReload.length}. overlaps =${sizey}`),  
        
        this.fixyOverlaps(euhOverlaps,null,'byDefaults') //scheduleDefaults
      }

      //let m = 
      this.evtStartedOrPassed(parseDate(new Date())) //does return too fast...

      //console.log(`scheduleDefaults:Today scheduling DONE with overlaps:`+sizey,m)
      this.showDefaultBtn(inPast) 
      this.disableSaveSchedule = !(toReload.length > 0) //false
      
      return
      
    } else { //No Overlap check for past/future
        let toReload = this.addPropsEventsTo(this.currentDate, dEvts)

        toReload = this.removeNoTimes(toReload,"scheduleDefaults")

        if(flag == 'add'){//still check for add flag in future...also should use the e var instead --todo**
          let orig = toReload.length
          toReload = toReload.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
          console.log(`scheduleDefaults..ADDIN to ${this.currentDate} of ${this.scheduledEvents.length} from ${orig} to `,toReload.length)
          let f = this.scheduledEvents.concat(toReload)
          this.scheduledEvents = f
        }else{
          this.scheduledEvents = toReload
        }
      
      let sameStart = this.updateCurrentSchedule()
      if (sameStart.size > 0){
        console.log('scheduleDefaults..sameStart='+sameStart.size)
        //this.fixSameStart(sameStart) //could solve conflicts but should let them be fixed on reload...weird but makes sense in case schedule not saved anyway!
      }

      inPast ? this.allowScoreEdit(true) : this.allowScoreEdit(false)
    }

    this.showDefaultBtn(inPast)

    this.disableSaveSchedule = !(dEvts.length > 0) //false
    //this.reset() //nah in case have other settings like onScore/Prio.

  },
  onLoadDefault(){
      let doCancel = () => {
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
      }
  },
  onChoosenPrio(e){
    //console.log('choosePrio',e,this.chosenPrio)
    let oldy = this.chosenPrio
    if (oldy && oldy == e){
      this.disablePrioBtn = true //.user should not reclick without changing it again...
    }else {
      this.chosenPrio = e
      this.disablePrioBtn = false
    }
  },
  onChoosenScore(e){
    //console.log('chooseScore',e)
    let oldy = this.chosenScore
    if (oldy && oldy == e){
      this.disableScoreBtn = true //user should not reclick without changing it again...
    }else {
      this.chosenScore = e
      this.disableScoreBtn = false
    }
  },
  //one subG of each parentG
  scheduleOneEach(choice){
    let allEvts = this.deepCopy(this.storedSubGoals)

    let notScheduled = allEvts.filter(x => !this.scheduledEvents.find(item => item.id == x.id))
    //console.log('scheduleOneEach..notScheduled!!',notScheduled)

      const subGoalsOfParent =(id) => {
        return allEvts.filter(evt => evt.parentGoal == id)
      }

      const selectOneFromP = (useRandom) => {
        //implicit that useRandom == overwrite
        //flag to check if already scheduled? or implicit above?
        let toAdd =[]
        this.parentGoalsMap().forEach((value, key, map) => {
          let subs = subGoalsOfParent(value.id)
          //console.log("selectOneFromP::subs of "+value.id,value.title,subs.length)
          if (subs.length > 0){
            let gottaAdd = null
            let i = subs.length
            if(useRandom) {
              gottaAdd = subs[Math.floor(Math.random() * i)] 
              //console.log("selectOneFromP::gottaAdd Random at index: "+i,subs.length, ) //gottaAdd
            }else { //add one that aint scheduled already!!
              //oldie >> subs[0] >> take first one...could be scheduled so check below...
              let tries = 0 //in case no infinite loop for one elt or something....prolly
              while (this.scheduledEvents.some(e => subs[i].id == e.id)) {
                tries++
                i = Math.floor(Math.random() * subs.length)
                console.log(`selectOneFromP::index ${i} scheduled...new random> At try> `+tries,subs.length)
                if (tries > 2) {console.log("selectOneFromP::random...TOO MANY TRIES..ERROR?",tries,i,subs.length, subs); break}
              }

              gottaAdd = subs[i] 
              console.log("selectOneFromP::NO Random at index: "+i,tries, gottaAdd)
            }

            toAdd.push(gottaAdd) //add check for null? >>prolly no need--toMonitor**
          }else {
            console.log(`scheduleOneEach::selectOneFromP...huh no subgoals for parentGoal`,value)
          }
        })
        
        return toAdd
      }

    ///////START/////////

      let isTod = this.isViewingToday()
      let toAdd=[]
      
      if(choice == 'add'){
        //now go through each and add subG for parentG
        
        this.parentGoalsMap().forEach((value, key, map) => {
          let c = notScheduled.find(item => item.parentGoal == value.id)
          if (c){
            toAdd.push(c)
          } else{
            //console.log('scheduleOneEach...No goal!!',value?.bgcolor)
            this.useGroupNotify(`No SubGoals for Parent: '${value?.title}'`, value?.bgcolor,'bottom')//for grouping>>'NoG' //doNotify  //"warning"
          }
        })

        //console.log('scheduleOneEach...TOADD!!',toAdd)
        toAdd = this.addPropsEventsTo(this.currentDate, toAdd)
          
        toAdd = this.removeNoTimes(toAdd,"scheduleOneEach")

      } else { //overwrite!
        this.scheduledEvents = []
        this.updateCurrentSchedule()
      
        //random...implicit that overwrite and no need to check 'notScheduled' ...

        toAdd = selectOneFromP(true)
        //console.log('scheduleOneEach...ADD! for> '+choice,toAdd)
        toAdd = this.addPropsEventsTo(this.currentDate, toAdd)
        toAdd = this.removeNoTimes(toAdd,"scheduleOneEach")
      }

      if(isTod){
        let euhOverlaps = this.overlapCheckEvtsAdd(toAdd)
        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`scheduleOneEach:: Overlaps on:${this.currentDate} from ${notScheduled.length} to ${toAdd.length}. overlaps =${sizey}`),  
            
          this.fixyOverlaps(euhOverlaps,null,'oneEach') //scheduleOneEach
        }

      } else { //no overlap check for future.
        let f = choice == 'overwrite' //false isnt better? toSee**...
        //let toReload = selectOneFromP(f) //oldie >> false

        //console.log('scheduleOneEach::scheduleAs..future!!'+choice,f, toReload)
        
        //toReload = this.addPropsEventsTo(this.currentDate, toReload)
        //toReload = removeNoTimes(toReload)

        if(f){ //overwrite....just schedule
          this.scheduledEvents = toAdd
        } else{
          let euh = this.scheduledEvents.concat(toAdd)
          this.scheduledEvents = euh
        }

        let sameStart = this.updateCurrentSchedule()
        console.log('scheduleOneEach....sameStart='+sameStart.size)
        if (sameStart.size > 0 && isTod){
          this.fixSameStart(f) //scheduleOneEach
        }
      }

      this.isViewingPast() ? this.allowScoreEdit(true) : this.allowScoreEdit(false)
      
      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = true
    
  },
  onScheduleOneEach(){

    if (this.scheduledEvents.length > 0) {
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
    }
  },
  scheduleSamePrio(flag){

    const filterCurrent =() => {
      return this.scheduledEvents.filter(evt => this.parentGoalsMap().get(evt.parentGoal)?.priority == this.chosenPrio)
    }

    let toRet = []
    let isTod = this.isViewingToday()

    if(flag == 'overwrite' || flag == 'add'){
      let allEvts = this.deepCopy(this.storedSubGoals)
      //console.log('findSamePrio..overwriting!!',this.chosenPrio,flag) //allEvts
      //console.log(`findSamePrio for ${this.chosenPrio} with flag ${flag}..ALL`, JSON.parse(JSON.stringify(allEvts))) //, typeof colis
      for (let evt of allEvts) {
        let e = this.parentGoalsMap().get(evt.parentGoal)
        if (e?.priority == this.chosenPrio){
          toRet.push(evt)
        }//else{console.log('findSamePrio..skipping',e?.priority)}
      }
        
      if(flag == 'add'){ //just add to schedule
        //let s = this.scheduledEvents.length
        //this.scheduledEvents.push(...toRet)
        // filter out events that are already scheduled..not too expensive?
        toRet =  toRet.filter(x => !this.scheduledEvents.find(item => item.id == x.id))
      } else{ //for overwrite, also reset schedule....
        //e = colis
        this.scheduledEvents = []
        this.updateCurrentSchedule()
      }
      console.log(`scheduleSamePrio...${flag} to size: ${this.scheduledEvents.length} some evts = ${toRet.length}`, ) // JSON.parse(JSON.stringify(toRet))
    } else {
      toRet = filterCurrent()
      console.log('scheduleSamePrio..filtering!!',this.chosenPrio,toRet)
    }

    //console.log(`findSamePrio>'${flag}'::${this.chosenPrio}`, this.currentDate,this.isViewingToday(), toRet)
    
    //conflicts checks for today only
    if (isTod && flag !='filter'){ //this.isViewingToday()
      if (toRet.length < 1) {
        this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
        return 
      }

      toRet = this.addPropsEventsTo(this.currentDate, toRet)
      //console.log(`findSamePrio::addPropsEventsTo for ${flag}`,JSON.parse(JSON.stringify(toRet)),JSON.parse(JSON.stringify(this.scheduledEvents)))

      toRet = this.removeNoTimes(toRet,"scheduleSamePrio")

      let overlaps = this.overlapCheckEvtsAdd(toRet)
      if(Object.keys(overlaps).length > 0){
        console.log(`scheduleSamePrio:${this.chosenPrio}...overlaps`,JSON.parse(JSON.stringify(overlaps)))

        this.fixyOverlaps(overlaps,null,'findSamePrio')

      } else { //no overlapps...
        console.log(`scheduleSamePrio >>No overlaps!!...`,toRet.length)//JSON.parse(JSON.stringify(toRet)))
       
        if(toRet.length < 1){ //nothing added
          this.disableSaveSchedule = true
          this.showReloadBtn = false //nothing to reload...
          this.showClearBtn = false
          return 
        }

        this.updateCurrentSchedule() //doesnt not run too fast?!?
        //let toEnable = this.evtStartedOrPassed(parseDate(new Date()))
        //console.log('onReloadWithPrio:enabledScoreEdit',toEnable)
      }
    } else {//just schedule them!
      //console.log(`findSamePrio...NOT TODAY!?`, this.currentDate)
      if(flag == 'filter'){
        this.scheduledEvents = toRet
      }else {
        toRet = this.addPropsEventsTo(this.currentDate, toRet)

        toRet = this.removeNoTimes(toRet,"scheduleSamePrio")

        if(flag == 'add'){
          let f = this.scheduledEvents.concat(toRet) //diff || [] //beware empty!!
          this.scheduledEvents = f
        }else{ //overwrite
          this.scheduledEvents = toRet
        }
      }

      this.updateCurrentSchedule() // JSON.parse(JSON.stringify(this.scheduledEvents)))
    }
      
    //notify for empty perhaps...
    if (!this.scheduledEvents.length > 0){
      this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
      this.disableSaveSchedule = true  //or should be false?!? if have cleared schedule perhaps...
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = false 
      return
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = true //toSee if shouldnt use >>!this.isViewingPast() 

  },
  doReloadWithPrio(){
    if (this.chosenPrio == null) { //kinda redundant with disable flag...mais bon just in case...
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
  },
  scheduleByScore(flag){
      const filterCurrent = () => {
        let toReload = []
        this.scheduledEvents.forEach((item) => {
          let daScore = this.parseScore(item.score)
          if (daScore > -1 && daScore >= this.chosenScore) {
            toReload.push(item)
          }//else{console.log('ERROR...parseScore?skippin',daScore, item)}
        })
        return toReload
      }

    let e = []
    let isTod = this.isViewingToday()

    if (flag == 'overwrite' || flag == 'add'){
      const colis = this.store.fetchGoalsWithMinScore(this.chosenScore)//deepCopy? no need
      //console.log(`scheduleByScore SCORE`, JSON.parse(JSON.stringify(colis))) //, typeof colis

      if(flag == 'add'){// filter out events that are already scheduled..not too expensive?
        e =  colis.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) 
      } else{ //for overwrite, also reset schedule....
        e = colis
        this.scheduledEvents = []
        this.updateCurrentSchedule()
      }
     
    } else { //filter
      //console.log('filtering by score:',this.chosenScore, flag)
      e = filterCurrent()
      console.log(`scheduleByScore AFTER flag ${flag}`,this.scheduledEvents.length,JSON.parse(JSON.stringify(e))),JSON.parse(JSON.stringify(this.scheduledEvents))
    }
      
    //console.log(`reloadEvtsWithScore>'${flag}' >=${this.chosenScore}`, this.currentDate,this.scheduledEvents.length)  //isTod, e,

    if(isTod && flag !='filter' ){//check conflicts only for today..
      if (e.length < 1) {
        this.doNotify(`Empty for Score >= ${this.chosenScore} :(`, "warning",'bottom')
        return 
      }

      e = this.addPropsEventsTo(this.currentDate, e)

      e = this.removeNoTimes(e,"scheduleByScore")

      console.log(`scheduleByScore::addPropsEventsTo today for '${flag}'`,this.scheduledEvents.length, JSON.parse(JSON.stringify(e))) //,JSON.parse(JSON.stringify(this.scheduledEvents))
      let overlaps = this.overlapCheckEvtsAdd(e)
      //let oOth = this.hasOverlappingEvent(obj.id, startTime, obj.duration) //before add evt
      if(Object.keys(overlaps).length > 0){
        console.log(`scheduleByScore ${this.chosenScore}...overlaps!!`,JSON.parse(JSON.stringify(overlaps)))

        this.fixyOverlaps(overlaps,false,'reloadScore') //false || null for override...
          //Promise.resolve()
          //queueMicrotask(count)

        //return //return instead? umm def not!--for btns below
      } else { //no overlapps...
        console.log(`scheduleByScore >>NO OVERLAPS!!!...`)//, JSON.parse(JSON.stringify(e)))
        if(e.length < 1){ //nothing added
          this.disableSaveSchedule = true
          this.showReloadBtn = false //nothing to reload...
          this.showClearBtn = false
          return 
        }
        
        this.updateCurrentSchedule()
      }
    } else { //just schedule them!
      console.log(`scheduleByScore... with flag '${flag}' on>`, this.currentDate,JSON.parse(JSON.stringify(this.scheduledEvents.length)), JSON.parse(JSON.stringify(e)))
      if(flag == 'filter'){
        this.scheduledEvents = e
      }else {
        e = this.addPropsEventsTo(this.currentDate, e )

        e = this.removeNoTimes(e,"scheduleByScore")

        if(flag == 'add'){
          let f = this.scheduledEvents.concat(e) //diff||[] //works? beware of undefined?!?
          this.scheduledEvents = f
        }else{ //overwrite
          this.scheduledEvents = e
        }
      }
        
      //console.log(`onReloadWithScore scheduliin..`, JSON.parse(JSON.stringify(this.scheduledEvents)))
      this.updateCurrentSchedule()
      //this.allowScoreEdit(false) //disable score edit for future--no need as done during updateCurrentSchedule
    }
    
      //notify for empty perhaps...toTest that doesnt between operations...
    if (!this.scheduledEvents.length > 0){
      this.doNotify(`Empty for Score >= ${this.chosenScore} :(`, "warning",'bottom')
      this.disableSaveSchedule = true  //shouldnt be false?!?
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = false 
      return
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = true

  },
  doReloadWithScore(){
    if (this.chosenScore == null) {
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
  },
  onChange (data) { //runs first after loading/reload > right after beforeMount() and before mounted()

    this.loadForDate(data.start, this.hasEventsForDate,this.isViewingPast())
  },
  onDragStart(e, item) {
    if(this.isViewingPast()){
      this.doNotify("Editing past is no no!")
      e.preventDefault()        
      return
    }
    //keep track of moved
    this.draggedItem = item

    //console.log('onDragStart..goal-item',e, this.draggedItem)
  },
  onDragEnter (e, type, scope) {
    //console.log('insideDragEnter',type,this.mobile,this.isDisabledScoreEdit[this.draggedItem.id]) // e,type,scope
    if(type === 'goal-item'){
      //console.log('onDragEnter..goal-item',e, scope) // scope is undefined here hence saving it below
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
  onDragOver (e, type, scope) { // needed for onDrop but nothing to do and fires A LOT
    //console.log('onDragOver', scope, type)
    e.preventDefault() //to allow drop

    return true
  },
  onDragLeave (e, type, scope) {
    //console.log('onDragLeave', scope, type)
    return false
  },
  onDragEnd (e) {
    //console.log('onDragEnd',e) //check datatransfer for 'none' effect where no drop made

    //console.log('onDragEnd', this.startTimesSet,this.endTimesSet)
  },
  onDrop(e, type, scope) { //other drag functions above need for this to fire >>especially 'onDragOver' above
    //console.log("onDrop", e, type, scope)//JSON.stringify(item)
    let draggy = this.getScheduledEvent(this.draggedItem.id) //bon grab whole event..

    if (!draggy) {console.log("onDrop ERROR", draggy,this.draggedItem ); return}

    let targetTimey = null
    
    //when dragged to head, it would be a whole day event?
    if (type === 'interval') {
      //console.log("onDrop to time-interval", scope.timestamp.time,draggy.title.trim(),draggy.time)
      targetTimey = scope.timestamp
    } else {
      if(type === 'goal-item' && this.targetDrop){ //check targetDrop in case didnt drag much and still in same spot
        //console.log("Dropping goal-item!!", type, this.targetDrop.timestamp) //,e, //scope is undefined here
        targetTimey = this.targetDrop.timestamp
      }else {
        console.log("Cannot drop here YO!!",e, type, scope, this.targetDrop) //shouldnt happen? >>could if dropping too high in header as if going to prev/next day
        return
      }
    }
    
    if (!targetTimey) {console.log("ERROR...no timestamp YO!!",e, type, scope, this.targetDrop); return}

    //console.log("onDrooop:",targetTimey, this.draggedItem)

    this.doDroppy("onDrop",targetTimey, this.draggedItem)

    /*
    //could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt** 
    let isClose = this.tooClose(targetTimey, draggy)
    if(isClose){
      console.log("onDrop::tooClose to>>",isClose) //could happen when dropping next to scheduled...
      if(isClose === true){
        this.doNotify("Dropping event TOO close to midnight!")
        this.reset() //onDrop
        return
      }
    }

    let anyOverlap =  this.hasOverlappingEvent(draggy.id, targetTimey, draggy.duration)
    
    let euhOverlaps={}

    let sizey = anyOverlap.length
    if(sizey > 0) {
      let i = 0
      do {
        if(anyOverlap[i].inConflict == anyOverlap[i].target){
          console.log("EUUUH...self overlap?!?", anyOverlap[i]) 
          break //continue? nope wouldnt move!
        }
        console.log("onDrop...OVERLAP handlin::size="+sizey, anyOverlap[i].direction) //anyOverlap[i], //object
       
        //anyOverlap[i].direction == "surrounding" ? this.fixyOverlaps(anyOverlap, true) : this.recurChangeTime(anyOverlap[i].inConflict, draggy, targetTimey, true)
        //check for 'surrounding' and handle overlap... otherwise should just push the evt(instead of giving options to resolve/choose!) using recurChangeTime()
        //meh better to use fixyOverlaps as cancelling is clearer!

          let toH = anyOverlap[i]
          if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]}


          if(i > 0){// where it's better to use the obj.id as the evt being added!--See fixMultiConflicts()
            //keep in mind the obj.id is target
            
            console.log(i+" WOAH WOAH,onDrop.. multiple overlaps with same target!",anyOverlap[i].target)//>could have multiple default that are overlapping yes!
            //ummm this where using inConflict is wrong as evt CAN overlap with two others....
            if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
            if (anyOverlap[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",anyOverlap[i-1].inConflict); delete euhOverlaps[anyOverlap[i-1].inConflict] }

            if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
            
            euhOverlaps[toH.target].unshift(anyOverlap[i-1]) //also add previous as makes sense..
            euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          } 
       
      } while (++i < sizey)

      console.log("onDrop...OVERLAP with fixOverlap",euhOverlaps)
      this.fixyOverlaps(euhOverlaps, true,'onDrop')  //end of loop for all conflicts!!!

    } else {
      //so no overlapp, just change dragged event time--ask User
      this.changeEvtTime(draggy.id, targetTimey, false) //onDrop
      console.log(`onDrop with No overlap complete (${draggy.id}) to ${targetTimey.time}`)  //worked,

      //e.preventDefault() //needed to allow dialog click?
    }

    this.disableSaveSchedule = false
    this.showReloadBtn = this.hasEventsForDate
    this.showClearBtn = true 

    this.reset() //onDrop
    */
  },
  onTouchStart(e, item){ //touchStart only!!

    if(e.type == "touchstart"){ //fires once!
      
      this.draggedItem = item
      
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

      //let f = target.closest('.my-event')

      if(target.parentNode.classList.contains("my-event")){
          console.log("onTouchStart >>my-event-drag","isDisabledScoreEdit>> "+this.isDisabledScoreEdit[item.id],this.allowDialog[item.id]) //target,,this.mobileEnableScore[item.id]
          target.parentNode.classList.add("my-event-drag") //transform: skew(-20deg)
          this.touchedItem = target //keep track of it to see if gonna move OR touch-hold OR onScore edit OR dblClick for remove

      } else {
        //console.log("onTouchStart:WOOOAH inner touch?",target.parentNode,this.isDisabledScoreEdit[item.id],this.mobileEnableScore[item.id]) 
        //could happen if it's inner elt...so go up
        let f = target.closest('.my-event')
        target = target.parentNode
        if(target.parentNode.classList.contains("my-event")){
          console.log("onTouchStart >>PHEW..FOUND","isDisabledScoreEdit>> "+this.isDisabledScoreEdit[item.id],f) //target,,this.mobileEnableScore[item.id]
          target.parentNode.classList.add("my-event-drag") //transform: skew(-20deg)
          this.touchedItem = target //keep track of it to see if gonna move OR touch-hold OR onScore edit OR dblClick for remove
        }else{
          this.touchedItem = false //flag for later in case clicked on endNow, addMin btns....
          console.log("onTouchStart:ERROR...Btn?",target, target.parentNode) //this.isDisabledScoreEdit[item.id],this.mobileEnableScore[item.id])  
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
  onTouchEvt(e, item){ //touchmove and touchend ...scope is null!!

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

    if (!this.draggedItem){ //should be populated** should return?!? tbd
      console.log("onTouchEvt NULL Item ?!? >> "+e.type,this.draggedItem,this.touchedItem)
      item = this.draggedItem
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

        //let currPosY = e.clientY  //undefined
        //let currPosX = e.clientX  //undefined

        //prolly have to add .top using e.changedTouches[0].clientX ?
        //let style = target.style
        //let touchedS = this.touchedItem.style

         //let ST = style.top  //seems empty
         //let SL = style.left
         //let offy = style.offsetTop  //offsetLeft

         //let rec = target.getBoundingClientRect() //.left
         //let f = this.touchedItem.getBoundingClientRect() //.left
         
         //let tST = touchedS.top //also empty
         //let tSL = touchedS.left
         //let tOffy = touchedS.offsetTop

         //set the element's new position:
          //target.style.position = 'absolute' //places it at end...
          //target.style.zIndex = 1000
        
          //target.style.top = (f.top + rec.top) + "px"
          //target.style.left = (f.left + rec.left) + "px"

          //target.classList.add("touchy-interval")  ////then add border --works but iffy calculations and adding stuff...bof it's good as is!!
        
        //also stop scrolling? >>seems fixed by readding preventDefault in touchStart()
        
        //console.log("onTouchEvt::move >> NEW interval:",this.touchedItem,target,f,rec)//,e.changedTouches[0].clientX,style,touchedS)// 

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
      return
    }

    if(e.type == "touchend"){  
      //same stuff as handHold to check isViewingPast()...toReview**

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
          console.log("onTouchEvt::END >>removing my-event-drag",this.isDisabledScoreEdit[item.id],this.mobileEnableScore[item.id])//target
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
        console.log("onTouchEvt.....EUUH nothing?",this.touchedItem, target) //could happen for those AddMin btns...
        return //continue default handling....
      }
      
      if(target.ariaLabel){
        let s = getTimey(target.ariaLabel)
        console.log("onTouchEvt::END", this.targetDrop, s)//,target,target.parentNode) //target.classList,target.ariaLabel,s

        this.targetDrop = s
        
        this.doDroppy("onTouch",this.targetDrop, this.draggedItem)
      } else {
        console.log("onTouchEvt::END>>ERROR?OVERLAP?",e, target,target.parentNode,this.mobile,this.isDisabledScoreEdit[item.id],this.allowDialog[item.id])
        if(target.classList.contains("title")){
          console.log("onTouchEvt::END--has title!",this.targetDrop)

          this.doDroppy("onTouch",this.targetDrop, this.draggedItem)  //just drop on top to see--ToReview**
        }
      }

      e.preventDefault()
      e.stopPropagation() //needed?@? think so or would trigger other events...prolly...toMonitor***

      return
    }

    console.log("onTouchEvt::UNKNOWN",e) //shouldnt happen!!
    
  },
  doDroppy(from, targetDrop, draggedItem){
    //console.log("doDroppy:",this.targetDrop, this.draggedItem)
    console.log("doDroppy: "+from,targetDrop, draggedItem)

    if(targetDrop && draggedItem){
      let isClose = this.tooClose(targetDrop, draggedItem.duration)
      if(isClose){
        console.log("onDrop::tooClose to>>",isClose) //could happen when dropping next to scheduled...
        if(isClose === true){
          this.doNotify("Dropping event TOO close to midnight!")
          this.reset() //onDrop
          return
        }
      }

    let anyOverlap =  this.hasOverlappingEvent(draggedItem.id, targetDrop, draggedItem.duration)
    
    let euhOverlaps={}

    let sizey = anyOverlap.length

    if(sizey > 0) {
      let i = 0
      do {
        if(anyOverlap[i].inConflict == anyOverlap[i].target){
          console.log("EUUUH...self overlap?!?", anyOverlap[i]) 
          break //continue? nope wouldnt move!
        }
        console.log("doDroppy...OVERLAP handlin::size="+sizey, anyOverlap[i].direction) //anyOverlap[i], //object
       
        //anyOverlap[i].direction == "surrounding" ? this.fixyOverlaps(anyOverlap, true) : this.recurChangeTime(anyOverlap[i].inConflict, draggy, targetTimey, true)
        //check for 'surrounding' and handle overlap... otherwise should just push the evt(instead of giving options to resolve/choose!) using recurChangeTime()
        //meh better to use fixyOverlaps as cancelling is clearer!

          let toH = anyOverlap[i]
          if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]}


          if(i > 0){// where it's better to use the obj.id as the evt being added!--See fixMultiConflicts()
            //keep in mind the obj.id is target
            
            console.log(i+" WOAH WOAH,doDroppy.. multiple overlaps with same target!",anyOverlap[i].target)//>could have multiple default that are overlapping yes!
            //ummm this where using inConflict is wrong as evt CAN overlap with two others....
            if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
            if (anyOverlap[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",anyOverlap[i-1].inConflict); delete euhOverlaps[anyOverlap[i-1].inConflict] }

            if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
            
            euhOverlaps[toH.target].unshift(anyOverlap[i-1]) //also add previous as makes sense..
            euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          } 
       
      } while (++i < sizey)

      console.log("doDroppy...OVERLAP with fixOverlap",euhOverlaps)
      this.fixyOverlaps(euhOverlaps, true,from)//'onDrop')  //end of loop for all conflicts!!!

    } else {
      //so no overlapp, just change dragged event time--ask User
      this.changeEvtTime(draggedItem.id, targetDrop, false) //onDrop
      console.log(`doDroppy with No overlap complete (${draggedItem.id}) to ${targetDrop.time}`)  //worked,
    }

      this.disableSaveSchedule = false
      this.showReloadBtn = this.hasEventsForDate
      this.showClearBtn = true 

      this.reset() //doDroppy

    } else {
      console.log("doDroppy null ERROR?", targetDrop,this.targetDrop, draggedItem, this.draggedItem )
      return
    }
  },
  onTouchHold({ evt, ...newInfo }, item){ //mobile onScore edit...
     
    //IF past >>only edit
    
    //in Present >>if done show onScoreEditDialog ELSE invoke onDblClickEvent()

     //so q.dialog to confirm with user between remove || edit!!
    
    //this.isDisabledScoreEdit[item.id] = true //oldie that toggle is wrong >> !this.isDisabledScoreEdit[item.id]
     
    if(!this.mobile){
      console.log("onTouchHold>>NOT MOBILE",evt.type,this.mobileEnableScore[item.id]) //mousedown usually...
      //with below active, doesnt complete drop!
      //evt.preventDefault()
      //evt.stopPropagation()
      return true //true?
    }

    let target = document.elementFromPoint(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY)

    
    let oldy = this.allowDialog[item.id]

    this.allowDialog[item.id] = this.mobileEnableScore[item.id]

    if(this.isViewingPast()){ //bon in past allowDialog as mobileEnableScore[item.id] never get set?!? why false--toReview**
      console.log("onTouchHold>> INPAST: ", this.isDisabledScoreEdit[item.id],oldy, this.mobileEnableScore[item.id])
      this.allowDialog[item.id] = !this.isDisabledScoreEdit[item.id] //toTest** toggling isDisabledScoreEdit   //true
    }else{
      console.log("onTouchHold>> INPRESENT: ", this.isDisabledScoreEdit[item.id],oldy, this.mobileEnableScore[item.id],this.allowDialog[item.id])
    }

    //newInfo.touch == true for mobile
    //console.log("onTouchHold>>", this.draggedItem,this.touchedItem,target) //this.isViewingPast(), this.isDisabledScoreEdit[item.id],
        
    let f = target.closest('.my-event')
    
    if(target.classList.contains("title") && target.parentNode.classList.contains("my-event-drag")){ 
      console.log("onTouchHold...REMOVING my-event-drag",f)//,f,target.parentNode)// remove the 'my-event-drag' class as not a drag!!
      target.parentNode.classList.remove("my-event-drag")
    }else{
      if (f && f.classList.contains("my-event-drag")){//just toggle it...
        //console.log("onTouchHold--WRONG target... ",evt,target, target.parentNode,f) //could be cause of that transform on elt
        f.classList.toggle("my-event-drag") 
      }else{
        //console.log("onTouchHold::class not found on Target!!",target)//could and need to use touchedItem
        f = this.touchedItem.closest('.my-event') 
        if (f && f.classList.contains("my-event-drag")){
          f.classList.toggle("my-event-drag")
        }else{ console.log("ERROR...onTouchHold--class not found on Target!!",target,this.touchedItem)}//shouldnt happen!! 
      } 
    }

      //window.location.reload() //so inelegant and resets everything SMDH

      //evt.type that is !=touchstart would mean small move||end  before this fired...should do something? toSee 

      //stopAndPrevent(evt) //for testing

      //umm to allow for dialog to show maybe? >>nope negatively affect touch/drag
      //evt.preventDefault()
      //evt.stopPropagation()

      //return true //true?

      if(this.isDisabledScoreEdit[item.id] && !this.mobileEnableScore[item.id]){  //remove evt..
        //f.classList.toggle("my-event-drag") //bof just do it here..toReview as toggle re-add the class
        this.onDblClickEvent(evt,item)
      }
      
  },
    /*
    handleSwipe ({ evt, ...info }) {
      if (this.dragging === false) {
        if (info.duration >= 30 && this.ignoreNextSwipe === false) {
          if (info.direction === 'right') {
            this.calendarPrev()
          }
          else if (info.direction === 'left') {
            this.calendarNext()
          }
        }
        else {
          this.ignoreNextSwipe = false
        }
      }
      stopAndPrevent(evt) //from import { stop, prevent, stopAndPrevent } from 'quasar/src/utils/event'
    },
    */

  //problematic to activate this when evt has score enabled smh... workaround with onScoreBtn
  onDblClickEvent(e, event) {  
     //console.log("double click eh...", e, event)

     //below unlikely as score edit comes up when inPast!!
     //...just in case!
    if(this.isViewingPast()){
      if (event.duration < 30){ //dont do this for small evts!
        console.log("onDblClickEvent..baah too smoll smoll",event.title,event.duration)
        this.doNotify("umm Removing from the past..Soo Check BALANCE!")
        this.addToBalance(event)
        this.doRemove(event) //onDblClick
        return
      }
      this.chooseAlternatives(event)
      e.preventDefault()
      return
    }

    //setTimeout(() => {
    //  this.removeEvtInSchedule(event)
    //}, 0)

    this.removeEvtInSchedule(event) 
    
    e.preventDefault() //to disable popupEdit...dont work smh event with using setTimeout above
  },
  onClickDate (data) {
    console.log('onClickDate', data)
  },
  onClickTime (data) { 
    //**ariko wont this affect the scrolling? or would it be notificeable in mobile? ToSee**
    //tbd if shouldnt do this in clickInterval...
    console.log('onClickTime..event', data)

    //so here propose selection to add an event to the schedule via dialog box to select from all subgoals
    this.addEventDialog = true
      
     //save the data to use later when checking that it can be scheduled!
    this.targetDrop = data.scope
  },
  onClickInterval (data) { //when clicking on interval of the time column(right side)
    console.log('onClickInterval', data)
  },
  onClickHeadIntervals (data) {
    console.log('onClickHeadIntervals', data)
  },
  onClickHeadDay (data) {
    console.log('onClickHeadDay', data)
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
  onToday () {
    let doContinue = () => {
      //console.log('onToday..continuing...',this.currentDate)
      this.$refs.calendar.moveToToday()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule() //onToday
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
    } else {
      doContinue()
    }
    //oldie >> this.$refs.calendar.moveToToday()
  },
  onPrev () {
    let doContinue = () => {
      //console.log('onPrev....',this.currentDate)
      this.$refs.calendar.prev()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000); //should navigate after save
      this.doSaveSchedule() //onPrev
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
      
    } else {
      doContinue() //oldie >> this.$refs.calendar.prev()
    }
  },
  onNext () {
    let doContinue = () => {
      //console.log('onNext...continuing',this.currentDate)
      this.$refs.calendar.next()
    }
    
    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule() //onNext
    }

    if(!this.disableSaveSchedule){ //handle when cx has some unsaved changes!
      this.confirmAction(`Save day: ${this.currentDate} changes?`,"Save",doSave, doContinue)
    }else {
      doContinue()
    }
  },
}
}//)
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

.heady
  position: relative
  display: flex
  justify-content: center
  align-items: center
  height: 100%

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

.liney
  white-space: pre-wrap
  word-break: break-all


.my-event-drag
  outline: 1px dashed #213
  opacity: 0.7
  cursor: move
  transform: rotateY(45deg) translateZ(1em)
  transition: transform 100ms linear

.touchy
  border: 5px dashed #213
  &:selection
    border: 10px dashed #713
    opacity: 0.3

.touchy-item
  background-color: #2196F3
  color: #ADFF2F
  &:selection
    border: 10px dashed #713
    opacity: 0.3

.touchy-interval
  background-color: #2196F3
  outline: 5px dashed #008000
  &:selection
    border: 10px dotted rgba(0,500,200,.8)
  &:hover
    border: 5px dashed #008000

</style>