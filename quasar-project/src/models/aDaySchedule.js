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

import { whenFrmtTime,parseScore, pGColors} from '../pages/util/utiFunc'
export default class daySchedule {
    /*
    data //= null //really doesnt like declared inner variables smh

    */

    constructor(onDate,isMobile) 
    {

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

      this._dailyScheduled = new Map()  
      this._endTimesSet = new Set()
      this._startTimesSet = new Set()
  
      this.savedRawEvts = []


      this.usingMoods = {} //:ref({}),  //ref(null)

      this.isDisabledScoreEdit= {}  //should prolly rename to concise...
      this.hasStarted= {}//:ref({}),  //just for happening now..should combine with isDisabledScoreEdit var above!
      this.mobileEnableScore= {}//:ref({}), //reverse of isDisabledScoreEdit...mobile and should be dynamically set when touch-repeat....
      this.showMobileDialog= {}//:ref({}), //allowDialog // for showing mobile dialog still

      this.currentDate = onDate

      this.mobile = isMobile
            
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
      return this._dailyScheduled
    }
    showEvtNoteScoreMobile(id){
      return this.mobileEnableScore[id] && this.showMobileDialog[id]
    }
    toggleEvtNoteScoreMobile(id){ 
      //console.log('toggleEvtNoteScoreMobile >>',id)

      if(this.isViewingPast() || this.isViewingToday()){ //isViewingToday
        this.showMobileDialog[id] = true 
        //umm prolly no need for id...could just be global flag? >>nah other past would also show!!
      } 
    }
    euhHidin(id){ //to just toggle as above...should merge after test**
      //console.log('euhHidin >>',id)
      this.showMobileDialog[id] = false
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
      let all = this.getSubGoals()
      //console.log('getSubGoalByID >>All',typeof(id),id,all)
      let numId = parseInt(id)//OH freaking type check!!smh--id should always be a number!!
      
      for(let i = 0; i< all.length;i++){
        if (all[i].id === numId) return all[i]  
      }
      return null
    }
    getOriginalEvtTime(id){ //to get original scheduled evt time!
      let evt = this.getSubGoalByID(id)
      return !evt ? "" : evt.time
    }
    getStoredRawEvt(id){
      if (id in this.savedRawEvts){
        return this.savedRawEvts[id]
      }
      return null
    }
    getAltEvts(){
      return Repo.storedAlternatives()
    }
    getEventsForDate(dt){ //smh just for alts!!
      return Repo.getDataForDate(dt)
    }
    updateDaySchedule(dt,toSave){//also just for alts smh
      Repo.saveDailySchedule(dt, toSave)
    }
    parentGoalsMap(){
      return Repo.parentGoalsMap()  //deepCopy?
    }
    parentGoalById(id){
      return this.parentGoalsMap().has(id) ? this.parentGoalsMap().get(id) : null
    }
  
    findSchedEvent(id) {
      return this._dailyScheduled.has(id) ? this._dailyScheduled.get(id) : null
      //return this._dailyScheduled.get(id);
    }

