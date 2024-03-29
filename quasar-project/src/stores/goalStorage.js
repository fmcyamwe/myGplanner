import {computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { event, useQuasar } from 'quasar'

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
    const getMainGoals = computed(() => {
    //let item = JSON.parse(localStorage.getItem(key))
        //doCopy(JSON.parse($q.localStorage.getItem("mainGoals")))
        let item = JSON.parse($q.localStorage.getItem("mainGoals"))
        return doCopy(item)
    })
    
    const getSubGoals = computed(() => {
    //let item = JSON.parse(localStorage.getItem(key))
        //doCopy(JSON.parse($q.localStorage.getItem("subGoals")))
        let item = JSON.parse($q.localStorage.getItem("subGoals"))
        return doCopy(item)
    })

    const getAllDates = computed(() => 
    //let item = JSON.parse(localStorage.getItem(key))
        //doCopy(JSON.parse($q.localStorage.getItem("subGoals")))
        JSON.parse($q.localStorage.getItem("AllDates"))
    )

    function doCopy(arr){  //copy >>this {...obj} is for objects
        if(arr) return [...arr]  //oldie that crap out when arr is null >> arr.length > 0
        return []//[...arr] //craps out when array is empty tho!!--toSee if line above works...nope just does a 'shallow' copy smh
        //const json = JSON.parse(JSON.stringify(original)); //quick and dirty way to copy apparently...bof dont seem to work even!
    }


    //dummy dates for Task summary
    const datesTest = ['2021-03-10', '2021-03-11','2021-03-08','2021-03-06','2021-03-05']

    //dummy logged duration Task summary 
    const loggedTest = [0.5, 2.0, 3.5, 4.0, 4.5, 1.0]

    function addMainGoal(goal,details,color,priority) {
       
        //console.log(goal+ ' ' +details + ' ' +color + ' ' +priority)
        
        let current = this.getMainGoals
        if(!current){
            console.log("umm no mainGoals...adding")
            $q.localStorage.set('mainGoals', JSON.stringify([{ //unshift
                id: 0,
                title: goal,
                details: details,
                priority: priority,
                bgcolor: color,
                icon: 'fas fa-utensils' 
            }]))
            return
        }

        //let id = current !== null ? current.length + 1 : 0
        let newID = current.length + 1

        while (current.some(item => item.id === newID)) {
            newID = Math.floor(Math.random() * 1000) //`${Math.floor(Math.random() * 1000)}`;
            //console.log("an item had the same id...using random", newID)
        }
        current.unshift({
            id: newID,
            title: goal,
            details: details,
            priority: priority,
            bgcolor: color,
            icon: 'fas fa-utensils' 
        })

      $q.localStorage.set('mainGoals', JSON.stringify(current))

      //console.log("done adding mainGoal", newID)
      return newID
    }

    function addSubGoal(pGoal,title,score,time, duration, canMove,inDefaults) {
        
        console.log(pGoal+ ' ' + title + ' ' + score + ' ' + time + ' ' + duration +' ' + canMove + ' '+ inDefaults)
        
        let current = this.getSubGoals
        //let id = current !== null ? current.length + 1 : 0
        if(!current){
            $q.localStorage.set('subGoals', JSON.stringify([{ //unshift
                id: 0,
                parentGoal:pGoal,
                title: title,
                score: score,
                time:time,//'19:00',
                duration: duration,
                canMove: canMove,
                inDefaults:inDefaults,
            }]))
            return
        }

        let newID = current.length + 1

        while (current.some(item => item.id === newID)) {
            newID = Math.floor(Math.random() * 1000) //`${Math.floor(Math.random() * 1000)}`;
            //console.log("an subgoal item had the same id...using random", newID)
        }

        current.unshift({
            id: newID,
            parentGoal:pGoal,
            title: title,
            score: score,
            time:time,//'19:00',
            duration: duration,
            canMove: canMove,
            inDefaults:inDefaults
        })

        $q.localStorage.set('subGoals', JSON.stringify(current))

        //console.log("done adding subGoal", newID)
        return newID
    }

    function editSubGoal(goalId, title,score,time, duration, canMove, inDefaults){
        let current = this.getSubGoals
        for( var i = 0; i < current.length; i++){ 
            if ( current[i].id === goalId) {
                current[i].title = title,
                current[i].score = score,
                current[i].time = time,//'19:00',
                current[i].duration = duration,
                current[i].canMove = canMove
                current[i].inDefaults = inDefaults
                console.log("editSubGoal for",current[i], i)
                break
            }
        }
         
        $q.localStorage.set('subGoals', JSON.stringify(current))
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
        //remove schedule too prolly--todo**

        console.log("removed ALL")
    }

    function saveSubProp(goalId, time = null, score = null) {
        let current = this.getSubGoals
        for( var i = 0; i < current.length; i++){ 
            if (current[i].id === goalId) {
                current[i].time = time || current[i].time
                current[i].score = score || current[i].score
               // console.log("subGoal time change for",obj) //.title +"to" + obj.time
               break
            }
        }

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

    function removeMaingoal(goalId, clearSubToo) {// if 'clearSubToo', should also remove the subgoals--TODO**--
        let current = this.getMainGoals
        for( var i = 0; i < current.length; i++){ 
            if ( current[i].id === goalId) { 
                current.splice(i, 1); 
                console.log("removeMaingoal spliced!")
            }
        }
        $q.localStorage.set('mainGoals', JSON.stringify(current))

        return current
    }

    function getGoalByTitle(goalTitle) {
        let current = this.getMainGoals

        //let toRet = null 
        for( var i = 0; i < current.length; i++){ 
            if ( current[i].title === goalTitle) { 
                return current[i]
            }
        }

        return null
    }

    //saves map of events that were completed...for summary retrieval
    //First adds date to AllDates key and then store the events by that date.
    function saveDailySchedule(aDate, events = null){
        let current = this.getAllDates

        if (!current){
            ///$q.localStorage.getItem("AllDates"))
            console.log(`Adding new schedule for ${aDate}`)
            current = {}
            current[`${aDate}`] = events //umm to see if no need to put {}  or do push? //aDate
            //$q.localStorage.set("AllDates", JSON.stringify(current)) //[aDate]
        }else{
            //current.push(aDate) //unshift ...
            ////map[ event.date ].push(event)
            if(!events){//clearing day schedule
                if (aDate in current){
                    delete current[`${aDate}`] //delete user.age;
                }else{console.log(`ERROR? deleting schedule of ${aDate} not found!`)}//shouldnt happen..prolly
            }else {
                current[`${aDate}`] = events //hopefully doesnt overwrite?!? or use the .push
            }
        }

        $q.localStorage.set("AllDates", JSON.stringify(current))

        //$q.localStorage.set(`${aDate}`, JSON.stringify(events)) //this is what grabs events per day
    }

    function getEventsForDate(aDate){
        //return JSON.parse($q.localStorage.getItem(`${aDate}`))
        let savedDates = this.getAllDates
        if (savedDates) {return savedDates[`${aDate}`]}
    }

    function hasEventsForDate(aDate){ 
        //check if has date events 
        //also double check if supposed to be in with check in AllDates?
       // console.log(`hasEventsForDate check for ${aDate}`)

        let savedDates = this.getAllDates
        if(!savedDates){return false} //[false, false]
        if (savedDates[`${aDate}`]){return true}
        return false //[false, false]
    }

    function fetchDefaults(){
        const map = []
        let inDefault = function(t){
            return t?.inDefaults //&& t.inDefaults  //if exist and true? 
        }

        let allSubGoals = this.getSubGoals
        if(!allSubGoals) {
            console.log("No subgoals to fetch defaults :(")
            return map
        }

        allSubGoals.forEach(event => {
            if (inDefault(event)){ //add those  inDefault
                map.push(event)
            }//else {
                //    console.log(`subGoal is less than scorey ${event.title}`, parsey)
                //}
        })

        return map 

    }

    function fetchAllPrio(prio = null){
        let allGs = this.getMainGoals
        let Smap = new Set()

        if(prio){
            for( var i = 0; i < allGs.length; i++){ 
                if ( allGs[i].priority == prio) {
                    Smap.add(allGs[i].priority)  //umm not goal?!?
                }
            }
        }else {
            allGs.forEach(g => {
                Smap.add(g.priority)
            })
        }
        return Smap
    }

    function fetchGoalsWithMinScore(scorey){  //of scorey minimum --actually max difference range in the score **ToRename properly!!
        const map = []
        //const tokenRegex = /^[0-9]{1,2}on[0-9]{1,2}$/g; //toREview....

        let parseScore = function(t){ //parses score and returns the difference btween the interval
            //const tokens = []
            //let match
            //while ((match = tokenRegex.exec(t)) !== null) {
            //    console.log(`euh ${t}`,match[1])
            //    tokens.push(match[1]);
            //}
            const tokens = t.split(/on/)
            if (tokens.length != 2) {//should be at most two variables....
                console.log(`parseScore error?${t}`, tokens)
                return -1
            }
            //console.log(`parseScore for ${t}`, tokens)
            return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!**to add guardrails...
        }

        let allSubGoals = this.getSubGoals
        if(!allSubGoals) {
            //console.log("No subgoals")
            return map
        }

        allSubGoals.forEach(event => {
            if (event.score == ""){ //ben add those without score...toReview
                console.log(`no score event added: ${event.title}`,event.score)
                map.push(event)
            }else{
                let parsey = parseScore(event.score)
                if (parsey > -1 && parsey >= scorey) {
                    map.push(event)
                }//else {
                //    console.log(`subGoal is less than scorey ${event.title}`, parsey)
                //}
            }
        })

        return map  
    }

    function getRandomIndex(sizey){
        return Math.floor(Math.random() * sizey) //array.length
    }

    function returnDuration(logged){
        let hours = logged / 60
        //const roundedNumber = Math.round(hours * Math.pow(10, 2)) / Math.pow(10, 2); //nope
        //return roundedNumber.toFixed(2)
        const fixed = hours.toFixed(2)
        //if (fixed.length >= 3 ) {
        //    console.log(`returnDuration`, fixed) //should .toPrecision(2) here prolly //.padStart(fixed.length + 1, '0')
        //}
        return parseFloat(fixed)  //the annoying string had to be parsed back into a number!!! 
    }
    
    //local method to get all subgoals by parentID--weird that it borks at this.getSubGoals..?!?
    //doesnt run even after removing the local var for getSubGoals....huh?!?
    function getSubGoalsByParent(id) {
        //let subs = this.getSubGoals
        console.log(`getSubGoalsByParent`, this.getSubGoals)
        let map = []
        //let allSubGoals = this.getSubGoals
        if(!this.getSubGoals) { //allSubGoals
            //console.log("No subgoals")
            return map
        }
        //map = subs.filter(x => x.parentGoal == parentID)

        this.getSubGoals.forEach(event => {
            if (event.parentGoal == id) {
                map.push(event)
            }
        })
        return map  
    }

    function fetchGoalsTree(){
        let mains = this.getMainGoals
        let subs =  this.getSubGoals

        let findSubGoals = parentID => {
            let map = []
            //let allSubGoals = this.getSubGoals
            if(!subs) { //allSubGoals
                //console.log("No subgoals")
                return map
            }
            //map = subs.filter(x => x.parentGoal == parentID)

            subs.forEach(event => {
                if (event.parentGoal == parentID) {
                    map.push(event)
                }
            })
            return map  
        }

        let tree = []

        mains.forEach(goal => {
            let toAdd = {//add something else?!?--details?!?
                label: `${goal.id}- ${goal?.title.trim()}(${goal?.priority})`, 
                color:`${goal?.bgcolor}`,
                prio: goal?.priority, //for now in label...
                children:[]
            }

            let subG = findSubGoals(goal.id) //really dont wanna work >> getSubGoalsByParent(goal.id)
            for (let i = 0; i < subG.length; i++) {
                let def = subG[i].inDefaults ? 'D' : '#'
                let cM = subG[i].canMove ? 'M' : '#'
                toAdd.children.push({
                    label: `${subG[i].id}-- ${subG[i]?.title.trim()}(${subG[i]?.score}) at ${subG[i]?.time}..${subG[i]?.duration} ::${def}${cM}`, 
                    //should add canMove and inDefault....prolly
                })
            }

            tree.push(toAdd)
        })

        return tree
    }

    function fetchAllTaskSummary(){
        let savedDates = this.getAllDates
        if(!savedDates){
            //console.log(`no savedTaskSummary..ERROR`) 
            return []
        }
        let mains = this.getMainGoals
        let subs =  this.getSubGoals
        let daDs = {}

        //slurp all the subgoals, keeping date && duration(logged)
        for (let dateKey in savedDates) { 
            let onDay = savedDates[dateKey]
            for (let evID in onDay) {
                if (!daDs[evID]) {
                    daDs[evID] = []
                }
                //console.log(`addin...`,dateKey,onDay[evID].duration)
                //div by 60 to get hours
                //let d = onDay[evID].duration / 60
                daDs[evID].push({ date: dateKey, logged: returnDuration(onDay[evID].duration)}) //toFixed(2) >>pad 0's on integer number too smh and this aint better>>.toPrecision(2) 
            }
        }
        //console.log(`DaDs`, daDs)

        
        let findSubGoals = parentID => { //see about moving this outside...toDO***
            let map = []
            //let allSubGoals = this.getSubGoals
            if(!subs) { //allSubGoals
                //console.log("No subgoals")
                return map
            }
            //map = subs.filter(x => x.parentGoal == parentID)

            subs.forEach(event => {
                if (event.parentGoal == parentID) {
                    map.push(event)
                }
            })
            return map  
        }

        let updateGoal = (task, withParent = null) => {
            let aTask = {
                children: [],
                title: withParent ? `${task.title.trim()}(${task.score})`: `${task.title.trim()} !${task.priority}!`,
                key: withParent ? `${withParent}-${task.id}` : task.id,
                logged:[], 
                //logged: daDs[task.id] || [], //gotta assign empty eh!
                expanded:false, //true works? >>does!
                color:task?.bgcolor, //only parents have colors...
                isChild: withParent ? true : false
            }
            if(withParent){ //subgoal
                let euh = daDs[task.id] || []
                //console.log(`Subgoals logged for ${task.title}`, euh)
                aTask.logged = [...euh]  //huh important to unfurl**
                //aTask.isChild=true
            }/* else { //for main parentGoal in order to have them shown! >>no need as logs the child stuff under parent below
                let loggedSize = getRandomIndex(2) //bon not more than 2 logged events--ToChange
                console.log(`Logging for Parent G: ${task.title}`, loggedSize)
               do {
                    let loggedDate = datesTest[getRandomIndex(datesS)]
                    let loggedDuration = loggedTest[getRandomIndex(loggedS)]
                    aTask.logged.push({date: loggedDate, logged: loggedDuration})
                } while (--loggedSize > 0)
            }*/

            return aTask
        }

        let tasks = []
        
        mains.forEach(goal => {
            let toAdd = updateGoal(goal)
            let subG = findSubGoals(goal.id) //getSubGoalsByParent(goal.id)

            for (let i = 0; i < subG.length; i++) { //if(toAdd.children.length > 0) {
                let uSub = updateGoal(subG[i], goal.id)
                if (uSub.logged.length == 0) { //not adding evts that have not been schedule-saved yet and appearing as blank rows!
                    console.log(`Oooh no logged for parent ${goal.title}`, uSub)
                    continue
                }
                toAdd.logged.push(...uSub.logged) //logged child's gets added to parent(makes sense) so that calculations are correct!
                toAdd.children.push(uSub)
            }

            tasks.push(toAdd)
        })
        //console.log("fetchAllTaskSummary",tasks)

        return tasks
    }

    return {
        headers, 
        headerRefs, 
        getHeaders, 
        getMainGoals,
        getSubGoals,
        //getSubGoalsByParent,
        getAllDates,
        addMainGoal,
        addSubGoal,
        editSubGoal,
        getGoalByTitle,
        saveSubProp,
        saveDailySchedule,
        resetSub,
        resetMain,
        resetAll,
        removeSubgoal,
        removeMaingoal,
        getEventsForDate,
        hasEventsForDate,
        fetchAllTaskSummary,
        fetchGoalsWithMinScore,
        fetchAllPrio,
        fetchDefaults,
        fetchGoalsTree
    }
})