import { computed } from 'vue'   //ref
import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'  //event, 

import { deepCopy } from '../pages/util/utiFunc'
//see from Blu file original Option store to this Setup Store
//ref()s become 'state' properties
//computed() become 'getters'
//function() become 'actions'
export const useGoalStore = defineStore('allGoals', () => {
    
    /*const headerRefs = ref([  
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
      ] */
    
    const $q = useQuasar() 

    //const getHeaders = computed(() => headers)  //or headerRefs
    //const getGoals = computed(() => goalList)

    //this works? nope...should it be a function instead?
    const getMainGoals = computed(() => {
    //let item = JSON.parse(localStorage.getItem(key))
        //doCopy(JSON.parse($q.localStorage.getItem("mainGoals")))
        let item = JSON.parse($q.localStorage.getItem("mainGoals"))
        return deepCopy(item) //doCopy
    })
    
    const getSubGoals = computed(() => {
    //let item = JSON.parse(localStorage.getItem(key))
        //doCopy(JSON.parse($q.localStorage.getItem("subGoals")))
        let item = JSON.parse($q.localStorage.getItem("subGoals"))
        return deepCopy(item) //doCopy
    })

    const getAllDates = computed(() => 
    //let item = JSON.parse(localStorage.getItem(key))
        //doCopy(JSON.parse($q.localStorage.getItem("subGoals")))
        JSON.parse($q.localStorage.getItem("AllDates"))
    )

    //const getBalance = computed(() => //yup doesnt update!--using currentBalance() below--
     //   JSON.parse($q.localStorage.getItem("Balancey"))
    //)

    function doCopy(arr){  //copy >>this {...obj} is for objects
        if(arr) return [...arr]  //oldie that crap out when arr is null >> arr.length > 0
        return []//[...arr] //craps out when array is empty tho!!--toSee if line above works...nope just does a 'shallow' copy smh
        //const json = JSON.parse(JSON.stringify(original)); //quick and dirty way to copy apparently...bof dont seem to work even!
    }


    //dummy dates for Task summary
    //const datesTest = ['2021-03-10', '2021-03-11','2021-03-08','2021-03-06','2021-03-05']

    //dummy logged duration Task summary 
    //const loggedTest = [0.5, 2.0, 3.5, 4.0, 4.5, 1.0]

    function setBalance(amt){
        $q.localStorage.set('Balancey', JSON.stringify(amt))
    }

    function currentBalance(){
        return JSON.parse($q.localStorage.getItem("Balancey"))
    }

    function importGoals(pGoals, sGoals,allDates=null){ //umm wonder if can overload with below addMainGoal() ?!? >>nope no overloading in JS smh...

        //check for .id? to edit/add ? >> toSee** but should be present...prolly
        //return this.editMainGoal(obj.id,obj.title,obj.details,obj.color,obj.priority)

        //console.log("::importGoals", pGoals, sGoals,allDates)

        resetAll()  //umm so no this. requiered?!? >>seems so!

        $q.localStorage.set('mainGoals', JSON.stringify(pGoals))

        $q.localStorage.set('subGoals', JSON.stringify(sGoals))

        if (allDates){
             $q.localStorage.set("AllDates", JSON.stringify(allDates))
        }
       
        return
    }

    function addMainGoal(goal,details,color,priority,icon=null) {
       
        //console.log("addMainG",goal+ ' ' +details + ' ' +color + ' ' +priority+' ' +icon, iconParse(icon))
        
        let current = this.getMainGoals
        if(!current){
            console.log("umm no mainGoals...adding")
            $q.localStorage.set('mainGoals', JSON.stringify([{
                id: 0,
                title: goal.trim(),
                details: details,
                priority: priority,
                bgcolor: color,
                icon: icon ? iconParse(icon) : 'fas fa-utensils' 
            }]))
            return
        }

        //let id = current !== null ? current.length + 1 : 0
        let newID = current.length + 1

        //should try to have id that is larger that largest id as can assign id that is lower and mess up sorting when showing goals...todo**
        // toReview if newID*2 is better
        while (current.some(item => item.id === newID)) { // || newID === 0 // make sure not zero esti! but prolly screw things
            newID = Math.floor(Math.random() * (newID*2)) //oldie >> 1000
            //console.log("an item had the same id...using random", newID)
        }
        current.unshift({ //unshift better in case id 0 was deleted!
            id: newID,
            title: goal.trim(),
            details: details,
            priority: priority,
            bgcolor: color,
            icon: icon ? iconParse(icon) : 'fas fa-utensils' 
        })

      $q.localStorage.set('mainGoals', JSON.stringify(current))

      //console.log("done adding mainGoal", newID)
      return newID
    }

    function editMainGoal(id,title,details,color,priority,icon=null){
        
        //console.log("editMainGoal", id+ ' ' + title + ' ' + details + ' ' + color + ' ' +priority+' ' +icon,iconParse(icon))
        
        let current = this.getMainGoals
        let found = false  //flag for success/found?!? >>return it?!? tbd**

        for( var i = 0; i < current.length; i++){ 
            if (current[i].id === id) {
                current[i].title = title.trim(),
                current[i].details = details,
                current[i].bgcolor = color
                current[i].priority = priority
                current[i].icon = icon ? iconParse(icon) : current[i].icon 
                found = true
                break
            }
        }
                 
        $q.localStorage.set('mainGoals', JSON.stringify(current))
    }

    function addSubGoal(pGoal,title,score,time, duration, canMove,inDefaults,isAlternative,moods) {
        
        //console.log(pGoal+ ' ' + title + ' ' + score + ' ' + time + ' ' + duration +' ' + canMove + ' '+ inDefaults)
        
        let current = this.getSubGoals
        //let id = current !== null ? current.length + 1 : 0
        if(!current){
            $q.localStorage.set('subGoals', JSON.stringify([{ //unshift
                id: 0,
                parentGoal:pGoal,
                title: title.trim(),
                score: score,
                time:time,//'19:00',
                duration: duration,
                canMove: canMove,
                inDefaults:inDefaults,
                isAlternative:isAlternative,
                jeSuis: moods ? moods : []  //to not add nulls...
            }]))
            return
        }

        let newID = current.length + 1

        while (current.some(item => item.id === newID)) { // || newID === 0
            newID = Math.floor(Math.random() * (newID*2)) //oldie >> 1000
            //console.log("an subgoal item had the same id...using random", newID)
        }

        current.unshift({
            id: newID,
            parentGoal:pGoal,
            title: title.trim(),
            score: score,
            time:time,//'19:00',
            duration: duration,
            canMove: canMove,
            inDefaults:inDefaults,
            isAlternative:isAlternative,
            jeSuis: moods ? moods : []  //to not add nulls...
        })

        $q.localStorage.set('subGoals', JSON.stringify(current))

        //console.log("done adding subGoal", newID)
        return newID
    }

    function editSubGoal(goalId, title,score,time, duration, canMove, inDefaults,isAlternative,moods){
        //console.log("editSubGoal", goalId+ ' ' + title + ' ' + score + ' ' + time + ' ' + duration +' ' + canMove + ' '+ inDefaults+' '+isAlternative)
        
        let current = this.getSubGoals
        let found = false //flag for success/found?!? >>return it?!? tbd***

        for( var i = 0; i < current.length; i++){ 
            if ( current[i].id === goalId) {
                current[i].title = title.trim(),
                current[i].score = score,
                current[i].time = time,//'19:00',
                current[i].duration = duration,
                current[i].canMove = canMove
                current[i].inDefaults = inDefaults
                current[i].isAlternative = isAlternative
                current[i].jeSuis = moods ? moods : []  //to not add nulls...
                //console.log("editSubGoal for",current[i], i)
                found = true
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
        $q.localStorage.remove('AllDates')
        $q.localStorage.remove('Balancey')

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
                //console.log("removeSubgoal spliced!")
            }
        }
        $q.localStorage.set('subGoals', JSON.stringify(current))
        return current
    }

    function removeMaingoal(goalId, clearSubToo) {// if 'clearSubToo' to also remove the subgoals >>redundant...
        let current = this.getMainGoals
        for( var i = 0; i < current.length; i++){ 
            if ( current[i].id === goalId) { 
                current.splice(i, 1); 
                //console.log("removeMaingoal spliced!")
            }
        }
        $q.localStorage.set('mainGoals', JSON.stringify(current))

        return current
    }

    function getGoalByTitle(goalTitle) {
        let current = this.getMainGoals

        //let toRet = null 
        for( var i = 0; i < current.length; i++){ 
            if ( current[i]?.title.trim() === goalTitle) { 
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
            current[`${aDate}`] = events
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
    }

    function getEventsForDate(aDate){
        //return JSON.parse($q.localStorage.getItem(`${aDate}`))
        let savedDates = this.getAllDates
        if (savedDates) {  //doCopy ?
            return savedDates[`${aDate}`]
        }
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

    function fetchAllPrio(){
        let allGs = this.getMainGoals
        let Smap = new Set()
        
        allGs.forEach(g => {
            Smap.add(g.priority)
        })
        
        return Smap
    }

    function fetchAlternativeEvts(){
        const map = []
        let allSubGoals = this.getSubGoals
        if(!allSubGoals) {
            //console.log("No subgoals")
            return map
        }
        
        allSubGoals.forEach(event => {
            if (event?.isAlternative){
                map.push(event)
            }//else{
            //    console.log(`subGoal is Not Alternative ${event.id}: ${event.title}`)
            //}
        })
        return map  
    }

    function fetchGoalsUpToMaxScore(scorey){  //of scorey minimum --actually max difference range in the score **ToRename properly!!
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
            if (event.score == ""){ //ben add those without score...should NOT happen.
                console.log(`no score event added: ${event.title}`,event.score)
                map.push(event)
            }else{
                let parsey = parseScore(event.score)
                if (parsey > -1 && parsey <= scorey) {
                    map.push(event)
                }//else {
                //    console.log(`subGoal is less than scorey ${event.title}`, parsey)
                //}
            }
        })

        return map  
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

    function fetchGoalsTree(){
        let mains = this.getMainGoals
        let subs =  this.getSubGoals

        
        let sorty = (a, b) => { //could still be out of order of creation due to id generation(see above when adding)....
            if (a.id > b.id) return 1; 
            if (a.id == b.id) return 0; 
            if (a.id < b.id) return -1;
        }

        let when = (timey) => {
            if(!timey) return ''
    
            let o = timey.split(':')
            return parseInt(o[0]) >= 12 ? timey+" PM" : timey+" AM" 
        }

        let findSubGoals = parentID => {
            let map = []
            //let allSubGoals = this.getSubGoals
            if(!subs) { //allSubGoals
                //console.log("No subgoals")
                return map
            }

            subs.forEach(event => {
                if (event.parentGoal == parentID) {
                    map.push(event)
                }
            })
            return map  
        }

        let tree = []

        mains.forEach(goal => {
            let toAdd = {
                id: goal.id, //for sorting....
                label: `${goal.id}) ${goal?.title.trim()}`,
                details:`${goal.details} ==> Priority (${goal?.priority})`,
                color:`${goal?.bgcolor}`,
                prio: goal?.priority, //for now in label...
                icon:goal?.icon, //toReview if not redundant...
                children:[]
            }

            let subG = findSubGoals(goal.id) //really dont wanna work >> getSubGoalsByParent(goal.id)
            for (let i = 0; i < subG.length; i++) {
                let def = subG[i].inDefaults ? 'Dft' : '#'
                let cM = subG[i].canMove ? 'Mv' : '#'
                let alt = subG[i].isAlternative ? 'Alt' : '#'
                let mess =  [`${when(subG[i]?.time)} for ${subG[i]?.duration} mins`, //bon proper multiline? >>especially using .join(\n) >>nope! smh  >>> gotta use css class!!
                `:: ${def}~${cM}~${alt}`].join('\n')
                //console.log("findSubGoals",JSON.parse(JSON.stringify(mess))) //JSON.parse(JSON.stringify(mess.join('\n')))
                toAdd.children.push({
                    id: subG[i].id, //for sorting....
                    label: `${subG[i].id})- ${subG[i]?.title.trim()} (${subG[i]?.score})`, //canMove and inDefault at end
                    details: mess,//.join('\n'), //oldie >> `${when(subG[i]?.time)} for ${subG[i]?.duration} mins :: ${def}~${cM}~${alt}`,
                    color:`${goal?.bgcolor}`,
                    isChildren:true,
                    moods: subG[i].jeSuis || []
                })
            }
            //console.log("Childy"+goal.id,JSON.parse(JSON.stringify(toAdd.children)))

            let tC = toAdd.children

            tC.sort(sorty)
            toAdd.children = tC

            //console.log("Childy-After"+goal.id,JSON.parse(JSON.stringify(tC)),JSON.parse(JSON.stringify(toAdd.children)))

            tree.push(toAdd) // children.sort(sorty) >> works? >>nope fucks up array...
        })

        //console.log("Tree-Before",JSON.parse(JSON.stringify(tree)))

        tree.sort(sorty)

        //console.log("Tree-AFTER",JSON.parse(JSON.stringify(tree)))

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
                let e = { date: dateKey, logged: returnDuration(onDay[evID].duration), atScore: onDay[evID]?.atScore } //|| "" >>better to leave so dont 
                if ('notes' in onDay[evID]) { //for timeline.. pushes to parent too?!? toFix**
                    //console.log(`fetchAllTaskSummary:: notes!!!`,dateKey,onDay[evID])
                    e.notes = onDay[evID].notes
                    //e.atScore = onDay[evID].atScore
                }
                daDs[evID].push(e)//{ date: dateKey, logged: returnDuration(onDay[evID].duration)}) //toFixed(2) >>pad 0's on integer number too smh and this aint better>>.toPrecision(2) 
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
                title: withParent ? `${task.title.trim()} (${task.score})`: `${task.title.trim()} !${task.priority}!`,
                key: withParent ? `${withParent}-${task.id}` : task.id,
                logged:[], 
                //logged: daDs[task.id] || [], //gotta assign empty eh!
                expanded:true, //meh expand by default...
                color:task?.bgcolor, //only parents have colors...
                isChild: withParent ? true : false
            }
            if(withParent){ //subgoal
                let euh = daDs[task.id] || []
                //console.log(`Subgoals logged for ${task.title}`, euh)
                aTask.logged = [...euh]  //huh important to unfurl**
                //aTask.isChild=true //no need as done above
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
                if (uSub.logged.length == 0) { //not adding evts that have not been schedule-saved yet as appear as blank rows!
                    //console.log(`Oooh no logged for parent ${goal.title}`, uSub)
                    continue
                }
                toAdd.logged.push(...uSub.logged) //logged child's gets added to parent(makes sense) so that calculations are correct!
                //delete uSub.children //works >>not have annoying arrow in front smh--done below 
                uSub.children.length < 1 ? delete uSub.children : console.log(`huh children has descendents?!? ERROR?`,uSub)
                toAdd.children.push(uSub)
            }

            tasks.push(toAdd)
        })
        //console.log("fetchAllTaskSummary",tasks)

        return tasks
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

    function getRandomIndex(sizey){ //redundant
        return Math.floor(Math.random() * sizey)
    }

    function iconParse (name) {

        if (name.indexOf('-') > -1){ //check that it has already that '-' 
            //console.log("iconParse::GOOD?",name)
            return name  //>> to not make it worse--toSee**
        }

        let a = name.replace(/\W+/g, " ") 
          .split(/ |\B(?=[A-Z])/)
          .map(word => word.toLowerCase())
          //.join('-') //have to check length for fas/fab smh
        let useFas = false
        if (a.length > 1){
            console.log("iconParse::FAS",a) //not always smh i.e "fas fa-handshake" 'fas fa-amazon-pay' should be 'fab fa-amazon-pay' --toReview** 
            useFas = true
        }
        a = a.join('-')

        return a.includes('regular') ? 'far fa-'+a.replace("-regular", "") : useFas ? 'fas fa-'+a : 'fab fa-'+a  // oldie >> 'fab fa-'+a  >> fab prefix tend to not show?....toReview** or use excludeIcons
    }

    return {
        //headers, 
        //headerRefs, 
        //getHeaders, 
        getMainGoals,
        getSubGoals,
        //getSubGoalsByParent,
        getAllDates,
        //getBalance,
        currentBalance,
        setBalance,
        addMainGoal,
        addSubGoal,
        editSubGoal,
        editMainGoal,
        importGoals,
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
        fetchGoalsUpToMaxScore,
        fetchAllPrio,
        fetchDefaults,
        fetchAlternativeEvts,
        fetchGoalsTree
    }
})