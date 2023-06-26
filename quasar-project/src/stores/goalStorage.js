import {computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'

//see from Blu file original Option store to this Setup Store
//ref()s become 'state' properties
//computed() become 'getters'
//function() become 'actions'
export const useGoalStore = defineStore('allGoals', () => {
    //for testing with ref and see--toREmove
    const headerRefs = ref([  
        { text: '', sortable: false },
        { text: '#', sortable: false },
        { text: 'TITLE', value: 'title', sortable: false },
        { text: 'Goal', value: 'subGoal', sortable: false },
        { text: 'PRIORITY', value: 'priority', sortable: false},
        { text: 'DURATION', value: 'duration', sortable: false }
    ])
    const headers = [
        { text: '', sortable: false },
        { text: '#', sortable: false },
        { text: 'TITLE', value: 'title', sortable: false },
        { text: 'Goal', value: 'subGoal', sortable: false },
        { text: 'PRIORITY', value: 'priority', sortable: false},
        { text: 'DURATION', value: 'duration', sortable: false }
      ]
    
    const $q = useQuasar() 

    const getHeaders = computed(() => headers)  //or headerRefs
    //const getGoals = computed(() => goalList)

    //this works? nope...should it be a function instead?
    const getMainGoals= computed(() => 
    //let item = JSON.parse(localStorage.getItem(key))
        JSON.parse($q.localStorage.getItem("mainGoals"))
    )
    
    const getSubGoals= computed(() => 
    //let item = JSON.parse(localStorage.getItem(key))
        JSON.parse($q.localStorage.getItem("subGoals"))
    )

    function addMainGoal(goal,details,color,priority) {
       
        console.log(goal.value+ ' ' +details.value+ ' ' +color.value+ ' ' +priority.value) //+ ' ' +icon.value
        
        let current = this.getMainGoals
        if(!current){
            console.log("umm no mainGoals...adding")
            $q.localStorage.set('mainGoals', JSON.stringify([{ //unshift
                id: 0,
                title: goal.value,
                details: details.value,
                priority: priority.value,
                bgcolor: color.value,
                icon: 'fas fa-utensils' 
            }]))
            return
        }

        //let id = current !== null ? current.length + 1 : 0
        current.unshift({
            id: current.length + 1,
            title: goal.value,
            details: details.value,
            priority: priority.value,
            bgcolor: color.value,
            icon: 'fas fa-utensils' 
        })

      $q.localStorage.set('mainGoals', JSON.stringify(current)) //does this overwrite? >>yup should

      console.log("done adding mainGoal")
    }

    function addSubGoal(pGoal,title,score,time, duration, canMove) {
        
        console.log(pGoal+ ' ' +title.value+ ' ' +score.value+ ' ' +time.value+ ' ' +duration.value+' ' +canMove.value)
        
        let current = this.getSubGoals
        //let id = current !== null ? current.length + 1 : 0
        if(!current){
            $q.localStorage.set('subGoals', JSON.stringify([{ //unshift
                id: 0,
                parentGoal:pGoal, //weird how no need for .value...
                title: title.value,
                score: score.value,
                time:time.value,//'19:00',
                duration: duration.value, //60,
                canMove: canMove.value
            }]))
            return
        }

        current.unshift({
            id: current.length + 1,
            parentGoal:pGoal,
            title: title.value,
            score: score.value,
            time:time.value,//'19:00',
            duration: duration.value, //60,
            canMove: canMove.value
        })

        $q.localStorage.set('subGoals', JSON.stringify(current)) //does this overwrite? >>yup should

    }
    function resetMain() {
        $q.localStorage.remove('mainGoals')
        console.log("removed all mainGoal")
    }
    function resetSub() {
        $q.localStorage.remove('subGoals')
        console.log("removed all subGoals")
    }
    function resetAll() {
        $q.localStorage.remove('subGoals')
        $q.localStorage.remove('mainGoals')

        console.log("removed ALL")
    }

    function saveNewGTime(goalId, time) {
        
        let current = this.getSubGoals
       //console.log("subGoal time change with ",goalId, time, current)
        current.forEach((obj) => {
            if(obj.id === goalId){ //or was here? >>yup cause of using .value smh
                obj.time = time
                console.log("subGoal time change for",obj) //.title +"to" + obj.time
            }
        })

        $q.localStorage.set('subGoals', JSON.stringify(current))
        
    }
    function removeSubgoal(goalId) {
        let current = this.getSubGoals
        for( var i = 0; i < current.length; i++){ 
            if ( current[i].id === goalId) { 
                current.splice(i, 1); 
                console.log("removeSubgoal spliced!")
            }
        }
        $q.localStorage.set('subGoals', JSON.stringify(current))
        return current
    }

    return {
        headers, 
        headerRefs, 
        getHeaders, 
        getMainGoals,
        getSubGoals,
        addMainGoal,
        addSubGoal,
        saveNewGTime,
        resetSub,
        resetMain,
        resetAll,
        removeSubgoal
    }
})