<template>
  <div class="q-pa-md q-gutter-sm"> <!-- class="q-mt-xl" ? -->
    
    <!--<q-btn label="Show dialog" color="primary" @click="showDialog = true" /> -->
    
    <!--hide the above button to see if possible to trigger via a parent component
    showDialog
    -->
    <!--<q-dialog v-model="showDialog" transition-show="rotate" transition-hide="rotate"> -->
      <q-card>
        <q-card-section>
          <div class="text-h6">ad hoc goal</div>
        </q-card-section>

         <q-separator />

        <q-card-section style="max-height: 50vh" class="scroll"> <!-- class="q-pt-none"-->
            <div>
                <q-form
                    @submit="onSubmit"
                    class="page page--table"
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
                                label="Color code"
                                hint="Color"
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
                                size="50px"
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
        </q-card-section>

        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Print" color="primary" @click="doPrint"/> <!--"Decline" with v-close-popup -->
          <q-btn flat label="Reset" color="primary" @click="doReset"/>  <!--"Accept" with v-close-popup-->
        </q-card-actions>
      </q-card>
    <!--</q-dialog> -->
  </div>
</template>

<script>
import { computed,ref } from 'vue'
import { useGoalStore } from 'stores/goalStorage'  //@stores? >>not needed
import { useQuasar } from 'quasar'

export default {
  name: 'goalForm',
  //props: ['showDialog'],
  //emits: ['update:showDialog'],
 // defineProps(['showDialog'])
  //defineEmits(['update:showDialog'])
  beforeMount(){
    console.log("addGoalForm beforeMount")
  },

  setup () {
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

    const showDialog = ref(false) //was defined in return below
        
    //----
    const $q = useQuasar()
    const store = useGoalStore()

    const mainGoals = computed(() => store.getMainGoals) 
    const subGoals = computed(() => store.getSubGoals)

    const showSubG = computed(() => goalType.value ==='main' ? false : true )

    //const doShow = computed(() => store.getMainGoals)
    const doShow = computed({
            get() {
                return this.showDialog  //props.showDialog
            },
            set(value) {
                emit('update:showDialog', value)
            }
    })

        function doPrint () {
            //console.log(headers) //not proper
            //JSON.stringify(store.goalList,null,1)  >>works!
            // also works for >> store.headerRefs  BUT trying hRefs above gives an error
            if (goalType.value ==='main') {
                console.log(JSON.stringify(store.getMainGoals,null,1))
            } else {
                console.log(JSON.stringify(store.getSubGoals,null,1))
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
            subGoals.value.forEach(event => { //works even?
                if (event.parentGoal == parentID) {
                    map.push(event)
                }
            })
            return map  
        }

    return {
      //showDialog: ref(false)
      //daRefs:hRefs,
        showDialog, //using this locally
        showSubG,
        doPrint,
        mainGoals,
        subGoals,
        goalTitle,details,bgcolor,time,priority,duration,score,canMove,goalType,pGoal,
        onSubmit,doReset,getSubGoals,
        doShow
        //doShow = computed(() => store.getMainGoals)

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