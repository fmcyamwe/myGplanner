<template>
  <q-page padding>
    <div class="subcontent">
          <q-splitter
            v-model="splitterPage"
            :limits="splitterLimits"
          >
              <template v-slot:before><!-- Scheduling buttons and Legend Tree in a Horiz. splitter-->
                <q-splitter
                  v-model="splitterLegend"
                  horizontal
                  :limits="[20, 80]"
                  style="height: 100%"
                  >
                      <template v-slot:before> <!--Scheduling buttons -->
                        <scheduleDayLabel
                        :doShow="treeGoals.length > 0"
                        :balanceLabel="labelBalance()"
                        :scheduleLabel="labelScheduled()"
                        />

                        <actionBtns
                          :scoreOptions="scoreOptions"
                          :allMainGPrio="allMainGPrio()"
                          :defaultBtnLabel="defaultBtnLabel"
                          :onScoreBtnLabel="chosenScoreLabel"
                          :onPrioBtnLabel="chosenPrioLabel"
                          :showReloadBtn="scheduleProps.showReloadBtn"
                          :showClearBtn="scheduleProps.showClearBtn"
                          :showActionBtns="doShowActionBtns"
                          :showTree="showTree"
                          :inMobile="mobile"
                          :isDefaultBtnEnabled="isDefaultBtnEnabled"
                          :isScoreBtnDisabled="scheduleProps.disableScoreBtn"
                          :isPrioBtnDisabled="scheduleProps.disablePrioBtn"
                          @on-reload-saved="onReloadSaved"
                          @on-clear-day="onClearDay"
                          @on-load-defaults="onLoadDefault"
                          @do-reload-with-score="(comp,val) => doReload('score',comp,val)"
                          @do-reload-with-prio="(comp,val) => doReload('prio',comp,val)"
                          @on-choosen-score="onChoosenScore"
                          @on-choosen-prio="onChoosenPrio"
                          @on-schedule-one-each="onScheduleOneEach"
                          @do-hide-tree="() => showTree = !showTree"
                        />
                        
                        <!--<alt-multi-drop-btn
                        :daLabel="chosenScoreLabel"
                        :daOptions="scoreOptions"
                        @do-reload="(comp,val) => doReload('score',comp,val)" //doReloadWithScore
                        />
                        <alt-multi-drop-btn
                        :daLabel="chosenPrioLabel"
                        :daOptions="allMainGPrio()"
                        @do-reload="(comp,val) => doReload('prio',comp,val)"//doReloadWithPrio
                        />-->

                          <div class="row justify-center">
                            <sched-btn
                            text-label="SaveSchedule"
                            class="q-mt-md"
                            :text-color="saveScheduleDisabled ? 'grey' : 'blue'"
                            :disable="saveScheduleDisabled"
                            @do-btn-action="doSaveSchedule"
                            push
                            :dense="false"
                            /><!--huh could use sched-btn for saveSchedule && ShowTree! AND could pass in fallthrough props + not using isDisabled prop to hide tooltip!!-->

                            <sched-btn v-if="showTree || isViewingPast()"
                            :text-label="showTree ? 'HideTree' : 'ShowTree'"
                            class="q-mt-md"
                            text-color="green"
                            @do-btn-action="() =>{ showTree ? resetFilter(): '' ; showTree = !showTree}"
                            push
                            :dense="false"
                            />
                            </div> 
                            <br>
                      </template>
                      <template v-slot:after> <!--legend tree + jeSuis-->
                        <!--<q-space/> have to be inside qComponent  class="q-gutter-md"-->
                        <div v-if="showTreeForm" class="q-gutter-md q-pa-sm bg-grey-12">
                          <q-item-label overline header lines="3">
                            {{ isViewingPast() ? 'Drag&Drop /' : 'Filter by Mood /' }} Expand & Hover for Moods
                            
                          </q-item-label>
                          <!--no need for disable, label as not shown in past!!-->
                          <q-select v-if="!isViewingPast()"
                          :label="isViewingPast() ? 'No Filter In Past BUT Can Drag&Drop!!' : 'je-suis'"
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
                          >
                          <!-- 'default-expand-all' but too much 
                            also set on first render so cant hack with below to expand after filtering >>
                           :default-expand-all="filter.length > 0"-->
                           <!--  expandAll>>no can do :(...-->
                            <template v-slot:default-header="prop">
                              <div :class="classyColor(prop.node)">
                                <q-icon v-if="!prop.node.isChildren" :name="prop.expanded ? 'expand_less' : 'expand_more'" size="28px" right/>
                                <div class="q-mr-sm text-weight-bold" size="28px">{{ prop.node.label }}</div>
                                <q-icon :name="prop.node.icon" />
                              </div>
                            </template>
                            <template v-slot:default-body="prop">
                              <div v-if="prop.node.isChildren"
                              :draggable="true"
                              style="cursor: grab;"
                              @dragstart.stop="(e) => onDragStart(e, 'tree-item', prop.node)"
                              >
                                <span class="text-weight-bold">  >> {{ prop.node.details }} </span>
                                <q-tooltip v-if="prop.node.moods.length > 0">{{ "Moods::> " +prop.node.moods.join(',') }}</q-tooltip>
                              </div>
                              <span v-else class="text-weight-light text-black" >{{ prop.node.details }}</span>
                            </template>
                          </q-tree>
                          <br>
                          <sched-btn v-if="filter.length > 0"
                            text-label="Add Mood Evts"
                            class="q-mt-xl sched-btn"
                            text-color="red"
                            @do-btn-action="onMoodAdd"
                          /><!--should also not show when no matching nodes but hard to determine? see matchingMoodNodes-->
                        </div>              
                      </template>
                </q-splitter>
                
                <div class="instru"><!--class="q-ma-xl column items-center instru"-->
                  <q-toggle 
                  v-model="showInstru"
                  :label="showInstru ? 'Hide Instructions' : 'Show Instructions'"
                  color="teal" 
                  class="q-pa-md q-mx-xl"
                  align="center"/>

                  <da-instructions v-if="showInstru"
                  :showRemInstru="showRemInstru"
                  :showSchedInstru="showSchedInstru"
                  /><!--:showInstructions="showInstru" -->
                </div>
              </template>
            
              <template v-slot:separator v-if="!mobile"><!--huh suprised v-if works-->
                  <q-avatar color="primary" class="q-px-md" text-color="white" size="40px" icon="drag_indicator" style="position: relative; top: 70%;"/> <!--nudge this down by 70 percent...huh-->
              </template>
              <!--<q-avatar v-if="mobile" color="primary" class="q-px-md" text-color="white" size="40px" icon="legend_toggle || question_mark" style="position: relative; top: 70%;"/>-->
              
              <template v-slot:after><!-- Calendar and dialogs...-->
                <div class="q-pa-md relative-position forMobile"><!--q-pa-md relative-position style="height: 280px; max-height: 80vh"  "[18, 18]"-->
                  <q-page-sticky position="top-left" :offset="fabPos">
                  <!--<Transition name="bounce"> -->
                  <q-btn
                    v-morph:btn:mygroup:300.resize="morphGroupModel"
                    :class="fabClass"
                    fab
                    size="md"
                    icon="legend_toggle"
                    align="evenly"
                    @click="nextMorph"
                    :disable="draggingFab"
                    v-touch-pan.prevent.mouse="moveFab"
                  />
                  <!--</Transition><q-fab></q-fab> use q-fab? also make first qCard show faster?  
                  :color="saveScheduleDisabled ? 'primary' : 'yellow'"
                  class="absolute-top-left q-mx-md unsavedu"
                  
                  -->
                  <q-card
                    v-morph:card1:mygroup:500.tween="morphGroupModel"
                    class="q-ma-md bg-grey"
                    style="width: 59%; border-top-left-radius: 2em"
                  ><!--absolute-top-left-->
                    
                    <scheduleDayLabel
                    :doShow="treeGoals.length > 0"
                    :balanceLabel="labelBalance()"
                    :scheduleLabel="labelScheduled()"
                    :hasUnsaved="hasUnsavedChanges()"
                    />
          
                    <q-card-actions align="around"><!--label="Next" thumb_up  flat-->
                      <q-btn outline push no-caps no-wrap @click="morphClose" icon="close" color="red" align="between" class="q-mx-xs"/>
                      <q-btn elevated push @click="nextMorph" no-caps no-wrap align="between" class="q-mx-xs">Actions &gt;</q-btn>
                    </q-card-actions>

                    <q-card-actions align="center">
                      <q-btn
                      label="SaveSchedule"
                      color=""
                      text-color="white"
                      align="between"
                      class="q-ma-sm"
                      elevated
                      push
                      :dense="false"
                      no-wrap
                      no-caps
                      @click.prevent="() => {doSaveSchedule(); morphClose() }"
                      />
                    </q-card-actions>
                   
                  </q-card>
                  <q-card
                    v-morph:card2:mygroup:500.tween="morphGroupModel"
                    class="q-ma-xs"
                    style="width: fit-content; border-top-left-radius: 2em"
                  >
                    <!--absolute-top-left -->

                    <div class="text-center text-subtitle2 q-ma-sm">
                      Reload By
                    </div>
                    <q-separator color="red" inset/>
                    <div class="q-ma-xs">  
                      <actionBtns
                        :scoreOptions="scoreOptions"
                        :allMainGPrio="allMainGPrio()"
                        :defaultBtnLabel="defaultBtnLabel"
                        :onScoreBtnLabel="chosenScoreLabel"
                        :onPrioBtnLabel="chosenPrioLabel"
                        :showReloadBtn="scheduleProps.showReloadBtn"
                        :showClearBtn="scheduleProps.showClearBtn"
                        :showActionBtns="doShowActionBtns"
                        :showTree="showTree"
                        :inMobile="mobile"
                        :isDefaultBtnEnabled="isDefaultBtnEnabled"
                        :isScoreBtnDisabled="scheduleProps.disableScoreBtn"
                        :isPrioBtnDisabled="scheduleProps.disablePrioBtn"
                        @on-reload-saved="() => {onReloadSaved(); morphClose()}"
                        @on-clear-day="() => {onClearDay(); morphClose() }"
                        @on-load-defaults="() => {onLoadDefault(); morphClose()}"
                        @do-reload-with-score="(comp,val) => {doReload('score',comp,val); morphClose()}"
                        @do-reload-with-prio="(comp,val) => {doReload('prio',comp,val); morphClose()}"
                        @on-choosen-score="onChoosenScore"
                        @on-choosen-prio="onChoosenPrio"
                        @on-schedule-one-each="() => {onScheduleOneEach(); morphClose()}"
                        @do-hide-tree="() => showTree = !showTree"
                      />
                    </div>
                  
                    <q-card-actions align="right">
                      <q-btn flat no-caps no-wrap @click="prevMorph"> &lt; Prev </q-btn>
                      <q-btn flat label="Close" no-caps no-wrap @click="nextMorph" />
                    </q-card-actions>
                  </q-card>
                  </q-page-sticky>
                </div>
                  <navigation-bar
                  @today="onToday"
                  @prev="onPrev"
                  @next="onNext"
                  />

                  <div v-if="scheduleMoodsLabel" class="row q-px-md"> 
                    By moods: 
                      <!-- !='' <q-badge color="secondary" multi-line>
                        {{scheduleMoodsLabel}}
                        'text-white bg-'}${proppy.color} `
                      </q-badge> color better than textColor-->
                      <q-badge v-for="(value, key) in scheduleMoodsLabel" :key="key" :color="value.bg" multi-line rounded>
                        {{ value.m }}
                      </q-badge>
                  </div>
                  
                  <div class="row justify-center"><!--q-scroll-area doesnt allow for scroll to no me?!?-->
                      <div class="q-gutter-sm" style="display: flex; max-width: 800px; width: 90%; height: 90vh;"><!--height: 90vh; >> overflow: auto;? with class="q-px-md"-->
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
                          @mousemove-time="onMouseMoveTime">
                            <template #head-day-event="{ scope: { timestamp } }">
                              <div style="display: flex; justify-content: center; flex-wrap: wrap; padding: 2px;margin-bottom: 5px;"> <!--toSee margin-bottom on mobile...-->
                                
                                <template
                                  v-for="event in eventsMap[timestamp.date]"
                                  :key="event.id"
                                >
                                  <div v-if="!event.time"
                                  :draggable="true"
                                  style="width: 100%; cursor: grab; height: 12px; font-size: 10px; margin: 5px;"
                                  class="heady"
                                  @dragstart.stop="(e) => onDragStart(e, 'header-item', event)"
                                  @touchstart="(e) => onTouchHStart(e, 'header-item',event)"
                                  @touchmove="(e) => onTouchHEvt(e,event)"
                                  @touchend="(e) => onTouchHEvt(e, event)"
                                  >
                                  <q-badge
                                  :class="badgeClasses(event, 'header-item')"
                                  >
                                  <!--try and drag into schedule time interval >>draggable better response on div
                                    :style="badgeStyles(event, 'header')"  class="heady"-->
                                    
                                      {{ event.title }}
                                      
                                      <!-- {{ event.details }} class="heady q-calendar__ellipsis"
                                        @drop="(e) => onDrop(e, 'header-item', scope)"

                                        onmouseover="(e) =>onMouseOver(e)" >>doesnt fire!
                                        see with remove of below...huh no adverse effect!!
                                      @dragend.stop="onDragHEnd"
                                      @dragenter="(e) => onDragHEnter(e, 'header-item', scope)"
                                      @dragover="(e) => onDragOver(e, 'header-item', scope)"

                                      v-touch-hold="(e) => onTouchyHold(e, event)"
                                      400:12:15 - 400ms wait time, 12px sensitivity for touch events, 15px sensitivity for mouse events)

                                        -->
                                    <q-tooltip>Drag to schedule >> {{event.duration}}min </q-tooltip>
                                  </q-badge></div>
                                  <q-badge
                                    v-else
                                    :class="badgeClasses(event, 'header')"
                                    :style="badgeStyles(event, 'header')"
                                    style="margin: 1px; width: 10px; max-width: 10px; height: 10px; max-height: 10px; cursor: pointer"
                                    @click="scrollToEvent(event)"
                                  >
                                    <q-tooltip>{{ '('+ event.id +') '+ event.title +' - '+ event.time + ' ('+event.duration+'min) >> '+event.end.time }}</q-tooltip>
                                    <!--<q-tooltip>{{ event.title +' ('+event.duration+' min) >>'+ event.time  +' - '+event.end.time }}</q-tooltip> -->
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
                                  v-if="event.time"
                                  class="my-event"
                                  :class="badgeClasses(event, 'body')"
                                  :style="badgeStyles(event, 'body', timeStartPos, timeDurationHeight)"
                                  :draggable="true"
                                  @dblclick.prevent="(e) => onDblClickEvent(e, event)"
                                  @dragstart.stop="(e) => onDragStart(e, 'goal-item', event)"
                                  @dragend.stop="onDragEnd"
                                  @drop="(e) => onDrop(e, 'goal-item', scope)"
                                  @dragenter="(e) => onDragEnter(e, 'goal-item', scope)"
                                  @dragover="(e) => onDragOver(e, 'goal-item', scope)"
                                  @touchstart="(e) => onTouchStart(e, 'goal-item',event)"
                                  @touchmove="(e) => onTouchEvt(e,event)"
                                  @touchend="(e) => onTouchEvt(e, event)"
                                  >
                                  <!--
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
                                      :icon="event.icon"
                                      :happeningNow="daSchedule.hasStarted[event.id] ? daSchedule.hasStarted[event.id] : false"
                                      @end-now="onEndNow"
                                      @save-score="onUpdateNoteScorey"
                                      @add-mins="onAddMins"
                                      @delete-now="removeEvtInSchedule(event)"
                                      v-touch-hold:400:12:15="(e) => onTouchHold(e, event)"
                                    /><!-- v-touch-hold >> on goaly-end or div above makes no diff >> BUT seem to log errors more in div-->

                                    <!--<div v-if="daSchedule.hasStarted[event.id]" 
                                    class="addmins-line"
                                    :style="styleDragLine(event, timeStartPos, timeDurationHeight)">
                                      //show line at bottom for addMins via drag bottom border evt
                                        left: 5px
                                        background-color: red
                                        border-top: red 2px solid
                                        border: 2px solid #d3d3d3
                                     bof not working
                                    </div> -->

                                    <mobileNoteScore v-if="showEvtMobile(event.id)"
                                      :title="event.title"
                                      :id="event.id"
                                      :startTime="event.time"
                                      :score="event.score"
                                      :details="event.details"
                                      :notes="event.notes"
                                      :show-dialog="showEvtMobile(event.id)"
                                      @save-score="onUpdateNoteScorey"
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
              </template>
          </q-splitter>

          <sched-dialog v-if="showEvtDialog"
          :parentGoals="daSchedule.allPGoals()"
          :canBeScheduled="canbeScheduled"
          :balance="currentBalance"
          :selectedTime="selectedTimeInterval()"
          :isTimeRange="selectedTimeRange()"
          @ad-hoc-event="onAddyHocEvent"
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
isBetweenDates,
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
import { applyClasses, applyStyles, whenFrmtTime,parseScore,deepCopy,hexColor } from '../util/utiFunc'
import { useQuasar } from 'quasar'  //Platform
import daySchedule  from '../../models/aDaySchedule.js'
import scheduleBy from '../../components/planner/scheduleByDialog.vue' //also craps out when in demand?
import { NotifActions } from '../../boot/actions'; 

function isLeftClick (e) {
  return e.button === 0
}

export default {
name: 'altDayCalendar',
components: {
  NavigationBar: defineAsyncComponent(() => import('../../components/NavigationBar.vue')), 
  QCalendarDay,//: defineAsyncComponent(() => import('@quasar/quasar-ui-qcalendar/src/index.js')), // with loadOnDemand, craps out...
  GoalyEnd: defineAsyncComponent(() => import('../../components/planner/goalyEnd.vue')),
  daInstructions: defineAsyncComponent(() => import('../../components/planner/instructions.vue')),
  schedBtn: defineAsyncComponent(() => import('../../components/planner/schedBtn.vue')),
  schedDialog: defineAsyncComponent(() => import('../../components/planner/schedDialog.vue')),
  mobileNoteScore: defineAsyncComponent(() => import('../../components/planner/onScoreEditDialog.vue')),
  actionBtns: defineAsyncComponent(() => import('../../components/planner/actionBtns.vue')),
  scheduleDayLabel: defineAsyncComponent(() => import('../../components/planner/dayLabels.vue'))
},
data () {
  //let possibleRange = null //for adhoc scheduling...keep track of selected time range

  let intervalId = null
  const $q = useQuasar()

  const currentTime = ref(null)

  const selectedItem = ref(null)  //draggedItem //whether (touch/drag)
  const targetDrop = ref(null)

  const touchedItem = ref(null) //for touch mobile elt

  const lastTarget = ref(null) //for drag/drop highlight.

  //wonder if would work.. >> const dismiss = $q.notify({...}) 
  //const dismiss = this.$q.notify({ //these below are used for grouping
  //    position: 'top',
  //    message: '',
  //    multiLine: true,
      //caption: '',
      //actions:
  //})  //bon fires for every notif shown?!?

  return {
    splitterPage: ref(35), // start--left side--before at 35%
    splitterLegend:ref(40),
    timeStartPos:ref(0), ///This is the one for actually showing current time and needs to be in return for proper update

    showTree: ref(false), //showing Legend Tree
    treeGoals:ref([]), 
    expanded:ref([]), //to hold expanding pGoal nodes...
    possibleRange:null, ////for adhoc scheduling...keep track of selected time range >>moved here smh
    filter : ref([]),
    filterRef : ref(null),
    //matchingMoodNodes : ref(0), //for filtered nodes...meh hard to reset...

    nextMorphStep : ref({
      btn: 'card1',
      card1: 'card2',
      card2: 'btn'
    }),
    morphGroupModel: ref('btn'),
    draggingFab:ref(false),
    fabPos: ref([ 0, 10 ]), //mobile draggable actnBtn >>offset:: horizontal,vertical 

    calendar: ref(null),

    showEvtDialog: ref(false),

    currentDate: ref(today()),
    scoreOptions:ref([1,2,3,4,5,6,7,8]), //default score intervals
      
    anchorTimestamp: ref(null), //start time for range
    otherTimestamp: ref(null),   //end time for range...
    mouseDown: ref(false),
    mobile: ref(true),

    daSchedule:ref(null),
    showInstru:ref(false) //toReview** if shouldnt check something else
  }
},
beforeMount() {
  this.mobile = isMobile()
  this.mobile ? this.splitterPage = 0 : ''
  this.daSchedule = new daySchedule(this.currentDate,this.mobile)

  this.constructTree()
},
mounted() {
  this.adjustCurrentTime()
  // adjust the time every minute
  this.intervalId = setInterval(() => {
    this.adjustCurrentTime()
  }, 60000)

  NotifActions.addListener("pauseReceived",()=> {
      //console.log(`altDayCalendar::listener work?`) //huh straight invoke of baseclass works!
      this.daSchedule.scheduleLater() //umm not doing work twice with unmount? >> meh unmount doesnt run on pause
    })
},
unmounted(){
  //console.log(`altDayCalendar::unmounted NOW >> removinnn listeners`)
  NotifActions.removeAllListeners() 
  //do get it on weekView when not removed!!
},
beforeUnmount() {
  clearInterval(this.intervalId)

    let doContinue = () => {
      this.daSchedule.scheduleLater()
    }

    let noSave =() =>{
      console.log("dayView::beforeUnmount...no saving requiered")
    }
    
    let doSave = () => {
      setTimeout(doContinue, 500);
      this.daSchedule.saveDaySchedule()
    }

   //when cx has some unsaved changes!
  //bon save?--does ask when already on homeview page tho...--toReview** 
  if(this.hasUnsavedChanges()){ //handle 
      this.confirmAction('',`Save changes of day: ${this.currentDate} before Nav away?`,"Save",doSave, noSave)
  } else {
    doContinue() 
  }
  //this.daSchedule.scheduleLater()
},
computed: {
  chosenScoreLabel() {
    //return this.chosenScore == null ? `By Score` : `Score <= ${this.chosenScore}`
    return this.daSchedule.chosenScoreLabel()
  },
  chosenPrioLabel() { //could just directly use inline...todo?
    //return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}`
    return this.daSchedule.chosenPrioLabel()
  },
  style () {
    return {
      top: this.timeStartPos + 'px'
    }
  },
  fabClass(){ //saveScheduleDisabled
    return this.hasUnsavedChanges() ? 'absolute-top-left q-mx-md unsaved doBounce' : 'absolute-top-left q-mx-md allGood'
  },
  splitterLimits(){
    //console.log("splitterLimits...",this.mobile)
    return this.mobile ? [0, 100] : [30, 70]
  },
  showSchedInstru(){
    return this.getDateEvents(this.currentDate).length < 1 //&& !this.isViewingPast()
  },
  showRemInstru(){
    return this.getDateEvents(this.currentDate).length > 0 //&& !this.isViewingPast()
  },
  defaultBtnLabel(){
      //let e = this.daSchedule.unscheduled()
      //let s = e.filter(evt => evt?.inDefaults).length //&& evt?.time != ''
      let s = this.daSchedule.unscheduledDefaultEvts()
      return  s > 0 ? s+ " Defaults" : "Defaults"
  },
  isDefaultBtnEnabled(){
    //let e = this.daSchedule.unscheduledDefaults()
    //console.log("showDefaultBtn...",e.length)
    let e = this.daSchedule.unscheduledDefaultEvts()
    //return e > 0 && !this.isViewingPast()
    return !e > 0 || this.isViewingPast()
  },
  doShowActionBtns(){
    return this.daSchedule.actionBtnsEnabled()
  },
  scheduleProps(){
    return this.daSchedule.getProps()
  },
  saveScheduleDisabled(){
    let e = this.daSchedule.hasUnsavedChanges()
    let f = this.daSchedule.saveBtnEnabled()
    //this.doLog("saveScheduleDisabled..."+e,f)
    return f //this.daSchedule.saveBtnEnabled() //this.disableSaveSchedule 
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
    return this.daSchedule.availableEvtsToSchedule()
  },
  scheduleMoodsLabel(){
    //let ret = null //''

    let cMoods = this.daSchedule.getCurrentMoods()
    //console.log(`scheduleMoodsLabel.....`,JSON.parse(JSON.stringify(this.getDateEvents(this.currentDate))))
    //this.doLog(`scheduleMoodsLabel..`,cMoods)//JSON.parse(JSON.stringify(cMoods))) //this.usingMoods)

    if (!Object.keys(cMoods).length > 0) {return null } //ret

    //let aSet = new Set()
    let aMap = new Map()
    for (let key in cMoods) {
      //aSet.add(cMoods[key].join()) //join for uniqueness when using Set...mais bon...
      let moo = cMoods[key].join()
      aMap.set(key,moo)
      //aSet.add(moo)
    }
    
    //let i = 0
    //for (let value of aSet){ //umm redundant? toReview
    //  i < 1 ? ret = value : ret = ret + ', '+ value 
    //  i++ 
    //}

    //if (Object.keys(cMoods).length != aSet.size){ //check for size change >>would have duplicates that are added once
    //  console.log(`scheduleMoodsLabel..prob change!`,JSON.parse(JSON.stringify(cMoods)),aSet, ret) //aSet, aSet.values(), 
    //}
      
    //show each mood's evt.background-color for easier association with scheduled evt!!
    let toRet = {}
    
    for (let [entry, val] of aMap){ //possible not all evts added to schedule yet--overlaps!! toMonitor**
      //let e = this.daSchedule.getAllEvts().get(parseInt(entry))  //item => item.id == entry
      let e = this.daSchedule.findSchedEvent(parseInt(entry)) //need parseInt!! smh
      //console.log(`scheduleMoodsLabel::`,e,entry,val)//e?.bgcolor,e?.color)//,entry,val)
      toRet[entry] = {
        m:val,
        bg:e?.bgcolor
      }
    }

    return toRet //ret  
  },
  startEndTimes() { 
      const dates = []
      if (this.anchorDayTimeIdentifier !== false && this.otherDayTimeIdentifier !== false) {
        if (this.anchorDayTimeIdentifier == this.otherDayTimeIdentifier) {
          //case of single selection...no add extra 15 min as messes up in calendar //202411220100
          //console.log("startEndTimes..OUUU same",this.anchorDayTimeIdentifier, this.otherDayTimeIdentifier)
          //bon kinda redundant anyway as no change here...
          dates.push(getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp))
          return dates
        }

        //timeRange...prolly >> have to add 15 mins to end time for proper selection!!
        //BUT this kinda messes up how shown in calendar so have to manually add smh
        if (this.anchorDayTimeIdentifier < this.otherDayTimeIdentifier) { //was <= 
          //console.log("startEndTimes..anchor < otherDayTime",getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp),getDateTime(addToDate(this.otherTimestamp, { minute: 15})))
          dates.push(getDateTime(this.anchorTimestamp),getDateTime(this.otherTimestamp))
          //getDateTime(addToDate(this.otherTimestamp, { minute: 15}))
        }else {
          //console.log("startEndTimes..otherDayTime < anchor",getDateTime(this.otherTimestamp),getDateTime(addToDate(this.anchorTimestamp, { minute: 15})))
          dates.push(getDateTime(this.otherTimestamp),getDateTime(this.anchorTimestamp))
          //getDateTime(addToDate(this.anchorTimestamp, { minute: 15}))
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
    return this.daSchedule.scheduledEventsMap() //currentSchedEventsMap()
  },
},
methods:{
  dismissy() { //huh seems to run when notif is shown?!? cause of const? //redundant as doesnt hide notif smh
    //dismiss() //huh works same as below
    
    //this.$q.notify({ //these below are used for grouping
    //  position: 'top',
    //  message: '',
    //  multiLine: true,
      //caption: '',
      //actions:
    //})
  },
  moveFab (ev) {
    //console.log("moveFab...",ev,this.draggingFab,this.fabPos)
    this.draggingFab = ev.isFirst !== true && ev.isFinal !== true

      this.fabPos = [
        this.fabPos[ 0 ] + ev.delta.x, //oldie was -
        this.fabPos[ 1 ] + ev.delta.y
      ]
  },
  prevMorph(){
    this.morphGroupModel = this.nextMorphStep['btn'] //works!
  },
  nextMorph() {
    this.morphGroupModel = this.nextMorphStep[ this.morphGroupModel]
  },
  morphClose() { //after actionBtn click >> should be same as using >> this.morphGroupModel
    this.morphGroupModel = this.nextMorphStep['card2']
  },
  showEvtMobile(id){
    return this.daSchedule.showEvtNoteScoreMobile(id)
  },
  selectedTimeInterval(){ //updates when placed here smh 
    //For timeRange, start is wrong as last clicked interval is end
    //console.log("selectedTimeInterval", this.targetDrop.timestamp.time ?? "","starts>> "+this.startEndTimes)
    return this.targetDrop.timestamp.time
  },
  selectedTimeRange(){ //for timeRanges...mobile mostly
    console.log("selectedTimeRange", this.startEndTimes,(this.currentDate + " "+this.targetDrop.timestamp.time),this.possibleRange ?? "")
    //
    //let startDiff = (this.currentDate + " "+this.targetDrop.timestamp.time) != this.startEndTimes[0] //or split to get time?!? meh good enough
    //let endDiff = (this.currentDate + " "+this.targetDrop.timestamp.time) != this.startEndTimes[1]
    //getDateTime(addToDate(this.anchorTimestamp, { minute: 10}))

    let s = this.possibleRange ? this.possibleRange[0] ?? this.startEndTimes[0] : this.startEndTimes[0] //null //desktop
    let e = this.possibleRange ? this.possibleRange[1] ?? this.startEndTimes[1] : this.startEndTimes[1] //null
    let isSame = s == e  //easier compare than above concat
    let dura = 0 //easier to calc dura here too...

    //add to end for precise range selection
    if(!isSame){
      let tempS = addToDate(parseTimestamp(s), { minute: 0})
      let tempE = addToDate(parseTimestamp(e), { minute: 15})

      dura =  Math.floor((diffTimestamp(tempS, tempE)/1000)/60)
      e = getDateTime(tempE) //getDateTime(addToDate(parseTimestamp(e), { minute: 15}))
    }

    //console.log("selectedTimeRange>> "+isSame,dura, s,e)
    return {
      start:s,//this.startEndTimes[0],
      end:e,//this.startEndTimes[1],
      isSame:isSame, //startDiff || endDiff //normally diff from start as targetDrop is end BUT can also be inverse when range going up
      duration:dura,
      onMobile:this.mobile //meh to avoid importing in dialog just to check this...
    }
  },
  hasUnsavedChanges(){
    return this.daSchedule.hasUnsavedChanges()
    //console.log("hasUnsavedChanges", e)
    //return e
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
    this.timeStartPos = this.$refs?.calendar?.timeStartPos(now.time, false)  
    //the above dont update in view >>cause was not in return!!

    let timeSets = this.daSchedule.getCurrentSchedTimesSets()

    let hasEnd = (timeSets.endSet && timeSets.endSet.has(now.time))
    let hasStart = (timeSets.startSet && timeSets.startSet.has(now.time))
    if(hasEnd || hasStart){
      //console.log("sameStart/END..FOUND", this.currentTime,hasEnd, hasStart)
      this.daSchedule.updateMinEndNowBtn(this.currentTime,hasEnd, hasStart)
      if (hasStart){
        this.scrollToTime(now,'slow')
        
        //should prolly be here that notification is sent!!
        /*chrome.notifications.create(data.url, {  //would this work?!? >>nah errors out at .create
          "type": "basic",//data.type,
          "iconUrl": chrome.runtime.getURL("icons/manga-48.png"), //chrome.extension.getURL("icons/manga-48.png"),
          "title": "Titleeee",//data.title,
          "message": `Weeeee, Starting ${now.time}` //data.content
        });*/

        //window.postMessage({ type: "FROM_PAGE", data:'Weeeee, Starting' });  //no clues where this message goes....
      }
    }
  },
  hasDate (days) { //umm why again?!? for current time line? toTest*** when removed!
      return this.currentDate
      ? days.find(day => day.date === this.currentDate)
      : false
  },
  getDateEvents (dt) {

    //oldie that didnt sort >>return this.daSchedule.getDateEvents(dt)  //|| []

      let sorty = (a, b) => {//sort by timestamp
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
    return events.sort(sorty) //errors out with this.sorty
  },
  constructTree(){
    this.treeGoals = this.daSchedule.fetchGoalsTree()
  },
  //resetGoalEvts(){
  //  return this.daSchedule.getSubGoals()
  //},
  allMainGPrio(){
   return this.daSchedule.getAllPrio()
  },
  //resetMatchingNodes() {
    //this.doLog("resetMatchingNodes>>",this.matchingMoodNodes)
    //this.matchingMoodNodes = 0
  //},
  resetFilter () {
    this.filter = []
    this.filterRef?.focus() //umm gotta ?. //oldie >> filterRef.value.focus()
    //this.resetMatchingNodes()//this.matchingMoodNodes = 0
  },
  myFilterMethod (node, filter) { // for mood filtering...calld on each node!! AND any interact with tree when filtering is going on i.e: expand nodes....
    const filt = this.filter.map(e => e.toLowerCase()) //oldie..cannot use 'filter' var as it's a string here smh  
    if (node.isChildren && node?.moods.length > 0){
      //console.log("myFilterMethod>> "+ node.id, node?.moods,filter) //,this.filter
      
      let match = node?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1)//umm prolly good idea to lowerCase both!! 
      if (match){ //toRemove**
        //this.doLog("myFilterMethod>>ooouh match",node)
            
        //this.expanded.splice(0,5) //when using default-expand-all 
        //this.expanded.push("5) Misc")//=false
        //this.doLog("myFilterMethod::expanded after",this.expanded)
        //this.expanded[node.id]=true  //just to see...should be node's parent 
        //this.expanded["5) Misc"]=false  //problem of using label as key smh
            
        //doesnt seem possible to expand filtered nodes smh
        //could do set dynamically on slot-header but oh well...

        //this.matchingMoodNodes++ //hard to reset properly...toReview** later...maybe
      }
      //console.log("myFilterMethod>> ", node.label, match,this.filter,filt,filter )
      return node.label && match //node?.moods.some(e => filt.indexOf(e.toLowerCase()) > -1) 
    }
  },
  //doExpand (){//hack to see if can expand pGoals from filtered >>nope!
  //  return this.filter.length > 0
  //},
  labelScheduled(){
    return this.daSchedule.labelScheduled()
  },
  labelBalance(){
    return `Balance: ${this.daSchedule.getCurrentBalance() || 0 } \n`
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
  isViewingToday(){
    return this.daSchedule.isViewingToday()
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
        })
      }
    })

    if (toAddy.length > 0){
      toAddy = toAddy.filter(x => !this.daSchedule.getScheduledEvts().has(x.id)) //x => !this.daSchedule.getAllEvts().find(item => item.id == x.id)  //filter out already scheduled
      let sizey = toAddy.length
      if(sizey > 0){
        let res = this.daSchedule.scheduleByMood(toAddy)
        //console.log(`onMoodAdd>>>`,filt,toAddy) 
        if(!res.canContinue){ //&& !anyOverlap.overlaps
          //console.log("onMoodAdd::OVERLAPS?",JSON.parse(JSON.stringify(res)))
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            res?.added > 0 ? this.doNotify(`${res?.added} Evts added ${res?.noTime ? "Plus "+res?.noTime+" Without time":""} BUT some Overlaps to fix!`, "warning") : ''
            return this.handleOverlaps(res.overlaps,'byMood')
          }
          //can below even happen? toMonitor**
          this.doNotify(`Empty as no Mood Evts :(`, "warning")//,'bottom') 
        }else{//allGood prolly...
          this.doNotify(`Added ${res?.added} Evts by Mood...doSave eh`, "info")  //${sizey} == same added...
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

      let doAction = (opt) => { //flag
        let res = this.daSchedule.scheduleOneEach(opt.choice,opt.skipOCheck,this.doNotify)
        //console.log(`onScheduleOneEach::ACTION!!!`,JSON.parse(JSON.stringify(res)))
        if(!res.canContinue){
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            res?.added > 0 ? this.doNotify(`${res?.added} Evts added ${res?.noTime ? "Plus "+res?.noTime+" Without time":""} BUT some Overlaps to fix!`, "warning") : ''
            return this.handleOverlaps(res.overlaps,'oneEach')
          }
          this.doNotify(`Empty None for OneEach :(`, "warning")//,'bottom')   
        }else{//allGood no overlap
          this.doNotify(`${res?.added} Evts by Each ParentGoal...doSave eh`, "info")
          //console.log("onScheduleOneEach::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
        }
        currentSched > 0 || res?.added > 0 ? this.daSchedule.toggleActionBtns(true,'oneEach') : console.log("onScheduleOneEach::no Evts and no toggling for flag>> ",opt.choice,res?.added)
      }

      let doCancel = () => { //do cancel
        console.log('onScheduleOneEach..Aborting')
        this.reset() //OneEach
        return
      }

    let currentSched = this.daSchedule.getScheduledEvts().size
    if (currentSched > 0) {
      let labels = [
        {label: `Add one Evt from Each parent Goals`,value: 'add'},
        {label: `Reset schedule and add one random Evt from Each parent Goals`,value: 'reset'}
      ]

      //confirmChoiceDialog
      this.scheduleByDialog('Schedule One of Each',//'Warning!!', //Reload 
      'One Random Evt per Parent Goal', //`Current: ${this.currentDate} already have scheduled Events...`
      labels,
      '',
      doAction, //onOk
      doCancel)
    } else{ //nothing scheduled--just overwrite
      doAction({choice:'reset', skipOCheck:!this.isViewingToday()}) //overwrite
    }
  },
  onReloadSaved(){
    let hasEvents = this.daSchedule.hasEventsForDate()
    //console.log('onReloadSaved',hasEvents)
    
      let doCancel = () => {
        console.log('Aborting reload!', this.currentDate,hasEvents)
        
      }
      let doOverwrite = () => {
        
        let res = this.daSchedule.loadEvtsForDay(false)
        if(!res.canContinue){
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            console.log('onReloadSaved::OVERLAPS',res.overlaps)
            this.handleOverlaps(res.overlaps,'view')
          }else{
            this.doNotify(`Reloaded schedule for ${this.currentDate}`, "positive") //,'bottom'
            
            if(this.isViewingPast() || this.currentDate != today()) { //adjustTime for past && futur 
              //console.log("adjusting time for past/future", this.currentDate) //,this.scheduledEvents.length)
              this.adjustCurrentTime()
            }
          }
        }
        this.reset() //reloadSaved
      }
    
    if (this.daSchedule.getScheduledEvts().size > 0 && !this.isViewingPast()){
      let mess = hasEvents ? `Reload saved schedule of: ${this.currentDate} ?` : "Reset current Schedule?"
      this.confirmAction('',mess,"OK", doOverwrite, doCancel)
    } else {
      doOverwrite()
    }
  },
  onClearDay(){
    let hasSaved = this.daSchedule.hasEventsForDate()
      
    if(this.isViewingPast()){
      this.doNotify("Editing past is a no no!")
      return
    }
    
    this.daSchedule.resetSchedule(true)
    let mess = hasSaved ? `Cleared...Can still Reload saved` : `Resetting...`
    this.doNotify(mess, "warning",'top')
      
    this.reset() //clearDay

    this.daSchedule.toggleActionBtns(hasSaved,'view') //enable saveBtn if hadSavedEvts!

    this.daSchedule.showClearBtn = false //overwrite toggleActionBtns above...
  },
  onLoadDefault(){
    //this.daSchedule.toggle()

      let doOk = (opt) => {
        let res = this.daSchedule.scheduleDefaults(opt.choice,opt.skipOCheck) //flag
        //this.doLog('onLoadDefault with opt',opt)
        if(!res.canContinue){
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            res?.added > 0 ? this.doNotify(`${res?.added} Default Evts added ${res?.noTime ? "Plus "+res?.noTime+" Without time":""} BUT some Overlaps to fix!`, "warning") : ''
            return this.handleOverlaps(res.overlaps,'byDefaults')
          }
          this.doNotify(`Empty as No Defaults :(`, "warning")//,'bottom')//-toTest***
        }else{//allGood prolly...
          this.doNotify(`Defaults added ${res?.added} ...doSave eh`, "info")
        // console.log("onLoadDefault::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
        }
        currentSched > 0 || res?.added > 0 ? this.daSchedule.toggleActionBtns(true,'byDefaults') : console.log("onLoadDefault::no Evts and no toggling for flag>> ",opt.choice,res?.added)
      }

    let currentSched = this.daSchedule.getScheduledEvts().size
    let e = this.daSchedule.unscheduledDefaults()
    if (currentSched > 0 || e?.length > 7){

      let labels = [{label: `Add ${e?.length} Default Evts to current schedule`,value: 'add'}]
       
      currentSched > 0 ? labels.push({label: `Reset and schedule All Defaults`,value: 'reset'}) : '' //console.log("onLoadDefault::no Reset option",currentSched,this.daSchedule.isViewingToday())


      //confirmChoiceDialog
      this.scheduleByDialog('Schedule Default Evts', //Warning!!'
      '', //`Current: ${this.currentDate} already have scheduled Events...`
      labels, 
      '',
      function(d){doOk(d)}, 
      function(){console.log('onLoadDefaults::Aborting')})//doCancel() to access >> this.currentDate
    
    } else {
      doOk({choice:'reset', skipOCheck:!this.isViewingToday()}) //reset
    }
  },
  doReload(flag,comparison,choice){
    //console.log('doReload',flag,comparison,choice)
    this.daSchedule.onScheduleBy(flag,comparison,choice)
    flag == 'score' ? this.doReloadWithScore() : this.doReloadWithPrio()
  },
  onChoosenPrio(e){ //redundant--toRemove**
    console.log('onChoosenPrio::ERROR?!?',e) //,this.daSchedule.chosenPrio
    //this.daSchedule.onChoosenPrio(e) 
  },
  currentScheduleBySign(from){
    return from == 'score' ? this.daSchedule.bySign?.score?.label || '' : this.daSchedule.bySign?.prio?.label || '' //umm '' ? toReview** 
  },
  doReloadWithPrio(){
    //console.log('doReloadWithPrio')
    let currentPrio = this.daSchedule.chosenPrio

    if (currentPrio == null) { //kinda redundant with disable flag...mais bon just in case...
      this.doNotify("Ayo select a priority!")
      return
    }

      let doCancel = () => { //do cancel 
        //console.log('doReloadWithPrio..cancelling') //this.scheduledEvents
        this.reset() //reloadWithPrio
        return
      }
      let doAction = (opt) => {
        let res = this.daSchedule.scheduleSamePrio(opt.choice,opt.skipOCheck)//flag
        //this.doLog('doReloadWithPrio with opt',opt)
        if(!res.canContinue){
          //console.log("scheduleSamePrio::OVERLAPS?",JSON.parse(JSON.stringify(res)))
          //this.doLog("doReloadWithPrio::OVERLAPS "+res?.added,res.overlaps)
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            res?.added > 0 ? this.doNotify(`${res?.added} Evts added ${res?.noTime ? "Plus "+res?.noTime+" Without time":""} BUT some Overlaps to fix!`, "warning") : ''
            return this.handleOverlaps(res.overlaps,'byPrio')
          }
          this.doNotify(`No Evts with Priority ${compSign} ${currentPrio} :(`, "warning",'top')
        }else{//allGood no overlap //By ${flag} >> 
          this.doNotify(`${res?.added} Evts with Priority ${compSign} ${currentPrio} ...doSave eh`, "info") 
          //console.log("doReloadWithPrio::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
        }
        currentSched > 0 || res?.added > 0 ? this.daSchedule.toggleActionBtns(true,'byPrio') : console.log("doReloadWithPrio::no Evts and no toggling for flag>> ",opt.choice,res?.added)
      }

    let options = this.daSchedule.byPrio  //some calculations for proper options >> i.e: no add option when already scheduled or no evt with chosenPrio found
    let compSign = this.currentScheduleBySign('prio')
    let currentSched = this.daSchedule.getScheduledEvts().size
    let mess = `By Goal's Parent Priority ${compSign} ${currentPrio}` //==
    let labels = []

    if(!options){ //shouldnt happen?!?
      console.log("doReloadWithPrio::ERROR? >> no options",options)
      labels = this.defaultScheduleByOpts()

      this.scheduleByDialog('Schedule by Priority',
      mess,
      labels,
      '',
      doAction,
      doCancel)

      return
    }

    
    let showFilter = options?.filter?.length > 0 && options?.filter?.length != currentSched //skip filter when it results in no change
    let showReset = options?.reset?.length > 0 && currentSched > 0 //skip reset when nothing scheduled
    showFilter ? labels.push({label: `Filter out of ${currentSched} scheduled to ${options?.filter?.length} Evts`,value: 'filter' }) : '' //console.log("doReloadWithPrio::FILTER option skipped",options?.filter?.length,currentSched)  //with priority == ${currentPrio} //no false value as empty string evaluates to it...smh!  
    options?.toAdd?.length > 0 ? labels.push({label: `Add ${options?.toAdd?.length} Evts to current schedule`,value: 'add'}) : '' //whose priority == ${currentPrio}
    showReset ? labels.push({label: `Reset current and schedule ${options?.reset?.length} Evts.`,value: 'reset'}) : '' //whose priority == ${currentPrio}  //oldie >> 'overwrite'
    
    //when No Evts as all options above are 0 >> no need to continue.
    if (!labels.length > 0){
      //this.doLog("doReloadWithPrio::No options!! currentSched= "+currentSched,options)
      this.doNotify(`No Evts with Priority ${compSign} ${currentPrio} :(`, "warning",'top')
      return
    }

    if (currentSched > 0){
      this.scheduleByDialog('Reload by Priority',
        mess, //`With Parent Goal's priority == `+currentPrio,
        labels,
        '',
        doAction,
        doCancel)
    } else {
      options?.toAdd?.length > 7 ? this.scheduleByDialog('Schedule by Priority',
        mess, //`With Parent Goal's priority == `+currentPrio,
        labels,
        '',
        doAction,
        doCancel) :  doAction({choice:'reset', skipOCheck:!this.isViewingToday()})//nothing scheduled> just 'reset'
    }
      
      //not allow reclick without changing prio again...
      this.daSchedule.disablePrioBtn = true 
  },
  onChoosenScore(e){//redundant--toRemove**
    console.log('onChoosenScore::ERROR?',e) //this.daSchedule.chosenScore
    //this.daSchedule.onChoosenScore(e)  
  },
  onScheduleByScore(toAdd,skipOvCheck = false){ //skipOvCheck flag to skip handling overlaps!!--redundant tho...
    let extraO = []
    let oneToMany = false //flag to slow things down...
    let resoCompleted = null //same as above to slow things down...
    const c = this.daSchedule //huh works
    let defaultOpts = () =>{//= []
      return [
        { label:"Keep Evt with Highest Priority", value: 'opt1', color: 'secondary'},
        { label: 'Manually Choose one event', value: 'opt3' }
      ]
    }
    const findhighestPrio = allEvts => {
      return this.findhighestPrio(allEvts)
    }
    const evtLabel= (evt,from) =>{
      return this.betterEvtLabel(evt,from,false)
    }
    let chooseOneEvt = (conflictEvts,toAdd,update) => {
      //const c = this.daSchedule //work? >>yup!!
      this.confirmChoiceDialog(
        '',
        'Choose which Event to keep',
        conflictEvts.map(e => evtLabel(e,'default')), //oldie >> this.getEvtLabel(e,false) //could pass targetStart instead of false? toSee**
        '',
        function(d){ //onOk
          let e = conflictEvts.find(x => x.id == d)
          //if(e){
            //toKeep.push(e)
            //choices.set(e.id,"By pick,")
          if(!e){console.log('chooseOneEvt::ERROR NOT FOUND!!',d);return} //can this happen?!? toMonitor**
          if (toAdd.id == e.id){//remove scheduled as adding target
            conflictEvts.forEach((obj) => {
              obj.id != e.id ? c.removeScheduledEvt(obj) : ''
            })
            let added = c.addToSchedule(toAdd,!skipOvCheck,false) //!skipOvCheck
            console.log('chooseOneEvt::ADDED',d,update,added)
            //todo** handle any potensh Overlap!
          }else{ //remove some scheduled--no adding target
            conflictEvts.forEach((obj) => {
              toAdd.id == obj.id ? console.log('chooseOneEvt,not adding target',obj.id,e.id) : obj.id != e.id ? c.removeScheduledEvt(obj) : console.log('chooseOneEvt,not adding scheduled',obj.id,e.id)
            })
          }
          update = d //update? nope loses reference to original
          return update //e
        },
        null, //onCancel--no need as have to choose!!!
        function(){//onDismiss
          //onDismissy('chooseOneEvt::>>byPick...')
          console.log('onScheduleByScore::onDismiss >>chooseOne',update,resoCompleted)
          //update = opt //set late late
          //set resoCompleted here? as doesnt go to next Overlap >> stuck in that interval check!!
          resoCompleted = update

        })
    }

    //add sorted by time..
    //this.doLog("onScheduleByScore::doSortingByTime--BEFORE",toAdd)
    toAdd.sort(function(a, b){return parseTime(a.time) - parseTime(b.time)})
    //this.doLog("onScheduleByScore::doSortingByTime--AFTER",toAdd)

    toAdd.forEach((item, index, array) => {
      //todo** scroll to time...IF not skipOvCheck
      let added = c.addToSchedule(item,!skipOvCheck,false) //checkOverlap 
      if (added && Array.isArray(added)){
        //when added.length > 1 >>oneToMany >>handle overlap
        //when added.length == 1 >>manyToOne >> add to extraO and handle later in case of multiple
        //this.doLog("onScheduleByScore::manyToOne for: "+item?.id,added)
        if( added.length > 1) {
          //>>oneToMany >>handle overlap immediately..
          console.log('onScheduleByScore::OVERLAP >> oneToMany',item,added)
          oneToMany = true
          let tTime = null
          if (added.find(item => item[0] == "oneToMany")){
            added = added.filter(item => item[0] != "oneToMany")
            for (let i = 0; i < added.length; i++){
              let key = added[i][0] //todo** check that same key as in >> hasWithID.find(id => id == key)
              let toH = added[i][1]
              tTime = toH[0].targetStart
              this.scrollToTime(tTime, 'slow') //toSee**
              let labely = []
              let allEvts = []
              let hasSurr = false
              //let j = toH.length - 1  // for (; j >= 0; j--){} //start from back-bof no point here
              while (toH.length){
                const aConf = toH.pop()
                let aScheduled = this.daSchedule.findSchedEvent(aConf.inConflict)
                labely.push(`(${aScheduled?.id}) '${aScheduled?.title.trim()}'`)
                item.id != aConf.target ? console.log("onScheduleByScore::ERROR ERROR:: NOT same target ID?!?",item,aConf) : ''
                allEvts.push(aScheduled)
                aConf.direction == 'surrounding' ? hasSurr = true : hasSurr = hasSurr
              }
              allEvts.unshift(item) //unshift toAdd

              //bon too much?
              let mess = `Adding (${item?.id}) '${item?.title.trim()}' at ${whenFrmtTime(item?.time)} Conflicts with scheduled ${labely.join(' and ')}. ` //\n ${cancel}
              
              let labOpts = defaultOpts()
              !hasSurr ? labOpts.push({ label: `Force in > '${item?.title.trim()}' ?`, value: 'opt4'}) : ''
              
              this.confirmChoiceDialog(
              'OneToMany Conflicts',
              mess,
              labOpts,
              '',
              function(opt){
               //console.log('onScheduleByScore::choice >>',opt)
               switch (opt) { //no opt2 as in score
                case 'opt1':
                  let a = findhighestPrio(allEvts)
                  console.log('onScheduleByScore::ByPriority >> AUTO ',a.e.id,a?.e?.title.trim()) //, a.score,a.details,//JSON.parse(JSON.stringify(cIDs))
                  //toKeep.push(a.e)
                  //choices.set(a.e.id,`By Highest Priority (${a.prio}),`)

                  if (item.id == a.e.id){//remove scheduled as adding target
                    allEvts.forEach((obj) => {
                      obj.id != a.e.id ? c.removeScheduledEvt(obj) : ''
                    })
                    let added = c.addToSchedule(item,!skipOvCheck,false) //!skipOvCheck
                    console.log('onScheduleByScore::ByPriority>>ADDED',resoCompleted,added)
                    //todo** handle any potensh Overlap!
                  }else{ //remove some scheduled
                    allEvts.forEach((obj) => {
                      obj.id != a.e.id ? c.removeScheduledEvt(obj) : console.log('onScheduleByScore::ByPrio,not adding target?',obj.id,a.e.id)
                    })
                  }
                  resoCompleted = opt //check that done conflict reso with flag>>huh works!!
                  return
                case 'opt4': //forceIn
                  let e = allEvts.find(x => x.id != item.id)
                  c.recurChangeTime(e.id,item,tTime,true)
                  resoCompleted = opt //check that done conflict reso with flag>>huh works!!
                  return
                default://default is manual choose == case 'opt3':
                  //let e = 
                  chooseOneEvt(allEvts,item,resoCompleted)
                  //console.log('onScheduleByScore::ByChoice',e) //waits? >>nope 
                  //resoCompleted = opt 
                  return
               }
              },
              null, //onCancel...keep as is--todo**
              function(){ 
                console.log('onScheduleByScore::onDismiss >> OneToMany',resoCompleted)
                //prolly reset resoCompleted flag in case of multiple? toSee**
              })
            }
          }else{//could below happen?!? toMonitor***
            console.log('onScheduleByScore::OVERLAP! ERROR not oneToMany?!?',added)
          }
        }else{
          extraO.push(...added)
        }
      }else {
        //not added >>toReview**
        added === true ? "" : console.log('onScheduleByScore::adding...FAILED?>>',item,added)
      }
    })

    const doContinue = () =>{
      this.doLog("onScheduleByScore::doContinue",extraO)
      if(extraO.length > 0){
        this.doNotify(`${extraO.length} EXTRA Overlaps to fix!`, "negative",'top')
        //return this.handleOverlaps(c.massageManyToOneOverlaps(extraO),'byScore') //WRONG-
      }
      this.doNotify("Added byScore!..doSave eh", "info",'top')
    }
    //runs too fast tho...see with timeout...
    if(oneToMany){//setTimeout
      let intervalId = setInterval(() => {
        if (resoCompleted){
          setTimeout(() => { clearInterval(intervalId)}, 0); //console.log('onScheduleByScore::timeout>>DONE',resoCompleted,extraO.length )
          doContinue()
          /*if(extraO.length > 0){
            this.doNotify("EXTRA Overlaps to fix!", "negative",'top')
            return this.handleOverlaps(this.daSchedule.massageManyToOneOverlaps(extraO),'byScore')
          }
          this.doNotify("Added byScore!..doSave eh", "info",'top')*/
          
        }//else{ //just to see...important to clear interval or keeps trying!!
         // console.log('onScheduleByScore::timeout>>NOT done!!',resoCompleted,extraO.length)
        //}
        //return extraO.length > 0 ? this.daSchedule.massageManyToOneOverlaps(extraO) : this.doNotify("Added byScore!..doSave eh", "info",'top')
      }, 3000)
    }else{
      doContinue()
    }
    /* gets here too fast!
    let overlaps = this.daSchedule.massageManyToOneOverlaps(extraO)
    this.doLog('onScheduleByScore::OVERLAPS >>',overlaps)
    if(overlaps.length > 0){
      this.doNotify("EXTRA Overlaps to fix!", "negative",'top')
      return this.handleOverlaps(overlaps,'byScore')
    }
    this.doNotify("Added byScore!..doSave eh", "info",'top')*/
  },
  doReloadWithScore(){
    //console.log('doReloadWithScore')
    let currentScore = this.daSchedule.chosenScore

    if (currentScore == null) { //this.daSchedule.chosenScore
      this.doNotify("Ayo select a score!")
      return
    }

      let doCancel = () => { //do cancel
        //console.log('doReloadWithScore..cancelling')//,this.daSchedule.getAllEvts())
        this.reset() //reloadWithScore
        return
      }
      let doAction = (opt) => { //flag
       
        //console.log("scheduleByScore:: ",opt) //,options

        //bon this.onScheduleByScore() not even needed!! >>yup with latest changes...nice tho..
        
        //opt.choice != 'add' ? this.daSchedule.resetSchedule() : '' //resetSchedule for filter || reset

        //opt.choice == 'add' ?  this.onScheduleByScore(options?.toAdd,opt.oCheck) : opt.choice == 'reset' ? this.onScheduleByScore(options?.reset,opt.oCheck) : this.onScheduleByScore(options?.filter,opt.oCheck)

        let res = this.daSchedule.scheduleByScore(opt.choice,opt.skipOCheck)
        
        if(!res.canContinue){ //&& !anyOverlap.overlaps
          //console.log("scheduleByScore::OVERLAPS?",JSON.parse(JSON.stringify(res)))
          //this.doLog("doReloadWithScore::OVERLAPS! added: "+res?.added,res.overlaps)
          if(res.overlaps && Object.keys(res.overlaps).length > 0){
            res?.added > 0 ? this.doNotify(`${res?.added} Evts added ${res?.noTime ? "Plus "+res?.noTime+" Without time":""} BUT some Overlaps to fix!`, "warning") : '' //Interval Score <= ${currentScore}
            return this.handleOverlaps(res.overlaps,'byScore')
          }
          this.doNotify(`No Evts with Interval Score ${compSign} ${currentScore} :(`, "warning")//,'bottom')
        }else{//allGood no overlap prolly... via ${flag} 
          this.doNotify(`${res?.added} Evts with Interval Score ${compSign} ${currentScore} ...doSave eh`, "info")
          //console.log("doReloadWithScore::Continue. ACTION Res>>",JSON.parse(JSON.stringify(res)))
        }
       
        currentSched > 0 || res?.added > 0 ? this.daSchedule.toggleActionBtns(true,'byScore') : console.log("doReloadWithScore::no Evts and no toggling for flag>> ",opt.choice,res?.added)
      }

    let options = this.daSchedule.byScore
    let compSign = this.currentScheduleBySign('score')
    let currentSched = this.daSchedule.getScheduledEvts().size
    let mess = `Goals with Interval Score ${compSign} ${currentScore}` //<= //`With Goal Evts of Interval Score <= ${currentScore}`
    let labels = []
    
    if(!options){ //shouldnt happen?!?
      console.log("doReloadWithScore::ERROR? >> no options",options)
      labels = this.defaultScheduleByOpts()

      this.scheduleByDialog('Schedule by Score',
      mess,
      labels,  //ugly word break when labels too long...also reason for empty title
      '',
      doAction,
      doCancel)

      return
    }

    
    let showFilter = options?.filter?.length > 0 && options?.filter?.length != currentSched //skip filter when result in no changes
    let showReset = options?.reset?.length > 0 && currentSched > 0 //skip reset when nothing scheduled
    showFilter ? labels.push({label: `Filter out of ${currentSched} scheduled to ${options?.filter?.length} Evts`,value: 'filter'}) : '' //console.log("doReloadWithScore::FILTER option skipped",options?.filter?.length,options?.reset?.length,currentSched)  //for Interval Score <= ${currentScore}
    options?.toAdd?.length > 0 ? labels.push({label: `Add ${options?.toAdd?.length} Evts to current schedule.`,value: 'add'}) : '' //whose Interval Score <= ${currentScore}
    showReset ? labels.push({label: `Reset current and schedule ${options?.reset?.length} Evts.`,value: 'reset'}) : '' // whose Interval Score <= ${currentScore} //oldie>> overwrite
    
    //when No Evts as all options above are 0 >> no need to continue.
    if (!labels.length > 0){
      //this.doLog("doReloadWithScore::No options!! currentSched= "+currentSched,options)
      this.doNotify(`No Evts with Interval Score ${compSign} ${currentScore} :(`, "warning")
      return
    }

    if (currentSched > 0) {
      //let labels = [] //defaultScheduleByOpts()

      //oldie >> confirmChoiceDialog
      this.scheduleByDialog('Reload by Score',
      mess, //'Goals with Interval Score <= '+currentScore, 
      labels,  //ugly word break when labels too long...also reason for empty title
      '',
      doAction,
      doCancel)

    } else{ //no scheduled--just overwrite--still offer for too many add..especially skipOCheck when in future...
      options?.toAdd?.length > 10 ? this.scheduleByDialog('Schedule by Score',
      mess,
      labels,
      '',
      doAction,
      doCancel) : doAction({choice:'reset', skipOCheck:!this.isViewingToday()}) //'reset'
    }

    //no reclick without changing score again...todo>>use toggle() function?
    this.daSchedule.disableScoreBtn = true
      
  },
  doSaveSchedule(){
    let currentSched = this.daSchedule.getScheduledEvts().size
    if (!currentSched > 0 && !this.daSchedule.hasEventsForDate()) {
      this.doNotify(`Nothing to Save :(`, "warning")
      return
    }
  
    let noTimes = this.labelScheduled()?.noTime
    this.daSchedule.saveDaySchedule()

    let mess = `Schedule saved for ${this.currentDate}`
    noTimes ? mess+= ` \nExcept for ${noTimes} without time!` : ''
    this.doNotify(mess, noTimes ? "info" : "positive")
    //this.$q.notify({}) //just to hide it faster esti>>meh weird notif in bottom
    
    //this.dismissy() //prolly this one?

    this.resetFilter() //meh
  },
  addNewToSchedule(targetDrop, item){
    //console.log("addNewToSchedule: ",targetDrop, item)
    //have to check that not present already before add..
    let d = this.daSchedule.findSchedEvent(item.id)
    if (d) {
      this.doNotify(`${d?.title} is already scheduled`)
      this.doCleanup()
      this.reset() //addNewToSchedule
      return
    }

    //let canDrop = this.daSchedule.canDropEvent(targetDrop, item) //meh pointless...just add
    
    let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...item,time:targetDrop.time}],this.isViewingToday()||this.isViewingPast())
    if (euhOverlaps.length > 0){
      //this.doLog(`addNewToSchedule::Overlaps!! `+this.isViewingPast(),euhOverlaps)
      ///No overlaps in past
      if(this.isViewingPast()){
        let mess = `No Overlaps allowed in past!!`
        let cap = `Evt '${item?.title.trim()}' NOT added.`
        this.doNotifyCaption(mess, cap, "warning")
        this.doCleanup()
        this.reset()
        return
      }
      return this.handleOverlaps(euhOverlaps,'addNew')
    }

    if(this.isViewingPast()){ //auto-save in past!
      this.daSchedule.saveDaySchedule()
      this.doNotify(`${item?.title} Added and Schedule saved!`,'info')
      return
    }
    
    this.doNotify(`${item?.title} Added!..doSave eh`,"positive")
    this.daSchedule.toggleActionBtns(true,'addNew')
    this.doCleanup()
    
  },
  doDroppy(targetDrop, draggedItem){
    //console.log("doDroppy: ",targetDrop, draggedItem)

    if(targetDrop && draggedItem){
      let dragged = draggedItem.evt
      let isClose = this.daSchedule.tooClose(targetDrop, dragged.duration)
      if(isClose){
        //console.log("doDroppy::tooClose to>>",isClose) //could happen when dropping next to scheduled...
        if(isClose === true){
          this.doNotify("Dropping event TOO close to midnight!")
          this.reset() //onDrop
          return
        }
        console.log("doDroppy::tooClose OVERLAP?",JSON.stringify(isClose))
        //canDropEvent below could be skipped by checking this--toDo**
      }

      if (draggedItem.type == 'tree-item'){
        return this.addNewToSchedule(targetDrop, dragged)
      }

      let canDrop =  this.daSchedule.canDropEvent(targetDrop, dragged)
      
      if (canDrop.canContinue){ //&& canDrop.overlaps == null){
        let confirmAsk = dragged?.inDefaults || !dragged?.canMove
        let orig = this.daSchedule.getOriginalEvtTime(dragged.id) //also skip ask if originalTime is different? >>meh
        let skipNoTime = !orig || dragged?.time == ''
        //console.log("doDroppy: ",draggedItem.time,orig,!skipNoTime, confirmAsk)
        if (confirmAsk && !skipNoTime){
          let pre = dragged?.inDefaults ? "Default at " : "Cannot Move from " 
          let mess = [`Evt "${dragged.title.trim()}" ${pre} ${whenFrmtTime(orig)}.`, // draggedItem.time>>misleading time >>have to use orig
          `\nAlso Save Evt default time to ${whenFrmtTime(targetDrop.time)}?`,
          //"\nCancel or Dismiss to undo!", //\n\u2800\n
          `\nCancel or No selection to keep at ${whenFrmtTime(dragged.time)}`
          ].join('\n')

          const c = this.daSchedule  //huh works for below to keep context!!
          const clean = this.doCleanup
          this.confirmTimeChange(`${dragged?.inDefaults ? "Changing Default Evt's time" : "Evt's Cannot move"}`,
            mess, 
            "Change", //okBtn
            `Temp.Move`,//`Temp.${doAdd ? 'Add':'Move'}`, //altbtn //oldie >>"Temp.Move"
            function(d){c.changeEvtTime(dragged, targetDrop,d);c.toggleActionBtns(true,'doDroppy'),clean()}, //onOk  //userChoice(d,evt,doAdd)
            function(){clean()}, //onCancel...
            function(){console.log(`doDroppy::onDismiss..keep as is>> ${dragged.id})'${dragged.title.trim()}'`); clean()}
            //onDismiss/...should prolly remove it actually!--or leave at default time?!?
            )
        }else{ //skip asking user...
          this.daSchedule.changeEvtTime(dragged, targetDrop,false)
          this.daSchedule.toggleActionBtns(true,'doDroppy')
          this.doCleanup()  //as interval below still have same color that shows up when moved again...should move below to always do**
        }
      
      }else{//overlaps
        //this.doLog("doDroppy::CANNOT Drop",canDrop)//JSON.parse(JSON.stringify(canDrop)))
        //this.movedIntoConflict(canDrop.overlaps,null,'onDrop') // better for single overlaps but too many options.//override flag null as better handled and transmitting from
        this.handleOverlaps(canDrop.overlaps,'onDrop')
      }
    } else{
      console.log("doDroppy null ERROR?", targetDrop,this.targetDrop, draggedItem, this.selectedItem)
      return
    }
  },
  titleIncludes(includer,included){

    return {
      includer: includer.trim().toLowerCase().includes(included.trim().toLowerCase()),
      included: included.trim().toLowerCase().includes(includer.trim().toLowerCase())
    }
  },
  canAutoSchedule(toAdd,sched){
      //case sensitive?!? >>yup includes is case-sensitive!
      //includes() doesnt do single word token search...prolly for the best! 
      //let toAddInclud = toAdd.title.trim().toLowerCase().includes(sched.title.trim().toLowerCase())
      //let scheduledInclud = sched.title.trim().toLowerCase().includes(toAdd.title.trim().toLowerCase())

      let titleCheck = this.titleIncludes(toAdd.title,sched.title)
      let toAddInclud = titleCheck.includer
      let scheduledInclud = titleCheck.included
      //check also for the parent relation?--toSee...especially if too much for no reason....
      let toAddPrt = this.daSchedule.parentGoalById(toAdd.parentGoal) //this.parentGoalsMap().get(toAdd.parentGoal)
      let scheduledPrt = this.daSchedule.parentGoalById(sched.parentGoal) //this.parentGoalsMap().get(currScheduled.parentGoal)
      
      //let toAddPrtInclud = toAdd.title.trim().toLowerCase().includes(scheduledPrt.title.trim().toLowerCase())
      //let scheduledPrtInclud = sched.title.trim().toLowerCase().includes(toAddPrt.title.trim().toLowerCase())
      let {pTitleInc,pTitleIncd}  = this.titleIncludes(toAdd.title,scheduledPrt.title)
      let {pSTitleInc,pSTitleIncd}  = this.titleIncludes(sched.title,toAddPrt.title)
      
      //if (pTitleCheck || pSTitleCheck){ //oldie but object can contains all false... 
      if(pTitleInc || pTitleIncd || pSTitleInc || pSTitleIncd){
        //should schedule the subGoal!!! (Next of 'Me Me' parent)
        // OR (if cant for any reason?!?)
        // one of the subGoals of the parent? (parentGoal 'Next' with subgoals-Jobs,Massage,PmP/Pilot,etc)
        //--which should be the one of scheduled or toAdd prolly
        //
        //console.log(`canAutoSchedule:: WOAH PARENT AUTO schedule?--TODO***`,this.mobile ? JSON.stringify(pTitleCheck): pTitleCheck,this.mobile ? JSON.stringify(pSTitleCheck) : pSTitleCheck)
        //toAddPrtInclud ? "toAdd: "+toAdd.title : toAddPrtInclud, scheduledPrtInclud ? "sched: "+sched.title : scheduledPrtInclud,"\nNormal AUTO>>", toAddInclud, scheduledInclud)//,'direction == surrounding? >>', aConf.direction == 'surrounding')
        console.log(`canAutoSchedule:: WOAH PARENT AUTO schedule?--TODO***`,toAdd.title+" <> "+sched.title,"Parents: "+toAddPrt.title+" <> "+scheduledPrt.title)
        console.log(`canAutoSchedule:: WOAH PARENT AUTO schedule >>`,pTitleInc,pTitleIncd,pSTitleInc,pSTitleIncd)
        //return ...auto-schedule...for parents!!
      }

      if (toAddInclud || scheduledInclud){
        //console.log(`checkIncludedTitles:: can AUTO schedule`,toAddInclud, scheduledInclud)//,'direction == surrounding? >>', aConf.direction == 'surrounding')
        return {
          addIncSched:toAddInclud,
          schdIncToAdd:scheduledInclud,
        }
      }
      return false //not too fast here? toTest**
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
      }
      const doRemove = (evt) => {
        //let hasMood = this.daSchedule.getCurrentMoods()[evt.id]
        console.log(`movedIntoConflict::doRemove ${evt.id}:${evt.title}`)//,hasMood)

        this.daSchedule.removeScheduledEvt(evt)//,hasMood) 
      }
      let onDismissy = (mess) => { //,id
        //console.log(mess,'from>>'+from,daChoice,id) //JSON.parse(JSON.stringify(c))
        console.log('onDismissy::from '+from,mess,daChoice)//[0], id)

        //should NOT enable even when no change...but meh
        //daChoice[0] == id ? this.daSchedule.toggleActionBtns(true,from) : console.log('onDismissy::no change '+from,mess,daChoice[0], id)
        //this.scheduleMoodsLabel //just in case

        this.doCleanup() //as target interval have bg color

        this.daSchedule.toggleActionBtns(true,from)
      }
      const removeReplace = (toRem,toAdd,aConf) => { 
        //at ${toAdd.time} with ovrd:${override}`, aConf)  //aConf.targetStart.date
        console.log(`movedIntoConflict::removeReplace >> replacing>> ${toRem.id}) '${toRem.title.trim()}' WITH ${toAdd.id}) ${toAdd.title.trim()}`, aConf, 'from>'+from)

        if(override){
          console.log("movedIntoConflict::removeReplace...OVERRIDE from>>"+from) //,JSON.parse(JSON.stringify(toAdd))
          if (from == 'onDrop'){//for consistency with okChoice....
            doRemove(toRem)
            return
          }

          console.log("movedIntoConflict::removeReplace....OVERRIDE updating..."+from)
         
          this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart)
          return
        }
      
        doRemove(toRem)

        if(from == 'onDrop'){
          console.log("movedIntoConflict::removeReplace for onDrop...just updating schedule",toAdd.id,aConf.targetStart.time)
           this.daSchedule.doUpdateSchedule(toAdd,aConf.targetStart)
        }else {
          console.log(`movedIntoConflict::removeReplace >>addGoalsToSchedule from `+from)

          let toAddy = this.daSchedule.getStoredRawEvt(aConf.target)
          if (toAddy){
            let oldy = JSON.parse(JSON.stringify(toAdd))
            Object.assign(toAdd, toAddy,{time:aConf.targetStart.time}) // enrich with saved
            //console.log(`movedIntoConflict::removeReplace:: has SAVED!`+toAdd.id,aConf.target,oldy.time,oldy) //toAddy,oldy,JSON.parse(JSON.stringify(toAdd)))
          }
          //makes more sense than invoking recurChangeTime()
          let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:aConf.targetStart.time}],true)
          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`movedIntoConflict::removeReplace:: OVERLAPS again of size:${sizey} from >${from}>`+toAdd.title,JSON.parse(JSON.stringify(euhOverlaps)))
            
            //Note*** see with adding 'nah' that no more circles--should be less prolly with recurChangeTime()
            this.doNotify(`Extra Overlaps while removing to add '${toAdd.title.trim()}' `, "warning",'top')
            return this.movedIntoConflict(euhOverlaps,override,from+'nah') //handleOverlaps
          }
        }
        return
      }
      const forceAddMins = (toChange,aConf) => {
        let addTo = this.daSchedule.findSchedEvent(aConf.target) //findEvent
        if (!addTo){console.log(`movedIntoConflict::forceAddMins>>NOT FOUND?!?`,aConf.target);return} //shouldnt happen
        
        let toAddy = this.daSchedule.getStoredRawEvt(aConf.target)
        if (toAddy){
          let newDura = addTo.duration + parseInt(addMins)
          let oldy = JSON.parse(JSON.stringify(addTo))
          Object.assign(addTo, toAddy, { duration: newDura })
          //console.log(`movedIntoConflict::forceAddMins>> HAD SAVED*** for:`+addTo.id,oldy)//newDura,toAddy,oldy,JSON.parse(JSON.stringify(addTo)))
        }else{ // could use toAddy addin!!--shouldnt happen >>could if just newly added?..toMonitor
          console.log(`movedIntoConflict::forceAddMins >>NEWLY ADDED?!? Error?`,addTo.id,addTo,toAddy)
          Object.assign(addTo, { duration: newDura })
        }

        this.daSchedule.recurChangeTime(toChange.id,addTo,aConf.targetStart,false,this.doNotify) 

        this.doSaveSchedule() //this.daSchedule.saveDaySchedule()
        return
      }
      const forceAdd = (toChange, toAdd,conf) => {
        console.log(`movedIntoConflict::forceAdd:${from} >>${toAdd.id})'${toAdd.title}' at ${toAdd.time} to ${conf.targetStart.time}
        \nChanging >>${toChange.id} from ${toChange.time}`)//,toAddy)

        let toAddy = this.daSchedule.getStoredRawEvt(conf.target) //to not carry it around so much
        if (toAddy){
          let oldy = JSON.parse(JSON.stringify(toAdd))
          Object.assign(toAdd, toAddy,{time:conf.targetStart.time}) // enrich with saved
          //console.log(`movedIntoConflict::forceAdd:: had SAVED! `+from,toAdd.id,oldy) //toAddy,oldy,JSON.parse(JSON.stringify(toAdd)))
        }
        
        //doAdd flag important for small time interval jump
        let euhOverlaps = this.daSchedule.recurChangeTime(toChange.id,toAdd,conf.targetStart,from != 'onDrop',this.doNotify)
        //}else{
        if(euhOverlaps){
          let sizey = Object.keys(euhOverlaps).length
          if(sizey > 0) {
            console.log(`movedIntoConflict::forceAdd:: OVERLAPS again of size:${sizey} from >${from}>`+toAdd.title,JSON.parse(JSON.stringify(euhOverlaps)))
            
            //Note*** see with adding 'nah' that no more circles--should be less prolly with recurChangeTime()
            this.doNotify(`Extra Overlaps while adding '${toAdd.title.trim()}'`, "negative",'top')
            return this.movedIntoConflict(euhOverlaps,override,from+'nah') //handleOverlaps
          }
        }

        //this.daSchedule.toggleActionBtns(true,from)
        onDismissy("ForceAdd") //does above and potensh cleanup
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

          if(from == 'onDrop'){ //oldie checked override but should remove  onDrop
            doRemove(toAdd)
          }
        }
      }
      let cancelChoice = (toAdd,currScheduled) => {
        if(override){
          console.log("movedIntoConflict::cancelChoice::OVERRIDE...coolios!!from:"+from,toAdd.title.trim())

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
      const resolveChoice = (opt,toAdd,currScheduled,aConf) => {
        if (opt =='opt3') { //pick Evt
          let m = 'Pick one event...'
          let labels = [
            {label: evtLabels(toAdd,'def'),value: toAdd.id, color: 'secondary' }, 
            {label: evtLabels(currScheduled,'def'),value: currScheduled.id } 
          ]

          this.confirmChoiceDialog('',
            m,
            labels,
            '',
            function(d){onOkChoice("Choice",d,toAdd,currScheduled,aConf)}, 
            null, //second dialog shouldnt have cancel...//oldie >> function(){console.log("chooseEvt::by Event...cancelling");daChoice.push('cancel')}, //daChoice = 'cancel' //cancelChoice(toAdd,currScheduled)
            function(){onDismissy('resolveChoice::byEvent... dismissing')} //,toAdd.id
          )
          //console.log("chooseEvt::by Event...returnin...",daChoice) //runs first
          //return daChoice
        } else if (opt =='opt2'){ //by Score
          let m = 'Pick event by Score'
          let labels = [
            {label: evtLabels(toAdd,'score'),value: toAdd.id,color: 'secondary' },
            {label: evtLabels(currScheduled,'score'), value: currScheduled.id } 
          ]
          
          this.confirmChoiceDialog('',
            m,
            labels,
            '',
            function(d){onOkChoice("Score",d,toAdd,currScheduled,aConf)}, 
            null, //second dialog shouldnt have cancel..
            function(){onDismissy('resolveChoice::byScore... dismissing')} //,toAdd.id
          )
          //console.log("chooseEvt::by Score...returnin...",daChoice) >> dont run too fast? >>does!
          //return daChoice
        } else if (opt =='opt1'){ //by Priority
          let m = 'Pick event by Priority'
          let labels = [
            {label: evtLabels(toAdd,'prio'),value: toAdd.id, color: 'secondary' }, 
            {label: evtLabels(currScheduled,'prio'),value: currScheduled.id } 
          ]

          this.confirmChoiceDialog('',
            m,
            labels,
            '',
            function(d){onOkChoice("Priority",d,toAdd,currScheduled,aConf)},
            null, //second dialog shouldnt have cancel prolly...//oldie >> function(){console.log("chooseEvt::by Priority...cancelling");daChoice.push('cancel')}, //cancelChoice(toAdd,currScheduled)
            function(){onDismissy('resolveChoice::byPriority... dismissing')} //,toAdd.id
          )
          //console.log("chooseEvt::by Priority...returnin...",daChoice) >> dont run too fast? >>does!
          //return daChoice
        } else if (opt =='opt0'){ //euh...drop==opt0
          console.log("resolveChoice::it's a drop?...keeping as is....",from)
          //cancelChoice(toAdd,currScheduled)
          aNotif(`Umm...keeping as is then!`)
          this.doCleanup()
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

        let mess = `${from == 'onDrop'? "Moving":"Adding"} '${toAdd.title.trim()}' at ${whenFrmtTime(aConf.targetStart.time)} Overlaps with Scheduled '${currScheduled.title.trim()}' at ${whenFrmtTime(currScheduled?.time)}.
        \nCancel to keep '${currScheduled.title.trim()}' ` // ${whenFrmtTime(toAdd?.time)}
      
        let title = autoSolve ? 'Choose Auto Resolution' : 'Resolve Overlapping Events'
        this.confirmChoiceDialog(title,
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
    let toHandleSize = Object.keys(overlaps).length

    let hasWithID = overlaps.find(item => item[0] == "oneToMany") //shouldnt with changes...
    
    //do same keys reverse as in handleOverlaps() ? toSee**
    for (let i = 0; i < toHandleSize; i++) { //oldie >> for (let key in overlaps) {
      let key = overlaps[i][0]

      if (key == "oneToMany"){
        console.log("movedIntoConflict...skipping oneToMany key",key,overlaps["oneToMany"])
        continue
      }

      let toH = overlaps[i][1] //overlaps[key]
      /*if (toH.length > 1) { //umm still here eh smh....
        if (hasWithID){ //oldie when {} >> "oneToMany" in overlaps
          let hasWith =  hasWithID[1].find(id => id == key) //overlaps["oneToMany"].find(id => id == key)
          if (hasWith){
            console.log(`movedIntoConflict::WITHID>>using oneToManyConflict as ${toH.length} of`+toHandleSize,hasWith)//JSON.parse(JSON.stringify(toH)))
            //this.oneToManyConflict(toH,override,from)
            this.fixConflicts(toH,from,true,toHandleSize-1) //toHandleSize - 1 for extra oneToMany
          }else {
            console.log(`movedIntoConflict::WITHID>>using manyToOneConflictas ${toH.length} of`+toHandleSize,hasWith)//overlaps["oneToMany"] //JSON.parse(JSON.stringify(toH)))
            //this.manyToOneConflict(toH,override,from)
            this.fixConflicts(toH,from,false,toHandleSize-1) //toHandleSize - 1 for extra oneToMany
          }
          continue
        }
        console.log(`movedIntoConflict::NORMAL>>using manyToOneConflictas ${toH.length} of`+toHandleSize,hasWithID)//overlaps["oneToMany"] //JSON.parse(JSON.stringify(toH)))
        //this.manyToOneConflict(toH,override,from)
        this.fixConflicts(toH,from,false,toHandleSize)
        continue
      }*/


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
      let currScheduled = this.daSchedule.findSchedEvent(aConf.inConflict)  //findEvent

      if (!currScheduled || !toAdd ){console.log("movedIntoConflict...ERROR ERROR no evts found!!!",aConf);return}

      let canAutoSolve = this.canAutoSchedule(toAdd,currScheduled)
     
      if (from == 'onAddMins'){ //just ask to move conflict evt down
        let reason = currScheduled?.inDefaults ? "In Defaults" : !currScheduled?.canMove ? "Cannot move" : "" //umm last one shouldnt be empty?
        //|| !currScheduled?.canMove
        //console.log("movedIntoConflict::onAddMins"+canAutoSolve,reason)

        let mess = `Adding ${addMins} mins to "${toAdd.title.trim()}" Overlaps with Scheduled "${currScheduled.title.trim()}" at ${whenFrmtTime(currScheduled.time)} as ${reason}.
          \nForce?
          \nCancel/Dismiss to Leave as is.`

          this.confirmAction('',mess,  //todo-- title wording--forceAdd 
          "Add",
          function(){ //onOk
            forceAddMins(currScheduled,aConf)
          },
          function(){ //onCancel--Leave as is...
            //cancelChoice
            //this.daSchedule.toggleActionBtns(true,'view')
            aNotif(`Keeping as Is...`) //${currScheduled.title.trim()}'
          })//,
          //function(){ //onDismiss--redundant...
            //this.daSchedule.toggleActionBtns(true,from)//no need as auto save schedule
          //  console.log(`movedIntoConflict >>onAddMins>> onDismiss`)
          //})
      }else{ //normally onDrop....
        //console.log(`movedIntoConflict::`,from,"autoSolve:"+canAutoSolve)
        if(canAutoSolve){
          console.log(`movedIntoConflict:: can AUTO schedule`,canAutoSolve.addIncSched, canAutoSolve.schdIncToAdd,'direction == surrounding? >>', aConf.direction == 'surrounding')
          //JSON.parse(JSON.stringify(toAdd)),JSON.parse(JSON.stringify(currScheduled))
        
          this.scrollToTime(aConf?.targetStart,'slow') 
          
          let mess = `"${toAdd.title.trim()}" at ${whenFrmtTime(toAdd.time)} related to Scheduled "${currScheduled.title.trim()}" at ${whenFrmtTime(currScheduled.time)}.
          \nAuto resolve Overlap?
          \nCancel/Dismiss to manually choose.`

          this.confirmAction('',mess,
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
            onDismissy("Auto-dismiss") //,daChoice[0]
          })
        } else {
            manualSolve(defaultOpts,toAdd,currScheduled,aConf,false)
        }
      }
    }
  },
  handleOverlaps(overlaps,from =''){ //override = null >> override flag--not used
    //console.log('handleOverlaps >>',JSON.parse(JSON.stringify(overlaps)),"from:"+from)
    let toHandleSize = overlaps.length //Object.keys(overlaps).length //to skip extra confirm click when too many overlaps to solve!!

    overlaps.reverse() //bon as it's array now...
    this.doLog("handleOverlaps::ORIGNL from: "+from+" >> "+toHandleSize,this.mobile ? JSON.stringify(overlaps) : overlaps)
    
    //const reversedKeys = Object.keys(overlaps).reverse() //bon just to resolve by earliest >> nope object still ordered by asc. numeric key
    //console.log("handleOverlaps..reversed",reversedKeys)

    //const copyOs = deepCopy(overlaps) //no likey >>overflow crash!!..umm was it cause of ternary eval? >>most likely!!
    //console.log("handleOverlaps..copyOs",copyOs) //just to see if reversed too >> yup keeps reference when not deepCopy

    let hasOneToMany = overlaps.filter(item => item[0] == "oneToMany")
    if (hasOneToMany){
      overlaps = overlaps.filter(item => item[0] != "oneToMany") //filter out
      toHandleSize = overlaps.length
      //console.log(`handleOverlaps::WITHID!!!Now>> `+toHandleSize,hasWithID)//,overlaps)
    }
    const copyOs = deepCopy(overlaps) //need deepCopy as reference to original array modified during looping >>for scroll to next overlap conflict

    //for (let key in overlaps) {
    //let i = toHandleSize - 1  //going in reverse instead of using >> overlaps.reverse() above...
    //for (; i >= 0; i--)
    let done = {} //null
    for (let i = 0; i < toHandleSize; i++) { //i < reversedKeys.length
      let key = overlaps[i][0] //reversedKeys[i]

      //if (key == "oneToMany"){ //bon filtered out!!
        //console.log("handleOverlaps...skipping key",key,overlaps[i]) //overlaps["oneToMany"]
        //continue
      //}

      let toH = overlaps[i][1] //overlaps[key]

      
      //also check that NOT oneToMany? prolly no need? actually might as would get wrong next!!--ToReview** gotta length-1
      //null problem as when in reverse,prev conflict gets modified methink smh
      //let nextOvT = i > 0 ? i+1 == toHandleSize ? overlaps[i][1][0].targetStart : overlaps[i+1][1][0].targetStart : null  //def baad ternary eval smh
      let nextOvT = null
      i > 0 ? nextOvT = copyOs[i-1][1][0].targetStart : nextOvT = null //copyOs[0][1][0].targetStart //umm? nah should be null

      //i == 0
      if(i == toHandleSize-1){
        //console.log("handleOverlaps::SCROLLIN AT END "+i, toH[0].targetStart.time,nextOvT?.time)//JSON.parse(JSON.stringify(nextOvT)))//,JSON.parse(JSON.stringify(toH)))
        // try scroll when at last overlap...dialog would be for when user is solving the overlap...hopefully
        if(from.indexOf('nah') > -1){
          console.log("handleOverlaps...NO END SCROLL::FROM",from,key)
        }else{
          this.scrollToTime(toH[0].targetStart, 'slow')
        }
      }
      

      //handling many evts to same(one) evt overlaps
      //--either multiple evts to be added overlap with a single scheduled evt
      //--or single evt to add that straddle multiple already scheduled(in middle or surrounding)

      if (hasOneToMany && hasOneToMany.find(item => item[1] == key)){
        //let hasWith = hasWithID.find(id => id == key) //hasWithID[1].find(id => id == key)
        //if (hasWith){ //oldie when {} >> overlaps["oneToMany"].find(id => id == key)
        //console.log(`handleOverlaps::WITHID >> oneToMany=`+toH.length,"Key: "+key,nextOvT?.time,toHandleSize)//JSON.parse(JSON.stringify(nextOvT)))//,overlaps["oneToMany"])
        //this.oneToManyConflict(toH,override,from) //nextOvT[0]?.targetStart ?? null
        this.fixConflicts(toH,from,true,[toHandleSize,i],nextOvT)
      } else {
        //console.log(`handleOverlaps:: DEFAULT manyToOne=`+toH.length,"Key: "+key,nextOvT?.time)//JSON.parse(JSON.stringify(nextOvT)))//,overlaps["oneToMany"])
        //this.manyToOneConflict(toH,override,from) //nextOvT[0]?.targetStart ?? null
        this.fixConflicts(toH,from,false,[toHandleSize,i],nextOvT)
      }
    }
  },
  fixConflicts(conflicts,from,hasOneToMany,ovSize,nextOvTime=null){
    //hasOneToMany flag to use 'oneToManyConflict' logic instead of 'manyToOneConflict'
    //ovSize to skip extra click when have too many overlaps to fix(i.e: too many dialogs)
    //nextOvTime for scroll to next overlap
    //todo** put params into object data as growing oestiiii

      const findEvt = id => {
        return this.daSchedule.findSchedEvent(id) //.inConflict
      }
      const fetchGoalEvt = id => {
        return this.daSchedule.getSubGoalByID(id) //.target
      }
      const scrollToConflict = (noOv,where) => {
        if(!noOv){
          console.log(`fixConflicts::scrollToConflict ERROR >>empty time hasOneToMany=`+hasOneToMany,where,noOv)
          return
        }
        setTimeout(() => {this.scrollToTime(noOv, 'slow')},1000) //to allow seeing changes
        //this.scrollToTime(noOv, 'slow')
      }
      const longerNotif = (mess) =>{
        this.doNotifyTimeout(mess,"negative") //'top',10000 >>too long
      }
      const aNotif = (mess,warn=false) => {
        this.doNotify(mess, warn ? "warning":"positive",'top')
      }
      const findhighestPrio = allEvts => {
        return this.findhighestPrio(allEvts)
      }
      let smallestScoreInterval = (conflictEvts) => { //should handle possible error 
        return this.getSmallestScoreInterval(conflictEvts)    
      }        
      let onDismissy = (mess) => {
        console.log('onDismissy>> ',mess,toKeep.length)//choices)
        
        if (toKeep.length > 0) { //== conflicts.size
          //console.log('fixConflicts::onDismissy >> gonna REMOVE ',allEvts.length,JSON.parse(JSON.stringify(toKeep)))
            
          setTimeout(() => {
            hasOneToMany ? removeWithId(toKeep,allEvts) : removeConflicts(toKeep,allEvts)

          }, 0)
        }
        this.doCleanup() //meh just in case
      }
      let removeWithId = (toKeepArr, allConflicts) => { //oneToManyConflict smh
        console.log(`fixConflicts::removeWithID with toKeep=${toKeepArr.length} `,nextOvTime?.time)//,JSON.parse(JSON.stringify(allConflicts))) //out of total:${allConflicts.length}
        
        let extraO = [] 
        let haveChanges = false //for action btns--beware
        allConflicts.forEach((value, valueAgain, set) => {
          //console.log(`removeConflicts..checking`,value.id,toAdd,targetStart.time) //valueAgain
          if (toKeepArr.find(item => item.id == value.id)){
            if (value.id == toAdd.id){
              let choice = choices.has(value.id) ? choices.get(value.id) : ''
              let timey = targetTimes.has(value.id) ? targetTimes.get(value.id) : targetTimes.get(toAdd.id) //null
              //console.log(`fixConflicts::removeWithID:KEEEP..TIME? by>`+choice,value.id, value?.title.trim(),value?.time,timey?.time,targetTimes.has(value.id))

              let toAddy = this.daSchedule.getStoredRawEvt(value.id)  //run risk of overwriting? toTest**
              if (toAddy){
                let oldy = JSON.parse(JSON.stringify(value))
                //console.log(`fixConflicts::removeWithID:: SAVED for:`+value.id,oldy,from)//toAddy)
                Object.assign(value, toAddy,{time:timey.time})  // should use properly saved toAddy
              }

              //special case when onDrop to change time
              let euhOverlaps = from == 'onDrop' ? this.daSchedule.doUpdateSchedule(value,timey) || {} : this.daSchedule.addGoalsToSchedule([{...value,time:timey.time}],false) //flag to skip overlap check--important!!-
              if(Object.keys(euhOverlaps).length > 0){
                console.log(`fixConflicts::removeWithID::OVERLAP on add`,euhOverlaps,value,timey.time)
                extraO.push(euhOverlaps)  //umm should unfurl?
              }else{
                //console.log(`fixConflicts::removeWithID::Great NO overlap`,value?.title.trim())
                let mes = `${choice} ${fromDrop ? "Moving" : "Adding"} '${value?.title.trim()}' at ${whenFrmtTime(timey.time)}` //add parent?!? or more info? tbd**
                this.doNotify(mes, "positive",'top')
              }
              haveChanges = true
            } else { //nothing to do for scheduled...
              //if(from == 'onDrop'){
              //  console.log(`fixConflicts::removeWithID >>from onDrop...removing`,value.id, value.title,value.time)
              //  this.daSchedule.removeScheduledEvt(value)
              //  this.doNotify(`Removed scheduled '${value?.title.trim()}'`, "warning")//,'bottom')
              //  haveChanges = true
              //}else{
              console.log(`fixConflicts::removeWithID....Keeping scheduled Evt!!`, value.id,value.title,value.time,targetTimes.get(value.id))
              let stillIn = this.daSchedule.stillInSchedule(value.id) //in case was removed in previous overlap resolution.

              if (!stillIn.inSched){
                this.doLog('fixConflicts::removeWithID>>ERROR::scheduled was removed: '+value.id+" "+value.title,stillIn)
                this.doNotify(`Re-adding ${value.title}`, "warning")
                stillIn.inStore ? Object.assign(value, stillIn.inStore) : console.log(`fixConflicts::removeWithID>>scheduled was removed >>NOT STORED!!TODO**`) //add default evt using this.getSubGoalByID(id)
                let euhOverlaps = this.daSchedule.addGoalsToSchedule([value],true)//false
                euhOverlaps.length > 0 ? extraO.push(euhOverlaps) : console.log(`fixConflicts::removeWithID>>scheduled was removed >>NO Overlaps!!`)
              }else{ //prolly?
                let mess = `${choices.has(value.id) ? choices.get(value.id) : ''} Keeping scheduled '${value?.title.trim()}'`
                //if(from.indexOf('by') > -1){ //byPrio
                //so all the 'by'..see if should re-add them i..
                this.doNotify(mess, "positive",'top') //at ${when(targetStart)}
              }
            }
          } else {
            if (value.id != toAdd.id){ //remove scheduled..necessary to  solve overlap!
              console.log(`fixConflicts::removeWithID >>removing scheduled`,value.id, value.title,value.time)
              let hadM = this.daSchedule.getCurrentMoods()[value.id]
              this.daSchedule.removeScheduledEvt(value)//,u)
              let mess = `Removed scheduled '${value?.title.trim()}'` 
              mess = hadM ? mess + ` With Moods: '${hadM}'` : mess
             
              this.doNotify(mess, hadM ? "negative":"warning")//,'bottom')
              haveChanges = true
            } else {//toAdd Not in those kept...
              if(from == 'onDrop'){//for onDrop have to remove as well...prolly?
                console.log(`fixConflicts::removeWithID >>Removing target onDrop!!`,value.id, value.title,value.time)
                //this.daSchedule.doUpdateSchedule(toAdd,targetTimes.get(toAdd.id))
                this.daSchedule.removeScheduledEvt(value)
              }else{
                console.log(`fixConflicts::removeWithID >>NOT adding original target`,toAdd.id)
              }
              this.daSchedule.deleteEvtMood(toAdd.id)
              this.resetFilter()
            }
          }
        })

        //this.daSchedule.toggleActionBtns(haveChanges,from) //|| ovSize > 2 for previous overlaps...but problematic even with haveChanges..
        if(from == 'onDrop' || haveChanges){ //|| from == 'adHocEvt' 
          this.daSchedule.toggleActionBtns(true,from) 
          this.doCleanup() //adHocEvt as well ?
        }else{ console.log(`fixConflicts::removeWithID...NO TOGGLING`,from)}
        
        //can end in loop when not using flag to skip overlap check above!
        while(extraO.length) {
          const anExtra = extraO.pop()
          this.doLog(`${from}> fixConflicts::removeWithID:: OVERLAPS`,anExtra)
          this.doNotify("EXTRA Overlaps to fix!", "negative",'top') //+extraO.length
          //let newFrom = anExtra.direction == 'surrounding' ? from+'nah' : from
          let newFrom = from.indexOf('view') > -1 ? from : from+'nah'  //no restrict force for onDoad
          return this.handleOverlaps(anExtra,newFrom) //from+'nah'
        }

        nextOvTime ? scrollToConflict(nextOvTime,"removeWithID") : console.log('fixConflicts::removeWithID >> NO SCROLLING after conflicts',from, nextOvTime,haveChanges)
        
        return "removeWithID" //toSee...
      }
      let removeConflicts = (toKeepArr, allConflicts) => {
        console.log(`fixConflicts::removeConflicts with toKeep=${toKeepArr.length}`,nextOvTime?.time)//,toKeepArr,JSON.parse(JSON.stringify(allConflicts))) //out of total:${allConflicts.length}

        let extraO = []
        let haveChanges = false //for action btns
        allConflicts.forEach((value, valueAgain, set) => {
          //console.log(`removeConflicts..checking`,value.id) //valueAgain
          if (toKeepArr.find(item => item.id == value.id)){
            let choice = choices.has(value.id) ? choices.get(value.id) : '' 
            let timey = targetTimes.has(value.id) ? targetTimes.get(value.id) : null
            //console.log(`fixConflicts::removeConflicts:KEEEP..TIME? by>`+choice,value.id, value?.title.trim(),value?.time,timey?.time,targetTimes.get(allConflicts[1].id))
            
            //timey ? this.scrollToTime(timey,'slow') : console.log(`removeConflicts::cant scrolly as null`,timey,value.id) //could happen when keeping currentScheduled

            if (value.id != currScheduled.id){
              let toAddy = this.daSchedule.getStoredRawEvt(value.id)  //run risk of overwriting? toTest**
              if (toAddy){
                let oldy = JSON.parse(JSON.stringify(value))
                //console.log(`fixConflicts::removeConflicts::SAVED for:`+value.id,oldy, timey)
                Object.assign(value, toAddy,{time:timey.time}) // should use saved toAddy
              }

              //false to not check overlaps as scheduled could be removed >>might still overlap with others tho...
              // prolly better to check how many are added?!? >>still problematic as currScheduled might not be removed yet!!
              let euhOverlaps = from == 'onDrop' ? this.daSchedule.doUpdateSchedule(value,timey) || {} : this.daSchedule.addGoalsToSchedule([{...value,time:timey.time}],this.isViewingToday()) //toKeepArr.length < 2 ? true : false
              //let euhOverlaps = this.daSchedule.recurChangeTime(currScheduled.id,value,timey, true) //from != 'onDrop'
                if(euhOverlaps && Object.keys(euhOverlaps).length > 0) {
                  extraO.push(euhOverlaps)
                  this.doNotify(`Extra Overlaps while adding '${value?.title.trim()}'`, "negative",'top')
                } else {
                  //console.log(`manyToOneConflict::removeConflicts--no other overlap`,value?.title.trim())
                  let mes = `${choice} ${fromDrop ? "Moving" : "Adding"} '${value?.title.trim()}' at ${whenFrmtTime(timey.time)}` 
                  this.doNotify(mes, "positive",'top') //"warning"
                } 
                haveChanges = true
              } else { //nothing to do as keep scheduled..
                let stillIn = this.daSchedule.stillInSchedule(value.id) //in case was removed in previous overlap resolution.

                if (!stillIn.inSched){
                  this.doLog('fixConflicts::removeConflicts>>ERROR::scheduled was removed: '+value.id+" "+value.title,stillIn)
                  this.doNotify(`Re-adding ${value.title}`, "warning")
                  stillIn.inStore ? Object.assign(value, stillIn.inStore) : console.log(`fixConflicts::removeConflicts>>scheduled was removed >>NOT STORED!!TODO**`) //add default evt using this.getSubGoalByID(id)
                  //false flag to skip overlap check--important!!--toSee** with true
                  let euhOverlaps = this.daSchedule.addGoalsToSchedule([value],true)//false
                  euhOverlaps.length > 0 ? extraO.push(euhOverlaps) : console.log(`fixConflicts::removeConflicts>>scheduled was removed >>NO Overlaps!!`)
                }else{
                  //console.log(`manyToOneConflict::removeConflicts...Woo scheduled!!`,value?.title.trim()) //targetStart, value
                  this.doNotify(`${choice} Keeping scheduled '${value?.title.trim()}' `, "positive",'top') //at ${when(targetStart)}
                }
              }
            } else {
              if (value.id == currScheduled.id){ //remove scheduled
                //console.log(`fixConflicts::removeConflicts...removing scheduled!!`,value.id, value.title)
                let hadM = this.daSchedule.getCurrentMoods()[value.id]
                this.daSchedule.removeScheduledEvt(value)//,u)

                let mess = `Removed scheduled '${value?.title.trim()}'` 
                mess = hadM ? mess + ` With Moods: '${hadM}'` : mess
                this.doNotify(mess, hadM ? "negative":"warning") //at ${when(targetStart)}
                haveChanges = true
              } else {
                console.log(`fixConflicts::removeConflicts >> NOT adding target `,value.id, value.title)
                this.daSchedule.deleteEvtMood(value.id)
                this.resetFilter()
                //haveChanges = true //as not adding target?
              }
            }
          })
          //happens on load as keep scheduled //oldie >> || ovSize > 2 for previous overlaps >>but problematic...
          from.indexOf('view') > -1 || haveChanges ? this.daSchedule.toggleActionBtns(true,from) : console.log(`fixConflicts::removeConflicts...NO TOGGLING`,from,haveChanges)
          //this.doLog (`fixConflicts::removeConflicts::OOOS`,extraO)
          while(extraO.length) { //should solve all overlaps together with unfurl? toMonitor**
            const anExtra = extraO.pop()
            this.doLog (`fixConflicts::removeConflicts::EXTRA OVERLAPS from ${from} `,anExtra) // keeping ${toKeepArr.length} 

            this.doNotify("EXTRA Overlaps to fix", "negative",'top')
            //let newFrom = anExtra.direction == 'surrounding' ? from+'nah' : from  //extraO[0]
            let newFrom = from.indexOf('view') > -1 ? from : from+'nah'  //no restrict force for onDoad
            return this.handleOverlaps(anExtra,newFrom) //from+'nah'
          }
          nextOvTime ? scrollToConflict(nextOvTime,"removeConflicts") : console.log('removeConflicts::NO SCROLLING after conflicts',nextOvTime,from,haveChanges)
          
          return "removeConflicts" //toSee...
      }
      const forceAdd = (allToAdd,conflicts) => {
        let extraO = [] 
        //console.log(`fixConflicts::forceAdd total:${conflictEvts.length}`)

        let sched = conflicts.filter(item => !allToAdd.some(x => x.id == item.id)) //needed to use when recurChangeTime() below
        console.log(`fixConflicts::forceAdd of ${allToAdd.length} hasOneToMany=${hasOneToMany} `+from,"allConflicts= "+conflicts.length,nextOvTime?.time) //,sched.length
        conflicts.forEach((obj) => { //allToAdd
          //console.log(`manyToOneConflict::forceAdd at ${obj?.time} > ${obj?.title?.trim()}`,JSON.parse(JSON.stringify(obj)))
          if (allToAdd.find(item => item.id == obj.id)){
            let timey = targetTimes.has(obj.id) ? targetTimes.get(obj.id) : null
            
            let toAddy = this.daSchedule.getStoredRawEvt(obj.id)
            if (toAddy){
              //let original = JSON.parse(JSON.stringify(obj))
              //let savedR = JSON.parse(JSON.stringify(toAddy))
              Object.assign(obj, toAddy,{time:timey.time}) // should use raw saved--not necessary on load >> from=='view'
              //console.log(`fixConflicts::forceAdd >>HAD SAVED!`+obj.id,original,savedR)//toAddy,oldy,JSON.parse(JSON.stringify(obj)))
            }

            
            //findLast to get first elt due to using pop() in main loop? >>nah would get some unscheduled!
            //let e = conflicts.find(x => x.id != obj.id)
            let e = sched.length > 0 ? sched[0] : null //should have at least one!
            if(!e){
              console.log(`fixConflicts::forceAdd::ERROR as no scheduled?!?`,sched)
              e = conflicts.find(x => x.id != obj.id) //oh well even if wrong with multiple evts..
            }

            console.log(`fixConflicts::forceAdd...NEW:${obj.id} '${obj.title.trim()}' dura= ${obj.duration} \n 
            origAt: ${obj.time} added at>>`,timey?.time,"from>>"+from,"\n >> USING for change "+e.id+" "+e?.title,"hasOneToMany "+hasOneToMany) //,from != 'onDrop'
   
            let euhOverlaps = this.daSchedule.recurChangeTime(e.id,obj,timey,from != 'onDrop',longerNotif)
            //let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...obj,time:timey.time}],from != 'onDrop') //true
            if(euhOverlaps && Object.keys(euhOverlaps).length > 0){ //recurChangeTime() has no return...
              console.log(`fixConflicts::forceAdd >>OVERLAP on add`,euhOverlaps,obj,timey.time)
              extraO.push(euhOverlaps) 
            }else{
              //console.log(`fixConflicts::forceAdd::Great NO overlap`,obj?.title.trim())
              let mes = `Force ${fromDrop ? "Moved" : "Added"}  '${obj?.title.trim()}' at ${whenFrmtTime(timey.time)}` //add parent?!? or more info? tbd**
              this.doNotify(mes, "positive",'top')
            }
          }else{
            //prolly scheduled--should move...better for onDrop overlaps!!
            //should move for onDrop--toTest** if works in other cases
            //console.log(`fixConflicts::forceAdd::scheduled Move hasOneToMany: `+hasOneToMany,obj.id)
            !hasOneToMany ? console.log(`fixConflicts::forceAdd >>not WITHID >> NOTHING for scheduled`,obj.id,"Not onDrop: "+from != 'onDrop') 
            : from == 'onDrop' ? this.daSchedule.recurChangeTime(obj.id,allToAdd[0],targetTimes.get(allToAdd[0].id),from != 'onDrop',longerNotif) 
            : console.log(`fixConflicts::forceAdd >> WITHID but nothing to do?`,hasOneToMany,obj.id) //bon this good..toMonitor**
            //targetTimes.has(obj.id),targetTimes.has(allToAdd[0].id),allToAdd[0].id
          }
        })
        this.daSchedule.toggleActionBtns(true,from)

        while(extraO.length) {//toMonitor** if occurs
          const anExtra = extraO.pop()
          this.doLog(`fixConflicts::forceAdd:: EXTRA OVERLAPS `+from,anExtra)
          this.doNotify("EXTRA Overlaps to fix!", "negative",'top') //+extraO.length
          //let newFrom = anExtra.direction == 'surrounding' ? from+'nah' : from  ////toReview** newFrom as could cause more overlaps!!
          return this.handleOverlaps(anExtra,from+'nah')
        }
        //should setTimeout to show how schedule look?--todo**
        nextOvTime ? scrollToConflict(nextOvTime,"forceAdd") : '' //console.log('removeConflicts::NO SCROLLING after forceAdd',nextOvTime)
        
        return "forceAdd" //toSee...
      }
      let chooseOneEvt = (how,conflictEvts) => {
        switch (how) {
          case 'score':
            //let m = 'Choose one event by Score'
            this.confirmChoiceDialog(
              '', 
              'Choose one event by Score',//m,
              conflictEvts.map(e => this.betterEvtLabel(e,'score',false)), //oldie .getEvtLabel
              '',
              function(d){
                let e = conflictEvts.find(x => x.id == d)
                if(e){
                  toKeep.push(e) 
                  choices.set(e.id,`By Score Interval (${e.score}),`)
                }else{console.log('chooseOneEvt::ERROR NOT FOUND!!',d);return}//souldnt happen!!
                return e //not too fast?
              }, 
              null, //second dialog shouldnt have cancel..
              function(){onDismissy('chooseOneEvt::>>byScore...')} //,toAdd.id
            )
            return //gotta return or falls through!!
          case 'prio':
            this.confirmChoiceDialog(
              '',
              'Choose one event by Priority',//m,
              conflictEvts.map(e => this.betterEvtLabel(e,'prio',false)),//oldie >>labels,
              '',
              function(d){
                let e = conflictEvts.find(x => x.id == d)
                if(e){
                  toKeep.push(e) 
                  choices.set(e.id,`By Priority,`)
                }else{console.log('chooseOneEvt::ERROR NOT FOUND!!',d);return} //can this happen?!? toMonitor**
                return e //not too fast?
              },
              null, //second dialog have no cancel
              function(){onDismissy('chooseOneEvt::>>byPriority...')}
            )
            return
          default: //default...
            this.confirmChoiceDialog(
              '',
              'Choose which Event to keep',
              conflictEvts.map(e => this.betterEvtLabel(e,'default',false)), //oldie >> this.getEvtLabel(e,false) //could pass targetStart instead of false? toSee**
              '',
              function(d){ //onOk
                //console.log('chooseOneEvt::chose',d)
                //if (d == currScheduled.id){//chosen scheduled...
                //    console.log('onOk::Chosen Scheduled', d,currScheduled.id) //should be same!!--no need for this...
                //}
                let e = conflictEvts.find(x => x.id == d)
                if(e){
                  toKeep.push(e)
                  choices.set(e.id,"By pick,")
                }else{console.log('chooseOneEvt::ERROR NOT FOUND!!',d);return} //can this happen?!? toMonitor**
                  
                //console.log(`chooseEvt::onOk >>${d} >> ${e?.title.trim()}`) //,JSON.parse(JSON.stringify(pick)) //JSON.parse(JSON.stringify(a))
                return e
              }, 
              null, //onCancel--no need as have to choose!!!
              function(){//onDismiss
                onDismissy('chooseOneEvt::>>byPick...')
              })
            return
          }
      }
      let resolveChoice = (opt,canAutoSolve,manyToAdd, allConflicts, canChooseOne) => { 
        //canChooseOne for potential extra click clarity in choice instead of automatic choosing with score/prio... 
        
        if (opt =='opt3') { //pick Evt
          chooseOneEvt('default',allConflicts)
        } else if (opt =='opt2'){ //by Score
          if (canChooseOne){
            chooseOneEvt('score',allConflicts)
          } else {
            let a = smallestScoreInterval(allConflicts)
            if(a){
              //console.log('fixConflicts::ByScore >>AUTO '+from,a.id,a?.title.trim(), a.score) //,a.details //JSON.parse(JSON.stringify(toKeep))
              toKeep.push(a)
              choices.set(a.id,`By Shortest Score Interval (${a.score}),`)
            }else{
              console.log('ERROR ERROR::fixConflicts >> smallestScoreInterval::No current set?',allConflicts)
              aNotif(`Umm...Score Error`,true)
              chooseOneEvt('score',allConflicts)  //toMonitor** as shouldnt happen!! just manual choose
            } 
          }
        } else if (opt =='opt1'){ //by Priority
          if (canChooseOne){
            chooseOneEvt('prio',allConflicts)
          }else{
            let a = findhighestPrio(allConflicts)
            console.log('fixConflicts::ByPriority >> AUTO '+from,a.e.id,a?.e?.title.trim()) //, a.score,a.details,//JSON.parse(JSON.stringify(cIDs))
            toKeep.push(a.e)
            choices.set(a.e.id,`By Highest Priority (${a.prio}),`)
          }
        } else if (opt =='opt0'){
          console.log(`fixConflicts::AUTO:SOLVE >>`,toAdd,currScheduled,manyToAdd,allConflicts)//[1],allConflicts[0])
          
          if(canAutoSolve.addIncSched){//gotta be careful which is added***
            if(hasOneToMany){
               toKeep.push(toAdd) 
               choices.set(toAdd.id,`By Title Auto-Solve,`) //By Title Auto-resolve
            }else{
              toKeep.push(manyToAdd[0]) //allConflicts[0] > should use manyToAdd[0] instead? >>yup!
              choices.set(manyToAdd[0].id,`By Title Auto-Solve,`) 
            }  
          } else { //when match on scheduledTitle
            if(hasOneToMany){
              toKeep.push(allConflicts[0]) //toTest as not sure it's last with unshift?
              choices.set(allConflicts[0].id,`By Title Auto-Solve,`)
            }else{
              toKeep.push(currScheduled) //allConflicts[1] //should be currScheduled...prolly...toTest**
              choices.set(currScheduled.id,`By Title Auto-Solve,`) //allConflicts[1]
            }
          }
        } else { //OPT4..FORCING.
          forceAdd(manyToAdd,allConflicts)  
        }
      }
      let cancelChoice = () =>{ //keep as is....
        if (from == 'onDrop'){ //yup on drag/drop >>cancel should just revert to original..toMonitor
          aNotif(`Umm...not moving then....`)
          //this.daSchedule.toggleActionBtns(false,'onDrop')//disable saveScheduleBtn..but in case had some unsaved changes...toSee**
          this.doCleanup() //needed
          return //no adding toKeep for removing...
        }

        if(from.indexOf('byMood') > -1){
          console.log("fixConflicts::cancelChoice >>Mood update? canChooseOne:"+canChooseOne+ " hasOneToMany "+hasOneToMany,toAdd.id)

          this.daSchedule.deleteEvtMood(toAdd.id)//update label
          return // actually as no currScheduled below!!
        }
        if(hasOneToMany){ //toTest** other cases
          console.log("fixConflicts::cancelChoice::hasOneToMany from> ",from)
          aNotif(`Keeping Schedule as-is...`)
          return
        }

        toKeep.push(currScheduled) //keeping scheduled only and other removed in onDismiss

        //aNotif(`Keeping scheduled '${currScheduled.title.trim()}'`)
      }
   
    let targetTimes = new Map() //forceAddy....in case of forceAdd? 
    let choices = new Map() //for user choices

    let toKeep = []  // umm how diff that choices above? toSee**

    let toAdd = null  //oneToManyConflict...
    let currScheduled = null //manyToOneConflict

    let allEvts = [] 

    let manyToAdd = []  // should be > 1 (manyToOneConflict) OR == 1 (oneToManyConflict) 

    let hasSurr = false  //in case encounter surrounding>shouldnt offer force option!
    let labely = [] //used for single overlap check

    const origS = conflicts.length //track original size and is == labely above 
   
    while (conflicts.length){
      // .pop to start from end array and potentially deal with conflicts above 'haut' event
      const aConf = conflicts.pop()

      let aScheduled = findEvt((aConf.inConflict)) //this.daSchedule.findEvent(aConf.inConflict) //this.getScheduledEvent(aConf.inConflict)
      if (!aScheduled) {console.log("fixConflicts...ERROR ERROR no evts found!!!",aConf);return}
      

      let addin = fetchGoalEvt(aConf.target)
      if (!addin) {console.log("fixConflicts...ERROR ERROR target evt not found!!!",aConf);return}
     
      targetTimes.set(aConf.target,aConf?.targetStart)  
      //above should also be set once? toReview** >>for withId, should add inConflict?(no sense tho...)

      //hasOneToMany ?  labely.push(`'${aScheduled?.title.trim()}'`) : labely.push(`'${addin?.title.trim()}'`)
      
      if(hasOneToMany){ //oneToManyConflict
        if (!toAdd){
          toAdd = addin
          manyToAdd.push(addin)  //should be one!
          allEvts.unshift(addin) 
        }else{
          toAdd.id !== aConf.target ? console.log("fixConflicts::ERROR ERROR:: oneToManyConflict >>Not same target ID?!?",toAdd, aConf,manyToAdd,targetTimes) : ''//console.log("fixConflicts::ToAdd Good!",toAdd.id,manyToAdd,targetTimes)
        }
        labely.push(`'${aScheduled?.title.trim()}'`) //(${aScheduled?.id})  -${aConf.direction}- 
        allEvts.push(aScheduled)
        //should check previous in labely....
        let c = this.titleIncludes(toAdd.title,aScheduled?.title)
        //console.log("fixConflicts::oneToManyConflict::titleCheck>>"+labely.length,c) //allEvts[0]
      
      } else { //manyToOneConflict
        if (!currScheduled){
          currScheduled = aScheduled  //should be one
          allEvts.unshift(aScheduled)
          targetTimes.set(aConf.inConflict,aConf?.targetStart)
        } else{
          currScheduled.id !== aScheduled.id ? console.log("fixConflicts::ERROR ERROR::manyToOneConflict Not same schedule?!?",currScheduled.id ,aScheduled.id,aConf,manyToAdd) : ""
        }
        labely.push(`'${addin?.title.trim()}'`) //(${addin?.id})  -${aConf.direction}- 
        //should check previous in labely....
        let c = this.titleIncludes(addin?.title,currScheduled?.title) //allEvts[0
        //console.log("fixConflicts::manyToOneConflict::titleCheck>>"+labely.length,c)

        manyToAdd.push(addin)  ////could be multiple...
       
        allEvts.push(addin) 
      }

      aConf.direction == 'surrounding' ? hasSurr = true : hasSurr = hasSurr
    }
    

    let label = labely.join(' and ') 

    //choose between two events--more clarity in solve but extra click!! >>hence using ovSize
    //labely.length < 2  && 
    let canChooseOne = ovSize[0] < 3
    let canAutoSolve = false 
    if (labely.length < 2){ //oldie >> canChooseOne //should still check overlap?
      //console.log("fixConflicts::CANCHOOSEONE ",ovSize[0],hasOneToMany,toAdd,allEvts[0],manyToAdd[0],currScheduled) 
      canAutoSolve = hasOneToMany ?  this.canAutoSchedule(toAdd,allEvts[0]) : this.canAutoSchedule(manyToAdd[0],currScheduled)
      //currScheduled >>allEvts[0]>> should be >> manyToAdd[0] ? toTest**
      //bad access via index which can be wrong!!toReview
    }
    //console.log(`fixConflicts::${canChooseOne? "ONE":"MULTIPLE"} CHOICE >> hasOneToMany=${hasOneToMany} --handling>> `,labely.length, ovSize)
    

    let defaultOpts = [] //oldie >> [{ label: 'Choose one event', value: 'opt3' }]

    /*
    if (from == 'byScore'){
      defaultOpts.unshift({ label:optLabel+"Highest Priority", value: 'opt1', color: 'secondary'}) //'Resolve by Highest Priority'
    } else if (from == 'byPrio'){
      defaultOpts.unshift({ label: optLabel+"Shortest Score Interval", value: 'opt2'}) //Resolve by Shortest Score Interval'//Lowest Score Interval
    } else { //default all!--no force option here! 
      defaultOpts.unshift(
        { label: optLabel+"Highest Priority", value: 'opt1', color: 'secondary' },
        { label: optLabel+"Shortest Score Interval", value: 'opt2' }, //Resolve by Shortest Score Interval'//Lowest Score Interval
      )
    }*/

    /////--proper wording depending on size of conflicts >>especially when just two evts...extra clicks though?...
    let optLabel = canChooseOne ? "Pick one event via " : "Auto-Resolve to keep Evt with "
   

    if (canAutoSolve){
      this.doLog("fixConflicts::AUTO-RESOLVE!! "+currScheduled.id+"hasOneToMany:"+hasOneToMany,canAutoSolve)
      //console.log("fixConflicts::CAN AUTO!!",canAutoSolve)//,hasOneToMany? allEvts[0]:manyToAdd[0])
      defaultOpts.unshift({ label: `By Title Auto-resolve?`, value: 'opt0'})

      defaultOpts.push({ label: 'Manually Choose one event', value: 'opt3' }) //should just propose two when can autoSolve as no need for prio/score with choose one event!

    } else if(canChooseOne){ //from places like byDefaults...no need to add redundant defaults? toReview**
      //console.log("fixConflicts::CanChooseOne",canChooseOne)
      defaultOpts.push({ label: 'Manually Choose one event', value: 'opt3' }) //should just propose two when can autoSolve as no need for prio/score with choose one event!
      //{ label: 'Leave as is!', value: 'opt0' }, if from == 'onDrop' ?
    }else{ //umm toReview** 
      defaultOpts.push({ label: 'Manually Choose one event', value: 'opt3' }) //last? toReview** if below options needed even!!''
      if (from == 'byScore'){
        defaultOpts.unshift({ label:optLabel+`${canChooseOne ? "Priority" : "Highest Priority"}`, value: 'opt1', color: 'secondary'}) //'Resolve by Highest Priority'
      } else if (from == 'byPrio'){
        defaultOpts.unshift({ label: optLabel+`${canChooseOne ? "Score Interval" : "Shortest Score Interval"}`, value: 'opt2'}) //Resolve by Shortest Score Interval'//Lowest Score Interval
      } else { //default all!--no force option here! 
        defaultOpts.unshift(
          { label: optLabel+`${canChooseOne ? "Priority" : "Highest Priority"}`, value: 'opt1', color: 'secondary' },
          { label: optLabel+`${canChooseOne ? "Score Interval" : "Shortest Score Interval"}`, value: 'opt2' }, //Resolve by Shortest Score Interval'//Lowest Score Interval
        )
      }
    }

    if (!hasSurr && !from.indexOf('nah') > -1){
      let forceIn = hasOneToMany ? `Force in > '${toAdd?.title.trim()}' ?` : `Force in > ${labely.join()}`
    
      defaultOpts.push({ label: forceIn, value: 'opt4'}) // should this be offered?!?
    }else{ //bon force for ad-hoc && onPick? >>for view, can create too many recurChangeTime--unless not too many conflicts...
      //console.log(`fixConflicts::FORCE WITH surrounding? == ${hasSurr} from `+from,"one?"+canChooseOne,hasOneToMany)
      let forceView = from.indexOf('view') > -1 && canChooseOne //ovSize[0] < 3
      if (hasSurr && canChooseOne && (from.indexOf('onPickEvt') > -1 || from.indexOf('adHocEvt') > -1 || forceView)){  
        defaultOpts.push({ label: `Force in ?` , value: 'opt4'})
      }
    }

    //Cancel btn... Keep as is for onDrop...should do it instead in radioChoiceDialog() by checking if cancelChoice ? --toReview**
    let fromDrop = from.indexOf('onDrop') > -1 
    let fromMood = from.indexOf('byMood') > -1  //cancel but should be handled with canChooseOne flag...hopefully
    let cancel = `${fromDrop ? "Cancel to keep as-is" : canChooseOne && defaultOpts.length <= 2 ? "Cancel to keep scheduled" : canAutoSolve ? "Cancel to keep scheduled" : fromMood ? "Cancel to keep scheduled" : "" }`
    let mess = hasOneToMany ? `${fromDrop? "Moving" : "Adding"} (${toAdd?.id}) '${toAdd?.title.trim()}' at ${whenFrmtTime(targetTimes.get(toAdd.id)?.time)} Conflicts with scheduled ${label}. \n ${cancel}` 
    : `${fromDrop? "Moving" : "Adding"} ${label} Conflicts with scheduled (${currScheduled?.id}) '${currScheduled?.title.trim()}' at ${whenFrmtTime(currScheduled?.time)}. \n ${cancel}`
    
    let title = hasOneToMany ? `OneToMany Conflicts #${ovSize[1]+1}` : `ManyToOne Conflicts #${ovSize[1]+1}`
    
    this.radioChoiceDialog(title, //oldie >> 'Overlaps!!',
      mess,
      defaultOpts,
      '', //no selection
      function(opt){ //onOk---
        resolveChoice(opt,canAutoSolve,manyToAdd,allEvts,canChooseOne) //labely.length < 2
      },
      cancel !='' ? cancelChoice : null , //canChooseOne ? //onCancel...null so that it's false for cancel btn! Cancel SHould keep scheduled!!
      function(){ //onDismiss.
        onDismissy("Main!")
      }
    )
      
  },
  onPickEvent(addE,skipAsk,useBalance,newDura) { 
    //console.log('onPickEvent',addE,skipAsk,useBalance,newDura)
  
    this.closingDialog()//this.showEvtDialog = false

    if(!addE || !addE.id){ //prevent when filtered and improper goal...
      console.log("onPickEvent...ERROR nothing!", addE, skipAsk,useBalance,newDura)
      this.doNotify("No Goal selected...")
      this.reset() //onPickEvent
      return 
    }

    const doContinue = () => {
      if(durationChange){
        //console.log("onPickEvent::WARNING>>durationChanged!!!",newDura, addE.duration) 
        addE.duration = newDura  //Beware >> does change original unscheduled evt's duration when removed after add!!
      }
      
      let res = this.daSchedule.onPickEvent(addE,this.targetDrop.timestamp,doForce,useBalance,this.doNotifyTimeout)
    
      if(!res.canContinue){ //&& !anyOverlap.overlaps
        //console.log("onPickEvent::OVERLAPS!"+useBalance,JSON.parse(JSON.stringify(res)))
        if(res.overlaps && Object.keys(res.overlaps).length > 0){
          if (useBalance){this.doNotify(`Overlaps!-Balance Not Used!`, "negative",'top')}

          this.handleOverlaps(res.overlaps,'onPickEvt')//onPickEvt
        }
        else{ 
          this.doNotify(`Error? onPickEvt :(`, "negative",'bottom')//prolly nothing?--toTest***
        }
      }else{
        if (useBalance){
          //console.log("onPickEvent::NO OVERLAPS")//,res,this.daSchedule.getCurrentBalance())
          this.doNotify("What is Owed PAID! gg!","info",'top')
        }
        
      }
      this.reset() ////onPickEvent 
    }

    let doForce = this.isViewingPast() ? true : skipAsk //inPast >>just force!!

    let durationChange = newDura != addE.duration  //parseInt ?

    let isClose = this.daSchedule.tooClose(this.targetDrop.timestamp, durationChange ? newDura : addE.duration) 
    //could prolly do midnight check faster as Start/End times could be:[2345 20]  with endTime being smaller when shouldnt>>uncertain ordering tho
    
    if(isClose){
      //console.log("onPickEvent::tooClose check FAIL!",isClose) 
      if(isClose === true){
        this.doNotify("Picking event TOO close to midnight!")
        this.reset() //onPickEvent
        return          
      }
      console.log("onPickEvent::tooClose OVERLAP?",JSON.stringify(isClose))
      let hasOverlaps = isClose?.overlap
      let tooClose = isClose?.tooClose
      if (hasOverlaps.length > 0 || tooClose.length > 0) { //todo** add guardrails
        console.log("onPickEvent::tooClose close",hasOverlaps.length,tooClose.length)
        if(doForce){ 
          this.doNotify(`'${addE.title.trim()}' TOO close Buuut..FORCING!`,"warning","top")
        } else{
          this.withActionNotify(`'${addE.title.trim()}' TOO close to an Evt!!`,function(){console.log('onPickEvent::Force eh');doContinue()})
          return 
        }
      }
    }
    
    doContinue()
  },
  //rework of onAddHocEvent...
  onAddyHocEvent(goalTitle, parentGoal, own, interval,useBalance,manualDura){
    //console.log('onAddHocEvent',goalTitle, parentGoal, own, interval,useBalance)
    
    if (goalTitle.trim() == ""){
      this.doNotify("Empty Goal title...")
      this.closingDialog()//this.showEvtDialog = false
      this.reset() //AddHocEvent
      return
    }
    //before dialog reset >> get proper start time.
    let selectedRange = this.selectedTimeRange()
    //console.log('onAddyHocEvent >>',goalTitle,manualDura,interval,JSON.stringify(selectedRange))
    //this.closingDialog() //yup reset for next access with start&end empty >> {"isSame":true,"duration":0}
    //this.onAddHocEvent(goalTitle, parentGoal, own, interval,useBalance,manualDura)
    
    let startAt = null
    let dura = 0
    if (!this.possibleRange){ //should use this?!?
      console.log("umm onAddyHocEvent... not a range selection: "+manualDura,interval, this.startEndTimes)  //single cell selection
      startAt = parseTimestamp(this.startEndTimes[0])
      dura = interval 
    }else{
      //use selectedRange
      if(selectedRange){
        startAt = parseTimestamp(selectedRange?.start ?? this.startEndTimes[0]) //nullish just in case...
        dura = manualDura ? interval : selectedRange.duration 
      }else{
        console.log("onAddyHocEvent::ERROR for range selection")
        //return? toSee as shouldnt get here...
      }
    }

    this.closingDialog() //close dialog asap as keeps showing  >>resets !!selectedRange!!

    const doSaveGoal = () => {
      //should save regardless?!? toReview**
      let id = this.daSchedule.saveNewGoal(startAt,goalTitle, parentGoal, own,dura)
      //console.log("onAddyHocEvent::doSaveGoooooal "+id,startAt.time)
      this.doNotify(`AdHoc Evt '${goalTitle}' Stored!`,"positive",'top')
      return id
    }

    let cleanup = () => {
      this.closingDialog() //here just in case
      this.constructTree() //update to show newest
      this.reset() //to clear this.possibleRange for next use--causes issue when this.closingDialog() invoked later!!
      if(this.mobile){
        this.adjustCurrentTime()  //weirdly doesnt adjust for mobile?..
      }
    }

    const saveAndSchedule = () => {
      let subID = doSaveGoal()
      if (subID === 0 || subID) {
        let res = this.daSchedule.onAdHocEvent(subID,startAt,useBalance,this.doNotifyTimeout) //doNotify
      
        if (!res.canContinue){ //&& !anyOverlap.overlaps
          console.log("onAddyHocEvent::OVERLAPS?",JSON.parse(JSON.stringify(res)))
          if (res.overlaps == null){
            this.doNotify("Error Adding this event :(", "negative")
            console.log("onAddyHocEvent::ERROR not found?")
            return
          } else {
            if (useBalance){this.doNotify(`Overlaps!-Balance Not Used!`, "warning",'top')}
            cleanup()
            return this.handleOverlaps(res.overlaps,'adHocEvt') //adHocEvt
          }
        } //else{
          //this.constructTree() //update to show newest
          //this.reset() //to clear this.possibleRange for next use--causes issue when this.closingDialog() invoked later!!
          //if(this.mobile){
          //  this.adjustCurrentTime()  //weirdly doesnt adjust for mobile?..
          //}
          cleanup()
          return
        //}
      } else{ //can happen if takes too long to create parent--specially for 'self'
        console.log("onAddyHocEvent::BOO ERROR no subID :(",subID)
        this.doNotify("Error adding :(  Add Evt by select!", "negative")  //Error creating and adding this event :(
        cleanup()
      }
    }

    let isClose = this.daSchedule.tooClose(startAt, dura)
    if(isClose){ 
      //console.log("onAddyHocEvent::tooClose check FAIL!!",isClose)
      if (isClose === true){
        this.doNotify(`'${goalTitle}' Not added as over midnight!`)
        this.closingDialog()
        this.reset()
        return
      }
      
      let hasOverlaps = isClose?.overlap
      let tooClose = isClose?.tooClose
      if (hasOverlaps.length > 0 || tooClose.length > 0) { //add guardrails? todo**
        //implicit force add---toReview** as shouldnt when surround overlaps
        console.log("onAddyHocEvent::tooClose OVERLAP?",JSON.stringify(isClose))
      
        let surr = hasOverlaps.filter(item => item.surround == true)
        if (surr){
          this.withActionNotify(`'${goalTitle}' Surround a Scheduled Evt!! Dismiss to Save...`,
          function(){saveAndSchedule()},
          null,null, //color and position
          function(){doSaveGoal();cleanup()}) //console.log('onAddyHocEvent::dismiss-Save?');
          return
        }
        
        //mostly wouldnt get here as surround takes precedence...also tooClose just checks evt start
        this.doNotify(`'${goalTitle}' too close to a scheduled Evt--Forcing!!`,"warning")
        saveAndSchedule()
        return
      }
      
    }

    //console.log('onAddyHocEvent::WOOUH no closeness issue!')

    //close dialog >>resets !!selectedRange!!
    //this.closingDialog()
    saveAndSchedule()
    return
  
    /*
    //should save regardless?!? toReview**
    let subID = this.daSchedule.saveNewGoal(startAt,goalTitle, parentGoal, own,dura)

    //then add to schedule
    //also subID could be === 0 smh
    if (subID === 0 || subID) {

      let res = this.daSchedule.onAdHocEvent(subID,startAt,useBalance,this.doNotifyTimeout) //doNotify
      
      if (!res.canContinue){ //&& !anyOverlap.overlaps
        console.log("onAddyHocEvent::OVERLAPS?",JSON.parse(JSON.stringify(res)))
        if (res.overlaps == null){
          this.doNotify("Error Adding this event :(", "negative")
          console.log("onAddyHocEvent::ERROR not found?")
          return
        } else {
          if (useBalance){this.doNotify(`Overlaps!-Balance Not Used!`, "warning",'top')}
          cleanup()
          return this.handleOverlaps(res.overlaps,'adHocEvt') //adHocEvt
        }
      } else{
        //console.log("onAddHocEvent::ALLGOOD",res,this.possibleRange)
        //this.constructTree() //update to show newest
        //this.reset() //to clear this.possibleRange for next use
        //if(this.mobile){
        //  this.adjustCurrentTime()  //weirdly doesnt adjust for mobile?..
        //}
        cleanup()
      }
    } else{ //can happen if takes too long to create parent--specially for 'self'
      console.log("onAddyHocEvent::BOO ERROR no subID :(",subID)
      this.doNotify("Error adding :(  Add Evt by select!", "negative")  //Error creating and adding this event :(
    }
    */
  },
  /*onAddHocEvent(goalTitle, parentGoal, own, interval,useBalance,manualDura){
    //console.log('onAddHocEvent',goalTitle, parentGoal, own, interval,useBalance)
    
    if (goalTitle.trim() == ""){
      this.doNotify("Empty Goal title...")
      this.closingDialog()//this.showEvtDialog = false
      this.reset() //AddHocEvent
      return
    }

    if (!this.possibleRange){
      console.log("umm onAddHocEvent... not a range selection: "+manualDura,interval, this.startEndTimes)  //just in case it's single cell selction
      this.possibleRange = this.startEndTimes
    }else{
      console.log('onAddHocEvent',goalTitle,JSON.stringify(this.selectedTimeRange()))
    }
    let toUse = 0
    manualDura && interval > 15 ? toUse = interval : toUse = 0 
    let timeStart = parseTimestamp(this.possibleRange[0])
    let timeEnd = !manualDura ? addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15}) //extra 15
    : addToDate(timeStart, { minute: parseInt(toUse)})  //umm 15 here too?
    
    //: addToDate(parseTimestamp(this.possibleRange[1]), { minute: 15}) 
    //oldie >> 15 mins for when single timeslot selection

    //below redundant when set the interval...smh
    let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

    let isClose = this.daSchedule.tooClose(timeStart, duration)
    if(isClose){ 
      console.log("onAddHocEvent::tooClose check FAIL!!",isClose)
      this.closingDialog()//this.showEvtDialog = false //needed still with closingDialog?!? >> yep as reverts to default choice dialog...
      if (isClose === true){
        this.doNotify(`'${goalTitle}' Not added as over midnight!`)
        return
      }
      //implicit force add
      this.doNotify(`'${goalTitle}' too close to a scheduled Evt--Forcing!!`,"warning")
    }
    this.closingDialog() //close dialog

    let subID = this.daSchedule.saveNewGoal(timeStart,goalTitle, parentGoal, own,duration)//interval

    //then add to schedule
    //also subID could be === 0 smh
    if (subID === 0 || subID) {

      let res = this.daSchedule.onAdHocEvent(subID,timeStart,useBalance,this.doNotifyTimeout) //doNotify
      
      if (!res.canContinue){ //&& !anyOverlap.overlaps
        console.log("onAdHocEvent::OVERLAPS?",JSON.parse(JSON.stringify(res)))
        if (res.overlaps == null){
          this.doNotify("Error Adding this event :(", "negative")
          console.log("onAdHocEvent::ERROR not found?")
          return
        } else {
          if (useBalance){this.doNotify(`Overlaps!-Balance Not Used!`, "warning",'top')}
          this.handleOverlaps(res.overlaps,'adHocEvt') //adHocEvt
        }
      } else{
        //console.log("onAddHocEvent::ALLGOOD",res,this.possibleRange)
        this.constructTree() //update to show newest
        this.reset() //to clear this.possibleRange for next use
        //this.doNotify("New adHoc Evt added!","positive",'top')
        //this.daSchedule.toggleActionBtns(true,'adHocEvt')
        if(this.mobile){
          this.adjustCurrentTime()  //weirdly doesnt adjust for mobile?..
        }
      }
    } else{ //can happen if takes too long to create parent--specially for 'self'
      console.log("onAdHocEvent::BOO ERROR no subID :(",subID)
      this.doNotify("Error adding :(  Add Evt by select!", "negative")  //Error creating and adding this event :(
    }
  },*/
  onEndNow(id){
      const doRemove = () =>{
        //console.log(`onEndNow::removing and saving!`,id)
        let evt = this.daSchedule.findSchedEvent(id)
        this.daSchedule.removeScheduledEvt(evt)
        this.doNotify(`Removing "${evt?.title.trim()}" and Saving...`,"info") //"positive",'top') //Saving Schedule...
        this.doSaveSchedule()//daSchedule.saveDaySchedule() //save automatically esti!
      }

      const reduce =(dura) =>{
        //console.log(`onEndNow::reducing!!!`,id,Number.isInteger(dura))
        this.daSchedule.reduceEvtDuration(id,dura)
        this.doNotify(`Reducing and Saving...`,"info")
      }
      const calcDuration =(e) =>{
        const now = parseDate(new Date())
        let starty = e.start
        let endy = e.end
        if (!isBetweenDates(now, starty, endy, true)){
          console.log(`onEndNow::ERROR >> not in the middle of event?!? Nothing to do...`,now.time, starty.time, endy.time,e)
          //notify?!?toMonitor** if ever occurs...
          return false
        }

        let compareTime = addToDate(now,{ minute: 0})
        let another = diffTimestamp(starty,compareTime) //,true flag to discard earlier evts!!!
        let newDura = Math.floor((another/1000)/60)
        //console.log(`onEndNow::calcDuration >> ${id} duration from ${e.duration} to: ${newDura}`)
        return newDura
      }

    let evt =this.daSchedule.findSchedEvent(id)
    if(!evt){
      console.log(`onEndNow::ERROR Evt not found!!!`,id,evt)
      this.doNotify("Error evt not in schedule?!", "negative") //shouldnt happen?!?
      return
    }
    
    let newDuration = calcDuration(evt) //oldie >> this.daSchedule.canEndNow(id)

    if (!newDuration){//error if not number...undefined is ok!
      console.log('onEndNow...END',id,newDuration,Number.isInteger(newDuration))
    }else{
      newDuration < 10 ? this.confirmAction('',"Less than 10mins remove?\n Cancel to just EndNow","Remove", doRemove,function(){reduce(newDuration)}) : reduce(newDuration)
    }
  },
  onUpdateNoteScorey(id,newScore,note=''){
    //console.log('onUpdateNoteScorey',newScore, id,note)
    let dif = parseScore(newScore)
    if (dif < -1) {
      if (dif == -89) {
        console.log(`onUpdateNoteScorey parsing error`,dif,newScore)
        this.doNotify("Score Parsing Error... YOU FOO! ")
      } else{
        this.doNotify("Score Error: higher# on lower#")
      }
      return
    }

    this.daSchedule.updateNoteScore(id,newScore,note)
    if(note !=='' && !this.isViewingPast()){ //toReview as should check if note same...
      this.doNotify("Note added...do Save eh!", "warning",'bottom')
    }
  },
  onAddMins(id,mins){
    //console.log('onAddMins',id,mins)
    let res = this.daSchedule.addMinsToEvt(id,mins,this.doNotify)

    if(!res.canContinue){ //&& !anyOverlap.overlaps
      if(res.overlaps && Object.keys(res.overlaps).length > 0){
        //console.log("onAddMins::OVERLAPS!!"+mins,res) 

        this.doNotify(`Bumped into some Evts`, "warning",'top')
        return this.movedIntoConflict(res.overlaps,true,"onAddMins",mins)

      }else{ //toTest***
        this.doNotify(`Add ERROR:(`, "negative",'bottom')
      }
    }
  },
  removeEvtInSchedule(evt,addBalance=true){ //addBalance flag when deleting passed 
    let doSave = false //just for moods.../default no need to save...

      let aRemove = () => { //autoSave=false 
        //this.doRemove(evt) //removeEvtInSchedule
        this.daSchedule.removeScheduledEvt(evt)//,doSave)
        
        if (doSave || addBalance){ //autoSave
          //this.doNotify("removeEvtInSchedule..autoSave for: "+evt.title)
          //console.log("removeEvtInSchedule::SAVE for: "+evt.title,doSave,addBalance)

          if(addBalance){
            ////could use wrong balance if evt.duration != default? >> seems ok
            ////not double adding to balance in some cases?!?
            this.daSchedule.addToBalance(evt)
            this.doNotify(`Balance change after removing '${evt.title}'`,"warning",'top')
          }
          
          this.doSaveSchedule() //this.daSchedule.saveDaySchedule()
          //try to clear any pending notification too...
          wasSaved ? this.daSchedule.removeScheduledNotif(evt.id) : console.log("removeEvtInSchedule::Evt Wasnt Saved so no notif removal")
          return
        }

        this.daSchedule.toggleActionBtns(true,'view')
      }
      let cancelled = () => {
        console.log('Cancelled remove..')
        this.reset()
      }
      
      let pickAlt = () => {
        //console.log('removeEvtInSchedule::Picking alt...')
        return this.chooseAlternatives(evt)
      }
    
    //inPast--choose alternative.. Not for small evts as just addBalance
    if(this.isViewingPast()){
      if (evt.duration < 30){
        //console.log("removeEvtInSchedule...baah too smoll smoll",evt.title,evt.duration)
        this.doNotify("Removing from the past... Check BALANCE!") //oldie >> Removing from the past too smoll smoll is no no!
        this.daSchedule.addToBalance(evt)
        
        doSave = true
        aRemove() //(true) //this.doRemove(evt)
        return
      }

      this.chooseAlternatives(evt) //this removes evt? toTest**
      return
    }

    if (!this.isViewingToday() && !this.mobile){//in futur >>no need confirming with user when inDesktop!
      doSave = this.daSchedule.getCurrentMoods()[evt.id] // this.usingMoods[evt.id] //oldie >>false  //should auto-save and flag to update labeling....
      console.log('Removing future evt')
      aRemove() //(false)
      
      return
    }

    let mess = `Remove "${evt.title}" ?`// from schedule?`

    let wasSaved = this.daSchedule.getStoredRawEvt(evt.id)

    let u = this.daSchedule.getCurrentMoods()[evt.id] 
    if (u){ //this.usingMoods[evt.id]
      //console.log("removeEvtInSchedule:: with MOODs ", u)//this.usingMoods[evt.id])
      //oldie >>doSave = true 
      doSave = wasSaved ? true : false //just to not auto-save because of mood evt that is transient
      mess = mess + ` With Moods: '${u}'` //this.usingMoods[evt.id]
    }

    //console.log(`removeEvtInSchedule:: should AddToBalance as wasSAVED..addBalance flag: `+addBalance,wasSaved)
    wasSaved ? '' : addBalance = false
    
    //mess = addBalance ? mess + " (Balance affected)" : mess //+ " ?"

    let title = addBalance ? 'Remove (Balance affected)' : 'Schedule Change'
    //confirmCancelAction
    evt.duration >= 30 && addBalance ? this.confirmCancelAction(
      title,
      mess + " \n Or choose an alternative?",
      "Remove",
      "Choose",
      aRemove,
      pickAlt) : this.confirmAction(title,mess,"Remove",aRemove,cancelled) //function(){console.log('Cancelled remove')}
    
  },
  defaultScheduleByOpts(){ //generic when calculated options are null...
    return [
      { label: "Filter out of current scheduled Evts", value: 'filter'}, //color: 'secondary'
      { label: "Add Evts to current schedule", value: 'add'},
      { label: "Reset current schedule", value: 'reset'} //shoul hide this?
    ]
  },
  betterEvtLabel(anEvt,how,atTime = null){ //closer to evtLabels() of movedIntoConflict() for score/prio case
    const prioLabel = (evt,addPrio) => {
      if (evt?.parentGoal){
        let prt = this.daSchedule.parentGoalById(evt.parentGoal) //this.parentGoalsMap().get(evt.parentGoal)
        return addPrio ? `Of '${prt?.title.trim()}' (${prt?.priority})` : `Of '${prt?.title.trim()}'`
      }
      console.log('prioLabel..ERROR no PARENT found?',evt)
      return '' //prolly empty string //oldie >> null
    }

    let l = '' //huh cant redeclare in switch block...toTest**
    switch (how) {
      case 'score':
        l =  `${prioLabel(anEvt,false)} > "${anEvt.title.trim()}" with Score:: ${anEvt.score} = ${parseScore(anEvt.score)} ` //`Of '${prt?.title.trim()}' "${anEvt.title.trim()}" (${anEvt.score}) `
        l += atTime ? `@ ${whenFrmtTime(anEvt?.time)} ++ ${anEvt?.duration} mins` : `for ${anEvt?.duration} mins` //duration needed?
        return { label: l, value: anEvt.id }
      case 'prio':
        l = `"${anEvt.title.trim()}" ${prioLabel(anEvt,false)} `
        l += atTime ? `@ ${whenFrmtTime(anEvt?.time)} ++ ${anEvt?.duration} mins` : `for ${anEvt?.duration} mins` //duration needed?
        return { label: l, value: anEvt.id }
      default: //pickEvt
        l = `"${anEvt.title.trim()}" ${prioLabel(anEvt,true)} && Score:: ${anEvt.score} = ${parseScore(anEvt.score)} ${atTime ? ` @ ${whenFrmtTime(anEvt?.time)} ++ ${anEvt?.duration} mins` : `for ${anEvt.duration} mins`}`
        return { label: l, value: anEvt.id }
      }
  },
  getLargestScoreInterval(evts){
    let highest = 0  //shouldnt be lower than this...could happen tho if no validation on add
    let current = null
    for (let e of evts) {
      let daScore = parseScore(e.score)
      if(daScore > -1 && daScore >= highest) {
        highest = daScore
        current = e//e.id
      }
    }
    return current //handle null at call site

    //if (current){
      //console.log('getHighestScoreInterval::score interval', current.id,current?.title.trim(), current.score) //current) //,current.details
     // return current
    //}else{console.log('ERROR ERROR getHighestScoreInterval::No current set?',highest, current,evts)} //shouldnt happen!!--toMonitor**
  },
  expandAll(){ //bof dont work...
    //console.log("expandAll",this.treeGoals)
    
    for (let e of this.treeGoals) {
      //console.log("expandAll",e)
      this.expanded[e.label] = true
    }
  },
  getSmallestScoreInterval(evts){
    let lowScore = 9  //upper start..shouldnt be higher than this
    let current = null
    for (let e of evts) {
      let daScore = parseScore(e.score)
      if(daScore > -1 && daScore <= lowScore) {
        lowScore = daScore
        current = e//e.id
      }
    }
    return current //handle null at call site
    //if (current){
      //console.log('getSmallestScoreInterval::score interval', current.id,current?.title.trim(), current.score) //current) //,current.details
    //  return current
    //}else{console.log('ERROR ERROR getSmallestScoreInterval::No current set?',lowScore, current,evts)} //shouldnt happen!!--toMonitor**
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

      /*let sorty = (a, b) => {
        if (a.parentGoal > b.parentGoal) return 1; 
        if (a.parentGoal == b.parentGoal) return 0; 
        if (a.parentGoal < b.parentGoal) return -1;
      }*/

    let alts = this.daSchedule.getAlternatives() //.sort(sorty)
    let now = parseDate(new Date())

    //this.doLog('chooseAlternatives >>ALTS:',alts) //JSON.parse(JSON.stringify(alts)),now.date)
    
    let evtTimey = evt.time //for scheduling later
    let futureDatey = now.date

    let title = evt.title //for notes
    let isToday = this.isViewingToday() //proper startDay in addInFutur
     
      //umm this looks at current day schedule...
      //should look into next day as well?!?--toReview***
      const filterOutScheduled = evts => { 
        return evts.filter(x => !this.daSchedule.getScheduledEvts().has(x.id))
      }

      const addInFutur = (eArr) => { // dialogs make it impo! to move into daySchedule class smh
        let startDay = addToDate(parsed(futureDatey),{ day: isToday ? 1 : 0 }) //think need options >> yup! //SHOULD be sometime in present or future
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
        //console.log("chooseAlternatives::addInFutur",eArr,EvtsOn,startDay.date,altDay)

        eArr.forEach(i => {
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
            this.doNotify(`Saving ${toAddy.title} in ${altDay.date}`, "info",'bottom')
          } else { //just add it
            toSave[i] = {
              duration: toAddy.duration,
              time: evtTimey,
              notes: `Alt replace for '${title}'`
            }
          }
        })
        this.daSchedule.updateDaySchedule(startDay.date, toSave)
      }

      const remReplace =(eID) => {
        //this.doRemove(evt) //alts
        this.daSchedule.removeScheduledEvt(evt)

        let toAdd = alts.find(item => item.id == eID) //this.getLocalEvt(eID) //should use the `alts` var above..otherwise would be changing the scheduled time of evt.
        console.log("remReplace...Add at:",evtTimey,toAdd.title, 'usually at:'+toAdd.time) //JSON.parse(JSON.stringify(toAdd))

        let euhOverlaps = this.daSchedule.addGoalsToSchedule([{...toAdd,time:evtTimey,notes: `Alt replace for '${title}'`}],true)

        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`chooseAlternatives::removeReplace:: OVERLAPS again from ${toAdd.length} overlaps =${sizey}`,toAdd,euhOverlaps)

          this.doNotify(`Extra Overlaps while adding ${toAdd.title.trim()}`, "negative")//,'top')
          
          return this.handleOverlaps(euhOverlaps,'alts') //chooseAlternatives
        }

        this.daSchedule.saveDaySchedule()//chooseAlternatives

        this.doNotify(`Added Alt replacement '${toAdd?.title}' at ${evtTimey}`, "info")//,'bottom') 
        
      }

      const aProbNotif = (mess) => {
        this.doNotify(mess) //, "positive",'bottom'
      }
      const doForce = () => {//force when no alternatives
        this.daSchedule.removeScheduledEvt(evt) //no need to pass evt in?
        this.daSchedule.addToBalance(evt); 
        this.doNotify(`Balance change after removing '${evt.title}'`,"warning",'top')
        this.doSaveSchedule()
      }
    
    alts = filterOutScheduled(alts)

    if (alts.length == 0) {
      //aProbNotif("Removing not allowed! Alternatives already present!")
      //should try to add btn for force? balance...
      this.withActionNotify("...Alternatives already present!",doForce)
      return
    }
    let mess = `First Evt to replace Removed ${isToday ? "(today)": ""} + an Extra evt for next day! ${isToday ? "":"(today)"}`
    this.checkBoxDialog(`Alternative for '${title}'`,
      mess,
      alts.map(e => this.betterEvtLabel(e,'default',false)),
      //alts[0].id, //'', //have to at least include first Alternative...>> bof no need as check the length of model!
      function(opt){ //onOk
        console.log('chooseAlternatives::opt',opt) //JSON.parse(JSON.stringify(toKeep))
        remReplace(opt.shift())
        if (opt.length > 0){
          addInFutur(opt)
        } else { 
          //get here when only had one alts to choose from...
          //should make sure that alts.length > 1 ? --toReview**
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
  reset() { //reset variable for next use 
    this.selectedItem = null
    this.targetDrop = null
    this.touchedItem = null 
   
    //explicit reset of dropdown chosenScore && chosenPrio values
    //todo** should check unsaved changes >> !this.saveScheduleDisabled and skip prolly--toReview**
    this.daSchedule.resetChosen() 

    this.possibleRange = null 
  },
  doCleanup(){
    //console.log('doCleanup',this.lastTarget)//.style.background)
    if(this.lastTarget){
      this.lastTarget.style.background = ''
      this.lastTarget = null
    }   
  },
  closeDialogWithReset(){// same as closingDialog but with cleanup & reset >>redundant prolly
    console.log('closeDialogWithReset')
    this.showEvtDialog = false
    //this.reset() //should? could impact when have selection?
    //this.doCleanup()
    this.selectedItem = null
    this.targetDrop = null
    this.touchedItem = null
    this.possibleRange = null
  },
  closingDialog(){
    this.showEvtDialog = false
    //have to actually reset the anchorTimestamp & otherTimestamp as basis for selectedTimeInterval smh
    //only when it was a range otherwise could be starting a range select >>also go together!!
    if(!this.anchorTimestamp || !this.otherTimestamp){
      //borks when previously erased >>just return
      console.log('closingDialog NULL TIMEYS',JSON.stringify(this.anchorTimestamp),JSON.stringify(this.otherTimestamp))
      return
    }

    if(getDateTime(this.anchorTimestamp) != getDateTime(this.otherTimestamp)) {
      //console.log('closingDialog on Raaange!!', this.anchorTimestamp?.time, this.otherTimestamp?.time)
      this.anchorTimestamp = null 
      this.otherTimestamp = null
      this.possibleRange = null //also
    }
    
  },
  doLog(mess,data){
    console.log(mess, JSON.parse(JSON.stringify(data)))
  },
  onPrev(){
    let doContinue = () => {
      this.$refs.calendar.prev()
      this.adjustCurrentTime()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000); //should navigate after save
      this.doSaveSchedule() //onPrev
    }

    if(!this.saveScheduleDisabled){ //handle when cx has some unsaved changes!
      this.confirmAction('',`Save changes of day: ${this.currentDate} ?`,"Save",doSave, doContinue)
      
    } else {
      doContinue() //oldie >> this.$refs.calendar.prev()
    }
  },
  onToday(){
    let doContinue = () => {
      this.$refs.calendar.moveToToday()
      this.adjustCurrentTime()
    }

    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule() //onToday
    }

    if(!this.saveScheduleDisabled){ //handle when cx has some unsaved changes!
      this.confirmAction('',`Save changes of day: ${this.currentDate} ?`,"Save",doSave, doContinue)
    } else {
      doContinue()
    }
  },
  onNext(){
    let doContinue = () => {
      //console.log('onNext...continuing',this.currentDate)
      this.$refs.calendar.next()
      this.adjustCurrentTime()
    }
    
    let doSave = () => {
      setTimeout(doContinue, 1000);
      this.doSaveSchedule() //onNext
    }

    if(!this.saveScheduleDisabled){ //handle when cx has some unsaved changes!
      this.confirmAction('',`Save changes of day: ${this.currentDate} ?`,"Save",doSave, doContinue)
    }else {
      doContinue()
    }
  },
  onChange(){

    let res =  this.daSchedule.onChangeViewDate(this.currentDate)
    if(!res.canContinue){
      if(res.overlaps && res.overlaps.length > 0){ //Object.keys(res.overlaps)
        //console.log("onChangeViewDate::overlaps=="+Object.keys(res.overlaps).length)//, JSON.parse(JSON.stringify(res.overlaps)))
        //this.movedIntoConflict(res.overlaps,null,'view') //umm just to handle one by one but handleOverlaps() better!
        //this.doLog("onChangeViewDate::OVERLAPS",res.overlaps)
        return this.handleOverlaps(res.overlaps,'view')
      }else{
        this.doNotify(`Loaded schedule for ${this.currentDate}`, "positive") //'bottom'

        this.adjustCurrentTime() //meh just do always...
        //if(this.isViewingPast() || this.currentDate !== today()) { //adjustTime for past && futur 
        //  console.log("adjusting time for past/future", this.currentDate) //,this.scheduledEvents.length)
        //  this.adjustCurrentTime()
        //}

        if(this.currentDate == today()){//scrollTo current time today only
          let timey = parseDate(new Date())
          this.scrollToTime(timey,'slow')
        }
        return
      }
    }
    //bon when empty schedule || other days just scroll
    let timey = parseDate(new Date())
    this.scrollToTime(timey,'slow')
  },
  onDragStart(e, type, item) {
    //console.log('onDragStart',e,type, item)
    //this.doLog('onDragStart '+type, item) 
    if(this.isViewingPast() && type != 'tree-item'){ // allowing tree-items add in past? toReview**
      this.doNotifyCaption("Editing past is a no no!","Use Drag & Drop from Tree or manually add Evts") //oldie >> doNotify
      e.preventDefault()
      return
    }

    if(type == 'tree-item'){
      let it = this.daSchedule.getSubGoalByID(item.id)
      //console.log('onDragyStart::TreeItem '+type, JSON.parse(JSON.stringify(item)),JSON.parse(JSON.stringify(it))) //this.doLog
      this.selectedItem = {evt:{...it,color:item.color}, type:type} //sheesh BEWARE** passing in color like this smh
      return
    }

    //keep track of moved...
    this.selectedItem = {evt:item, type:type}
   
  },
  //onDragHEnter(e, type, scope){ //scope is undefined
  //  console.log('onDragHEnter',e.target, e.timestamp, type)
  //},
  onDragEnter(e, type, scope){
    //console.log('onDragEnter',e, type, scope)
    if(type === 'goal-item'){
      //console.log('onDragEnter..goal-item',e, scope) 
      // scope is undefined here hence saving it below
      e.preventDefault()
    } else {
      //ABSO necessary to save this as it's the last position before potential overlap with goal-item!
      //but not precise enough

      //console.log('onDragEnter...calendar')//, e, type, scope) //e,type,scope
      if(this.targetDrop && this.targetDrop.timestamp.time == scope.timestamp.time){
        console.log('onDragEnter...calendar,SAME',this.targetDrop.timestamp.time)//prolly nothing...should return?
      }else{
        let target = e.target
        //console.log('onDragEnter>>TARGET',this.targetDrop?.timestamp?.time,scope.timestamp.time,this.selectedItem)//,target.style,target)
        //if(this.selectedItem.bgcolor.includes("-")){ target.classList.add(`bg-${this.selectedItem.bgcolor?.toLocaleLowerCase()}`) } else{ target.style.background = this.selectedItem.bgcolor }
        //target.style.background = this.selectedItem.bgcolor.includes("-") ? 'grey' : this.selectedItem.bgcolor  //'bg-'+this.selectedItem.bgcolor >>doesnt work for style >>does as css class! above line works but passed over intervals keep color and removing from classlist would be hassle...
        let color = this.selectedItem.evt.bgcolor ?? this.selectedItem.evt.color
        target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color
        this.lastTarget = target
      }
    
      this.targetDrop = scope
      e.preventDefault()
    }
    return true
  },
  //onDragHOver(e, type, scope){ //fires lot too...scope is undefined
   // console.log('onDragHOver', type,e.target, e.timestamp)
   // e.preventDefault() //to allow drop
   // return true
  //},
  onDragOver(e, type, scope){ //fires lot
    //console.log('onDragOver',e, type, scope)
    e.preventDefault() //to allow drop
    return true
  },
  onDragLeave(e, type, scope){
    //console.log('onDragLeave',e, type, scope)
    //console.log('onDragLeave',this.targetDrop?.timestamp?.time,this.selectedItem.color)//,e, type, scope)
    let target = e.target
    //console.log('onDragLeave',this.targetDrop?.timestamp?.time,target.style.background)//,target.style,target)
    target.style.background = ''
    //remove("my-header-drag")

    return false  //what if true?!? >>methink false in order to preventDefault and not handled by browser...
  },
  //onDragHEnd(e){
  //  console.log('onDragHEnd',e.target, e.timestamp)
  //},
  onDragEnd(e){//umm can use to do cleanup maybe?>>meh done in doCleanup()
    //console.log('onDragEnd',this.lastTarget)//.style.background)
    
    //e.preventDefault() //bof nope
    //return true //meh
  },
  //onHDrop(e, type, scope){ //never get triggered...makes sense?!? removed from div even
  //  console.log('onHDrop',e, type, scope)
  //},
  onDrop(e, type, scope){
    //console.log('onDrop',e, type, scope)

    //below redundant when dragging from treeLegend
    //let d = this.daSchedule.findSchedEvent(this.selectedItem.id)
    //if (!d) {console.log("onDrop ERROR", d,this.selectedItem ); return}

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
    
    this.doDroppy(targetTimey, this.selectedItem) 

  },
  onClickTime(data){
    //console.log('onClickTime',data)

    //save the data to use later when checking that it can be scheduled!
    this.targetDrop = data.scope

    this.showEvtDialog = true  //show dialog for adHoc or selectEvt
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
  /*onMouseEnter(data) {
      console.log("onMouseAt", data)
  },
  onMouseLeave(data) { //this fires!
      console.log("onMouseLeave", JSON.stringify(data))
  },*/
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
    
    if(this.isViewingPast()){ //no dblClick in past--but just in case!
      console.log("onDblClickEvent::ERROR?", event)
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

    this.removeEvtInSchedule(event,false) 
    e.preventDefault() //to disable popupEdit...dont work smh event with using setTimeout above
  },
  onTouchHStart(e, type, item){ //todo** use onTouchStart below....
    //console.log('onTouchHStart', e,item,e.target) 
    if(type == 'tree-item'){
      let it = this.daSchedule.getSubGoalByID(item.id)
      console.log('onTouchHStart::TreeItem '+type, JSON.parse(JSON.stringify(item)),JSON.parse(JSON.stringify(it))) //this.doLog
      this.selectedItem = {evt:{...it,color:item.color}, type:type} //sheesh BEWARE** passing in color like this smh
      e.preventDefault()
      return true
    }

    this.selectedItem = {evt:item, type:type}

    e.target.classList.add("my-header-drag")
    this.touchedItem = e.target  //save to remove css class later

    e.preventDefault()
    return true
  },
  onTouchStart(e, type, item){
    //console.log('onTouchStart', e,type, item)
    if(e.type == "touchstart"){ //fires once!
    
      //this.draggedItem = item
      this.selectedItem = {evt:item, type:type}
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

      //let f = target.closest('.my-event')

      if(target.parentNode.classList.contains("my-event")){
        //console.log("onTouchStart >>my-event-drag",target)//"isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],"showMobileDialog>> "+this.daSchedule.showMobileDialog[item.id]) //target,,this.mobileEnableScore[item.id]
        target.parentNode.classList.add("my-event-drag") //transform: skew(-20deg)
        this.touchedItem = target //keep track of it to see if gonna move OR touch-hold OR onScore edit OR dblClick for remove
      } else {
        //console.log("onTouchStart:WOOOAH inner touch?",target.parentNode,this.isDisabledScoreEdit[item.id],this.mobileEnableScore[item.id]) 
        //could happen if it's inner elt...so go up
        //let f = target.closest('.my-event')
        target = target.parentNode
        if(target.parentNode.classList.contains("my-event")){
          //console.log("onTouchStart >>PHEW..FOUND",target)//"isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],f) //target,,this.mobileEnableScore[item.id]
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
  
    console.log("onTouchStart::ERROR...UNKNOWN",e) //shouldnt happen as other handlers via handleTouchEvt()

    return
  },
  onTouchHEvt(e, item){ //huh no need for item...toRemove**
    //console.log('onTouchHEvt', e,item)
    if(e.type == "touchmove"){
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      if(target.ariaLabel){ //in calendar...
        
        let s = this.getLabelTime(target.ariaLabel) //getTimey(target.ariaLabel)
        //console.log('onTouchHEvt::touchmove>>TARGET', target,s)
        if (this.targetDrop){ //skip when same...
          let changedBy = diffTimestamp(this.targetDrop,s) 
          let isSame = JSON.stringify(this.targetDrop) === JSON.stringify(s)
          if (isSame && changedBy == 0){
            //console.log('onTouchHEvt::touchmove>>TARGETSAME', target,s,isSame, changedBy)
            return //add true? toSee**
          }
          let color = this.selectedItem.evt.bgcolor ?? this.selectedItem.evt.color
          if(!this.lastTarget){
            this.lastTarget = target
            target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color //this.selectedItem.evt.bgcolor.includes("-") ? 'grey' : this.selectedItem.evt.bgcolor  //or .color //using `bg-${this.selectedItem.bgcolor}` doesnt work as should be a css class  //oldie >>'pink'
          }else{
            this.lastTarget.style.background = '' //remove from old
            target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color //this.selectedItem.evt.bgcolor.includes("-") ?'grey' : this.selectedItem.evt.bgcolor
            this.lastTarget = target 
          }
        }
        this.targetDrop = s
      }//else{
       // console.log('onTouchHEvt::touchmove>>NOPE :(', target)
      //}

      e.preventDefault()
      return true //
    }
    if(e.type == "touchend"){
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

      //remove css class
      this.touchedItem.classList.contains("my-header-drag") ? this.touchedItem.classList.remove("my-header-drag") : console.log('onTouchHEvt::touchend>>No Header?!?',this.touchedItem)

      if(target.ariaLabel){
        let s = this.getLabelTime(target.ariaLabel)
        //console.log('onTouchHEvt::touchend>>TARGET', target,s,this.lastTarget)
       
        this.targetDrop = s
        
        this.doDroppy(this.targetDrop, this.selectedItem)
      }else { //on top of other evt...
        //console.log('onTouchHEvt::touchend>>TARGETTOP?', target,this.targetDrop)
        if (this.targetDrop){//just drop on top to see--ToReview **
          this.doDroppy(this.targetDrop, this.selectedItem)   //should act as a drop in mobile
        }
      }

      
      e.preventDefault()
      e.stopPropagation() //needed?@? think so or would trigger other events...prolly...toMonitor***

      return
    }

    console.log("onTouchHEvt::UNKNOWN",e)

  },
  resetDraggedItem(t){
    if (!t){ //just in case false...
      console.log("resetDraggedItem::ERROR::ERROR?",t)
      return
    }
    let f = t.closest('.my-event')
    if (f.classList.contains("my-event-drag")) {
      f.classList.toggle("my-event-drag")
      //console.log("handleTouchEvt::resetClass>>REMOVED",f,t)
    }//else{console.log("onTouchEvt::resetClass...AINT THERE!"+e.type,f,t)}
    return
  },
  onTouchEvt(e, item){
    //console.log('onTouchEvt', e,item)

    if (!this.selectedItem){ //should be populated** 
      console.log("onTouchEvt NULL Item >>ERROR?!? "+e.type,this.selectedItem,this.touchedItem)
      //item = this.selectedItem //redundant prolly
      return
    }

    if(this.isViewingPast()){ //present check only for move/end --
        this.doNotify("Editing past is a no no!")
        //console.log('onTouchEvt::PAST', this.touchedItem)
        this.resetDraggedItem(this.touchedItem)  //still have to remove the drag class!
        e.preventDefault()
        e.stopPropagation()
        return
    }

    if(e.type == "touchmove"){ //fires a lot!

      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
      if(target && target.ariaLabel){ //when moving into calendar's interval

      //e.target remains same original goal event
      //console.log("onTouchEvt::touchmove",this.lastTarget)//target.style)
      //this.lastTarget = target //toSave just in case

        let s = this.getLabelTime(target.ariaLabel) //getTimey(target.ariaLabel)
        //console.log('onTouchEvt::touchmove', s,this.targetDrop)
        if (this.targetDrop){ //-should skip when in same timestamp
          let changedBy = diffTimestamp(this.targetDrop,s) 
          let isSame = JSON.stringify(this.targetDrop) === JSON.stringify(s)
  
          if (isSame && changedBy == 0){ //--too much comparison? toReview
            //console.log("touchmove::INTERVAL SAME...",isSame,s.time == this.targetDrop?.time, changedBy,this.lastTarget,this.selectedItem.color,this.selectedItem.color.includes("-"))//,target)
            return
          }

          //console.log("touchmove::INTERVAL changed!!",isSame,s.time,this.targetDrop?.time,changedBy,this.lastTarget,target,this.selectedItem.color,this.selectedItem.color.includes("-"))
          let color = this.selectedItem.evt.bgcolor ?? this.selectedItem.evt.color
          if(!this.lastTarget){
            this.lastTarget = target
            target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color //this.selectedItem.evt.bgcolor.includes("-") ? 'grey' : this.selectedItem.evt.bgcolor  //or .color //using `bg-${this.selectedItem.bgcolor}` doesnt work as should be a css class  //oldie >>'pink'
          }else{
            this.lastTarget.style.background = '' //remove from old
            target.style.background = hexColor(color) //color.includes("-") ? 'grey' : color //this.selectedItem.evt.bgcolor.includes("-") ?'grey' : this.selectedItem.evt.bgcolor 
            this.lastTarget = target 
          }
        }
        this.targetDrop = s

        e.preventDefault()
        return
      }

      //e.preventDefault()
      return //true? tbd**
    }
    if(e.type == "touchend"){  
      
      let target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)

      //console.log("onTouchEvt::END",target.style.background,this.lastTarget)//.style.background)

      if(!this.touchedItem){//could happen for those AddMin btns...
        //console.log("onTouchEvt::END >> EUUH nothing? returning....",this.touchedItem, target)
        return //continue default handling....
      }

      if(target.parentNode.classList.contains("my-event-drag")){ //on top of same Evt....
        console.log("onTouchEvt::END >>removing my-event-drag","isDisabledScoreEdit>> "+this.daSchedule.isDisabledScoreEdit[item.id],"mobileEnableScore>> "+this.daSchedule.mobileEnableScore[item.id])//target
        target.parentNode.classList.remove("my-event-drag")
      }else{
        let savedHas = this.touchedItem.parentNode.classList.contains("my-event-drag")
        if(savedHas){//then remove it still
          this.touchedItem.parentNode.classList.remove("my-event-drag")
        }else{
          console.log("onTouchEvt::END...target NO my-event-drag?",savedHas, target,target.parentNode )
        }
      }
      
    
      if(target.ariaLabel){
        let s = this.getLabelTime(target.ariaLabel) //getTimey(target.ariaLabel)
        
        this.targetDrop = s
        
        this.doDroppy(this.targetDrop, this.selectedItem) // should act as a drop in mobile
      } else {
        //let f = target.closest('.my-event')
        //console.log("onTouchEvt::END>>ERROR?OVERLAP?",target,target.classList.contains("my-event"),target.parentNode,this.daSchedule.isDisabledScoreEdit[item.id])//,this.allowDialog[item.id])
        
        if(target.classList.contains("title") || target.classList.contains("my-event")){
          //console.log("onTouchEvt::END--has title!",this.targetDrop)
          if (this.targetDrop){//just drop on top to see--ToReview **
            this.doDroppy(this.targetDrop, this.selectedItem)   //should act as a drop in mobile
          }
        }
      }

      e.preventDefault()
      e.stopPropagation() //needed?@? think so or would trigger other events...prolly...toMonitor***

      return
    }
    console.log("onTouchEvt::UNKNOWN",e) //shouldnt happen!!
  },
  getLabelTime(ariaLabel){
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

    let f = target.closest('.my-event')
  
    if(target.classList.contains("title") && target.parentNode.classList.contains("my-event-drag")){ 
      //console.log("onTouchHold...REMOVING my-event-drag")//,f)//,f,target.parentNode)// remove the 'my-event-drag' class as not a drag!!
      target.parentNode.classList.remove("my-event-drag")
    }else{
      if (f && f.classList.contains("my-event-drag")){//just toggle it...
        //console.log("onTouchHold--WRONG target... ",evt,target, target.parentNode,f) //could be cause of that transform on elt
        f.classList.toggle("my-event-drag") 
      }else{
        //console.log("onTouchHold::class not found on Target!!",target,this.touchedItem)//could and need to use touchedItem
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
      //console.log("onTouchHold::dblClicking!",this.daSchedule.showEvtNoteScoreMobile(item.id))
      this.onDblClickEvent(evt,item)
    }
  },
  scrollToEvent (event) {
      this.$refs.calendar.scrollToTime(event.time, 350)  //umm try to go a lil up? toReview**
  },
  scrollToTime (timey,speed=null) { 
    if (this.$refs.calendar){//just to see..gotta check first! >>doesnt seem to work in first loop...second loop neither!! >WORKs when it's one iteration only!
      let s = addToDate(timey, { minute: -10 }) //remove some minutes in order to center evt..
      //console.log(`scrollToTime::gonna SCROLL`,timey.time, s.time, speed)//,JSON.parse(JSON.stringify(this.$refs)))
      this.$refs.calendar?.scrollToTime(s.time, speed ? speed=='fast'? 400 : 1000 : 500)  //whats point of the second number param?!? >>OH the speed of the scroll!!!
    }else {
      //bon try again? >>can keep trying >>BAAD! to review**
      setTimeout(() => { //should prolly clear it!!---assign to a variable first...
        //let newTimey = parseDate(new Date()) //bon bad with overlaps as goes back to current time....
        console.log(`scrollToTime::NO SCROLLY at`,timey.time,"Trying again....")//"Now going to: "+newTimey.time)
        this.scrollToTime(timey,'slow') // >> hadO ? 'slow' : 'fast' >> with overlaps, scroll slow, else false! >>meh slow better
      }, 1000 )
    }
  },
  //for Evts time change
  confirmTimeChange(title, mess, okbtn, altbtn, executeOk, executeCancel,executeDismiss=null){
    this.$q.dialog({
      title: title, //oldie >>'Default Time Change?' 
      message: mess,
      cancel: "Cancel", //false
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
          this.doNotify(`No selection made...Leaving as is`, "info")//,'bottom') //Leaving Evt as is!
          executeDismiss ? executeDismiss() : console.log("confirmTimeChange:: No Dismiss func to execute!")
          return
        }
        return executeOk(data)
      }).onCancel(() => { //still executed when clicking outside smh....
          //console.log("confirmTimeChange>> executeCancel...")
          executeCancel()  
      })
  },
  //same as confirmChoiceDialog below with seamless the only diff...toMerge**
  radioChoiceDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
    this.$q.dialog({
      title: title,//'Alert',
      cancel: onCancel ? true : false, //false, //or check if onCancel != null
      persistent: true, //have to choose!--see about passing in flag!!
      //position:"top", //"top" | "right" | "bottom" | "left" | "standard"(default) >>to better see calendar underneath..but weird
     // style:"background-color: rgba(0, 0, 255, .5)",
      message: mess,
      seamless:true, //>>WORKS!! can interact with page below and also have underneath page background!!--bon could be problem if user click underneath thooo--toReview**
      options: {
        type: 'radio',
        model: selectedM, //oldie >>'', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
        // inline: true           
        items: labels
      },
      //{{ style: { backgroundColor: 'transparent' }, }} || backgroundColor: 'rgba(52, 52, 52, 0.1)'  >>for class or style --toTry**
      }).onOk((data) => {
          if (onOk) {
            if(data === ''){ //invoked again to handle when user doesnt make selection!
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
  checkBoxDialog(title, mess,labels,onOk = null,onCancel = null,onDismiss=null){
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
      persistent: true,
      class:"overflow-wrap: break-word;", //toSee..
      style:""
    }).onOk(data => {
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
  //without seamless
  confirmChoiceDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
    this.$q.dialog({
      title: title,//'Alert',
      cancel: onCancel ? true : false, //false, //or check if onCancel != null
      persistent: true, //have to choose!--see about passing in flag!!
      message: mess, //would be nice to bold this when title is empty for byScore/byPrio--ToReview**
      //fullWidth:true, //ugly BUT should set width for byScore as long wording? with >> style:"max-width: 800px" ..toTry**
      //seamless:true, //Not! interact with page underneath--important
      options: {
        type: 'radio',
        model: selectedM, //oldie >>'', //can select nothing if left blank>>handled below >>never use boolean for values as false is same as empty string smh
        // inline: true           
        items: labels
      },
      //{{ style: { backgroundColor: 'transparent' }, }} || backgroundColor: 'rgba(52, 52, 52, 0.1)' 
      }).onOk((data) => {
          if (onOk) {
            if(data === ''){ //invoked again to handle when user doesnt make selection!
              //console.log('confirmChoiceDialog::onOk >> Empty :(',data)
              this.confirmChoiceDialog(title,mess, labels,selectedM, onOk,onCancel,onDismiss)
            }else {
              //console.log('confirmChoiceDialog::onOk >>',data)
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
  //custom component with toggle elt to skip overlapChecks
  scheduleByDialog(title, mess,labels,selectedM, onOk = null,onCancel = null,onDismiss=null){
    this.$q.dialog({
      component: scheduleBy,
      componentProps: {
        title:title,
        message:mess,
        options:labels,
        selectedO:selectedM
        //showDialog:true  // >>not needed even...
      }
    }).onOk((data) => {
          if (onOk) {
            if(data.choice == ''){ //invoked again to handle when user doesnt make selection!
              this.scheduleByDialog(title,mess, labels,selectedM, onOk,onCancel,onDismiss)
            }else {
              //console.log('scheduleByDialog::onOk!!',data)
              onOk(data)
            }
          }
      }).onCancel(() => {
          if (onCancel) {
            onCancel()
          }
      }).onDismiss(() => {
          if(onDismiss){ //for cleanup and other actions
            //console.log('scheduleByDialog::onDismiss!! executin...')
            onDismiss()
        }
      })
  },
  confirmAction(title,message, okbtn,executeOk, executeCancel, executeDismiss=null){ //should pass in cancel btn...maybe
    this.$q.dialog({
      title: title,
      cancel: true,
      ok: okbtn, //"Save",
      //persistent:      
      // position: 'bottom',
      //noBackdropDismiss  //should add this when user have to make choice
      message: message,
      multiLine: true,
    }).onOk(() => {
        executeOk()
    }).onCancel(() => {
        executeCancel()
    }).onDismiss(() => {
      if(executeDismiss){
        executeDismiss()
        return
      }
    })
  },
  //same as confirmAction above with custom cancel...
  confirmCancelAction(title,message, okbtn,cancelbtn,executeOk, executeCancel, executeDismiss=null){ //should pass in cancel btn...maybe
    this.$q.dialog({
      title: title,
      cancel: cancelbtn,//true,
      ok: okbtn, //"Save",
      //persistent:      
      // position: 'bottom',
      //noBackdropDismiss  //should add this when user have to make choice
      message: message
    }).onOk(() => {
        executeOk()
    }).onCancel(() => {
        executeCancel()
    }).onDismiss(() => {
      if(executeDismiss){
        executeDismiss()
        return
      }
    })
  },
  doNotifyTimeout(messg, colorNotif = undefined, position = 'top',timeout = null){
    this.$q.notify({
      color: colorNotif !== undefined ? colorNotif : 'negative', // color="info || color="grey-8"
      position: position,
      message: messg,
      icon: colorNotif == undefined ? 'report_problem' : 'thumb_up', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
      //group?: boolean | string | number; >> : false, // required to be updatable
      timeout:timeout? timeout : 5000,  //// number >> time to display (in milliseconds)>>default is 5000
      multiLine: true,  //for larger text
      classes: 'myNotification'
      //actions: [  //for btn action
      //    { label: 'Reply', color: 'yellow', handler: () => { /* ... */ } }
      //  ]
      //caption: '5 minutes ago', >>smaller text under message
      //avatar: 'https://cdn.quasar.dev/img/boy-avatar.png' //same size as icon...
    })
  },
  doNotify(messg, colorNotif = undefined, position = 'top'){
    this.$q.notify({
      color: colorNotif !== undefined ? colorNotif : 'negative',
      position: position,
      message: messg,
      multiLine: true,  //for larger text--seems better!
      timeout: 2000,
      icon: colorNotif == undefined ? 'report_problem' : 'thumb_up', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
      classes: 'myNotification' //see if goes dissapears fast?
      //group?: boolean | string | number;
    })
  },
  doNotifyCaption(messg, cap, colorNotif = undefined, position = 'top'){
    this.$q.notify({
      color: colorNotif !== undefined ? colorNotif : 'negative',
      position: position,
      message: messg,
      caption:cap,
      multiLine: true,  //for larger text--seems better!
      icon: colorNotif == undefined ? 'report_problem' : 'thumb_up', //oldie >> 'report_problem'  //others >> warning || thumb_up || tag_faces
      classes: 'myNotification'
      //group?: boolean | string | number;
      //timeout?: number; // time to display (in milliseconds)>>default is 5000
    })
  },
  withActionNotify(messg, actionHandler = null, colorNotif = null, position = null,dismiss = null){
    this.$q.notify({
      color: colorNotif ? colorNotif : 'negative',
      position: position ? position : 'top',
      message: messg,
      icon: colorNotif ? 'thumb_up' : 'report_problem',   //others >> warning || thumb_up || tag_faces
      classes: 'myNotification',
      multiLine: true,
      //group: group, //boolean | string | number;
     //timeout: timeout ?? 5000, // time to display (in milliseconds)>>default is 5000
      //closeBtn:"Dismiss", //"Okey",
      //onDismiss:dismiss, //no need for ()
      actions: [ //toReview** send label and handler from caller
          {label: 'Force?', color: 'yellow', handler: () => { 
            if(actionHandler){actionHandler()}else{console.log('withActionNotify::ActionHandler::NOTHING...')}
          }},
          {label: 'Dismiss', color: 'grey', handler: () => { //kinda hijack to handle cancel
            if(dismiss){dismiss()}else{console.log('withActionNotify::dismissHandler::NOTHING...')}
          }}
        ]
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
  width: calc(100% - 5px)
  border: 2px solid #888
  border: rgba(0, 0, 255, .5) 2px solid

.labely
  overflow-wrap: break-word
  text-emphasis: sesame #f32937
  text-decoration: underline dotted #f32937

.no-time-select
  z-index: 9
  transform: scale(2, .75)

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
  z-index: 9
  transform: rotateY(45deg) translateZ(1em)
  transition: transform 100ms linear

.my-header-drag
  outline: 1px dashed #213
  opacity: 0.7
  z-index: 9
  transform: scale(1.5)
  transition: transform 100ms linear

.forMobile
  display: none

.myNotification
  transition: 0.1s ease all

@media (max-width: 500px)
  .instru
    display: none
  .forMobile
    display: block
    z-index: 9

  .allGood
    background-color: rgb(25,118,210)
  
  .unsaved
    background-color: red
    transition-property: background-color
    transition-duration: 2s
    transition-delay: 0.5s

  .doBounce
    animation: bounce 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both
    transform: translate3d(0, 0, 0)
  
  @keyframes bounce
    10%,
    90%
      transform: translate3d(-1px, 0, 0)
    20%,
    80%
      transform: translate3d(2px, 0, 0)
    30%,
    50%,
    70%
      transform: translate3d(-4px, 0, 0)
    40%,
    60%
      transform: translate3d(4px, 0, 0)
</style>