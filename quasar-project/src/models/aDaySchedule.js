import {
  addToDate,
  today,
  parseTimestamp,
  isBetweenDates,
  diffTimestamp,
  getDateTime,
  getDayTimeIdentifier,
  getTimeIdentifier, //should use this actually for overlap calc? toSee
  getDayIdentifier,
  parsed,
  parseDate,
  parseTime, 
} from '@quasar/quasar-ui-qcalendar/src/index.js'

import * as Repo from '../services/aRepository.js'

import { createEvent } from '../models/schedEvt.js'

import { whenFrmtTime } from '../pages/util/utiFunc'
export default class daySchedule {
    /*
    data //= null //really doesnt like declared inner variables smh

    */

    //parseTime and other stuff here

    constructor(data,onDate) 
    {
      this.data = data  //redundant..maybe...
      //this._data = {min: min, max: max};

      this.showReloadBtn = false //:boolean ;//= false
      this.showClearBtn = false
      this.showLoadDefaults = true
      this.showScoreBtn = true
      this.showPrioBtn = true
      this.showOneEachBtn = false

      this.disablePrioBtn = true  //to temp disable when selecting a new value...
      this.disableScoreBtn = true //same as above 
    
      this.disableSaveSchedule = true
      this.chosenScore = null
      this.chosenPrio = null

      this.dailyScheduled = new Map()
      this.endTimesSet = new Set()
      this.startTimesSet = new Set()
  
      //umm complain named same as above? toSee**
      this._dailyScheduled = new Map()  
      this._endTimesSet = new Set()
      this._startTimesSet = new Set()
  
      //should use _dailyScheduled instead --todo**
      this.savedRawEvts = []

      this.actualEvts = []  //bon to use prolly...

      this.usingMoods = {} //:ref({}),  //ref(null)

      this.currentDate = onDate

      //this.testEvtsMap = this.testEvts() //nope
            
      Repo.initialize()
    }
    //showyReloadBtn(){ //works!
    //  return this.showReloadBtn
    //}
    allPGoals (){
      return Repo.allParentGoals() 
      // or use parentGoalsMap() ?!? toSEE**
    }

    getAllEvts(){
      return this.actualEvts
    }

    getCurrentSchedTimesSets(){
      return {
        endSet:this._endTimesSet,
        startSet:this._startTimesSet,
      }
    }

    isViewingPast(){
      let isToday = today()

      if (this.currentDate && this.currentDate == isToday){
        return false
      }
  
      let onToday = getDayIdentifier(parsed(isToday))
      let viewing = getDayIdentifier(parsed(this.currentDate))
  
      if (viewing >= onToday) { //.nope future >'
        
        return false
      }
      return true
    }

    isViewingToday() {
      return today() == this.currentDate
    }
    getData() { //redundant--toRemove**
      return this.data
    }

    toggle() { //updates!!!!niiice!--toRemove || use **
      this.showReloadBtn = !this.showReloadBtn
    }
    // to encapsulate the btns!!-
    //-toRename***...doesnt seem needed either as can access variables outside smh
    getProps() {
      //this.daSchedule.showReloadBtn >>also accessible straight up and modifiable outside!!!
      return {
        showReloadBtn:this.showReloadBtn,
        showClearBtn:this.showClearBtn, //:boolean; / //= false
        showLoadDefaults:this.showLoadDefaults, //:boolean ; //= true
        showScoreBtn:this.showScoreBtn, //:boolean ; //= false
        showPrioBtn:this.showPrioBtn, //:boolean ; //= false
        showOneEachBtn:this.showOneEachBtn, //:boolean ; //= false

        disablePrioBtn:this.disablePrioBtn, //:boolean ; //= true  //to temp disable when selecting a new value...
        disableScoreBtn:this.disableScoreBtn,//:boolean ; //= true //same as above 
        
        chosenScore:this.chosenScore, //:0 ; //= null
        chosenPrio:this.chosenPrio //:1 ; //= null
      }
    }
    saveBtnEnabled(){
      return this.disableSaveSchedule
    }
    fetchGoalsTree(){
      //console.log('fetchGoalsTree')
      return Repo.constructTree()
    }
    getCurrentBalance(){
      //console.log('getCurrentBalance')
      return Repo.currentBalance()
    }
    getAllPrio(){
      return Repo.allPriorities()  //[1,2,3]//
    }
    getSubGoals(){
      return Repo.allSubGoals()  //deepCopy?
    }
    getCurrentMoods(){
      return this.usingMoods
    }
    getSubGoalByID(id){ 
      //todo invoke the Repo.getSubGoalByID() instead***
      let all = this.getSubGoals()
      //console.log('getSubGoalByID >>All',typeof(id),id,all)
      let numId = parseInt(id)//OH freaking type check!!smh--id should always be a number!!
      
      for(let i = 0; i< all.length;i++){
        if (all[i].id === numId) return all[i]  
      }
      return null
    }

    parentGoalsMap(){
      return Repo.parentGoalsMap()  //deepCopy?
    }
    parentGoalById(id){
      return this.parentGoalsMap().has(id) ? this.parentGoalsMap().get(id) : null
    }
  
    findEvent(id) {
      return this._dailyScheduled.has(id) ? this._dailyScheduled.get(id) : null
      //return this._dailyScheduled.get(id);
    }

    findSchedEvent(id) {
      for(let i = 0; i< this.actualEvts.length;i++){
        if (this.actualEvts[i].id === id) return this.actualEvts[i]  //OH freaking type check!!smh--id should always be a number!!
      }
      return null
    }

