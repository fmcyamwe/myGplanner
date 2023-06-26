import {computed, ref } from 'vue'
import { defineStore } from 'pinia'


//todo 
//change the state to a map or array of goals with subgoals---multiple stuff prolly
//add setters to modify state

//see from Blu file original Option store to this Setup Store
//ref()s become 'state' properties
//computed() become 'getters'
//function() become 'actions'
export const useGoalsStore = defineStore('someGoals', () => {
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
    const goalList = [
        {
          title: 'Learn Violin',
          subGoal: 'Bowing', //would be a list kinda...prolly
          priority: 1,
          duration: 'a month' //prolly should be an int...
        },
        {
          title: 'Ripstick',
          subGoal: 'balance',
          priority: 3,
          duration: 'a week' 
        },
          {
          title: 'Quasar eh',
          subGoal: 'coding', 
          priority: 4,
          duration: '6 months'
        }
      ]
    const getHeaders = computed(() => headers)  //count.value * 2
    const getGoals = computed(() => goalList)
    function addGoal() {
        console.log("oooh adding goal eh?")
        //count.value++
    }

    return {headers, goalList, headerRefs, getHeaders, getGoals, addGoal }
})