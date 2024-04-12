<template>
<main class="page page--table q-pa-md" style="max-width: 400px">
 <!--<div class="q-pa-md" style="max-width: 350px"> -->
    
    <!--<div class="text-white text-center">
        <q-btn
            class="q-mt-xl"
            color="white"
            text-color="blue"
            unelevated
            to="/planner"
            label="Go Back"
            no-caps
        />
    </div> -->
    <q-pull-to-refresh @refresh="refresh">
    <div>
        <q-form @submit="onSubmit" class="q-gutter-md form" >
            <div class="q-gutter-sm">
                <q-radio v-model="goalType" @click="softReset" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="main" label="Main goal" />
                <q-radio v-model="goalType" @click="softReset" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="sub" label="Sub goal" />
            </div>

            <q-input class="q-ml-md"
                filled
                v-model="goalTitle"
                label="A Goal"
                lazy-rules
                item-aligned
                :rules="[ val => val && val.length > 0 || 'Please type a goal']"
            />

            <div v-if="showSubG" class="q-gutter-md">
                <q-select class="q-pl-md"
                 v-model="pGoal"
                 :options="mainGoals"
                 option-value="id"
                 option-label="title"
                 label="Parent Goal"
                 popupContentClass="q-gutter-md"
                />
            </div> 

            <q-input v-else
                filled
                v-model="details"
                label="Description/Details"
            />
            <div v-if="!showSubG" class="q-gutter-md">
                <q-select class="q-pl-md"
                 v-model="bgcolor"
                 :options="avColors"
                 :color="bgcolor"
                 label="Color"
                 popupContentClass="q-gutter-md"
                 />
                <!--popupContentStyle="justify-content: center"
                /> -->
                <br>
                <q-input
                    filled
                    v-model.number="priority"
                    type="number"
                    label="Priority"
                    hint="0 to 10"
                />
            </div>

            <div v-if="showSubG" class="q-gutter-sm">
                <q-input v-model="time" filled type="time" hint="Default time" />
                
                <br>

                <q-input v-model="score" 
                filled 
                label="Score" 
                hint="format: #on#"
                lazy-rules
                :rules="[ val => val && val.includes('on') && val.length > 3 || 'hint, hint!']"
                /> <!-- lazy-rules="ondemand" but doesnt evaluate after typing...also quite crude validation..toReview -->

                Duration (min)
                <q-knob
                    :min="5"
                    :max="120"
                    :thickness="0.22"
                    :step="5"
                    v-model="duration"
                    show-value
                    size="75px"
                    color="teal"
                    track-color="grey-3"
                    class="q-ma-md"
                /><!--v-model="duration"  
                    :model-value=duration -->
                <br>
                <q-toggle
                v-model="canMove"
                label="Can Move"
                left-label
                color="green">
                    <q-badge
                    color="orange" floating
                    style="top: 5px; position: relative; width: 10px; max-width: 10px; height: 10px; max-height: 10px; padding-inline: 3px 6px; cursor: pointer">
                    ? <q-tooltip>Have to confirm any timeslot change</q-tooltip>
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
                    ? <q-tooltip>Is scheduled by default</q-tooltip>
                    </q-badge>
                </q-toggle>
                <br>

                <q-toggle v-if="duration<30"
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

            <div>
            <q-btn :label="buttonLabel" type="submit" color="primary" class="q-ml-sm" align="between" />
            <!--<q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />  label="Submit"-->
            </div>
        </q-form>
    </div>
    
    <!--<draggable v-model="mainGoals" draggable=".item" item-key="id">
        <template #item="{element}">
            <div class="item">
            {{element.title}} - {{element.details}} - {{element.priority}} -> {{element.bgcolor}}
            </div>
        </template>
        <template #footer>
         <button @click="addPeople">Add</button>
        </template>
    </draggable> -->

    <!-- should use component template instead--todo**-->
    <br>
    
    <q-list bordered> <!--v-mutation="reload" but triggers too much...{howThis} update!! >>oldie that dont update >>mainGoals && getMainGoals()-->
        <q-item>
            <q-item-section>
              <q-item-label overline class="q-mx-lg q-px-md" style="max-width:100%">Swipe to Edit or Delete Goal</q-item-label>
            </q-item-section>
         </q-item>
    
        <q-separator spaced />
    
        <transition-group name="dalist">
            <q-expansion-item v-for="goal in allMGoals" class="q-my-sm"
            v-model="expanded[goal.id]"
            :key="goal.id"
            :label="goal.title"
            :caption="goal.details"
            popup
            expandSeparator
            :header-class= "classyHeader(goal.bgcolor)"
            clickable>
            <!--<template v-slot:header></template> -->
        
             <q-card v-for="subGoal in getSubGoals(goal.id)" :key="subGoal.id"> <!--v-for on a crd works?>>huh not without adding >>:key="event.id" -->
                <!--<q-card-section>
                    {{subGoal.title}} >> {{subGoal.time}} :: {{subGoal.score}}   class="q-my-sm"  color="red"
                </q-card-section> -->
                <q-slide-item @right="(e) => onRightDelete(e, subGoal.id, goal.id)" @left="(e) => onLeftEdit(e, subGoal.id, goal.id)">
                    <template v-slot:left> <!--had no need for @left="onLeft" in q-slide-item above BUT using it to edit here -->
                    Edit
                    </template>
                    <template v-slot:right>
                    Delete
                    </template>

                    <q-item>
                        <q-item-section class="q-mx-sm">{{subGoal.title}} > {{niceyLabe(subGoal.time)}} ({{subGoal.duration}}) </q-item-section>
                        <q-item-section class="q-mx-*"> {{subGoal.score}} :: {{subGoal.canMove ? 'canMove' : 'NoMoves'}} :: {{subGoal.inDefaults ? 'InDefaults' : 'NotADefault'}} :: {{subGoal.isAlternative ? 'Alt' : ''}}</q-item-section>
                    </q-item>
                </q-slide-item>
                <q-separator :color="goal.bgcolor.toLocaleLowerCase()"/>
             </q-card>

             <q-card v-if="!hasSubG(goal.id)">
                <q-btn label="Delete goal" type="reset" color="secondary" noWrap push align="evenly" class="q-mx-sm"  @click.prevent="(e) => onParentAction('del',goal.id,goal.title)" />
                OR
                <q-btn label="Edit goal" type="reset" color="primary" noWrap push align="evenly" class="q-mx-sm"  @click.prevent="(e) => onParentAction('edit',goal.id,goal.title)" />
             </q-card>
            </q-expansion-item>
     </transition-group>
    </q-list>

    <br>
    <!--<div v-if="treeGoals.length > 0" class="q-pa-xl bg-grey-12" style="max-width: 400px">
        <div class="row justify-center"> All Goals </div>
        <q-separator />
        <br>
        <q-tree
          :nodes="treeGoals"
          node-key="label"
          v-model:expanded="expandedNodes"
          v-model:selected="selected"
          no-connectors
          dense
          default-expand-all>
    
          <template v-slot:default-header="prop">
              <div :class="classyColor(prop.node)">
                <q-icon :name="prop.node.icon || 'arrow'" size="28px" class="q-mx-sm" />
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
    </div> -->
    <!--below work But hard to change background via props(below)...cause using slot >> sigh...hard to expand when using select even
          :selected-color="red"
          :on-update:selected="euh"
          selected-color="lime"
        -->
    <!--<div class="text-h6">Selected</div>
    <div>{{ selected }}</div> -->

    </q-pull-to-refresh>
    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        elevated
        label="Print"
        no-caps
        @click="doPrint"
    />
    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="red"
        elevated
        label="Reset GoalType"
        no-caps
        @click="doReset"
    />
 <!--</div> -->