    hasEventsForDate() {
      //let h = Repo.hasEventsForDate(this.currentDate)
      //console.log('hasEventsForDate >>',this.currentDate, h) //proper?
      return Repo.hasEventsForDate(this.currentDate) //h
    }
    getDateEvents(dt){
      let sorty = (a, b) => {//sort by earlier timestamp!--too much?
        //also have to have sortime in enrichScheduled >> updatedEvtDetails() --TODO**
        let timeDiff = diffTimestamp(a.sortTime,b.sortTime) 
        if (timeDiff > 0) return -1
        if (timeDiff == 0) return 0 
        if (timeDiff < 0) return 1
      }
      
      const events = this.currentSchedEventsMap()[ dt ] || []

      //console.log("aDaySchedule::getDateEvents>> ",dt, events) //this.currentSchedEventsMap()
      
      if (events.length === 1) {
        events[ 0 ].side = 'full'
      } else if (events.length === 2) {
        //console.log("getDateEvents...LENGTH is 2?",dt, events) //bof when actual scheduled is just two evts!--weird that it does this calculation...prolly when overlapping times? >> YEUP! very nice actually--prolly would need overlap check if more than 2 evts lool!
        // this example does no more than 2 events per day
        // check if the two events overlap and if so, select
        // left or right side alignment to prevent overlap

        //could use start/end instead of calculations below...todo***
        const startTime = addToDate(parsed(events[ 0 ].date), { minute: parseTime(events[ 0 ].time) })
        const endTime = addToDate(startTime, { minute: events[ 0 ].duration })
        const startTime2 = addToDate(parsed(events[ 1 ].date), { minute: parseTime(events[ 1 ].time) })
        const endTime2 = addToDate(startTime2, { minute: events[ 1 ].duration })
        if (isBetweenDates(startTime2, startTime, endTime, true) || isBetweenDates(endTime2, startTime, endTime, true)) {
          console.log("getDateEvents...LENGTH==2..LEFT/RIGHT 'TWIX")  //,startTime, endTime,startTime2,endTime2
          //when two evts next to each other with some overlapp...
          events[ 0 ].side = 'left'
          events[ 1 ].side = 'right'
        } else {
          events[ 0 ].side = 'full'
          events[ 1 ].side = 'full'
        }
      }
      return events.sort(sorty)
    }
    currentSchedEventsMap(){ // convert the events into an object keyed by date
      //return this._dailyScheduled
    
      const mappyA = {}


      //this._dailyScheduled
      this.actualEvts.forEach((evt) => { //(value, key, map) => {
              let d = evt.date //value.date()  //invoke up to date date...toSee if updates for new days!
              
              if (!mappyA[ d ]) { // oldie >> value.date :: now >> d  and mappyA AINT map smh
                mappyA[ d ] = []
              }
              mappyA[ d ].push(evt)
              //console.log(`currentSchedEventsMap adding `,key,value) //${event.title.trim()},${event.time}`,event)
              if (evt.days) {
                console.log(`currentSchedEventsMap multiple days? event for ${evt.date}`, evt.days) //when this happens? could happen if add #days--except start from the event.date + #days---meh to see about useing
                let timestamp = parseTimestamp(evt.date)
                let days = evt.days
                do {
                  timestamp = addToDate(timestamp, { day: 1 })
                  if (!map[ timestamp.date ]) {
                    map[ timestamp.date ] = []
                  }
                  map[ timestamp.date ].push(evt)
                } while (--days > 0)
              }
            })
            //console.log(`currentSchedEventsMap`, mappyA) //b,
            return mappyA
    }
    enrichAddToSchedule() { 
      //addPropsEventsTo(with savedEvtFunc) + updatedEvtDetails
      
      let euhOverlaps = {}

      let checkOverlaps = this.isViewingToday()

      console.log('enrichAddToSchedule',Object.keys(this.savedRawEvts).length,"overlapCheck:"+checkOverlaps)//,this.savedRawEvts) //JSON.parse(JSON.stringify(this.savedRawEvts))) 
      
      
      for (let key in this.savedRawEvts) {
        let toH = this.savedRawEvts[key]
        
        //have to enrich raw with original goal first!
        //toH has rawSaved data that should overwrite/add to what goal has...
        let originalG = this.getSubGoalByID(key) 

        if (!originalG) {console.log(`enrichAddToSchedule:: ERROR no goal found>>key: ${key}`, toH); continue} //prolly deleted

        let pGoal = this.parentGoalById(originalG.parentGoal)

        let c = createEvent(toH,originalG,pGoal)
        //console.log('enrichScheduled::createEvent>>',key, toH,originalG, pGoal,c)

        //console.log('enrichScheduled::createEvent >>',c.id,c.duration,c.data(),c.getGoal(),c.score,c.timeChanged(),c.durationChanged())
        
        let added = this.addEventInSchedule(c,checkOverlaps) //originalG
        if(!added){
          console.log('enrichAddToSchedule..ERROR?!? not added',added,originalG) 
          //could be already present--so NOT an error!!!
          
          euhOverlaps[originalG.id] = added
        } else {
           //if 
          //TODO**
          //this.canEnableEditScore(evt.id,endTime)
          //this.enableEndNowBtn

          if(Array.isArray(added)){ //overlap!!!
            console.log('enrichAddToSchedule..BOOO overlap?!!!',added)
            //add to euhOverlaps here prolly?!? *toSEE
            euhOverlaps[originalG.id] = added
          } else{

            //console.log('enrichAddToSchedule..Wooo!!!',added)

           
            //let pGoal = this.parentGoalById(added.getGoal().parentGoal)
            //console.log('enrichScheduled..Wooo!!',added,pGoal,added.date(),added.datey(),c,c.date())
            /*if (pGoal){
              let b = added.withPropsEventsTo(pGoal)

              //let f = c.addPropsEventsTo()
              //console.log('enrichScheduled..withPropsEventsTo!!',JSON.parse(JSON.stringify(b)),f) //b,b.date)
              
              //could use 'c' but just to have props available after invoking withPropsEventsTo()
              //b is == c !!!
              if (b.date() == null) {
                b.setDate(this.currentDate)
                console.log('enrichScheduled...setDate>> ',b.time,b.timeChanged(),c.timeChanged()) //b.date(),b.datey(),b.timeChanged(),c.date()
                b.sortTime = addToDate(parsed(b.date()), { minute: parseTime(b.time) }) 
              }
              this.actualEvts.push(b)
            }*/
          }
        } 
      }

      return euhOverlaps
      
    }
    loadEvtsForDay(noChange){
      if (!noChange){ //(d == null){
        console.log('loadEvtsForDay--Changed', this.currentDate,JSON.parse(JSON.stringify(this.savedRawEvts)))
        this.resetSchedule() //first clear for new different date!
      }

      //console.log('loadEvtsForDay--FOR date',d,this.currentDate,this.savedRawEvts)
      this.savedRawEvts = Repo.getDataForDate(this.currentDate)
      
      if (this.savedRawEvts){
        let hasOverlaps = this.enrichAddToSchedule()
        if(Object.keys(hasOverlaps).length > 0){
          //handle overlaps--todo**
          console.log('loadEvtsForDay--OVERLAPS!!!',hasOverlaps)
        }
        //return hasOverlaps
        return {
          overlaps:hasOverlaps,
          canContinue:Object.keys(hasOverlaps).length > 0 //false,
        }
      } else{
        console.log('loadEvtsForDay--Nothing to load!!!',this.savedRawEvts)
        return {
          overlaps:null,
          canContinue:true
        }
      }
      
      //TODO**
      //this.canEnableEditScore(evt.id,endTime)
      //this.enableEndNowBtn

      
      //return //hasOverlaps  
    }
    //handleOverlaps(overlaps,override = null,from =''){
      //prolly better in view...toReview**
      //console.log('handleOverlaps >>',overlaps)

    //}
    onChangeViewDate(toDate){ //same as loadForDate()
      let noChange = toDate == this.currentDate
      console.log('onChangeViewDate >>',JSON.parse(JSON.stringify(this.currentDate)), toDate,noChange)
      this.currentDate = toDate
      this.enableActionBtns()
      
      this.hasEventsForDate() ? this.loadEvtsForDay(noChange) : this.resetSchedule()
    }
    resetSchedule(){
      this.savedRawEvts = []
      this.actualEvts = []
      this._dailyScheduled = new Map()
      this._endTimesSet = new Set()
      this._startTimesSet = new Set()

      this.usingMoods = {}
      //buttons too? prolly!
      // No SavedEvents
      this.showReloadBtn = false //prolly for clearing when viewing diff days?!? tbd
      this.showClearBtn = false
      this.disableSaveSchedule = true
    }
    unscheduledDefaults(){ //huh could also do unscheduledByScore, unscheduledByPrio---todo***lift from scheduleBy... 
      //this.resetGoalEvts(true)
      let allG= this.getSubGoals()
      //this.allEvents.filter
      return allG.filter(evt => evt?.inDefaults && evt?.time != '' && !this.actualEvts.find(x => x.id == evt.id))
    }
    unscheduled(){
      let allG= this.getSubGoals()
      //let notScheduled = 
      return allG.filter(x => !this.actualEvts.find(item => item.id == x.id))

    }
    subGoalsOfParent(id) { //see if used lots otrwise bring inline
      let allG= this.getSubGoals()
      return allG.filter(evt => evt.parentGoal == id)
    }
    chosenScoreLabel() { 
      return this.chosenScore == null ? `By Score` : `Score >= ${this.chosenScore}` 
    }
    chosenPrioLabel() { 
      return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
    }
    onChoosenPrio(e){
      //console.log('onChoosenPrio',e,this.chosenPrio)
      let oldy = this.chosenPrio
      if (oldy && oldy == e){
        this.disablePrioBtn = true //.user should not reclick without changing it again...
      }else {
        this.chosenPrio = e
        this.disablePrioBtn = false
      }
    }
    onChoosenScore(e){
      //console.log('onChoosenScore',e)
      let oldy = this.chosenScore
      if (oldy && oldy == e){
        this.disableScoreBtn = true //user should not reclick without changing it again...
      }else {
        this.chosenScore = e
        this.disableScoreBtn = false
      }
    }
    scheduleByScore(flag){ //returns false || euhOverlaps  ::>todo= handle at call site, Actionbtns(clear,reload,...)
      //console.log('scheduleByScore', flag)
        const filterCurrent = () => {
          let toReload = []
          this.actualEvts.forEach((item) => {
            let daScore = this.parseScore(item.score)
            if (daScore > -1 && daScore >= this.chosenScore) {
              toReload.push(item)
            }//else{console.log('ERROR...parseScore?skippin',daScore, item)}
          })
          return toReload
        }
      let toRet = []
      
      if(flag == 'filter'){
        toRet = filterCurrent()
        this.resetSchedule() //prolly...
      } else {//flag == 'overwrite' || flag == 'add'
        const colis = Repo.goalsByMinScore(this.chosenScore)//deepCopy? no need
        //console.log(`scheduleByScore SCORE`, JSON.parse(JSON.stringify(colis))) //, typeof colis

        if(flag == 'add'){// filter out events that are already scheduled..not too expensive?
          toRet =  colis.filter(x => !this.actualEvts.find(item => item.id == x.id)) 
        } else{ //for overwrite, also reset schedule....
          toRet = colis
          this.resetSchedule()
            //this.scheduledEvents = []
            //this.updateCurrentSchedule()
        }
      }
      console.log(`scheduleByScore AFTER flag ${flag} from size: ${this.actualEvts.length} to some evts = ${toRet.length}`, ) // JSON.parse(JSON.stringify(toRet))
      
      //add to schedule!
      if (toRet.length < 1) {
        console.log(`Empty for Score == ${this.chosenScore} :(`)
        
        //this.disableSaveSchedule = true
        //this.showReloadBtn = false //nothing to reload...
        //this.showClearBtn = false
        //this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
        //return false
        this.toggleActionBtns(false,'ByScore')
        return {
          overlaps:null,
          canContinue:false, //for doNotify
          //flags about ?.inDefaults || !evt?.canMove ? for timeChanged() || evt.durationChanged() ?!?
        }
      }

      //toRet = this.removeNoTimes(toRet,"scheduleByScore") //todo**

      //filter && overwrite replaces
      //add concats...
      let euhOverlaps = this.addGoalsToSchedule(toRet,this.isViewingToday())//handle overlaps at call site--toReview
      let sizey = Object.keys(euhOverlaps).length

      if (sizey > 0){
        return {
          overlaps:euhOverlaps, //OR this.massageOverlaps(euhOverlaps)
          canContinue:false,
        }
      }
      
      this.toggleActionBtns((toRet.length > 0),'ByScore') //toSee disableSaveScheduleBtn diff with below... 
      
      //this.disableSaveSchedule = toRet.length < 0 
      //this.showReloadBtn = this.hasEventsForDate()
      //this.showClearBtn = true
      //return euhOverlaps //this.addGoalsToSchedule(toRet) 
      return {
        overlaps:euhOverlaps,
        canContinue:true,
      }

    }
    scheduleSamePrio(flag){ //returns false || euhOverlaps  ::>todo= handle at call site, Actionbtns(clear,reload,...)
      //console.log('scheduleSamePrio', flag,this.isViewingToday())
        
        const filterCurrent =() => { //parentGoalsMap().get(
          return this.actualEvts.filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio)
        }
      
