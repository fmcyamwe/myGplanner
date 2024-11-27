<template>
<q-page padding> <!-- oldie <main class="page page--table q-pa-md" -->
    <q-pull-to-refresh @refresh="refresh">
        <div class="q-mx-auto" style="width: fill-available"> <!--style="max-width: 400px" fit-content  class="bg-grey-2 text-grey-7"-->
            <q-tabs
                v-model="tab"
                dense
                active-color="primary"
                indicator-color="purple"
                align="justify"
            >
                <q-tab name="GList" label="All Goals" />
                <q-tab name="Goal" label="Add/Update" />
                <q-tab name="Admin" label="Admin Stuff" :disable="!enableAdmin"/>
            </q-tabs>

              <q-tab-panels v-model="tab" animated > <!--class="bg-primary text-white"-->
                <q-tab-panel name="GList">
                    <q-list bordered>
                        <q-item v-if="allMGoals && allMGoals.length > 0">
                            <q-item-section>
                            <q-item-label overline class="q-mx-lg q-px-md row justify-center no-wrap" style="max-width:100%;font-weight: bolder;">
                                Swipe to Edit/Delete SubGoal
                            </q-item-label>
                            </q-item-section>
                            <q-separator spaced />
                        </q-item>
                    
                        <transition-group name="dalist">
                            <q-expansion-item v-for="goal in allMGoals" class="q-my-sm"
                            v-model="expanded[goal.id]"
                            :key="goal.id"
                            :label="goal.title"
                            :caption="goal.details"
                            :icon="goal.icon"
                            popup
                            expandSeparator
                            :header-class= "classyHeader(goal?.bgcolor)"
                            clickable>
                            <!--:icon="goal.icon" //shows when fontAwesome added in quasar.config 
                            ...literal as >> icon="fas fa-handshake" || "far fa-thumbs-up"-->
                        
                            <template v-slot:header> <!--for edit btns...-->
                                <div class="col">
                                    <q-icon v-if="expanded[goal.id] ? 'expand_less' : 'expand_more'" size="28px" right/>
                                    <!-- huh q-item-label works even if not in a q-item-section
                                        <div class="q-px-sm text-weight-bold" >{{ goal.title }}</div>
                                        <div class="q-px-sm" >{{ goal.details }}--({{ goal.priority }})</div>
                                        <i :class="goal.icon"></i> 
                                    -->
                                    <q-item-label overline>{{ goal.title }}</q-item-label>
                                    <q-item-label caption>{{ goal.details }}--({{ goal.priority }})</q-item-label>
                                    <q-icon :name="goal.icon" />
                                </div>
                                <div class="row">
                                    <q-btn v-if="expanded[goal.id]"
                                    label="Edit Pgoal" 
                                    type="reset" 
                                    color="secondary"
                                    padding="sm"
                                    noWrap
                                    noCaps 
                                    push 
                                    align="between" 
                                    class="q-mx-sm"
                                    style="max-height:3em;"
                                    @click.prevent="(e) => onParentAction('edit',goal.id,goal.title)" 
                                    />
                                
                                    <q-btn v-if="!hasSubG(goal.id) && expanded[goal.id]"
                                    label="Delete goal"
                                    type="reset"
                                    color="primary"
                                    class="q-mx-sm"
                                    style="max-height:3em;"
                                    padding="sm"
                                    noWrap 
                                    noCaps
                                    push 
                                    align="between"
                                    @click.prevent="(e) => onParentAction('del',goal.id,goal.title)"
                                    /> 
                                </div>

                            </template>
                            <template v-slot:default> 
                                <q-card v-for="subGoal in getSubGoals(goal.id)" :key="subGoal.id"> <!--v-for on a crd works?>>huh not without adding >>:key="event.id" -->
                                    <!-- bon touchswipe seem to work except that doesnt show the sliding animation...toSee if should use***
        
                                    <q-card-section v-touch-swipe.mouse="(e) => onSwipeAction(e,subGoal.id, goal.id)"
                                    class="custom-area cursor-pointer bg-primary text-white shadow-2 relative-position row flex-center">
                                       // {{subGoal.title}} >> {{subGoal.time}} :: {{subGoal.score}}  class="q-my-sm"  color="red"//
                                       <div class="q-mx-sm"> {{subGoal.title}} > {{niceyLabel(subGoal.time)}} ({{subGoal.duration}})</div>
                                       <div class="q-mx-*"> {{subGoal.score}} :: {{subGoal.canMove ? 'canMove' : 'NoMoves'}} :: {{subGoal.inDefaults ? 'InDefaults' : 'NotADefault'}} :: {{subGoal.isAlternative ? 'Alt' : ''}} </div>
                                    </q-card-section> -->
        
                                    <q-slide-item @right="(e) => onRightDelete(e, subGoal.id, goal.id)" @left="(e) => onLeftEdit(e, subGoal.id, goal.id)">
                                        <template v-slot:left>
                                        Edit
                                        </template>
                                        <template v-slot:right>
                                        Delete
                                        </template>
        
                                        <q-item>
                                            <q-item-section class="q-mx-sm">{{subGoal.title}} ({{ subGoal.score }}) </q-item-section>
                                            <q-item-section class="q-mx-sm">  {{niceyLabel(subGoal.time)}} ({{subGoal.duration}}min) </q-item-section>
                                            <q-item-section class="q-mx-*"> {{subGoal.canMove ? 'canMove' : 'NoMoves'}} :: {{subGoal.inDefaults ? 'InDefaults' : 'NotADefault'}} :: {{subGoal.isAlternative ? 'Alt' : ''}}</q-item-section>
                                        </q-item>
                                        <q-tooltip v-if="subGoal.jeSuis.length > 0">Moods:: {{subGoal.jeSuis.join(',')}} </q-tooltip>
                                    </q-slide-item>
                                    <q-separator :color="goal?.bgcolor?.toLocaleLowerCase()"/>
                                </q-card>
        
                                <q-card v-if="!hasSubG(goal.id)">
                                    <div class="q-ma-md">
                                        <b> Has No SubGoals :( </b> 
                                    </div>

                                    <q-item
                                    clickable
                                    tag="a"    
                                    dense
                                    style="margin: 0 1em 0 1em;"
                                    :onClick="(e) =>onParentAction('add',goal.id,goal.title)"
                                    >
                                    Click to Add one ...
                                    </q-item>
                                    <!--oldie below but messaging above better..prolly
                                    <q-btn label="Delete goal" type="reset" color="secondary" noWrap push align="evenly" class="q-mx-sm"  @click.prevent="(e) => onParentAction('del',goal.id,goal.title)" />
                                    OR
                                    <q-btn label="Edit goal" type="reset" color="primary" noWrap push align="evenly" class="q-mx-sm"  @click.prevent="(e) => onParentAction('edit',goal.id,goal.title)" />
                                    -->
                                </q-card>
                            </template>
                            </q-expansion-item>
                        </transition-group>
                    </q-list>

                    <br>
                    
                    <div v-if="allMGoals && allMGoals.length < 1" class="column justify-center items-center">
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

                    <q-toggle 
                    v-model="enableAdmin"
                    :label="enableAdmin ? 'Disable Admin' : 'Enable Admin'"
                    color="teal" 
                    class="q-pa-sm" 
                    align="center"/>
                </q-tab-panel>
                
                <q-tab-panel name="Goal">
                    <div class="q-pb-md" align="center">
                        ** Goals named the same can be auto-solved in Overlaps! **<q-tooltip>Title names are substring/included of/in each other</q-tooltip>
                    </div>
                    <q-card class="no-margin scroll">
                        <q-form @submit="onSubmit" class="form">
                            <div class="q-gutter-sm q-mx-auto">
                                <strong class="typey"><em>Goal Type:</em></strong>
                                <q-radio v-model="goalType" @click="softReset" class="q-pa-md" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="main" label="Main goal" />
                                
                                <q-radio v-model="goalType" @click="softReset" class="q-pa-md" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="sub" label="Sub goal" />
                            </div>

                            <q-input class="q-mx-none"
                                filled
                                v-model="goalTitle"
                                label="A Goal"
                                clearable
                                lazy-rules
                                item-aligned
                                :rules="[ val => val && val.length > 1 || 'Please type a goal']"
                            />
                            
                            <q-select v-if="showSubG"
                                class="q-mx-md q-pa-sm"
                                style="text-align: center;"
                                v-model="pGoal"
                                :options="mainGoals"
                                option-value="id"
                                option-label="title"
                                label="Parent Goal"
                                popup-content-class="q-mx-md"
                                popup-content-style="text-align: center;"
                                />
            
                            <q-input v-else
                                filled
                                v-model="details"
                                label="Description"
                                class="col q-mx-sm q-pa-md"
                            />

                            <div v-if="showSubG" class="q-gutter-sm">
                                <q-input 
                                v-model="time"
                                filled
                                outlined
                                type="time"
                                clearable
                                label="Default Schedule time"
                                hint="Can be Empty for manual add"
                                hideHint
                                class="col-xs-12 col-sm-6 col-md-4 q-mx-sm q-py-md"
                                />
                                <div class="row"> 
                                    <div class="atLeft col-6 q-mt-md"> 
                                    Duration (min)
                                    <q-knob
                                    v-model="duration"
                                    :min="5"
                                    :max="120"
                                    :thickness="0.5"
                                    show-value
                                    rounded
                                    size="6em"
                                    color="teal"
                                    trackColor="grey-3"
                                    style="margin: 0 auto;"
                                    /><!--class="q-ma-md center":step="5" meh could be whatev..size="75px"? "0.34"-->
                                </div>
                                
                                <div class="atRight col-6 q-mt-md">
                                    <q-toggle
                                    v-model="canMove"
                                    label="Can Move"
                                    left-label
                                    color="green">
                                        <q-badge
                                        color="orange" floating
                                        style="top: 5px; position: relative; width: 10px; max-width: 10px; height: 10px; max-height: 10px; padding-inline: 3px 6px; cursor: pointer">
                                        ? <q-tooltip>Or need to confirm any timeslot change</q-tooltip>
                                        </q-badge>
                                    </q-toggle>
                                
                                    <br>
                                    <q-toggle
                                    v-model="inDefaults"
                                    label="In Defaults"
                                    left-label
                                    color="blue">
                                        <q-badge 
                                        color="orange" floating
                                        style="top: 5px; position: relative; width: 10px; max-width: 10px; height: 10px; max-height: 10px; padding-inline: 3px 6px; cursor: pointer">
                                        ? <q-tooltip>Is Default/Get done daily!</q-tooltip>
                                        </q-badge>
                                    </q-toggle>
                                
                                    <br>

                                    <q-toggle v-if="duration < 30"
                                    v-model="isAlternative"
                                    label="As Alternative"
                                    left-label
                                    color="blue">
                                        <q-badge 
                                        color="orange" floating
                                        style="top: 5px; position: relative; width: 10px; max-width: 10px; height: 10px; max-height: 10px; padding-inline: 3px 6px; cursor: pointer">
                                        ? <q-tooltip>Can be scheduled as an alternative</q-tooltip>
                                        </q-badge>
                                    </q-toggle>
                                </div>
                                </div>

                                
                                <br>
                            
                                <div style="clear: both;">
                                    <q-input v-model="score"
                                    filled
                                    label-slot
                                    hint="format: #on#"
                                    lazy-rules
                                    class="col q-mx-sm q-pa-md"
                                    :rules="[ val => val && val.match(/^\don\d$/g) && val.length > 3 || 'hint, hint!']"
                                    > 
                                    <template v-slot:label>
                                        <div class="row items-center all-pointer-events q-mx-xs">
                                        <!--<q-icon class="q-mx-xs" color="deep-orange" size="24px" name="mail" /> -->
                                        Score (hover for more info)
                                        <q-tooltip class="bg-grey-8" anchor="top left" self="bottom left" :offset="[0, 8]">Progress/Rating to close gap between Min && Max values</q-tooltip><!--to next level of Mastery-->
                                        </div>
                                    </template>
                                    </q-input>

                                    <q-badge color="secondary" class="q-mx-sm"><!--conveys better? yup-->
                                    Model: {{ scoreRange.min }}on{{ scoreRange.max }}
                                    </q-badge>
                                    <q-range v-model="scoreRange" label :step="1" :min="0" :max="10" :inner-min="1" :inner-max="9" markers color="green"/>
                                </div>

                                <br>
                                <!--really hard to enter keywords on mobile as enter does form submission...below didnt work
                                :updateInputValue="()=>{ hello(moods,{})}"
                                @new-value="()=>{ hello2(moods,{})}"
                                
                                should just hide moods anyway on mobile?!?-->
                                <q-select
                                label="Moods: 'je-suis'"
                                filled
                                v-model="moods"
                                use-input
                                use-chips
                                multiple
                                hide-dropdown-icon
                                new-value-mode="add-unique"
                                class="col-auto"
                                input-debounce="0"
                                ><!-- v-on:keyup.enter="()=>{ hello2(moods,{})}" 
                                still doesnt stop form submission on mobile smh >>huh have to add space for it to work?!?-->
                                    <template v-slot:label>
                                        <div class="row q-mx-xs no-wrap">
                                            <q-icon class="q-mx-xs" color="blue" size="24px" name="mood" />
                                            Moods (hover for more info)
                                            <q-tooltip class="bg-grey-8" anchor="top left" self="bottom left" :offset="[0, 8]">'je-suis' keywords for scheduling.</q-tooltip>
                                        </div>
                                    </template>
                                    <template v-slot:selected-item="scope">
                                        <q-chip
                                        removable
                                        dense
                                        @remove="scope.removeAtIndex(scope.index)"
                                        text-color="black"
                                        class="q-ma-none"
                                        style="width:100px"
                                        :tabindex="scope.tabindex"
                                        >
                                        {{ scope.opt }}
                                        </q-chip>
                                    </template>
                                </q-select>
                                <br>
                            </div>

                            <div v-else class="col q-mx-sm"><!-- was >> v-if="!showSubG" >>this for Pgoal -->
                                <q-select
                                v-model="bgcolor"
                                :options="avColors"
                                :color="bgcolor"
                                label="Color"
                                popup-content-class="q-mx-md"
                                popupContentStyle="text-align: center;"
                                class="q-mx-sm q-pb-md"
                                >
                                    <template v-slot:label>
                                        <div class="row items-center all-pointer-events q-mx-xs">
                                        <q-icon class="q-mx-xs" :color="bgcolor" size="24px" name="palette" />
                                        Color
                                        <q-tooltip class="bg-grey-8" anchor="top left" self="bottom left" :offset="[0, 8]">Subgoals color group</q-tooltip>
                                        </div>
                                    </template>
                                    <template v-slot:option="scope">
                                       <!--<span :style="{ color: scope.opt }">{{ scope.opt }}</span> //span squishes stuff-->
                                        <!--<div :style="{ color: scope.opt }">{{scope.opt }}</div> -->
                                        <!-- renders but need hexColor() for some colors>>huh below click works!!-->
                                        <q-item :style="{ color: hexyColor(scope.opt) }" clickable @click.prevent="() => {bgcolor = scope.opt }" v-close-popup>
                                            <q-item-section style="text-align: center;">
                                            <q-item-label>{{ scope.opt }}</q-item-label>
                                            </q-item-section>
                                        </q-item>
                                    </template>
                                </q-select>

                                <q-input
                                    filled
                                    v-model.number="priority"
                                    type="number"
                                    label="Priority"
                                    hint="0 to 10"
                                    class="q-mx-sm q-pb-md"
                                    :rules="[ val => val && val > 0 && val <=10 || 'hint hint!!']"
                                />

                                <br>
                                <div v-if="currentIcon">
                                    Icon: <i :class="currentIcon" id="i-icon"></i>
                                    <br><!--:icon="icon" OR with import:<Icon :data="icon" :size="24" color="#124ebb"></Icon> -->
                                    <q-icon :name="currentIcon" id="q-icon" @click.prevent="(e)=>{ hello(e, currentIcon)}"  />
                                    <br>
                                    <q-toggle
                                    v-model="changeIcon"
                                    label="Change Icon?"
                                    left-label
                                    />
                                </div>

                                <div :class="changeIcon ? 'q-mb-md iconPickWrap' : 'doHide'"> <!--bon class like this works...just keeps height tho...-->
                                    <Vue3IconPicker v-if="changeIcon" 
                                v-model="icon" 
                                placeholder="Select icon" 
                                class="iconPick"
                                valueType="name"
                                :displaySearch="true"
                                :excludeIcons="['Aws','Amazon','Ambulance']"
                                @click.prevent="()=>{ hello2(icon,{})}" 
                                /> 
                                <!-- valueType as name important as default is svg
                                //bon review placement as doesnt show all of dialog --show search ?
                                can use click to increase scroll page maybe?!? 
                                @click="()=>{ hello2(icon,{})}" 
                                v-close-popup doesnt work :(
                                excludeIcons works at least!!
                                -->
                                </div>
                                
                            </div>

                            <div class="q-ml-sm q-mb-md q-gutter-md">
                                <q-btn :label="buttonLabel" type="submit" color="primary"  align="between" @submit="onSubmit"/>
                                <!--Cancel only shown on edit-->
                                <q-btn v-if="buttonLabel == 'Save'" label="Cancel" type="reset" color="secondary" align="between" @click="doCancel"/>
                            </div>
                        </q-form>
                    </q-card>
                </q-tab-panel>

                <q-tab-panel name="Admin">
                    <q-slide-transition> <!--not sure still needed...ToRemove prolly-->
                        <div v-if="enableAdmin">
                            <div class="q-pa-md" v-if="showGoalsArea">
                                <q-btn v-if="isImporting && mainGJson && mainGJson !='' && subGJson && subGJson !=''" label="Reset" push color="white" text-color="primary" @click="doPrint" class="q-px-md" /> <!-- oldie >> "() => { resetBoxes(); step = 1 }"-->
                            
                                <q-stepper
                                    v-model="step"
                                    header-nav
                                    ref="stepper"
                                    color="primary"
                                    animated
                                >
                                    <q-step
                                    :name="1"
                                    title="Main Goals"
                                    icon="settings"
                                    :done="step > 1"
                                    :header-nav="step > 1"
                                    :error="step > 1 && mainGJson == void 0"
                                    > <!-- :error="step > 1 " && mainGJson == null ... == void 0 -->
                                        <div v-if="isImporting" class="q-pa-md"> <!--  style="max-width: 300px"-->
                                            <q-input
                                            v-model="mainGJson"
                                            filled
                                            type="textarea"
                                            autogrow
                                            /> <!--autogrow? yup better-->
                                        </div>
                                        <div v-else> 
                                            {{ mainGJson }}
                                        </div>
                                    <q-stepper-navigation>
                                        <q-btn @click="() => { done1 = true; step = 2 }" noWrap align="around" color="primary" label="SubGoals->"/>
                                    </q-stepper-navigation>
                                    </q-step>
                            
                                    <q-step
                                    :name="2"
                                    title="SubGoals"
                                    icon="create_new_folder"
                                    :done="step > 2"
                                    :header-nav="step > 2"
                                    :error="step > 2 && subGJson == void 0"
                                    >
                                        <div v-if="isImporting" class="q-pa-md"> <!--  style="max-width: 300px"-->
                                            <q-input
                                            v-model="subGJson"
                                            filled
                                            type="textarea"
                                            autogrow
                                            />
                                        </div>
                                        <div v-else> 
                                            {{ subGJson }}
                                        </div>
                                    <q-stepper-navigation>
                                        <q-btn @click="() => { done2 = true; step = 3 }" noWrap align="around" color="primary" label="AllScheduled->" />
                                        <q-btn flat @click="step = 1" noWrap align="around" color="primary" label="Back" class="q-ml-sm" />
                                    </q-stepper-navigation>
                                    </q-step>
                            
                                    <q-step
                                    :name="3"
                                    title="All Dates"
                                    caption="Optional"
                                    icon="add_comment"
                                    :header-nav="step > 3"
                                    >
                                        <div v-if="isImporting" class="q-pa-md"> <!--  style="max-width: 300px"-->
                                            <q-input
                                            v-model="allJson"
                                            filled
                                            type="textarea"
                                            autogrow
                                            />
                                        </div>
                                        <div v-else> 
                                            {{ allJson }}
                                        </div>
                                    <q-stepper-navigation>
                                        <q-btn color="primary" @click="() => { done3 = true; doImport() }" :label="AdminLabel" noWrap align="around"/> <!-- oldie >> @click="done3 = true"-->
                                        <q-btn flat @click="step = 2" noWrap align="around" color="primary" label="Back" class="q-ml-sm" />
                                    </q-stepper-navigation>
                                    </q-step>
                                </q-stepper>
                            </div>
                            
                            <div v-if="!showGoalsArea" class="q-gutter-sm q-mx-auto">
                               <!--<strong class="typey"><em>Goal Type:</em></strong>-->
                             <q-radio v-model="goalType" @click="softReset" class="q-pa-md" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="main" label="Main goal" />
                             <q-radio v-model="goalType" @click="softReset" class="q-pa-md" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="sub" label="Sub goal" />
                            </div>
                            <div class="row justify-center q-pa-md">
                                <q-btn
                                class="q-mt-md"
                                color="white"
                                text-color="blue"
                                elevated
                                label="Print"
                                no-caps
                                align="between"
                                @click="doPrint"
                                />
                                <q-space/>
                                <q-btn
                                class="q-mt-md"
                                color="white"
                                text-color="red"
                                elevated
                                align="between"
                                no-wrap
                                no-caps
                                :label="resetLabel()"
                                @click="doReset"
                                /><!--"Reset GoalType"...weird that have to use parenthese() for label...-->
            
                                <q-space/>
            
                                <q-btn v-if="!isImporting"
                                class="q-mt-md"
                                color="white"
                                text-color="red"
                                elevated
                                align="between"
                                label="Import"
                                no-caps
                                @click="() => {showGoalsArea = true ; isImporting = true; step = 1}"
                                /><!--huh above works! -->
                            </div>
                        </div>
                    </q-slide-transition>
                </q-tab-panel>        
              </q-tab-panels>
   
            </div>
        
    </q-pull-to-refresh>
</q-page>
</template>
<script>
//import draggable from 'vuedraggable'
import { computed, ref, onBeforeMount, onBeforeUnmount, watchEffect } from 'vue'  //nextTick, onMounted
import { useGoalStore } from 'stores/goalStorage'  //@stores? >>not needed
import { useQuasar } from 'quasar'
import { pGColors,hexColor } from '../util/utiFunc'
 import { Vue3IconPicker } from 'vue3-icon-picker' //can import Icon  to use and show the selected icon OR parse the name first as done at goalStorage level smh
 import 'vue3-icon-picker/dist/style.css'


export default {
    components: {
        Vue3IconPicker
     },
    name: 'goalsPage',
    setup () {
        //const splitterModel = ref(40) //at 40%
        const enableAdmin = ref(false)
        const showGoalsArea = ref(false)
        const isImporting = ref(false)
        const step = ref(1)  //stepper import/export
        const mainGJson = ref(null)
        const subGJson = ref(null)
        const allJson = ref(null)
        
        const goalTitle = ref('')
        const details = ref('')
        const bgcolor = ref('')
        const avColors = ref([]) // oldie >> ref(pGColors())
        const time = ref('')
        const priority = ref(3)
        const duration = ref(15) //min of 15
        const score = ref('')
        const scoreRange = ref({min: 1, max: 9}) //visual of score...
        const moods = ref(null)
        const canMove = ref(false)
        const inDefaults = ref(false) //NOT by default?!?
        const isAlternative = ref(false)

        const goalType = ref('line') //so nothing is selected at first
        const pGoal = ref(null)

        const icon = ref(null) //toSee with default //null // icon of parent goal --toRename** >> pGIcon
        const changeIcon = ref(false) //
        const currentIcon = ref('fas fa-utensils') //null //with above to proper show/hide icon on edit/add parentGoal

        const howThis = ref(null) //watchEffect testing...not bad--toRemove

        const mainGoals = ref(null) //computed(() => store.getMainGoals) //works except that reload cannot occur since these are read-only!
        const subGoals = ref(null) //computed(() => store.getSubGoals)
        
        const expanded = ref({})//ref(false)

        const buttonLabel = ref('Submit')

        const tab = ref('GList') //start with all Goals tab //Goal
        
        //const red = ref('arrow')
        //----
        const $q = useQuasar()
        const store = useGoalStore()

        //const timer = ref(null)
        //let timer  //redundant...
        let updatingSubG = null //to keep track of goalID when editing

        const allMGoals = computed(() => mainGoals.value) //oldie store.getMainGoals >> doesnt updates

        const showSubG = computed(() => goalType.value ==='main' ? false : true )

        const AdminLabel = computed(() => isImporting.value ? "Import" : "Finish" )

        watchEffect(() => {
            // tracks A0 and A1
            //A2.value = A0.value + A1.value
            //howThis.value = mainGoals.value  //does track changes but redundant with `allMGoals` above
    
            scoreRange.value = parseScore() //would work?!? or need to pass in score.value? >>seems to work

            //score.value = scoreRange.value.min+"on"+scoreRange.value.max  //this? >>nope >>see if placed in own watchEffect? >>yeee works
        })
        watchEffect(() => {
            score.value = scoreRange.value.min+"on"+scoreRange.value.max
        })


        onBeforeMount(() => { //was onMounted
            //let e = new Date(Date.now() + 1000 * 100)
            //console.log(`the component is now mounted.`,e)
            resetGsAndColors()
        })

        //onBeforeUnmount(() => {
        //    clearTimeout(timer)  //or with .value? >>no need when seclaring with 'let' 
        //})

        function resetLabel() {
            return goalType.value === 'line' ? "Reset ALL" : `Reset ${goalType.value.toUpperCase()}`
        }

        function parseScore(){
            const tokens = score.value.split(/on/) 
            if (tokens.length != 2) {//should be at most two variables....
                //console.log(`parseScore error? >>${t}`, tokens)  
                //return -89 //guardrails to distinguish with potensh error below*** could still fail with 'one' though smh..toReview***
                return {min: 0, max: 9}
            }
            //console.log(`parseScore for ${t}`, tokens)
            //return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!
            return {min: tokens[0], max: tokens[1]}
        }

        function resetGsAndColors(){
            let sorty = (a, b) => { //by earliest id! >>can be wrong! >>see goalStorage file
                if (a.id > b.id) return 1 //b.parentGoal
                if (a.id == b.id) return 0
                if (a.id < b.id) return -1
            }
            let sortByPrio = (a, b) => { return b.priority - a.priority}  //largest to lowest
                //if (a.priority > b.priority) return 1
                //if (a.priority == b.priority) return 0
                //if (a.priority < b.priority) return -1
            //}

            mainGoals.value = store.getMainGoals
            subGoals.value = store.getSubGoals
            let currentColors = []
            if(mainGoals.value.length > 0){
                mainGoals.value.forEach(item => {
                    expanded[item.id] = expanded[item.id] || false  //if was true already...toTest

                    currentColors.push(item.bgcolor)
                })
            }

            let c = pGColors()
            
            avColors.value = c.filter(item => !currentColors.find(o => o == item)) //filter out already taken colors...
            
            bgcolor.value = avColors.value[0] //default to first available--otherwise white..
            mainGoals.value.sort(sortByPrio)

            //console.log(`resetGsAndColors`,JSON.parse(JSON.stringify(mainGoals.value))) //allMGoals
        }

        function doPrint () {
            //JSON.stringify(store.goalList,null,1)  >>works!

            step.value = 1
            showGoalsArea.value = true
            isImporting.value = false

            //if (goalType.value ==='main') { //oldie
            //    console.log(JSON.stringify(mainGoals.value,null,1)) //store.getMainGoals
            //} else {
            //    console.log(JSON.stringify(subGoals.value,null,1)) //store.getSubGoals
            //}

            //populate boxes
            mainGJson.value = JSON.stringify(mainGoals.value,null,1)  //1-space indents...logging mostly---toSee with two-space? bof..
            subGJson.value = JSON.stringify(subGoals.value,null,1)
            allJson.value = JSON.stringify(store.getAllDates,null,1)
            
        }

        function doImport () {
            showGoalsArea.value = true

            if (isImporting.value){
                if(!subGJson.value || subGJson.value == '' || !mainGJson.value || mainGJson.value == ''){
                    console.log("ERROR::importing empty!")
                    errorNotify(`Something is empty :(`)
       
                    return
                }

                //const obj = JSON.parse('{"name":"John", "age":30, "city":"New York"}');
                let mainG = null
                let subG = null
                let allS = null
                try{
                    //const 
                    mainG = JSON.parse(mainGJson.value)
                    let hasError = []

                    // "id": 7,"title": "Tinker","details": "Tinker","priority": 2,"bgcolor": "amber",
                    for (let i in mainG) {
                        let g = mainG[i]
                        if ("id" in g && "title" in g && "priority" in g){  //umm bgcolor needed?!? toSee**
                            //store.addMainGoal(goalTitle.value,details.value,bgcolor.value,priority.value)
                            //store.addMaMinGoal(g)
                            //console.log("valid pGoal...",g?.title)
                        }else{
                            //throw error? >> throw "too low"; >>would stop everything!
                            console.log("ERROR::invalid Parent Goal!",g)
                            //OR save it and throw in the end? >>better as would log in one go! 
                            hasError.push(`:INVALID pGoal >> ${JSON.stringify(g)}`) 
                        }
                    }
                    if(hasError.length > 0){ throw hasError } else { console.log("Yeee!! PGoals are good!") }
                }catch (e) {
                    //console.log(e instanceof SyntaxError)
                    if (e instanceof SyntaxError){
                        console.log("ERROR:: MainG SyntaxError!",e)
                    } else{
                        console.log("ERROR:: MainG dataError!",e)
                    }
                    errorNotify(`Error with Parent goals :(...check logs`)
                    
                    return
                }

                try{
                    //const 
                    subG = JSON.parse(subGJson.value)
                    //"id": 31,"parentGoal": 7, "title": "Tinker",  "score": "1on5",  "time": "08:00",  "duration": 30,  
                    //"canMove": true,"inDefaults": false,"isAlternative": false, "jeSuis": []
                    let hasError = []

                    for (let i in subG) {
                        let g = subG[i]
                        if ("id" in g && "parentGoal" in g && "title" in g && "score" in g && "duration" in g){ //just check for defaults....
                            //store.addSubGoal(pId.id,goalTitle.value,score.value,time.value, duration.value,canMove.value, inDefaults.value,isAlternative.value,moods.value)
                            //store.addSubyGoal(g)
                            //console.log("valid subGoal...",g?.title)
                        }else{
                            //throw error? >> throw "too low";
                            console.log("ERROR::invalid subGoal!",g)
                            hasError.push(`:INVALID subGoal >> ${JSON.stringify(g)}`) 
                        }
                    }
                    if(hasError.length > 0){ throw hasError } else { console.log("Yeee!! subGoals are good!") }
                }catch (e) {
                    //console.log(e instanceof SyntaxError)
                    if (e instanceof SyntaxError){
                        console.log("ERROR:: subG SyntaxError!",e)
                    } else{
                        console.log("ERROR:: subGoals dataError!",e)
                       
                    }

                    errorNotify(`Error with Sub goals :(...check logs`)


                    return
                }

                if(allJson.value && allJson.value != ''){
                    try{
                        allS = JSON.parse(allJson.value)
                        //should check that valid?!? 
                    } catch (e) {
                        //console.log(e instanceof SyntaxError)
                        if (e instanceof SyntaxError){
                            console.log("ERROR:: allS SyntaxError!",e)
                        }

                        errorNotify(`Error parsing AllEvents...skipping!`)
                    }
                }

                console.log("importing...",mainG,subG,allS)

                //import >>implicit overwriting!
                store.importGoals(mainG,subG,allS)  

                //and then reset to view...doesnt actually properly reset--toREview***
                this.doPrint()
                
            }else{
                console.log("finished prolly?.....")
                showGoalsArea.value = false
                this.resetBoxes()
            }
            
        }
        
        function resetBoxes(){

            mainGJson.value = null
            subGJson.value = null //JSON.stringify(subGoals.value,null,1)
            allJson.value = null //JSON.stringify(store.getAllDates,null,1)

            console.log('resetBoxes!!')
        }

        function doReset () {
            //umm kinda redundant to check goalType as not visible...oh well
            if (goalType.value === 'main') {
                
                $q.dialog({
                title: 'Warning',
                cancel: true,
                message: `Reset all Parent Goals? Removes subGoals as well!`
                }).onOk(() => {
                    //store.removeMaingoal(id, false)
                    store.resetMain()
                    store.resetSub()//should Also remove the subgoals!!---makes sense
                    errorNotify(`Reset All Goals`,'top','thumb_up','positive')
                    reload()
                }).onCancel(() => {
                    console.log('Cancelled!!')
                })

            } else if(goalType.value === 'sub') {
                store.resetSub() //this also clears allDates...
                reload()
                errorNotify(`Reset Sub Goals`,'top','thumb_up','positive')
                tab.value = "GList"  //nav to GList tab
            } else {
                $q.dialog({
                title: 'Warning',
                cancel: true,
                message: `Reset all goals?`
                }).onOk(() => {
                    //console.log("Resetting all goals")
                    store.resetAll()
                    errorNotify(`Reset ALL`,'top','thumb_up','positive')
                    //should also reload page
                    location.reload(); //meh whole page reload but should do
                }).onCancel(() => {
                    console.log('Cancelled!!')
                })
            }
        }

        function editSubGoal(){
            if(updatingSubG || updatingSubG === 0){ //sheesh those ids of 0
                store.editSubGoal(updatingSubG,goalTitle.value,score.value,time.value, duration.value,canMove.value,inDefaults.value,isAlternative.value,moods.value)
            } else{
                errorNotify(`ERROR: No subgoalId to edit found!`+updatingSubG)
                console.log("No subgoalId to edit?!?",updatingSubG) //prolly 0 smh
            }
        }

        function editAction(){ //for all edits
            let pId = pGoal.value//umm should be present...toMonitor**
            if (goalType.value ==='main') {
                if(pId?.id === updatingSubG){ //oldie >> updatingSubG &&  >>second check just in case(beware of 0)
                    store.editMainGoal(updatingSubG,goalTitle.value,details.value,bgcolor.value,priority.value,icon.value ?? currentIcon.value) //use selected icon as icon would be null
                    
                    expanded.value[pId?.id] = false
                } else{
                    console.log("Error when Edit Parent Goal...inconsistent or not found!",updatingSubG,pId)//shouldnt get here..prolly
                }
            } else { //subgoal
                if (time.value == ''){
                    warnNotify(`Schedule Time not set...Will need manual Scheduling!!`)
                //    return
                }
                editSubGoal()
                expanded.value[pId?.id] = false //just so that it can be updated!
            }

            buttonLabel.value = "Submit"

            hardReset() //reset variables >>also navigate to GList tab...
            //tab.value = "GList"  //nav to GList tab
        }

        function onSubmit() {
            
            //console.log("onSubmit",JSON.parse(JSON.stringify(buttonLabel.value)),JSON.parse(JSON.stringify(time.value)))
            let action = buttonLabel.value === "Save" ? 'Save' : 'Add'

            if(action === "Save"){
                editAction()
                return
            } //else { 
            
            //adding new goal
            if (goalTitle.value.trim() == ''){
                errorNotify(`Cannot have an empty Title!`)
                return
            }

            if (goalType.value === 'main') {
                //console.log("onSubmit::main",goalTitle.value,details.value,bgcolor.value,priority.value,icon.value)
                store.addMainGoal(goalTitle.value,details.value,bgcolor.value,priority.value,icon.value ?? currentIcon.value) //use selected icon just in case
            } else {
                if (time.value == ''){
                    warnNotify(`Schedule Time not set...Will need manual Scheduling!!`)
                //    return
                }
                if(pGoal.value){
                    let pId = pGoal.value
                    store.addSubGoal(pId.id,goalTitle.value,score.value,time.value, duration.value,canMove.value, inDefaults.value,isAlternative.value,moods.value)
                    //console.log("Subgoal Goal added for parent:",pId.title)

                    expanded.value[pId.id] = true //to see updates when back in tab
                }
                else{//subG have to have a parentG
                    errorNotify(`A sub goal must have a parent goal`)

                    softReset() //soft reset...prolly?
                    return
                }
            }

            $q.notify({
                color: 'positive',
                position: 'top',
                message: `Success ${action} for "${goalTitle.value}"`,
                icon: 'thumb_up'
            })
            
            hardReset() //reset variables
            //reload() //no need here even and have to interact with page to see list change smh
        }

        function hasSubG(parentID){
            let euh = this.getSubGoals(parentID)
            return euh.length > 0
        }

        //function getMainGoals(){ //for testing updates but doesnt either smh
        //    return mainGoals.value //store.getMainGoals
        //}

        function getSubGoals(parentID){
            const map = []
            if(!subGoals.value) {
                //console.log("No subgoals")
                return map
            }
            subGoals.value.forEach(event => {
                if (event.parentGoal == parentID) {
                    map.push(event)
                }
            })
            return map.sort((a,b) =>{ //sort by id....could sort by time? meh would hve to import parseTime
                if (a.id > b.id) return 1
                if (a.id == b.id) return 0
                if (a.id < b.id) return -1
            }) 
        }

        /*function finalize(reset) {  //redundant--toRemove**
            timer = setTimeout(() => {
                reset()
            }, 0)
        }*/

        function onSwipeAction({evt, ...newInfo },id, pID) { //redundant--toRemove**
            console.log("onSwipeAction", evt,newInfo,id, pID) 
        }

        function onRightDelete({reset},id, pID) {
            //console.log("onRightDelete", e, id) 

            //finalize(reset) //better to immediately run it below instead as could be null by time gets scheduled
            reset()

            store.removeSubgoal(id) //subGoals.value = 
            //await nextTick() //need async in front of the function above....
            //console.log("onRightDelete...")
            
            //reload() //no need as using line below to close the expanded-item to update list
            expanded.value[pID] = false

            $q.notify('Delete action triggered for:'+id)


            store.removeDeletedGoal(id) //JSON.stringify(store.getAllDates) works but shouldnt access while modifying..prolly
    
            //e.reset() //just reset how things looked--not helpful
            reload()
        }

        function onLeftEdit ({reset},subId, pID) {

            //console.log(`Editing subgoal ${subId} from ${pID}...`,reset)

            let subby = subGoals.value.find(element => element.id == subId) //filter returns an array!! >>better to use find!
            let pGoally = mainGoals.value.find(element => element.id == pID)

            //console.log("subgoal be with parent", subby[0],pGoally[0])

            if (subby && pGoally) {
                buttonLabel.value = "Save"

                goalType.value = 'sub' //updates

                goalTitle.value = subby.title //oldie when using filter >> subby[0].title
                pGoal.value = pGoally
                time.value = subby.time 
                score.value = subby.score
                duration.value = parseInt(subby.duration)
                canMove.value = subby.canMove
                inDefaults.value = subby.inDefaults
                isAlternative.value = subby.isAlternative
                moods.value = subby.jeSuis //? moods : []  //to not add nulls...

                tab.value = "Goal"  //nav to Goal tab

                updatingSubG = subId  //keep track of this for submit

            }else {
                errorNotify(`ERROR during edit action for ${subId} and ${pID}...not found!`)
            
                console.log(`ERROR could not find all info for ${subId} and ${pID}`)
            }

            //finalize(reset) //umm use this or below? >>error out after change to tabs

            expanded.value[pID] = true
        }
        
        function onParentAction(action,id,title){ //no need for title--toRemove**
            //let pG = getParent(id)
            //console.log(`onParentAction:${action} for> ${id}`, title)

            if (action == 'del'){
                $q.dialog({
                title: 'Warning',
                cancel: true,
                message: `Delete Parent Goal "${title}" ?`  //also check & remove past scheduled evts?!? tbd*** 
                }).onOk(() => {
                    store.removeMaingoal(id, false)
                    resetGsAndColors() //bof doesnt update still smh
                    //reload() //meh no update either
                    expanded.value[id] = false //this does update!
                }).onCancel(() => {
                    console.log('Cancelled!!')
                    expanded.value[id] = false
                })//.onDismiss(() => { //no need
                  //  console.log('dismiss!!')
                  //  reload()
                //})

                return
            } 

            let pGoally = mainGoals.value.find(elt => elt.id == id)
            if (!pGoally){
                console.log(`ERROR No info for ${id} '${title}' to edit!!`)
                errorNotify(`ERROR during edit action for Goal: '${title}'...not found!`)
                return
            }

            if(action == 'edit'){
                buttonLabel.value = "Save"

                goalType.value = 'main'

                pGoal.value = pGoally  //with setting this, is updatingSubG needed below? toSee...

                goalTitle.value = pGoally.title
                details.value = pGoally.details
                bgcolor.value = pGoally.bgcolor
                priority.value = pGoally.priority

                //icon.value = pGoally.icon  //empty when not in list >>BUT better for selection with picker
                currentIcon.value = pGoally.icon 
               
                expanded.value[id] = !expanded.value[id] //toggle back to close for any potential update...no need?

                updatingSubG = id  //for submit...redundant tho? toReview***
                tab.value = "Goal" //nav
            
            }else if(action == 'add'){ //for subgoal add for parent
                console.log(`onParentAction:${action} for> ${id}`, title)

                buttonLabel.value = "Add" //important as action for onSubmit

                goalType.value = 'sub' //for subgoal distinction in submit too!!
                
                pGoal.value = pGoally 

                goalTitle.value = '' //or start as parent's title? toReview**

                //bon belog just in case...
                score.value = ''
                time.value = time.value || ''
                duration.value = duration.value || 15

                canMove.value = canMove.value || false

                inDefaults.value = inDefaults.value || false
                
                isAlternative.value = false
                moods.value = null
                
                tab.value = "Goal" //nav to tab
            }else{
                console.log('ERROR...unknow action!')
                expanded.value[id] = false //mmm?
            }
        }
        
        function refresh(done) {  //drag for refresh
            setTimeout(() => {
                reload()
                console.log('Refreshing...')
                done()
            }, 1000)
        }

        function reload() { //reload variables with stuff from storage...
            //console.log("reloadin...")
            //mainGoals.value = store.getMainGoals
            //subGoals.value = store.getSubGoals
            resetGsAndColors() //should actually use this >>way better too
        }

        function softReset(){ //for when changing goalType..keep stuff...toReview--especially when in edit***
            goalTitle.value = goalTitle.value  || ' ' //subvert the rule check with space tho and add an extra space in beginnin..toReview***
            priority.value = priority.value || 3

            //bon just in case...
            time.value = time.value || ''
            duration.value = duration.value || 15
            details.value = details.value || ''
            bgcolor.value = bgcolor.value || ''
            canMove.value = canMove.value || false

            inDefaults.value = inDefaults.value || false

            console.log("softResetting...with label as>>", buttonLabel.value)
           
        }

        function doCancel(){//just wrapper to reset goalPage ...
            buttonLabel.value = "Submit"
            hardReset() 
        }
        function hardReset(){
            goalTitle.value = ' ' //subvert the rule check with space tho and add an extra space in beginnin..toReview***
            priority.value = 3
            score.value = ''
            time.value = ''
            duration.value = 15
            //goalType.value = 'line' //huh makes it unselectable smh
            pGoal.value = null
            details.value = ''
            bgcolor.value = '' //should reset to first avail below //avColors.value[0]
            canMove.value = false
            inDefaults.value = false
            isAlternative.value = false

            moods.value = null

            updatingSubG = null

            icon.value = null //better to keep it null
            changeIcon.value = false
            currentIcon.value = 'fas fa-utensils'

            resetGsAndColors()
            //constructTree() //redundant

            //see about expanded[id] = false --todo**

            tab.value = "GList"  //nav to GList tab

            console.log("hardReset...")
        }

        //redundant--toRemove**
        //function classyColor(proppy){//bg-{color} or text-{color} in class
            //if (proppy.label == this.selected){console.log("classyColor for selected..."); return 'text-white bg-red'} //works but not needed!
        //    return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
        //}

        function classyHeader(att){
            if(att){
                return 'text-white bg-'+att.toLocaleLowerCase()
            }
            //console.log("classyHeader...no color",att)
            return 'bg-white'

            //return `'text-white bg-'}${att.toLocaleLowerCase()} `  //row items-center ${proppy.isChildren ? 'text-' :  //oldie >> bg-${proppy.color}
        }
        function hexyColor(c){
            return hexColor(c);
        }

        function niceyLabel(att){
            let when = (timey) => {
                if(!timey) return ''

                let o = timey.split(':')
                return parseInt(o[0]) >= 12 ? "PM" : "AM" //let oAmPm = 
            }

            return `${att}${when(att)}`

        }
        function emptyIcons(){ //toDetermine when icon parsing has failed and icon label is empty >>bof no luck smh
            
            let iIcon = document.getElementById("i-icon") //const be hannoying
            let qIcon = document.getElementById("q-icon")

            console.log("emptyIcons::q-icon",qIcon.children.length,qIcon.checkVisibility(), JSON.stringify(qIcon.innerHTML),JSON.stringify(qIcon.getBoundingClientRect()))
            console.log("emptyIcons::i-icon",iIcon.children.length,iIcon.checkVisibility(),JSON.stringify(iIcon.innerHTML),JSON.stringify(iIcon.getBoundingClientRect()))
            
            //huh would check like below work?!? >>nah jquery methink
            //if ($('#q-icon').height() === 0 || $('#q-icon').width() === 0) { //height &width
            //    console.log("emptyIcons::q-icon NO HEIGHT",qIcon.clientHeight,qIcon.clientWidth)
            //}
            

            //if ($('#q-icon').children().length === 0) {//child nodes
            //    console.log("emptyIcons::NO CHILDs q-icon",qIcon.childElementCount)
            //}
            if(qIcon.children.length === 0){
                console.log("emptyIcons::q-icon has NONE",qIcon.tagName,qIcon.outerHTML,JSON.stringify(qIcon.classList)) //classlist not up to date seems?!?
                //qIcon.getHTML is undefined
            }
            //if ($('#i-icon').html() === "") { //innerHtml
            //    console.log("emptyIcons::i-icon EMPTY",iIcon.getHTML())
            //}
            
            if(iIcon.innerHTML.trim() == ""){
                console.log("emptyIcons::i-icon HTML EMPTY",iIcon.nodeName,iIcon.tagName,iIcon.outerHTML,JSON.stringify(iIcon.classList))
            }
            
            
        }
        function iconParse (name) { //from goalStorage....prolly better to bring here...user could change icon if not showing?!?

            if (name.indexOf('-') > -1){ //check that it has already that '-' >>no further parsing needed...prolly 
                //console.log("iconParse::GOOD?",name)
                return name 
            }

            let a = name.replace(/\W+/g, " ") 
            .split(/ |\B(?=[A-Z])/)
            .map(word => word.toLowerCase())
            //.join('-') //have to check length for fas/fab smh
            let useFas = false
            if (a.length > 1){
                console.log("iconParse::FAS",name, a) //not always smh i.e "fas fa-handshake" 'fas fa-amazon-pay' should be 'fab fa-amazon-pay' --toReview** 
                useFas = true
            }
            a = a.join('-')

            return a.includes('regular') ? 'far fa-'+a.replace("-regular", "") : useFas ? 'fas fa-'+a : 'fab fa-'+a  // oldie >> 'fab fa-'+a  >> fab prefix tend to not show?....toReview** or use excludeIcons
        }

        function hello(data, icon){ 
            console.log("HELLO",JSON.stringify(data),JSON.stringify(icon))
        }

        function hello2(value,reset){ 
            //just to update and reset view smh
            
            if (value){
                let parsed = iconParse(value)
                currentIcon.value = parsed
                changeIcon.value = false //reset to hide select and hide ugly empty space 
                //EXCEPT that cannot do a second selection so have to reset icon value as well below smh
                icon.value = null
                console.log("HELLO2",value, parsed) //bon todo** check those that dont show up>>maybe tell user to reselect?
            }

            //emptyIcons() //just to see >>no go...cant check innerHtml to see if shown or not and size remains constant smh...
        }
        function errorNotify(mess){ //position='top',icon=null,color='negative'
            doNotify(mess,'top','report_problem','negative')
        }
        function warnNotify(mess){
            doNotify(mess,'top','warning','info')
        }
        function doNotify(mess,position='top',icon=null,color='negative'){ //
            $q.notify({
                color: color,
                position: position,
                message: mess,
                multiLine: true,
                //caption:mess, //meh small**
                icon:  icon == null ? 'report_problem' : icon
                //type?
            })
        }

        return {
            hello2,hexyColor,hello,
            enableAdmin,step,mainGJson,subGJson,allJson, isImporting,AdminLabel,showGoalsArea,
            showSubG,
            mainGoals,
            subGoals,
            allMGoals,howThis,
            scoreRange,
            expanded,
            buttonLabel,
            tab,
            moods,
            goalTitle,details,bgcolor,time,priority,duration,score,canMove,goalType,pGoal,inDefaults,avColors,isAlternative,
            hasSubG,resetLabel,icon,changeIcon,currentIcon,
            doPrint,doReset,doImport,resetBoxes,
            onSubmit,getSubGoals,onSwipeAction,doCancel,
            onRightDelete,onLeftEdit,softReset,onParentAction,refresh,classyHeader,niceyLabel //,euh,classyColor,
        }
    }
}
</script>

<style lang="scss">
.form {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.iconPickWrap { //wonder if could put iconPick under here?
    height: 50px;
    overflow-y: visible;
}
.iconPick {
    width: 100%;
    min-height: 500px;
    overflow-y: auto;
    border-color: #555;
}

.doHide {
    display: none;
}

.page--table {
  .page {
    &__table {
      margin-top: 20px;
    }
    &__grab-icon {
      cursor: move;
    }
  }
}
.dalist,
.dalist-enter-active,
.dalist-leave-active {
  transition: all 0.5s ease;
}
.dalist-enter-from,
.dalist-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly.-boof not that needed prolly--umm actually needed?*/
.dalist-leave-active {
    position: absolute;
}

.atLeft {
    float:left
}
.atRight {
    float:right
}
@media (max-width: 500px){
.atRight {
    float:none;
    }
.typey {
    display:none
}
}
 
</style>