    hasEventsForDate() {
      return Repo.hasEventsForDate(this.currentDate)
    }
    scheduledEventsMap(){  // convert the events into an object keyed by date
      //to replace currentSchedEventsMap() below
      //uses _dailyScheduled map >>which organizes by asc key
      const mappyA = {}
      this._dailyScheduled.forEach((value, key, map) => {
        let d = value.date //value.date()  //invoke up to date date...toSee if updates for new days!
        
        if (!mappyA[ d ]) { // oldie >> value.date :: now >> d  and mappyA AINT map smh
          mappyA[ d ] = []
        }
        
        mappyA[ d ].push(value)
      })

      //console.log(`scheduledEventsMap>>`,mappyA)
      return mappyA
    }
    /*currentSchedEventsMap(){//redundant--toRemove
     
      const mappyA = {}
      this.actualEvts.forEach((evt) => { //(value, key, map) => {
        let d = evt.date //value.date()  //invoke up to date date...toSee if updates for new days!
        
        if (!mappyA[ d ]) { // oldie >> value.date :: now >> d  and mappyA AINT map smh
          mappyA[ d ] = []
        }
        
        mappyA[ d ].push(evt)
        if (evt.days) { //never gets here...toReview/remove***
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
      //console.log(`currentSchedEventsMap`,mappyA) >> orded by add and time(earliest to later)
      
      return mappyA
    }*/
    schedEvtWithProps(evt,startAt,EndAt){
      if (!evt.getPGoal()) {console.log(`schedEvtWithProps:: ERROR no parentGoal`,evt.data);return}

      let raw = evt.data()  //OR use this.getGoal() for title and inDefaults, etc.,..
      let goal = evt.getGoal()
      let pGoal = evt.getPGoal()

      let ret = {...goal}

      if (evt.timeChanged() || evt.durationChanged()){
        //console.log(`schedEvtWithProps:: ${ret.title} CHANGED...`,evt.timeChanged() +" time: "+goal.time +'>>' +raw.time, evt.durationChanged() +" dura: "+goal.duration +'>>' +raw.duration)//,goal,ret,raw)
        
        //maybe save evt(or evt.id) for later for drop to askUser? toSee**
        ret.time = raw.time
        ret.duration = raw.duration
        //let cloneUser = JSON.parse(JSON.stringify(evt)); // does not work with functions, symbols, or undefined value
      }
      evt.setDate(this.currentDate) //bof no need...

      let hasMoods = evt.getMoods()
      if (hasMoods){//!==
        //console.log(`schedEvtWithProps::MOODS`,hasMoods)
        this.usingMoods[ret.id] = hasMoods
      }

      ret.date = this.currentDate

      ret.bgcolor = pGoal.bgcolor
      ret.icon = pGoal.icon  //to show icon..toSee**

      //ret.for = evt.duration, //redundant...
      ret.start = startAt
      ret.end = EndAt

      let detz = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(ret?.time)} -> ${ret?.duration}min -- ${ret?.inDefaults ? 'Dft:':':'}${ret?.canMove ? ':Mv:':':'}${ret?.isAlternative ? ':Alt':':'}`

      if (ret.jeSuis && ret.jeSuis.length > 0){
        detz += hasMoods ? ` <>Mood:'${hasMoods}' >>${ret.jeSuis.join(',')}` : ` << ${ret.jeSuis.join(',')} >>`
        //ret.details = `Of '${pGoal.title.trim()}' :: << ${ret.jeSuis.join(',')} >>`
      }
      ret.details = detz 

      if (evt.hasNote()){
        //console.log(`schedEvtWithProps:: HASNOTES`,raw.notes,raw,ret)
        ret.notes=raw.notes
         //also atScore?
      }

      //console.log("schedEvtWithProps..returnin...",JSON.parse(JSON.stringify(ret)))//,clone.datey(),clone.date(),clone.title,clone.details)
      return ret

    }
    doProppy(evtGoal,onDate){ //wonder if shouldnt set this dynamically....toReview**
      let pGoal = this.parentGoalById(evtGoal.parentGoal)
      if (!pGoal) {console.log(`doProppy:: ERROR no Pgoal found ?!?`, evtGoal); return}
      
      let startTime = addToDate(parsed(onDate), { minute: parseTime(evtGoal.time) }) 
      let endTime = addToDate(startTime, { minute: evtGoal.duration })

      let clone = Object.assign({}, {...evtGoal,
        date:onDate,
        bgcolor: pGoal.bgcolor,
        start:startTime,
        end:endTime,
        icon:pGoal.icon  //to show icon..toSee**
      })
      
      if (evtGoal.jeSuis && evtGoal.jeSuis.length > 0){
        clone.details = `Of '${pGoal.title.trim()}' :: << ${evtGoal.jeSuis.join(',')} >>`
      } else {
        clone.details = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(evtGoal?.time)} -> ${evtGoal?.duration}min -- ${evtGoal?.inDefaults ? 'Dft:':':'}${evtGoal?.canMove ? ':Mv:':':'}${evtGoal?.isAlternative ? ':Alt':':'}`
      }
     
      if ('byMood' in evtGoal){ //add moods!--shouldnt have any!! ERROR
        console.log(`doProppy::BYMOOD found!! ERROR?!?`, JSON.parse(JSON.stringify(evtGoal)))
        this.usingMoods[clone.id] = evtGoal.byMood
      }
      
      return clone
    }
    updateDetz(evt){
      let pTitle = this.parentGoalById(evt.parentGoal)?.title?.trim()

      //this.doLog(`updateDetz`+evt.id+" "+pTitle,evt)

      let detz = `Of '${pTitle}' :: ${whenFrmtTime(evt?.time)} -> ${evt?.duration}min -- ${evt?.inDefaults ? 'Dft:':':'}${evt?.canMove ? ':Mv:':':'}${evt?.isAlternative ? ':Alt':':'}`

      if (evt.jeSuis && evt.jeSuis.length > 0){
        detz += this.usingMoods[evt.id] ? ` <> Mood:'${this.usingMoods[evt.id]}' >>${evt.jeSuis.join(',')}` : ` << ${evt.jeSuis.join(',')} >>`
        //ret.details = `Of '${pGoal.title.trim()}' :: << ${ret.jeSuis.join(',')} >>`
      }
      evt.details = detz

      return evt
    }
    //for generic add when it's reload by score/prio/defaults...
    addGoalsToSchedule(toAdd,checkOverlap){
      let euhOverlaps ={} //= []//{}

      toAdd.forEach((obj) => {

        let added = this.addToSchedule(obj,checkOverlap,false) //false to use proppy() as it's goal
        if(!added){
          console.log('addGoalsToSchedule:: ERROR Evt NOT added',added,checkOverlap, obj.id, obj.title,obj.time) 
          //could be present...should try and just update evt(in case changed time?) >>prolly smh
        }else{
          if(Array.isArray(added)){ //overlap!!!
            //console.log('addGoalsToSchedule::overlap for '+obj.id,JSON.parse(JSON.stringify(euhOverlaps[obj.id])),added)
            euhOverlaps[obj.id] = added
            //euhOverlaps.push(...added)//[obj.id] = added
          }
        }
      })

      //console.log('addGoalsToSchedule::....',JSON.parse(JSON.stringify(euhOverlaps)))
      return this.massageOverlapObj(euhOverlaps)
    }
    addToSchedule(evt,checkOverlap,useProp=false){//useProp flag to use schedEvtWithProps()
      if (! this._dailyScheduled.has(evt.id)){
        let startTime = addToDate(parsed(this.currentDate), { minute: parseTime(evt.time) }) 
        let endTime = addToDate(startTime, { minute: evt.duration })
        if (checkOverlap) {
          let oOth = this.hasOverlappingEvent(evt.id, startTime, endTime) //before add evt
          if(oOth.length > 0){
            return oOth
          }
        }

        let eProp = useProp ? this.schedEvtWithProps(evt,startTime,endTime) : this.doProppy(evt,this.currentDate)
        eProp.sortTime = startTime
        //this.actualEvts.push(eProp)
        let add = {...eProp,
          for: eProp.duration,
          start: startTime,
          end: endTime,
        }

        //if (useProp){ //just to do here to not pollute actualEvts >>still needed?!?--bof prolly not
        //  console.log(`addToSchedule--PROP?!?`+evt.id,evt?.score,evt.atScore)
        //  evt.atScore ? add.atScore = evt.atScore : "" //console.log(`addToSchedule--NULL score`,evt.id)
          //add.atScore = evt.atScore //|| null ////could be different with savedProps..
        //}
        this._dailyScheduled.set(eProp.id, add)
        
        this._endTimesSet.add(endTime.time)
        this._startTimesSet.add(startTime.time)
    
        this.enableNoteScoreEdit(eProp.id,startTime,endTime)
      }else {
        //console.log(`addToSchedule--NOT added! present?!!?`,checkOverlap,evt.title) 
        return false //checked at caller
      }
      
      return true //oldie >> this.findEvent(evt.id)
    }
    enrichAddToSchedule() { 
      //addPropsEventsTo(with savedEvtFunc) + updatedEvtDetails
      
      let euhOverlaps = {}

      let checkOverlaps = this.isViewingToday()

      console.log('enrichAddToSchedule',Object.keys(this.savedRawEvts).length,"overlapCheck:"+checkOverlaps)//,JSON.parse(JSON.stringify(this.savedRawEvts)))
      
      
      for (let key in this.savedRawEvts) {
        //console.log('enrichAddToSchedule::key',key)
        let toH = this.savedRawEvts[key]
        
        //have to enrich raw with original goal first!
        //toH has rawSaved data that should overwrite/add to what goal has...
        let originalG = this.getSubGoalByID(key) 

        //skip deleted
        if (!originalG) {console.log(`enrichAddToSchedule:: No goal found for key: ${key}...skipping!`); continue} //, toH

        let pGoal = this.parentGoalById(originalG.parentGoal)

        let c = createEvent(toH,originalG,pGoal)
        //console.log('enrichScheduled::createEvent>>',key, toH,originalG, pGoal,c)

        //console.log('enrichScheduled::createEvent >>',c.id,c.duration,c.data(),c.getGoal(),c.score,c.timeChanged(),c.durationChanged())
 
        let added = this.addToSchedule(c,checkOverlaps,true)
        if(!added){
          console.log('enrichAddToSchedule..ERROR?!? not added',added,originalG) 
          //could be already present--so NOT an error!!!
        } else {
          if(Array.isArray(added)){ //overlap!!!
            //console.log('enrichAddToSchedule..BOOO overlap!!!',c.getMoods(),JSON.parse(JSON.stringify(added)))
            //console.log('enrichAddToSchedule::overlap for '+key,euhOverlaps[originalG.id] ? "exist": "New add", JSON.parse(JSON.stringify(added)))
            euhOverlaps[originalG.id] = added
          }
        } 
      }

      return this.massageOverlapObj(euhOverlaps)//euhOverlaps
    }
    loadEvtsForDay(sameDay){
      if (!sameDay){ 
        this.resetSchedule(true) //first clear for new different date!
      }

      //console.log('loadEvtsForDay--FOR date',d,this.currentDate,this.savedRawEvts)
      this.savedRawEvts = Repo.getDataForDate(this.currentDate)
      
      if (this.savedRawEvts){
        //this.doLog("loadEvtsForDay",this.savedRawEvts)
        let hasOverlaps = this.enrichAddToSchedule()
        
        //console.log('loadEvtsForDay',this.currentDate,hasOverlaps,this._dailyScheduled,this.actualEvts)
        return {
          overlaps:hasOverlaps,
          canContinue:false,
        }
      }

      return {
        overlaps:null,
        canContinue:true
      }
    }
    onChangeViewDate(toDate){ //same as loadForDate()
      let sameDay = toDate == this.currentDate
      //console.log('onChangeViewDate >>',JSON.parse(JSON.stringify(this.currentDate)), toDate,noChange)
      this.currentDate = toDate
      this.enableActionBtns()
      
      return this.loadEvtsForDay(sameDay)
    }
    resetSchedule(skipMoods=false){
      //console.log('resetSchedule >>',skipMoods)
      this.savedRawEvts = []
      //this.actualEvts = []
      this._dailyScheduled = new Map()
      this._endTimesSet = new Set()
      this._startTimesSet = new Set()

      if (skipMoods){
        this.usingMoods = {}
      }

      //this.chosenScore = null //-moved in resetChosen()
      //this.chosenPrio = null
      
      this.showReloadBtn = false
      this.showClearBtn = false
      this.disableSaveSchedule = true
    }
    unscheduledDefaults(){
      //this.resetGoalEvts(true)
      let allG= this.getSubGoals()
      //this.allEvents.filter
      return allG.filter(evt => evt?.inDefaults && evt?.time != '' && !this._dailyScheduled.has(evt.id)) //!this.actualEvts.find(x => x.id == evt.id))
    }
    unscheduled(){
      let allG= this.getSubGoals() ///// these dont work >> !this.scheduledEvents.includes(x)  //this.scheduledEvents.indexOf(x) !== -1
      return allG.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)

    }
    subGoalsOfParent(id) { //see if used lots otrwise bring inline
      let allG= this.getSubGoals()
      return allG.filter(evt => evt.parentGoal == id)
    }
    chosenScoreLabel() { 
      return this.chosenScore == null ? `By Score` : `Score <= ${this.chosenScore}` 
    }
    chosenPrioLabel() { 
      return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
    }
    calculatePrioEvts(){
      //let add = this.getSubGoals().filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio).filter(x => !this.actualEvts.find(item => item.id == x.id)) //huh second filter work!!
      let reset = this.getSubGoals().filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio) //reset with allEvts
      let add = reset.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)) //add those not scheduled
      this.byPrio={
        prio:this.chosenPrio,
        toAdd:add,  //.length? >>nah used later 
        reset:reset, //oldie >> this.getSubGoals().length
      }
      //console.log(`calculatePrioEvts`, JSON.parse(JSON.stringify(this.byPrio)))
    }
    onChoosenPrio(e){
      //console.log('onChoosenPrio',e,this.chosenPrio)
      let oldy = this.chosenPrio
      if (oldy && oldy == e){
        this.disablePrioBtn = true //.user should not reclick without changing it again...
      }else {
        this.chosenPrio = e
        this.disablePrioBtn = false
        this.calculatePrioEvts()
      }
    }
    scheduleSamePrio(flag){
      
        const filterCurrent =() => {
          let toRet = []
          this._dailyScheduled.forEach((value, key, map)=> {
            if(this.parentGoalById(value.parentGoal)?.priority == this.chosenPrio){
              toRet.push(value)
            }
          })
          return toRet //this.actualEvts.filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio)
        }

        const recalculate = (flag) =>{ //shouldnt get here but just in case--could also invoke calculatePrioEvts() --toMonitor**
          console.log(`scheduleSamePrio::RECALCULATE?!?`,flag,this.chosenPrio, JSON.parse(JSON.stringify(this.byPrio)))
          let toRet = this.getSubGoals().filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio)
          return flag == 'reset' ? toRet : toRet.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)
        }
      
      let toRet = []

      //console.log(`scheduleSamePrio`, this.byPrio, flag) //JSON.parse(JSON.stringify(this.byScore)))

      //filter && overwrite replaces
      //add concats...
      if(flag == 'filter'){
        toRet = filterCurrent()
        this.resetSchedule() //byPrio
      } else { //flag == 'reset' || flag == 'add'

        if(this.byPrio){
          flag == 'add' ? toRet = this.byPrio.toAdd : toRet = this.byPrio.reset //; this.resetSchedule()
        }else{ //have to recalculate...which shouldnt happen!
          toRet = recalculate(flag)
        }
          
        /*if(flag == 'add'){ //just add to schedule
          // filter out events that are already scheduled..not too expensive?
          toRet =  toRet.filter(x => !this.actualEvts.find(item => item.id == x.id))
        } else { //for reset schedule....
          this.resetSchedule(true) //byPrio
        }*/

        flag != 'add' ? this.resetSchedule() : console.log(`scheduleSamePrio::No resetSchedule`,flag,toRet.length)
      }
      //console.log(`scheduleSamePrio::After ${flag} from size: ${this.actualEvts.length} to evts = ${toRet.length}`, JSON.parse(JSON.stringify(toRet)))
     
      //add to schedule!
      if (toRet.length < 1) {
        //console.log(`Empty for Priority == ${this.chosenPrio} :(`)
        this.toggleActionBtns(false,'byPrio')

        return {
          overlaps:null,
          canContinue:false,//for notify this.doNotify(`Empty for Priority == ${this.chosenPrio} :(`, "warning",'bottom')
        }
      }

      let euhOverlaps = this.addGoalsToSchedule(toRet,this.isViewingToday())
      let sizey = Object.keys(euhOverlaps).length

      this.updateCurrentMoods()

      this.toggleActionBtns((toRet.length > 0),'byPrio')
      
      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true,//true,
        added: toRet.length  //show how many added...
      }
      
    }
    calculateScoreEvts(){
      let reset = Repo.goalsUpToScore(this.chosenScore)
      let add = reset.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)

      this.byScore={  //huh no complaint putting this here and can access later
        score:this.chosenScore, //redundant but just to confirm still same later mayhaps...
        toAdd:add, //.length? >>nah used later 
        reset:reset //this.getSubGoals().length
      }
      //console.log(`calculateScoreEvts`, JSON.parse(JSON.stringify(this.byScore)))
    }
    onChoosenScore(e){
      //console.log('onChoosenScore',e)
      let oldy = this.chosenScore
      if (oldy && oldy == e){
        this.disableScoreBtn = true //user should not reclick without changing it again...
      }else {
        this.chosenScore = e
        this.disableScoreBtn = false
        this.calculateScoreEvts()
      }
    }
    scheduleByScore(flag){ //returns false || Overlaps 
      
        const filterCurrent = () => {
          let toReload = []
          this._dailyScheduled.forEach((value, key, map) => { //(item) this.actualEvts
            let daScore = parseScore(value.score)
            if (daScore > -1 && daScore <= this.chosenScore) {
              toReload.push(value)
            }//else{console.log('filterCurrent::parseScore?skippin',daScore, item,this.usingMoods[item.id])}
          })
          return toReload
        }
        const recalculate = (flag) =>{ //shouldnt get here but just in case--could also invoke calculateScoreEvts() --toMonitor**
          console.log(`scheduleByScore::RECALCULATE?!?`,flag,this.chosenScore, JSON.parse(JSON.stringify(this.byScore)))
          let toRet = Repo.goalsUpToScore(this.chosenScore)
          return flag == 'reset' ? toRet : toRet.filter(x => !this._dailyScheduled.has(x.id)) //this.actualEvts.find
        }

      let toRet = []
      //console.log(`scheduleByScore`, this.byScore, flag) //JSON.parse(JSON.stringify(this.byScore)))
      
      //filter && overwrite replaces
      //add concats 
      if(flag == 'filter'){
        toRet = filterCurrent()
        this.resetSchedule() //byScore
      } else { //'reset' || 'add'
       
        if(this.byScore){
          flag == 'add' ?  toRet = this.byScore.toAdd : toRet = this.byScore.reset //; this.resetSchedule() //umm it does execute after..huh 
        }else{ //have to recalculate...which shouldnt happen!
          toRet = recalculate(flag)
        }
        flag != 'add' ? this.resetSchedule() : console.log(`scheduleByScore::No resetSchedule`,flag,toRet.length) //should keep moods still for reset flag! 

      }
      //console.log(`scheduleByScore::AFTER >>${flag} from current = ${this.actualEvts.length} to some evts = ${toRet.length}`,JSON.parse(JSON.stringify(toRet)))
      
      if (toRet.length < 1) {
        this.toggleActionBtns(false,'byScore')
        return {
          overlaps:null,
          canContinue:false, //for doNotify
        }
      }

      //add to schedule!...
      let euhOverlaps = this.addGoalsToSchedule(toRet,this.isViewingToday())
      let sizey = Object.keys(euhOverlaps).length
      
      this.updateCurrentMoods()

      this.toggleActionBtns((toRet.length > 0),'byScore')
      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true, //true,
        added: toRet.length  //show how many added...could be misleading with overlaps!! but not shown in that case anyway!!
      }

    }
    scheduleOneEach(flag){//returns false || euhOverlaps
      //console.log('scheduleOneEach', flag)

        //const randomSelect =(from) =>{
        //  let s = from.length
        //  return Math.floor(Math.random() * s)
        //}
  
        const selectOneFromP = (useRandom) => {
          //implicit that useRandom == overwrite
          //flag to check if already scheduled? or implicit above?
          
          let toAdd =[]
          this.parentGoalsMap().forEach((value, key, map) => {
            let subs = this.subGoalsOfParent(value.id)
            //console.log("selectOneFromP::subs of "+value.id,value.title,subs.length,subs)//,subs,value
            if (subs.length > 0){
              let gottaAdd = null
              let i = subs.length

              if(useRandom) {
                gottaAdd = subs[Math.floor(Math.random() * i)] 
                //console.log("selectOneFromP::gottaAdd Random at index: "+i,subs.length, ) //gottaAdd
              }else { //add one that aint scheduled already!!
                //oldie >> subs[0] >> take first one...could be scheduled so check below...
                let tries = 0 //in case no infinite loop for one elt or something....prolly
                while (this._dailyScheduled.has(subs[i].id)) { //this.actualEvts.some(e => subs[i].id == e.id)
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
          //console.log('scheduleOneEach...unscheduled!!',notScheduled)
          let toAddy = []
          this.parentGoalsMap().forEach((value, key, map) => {
            //let c = notScheduled.find(item => item.parentGoal == value.id)
            let toChooseFrom = notScheduled.filter(item => item.parentGoal == value.id)
            let s = toChooseFrom.length
            if (s > 0){
              let c = toChooseFrom[Math.floor(Math.random() * s)] //randomSelect(toChooseFrom)
              toAddy.push(c)
            } else{
              console.log('scheduleOneEach::NO SUBGOAL for',key, value?.title)
              //todo >return this to show user...maybe
              //this.useGroupNotify(`No SubGoals for Parent: '${value?.title}'`, value?.bgcolor,'bottom')//for grouping>>'NoG' //doNotify  //"warning"
            }
          })
          return toAddy
        }
      
      ///////////START////////////
      //let isTod = this.isViewingToday()
      let toAdd=[]
      
      if(flag == 'add'){//go through each and add subG for parentG
        toAdd = addy()

        console.log('scheduleOneEach...TOADD>> '+toAdd.length)//,toAdd)
        //this.doLog('scheduleOneEach...TOADD>> '+toAdd.length,toAdd)

      } else { //overwrite!
        //this.scheduledEvents = []
        //this.updateCurrentSchedule()
        this.resetSchedule() //oneEach
      
        //random...implicit that overwrite and no need to check 'notScheduled' ...

        toAdd = selectOneFromP(true) //**beware flag when false after resetSchedule()
        
      }

      //add to schedule!
      if (toAdd.length < 1) {
        console.log(`Empty for OneEach :(`)
        this.toggleActionBtns(false,'oneEach')

        return {
          overlaps:null,
          canContinue:false,
        }
      }

      let euhOverlaps = this.addGoalsToSchedule(toAdd,this.isViewingToday())
      let sizey = Object.keys(euhOverlaps).length

      this.updateCurrentMoods()

      this.toggleActionBtns((toAdd.length > 0),'oneEach') //true //(toAdd.length < 0)
      return {
        overlaps:euhOverlaps,//null,
        canContinue:sizey > 0 ? false : true,//true,
        added: toAdd.length  //show how many added...could be misleading with overlaps!! but aint shown anyway...
      }

    }
    scheduleByMood(toAdd){
      let toReload = []
  
      for(let i = 0; i < toAdd.length; i++){
        
        let local = this.getSubGoalByID(toAdd[i].id) //this.getLocalEvt(toAdd[i].id)
        //console.log(`scheduleByMood>>>local>>`,local)
        if (local && local.time != ''){
          //console.log(`scheduleByMood>>>local>>`,toAdd[i],local)
          toReload.push(local)
          this.usingMoods[toAdd[i].id]=toAdd[i]?.mood  //umm add already here?!? hard to undo in case of overlaps smh---toTest**
        }
      }

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
     
      //no toggleBtns if overlaps
      sizey > 0 ? console.log(`scheduleByMood overlaps!! Try reload= ${toReload.length} with overlaps =${sizey}`) : this.toggleActionBtns((toReload.length > 0),'ByMood')

      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true,//true,
        added: toReload.length //might be redundant...
      }
    }
    scheduleDefaults(flag){
  
      let dEvts = null 

      if(flag == 'add'){
        dEvts = this.unscheduledDefaults()
      }else{
        this.resetSchedule() //byDefaults
        dEvts = this.unscheduledDefaults() //this.getSubGoals()
      }

      this.showReloadBtn = this.hasEventsForDate()
      this.showClearBtn = !this.isViewingPast() && dEvts.length > 0
      
      let euhOverlaps = this.addGoalsToSchedule(dEvts,this.isViewingToday())
      let sizey = Object.keys(euhOverlaps).length
      if(sizey > 0) {
        console.log(`scheduleDefaults:: Overlaps!! for ${dEvts.length}...overlaps =${sizey}`)
      }

      this.updateCurrentMoods() //just in case...with resetSchedule() above

      this.toggleActionBtns((dEvts.length > 0),'defaults') 
      //this.disableSaveSchedule = !(dEvts.length > 0) //false
      
      //this.reset() //nah in case have other settings like onScore/Prio.
      return {
        overlaps:euhOverlaps,//null,
        canContinue:sizey > 0 ? false : true,//true
      }
  
    }
    //massage overlap Object...for multiple added evts overlapping single||multiple scheduled.
    massageOverlapObj(oLaps){ //transform  //beware of semantics!
      let euhOverlaps = {} 

      for (let key in oLaps) {
        let obj = oLaps[key]

        if(obj.length > 0){

          let j = 0
          do {
            let oDets = obj[j]
  
            //instead of target> add by inConflict
            // better overlap resolution later--See multiConflicts()
            if(!euhOverlaps[oDets.inConflict]){
              euhOverlaps[oDets.inConflict] = []
            }
            euhOverlaps[oDets.inConflict].push(oDets)
  
            //console.log(`${j}-massageOverlapObj for ${oDets.target} conflict with ${oDets.inConflict}`, euhOverlaps[oDets.inConflict].length) //oOth[j]
            if(j>0){//--case where using inConflict is wrong 
              //bon here better to use the obj.id as the evt being added!
              //--See fixMultiConflicts() >> evt CAN overlap with two others....
              //if(!euhOverlaps[obj.id]){ //keep in mind the obj.id is target
              //  euhOverlaps[obj.id]= []
              //}
              //euhOverlaps[obj.id].push(oDets)
  
              //>could have multiple that are overlapping yes!
              //console.log("WOAH WOAH, massageOverlapObj:: multiple overlaps with same obj!", obj,oDets)
              //this.doLog("WOAH WOAH, massageOverlapObj",obj)
              if (oDets.inConflict in euhOverlaps){delete euhOverlaps[oDets.inConflict] } //; console.log("WOAH deleting inConflict",oDets.inConflict)
              if (obj[j-1].inConflict in euhOverlaps){delete euhOverlaps[obj[j-1].inConflict] } //console.log("WOAH deleting PREV inConflict",obj[j-1].inConflict);
  
              if(euhOverlaps[oDets.target]) { 
                euhOverlaps[oDets.target].push(oDets);
                console.log("WOAH WOAH,massageOverlapObj::obj.id already present! ERROR?",oDets.target); 
              } else { euhOverlaps[oDets.target] = [oDets]} 
              
              euhOverlaps[oDets.target].unshift(obj[j-1]) //also add previous as makes sense..
              //flag how to solve these conflicts later!!--use array for granularity!
              //oldie >> euhOverlaps["withID"] = true
              if(!euhOverlaps["withID"]){
                euhOverlaps["withID"] = []
              } 
              euhOverlaps["withID"].push(oDets.target) //prolly wouldnt have other normal overlap with same key...lool
            }    
          } while (++j < obj.length)
        }
      }
      //console.log('massageOverlapObj::RETURNING',JSON.parse(JSON.stringify(euhOverlaps)))

      return euhOverlaps
    }
    //massage overlap Array..for single added evt overlapping multiple scheduled.
    massageSingleOverlapArr(overlaps){
     
      let euhOverlaps={} 

      for(let i = 0; i < overlaps.length; i++){
        let toH = overlaps[i]
        //console.log("massageOverlaps",JSON.parse(JSON.stringify(toH)))
        if(euhOverlaps[toH?.inConflict]) { euhOverlaps[toH?.inConflict].push(toH) } else{ euhOverlaps[toH?.inConflict] = [toH]} 
         
        if(i > 0){//keep in mind the obj.id is target
            
          //console.log("WOAH WOAH,massageSingleOverlapArr..multiple overlaps with same target>>",overlaps[i].target)//>could have multiple default that are overlapping yes!
            //ummm this where using inConflict is wrong as evt CAN overlap with two others....
          if (toH.inConflict in euhOverlaps){delete euhOverlaps[toH.inConflict] } // console.log("WOAH deleting inConflict",toH.inConflict); 
          if (overlaps[i-1].inConflict in euhOverlaps){delete euhOverlaps[overlaps[i-1].inConflict] } // console.log("WOAH deleting PREV inConflict",overlaps[i-1].inConflict); 

          if(euhOverlaps[toH.target]) { euhOverlaps[toH.target].push(toH);console.log("WOAH obj.id already present?",toH.target); } else{ euhOverlaps[toH.target] = [toH]} 
              
          euhOverlaps[toH.target].unshift(overlaps[i-1]) //also add previous as makes sense..
          //oldie >> euhOverlaps["withID"] = true //flag how to solve these conflicts later!!
          if(!euhOverlaps["withID"]){ //-use array for granularity!
            euhOverlaps["withID"] = []
          } 
          euhOverlaps["withID"].push(toH.target) //prolly wouldnt have other normal overlap with same key...lool
        } 
      }

      //",JSON.parse(JSON.stringify(euhOverlaps)),JSON.parse(JSON.stringify(overlaps)))
      return euhOverlaps
      
    }
    saveNewGoal(timeStart,goalTitle, parentGoal, own, duration){
     // let timeStart = parseTimestamp(timeRange[0])
      //let tosee = parsed(this.possibleRange[0])
      //let timeEnd = interval > 15 ? addToDate(timeStart, { minute: parseInt(interval)}) : addToDate(parseTimestamp(timeRange[1]), { minute: 15}) 
      
      //oldie >> 15 mins for when single timeslot selection

      //below redundant when set the interval...smh
      //let duration = Math.floor((diffTimestamp(timeStart, timeEnd)/1000)/60)  //(diffy / 60000)

      //console.log(`saveNewGoal:${goalTitle} :${own}: from ${timeStart.time}.Duration:${duration}`,parentGoal)

      if(own == "self"){ //add it as self >> create parent goal with this as subgoal
        let pId = this.addParentGoal(goalTitle, goalTitle, "red-14", 2) //default color and priority
        if (pId) {
          //console.log("SELF parent Goal created",pId)
          return Repo.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) //canMove and notInDefaults. isAlternative when duration<30
        } else {
          console.log("ERROR? no pID", pId)//could be for first first parentGoal--OR when 0!!! smh
          return pId === 0 ? Repo.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) : null
          //return null 
        }
      } else { //just add it to Misc parentGoal(that have all one-off kind of stuff)
        if (parentGoal){//add it to parentGoal
          console.log("with parentGoal "+parentGoal.id,parentGoal?.title)
          return Repo.addSubGoal(parentGoal.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30) 
          //!canMove and notInDefaults. isAlternative when duration<30
        } else { //any Misc parentGoal available?
          let pMisc = Repo.getMiscGoal() //==getGoalByTitle("Misc")
          if(!pMisc){
            let pId = this.addParentGoal("Misc", "Miscellaneous", "grey-10", 2) //Repo.addParentGoal("Misc", "Miscellaneous", "grey-10", 2)
            if (pId) {
              //console.log("NEW Misc pGoal created",pId)
              return Repo.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) 
              //canMove and notInDefaults.isAlternative when duration<30
            }else {
              console.log("ERROR? no pID", pId)//could be 0!!! smh--could be baaad? toMonitor**
              return pId === 0 ? Repo.addSubGoal(pId,goalTitle,'1on5',timeStart.time, duration,true, false,duration<30) : null
              //return null 
            }
          } else {
            //console.log("Woo!! Misc pGoal already exists!", pMisc.id) //
            return Repo.addSubGoal(pMisc.id,goalTitle,'1on5',timeStart.time, duration,false, false,duration<30)
          }
        }
      }
    }
    //default color and priority 
    //randomly reassign color though!
    addParentGoal(title, details,color, priority = 2){
      
      let currentArr = []
  
      this.parentGoalsMap().forEach( (value, key, map) => { //extract already taken colors
        let bC = value.bgcolor 
        currentArr.push(bC) //OR even push in an array...
      })
  
      let AllColors = pGColors()
      let available = AllColors.filter(item => !currentArr.find(c => c == item))
  
      //let sizey = currentArr.length

      //console.log(`addParentGoal::bgcolor>>available`,sizey,available)
      //let newy = null
      if (available.length > 1) {
        let i = Math.floor(Math.random() * available.length)
        let newy = available[i]
        console.log(`addParentGoal::bgcolor..index ${i} from ${color} to:`,newy)
        color = newy ? newy : color
      }else{
        console.log(`addParentGoal::NONE available`,available,AllColors) //could happen--keep default
      }
      /*if(sizey > 1){
       
        //choose random index of new color..from all those not already taken
        let i = sizey
        let tries = 0
        while (currentArr.some(clr => AllColors[i] == clr)) { //while index is found in current colors...have a new index
          //console.log("addParentGoal::Taken color...new random",i,"existing:: "+AllColors[i])
          //can have too many tries...stop after while >> still takes too long to return!
          tries++
          i = Math.floor(Math.random() * sizey)
          if (tries > 7) {console.log("addParentGoal::TOO MANY TRIES..Break?",tries,i)} //; break
          //should maybe filter out those not used!!--todo**
        }
  
        let newy = AllColors[i]
  
        //console.log(`bgcolor..NEW:`,JSON.parse(JSON.stringify(newy)),JSON.parse(JSON.stringify(newC)))
        console.log(`addParentGoal::bgcolor..index ${i} from ${color} to:`,newy)  
        color = newy ? newy : color
      }*/
  
      return Repo.addParentGoal(title, details, color, priority)
          
    }
    onPickEvent(addE,timey,doForce,useBalance,doNotify=null){

        const allGood = () => {
          //only balance without overlaps for now--
          if (useBalance){
            this.removeFromBalance(addE?.duration) //duration should be present**
            console.log("onPickEvent...useBalance","force?"+doForce)
          }

          //let anyO = this.addGoalsToSchedule([{...addE,time:timey.time}],false)
          let anyO = this.addToSchedule({...addE,time:timey.time},false)
          
          //console.log("onPickEvent::NO overlap",useBalance,anyO)
     
          //this.toggleActionBtns(true,'onPickEvt')
          this.isViewingPast()|| useBalance ? this.saveDaySchedule() : this.toggleActionBtns(true,'onPickEvt')

          return {
            overlaps:anyO,
            canContinue:true,
          }
        }

      //this.doLog("onPickEvent!!!",addE)

      let end = addToDate(timey, { minute: addE.duration})
      
      let anyOverlap = this.hasOverlappingEvent(addE.id, timey, end)

      let s = anyOverlap.length
  
      if(s > 0){
        console.log(`onPickEvent::OVERLAPS!!`+s,"with force "+doForce,JSON.parse(JSON.stringify(anyOverlap)))
        //this.toggleActionBtns(true,'onPickEvt') //meh should be called after solving overlap
        let ret = {
          overlaps: this.massageSingleOverlapArr(anyOverlap),
          canContinue:false,
        }

        if (s > 1 || !doForce){ //multiple or not force---just return for user to handleOverlap
          return ret
        }

        if (doNotify){doNotify(`onPickEvent:: ${s} OVERLAPS! Forcing...`,'info') }//huh works!!
        let i = 0
        do {
          this.recurChangeTime(anyOverlap[i].inConflict,addE,timey,true,doNotify)
        } while (++i < s)

        if (useBalance){
          this.removeFromBalance(addE?.duration)
        }

        this.isViewingPast() || useBalance ? this.saveDaySchedule() : this.toggleActionBtns(true,'onPickEvt')
        return {
          overlaps:null,
          canContinue:true,
        } 
      }else {
        return allGood()
        //console.log("onPickEvent NO overlaps...to targetDrop!!>force", doForce,"useBalance:"+useBalance,JSON.parse(JSON.stringify(addE))
      }
    }
    onAdHocEvent(evtID,timey,useBalance,doNotify=null){
        const allGood = (toAdd) => {
          if (useBalance){
            this.removeFromBalance(toAdd?.duration) //duration should be present**
            console.log("onAdHocEvent...using Balance",toAdd?.duration)
          }

          //just save!
          this.saveDaySchedule() //: this.toggleActionBtns(true,'onAdHoc')
          if (doNotify){
            doNotify(`onAdHoc...Saving Schedule`,'info') //toSee...
          }
          return {
            overlaps:null,
            canContinue:true,
          }
        }
      
      let newey =  this.getSubGoalByID(evtID)
      if (!newey){
        return {
          overlaps:null,
          canContinue:false,
        }
      }

      let euhOverlaps = this.addToSchedule(newey,true)
      let isArray = Array.isArray(euhOverlaps)
      if(!euhOverlaps || isArray){
        console.log(`onAdHocEvent::Overlaps!!`,JSON.parse(JSON.stringify(euhOverlaps))) 
        
        let ret = {
          overlaps: !euhOverlaps ? null : this.massageSingleOverlapArr(euhOverlaps),  //umm bad to check false--toReview***
          canContinue:false,
        }

        let s = euhOverlaps.length
        if (isArray && s > 1){
          return ret
        }

        //force Add when single overlap
        if (isArray && s == 1){
          //console.log(`onAdHocEvent::Overlaps!!--FORCING`,newey,timey.time)
          if (doNotify){
            doNotify(`onAdHocEvent:: ${s} OVERLAPS! Forcing...`,'info')
          }
          let i = 0
          do {
            this.recurChangeTime(euhOverlaps[i].inConflict,newey,timey,true,doNotify)
          }while (++i < s)

          return allGood(newey)
        }
        return ret  //just in case--should?**
      }

      return allGood(newey)
    }
    recurChangeTime(overlappedEvtID, tEvt, targetTimestamp,doAdd = false,doNotif=null) {
      let overlappedEvt = this.findSchedEvent(overlappedEvtID)
      if (overlappedEvt){
  
        //umm using overlappedEvt to keep same time interval between the two events?!? >> meh but to explore later but no point with overlaps...
        
        //direction of drag(up or down) >>either - or + 
        //let dragTimeInterval = parseTime(targetTimestamp.time) - parseTime(tEvt.time)
        let dragTimeInterval = parseTime(overlappedEvt.start.time) - parseTime(targetTimestamp.time)
        
        let dName = `${dragTimeInterval > 0 ? "DOWN": "UP"}` //so down is forward in time..prlly
        //let dggyName = `${draggyInterval > 0 ? "DOWN": "UP"}`
        //console.log(`${overlappedEvtID} of dura: ${overlappedEvt.for} moving <> ${dName} due to evt:${tEvt.id} of dura:${tEvt.duration} at ${targetTimestamp.time}...doAdd:${doAdd} and skipAsk:${skipAsk}`) //overlappedEvt
  
        //tEvt.time >> original Evt time but the targetTimestamp.time >> WHEN it should be scheduled at
  
        let overlappedEvtNew = null
        if (dragTimeInterval >= 0 ) { // add of extra 10 prolly lead to more overlap! remove for too many evts?--toReview
          overlappedEvtNew= addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) 
          let alternative = addToDate(targetTimestamp, { minute: parseInt(overlappedEvt.for) + 10 })//overlappedEvt.for might be too much...
          console.log(`recurChangeTime::START>>(${overlappedEvtID}) '${overlappedEvt?.title}' going FORWARD ${dName} for ${dragTimeInterval} due to evt:(${tEvt.id})${tEvt?.title?.trim()} at ${targetTimestamp.time} 
          \n doAdd?:${doAdd} >`, JSON.parse(JSON.stringify(overlappedEvtNew.time)), 'alt:',alternative.time)
          //should use the closer time...avoid multiple overlaps later..
          let diffy = diffTimestamp(alternative,overlappedEvtNew)
          if(diffy > 0){ //so overlappedEvtNew is later...use alternative perhaps? >> nah could sometimes add evt too close and have another overlap!! --especially during CASCADING timechange
            let bo = Math.floor((diffy/1000)/60)
            if (bo <= dragTimeInterval){ //toSee if would help with proper timechange during cascading...>so far so good!
              console.log(`recurChangeTime::(${overlappedEvtID})....with duration:${overlappedEvt.for} vs evtDura:${tEvt.duration}...NOT using alternative!!`)
            } else {
              console.log(`recurChangeTime::DIFFY>>${diffy}...gonna use Alternative`,alternative.time)  //negative means alternative is worse and should use overlappedEvtNew
              overlappedEvtNew = alternative
            }
          }
        } else {//remove instead of add.
          overlappedEvtNew = addToDate(targetTimestamp, { minute: -(parseInt(overlappedEvt.for) + 10)})
          let alternative = addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) }) //toSee if overlappedEvt.for isnt too much? nope seems proper for backward...prlly
          //let diffy = diffTimestamp(alternative,overlappedEvtNew) 
          console.log(`recurChangeTime::START>>(${overlappedEvtID}) '${overlappedEvt?.title}' going BACKWARD ${dName} for ${dragTimeInterval} due to evt:(${tEvt.id})${tEvt?.title?.trim()} at ${targetTimestamp.time}
          \n doAdd?:${doAdd}`, overlappedEvtNew.time, 'alt:'+alternative.time) //'diffy='+diffy
        }
  
        let anyOtherOverlap = this.hasOverlappingEvent(overlappedEvtID, overlappedEvtNew,addToDate(overlappedEvtNew, { minute: overlappedEvt.for})) // overlappedEvt.for)
        let sizey = anyOtherOverlap.length
        if(sizey > 0) {
          console.log(`WARNING WARNING::Extra Overlaps of ${sizey} for OVERLAPPED ${overlappedEvtID} at ${overlappedEvtNew.time}`, anyOtherOverlap)
          let i = 0
          
          //let draggy = this.findEvent(overlappedEvtID) //this.getScheduledEvent(overlappedEvtID)
  
          //this.doNotify(`Cascading time change while adding '${draggy?.title.trim()}' due to "${tEvt.title.trim()}"`, "warning",'top')
          //draggy ? 
          console.log(`Cascading time change moving (${overlappedEvtID})'${overlappedEvt?.title}' ${overlappedEvt?.time} due to ${doAdd ? "Adding":"Moving"} ${tEvt.id}-'${tEvt?.title?.trim()}'`) //: console.log(`ERROR::recurChangeTime ${overlappedEvtID} not found`) //umm return?
  
          if (doNotif){doNotif(`${sizey} Cascading Overlaps handling (${overlappedEvtID}) '${overlappedEvt?.title}' as ${doAdd ? "Adding":"Moving"} '${tEvt?.title?.trim()}'`) }
          do {
            console.log(`CASCADING timeChange ${i} >> (${overlappedEvtID}) at: ${overlappedEvtNew.time} now at: ${overlappedEvt.start.time} till ${overlappedEvt.end.time}`,overlappedEvt.for) 
            //should prolly skip when seeing own self?!?--toMonitor**
            //should def break or goes in an infinite loop!!--when seeing original evt...
            if(anyOtherOverlap[i].inConflict == tEvt.id){
              console.log(`EUUUH...ERROR::recurChangeTime::self overlap?!?OVERLAPPED:${overlappedEvtID} ...break`, anyOtherOverlap[i].inConflict,tEvt.id) // anyOtherOverlap[i]
              break  //not break causes too many recursions...toReview**
            }
            //skipAsk should be true as recursion implicitly force schedule change--instead of using passed in.
             //, doAdd flag default to false as no needed for add with cascading timeChange of scheduled evts
            this.recurChangeTime(anyOtherOverlap[i].inConflict,overlappedEvt,overlappedEvtNew,false,doNotif) 
            
          } while (++i < sizey)
        }

        this.changeEvtTime(overlappedEvt, overlappedEvtNew)
        console.log(`recurChangeTime::OVERLAPPED (${overlappedEvtID}) '${overlappedEvt?.title}' >> ${dName} to ${overlappedEvtNew.time} >> DONE!!`)
        
        //umm should stays the same here!!--for dragging up keep interval of 10 minutes? prolly better for separation?
        let draggedNewTime = targetTimestamp //(dragTimeInterval > 0 || goForward) ? addToDate(targetTimestamp, { minute: 0 })
                              //                      : addToDate(targetTimestamp, { minute: 0 }) 
        
        //the evt doing displacement stays the same.
        console.log(`recurChangeTime::TARGET>>(${tEvt.id})${tEvt?.title?.trim()} going ${dName} >> by ${doAdd ? "Adding at":"Moving to"} >> ${draggedNewTime.time}`) 
        
      
        if(!doAdd){
          this.changeEvtTime(tEvt,draggedNewTime)
          return
        }
        //add to schedule--still check overlaps with this.isViewingToday())
        let conflicts = this.addGoalsToSchedule([{...tEvt,time:draggedNewTime.time}],this.isViewingToday()) //false
        if(Object.keys(conflicts).length > 0) {
          console.log(`recurChangeTime::EXTRA OVERLAP ${doAdd ? "Adding":"Moving"} ${dName} TARGET ${tEvt?.title?.trim()} of size=${Object.keys(conflicts).length}`,JSON.parse(JSON.stringify(conflicts)))
          
          //return conflicts //handle this here instead!!//--kinda take decision away from user but oh well!
          //shouldnt have many conflicts?!?--toSee**
          if (doNotif){doNotif(`EXTRA OVERLAPS ${doAdd ? "Adding":"Moving"} TARGET ${tEvt?.title?.trim()} ${dName}`) }

          for (let key in conflicts) {
            let toH = conflicts[key]
            if(!toH[0]){
              console.log(`recurChangeTime::TARGET EXTRA OVERLAP...SKIPPING key`,key) //oneToMany...toReview*** could do loop once?
              continue
            }
            let sizey = toH.length
            if(sizey > 0) {
              let i = 0
              do {
                console.log(`recurChangeTime::TARGET CASCADING OVERLAP: ${tEvt.id}-${tEvt?.title} at: ${draggedNewTime.time}`,toH[i].targetStart,toH[i].direction) 
                //should prolly skip when seeing own self?!?--toMonitor**
                //should def break or goes in an infinite loop!!--when seeing original evt...
                //could happen with oneToMany conflicts!!
                if(toH[i].inConflict == tEvt.id){
                  console.log(`EUUUH...::recurChangeTime::TARGET>>OVERLAP::self overlap?!?...breaking!`, toH[i].inConflict, tEvt.id,toH[i].targetStart) 
                  break 
                }
                this.recurChangeTime(toH[i].inConflict,tEvt,draggedNewTime,doAdd,doNotif) //doAdd flag?
                
              } while (++i < sizey)
            }
          }
        }
      } else{
        console.log("recurChangeTime::ERROR >> overlapped event not found!","doAdd? "+doAdd, overlappedEvtID,tEvt)
        //coulda been removed...still add if doAdd ? toSee**
      }
    }
    hasOverlappingEvent(evID, targetStart, targetEnd) {
      const mappyA = []
     
      //console.log(`hasOverlappingEvent for ${evID} at ${targetTimestamp.time} for ${duration}`, tStartAt, tEndsAt)
  
      this._dailyScheduled.forEach((value, key, map) => {
        if (key != evID){//skip self!
          //console.log(`${evID} skippin self ${key}`,value)
        //} else{
          let oDirection = this.checkOverlapByTime(targetStart,targetEnd,value.start,value.end) //`${evID}->${key}`
          if (oDirection){
            //console.log(`OverlappingConflict ${evID} en "${oDirection}" of evt:${key} at`,value.start.time)//tStartAt value
            // duration, tStartAt, tEndsAt, value.start, value.end
            if (this._startTimesSet.has(targetStart.time)){console.log(`hasOverlappingEvent ${evID} same start`,targetStart.time)}
            //could add hasSameStart prop below?---toSee** if needed!
            mappyA.push({ 
              target:evID,
              targetStart:targetStart,
              direction:oDirection,
              inConflict:key //toRename** and make clear that inConflict is already scheduled!!
            })
          }
        }
      })
  
      return mappyA
    }
    checkOverlapByTime(tStart, tEnd, eStart, eEnd){
      //custom to also return more info whether overlapping left(haut?), right(bas?), totalO(surrounding)
      //also uses getTimeIdentifier lib function via this.getTimeyNumber(timey) above
      
      let targetStart = this.getTimeyNumber(tStart)
      let targetEnd = this.getTimeyNumber(tEnd)
  
      let schedEvtStart = this.getTimeyNumber(eStart)  
      let schedEvtEnd = this.getTimeyNumber(eEnd)
  
      //console.log("checkOverlapByTime ORIG>>",tStart, tEnd, eStart, eEnd)
      //console.log("checkOverlapByTime THEN>>"+id,targetStart,targetEnd,evtStart,evtEnd) // >> 805 830 500 535
      
      if (targetStart === false || schedEvtStart === false || targetEnd === false || schedEvtEnd === false) {
        console.log("ERROR... checkOverlapByTime error",targetStart,targetEnd,schedEvtStart,schedEvtEnd)
        return false
      }//else {console.log("evtIsOverlappingTimes",targetStart,targetEnd,evtStart,evtEnd)}
  
      //so adding the '=' equal sign, also finds evts next to each other(without space in between) and that's a conflict--want some breather?!?
      //prolly better to have evts NEXT to each other!
      let dir = false
      if(targetStart > schedEvtStart && targetStart < schedEvtEnd){// overlap left...beware of '=' removal >>evts are next to each other!
        //return 'bas'  //so target is EARLIER than scheduled evt...prolly?
        dir = 'bas'
      } 
      if (targetEnd > schedEvtStart && targetEnd < schedEvtEnd){ // overlap right ...>> effects of removing '=' as above (evts can be next to each other!!)
        //return 'haut'  //so target is LATER than scheduled evt...prolly?
        dir = 'haut'
      }
      let surrounding = (schedEvtStart >= targetStart && targetEnd >= schedEvtEnd)
      let surrounded = (targetStart >= schedEvtStart && targetEnd <= schedEvtEnd)//have to also check opposite!!!
      //if((evtStart >= targetStart && targetEnd >= evtEnd) || (targetStart >= evtStart && targetEnd <= evtEnd)){ 
      if(surrounding || surrounded){ 
        dir = 'surrounding' 
        //no need to distinguish
        //console.log("checkOverlapByTime","surrounding:"+surrounding,"surrounded:"+surrounded)
      }
      
      return dir //false
    }
    canDropEvent(targetDrop, draggedItem){ //from string needed?!? toSee**
      
      let tEndsAt = addToDate(targetDrop, { minute: draggedItem.duration})
      
      let anyOverlap =  this.hasOverlappingEvent(draggedItem.id, targetDrop,tEndsAt)

      if (anyOverlap.length > 0){
       
        //return anyOverlap 
        return {
          overlaps:this.massageSingleOverlapArr(anyOverlap),
          canContinue:false,
        }
      } else {
        //so no overlapp, just change dragged event time--ask User
        //console.log(`dropEvent with No overlap (${draggedItem.id}) to ${targetDrop.time}`)  //w
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
      //'from' flag can be switched for some btns that shouldnt change...redundant though--toRemove**

      this.disableSaveSchedule = !evtNumAdded //false
      this.showReloadBtn = this.hasEventsForDate() && evtNumAdded
      this.showClearBtn = !this.isViewingPast() && evtNumAdded //true  //evtNumAdded == dEvts.length > 0
      
    }
    resetChosen(){ //explicit reset of dropdown values for score & prio
      this.chosenScore = null
      this.chosenPrio = null
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
      
      let e = addToDate(timey, { day: 1}) //this proper to use next day's
      let midnightiey = new Date(e.date)
      
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
    doUpdateSchedule(draggedItem,targetDrop){
      let s = this.findSchedEvent(draggedItem.id)
      //let d = this.findEvent(draggedItem.id) //from  this.actualEvts

      if (!s){ //|| !d
        console.log("doUpdateSchedule-ERROR NOT found",draggedItem.id,s)
        return
      }
      //console.log(`doUpdateSchedule::Dura`,s.for, d.duration,s.duration,s?.atScore)
      
      let newStart = addToDate(parsed(s.date), { minute: parseTime(targetDrop.time) }) //d.date
      let endTime = addToDate(newStart, { minute: s.duration}) //should be d.duration as up to date with adHoc

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

      s.time = targetDrop.time  //d
      s.sortTime = newStart
      let newy = this.updateDetz({...s,time:targetDrop.time,start: newStart,end: endTime})
      this._dailyScheduled.set(draggedItem.id, newy)
        //{...s,
        //for: s.duration, //oldie>> d.duration //no need prolly
        //start: newStart,
        //end: endTime,
        //atScore: eProp.score ? toSee** if s still has it....
      //})

      this.enableNoteScoreEdit(draggedItem.id,newStart,endTime)
    }
    saveDaySchedule(){
      
      let toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
    
      if (this._dailyScheduled.size < 1){ //clearing day
        toSave = null
      } else {
        this._dailyScheduled.forEach( (value, key, map) => {
          toSave[key] = {  //minimalistic
            time: value.start.time,
            duration: value.for,
            atScore: value?.atScore // || null to leave empty and not pollute too much with redudant data?
          }
        
          if(this.usingMoods[key]){
            toSave[key].byMood = this.usingMoods[key]
          }
          if(value.notes !== void 0 && value?.notes !==''){
            //console.log("saveDaySchedule",key, value?.notes, value?.score) //toSave[key].atScore,
            //toSave[key].atScore = value?.score  // toSave[key].atScore || value?.score ?!?
            toSave[key].notes = value?.notes
          }
        })
      }
  
       console.log("saveDaySchedule", toSave ? Object.keys(toSave).length : "CLEARED")//JSON.parse(JSON.stringify(toSave)))
       
       //this.doLog("saved",toSave) //saved ordered by key index...

       Repo.saveDailySchedule(this.currentDate, toSave) 
       
       this.disableSaveSchedule = true 
       this.showReloadBtn = false
       this.showClearBtn = toSave != null && !this.isViewingPast()

    }
    //to enable/disable endButton...
    updateMinEndNowBtn(timey,hasEnd, hasStart){ 

      for (let [entry, val] of this._dailyScheduled) {
        let toComp = hasEnd ? val.end.time : val.start.time  //bon should work..prolly both flags are mutually exclusive?
        //let euhStart = hasStart ? val.start.time : timey  //just in case but redundant.
        if (toComp == timey){
          //console.log(`doEnableEndNowBtn found hasStart:${hasStart}`, entry,JSON.parse(JSON.stringify(this.isDisabledScoreEdit[entry])) ) //val
          this.hasStarted[entry] = !hasEnd 
          this.isDisabledScoreEdit[entry] = !hasEnd //enable/disable score edit--toTEST...should use hasEnd?!? or hasStart?!?
          if(this.mobile){
            console.log(`updateMinEndNowBtn..MOBILE::good?>>${hasStart}::${hasEnd}`,timey)
            this.showMobileDialog[entry] = !hasEnd //umm toTest if toggle too*** //false
          }
        }
        //ELSE for hasStart to SHOW enableBtn--TODO? OR just test above?** 
      }
    }
    reduceEvtDuration(evtID,duration){
      let evt =  this.findSchedEvent(evtID) //this.getSubGoalByID(evtID)
      if(!evt){ //umm shouldnt happen!!
        console.log(`ERROR:: reduceEvtDuration Evt not found!!!`, evtID)
        return
      }

      const now = parseDate(new Date())
      let starty = evt.start
      let endy = evt.end

      let newy = this.updateDetz({...evt, for:duration, duration:duration, end:now})
      this._dailyScheduled.set(evtID,newy)
      
      if(!this._endTimesSet.delete(endy.time)){ //should not happen..prolly
        console.log(`ERROR endTimesSet item does not exist?!?`,evt, this._endTimesSet)
      }

      this._endTimesSet.add(now.time)

      this.enableNoteScoreEdit(evtID, starty,now) //not much different than below but meh--just shows score edit immediately
      //this.updateEvtMinsEndNowBtns(evtID, starty,now)

      //just save schedule
      this.saveDaySchedule()

      return //undefined for not triggering confirm dialog
    }

    /*
    updateEvtMinsEndNowBtns(evtID, startTime,endTime){ //after endNow btn >> too convoluted... using enableNoteScoreEdit

      const now = parseDate(new Date())

      let compareTime = addToDate(now,{ minute: 0})
      let tTime = this.getTimeNumber(compareTime)

      let eStart = this.getTimeNumber(startTime)
      let eEnd = this.getTimeNumber(endTime)

      if (eStart !== false && eEnd !== false){

        let isTwix = (tTime >= eStart && tTime < eEnd) 
        //let hasEnded = eEnd >= tTime //&& tEnd <= eEnd) //umm what if it's just at the line though? >>gets included...so removing '=' for endTime..prolly others too but ToReview!!
        
        let hasEnded = tTime >= eEnd

        //let diffyEnd = diffTimestamp(eEnd, tTime) 
        //test to see if accurate! 
        //>> (diffyEnd > 0) >> so evt has NOT ended
        ////negative means it has ended...
        if (isTwix || hasEnded) {
          //console.log(`Evt:${evtID} > ongoing:${isTwix} or ended:${hasEnded}`) //, diffyEnd > 0, compareTime 
        }else{
          //console.log(`Evt:${evtID} Not started> ongoing:${isTwix} or ended:${hasEnded}`) 
        }

        if (isTwix){
            //console.log(`Evt:${evtID} >STARTED?`,isTwix)
            this.hasStarted[evtID] = true  
        }
        if(hasEnded){
          this.disableEvtScoreEdit(evtID, hasEnded) //should disableScore prolly
        }
      }else{
        console.log(`ERROR?!:${evtID} has no start/end?.`) //shouldnt happen?--toMonitor**
      }
    }*/
    canEndNow(evtID){
      let evt =  this.findSchedEvent(evtID)
      //let evtty =  this.findEvent(evtID)
      if(!evt){
        console.log(`ERROR canEndNow Evt not found!!!`, evtID)
        return false
      }
      const now = parseDate(new Date())

      //console.log(`canEndNow`, evtID,now, JSON.parse(JSON.stringify(evt)),JSON.parse(JSON.stringify(evtty)))

      
      let starty = evt.start
      let endy = evt.end
      if (!isBetweenDates(now, starty, endy, true)){
        console.log(`umm aint in the middle of this event! Nothing to do...canEndNow::ERROR?`,now.time, starty.time, endy.time)
        return false
      }
      
      let compareTime = addToDate(now,{ minute: 0})
      //let tTime = this.getTimeNumber(compareTime)
      //let diff = tTime - this.getTimeNumber(starty)

      //this seems better!
      let another = diffTimestamp(starty,compareTime) //,true flag to discard earlier evts!!!
      let newDura = Math.floor((another/1000)/60)

      
      console.log(`canEndNow:: ${evtID} duration from ${evt.for} to: ${newDura}`)//,another
      if (newDura < 10){ //less than 10 min since evt start--ask to remove
        return newDura
      }

      return this.reduceEvtDuration(evtID,newDura)

    }
    updateNoteScore(id,newScore,note=''){
      let ev = this.findSchedEvent(id) //this.dailyScheduled.get(id) //JSON.parse(JSON.stringify(f)))
      if (ev){
        let same = ev.score == newScore
        if(!same){
          //console.log('updateNoteScore::Score change',ev.atScore,ev.score) 
          Repo.doSaveEvtProp(id, null, newScore)
          ev.atScore = newScore //when saving schedule later...toSee
        }

        //let h = this.findEvent(id) //send changes down to child component...
        //if (h){
          ev.score = newScore //bon update score
        //}else{console.log('onSaveScore ERROR not found',h, id) }  //very baaad!--should return***
        
        if(note !==''){ //should check that notes havent changed too?--meh
          //console.log(`updateNoteScore::note ${id}from ${oldy} to ${newScore} with note>>`,note)
          ev.notes = note
          //h.notes = note //to update inner child
         
        }

       this.isViewingPast() ? this.saveDaySchedule() : this.toggleActionBtns(true,'updateNoteScore') //console.log(`updateNoteScore::not auto-saving today`,h,ev)
      }else {
        console.log(`ERROR ERROR::updateNoteScore could not find event ${id}?!?`) //this would be baaad! 
      }
    }
    addMinsToEvt(evtID,mins,doNotify=null){
        const allGood = (evt,newDura,newEndy) => {
          
          let oldEndy = evt.end
         
          let newy = this.updateDetz({...evt,for:newDura,duration:newDura, end:newEndy}) 
          
          this._dailyScheduled.set(evtID, newy)
          
          if(!this._endTimesSet.delete(oldEndy.time)){ //make sure as should not happen
            console.log(`ERROR endTimesSet item does not exist?!?`+oldEndy.time,evt, this._endTimesSet)
          }
  
          this._endTimesSet.add(newEndy.time)
  
          //save perhaps...prolly should!
          this.saveDaySchedule() //onAddMins

          return {
            overlaps:null,
            canContinue:true
          }
        }

      let evt =  this.findSchedEvent(evtID)

      if (!evt){
        console.log(`ERROR addMinsToEvt EVT not found!!!`, evtID)
        return
      }
      
        let endy = evt.end
  
        let newEndy = addToDate(endy,{ minute: parseInt(mins)})
        let newDura = parseInt(mins) + evt.for
  
        //console.log(`addMinsToEvt::(${evtID}) add ${mins} from ${evt.for} to> ${newDura}`,endy.time,newEndy.time) 
  
        let anyOverlap =  this.hasOverlappingEvent(evtID, evt.start, newEndy) //newDura
        let s = anyOverlap.length
        if (s > 0){
          console.log(`addMinsToEvt::OVERLAPS of size `+s,JSON.parse(JSON.stringify(anyOverlap)))
          let ret = {
            overlaps:this.massageSingleOverlapArr(anyOverlap),
            canContinue:false
          }
          
          if (s > 1){ //multiple---just return
            return ret
          }
          let inConflict = this.findSchedEvent(anyOverlap[0].inConflict) //findEvent
          if (!inConflict) {
            console.log(`addMinsToEvt::ERROR inConflict evt not found?!?`+s,anyOverlap[0].inConflict) //shouldnt happen!--unless type check--toMonitor**
            return ret
          }
          let askUser = inConflict?.inDefaults || !inConflict?.canMove
          //console.log(`addMinsToEvt::OVERLAPS>>askUser`,"default? "+inConflict?.inDefaults, "!canMove? "+!inConflict?.canMove,askUser,anyOverlap[0].targetStart.time)
          if(askUser){
            return ret
          }else{
            if(doNotify){ doNotify(`addMinsToEvt::${s} OVERLAPS..Forcing`)}
            //let e = this.findEvent(evtID)
            //for next conflict just auto-solve even if overlapped evt is in default!! Beware**
            this.recurChangeTime(anyOverlap[0].inConflict,{...evt,duration:newDura},anyOverlap[0].targetStart,false,doNotify) 

            //bon just go and return allGood() below....umm toReview** 
          }
        }
      return allGood(evt,newDura,newEndy)  
    }
    deleteEvtMood(id){ 
      if (this.usingMoods[id]){
        delete this.usingMoods[id]
        console.log(`deleteEvtMood::>> `+id)
        return
      }
      return
    }
    updateCurrentMoods(){
      for (let key in this.usingMoods){
        if (!this._dailyScheduled.has(parseInt(key))){ //this.actualEvts.find
          this.deleteEvtMood(key)
        }
      }
    }
    removeScheduledEvt(evt){//,rMood=false)

      //let currentSize = this.getAllEvts().size
    
      if (!evt){console.log("ERROR doRemove, NO evt to delete?!?", evt);return}

      //let i = 0
      //let found = false 
      //for( i; i < currentSize; i++){
        //if (this.actualEvts[i].id == evt.id) {
          //this.actualEvts.splice(i, 1)
          //console.log("REMOVED event spliced!", evt) //to see if has start/end. and not have to get/erase below...
          
          let toDel = null
          if(this._dailyScheduled.has(evt.id)){
            toDel = this._dailyScheduled.get(evt.id)
            this._dailyScheduled.delete(evt.id)
          }else{
            console.log("removeScheduledEvt ::> dailyScheduled has no such evt?@? ERROR", evt)
            return
          }

          if(toDel){ //also update scheduleSets
            let hadStart = this._startTimesSet.delete(toDel.start.time)
            let hadEnd = this._endTimesSet.delete(toDel.end.time)
            if (!hadStart || !hadEnd){
              console.log(`removeScheduledEvt ::> ERROR? scheduleSets has no such evt?@? start:${hadStart}...end:${hadEnd}`, toDel, evt.id + ' '+ evt?.title.trim()+' '+ evt?.details )
            }

            //if (rMood){ //todo** >> use this.deleteEvtMood() above and forgo rMood flag!!
              //console.log(`removeScheduledEvt::Mood Remove...`,this.usingMoods[evt.id])
            //  delete this.usingMoods[evt.id]
            //}
            this.deleteEvtMood(evt.id)
          }
          //break
        //}
      //}
    }
    addToBalance(evt){ //add to minus balance the duration of evt
      let balance = this.getCurrentBalance()
      let neB = balance - parseInt(evt?.duration) //gotta minus... should skip? if balance > 0  >> (cant 'store' balance for later...ToReview**)
      
      Repo.storeNewBalance(neB)
    }
    removeFromBalance(dura){ //for new evt to add to balance
      let balance = this.getCurrentBalance()
      let neB = balance + parseInt(dura)
      
      Repo.storeNewBalance(neB)
    }
    disableEvtScoreEdit(evtID, flag){
      this.isDisabledScoreEdit[evtID] = !flag

      this.mobileEnableScore[evtID] = flag  //normally inverse
    }
    enableNoteScoreEdit(evtID, startTime,endTime){
      const now = parseDate(new Date())
      let diffy = diffTimestamp(now,endTime)

      let compareTime = addToDate(now,{ minute: 0})
      let tTime = this.getTimeNumber(compareTime)

      //////canEnableEditScore/////
      if(diffy > 0){ //so evt has NOT ended
        this.isDisabledScoreEdit[evtID] = true   //disable scoreEdit

        this.mobileEnableScore[evtID] = false 
      }else { //negative so evt has ended
        this.hasStarted[evtID] = false  //umm bon hide when button when past as well

        if(this.mobile){
          this.showMobileDialog[evtID] = false
        }
        this.mobileEnableScore[evtID] = true

        this.isDisabledScoreEdit[evtID] = false //enable score edit
      }
      ////////enableEndNowBtn //////
      isBetweenDates(now, startTime, endTime, true) ? this.hasStarted[evtID] = true : this.hasStarted[evtID] = false
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

    doLog(mess,data) {
      console.log(mess, JSON.parse(JSON.stringify(data)))
    }
}