      //let isTod = this.isViewingToday()
      let toRet = []

      if(flag == 'filter'){
        toRet = filterCurrent()
        //console.log('scheduleSamePrio..filtering!!',this.chosenPrio,toRet)
        this.resetSchedule() //prolly...
      } else { //flag == 'overwrite' || flag == 'add'
        //let allEvts = this.deepCopy(this.storedSubGoals)
        let allEvts = this.getSubGoals()
        //console.log('findSamePrio..overwriting!!',this.chosenPrio,flag) //allEvts
        //console.log(`findSamePrio for ${this.chosenPrio} with flag ${flag}..ALL`, JSON.parse(JSON.stringify(allEvts))) //, typeof colis
        for (let evt of allEvts) {
          let e = this.parentGoalById(evt.parentGoal)
          if (e?.priority == this.chosenPrio){
            toRet.push(evt)
          }//else{console.log('findSamePrio..skipping',e?.priority)}
        }
          
        if(flag == 'add'){ //just add to schedule
          //let s = this.scheduledEvents.length
          //this.scheduledEvents.push(...toRet)
          // filter out events that are already scheduled..not too expensive?
          toRet =  toRet.filter(x => !this.actualEvts.find(item => item.id == x.id))
        } else { //for overwrite, also reset schedule....
          //this.scheduledEvents = []
          //this.updateCurrentSchedule()
          this.resetSchedule()
        }
        console.log(`scheduleSamePrio...${flag} to size: ${this.actualEvts.length} some evts = ${toRet.length}`, ) // JSON.parse(JSON.stringify(toRet))
      }
      
      //this.savedRawEvts = toRet //Repo.getDataForDate(this.currentDate)
      
      //add to schedule!
      if (toRet.length < 1) {
        console.log(`Empty for Priority == ${this.chosenPrio} :(`)
        this.toggleActionBtns(false,'ByPrio')

        //this.disableSaveSchedule = true
        //this.showReloadBtn = false //nothing to reload...
        //this.showClearBtn = false

        //this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
        //return false
        return {
          overlaps:null,
          canContinue:false,//for notify
        }
      }

      //toRet = this.removeNoTimes(toRet,"scheduleSamePrio") //todo**

      //filter && overwrite replaces
      //add concats...
      let euhOverlaps = this.addGoalsToSchedule(toRet,this.isViewingToday())
      let sizey = Object.keys(euhOverlaps).length

      if (sizey > 0){
        return {
          overlaps:euhOverlaps,
          canContinue:false,
        }
      }

      this.toggleActionBtns((toRet.length > 0),'ByPrio')

      //this.disableSaveSchedule = toRet.length < 0
      //this.showReloadBtn = this.hasEventsForDate()
      //this.showClearBtn = true
      
