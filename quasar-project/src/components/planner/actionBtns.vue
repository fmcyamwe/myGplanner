<template>
    <div class="q-px-sm boxy">
        <div v-if="showReloadBtn">
            <sched-btn
            text-label="Reload"
            class="sched-btn"
            text-color="green"
            @do-btn-action="$emit('onReloadSaved')"
            /><!--click="$emit('increaseBy', 1)"-->
        </div>
        <div v-if="showClearBtn">
            <sched-btn
            text-label="Clear"
            class="sched-btn"
            text-color="lime-5"
            @do-btn-action="$emit('onClearDay')"
            />
        </div>
        <div v-if="showActionBtns"> <!--"daSchedule.getProps().showLoadDefaults"-->
            <sched-btn
            :textLabel="defaultBtnLabel"
            :isDisabled="isDefaultBtnEnabled"
            class="sched-btn"
            text-color="blue"
            @do-btn-action="$emit('onLoadDefaults')"
            />
        </div>
        <div v-if="showActionBtns">
            <drop-dwn-btn
            class="sched-drop-btn"                                  
            text-color="teal"
            :disableBtn="isScoreBtnDisabled"
            :optionLabel="onScoreBtnLabel"                      
            :daOptions="scoreOptions"
            :padding="inMobile ? 'xs' : 'sm'"
            @do-reload="$emit('doReloadWithScore')"
            @choose-option="(v) =>$emit('onChoosenScore',v)"
            />
        </div>
        <div v-if="showActionBtns">
            <drop-dwn-btn
            class="sched-drop-btn"                      
            text-color="teal"                      
            :disableBtn="isPrioBtnDisabled"                      
            :optionLabel="onPrioBtnLabel"
            :daOptions="allMainGPrio"
            :padding="inMobile ? 'none' : 'sm'"
            @do-reload="$emit('doReloadWithPrio')"
            @choose-option="(v) =>$emit('onChoosenPrio',v)"
            /><!-- :disableBtn="daSchedule.getProps().disablePrioBtn" -->
        </div>
        <div v-if="showActionBtns">
            <sched-btn
            text-label="One Each"                      
            class="sched-btn"                      
            text-color="brown"                      
            @do-btn-action="$emit('onScheduleOneEach')"
            />
        </div>
        <div v-if="showActionBtns && !inMobile">
            <sched-btn v-if="!showTree"
            :text-label="!showTree ? 'By Moods' : 'HideTree'"                      
            class="sched-btn"                      
            text-color="purple"
            @do-btn-action="$emit('doHideTree')"
            /><!-- "By Moods" "showTree = !showTree"-->
        </div>
    </div>
    <!--put saveSchedule btn too?-->
</template>

<script>
import { defineComponent,defineAsyncComponent } from 'vue'
export default defineComponent ({  //this be Options Vue notation
  name: 'actionBtns',
  components:{
    schedBtn: defineAsyncComponent(() => import('../../components/planner/schedBtn.vue')),//seems good for loading on demand!
    dropDwnBtn: defineAsyncComponent(() => import('../../components/planner/dropDwnBtn.vue')),
  },
  props: {
    scoreOptions:Array,
    allMainGPrio:Array,

    showReloadBtn:Boolean,
    showClearBtn:Boolean,
    showActionBtns:Boolean,  //doShowActionBtns
    showTree:Boolean, //or mood?
    inMobile:Boolean, //toHide mood above + spacing in dropdown...smh
    //saveScheduleBtnDisabled:Boolean, //saveScheduleDisabled again with naming --redundant here...
    
    isDefaultBtnEnabled: Boolean, //naming...
    isScoreBtnDisabled: Boolean, //disableScoreBtn ...umm enable || disable?
    isPrioBtnDisabled: Boolean, //disablePrioBtn

    defaultBtnLabel: String,
    onScoreBtnLabel: String, //chosenScoreLabel
    onPrioBtnLabel: String, //chosenPrioLabel
  },
  emits: [
    'onReloadSaved',
    'onClearDay',
    'onLoadDefaults',
    'doReloadWithScore',
    "doReloadWithPrio",
    'onChoosenScore',
    'onChoosenPrio',
    'onScheduleOneEach',
    //'doSaveSchedule',
    'doHideTree'
  ],
  methods: {
    onClicked () {
      this.$emit('doReload')
    },
    onSelect(v,from) { //redundant as can do emit inline
      from == 'prio' ? this.$emit('onChoosenPrio',v) : this.$emit('onChoosenScore',v)
      
    }
  }
})
</script>
<style lang="sass" scoped>
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

<!-- orig in altDayView
    
                            
                            <div class="q-px-md boxy">
                                <div v-if="scheduleProps.showReloadBtn"> 
                                    <sched-btn
                                    text-label="Reload"
                                    class="sched-btn"
                                    text-color="green"
                                    @do-btn-action="onReloadSaved"
                                    /> //"daSchedule.getProps().showReloadBtn"
                                </div>

                                <div v-if="scheduleProps.showClearBtn">
                                  <sched-btn
                                  text-label="Clear"
                                  class="sched-btn"
                                  text-color="lime-5"
                                  @do-btn-action="onClearDay"
                                  /> //daSchedule.getProps().showClearBtn
                                </div>
                                <div v-if="doShowActionBtns"> //"daSchedule.getProps().showLoadDefaults"
                                  <sched-btn
                                  :textLabel="defaultBtnLabel"
                                  :isDisabled="isDefaultBtnEnabled"
                                  class="sched-btn"
                                  text-color="blue"
                                  @do-btn-action="onLoadDefault"
                                  />
                                </div>
                
                                <div v-if="doShowActionBtns"> //"daSchedule.getProps().showScoreBtn"
                                  <drop-dwn-btn
                                  class="sched-drop-btn"
                                  text-color="teal"
                                  :disableBtn="scheduleProps.disableScoreBtn"
                                  :optionLabel="chosenScoreLabel"
                                  :daOptions="scoreOptions"
                                  @do-reload="doReloadWithScore"
                                  @choose-option="onChoosenScore"
                                  />
                                </div>
                                <div v-if="doShowActionBtns"> //"daSchedule.getProps().showPrioBtn"
                                  <drop-dwn-btn
                                  class="sched-drop-btn"
                                  text-color="teal"
                                  :disableBtn="scheduleProps.disablePrioBtn"
                                  :optionLabel="chosenPrioLabel"
                                  :daOptions="allMainGPrio()"
                                  @do-reload="doReloadWithPrio"
                                  @choose-option="onChoosenPrio"
                                  /> //:disableBtn="daSchedule.getProps().disablePrioBtn" 
                                </div>
                                <div v-if="doShowActionBtns"> //"daSchedule.getProps().showOneEachBtn"
                                  <sched-btn
                                  text-label="One Each"
                                  class="sched-btn"
                                  text-color="brown"
                                  @do-btn-action="onScheduleOneEach"
                                  />
                                </div>
                                <div v-if="doShowActionBtns"> //"daSchedule.getProps().showOneEachBtn"
                                  <sched-btn v-if="!showTree"
                                  :text-label="!showTree ? 'By Moods' : 'HideTree'"
                                  class="sched-btn"
                                  text-color="purple"
                                  @do-btn-action="showTree = !showTree"
                                  />//"By Moods"
                                </div>
                            </div>
-->