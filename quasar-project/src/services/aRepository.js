

//put all logic together and be mediator btween front and storage 
//reduce duplication && front doesnt import unnecessary stuff like goalStorage file
    

import { useGoalStore } from 'stores/goalStorage'

//import { createEvent } from '../models/schedEvt.js'

import { deepCopy } from '../pages/util/utiFunc' //  '../util/utiFunc'

//access goalStorage
//have list of allDates,pGoals and subGoals
//access model objects(Events,Goals,Schedule)


//too many exported functions?!?

//change value to reference

let _repositoryData; //this global?!?---use class? or same pattern as in schedEvt.js?
let _store; //same concern as above...global?

//Protected properties are usually prefixed with an underscore _. //huh!
//Privates should start with #. They are only accessible from inside the class.
//same with methods that start with # >> #fixWaterAmount(value) {}

export function initialize() { 
    _repositoryData = {};
    _store = useGoalStore();
   
    //_repositoryData.dailyScheduled = new Map();
    //_repositoryData.endTimesSet = new Set();
    //_repositoryData.startTimesSet = new Set();
    //this.scheduledEvents = []  //this actually is ALL schedulable GOALS!!!... naming smh

    //prolly get the pGoals, subGoals,allDates,balance here!
    
    //other calculations 
        //like constructTreeGoals,AllPrio,GoalByTitle,taskSummary?
        //GoalsWithMinScore 
        //alternativeEvts
        //defaultEvts

    //ummm should also set pGoals, subGoals vars at this time?!? 
    //toSee but prolly no need?
}

export function parentGoalsMap() {

    if (_repositoryData.pGoalsMap == null){
        //console.log('Repo:: No pGoalsMap');
    } //else { return _repositoryData.pGoalsMap }

    const map = new Map()
    let mG = allParentGoals() ////updates for new?
    if (!mG){
        console.log("Repo:: parentGoalsMap is empty or null", mG)
        return map
    }
  
    mG.forEach(obj => {
        map.set(obj.id, obj);
    })

    _repositoryData.pGoalsMap = map

    return map
}

export function hasEventsForDate(date) {
    return _store.hasEventsForDate(date)
}

export function getDataForDate(dt){ //raw minimal data
    return _store.getEventsForDate(dt)
}

export function allParentGoals() {
    return _store.getMainGoals  //updates for new?
}

export function allSubGoals() {
    if (_repositoryData.subGoals == null){
        //console.log('Repo:: NO subGoals')
        //deepCopy(_repositoryData.subGoals) --huh no change
        _repositoryData.subGoals = _store.getSubGoals
    }
    //umm prolly doesnt updates for new?
    return _repositoryData.subGoals  
}

export function getSubGoalByID(id){
    //todo**
}

export function storedAlternatives() {
    return _store.fetchAlternativeEvts()
}

export function currentBalance() {
    return _store.currentBalance()
}

export function constructTree() {
    return _store.fetchGoalsTree()
}

export function allPriorities() {
    let e = _store.fetchAllPrio()
    //let ar = Array.from(e.values())
    //console.log('allPriorities',e) //ar, typeof ar)
    if(!e.size > 0){
        //this.prioOptions = e.values()
        console.log('ERROR...no Priority goals?', e)
        return []
    }
    return Array.from(e.values()).sort()
}

export function getDefaultEvts() { 
    
    //also deepCopy? to resets reference --toSee**
    return _store.fetchDefaults()
}

export function goalsUpToScore(score) {
    return _store.fetchGoalsUpToMaxScore(score)
}

export function doSaveEvtProp(evtID, timey = null, score = null) {
     //should just send whole event? toReview***
    _store.saveSubProp(evtID, timey, score) 
    return 
}

export function getMiscGoal() { //to check if there is any 'Misc' pGoal
   return _store.getGoalByTitle("Misc") 
}

export function storeNewBalance(newB) {
    _store.setBalance(newB)
}
export function addToBalance(dura) {
    let balance = currentBalance()
    let neB = balance - parseInt(dura) //gotta minus...
    //_store.setBalance(neB)
    
    //return?
}

export function saveDailySchedule(date, evts) {
    _store.saveDailySchedule(date, evts)
}

export function addParentGoal(title, details, color, priority) {
    return _store.addMainGoal(title, details, color, priority)
}

export function addSubGoal(pID, title,score,time, duration, canMove,inDefaults,isAlternative,moods) {
    //should send whole event?*** todo**
    return _store.addSubGoal(pID,title,score,time, duration,canMove,inDefaults,isAlternative,moods)  //isAlternative = duration<30
}

/* //invoke doSaveEvtProp() directly!
export function saveNewScore(newScore, id,note='') {
    let ev = findEvent(id)

    if (ev){
     
        //--should keep historical score change for goal?!? to see maybe...
        
        //let dif = this.parseScore(newScore) //todo***
        //if (dif < -1) {
        //  if (dif == -89) {
        //    console.log(`saveNewScore parsing error`,dif,newScore)
        //    this.doNotify("Score Parsing Error... YOU FOO! ")
        //  } else{
        //    this.doNotify("Score Error: higher# on lower#")
        //  }
         // return
        //}
        
        doSaveEvtProp(id, null, newScore)
  
        //send changes down to child component...todo**
        /*let h = this.getScheduledEvent(id)
        let oldy = null
        if (h){
          oldy = h.score //to keep track below
          h.score = newScore
        }else{console.log('onSaveScore ERROR not found',h, id) }  //very baaad!
         
        if(note !==''){
          console.log(`saveNewScore::note ${id}from ${oldy} to ${newScore} with note>>`,note)
          ev.score = oldy ? oldy : newScore  //todo...fix buuug!
          ev.notes = note
          this.doSaveSchedule() //onSaveScore
        }//*
  
      }else {
        console.log(`ERROR saveNewScore could not find event ${id}?!?`,note) //this would be baaad! 
      }
}*/