      //return euhOverlaps //this.addGoalsToSchedule(toRet) 
      return {
        overlaps:euhOverlaps,
        canContinue:true,
      }
      
    }
    //to reorg the overlaps before sending them back...
    //ONLY after .hasOverlappingEvent() ? toSee***
    massageOverlaps(overlaps){
     
      console.log('massageOverlaps >>',overlaps)

      if (overlaps.length > 0){
      //console.log(`onAddMins::huh some OVERLAPS`,overlaps) //toTest**
        let euhOverlaps={}

        for(let i = 0; i < overlaps.length; i++){
          let toH = overlaps[i]
          if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
         
          if(i > 0){//for using fixMultiConflicts()--unlinkely to happen here...toMonitor**
            //keep in mind the obj.id is target
            
            console.log(i+" WOAH WOAH,massageOverlaps...ERROR?!? multiple overlaps with same target?",overlaps[i].target)//>could have multiple default that are overlapping yes!
            //ummm this where using inConflict is wrong as evt CAN overlap with two others....
            if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
            if (overlaps[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",overlaps[i-1].inConflict); delete euhOverlaps[overlaps[i-1].inConflict] }

            if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
              
            euhOverlaps[toH.target].unshift(overlaps[i-1]) //also add previous as makes sense..
            euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          } 
        }

        console.log("massageOverlaps:: OVERLAPS RETURNING>>",JSON.parse(JSON.stringify(euhOverlaps)),JSON.parse(JSON.stringify(overlaps)))
       return euhOverlaps
      }
    }
    scheduleOneEach(flag){//returns false || euhOverlaps  ::>todo= handle at call site, Actionbtns(clear,reload,...)
      console.log('scheduleOneEach', flag)
      //let allEvts = this.deepCopy(this.storedSubGoals)
      //let allEvts = this.getSubGoals()

      //let notScheduled = this.unscheduled() // allEvts.filter(x => !this.scheduledEvents.find(item => item.id == x.id))
      //console.log('scheduleOneEach..notScheduled!!',notScheduled)
  
        //const subGoalsOfParent =(id) => {
        //  return allEvts.filter(evt => evt.parentGoal == id)
        //}
  
        const selectOneFromP = (useRandom) => {
          //implicit that useRandom == overwrite
          //flag to check if already scheduled? or implicit above?
          let toAdd =[]
          this.parentGoalsMap().forEach((value, key, map) => {
            let subs = this.subGoalsOfParent(value.id)
            //console.log("selectOneFromP::subs of "+value.id,value.title,subs.length)
            if (subs.length > 0){
              let gottaAdd = null
              let i = subs.length
              if(useRandom) {
                gottaAdd = subs[Math.floor(Math.random() * i)] 
                //console.log("selectOneFromP::gottaAdd Random at index: "+i,subs.length, ) //gottaAdd
              }else { //add one that aint scheduled already!!
                //oldie >> subs[0] >> take first one...could be scheduled so check below...
                let tries = 0 //in case no infinite loop for one elt or something....prolly
                while (this.actualEvts.some(e => subs[i].id == e.id)) {
                  tries++
                  i = Math.floor(Math.random() * subs.length)
                  console.log(`selectOneFromP::index ${i} scheduled...new random> At try> `+tries,subs.length)
                  if (tries > 2) {console.log("selectOneFromP::random...TOO MANY TRIES..ERROR?",tries,i,subs.length, subs); break}
                }
  
                gottaAdd = subs[i] 
                console.log("selectOneFromP::NO Random at index: "+i,tries, gottaAdd)
              }
  
              toAdd.push(gottaAdd) //add check for null? >>prolly no need--toMonitor**
            }else {
              console.log(`scheduleOneEach::selectOneFromP...huh no subgoals for parentGoal`,value)
            }
          })
          
          return toAdd
        }

        const addy = () =>{
          let notScheduled = this.unscheduled()
          let toAddy = []
          this.parentGoalsMap().forEach((value, key, map) => {
            let c = notScheduled.find(item => item.parentGoal == value.id)
            if (c){
              toAddy.push(c)
            } else{
              console.log('scheduleOneEach::No goal for parent!!',key, value?.title)
              //TODO below***
              //this.useGroupNotify(`No SubGoals for Parent: '${value?.title}'`, value?.bgcolor,'bottom')//for grouping>>'NoG' //doNotify  //"warning"
            }
          })
          return toAddy
        }
        
      
      ///////////START////////////
      //let isTod = this.isViewingToday()
      let toAdd=[]
      
      if(flag == 'add'){
        //now go through each and add subG for parentG
        toAdd = addy()
        /*this.parentGoalsMap().forEach((value, key, map) => {
          let c = notScheduled.find(item => item.parentGoal == value.id)
          if (c){
            toAdd.push(c)
          } else{
            console.log('scheduleOneEach...No goal!!',value?.bgcolor)
            //TODO***
            //this.useGroupNotify(`No SubGoals for Parent: '${value?.title}'`, value?.bgcolor,'bottom')//for grouping>>'NoG' //doNotify  //"warning"
          }
        })*/

        //console.log('scheduleOneEach...TOADD!!',toAdd)
        //toAdd = this.addPropsEventsTo(this.currentDate, toAdd)  
        //toAdd = this.removeNoTimes(toAdd,"scheduleOneEach")

      } else { //overwrite!
        //this.scheduledEvents = []
        //this.updateCurrentSchedule()
        this.resetSchedule()
      
        //random...implicit that overwrite and no need to check 'notScheduled' ...

        toAdd = selectOneFromP(true) //**beware flag when false after resetSchedule()
        
        //console.log('scheduleOneEach...ADD! for> '+flag,toAdd)
        
        //toAdd = this.addPropsEventsTo(this.currentDate, toAdd)
        //toAdd = this.removeNoTimes(toAdd,"scheduleOneEach")
      }

      //add to schedule!
      if (toAdd.length < 1) {
        console.log(`Empty for OneEach :(`)
        this.toggleActionBtns(false,'oneEach')

        //this.disableSaveSchedule = true
        //this.showReloadBtn = false //nothing to reload...
        //this.showClearBtn = false
        //this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
        //return false //handled at caller?!? or return object?!?
        return {
          overlaps:null,
          canContinue:false,
          //message?
        }
      }

      let euhOverlaps = this.addGoalsToSchedule(toAdd,this.isViewingToday())

      //if(isTod){
        //let euhOverlaps = this.overlapCheckEvtsAdd(toAdd)
        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`scheduleOneEach:: Overlaps on:${this.currentDate} from ${this.unscheduled().length} to ${toAdd.length}. overlaps =${sizey}`) //notScheduled.length

          //this.massageOverlaps(euhOverlaps) //{handleOverlaps
          //this.fixyOverlaps(euhOverlaps,null,'oneEach') //scheduleOneEach
          return {
            overlaps:this.massageOverlaps(euhOverlaps), //euhOverlaps,
            canContinue:false,
          }
        }

        this.toggleActionBtns((toAdd.length > 0),'oneEach') //true //(toAdd.length < 0)
        return {
          overlaps:null,
          canContinue:true,
        }

      //} else { //no overlap check for future.
        let f = flag == 'overwrite' //false isnt better? toSee**...
        //let toReload = selectOneFromP(f) //oldie >> false

        console.log('scheduleOneEach::scheduleAs..future!!'+flag,f, euhOverlaps)//toReload)
        
        //toReload = this.addPropsEventsTo(this.currentDate, toReload)
        //toReload = removeNoTimes(toReload)

        /*
        if(f){ //overwrite....just schedule
          this.scheduledEvents = toAdd
        } else{
          let euh = this.scheduledEvents.concat(toAdd)
          this.scheduledEvents = euh
        }

        let sameStart = this.updateCurrentSchedule()
        console.log('scheduleOneEach....sameStart='+sameStart.size)
        if (sameStart.size > 0 && isTod){
          this.fixSameStart(f) //scheduleOneEach
        } */
      //}

      //todo below**
      //this.isViewingPast() ? this.allowScoreEdit(true) : this.allowScoreEdit(false)
      
      //this.toggleActionBtns((toAdd.length < 0),'oneEach')

      //this.disableSaveSchedule = toAdd.length < 0
      //this.showReloadBtn = this.hasEventsForDate()
      //this.showClearBtn = true
      
      return euhOverlaps
      return {
        overlaps:euhOverlaps,
        canContinue:true,
      }

    }
    scheduleByMood(toAdd){ //returns euhOverlaps  ::>todo*** handle at call site, Actionbtns(clear,reload,...)
      let toReload = []
  
      for(let i = 0; i < toAdd.length; i++){
        
        //this.usingMoods.push(toAdd[i]) //array.push or below?!?>>below seems better?
        
        //this.usingMoods[toAdd[i].id]=toAdd[i]?.mood //>>moved below
        //toReload.push(this.getLocalEvt(toAdd[i].id))

        let local = this.getSubGoalByID(toAdd[i].id) //this.getLocalEvt(toAdd[i].id)
        //console.log(`scheduleByMood>>>local>>`,local)
        if (local && local.time != ''){
          toReload.push(local)
          this.usingMoods[toAdd[i].id]=toAdd[i]?.mood  //umm add already here?!? hard to undo in case of overlaps smh---toTest**
        }else { 
          //console.log(`scheduleByMood>>>no time eh >>`+ local?.title) //could be error?!? toMonitor**
          //this.doNotify(`Evts '${local?.title}' has no set time for scheduling, Manually Add them.`, "warning",'top')
          
          //this.withDismissNotify(`Evt '${local?.title}' has no set time for scheduling, Manually Add it!`, "warning",'top',null,
          //function(){ //onDismiss....
          //  console.log(`scheduleByMood>>>no time eh >> `+local?.title) //could be error?!? toMonitor**
          //})

          //return something to show notify above?--todo***
        }
      }

      //console.log(`scheduleByMood>>>toReload...`, toReload)

      //toReload = this.addPropsEventsTo(this.currentDate, toReload)

      //let euhOverlaps = this.overlapCheckEvtsAdd(toReload)
      if (toReload.length < 1) {
        console.log(`Empty for Mood :(`)
        this.toggleActionBtns(false,'ByMood')
        return {
          overlaps:null,
          canContinue:false, //for notify
        }
      }

      let euhOverlaps = this.addGoalsToSchedule(toReload,this.isViewingToday())

      let sizey = Object.keys(euhOverlaps).length
      if(sizey > 0) {
        console.log(`scheduleByMood overlaps on:${this.currentDate} to ${toReload.length}. overlaps =${sizey}`) 
        
        //TODO**handle //this.fixyOverlaps(euhOverlaps,null,'byMood') //scheduleByMood
        return {
          overlaps:euhOverlaps, //OR this.massageOverlaps(euhOverlaps) ?
          canContinue:false,
        }
      }

      this.toggleActionBtns((toReload.length > 0),'ByMood')
      
      //this.disableSaveSchedule = !toReload.length > 0 //false
      //this.showReloadBtn = toReload.length > 0 && this.hasEventsForDate()
      //this.showClearBtn = !this.isViewingPast()  //incase have other evts?!?

      //return euhOverlaps
      return {
        overlaps:euhOverlaps,
        canContinue:true,  //or canContinue?
      }
    }
    scheduleDefaults(flag){ //returns euhOverlaps  ::>todo*** handle at call site, Actionbtns(clear,reload,...)

      
      //this.deepCopy(this.store.fetchDefaults()) //resets reference >>does!
      //let dEvts = this.unscheduledDefaults()
      //console.log('unscheduledDefaults', flag,dEvts,Repo.getDefaultEvts()) //e?.length
      
      //let isTod = this.isViewingToday()
  
      let dEvts = null 

      if(flag == 'add'){
        dEvts = this.unscheduledDefaults()
      }else{
        this.resetSchedule()
        dEvts = this.unscheduledDefaults() //this.getSubGoals()
      }

      //console.log('unscheduledDefaults',this.hasEventsForDate(),dEvts.length)

      //do removeNoTimes()****
      this.showReloadBtn = this.hasEventsForDate()
      this.showClearBtn = !this.isViewingPast() && dEvts.length > 0
      
      let euhOverlaps = this.addGoalsToSchedule(dEvts,this.isViewingToday())
      let sizey = Object.keys(euhOverlaps).length
      if(sizey > 0) {
        console.log(`scheduleDefaults:: Overlaps on:${this.currentDate} for ${dEvts.length}...overlaps =${sizey}`) 
          
        //this.fixyOverlaps(euhOverlaps,null,'oneEach') //scheduleDefaults
        //TODO**
        //return euhOverlaps
        return {
          overlaps:euhOverlaps, //Or this.massageOverlaps(euhOverlaps)
          canContinue:false,
          //flags about ?.inDefaults || !evt?.canMove ? for timeChanged() || evt.durationChanged() ?!?
        }
      }

      this.toggleActionBtns((dEvts.length > 0),'defaults') //sa
      //this.disableSaveSchedule = !(dEvts.length > 0) //false

      return {
        overlaps:null,
        canContinue:true,
        //flags about ?.inDefaults || !evt?.canMove ? for timeChanged() || evt.durationChanged() ?!?
      }

      ////inPast ? this.allowScoreEdit(true) : this.allowScoreEdit(false)
      
      // this.showDefaultBtn(inPast)

      //this.disableSaveSchedule = dEvts.length < 0
      //this.showReloadBtn = this.hasEventsForDate
      //this.showClearBtn = true

      
      /*redundant oldie
      if(isTod){ //Overlap check for today only...
  
        let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
    
        if(flag == 'add'){  //here should use the e var instead --todo**
          let orig = toReload.length
          toReload = toReload.filter(x => x?.inDefaults && !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled no need for >> x?.time != '' as done below 
          console.log(`scheduleDefaults..ADDIN from ${orig} to ${toReload.length}`) //toReload
        } else { //overwrite flag to reset first!
          this.scheduledEvents = []
          this.updateCurrentSchedule()
        }
  
        //toReload = this.removeNoTimes(toReload,"scheduleDefaults")
  
        console.log(`scheduleDefaults:${this.currentDate} with '${flag}'`,toReload.length,this.scheduledEvents.length) //JSON.parse(JSON.stringify(toReload))
        
        let euhOverlaps = this.overlapCheckEvtsAdd(toReload) //no need for date prolly  //this.currentDate
  
        let sizey = Object.keys(euhOverlaps).length
        if(sizey > 0) {
          console.log(`scheduleDefaults overlaps on:${this.currentDate} from ${dEvts.length} to ${toReload.length}. overlaps =${sizey}`),  
          
          this.fixyOverlaps(euhOverlaps,null,'byDefaults') //scheduleDefaults
        }
  
        //let m = 
        this.evtStartedOrPassed(parseDate(new Date())) //does return too fast...
  
        //console.log(`scheduleDefaults:Today scheduling DONE with overlaps:`+sizey,m)
        this.showDefaultBtn(inPast) 
        this.disableSaveSchedule = !(toReload.length > 0) //false
        
        return
        
      } else { //No Overlap check for past/future
          let toReload = this.addPropsEventsTo(this.currentDate, dEvts)
  
          toReload = this.removeNoTimes(toReload,"scheduleDefaults")
  
          if(flag == 'add'){//still check for add flag in future...also should use the e var instead --todo**
            let orig = toReload.length
            toReload = toReload.filter(x => !this.scheduledEvents.find(item => item.id == x.id)) //filter out already scheduled
            console.log(`scheduleDefaults..ADDIN to ${this.currentDate} of ${this.scheduledEvents.length} from ${orig} to `,toReload.length)
            let f = this.scheduledEvents.concat(toReload)
            this.scheduledEvents = f
          }else{
            this.scheduledEvents = toReload
          }
        
        let sameStart = this.updateCurrentSchedule()
        if (sameStart.size > 0){
          console.log('scheduleDefaults..sameStart='+sameStart.size)
          //this.fixSameStart(sameStart) //could solve conflicts but should let them be fixed on reload...weird but makes sense in case schedule not saved anyway!
        }
  
        inPast ? this.allowScoreEdit(true) : this.allowScoreEdit(false)
      }
      
  
      this.showDefaultBtn(inPast)
      
      */
  
      this.disableSaveSchedule = !(dEvts.length > 0) //false
      //this.reset() //nah in case have other settings like onScore/Prio.
  
    }
    schedEvtWithProps(evt,startAt,EndAt){
      if (!evt.getPGoal()) {console.log(`schedEvtWithProps:: ERROR no parentGoal`,evt.data);return}

      let raw = evt.data()  //OR use this.getGoal() for title and inDefaults, etc.,..
      let goal = evt.getGoal()
      let pGoal = evt.getPGoal()

      let ret = {...goal}

      if (evt.timeChanged() || evt.durationChanged()){
        console.log(`schedEvtWithProps:: ${ret.title} CHANGED...`,evt.timeChanged() +" time: "+goal.time +'>>' +raw.time, evt.durationChanged() +" dura: "+goal.duration +'>>' +raw.duration)//,goal,ret,raw)
        
        //maybe save evt(or evt.id) for later for drop to askUser? toSee**
        ret.time = raw.time
        ret.duration = raw.duration
        //let cloneUser = JSON.parse(JSON.stringify(evt)); // does not work with functions, symbols, or undefined value
      }
      evt.setDate(this.currentDate) //bof no need?...

      let hasMoods = evt.getMoods()
      if (hasMoods){//!==
        //console.log(`schedEvtWithProps::MOODS`,hasMoods)
        this.usingMoods[ret.id] = hasMoods
      }

      ret.date = this.currentDate

      ret.bgcolor = pGoal.bgcolor
      //ret.for = evt.duration, //redundant...
      ret.start = startAt
      ret.end = EndAt

      if (ret.jeSuis){
        ret.details = `Of '${pGoal.title.trim()}' :: << ${ret.jeSuis.join(',')} >>`
      }else {
        ret.details = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(ret?.time)} -> ${ret?.duration}min -- ${ret?.inDefaults ? 'Dft:':':'}${ret?.canMove ? ':Mv:':':'}${ret?.isAlternative ? ':Alt':':'}`
      }

      if (evt.hasNote()){
         //console.log(`schedEvtWithProps:: HASNOTES`,raw.notes)
         ret.notes=raw.notes
         //also atScore?
      }

      //console.log("schedEvtWithProps..returnin...",JSON.parse(JSON.stringify(ret)))//,clone.datey(),clone.date(),clone.title,clone.details)
      return ret

      /*return {...evt,
          date: this.currentDate,
         
          for: evt.duration,
          start: startAt,
          end: EndAt,
          score: evt.score//,
          //date:this.currentDate  //just to add date!!toReview**
        }

      Object.assign({}, {...sav}) //{...sav,date:aDate}, data())
      


      console.log("schedEvtWithProps",JSON.parse(JSON.stringify(clone)),clone.datey(),clone.date(),clone.title,clone.details)
      return clone
    */

    }
    saveNewGoal(timeStart,goalTitle, parentGoal, own, duration){
     // let timeStart = parseTimestamp(timeRange[0])
      //let tosee = parsed(this.possibleRange[0])
      //let timeEnd = interval > 15 ? addToDate(timeStart, { minute: parseInt(interval)}) : addToDate(parseTimestamp(timeRange[1]), { minute: 15}) 
      
      //oldie >> 15 mins for when single timeslot selection

      //below redundant when set the interval...smh
      //let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

      console.log(`saveNewGoal:${goalTitle} :${own}: from ${timeStart.time}.Duration:${duration}`)
      
      //let subID = null 
      if(own == "self"){ //add it as self >> create parent goal with this as subgoal
        let pId = Repo.addParentGoal(goalTitle, goalTitle, "purple-10", 2) //default color and priority
        if (pId) {
          //console.log("SELF parent Goal created",pId)this.store.
          return Repo.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) //canMove and notInDefaults. isAlternative when duration<30
        } else {
          console.log("ERROR? no pID", pId)//return? or just add it? could be for first first parentGoal---toTest**
        }
      } else { //just add it to Misc parentGoal(that have all one-off kind of stuff)
        if (parentGoal){//add it to parentGoal
          console.log("with parentGoal "+parentGoal.id,parentGoal?.title)
          return Repo.addSubGoal(parentGoal.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30) 
          //!canMove and notInDefaults. isAlternative when duration<30
  
        } else { //any Misc parentGoal available?this.store.
          let pMisc = Repo.getMiscGoal() //==getGoalByTitle("Misc")
          if(!pMisc){
            let iD = Repo.addParentGoal("Misc", "Miscellaneous", "grey-10", 2)
            if (iD) {
              console.log("NEW Misc pGoal created",iD)
              return Repo.addSubGoal(iD,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) 
              //canMove and notInDefaults.isAlternative when duration<30
            }
          } else {
            console.log("Woo!! Misc pGoal already exists!", pMisc.id) //
            return Repo.addSubGoal(pMisc.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30)
            //!canMove and notInDefaults.isAlternative when duration<30
          }
        }
      }

      return null //subID
    }
    onPickEvent(addE,timey,doForce,useBalance){

      let end = addToDate(timey, { minute: addE.duration})
      
      let anyOverlap = this.hasOverlappingEvent(addE.id, timey, end)
        //let sizey = anyOverlap.length
        //overlapSizey = anyOverlap.length
      
      //should prolly just call this.addGoalsToSchedule()....toReview***
      //YUP!
        if(anyOverlap.length > 0) {
          
          console.log(`onPickEvent::overlaps!!!`,JSON.parse(JSON.stringify(anyOverlap)))
          //let i = 0
          //do {
              //this.recurChangeTime(anyOverlap[i].inConflict,addy, this.targetDrop.timestamp,doForce, true) //anyOverlap[i].direction=='haut', 
          //} while (++i < sizey)

          /*let euhOverlaps={}

          for(let i = 0; i < anyOverlap.length; i++){
            let toH = anyOverlap[i]
            if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
            // >>shouldnt have more than one?!? toTest or see below**
            if(i > 0){//for using fixMultiConflicts()
              //keep in mind the obj.id is target
              
              console.log(i+" WOAH WOAH,onPickEvent.. multiple overlaps with same target?",anyOverlap[i].target)//>could have multiple default that are overlapping yes!
              //ummm this where using inConflict is wrong as evt CAN overlap with two others....
              if (toH.inConflict in euhOverlaps){ console.log("WOAH deleting inConflict",toH.inConflict); delete euhOverlaps[toH.inConflict] }
              if (anyOverlap[i-1].inConflict in euhOverlaps){ console.log("WOAH deleting PREV inConflict",anyOverlap[i-1].inConflict); delete euhOverlaps[anyOverlap[i-1].inConflict] }

              if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
                
              euhOverlaps[toH.target].unshift(anyOverlap[i-1]) //also add previous as makes sense..
              euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
            } 
          }
          
          console.log(`onPickEvent::OVERLAPS of size: ${anyOverlap.length} and force:${doForce}`,JSON.parse(JSON.stringify(euhOverlaps))) 
          
          //this.fixyOverlaps(euhOverlaps,null,"onPickEvt") //onPickEvt
          */
          return {
            overlaps: this.massageOverlaps(anyOverlap),//euhOverlaps,
            canContinue:false,  //or proper rename >> canContinue(with action like drop or pick?)
          }
          
        } else {
          //console.log("onPickEvent NO overlaps...to targetDrop!!>force", doForce,"useBalance:"+useBalance,JSON.parse(JSON.stringify(addE)))

          //only balance without overlaps for now--
          if (useBalance){
            let balance = this.getCurrentBalance() //currentBalance //balance should be negative...methink
            let neB = balance + parseInt(addE?.duration) 

            console.log("onPickEvent...useBalance",balance,neB)
            //this.doNotify("oooh What is Owed PAID!gg! >>"+neB,"positive",'center')
            //this.store.setBalance(neB)  
            Repo.storeNewBalance(neB)
          }

          //this.changeEvtTime(addE.id, timey, doForce, true) //onPickEvent

          let anyO = this.addGoalsToSchedule([{...addE,time:timey.time}],false)
          
          //this.toggleActionBtns(true,'onPickEvt')
          this.isViewingPast() ? this.saveDaySchedule() : this.toggleActionBtns(true,'onPickEvt')

          return {
            overlaps:anyO, //should be empty ////null,
            canContinue:true,  //or proper rename >> canContinue(with action like drop or pick?)
          }
        }
    }
    onAdHocEvent(evtID){
      let newey =  this.getSubGoalByID(evtID)
      if (!newey){
        return {
          overlaps:null,
          canContinue:false,
          //errorMessage? toSee***
        }
      }

      let euhOverlaps = this.addGoalsToSchedule([newey],true)
      let sizey = Object.keys(euhOverlaps).length
      if(sizey > 0) {
        console.log(`onAdHocEvent overlaps on:${this.currentDate}. overlaps =${sizey}`,euhOverlaps) 
          
          //TODO** see if no need to redo object for multiConflicts above with 'withID' flag
          //this.fixyOverlaps(euhOverlaps,null,'byMood') //onAddHocEvent
        return {
          overlaps:euhOverlaps, //OR this.massageOverlaps(euhOverlaps)? ...prolly not here!! toReview
          canContinue:false,
          //errorMessage?
        }
      }

      this.isViewingPast() ? this.saveDaySchedule() : this.toggleActionBtns(true,'onAdHoc')

      return {
        overlaps:null,
        canContinue:true,
      }

    }
    hasOverlappingEvent(evID, targetStart, targetEnd) {
      const mappyA = []
      
      //let tStartAt = targetTimestamp
      //let tEndsAt = addToDate(tStartAt, { minute: duration})
  
      //console.log(`hasOverlappingEvent for ${evID} at ${targetTimestamp.time} for ${duration}`, tStartAt, tEndsAt)
  
      this._dailyScheduled.forEach((value, key, map) => {
        if (key == evID){//skip self!
          //console.log(`${evID} skippin self ${key}`,value)
        } else{
          let oDirection = this.checkOverlapByTime(targetStart,targetEnd,value.start,value.end) //`${evID}->${key}`
          if (oDirection){
            //console.log(`OverlappingConflict ${evID} en "${oDirection}" of evt:${key} at`,value.start.time)//tStartAt value
            // duration, tStartAt, tEndsAt, value.start, value.end
  
            mappyA.push({ 
              target:evID,
              targetStart:targetStart,
              direction:oDirection,
              inConflict:key 
            })
          }
        }
      })
  
      return mappyA
    }
    checkOverlapByTime(tStart, tEnd, eStart, eEnd){ //id for debug--should remove
      //custom to also return more info whether overlapping left(haut?), right(bas?), totalO(surrounding)
      //also uses getTimeIdentifier lib function via this.getTimeyNumber(timey) above
      
      let targetStart = this.getTimeyNumber(tStart)
      let targetEnd = this.getTimeyNumber(tEnd)
  
      let evtStart = this.getTimeyNumber(eStart)
      let evtEnd = this.getTimeyNumber(eEnd)
  
      //console.log("checkOverlapByTime ORIG>>",tStart, tEnd, eStart, eEnd)
      //console.log("checkOverlapByTime THEN>>"+id,targetStart,targetEnd,evtStart,evtEnd) // >> 805 830 500 535
      
      if (targetStart === false || evtStart === false || targetEnd === false || evtEnd === false) {
        console.log("ERROR... checkOverlapByTime error",targetStart,targetEnd,evtStart,evtEnd)
        return false
      }//else {console.log("evtIsOverlappingTimes",targetStart,targetEnd,evtStart,evtEnd)}
  
      //so adding the '=' equal sign, also finds evts next to each other(without space in between) and that's a conflict--want some breather?!?
      //prolly better to have evts NEXT to each other!
      let dir = false
      if(targetStart > evtStart && targetStart < evtEnd){// overlap left...beware of '=' removal >>evts are next to each other!
        //return 'bas'  //so target is EARLIER than scheduled evt...prolly?
        dir = 'bas'
      } 
      if (targetEnd > evtStart && targetEnd < evtEnd){ // overlap right ...>> effects of removing '=' as above (evts can be next to each other!!)
        //return 'haut'  //so target is LATER than scheduled evt...prolly?
        dir = 'haut'
      }
      if((evtStart >= targetStart && targetEnd >= evtEnd) || (targetStart >= evtStart && targetEnd <= evtEnd)){ //have to also check opposite!!!
        //return 'surrounding'  //prolly? 
        dir = 'surrounding'
      }
      
      return dir //false
    }
    doProppy(evtGoal,onDate){
      let pGoal = this.parentGoalById(evtGoal.parentGoal)
      if (!pGoal) {console.log(`doProppy:: ERROR no Pgoal found ?!?`, evtGoal); return}
      
      let startTime = addToDate(parsed(onDate), { minute: parseTime(evtGoal.time) }) 
      let endTime = addToDate(startTime, { minute: evtGoal.duration })

      let clone = Object.assign({}, {...evtGoal,
        date:onDate,
        bgcolor: pGoal.bgcolor,
        start:startTime,
        end:endTime
      }) //{...sav,date:aDate}, data())
      
      if (evtGoal.jeSuis){
        clone.details = `Of '${pGoal.title.trim()}' :: << ${evtGoal.jeSuis.join(',')} >>`
      } else {
        clone.details = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(evtGoal?.time)} -> ${evtGoal?.duration}min -- ${evtGoal?.inDefaults ? 'Dft:':':'}${evtGoal?.canMove ? ':Mv:':':'}${evtGoal?.isAlternative ? ':Alt':':'}`
      }
      clone.sortTime = startTime  //still needed?!?
      
      return clone
    }
    //for generic add when it's reload by score/prio/defaults...
    //adHocEvt,pickEvt
    addGoalsToSchedule(toAdd,checkOverlap){
      //let checkOverlap = this.isViewingToday()
      let euhOverlaps = {}

      toAdd.forEach((obj) => {
        //console.log(`addGoalToSchedule...obj`,obj)
        let startTime = addToDate(parsed(this.currentDate), { minute: parseTime(obj.time) }) 
        let endTime = addToDate(startTime, { minute: obj.duration })
        
        if (checkOverlap){
          let oOth = this.hasOverlappingEvent(obj.id, startTime, endTime) //before add evt
          if(oOth.length > 0){
            euhOverlaps[obj.id] = oOth
            console.log(`addGoalToSchedule...OVERLAP`,obj.id,oOth)
          }else{
            let c = this.doProppy(obj,this.currentDate)

            this.actualEvts.push(c) //clone
            this._dailyScheduled.set(c.id, {...c,
              for: c.duration,
              start: startTime,
              end: endTime,
              score: c.score
            })
            this._endTimesSet.add(endTime.time)
            this._startTimesSet.add(startTime.time)
          }
        } else { //just add!
          let c = this.doProppy(obj,this.currentDate)
          this.actualEvts.push(c) //clone
          this._dailyScheduled.set(c.id, {...c,
            for: c.duration,
            start: startTime,
            end: endTime,
            score: c.score
            })
          this._endTimesSet.add(endTime.time)
          this._startTimesSet.add(startTime.time)
        }
      })

      return euhOverlaps
    }
    canDropEvent(targetDrop, draggedItem){ //from string needed?!? toSee**
      
      let tEndsAt = addToDate(targetDrop, { minute: draggedItem.duration})
      
      let anyOverlap =  this.hasOverlappingEvent(draggedItem.id, targetDrop,tEndsAt)

      if (anyOverlap.length > 0){
        console.log("dropEvent...OVERLAP handlin::size="+anyOverlap.length, anyOverlap)//[i].direction) //anyOverlap[i], //object
        
        //return anyOverlap 
        return {
          overlaps:anyOverlap, //umm this can bork as it's an array!!
          canContinue:false,
        }
      } else {
        //so no overlapp, just change dragged event time--ask User
        console.log(`dropEvent with No overlap (${draggedItem.id}) to ${targetDrop.time}`)  //w
        //this.changeEvtTime(draggedItem.id, targetDrop, false) //onDrop
        //return true

        this.toggleActionBtns(true,'canDropEvent')

        return {
          overlaps:null,
          canContinue:true
        }
      }

    }
    toggleActionBtns(evtNumAdded,from){ //for toggle after default/oneEach, pick/adhoc,score/prio scheduling...(reload & clear)?
      //'from' flag can be switched for some btns that shouldnt change...toSee

      this.disableSaveSchedule = !evtNumAdded //false
      this.showReloadBtn = this.hasEventsForDate()
      this.showClearBtn = !this.isViewingPast() && evtNumAdded //true  //evtNumAdded == dEvts.length > 0
      
    }
    enableActionBtns(){
      let inPast = this.isViewingPast()
      
      this.showOneEachBtn = inPast ? false : true
      this.showLoadDefaults = inPast ? false : true
      this.showScoreBtn = inPast ? false : true
      this.showPrioBtn = inPast ? false : true
      
    }

    tooClose(timey, duration){ //too close to other evt--within 10min OR near end of day and could go into next...

      let compareTime = addToDate(timey,{ minute: 0})
      let tTime = this.getTimeNumber(compareTime)
      
      //could add duration to get endTime prolly...if needed.
      //let midnight = new Date() //issue when in future as would use current day's
      //let midnighty =new Date(timey.date) //meh midnight of day..not helpful
      let e = addToDate(timey, { day: 1}) //this proper to use next day's
      let midnightiey = new Date(e.date)
      //midnight.setDate() //? >>nah
      //midnight.setHours( 24 )
      //midnight.setMinutes( 0 )
      //midnight.setSeconds( 0 )
      //midnight.setMilliseconds( 0 )
  
      //midnighty.setHours( 24 )
      //midnighty.setMinutes( 0 )
      //midnighty.setSeconds( 0 )
      //midnighty.setMilliseconds( 0 )
  
      midnightiey.setHours( 24 )
      midnightiey.setMinutes( 0 )
      midnightiey.setSeconds( 0 )
      midnightiey.setMilliseconds( 0 )
      
      let middy = parseDate(midnightiey)
      
      let isClose = Math.floor((diffTimestamp(compareTime,middy)/1000)/60)  //minutes till midnight
      
      if (isClose < duration) {//so when isClose < duration, then would bleed into next day!!--Dont allow!!!
        console.log("tooClose to midnight eh...:(",isClose) // e, midnightiey
        return true 
      }
       //diffTimestamp(now,endTime) //endTimes < now would be that evt hasnt ended! 
      let toRet = false
  
      //check scheduled higher than timey BUT very close..
      this._dailyScheduled.forEach((value, key, map)=> {
        let eStart = this.getTimeNumber(value.start)
        //let eEnd = this.getTimeNumber(value.end) //no need 
        //let hasEnded = tTime >= eEnd
        let diff = eStart - tTime
        let another = diffTimestamp(compareTime,value.start) //,true flag to discard earlier evts!!! //using timey is same!
        let bo = Math.floor((another/1000)/60)
  
        if (bo <= 10 && diff > 0){ //have to use duration to discard those in past? >>nah could just check negative!!
          //console.log("tooClose...:("+key,diff,another,bo)
          toRet = key  //meh overwrites but oh well!
        }
      })
  
      return toRet
    }
    changeEvtTime(draggedItem, targetDrop,choice){
      //console.log("changeEvtTime: "+choice,targetDrop,draggedItem)
      if (choice == 'ok'){
        //this.store.saveSubProp(evtID, timey, score)  
        Repo.doSaveEvtProp(draggedItem.id, targetDrop.time, null)
      }
      //here doing temp.Move/add just changes the time..
      this.doUpdateSchedule(draggedItem,targetDrop)
      
      return choice
    }
    addEventInSchedule(evt,checkOverlap) {
      //let euhOverlaps = null

      if (! this._dailyScheduled.has(evt.id)){
          
        //let c = createEvent(evt.id, evt) //const e = createEvent(evt.id, evt);
        //console.log(`dSchedule::addEventInSchedule--created`,c) 
          
        //toTest and use it below**
        //...can invoke withProps() later? like outside? toTest**
          
          //c.setBirthday(LocalDate.parse("1961-03-31"));
          //const hasNote = c.hasNote(); //works?!?
        
        //use this.currentDate instead of >> evt.date  
        let startTime = addToDate(parsed(this.currentDate), { minute: parseTime(evt.time) }) 
        let endTime = addToDate(startTime, { minute: evt.duration })
        
          
        if (checkOverlap) {
          //let startTime = addToDate(parsed(evt.date), { minute: parseTime(evt.time) })
          //toReview***
          //as should prolly just check this._startTimesSet && this._endTimesSet 
          //instead of walking though array 
          let oOth = this.hasOverlappingEvent(evt.id, startTime, endTime) //before add evt
          if(oOth.length > 0){
            console.log(`dSchedule::addEventInSchedule--OVERLAP of `+oOth.length,oOth)
            //skip handling for now!--toDO*** as in overlapCheckEvtsAdd()**
            //add to euhOverlaps OR return them to be handled in caller? 
            //>>meh prolly better here as could be multiple? BUT adding single though...TBD
            //euhOverlaps = oOth
            return oOth //return here?!? toSee**
          } //else {
            //should invoke withProps() here if possible?...

            //console.log(`dSchedule::addEventInSchedule--GOOD no OVERLAP`,startTime,endTime) 
            
            /*this._dailyScheduled.set(evt.id, {...evt,
              on: evt.date,
              //originalAt: evt.time, //keep original...needed still? >prolly not..toRemove**
              for: evt.duration,
              start: startTime,
              end: endTime,
              score: evt.score
            })
            //this.endTimesSet.add(endTime.time)
            //this.startTimesSet.add(startTime.time)
          
            this._endTimesSet.add(endTime.time)
            this._startTimesSet.add(startTime.time)*/
          //}
          
        } //else {

        let eProp = this.schedEvtWithProps(evt,startTime,endTime) //event.bgcolor, .time , .duration
        //events[ 0 ].side = 'full'
        //eProp.side = 'full' //just to see if shows in template? >>nope!

        eProp.sortTime = startTime //addToDate(parsed(eProp.date), { minute: parseTime(eProp.time) }) 

        //let f = evt.addPropsEventsTo(this.currentDate)
        //console.log(`dSchedule::addEventInSchedule-`,evt,evt.date(),eProp)
        this.actualEvts.push(eProp)
        this._dailyScheduled.set(eProp.id, {...eProp,
          for: eProp.duration,
          start: startTime,
          end: endTime,
          score: eProp.score
        })
        //,
        /*this._dailyScheduled.set(evt.id, {...evt,
            //on: this.currentDate, //evt.date, //redundant prolly..toRemove**
            //originalAt: evt.time, //keep original...needed still? >prolly not..toRemove**
            for: evt.duration,
            start: startTime,
            end: endTime,
            score: evt.score//,
            //date:this.currentDate  //just to add date!!toReview**
          })
          //this.endTimesSet.add(endTime.time)
          //this.startTimesSet.add(startTime.time)
        */
          this._endTimesSet.add(endTime.time)
          this._startTimesSet.add(startTime.time)
        //}
      } else {
        console.log(`dSchedule::addEventInSchedule--NOT created>>HAS already!!?`,checkOverlap,evt) 
        return false //checked at caller
      }
      
      return this.findEvent(evt.id)  //OR euhOverlaps? --TODO**
    }
    doUpdateSchedule(draggedItem,targetDrop){
      let s = this.findEvent(draggedItem.id)
      let d = this.findSchedEvent(draggedItem.id) //from  this.actualEvts

      if (!s || !d){
        console.log("doUpdateSchedule-ERROR NOT found",s,d)
        return
      }
      //console.log(`::doUpdateSchedule-`,JSON.parse(JSON.stringify(draggedItem)),JSON.parse(JSON.stringify(s)),JSON.parse(JSON.stringify(d)))
      
      let newStart = addToDate(parsed(d.date), { minute: parseTime(targetDrop.time) })
      let endTime = addToDate(newStart, { minute: d.duration }) //use d or woulda changed?!? toSee**

      let hadEnd = this._endTimesSet.delete(s.end.time)//(oldEnd.time)
      if (hadEnd){
          //console.log(`endTimesSet rem/add for ${evID} :: ${oldEnd.time} to ${newEndy.time}`)
          this._endTimesSet.add(endTime.time) 
      }else{console.log("doUpdateSchedule-endTimesSet NOT FOUND?!?")} //this could happen? ToTest

      let hadStart = this._startTimesSet.delete(s.start.time)//(oldStart.time)
      if (hadStart){
          this._startTimesSet.add(newStart.time) //targetDrop.time) 
      } else {
        console.log("doUpdateSchedule-startTimesSet NOT FOUND?!?",draggedItem.id, targetDrop)
        //this could happen? yes....
      }

      this._dailyScheduled.set(draggedItem.id, {...s,
        for: s.duration,
        start: newStart,
        end: endTime,
        //score: eProp.score
      })

      d.time = targetDrop.time  //works?!? >>yup 
      //and seems details below not needed?!?
      //d.details = `Of '${prtGoal.title.trim()}' :: ${this.whenFrmtTime(evt?.time)} -> ${evt?.duration}min -- ${evt?.inDefaults ? 'Dft:':':'}${evt?.canMove ? ':Mv:':':'}${evt?.isAlternative ? ':Alt':':'}`
      // d.sortTime = addToDate(parsed(evt.date), { minute: parseTime(evt.time) }) 
      
    }
    saveDaySchedule(){
      
      let toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
    
      if (this._dailyScheduled.size < 1){ //clearing day
        toSave = null 
      } else {
        this._dailyScheduled.forEach( (value, key, map) => {
          toSave[key] = {  //minimalistic
            //id: key,
            //date: value.on, //redundant
            time: value.start.time,
            duration: value.duration, //.for,
            //originalAt: value.originalAt,
            //atScore: value.score  //redundant
          }
          //for isViewingPast..?>>bof

          //this.usingMoods[toAdd[i].id]=toAdd[i]?.mood  //umm add already here?!? hard to undo in case of overlaps smh---toTest**
  
          if(this.usingMoods[key]){
            toSave[key].byMood = this.usingMoods[key]
          }
          if(value.notes !== void 0 && value?.notes !==''){
            console.log("saveDaySchedule",key, value?.notes, value?.score) //toSave[key].atScore,
            toSave[key].atScore = value?.score  // toSave[key].atScore || value?.score ?!?
            toSave[key].notes = value?.notes
            ////umm overwrite old atScore..prolly? tbd**
          }
        })
      }
  
       //console.log("doSaveSchedule", JSON.parse(JSON.stringify(toSave)))
       //this.store.saveDailySchedule(this.currentDate, toSave)
       Repo.saveDailySchedule(this.currentDate, toSave) 
       
       this.disableSaveSchedule = true 
       this.showReloadBtn = false
       this.showClearBtn = toSave != null //to clear...maybe...

    }
    endEvtNow(evtID){
      let evt =  this.findSchedEvent(evtID) //this.getSubGoalByID(evtID)
      console.log('endEvtNow...TODO',evtID,evt)

      //todo*** >> dayview.onEndNow()

    }
    addMinsToEvt(id,mins){
      let evt =  this.findEvent(id)

      console.log('addMinsToEvt...TODO',id,mins,evt)

      //todo*** >> dayview.onAddMins()
      
    }
    removeScheduledEvt(evt,rMood=false){  //rMood flag to also delete any this.usingMoods
      //console.log('removeScheduledEvt..',evt)

      let currentSize = this.getAllEvts().length //this.actualEvts.length
    
      if (!evt){console.log("ERROR doRemove, NO evt to delete?!?", evt);return}

      let i = 0
      //let found = false 
      for( i; i < currentSize; i++){
        if (this.actualEvts[i].id == evt.id) {
          this.actualEvts.splice(i, 1)
          //console.log("REMOVED event spliced!", evt) //to see if has start/end. and not have to get/erase below...
          
          let toDel = null
          if(this._dailyScheduled.has(evt.id)){
            toDel = this._dailyScheduled.get(evt.id)
            this._dailyScheduled.delete(evt.id)
          }else{console.log("removeScheduledEvt ::> dailyScheduled has no such evt?@? ERROR", evt)}

          if(toDel){ //also update scheduleSets
            let hadStart = this._startTimesSet.delete(toDel.start.time)
            let hadEnd = this._endTimesSet.delete(toDel.end.time)
            if (!hadStart || !hadEnd){
              console.log(`removeScheduledEvt ::> ERROR? scheduleSets has no such evt?@? start:${hadStart}...end:${hadEnd}`, toDel, evt.id + ' '+ evt?.title.trim()+' '+ evt?.details )
            }

            if (rMood){
              console.log(`removeScheduledEvt::Mood Remove...`,this.usingMoods[evt.id])
              delete this.usingMoods[evt.id]
            }
          }
          //found = true //just test
          break
        }
      }
    }
    addToBalance(evt){ //add to minus balance the duration of evt
      let balance = this.getCurrentBalance
      let neB = balance - parseInt(evt?.duration) //gotta minus...
      
      Repo.storeNewBalance(neB)
    }
    parseScore(t){ //should put in utilFunc...todo**
      const tokens = t.split(/on/) 
      if (tokens.length != 2) {//should be at most two variables....
        //console.log(`parseScore error? >>${t}`, tokens)  
        return -89 //guardrails to distinguish with potensh error below*** could still fail with 'one' though smh..toReview***
      }
      //console.log(`parseScore for ${t}`, tokens)
      return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!
    }
    getTimeyNumber(timey) { 
      if (timey !== null) {
        return getTimeIdentifier(timey)
      }
      return false
    }
      //numeric date and time identifier for timestamp comparison
    getTimeNumber(timey) {
      if (timey !== null) {
        return getDayTimeIdentifier(timey)
      }
      return false
    }
}