</main>
</template>
<script>
//import draggable from 'vuedraggable'
import { computed, ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'  //nextTick
import { useGoalStore } from 'stores/goalStorage'  //@stores? >>not needed
import { useQuasar } from 'quasar'
import { pGColors } from '../util/utiFunc'


export default {
    //components: {
    //   draggable
    // },
    name: 'addGoalForm',
    setup () {
        //form
        const goalTitle = ref('')
        const details = ref('')
        const bgcolor = ref('')
        const avColors = ref([]) // oldie >> ref(pGColors())
        const time = ref('')
        const priority = ref(3)
        const duration = ref(15) //min of 30
        const score = ref('')
        const canMove = ref(false)
        const inDefaults = ref(false) //NOT by default?!?
        const isAlternative = ref(false)

        const goalType = ref('line') //so nothing is selected at first
        const pGoal = ref(null)

        const howThis = ref(null) //watchEffect testing...not bad--toRemove

        const mainGoals = ref(null) //computed(() => store.getMainGoals) //works except that reload cannot occur since these are read-only!
        const subGoals = ref(null) //computed(() => store.getSubGoals)
        
        const expanded = ref({})//ref(false)

        const buttonLabel = ref('Submit')

        const treeGoals = ref([])
        const expandedNodes = ref([]) //tree nodes expanded...
        const selected = ref(null) //for edit testing...
        
        //const red = ref('arrow')
        //----
        const $q = useQuasar()
        const store = useGoalStore()

        //const timer = ref(null)
        let timer 
        let updatingSubG = null //to keep track of goalID when editing

        const hRefs = computed(() => store.headerRefs) //tosee if works
        const headers = computed(() => store.getHeaders) //ditto as above

        const allMGoals = computed(() => mainGoals.value) //oldie store.getMainGoals >> doesnt updates

        const showSubG = computed(() => goalType.value ==='main' ? false : true )

        watchEffect(() => {
            // tracks A0 and A1
            //A2.value = A0.value + A1.value
            howThis.value = mainGoals.value  //does track changes but redundant with `allMGoals` above
        })

        /*const subbyGoals = computed((id) => {
            //if(!subGoals.value) return []
            return subGoals.value.filter(event => event.parentGoal == id)
        })*/

        //see if these two below can be used?toTest
        //const addMainG = () => store.addMainGoal() // use action..also that ';' be problem? nope
        //const addSubG = () => store.addSubGoal()

        onMounted(() => {
            mainGoals.value = store.getMainGoals
            subGoals.value = store.getSubGoals
            let currentColors = []
            if(mainGoals.value){
                mainGoals.value.forEach(item => {
                    expanded[item.id] = false

                    currentColors.push(item.bgcolor)
                })
            }
            let c = pGColors()
            
            avColors.value = c.filter(item => !currentColors.find(o => o == item)) //filter out already taken colors...

            treeGoals.value = store.fetchGoalsTree() //no need mais bon!
            //console.log(`the component is now mounted.`,currentColors, avColors.value)
        })

        onBeforeUnmount(() => {
            clearTimeout(timer)  //or with .value? >>no need when seclaring with 'let' 
        })

        //function euh(t){
        //    console.log(`euh...changed selected...`,t,this.selected.value)
        //}

        function doPrint () {
            //console.log(headers) //not proper
            //JSON.stringify(store.goalList,null,1)  >>works!
            // also works for >> store.headerRefs  BUT trying hRefs above gives an error
            if (goalType.value ==='main') {
                console.log(JSON.stringify(mainGoals.value,null,1)) //store.getMainGoals
            } else {
                console.log(JSON.stringify(subGoals.value,null,1)) //store.getSubGoals
            }
        }

        function doReset () {
            if (goalType.value ==='main') {//shoulg confirm AND also remove the subgoals!!
                
                $q.dialog({
                title: 'Warning',
                cancel: true,
                message: `Reset all Parent Goals?`
                }).onOk(() => {
                    //store.removeMaingoal(id, false)
                    store.resetMain() 
                }).onCancel(() => {
                    console.log('Cancelled!!')
                    //expanded.value[id] = false
                })

            } else if(goalType.value ==='sub') {
                store.resetSub()
            } else {
                $q.dialog({
                title: 'Warning',
                cancel: true,
                message: `Reset all goals?`
                }).onOk(() => {
                    console.log("Resetting all goals")
                    store.resetAll()
                }).onCancel(() => {
                    console.log('Cancelled!!')
                })
            }
        }

        function onSubmit() {
            //console.log("onSubmit Goal of type:",goalType.value, buttonLabel.value)
            let action = buttonLabel.value === "Save" ? 'Save' : 'Add'

            if(action === "Save"){
                editAction()
                //editSubGoal()
                //expanded.value[pId.id] = false //just so that it can be updated!
                //buttonLabel.value = "Submit"
            } else { //adding new goal
                if (goalTitle.value.trim() == ''){
                    $q.notify({
                        color: 'negative',
                        position: 'top',
                        message: 'Cannot have an empty goal!',
                        icon: 'report_problem'
                    })
                    return
                }

                if (goalType.value ==='main') {
                    store.addMainGoal(goalTitle.value,details.value,bgcolor.value,priority.value)
                } else {
                    if(pGoal.value){
                        let pId = pGoal.value
                        store.addSubGoal(pId.id,goalTitle.value,score.value,time.value, duration.value,canMove.value, inDefaults.value,isAlternative.value)
                        console.log("Subgoal Goal added for parent:",pId.title)
                    }else{//subG have to have a parentG
                        $q.notify({
                            color: 'negative',
                            position: 'top',
                            message: 'A sub goal must have a parent goal',
                            icon: 'report_problem'
                        })
                        softReset() //soft reset valid here?!? toSee
                        return
                    }
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
            return map  
        }

        function finalize(reset) {
            timer = setTimeout(() => {
                reset()
            }, 0)
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

            //console.log("reloadin...", subGoals.value)
    
            //e.reset() //just reset how things looked--not helpful
        }

        function onLeftEdit ({reset},subId, pID) {

            //console.log(`Editing subgoal ${subId} from ${pID}...`)

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

                updatingSubG = subId  //keep track of this for submit

            }else {
                $q.notify({
                    color: 'negative',
                    position: 'top',
                    message: `ERROR during edit action for ${subId} and ${pID}...not found!`,
                    icon: 'report_problem'
                })
            
                console.log(`ERROR could not find all info for ${subId} and ${pID}`)
            }

            finalize(reset) //umm use this or below? prolly both really
            expanded.value[pID] = true
        }
        
        function onParentAction(action,id,title){ //annoyance that need to reload page to see change
            //let pG = getParent(id)
            console.log(`onParentAction:${action} for> ${id}`, title)

            if (action == 'del'){
                $q.dialog({
                title: 'Warning',
                cancel: true,
                message: `Delete Parent Goal "${title}" ?`  //also check & remove past scheduled evts?!? tbd*** 
                }).onOk(() => {
                    store.removeMaingoal(id, false)
                }).onCancel(() => {
                    console.log('Cancelled!!')
                    expanded.value[id] = false
                })//.onDismiss(() => { //no need
                  //  console.log('dismiss!!')
                  //  reload()
                //})            
                //return
            } else if(action == 'edit'){ // store.addMainGoal(goalTitle.value,details.value,bgcolor.value,priority.value)
                let pGoally = mainGoals.value.find(elt => elt.id == id)
                if(pGoally) {
                    buttonLabel.value = "Save"

                    goalType.value = 'main' //update and make distinction of the edited goal...

                    pGoal.value = pGoally  //with setting this, is updatingSubG needed below? toSee...

                    goalTitle.value = pGoally.title
                    details.value = pGoally.details
                    bgcolor.value = pGoally.bgcolor
                    priority.value = pGoally.priority
                
                    updatingSubG = id  //for submit...redundant though...
                }else {
                    $q.notify({
                        color: 'negative',
                        position: 'top',
                        message: `ERROR during edit action for Goal: '${title}'...not found!`,
                        icon: 'report_problem'
                    })

                    console.log(`ERROR No info for ${id} '${title}' to edit!!`)
                }
            } else{
                console.log('ERROR...unknow action!')
                expanded.value[id] = false //mmm?
            }
        }

        function editSubGoal(){
            if(updatingSubG){
                store.editSubGoal(updatingSubG,goalTitle.value,score.value,time.value, duration.value,canMove.value,inDefaults.value,isAlternative.value)
            } else{
                $q.notify({
                    color: 'negative',
                    position: 'top',
                    message: `ERROR: No subgoalId to edit found!`,
                    icon: 'report_problem'
                })
            }
            //return?
        }

        function editAction(){ //for all edits
            let pId = pGoal.value//umm should be present...toMonitor**
            if (goalType.value ==='main') {
                if(updatingSubG && pId?.id == updatingSubG){ //second check just in case...
                    store.editMainGoal(updatingSubG,goalTitle.value,details.value,bgcolor.value,priority.value)
                    
                    expanded.value[pId?.id] = false  //umm to see...
                } else{
                    console.log("Error when Edit Parent Goal...inconsistent or not found!",updatingSubG,pId)//toSee***
                }
            } else { //subgoal 
                editSubGoal()
                expanded.value[pId?.id] = false //just so that it can be updated!
            }

            buttonLabel.value = "Submit"

            //hardReset() //reset variables ...done at call site--toMonitor
        }
        
        function refresh(done) {  //test to drag for refresh--toREview***
            setTimeout(() => {
                reload()
            console.log('Refreshing...')
            done()
            }, 1000)
        }

        function reload() { //reload variables with stuff from storage...
            //console.log("reloadin...")
            mainGoals.value = store.getMainGoals
            subGoals.value = store.getSubGoals

            treeGoals.value = store.fetchGoalsTree()
            //window.location.reload() //so inelegant

            console.log("reloadin...", subGoals.value,mainGoals.value,treeGoals.value)
            
        }

        function softReset(){ //for when changing goalType..keep stuff...toReview--especially when in edit***
            goalTitle.value = goalTitle.value  || ' ' //subvert the rule check with space tho and add an extra space in beginnin..toReview***
            priority.value = priority.value || 3

            //bon just in case...
            time.value = time.value ||''
            duration.value = duration.value || 15
            details.value = details.value || ''
            bgcolor.value = bgcolor.value || ''
            canMove.value = canMove.value || false

            inDefaults.value = inDefaults.value || false

            console.log("softResetting...with label as>>", buttonLabel.value) //toSee***
        }

        function hardReset(){
            goalTitle.value = ' ' //subvert the rule check with space tho and add an extra space in beginnin..toReview***
            priority.value = 3
            //score.value = ''
            time.value = ''
            duration.value = 5
            //goalType.value = 'line' //huh makes it unselectable smh
            pGoal.value = null
            details.value = ''
            bgcolor.value = ''
            canMove.value = false
            inDefaults.value = false
            isAlternative.value = false

            updatingSubG = null

            console.log("hardReset...")
        }
        function classyColor(proppy){//bg-{color} or text-{color} in class
            //if (proppy.label == this.selected){console.log("classyColor for selected..."); return 'text-white bg-red'} //works but not needed!
            return `row items-center ${proppy.isChildren ? 'text-' : 'text-white bg-'}${proppy.color} `  //oldie >> bg-${proppy.color}
        }
        function classyHeader(att){
            return 'text-white bg-'+att.toLocaleLowerCase()
            //return `'text-white bg-'}${att.toLocaleLowerCase()} `  //row items-center ${proppy.isChildren ? 'text-' :  //oldie >> bg-${proppy.color}
        }

        function niceyLabe(att){
            let when = (timey) => {
                if(!timey) return ''

                let o = timey.split(':')
                return parseInt(o[0]) >= 12 ? "PM" : "AM" //let oAmPm = 
            }

            return `${att}${when(att)}`

        }

        return {
            showSubG,
            mainGoals,
            subGoals,
            allMGoals,howThis,
            daRefs:hRefs,
            expanded, //see if can trigger close >>does!
            buttonLabel,
            expandedNodes,treeGoals,selected,
            goalTitle,details,bgcolor,time,priority,duration,score,canMove,goalType,pGoal,inDefaults,avColors,isAlternative,
            hasSubG,
            doPrint,
            onSubmit,doReset,getSubGoals,
            onRightDelete,onLeftEdit,softReset,onParentAction,refresh,
            classyColor,classyHeader,niceyLabe //,euh
        }
    }
}
</script>

<style lang="scss">
.form {
    margin: 0 auto;
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
   animations can be calculated correctly.-boof not that needed prolly
.dalist-leave-active {
    position: absolute;
}
*/
</style>