<template>
<main class="page page--table">
 <div class="q-pa-md" style="max-width: 350px">
    <div class="text-white text-center">
    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        unelevated
        to="/planner"
        label="Go Back"
        no-caps
     />
    </div>

    <div>
        <q-form
        @submit="onSubmit"
        class="q-gutter-md"
        >
        <div class="q-gutter-sm">
            <q-radio v-model="goalType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="main" label="Main goal" />
            <q-radio v-model="goalType" checked-icon="task_alt" unchecked-icon="panorama_fish_eye" val="sub" label="Sub goal" />
        </div>

            <q-input
                filled
                v-model="goalTitle"
                label="A Goal"
                lazy-rules
                :rules="[ val => val && val.length > 0 || 'Please type a goal']"
            />

            <div v-if="showSubG" class="q-gutter-md">
                <q-select 
                 v-model="pGoal" 
                 :options="mainGoals"
                 option-value="id"
                 option-label="title"
                 label="Parent Goal" />
            </div> 

            <q-input v-else
                filled
                v-model="details"
                label="Description/Details"
            />
            <div v-if="!showSubG" class="q-gutter-sm">
                <q-input
                    filled
                    v-model="bgcolor"
                    label="Color"
                    hint="a color"
                />
                
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
                <q-input
                    filled
                    v-model="score"
                    label="Score"
                    hint="format: #on#"
                />
                Duration
                <q-knob
                    :min="15"
                    :max="120"
                    v-model="duration"
                    show-value
                    size="75px"
                    :thickness="0.22"
                    color="teal"
                    track-color="grey-3"
                    class="q-ma-md"
                />
                <br>
                <q-toggle
                    v-model="canMove"
                    label="Can be Moved?"
                    left-label
                    color="green"
                />
            </div>

            <div>
            <q-btn label="Submit" type="submit" color="primary"/>
            <!--<q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" /> -->
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
    <q-list bordered> <!--v-mutation="reload" but triggers too much-->
      <q-expansion-item v-for="goal in mainGoals" :key="goal.id" v-model="expanded[goal.id]" class="q-my-sm" :label="goal.title"
        :caption="goal.details" clickable v-ripple>
        <q-card v-for="subGoal in getSubGoals(goal.id)" :key="subGoal.id"> <!--v-for on a card works?>>huh not without adding >>:key="event.id" -->
          <!--<q-card-section>
            {{subGoal.title}} >> {{subGoal.time}} :: {{subGoal.score}} 
          </q-card-section> -->
          <q-slide-item @right="(e) => onRightDelete(e, subGoal.id, goal.id)">
            <!--<template v-slot:left> and no need for @left="onLeft" in q-slide-item above
            Left
            </template>-->
            <template v-slot:right>
            Delete
            </template>

            <q-item>
            <q-item-section>{{subGoal.title}} >> at {{subGoal.time}} :: {{subGoal.score}} :: Move?{{subGoal.canMove}}</q-item-section>
            </q-item>
          </q-slide-item>
        </q-card>
      </q-expansion-item>
    </q-list>

    <!--<div v-for="[element, subby] in allGoals" :key="element.id" class="item"> //--allGoals.keys()
        <q-card-section>
            {{element.title}} >> {{element.details}} :: {{element.priority}} 
        </q-card-section>
        <div v-if="subby">
            <q-card v-for="g in subby" :key="g.id" flat bordered>
                {{g.title}} >> {{g.score}} At: {{g.time}} 
            </q-card>
        </div>
    </div>  -->

    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="blue"
        elevated
        label="Do Print"
        no-caps
        @click="doPrint"
    />
    <q-btn
        class="q-mt-xl"
        color="white"
        text-color="red"
        elevated
        label="Do reset"
        no-caps
        @click="doReset"
    />
 </div>
</main>
</template>
<script>
//import draggable from 'vuedraggable'
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useGoalStore } from 'stores/goalStorage'  //@stores? >>not needed
import { useQuasar } from 'quasar'
//import { storeToRefs } from 'pinia' 

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
        const time = ref('')
        const priority = ref(3)
        const duration = ref(30) //min of 30
        const score = ref('')
        const canMove = ref(false)
        const goalType = ref('line')
        const pGoal = ref(null)

        const mainGoals = ref(null) //computed(() => store.getMainGoals) //works except that reload cannot occur since these are read-only!
        const subGoals = ref(null) //computed(() => store.getSubGoals)
        
        const expanded = ref({})//ref(false)
        
        //----
        const $q = useQuasar()
        const store = useGoalStore()

        //const timer = ref(null)
        let timer 

        const hRefs = computed(() => store.headerRefs) //tosee if works
        const headers = computed(() => store.getHeaders) //ditto as above

        const showSubG = computed(() => goalType.value ==='main' ? false : true )

        const allGoals = computed(() => {
            let map = new Map()
            if(!mainGoals.value){//try to use store.getMainGoals to see if updates on delete! >>nope
                console.log("mainGoals be empty?")
                return map
            }
            mainGoals.value.forEach(item => { 
                const id = item.id
                const matchingSubG = subGoals.value.filter(element => element.parentGoal == id)
                if (matchingSubG) {
                    //map[id] = matchingSubG  //{ ...item, ...matchingItem };
                    map.set(item,matchingSubG)
                } else {
                    console.log("parent has no sub-goals",item)
                    //map[id] = []
                    map.set(item,[]) //
                }
            })
            console.log("allGoals be",map.entries()) //JSON.stringify(allGoals,null,1)
            return map
        })

        //see if these two below can be used?toTest
        //const addMainG = () => store.addMainGoal() // use action..also that ';' be problem? nope
        //const addSubG = () => store.addSubGoal()

        //TODO add a method to map the parent Goals to the subGoals**

        onMounted(() => {
            mainGoals.value = store.getMainGoals
            subGoals.value = store.getSubGoals
        
            mainGoals.value.forEach(item => {
                expanded[item.id] = false
            })
            console.log(`the component is now mounted.`)
        })

        onBeforeUnmount(() => {
            clearTimeout(timer)  //or with .value? >>no need when seclaring with 'let' 
        })

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
            if (goalType.value ==='main') {
                store.resetMain()
            } else if(goalType.value ==='sub') {
                store.resetSub()
            } else {
                console.log("Resetting all goals")
                store.resetAll()
            }
        }
        function onSubmit() {
            console.log("Adding Goal of type:",goalType.value)

            if (goalType.value ==='main') { //goal,details,color,priority
                store.addMainGoal(goalTitle,details,bgcolor,priority)
            } else {//pGoal,title,score,time, duration, canMove
                if(!pGoal.value){
                    $q.notify({
                        color: 'negative',
                        position: 'top',
                        message: 'A sub goal must have a parent goal',
                        icon: 'report_problem'
                    })
                    return
                }
                let pId = pGoal.value
                console.log("Subgoal Goal added for parent:",pId.title)
                store.addSubGoal(pId.id,goalTitle,score,time, duration,canMove)
            }
        }

        function getSubGoals(parentID){
            const map = []
            if(!subGoals.value) {
                console.log("No subgoals")
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
        function onLeft ({ reset }) {
            $q.notify('Left action triggered. Resetting in 1 second.')
            //finalize(reset)
        }

        function onRight ({ reset }) {
            $q.notify('Right action triggered. Resetting in 1 second.')
            //finalize(reset)
        }

        function reload() { //reload variables with stuff from storage...doesnt update the slide though smh
            //console.log("reloadin...")
            mainGoals.value = store.getMainGoals
            subGoals.value = store.getSubGoals

            //window.location.reload() //so inelegant

            console.log("reloadin...", subGoals.value)
        }

        return {
            showSubG,
            mainGoals,
            subGoals,
            daRefs:hRefs,
            expanded, //test to see if can trigger close
            allGoals,
            goalTitle,details,bgcolor,time,priority,duration,score,canMove,goalType,pGoal,
            doPrint,
            onSubmit,doReset,getSubGoals,
            onRightDelete,reload
        }
    }
}
</script>

<style lang="scss">
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
</style>