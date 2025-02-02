import {
  addToDate,
  today,
  //parseTimestamp,
  //getDateTime,
  isBetweenDates,
  diffTimestamp,
  getDayTimeIdentifier,
  getTimeIdentifier, //should use this actually for overlap calc? toSee
  getDayIdentifier,
  parsed,
  parseDate,
  parseTime, 
} from '@quasar/quasar-ui-qcalendar/src/index.js'

import * as Repo from '../services/aRepository.js'

import { createEvent } from '../models/schedEvt.js'

import {LocNotifications} from '../notifHelper'; 
//import {PersistentNotification} from '../persistNotif';

import { whenFrmtTime,parseScore, pGColors,hexColor} from '../pages/util/utiFunc'

export default class daySchedule {
    /*
    data //= null //really doesnt like declared inner variables smh

    */

    constructor(onDate,isMobile) 
    {

      this.showReloadBtn = false
      this.showClearBtn = false
      //this.showLoadDefaults = true
      //this.showScoreBtn = true
      //this.showPrioBtn = true
      //this.showOneEachBtn = false
      
      this.showActionBtns = true //for all action Btns >> showOneEachBtn,showLoadDefaults,showScoreBtn,showPrioBtn

      this.disablePrioBtn = true  //to temp disable when selecting a new value...
      this.disableScoreBtn = true //same as above 
    
      this.disableSaveSchedule = true
      this.chosenScore = null
      this.chosenPrio = null

      this._dailyScheduled = new Map()  
      this._endTimesSet = new Set()
      this._startTimesSet = new Set()
  
      this.savedRawEvts = []

      this.unsavedChanges = false //easier logic for toggling saveScheduleBtn--toUse**
      this.dayWithDeleted = false //sheesh to help with above when enrichAddToSchedule encounters deleted goals smh

      this.usingMoods = {} //:ref({}),  //ref(null)

      this.isDisabledScoreEdit= {}  //should prolly rename to concise...
      this.hasStarted= {}//:ref({}),  //just for happening now..should combine with isDisabledScoreEdit var above!
      this.mobileEnableScore= {}//:ref({}), //reverse of isDisabledScoreEdit...mobile and should be dynamically set when touch-repeat....
      this.showMobileDialog= {}//:ref({}), //allowDialog // for showing mobile dialog still

      this.currentDate = onDate

      this.mobile = isMobile
            
      Repo.initialize() //if didnt do this would later access even work?!? prolly not?

      //console.log("NEW daySchedule>>",JSON.stringify(LocNotifications.getState()))
      
    }
    //showyReloadBtn(){ //works!
    //  return this.showReloadBtn
    //}
    allPGoals (){
      return Repo.allParentGoals()
    }
    fetchGoalsTree(){
      return Repo.constructTree()
    }
    getCurrentBalance(){
      //console.log('getCurrentBalance')
      return Repo.currentBalance()
    }
    getAllPrio(){
      return Repo.allPriorities()  //[1,2,3]//no need to do same for score Intervals
    }
    getSubGoals(){
      return Repo.allSubGoals()  //deepCopy?--done when retrieved from storage tho...toReview**
    }
    getAllEvts(){ //even those with no time
      return this._dailyScheduled
    }
    getScheduledEvts(){ //those with time
      let toRet = new Map()
      for (let [entry, val] of this._dailyScheduled) {
        if(val.start.time.indexOf('NaN') > -1){ //skip those with NOTIME
          //console.log('getScheduledEvts::NOTIME >>',val)
        }else{toRet.set(entry, val)}
      }
      //console.log('getScheduledEvts >>',toRet)
      return toRet
    }
    labelScheduled(){
      let all = this.getSubGoals().length
      let e = this.getScheduledEvts()
      let hasNoTime = this.getAllEvts().size - e.size
      
      return {sched: `Scheduled => ${e.size} out of ${all} Evts\n`, noTime: hasNoTime > 0 ? hasNoTime : null} //+" Evts Need manual addition!"
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
    actionBtnsEnabled() {
      return this.showActionBtns ////all action Btns in single place...
    }
    //to encapsulate btns access in single place!!
    //---doesnt seem needed either as can access variables and modify them outside smh
    getProps() {
      return {
        showReloadBtn:this.showReloadBtn,
        showClearBtn:this.showClearBtn, //:boolean; / //= false
        //showLoadDefaults:this.showLoadDefaults, //:boolean ; //= true
        //showScoreBtn:this.showScoreBtn, //:boolean ; //= false
        //showPrioBtn:this.showPrioBtn, //:boolean ; //= false
        //showOneEachBtn:this.showOneEachBtn, //:boolean ; //= false

        //the two below are redundant with change--toRemove**
        disablePrioBtn:this.disablePrioBtn, //:boolean ; //= true  //to temp disable when selecting a new value...
        disableScoreBtn:this.disableScoreBtn,//:boolean ; //= true //same as above 
        
        chosenScore:this.chosenScore, //:0 ; //= null
        chosenPrio:this.chosenPrio //:1 ; //= null
      }
    }
    saveBtnEnabled(){ //should use hasUnsavedChanges() below
      return this.disableSaveSchedule
    }
    hasUnsavedChanges(){
      //console.log("daySchedule::hasUnsavedChanges", this._dailyScheduled.size,this.unsavedChanges)
      let hasEvts = this.getEventsForDate(this.currentDate)
      let diff = (hasEvts && Object.keys(hasEvts).length != this._dailyScheduled.size && !this.dayWithDeleted) ?? false //not too much?!? >>wrong eval caused by deleted goals so this._dailyScheduled.size != rawSaved smdh >>also need nullish ?? when no schedule
      //console.log("daySchedule::hasUnsavedChanges", this._dailyScheduled.size,this.unsavedChanges,diff,this.dayWithDeleted) //Object.keys(hasEvts).length ?? 100
      //console.log("daySchedule::hasUnsavedChanges",this.unsavedChanges, diff)
      return this.unsavedChanges || diff //(cS && Object.keys(cS).length != this._dailyScheduled.size) //was prolly wrong >>(this.savedRawEvts && Object.keys(this.savedRawEvts).length != this._dailyScheduled.size)
    }
    getCurrentMoods(){
      return this.usingMoods
    }
    getSubGoalByID(id){ 
      let all = this.getSubGoals()
      //console.log('getSubGoalByID >>All',typeof(id),id)//,all)
      let numId = parseInt(id)//OH freaking type check!!smh--id should always be a number!!
      
      for(let i = 0; i< all.length;i++){
        if (all[i].id === numId) return all[i]  
      }
      return null
    }
    unscheduledDefaults(){
      let allG= this.getSubGoals()
      return allG.filter(evt => evt?.inDefaults && !this._dailyScheduled.has(evt.id)) //&& evt?.time != ''
    }
    unscheduledDefaultEvts(){ //for labeling + enable/disable of Default btn
      //let e = this.daSchedule.unscheduled()
      //let s = e.filter(evt => evt?.inDefaults).length //&& evt?.time != ''
      return this.unscheduledDefaults().length
    }
    unscheduled(){
      let allG= this.getSubGoals()
      return allG.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)
    }
    subGoalsOfParent(id) {
      let allG= this.getSubGoals()
      return allG.filter(evt => evt.parentGoal == id)
    }
    getOriginalEvtTime(id){ //to get original scheduled evt time!
      let evt = this.getSubGoalByID(id)
      return !evt ? "" : evt.time
    }
    getStoredRawEvt(id){
      if (!this.savedRawEvts){return null}
      if (id in this.savedRawEvts){ //todo** fix lookup //typeof(id)
        return this.savedRawEvts[id]
      }
      return null
    }
    availableEvtsToSchedule(){
      let sorty = (a, b) => { 
        if (a.parentGoal > b.parentGoal) return 1; 
        if (a.parentGoal == b.parentGoal) return 0; 
        if (a.parentGoal < b.parentGoal) return -1;
      }

      let avail = this.unscheduled()
      if(avail.length < 1){
        console.log('availableEvtsToSchedule >NO available on',this.currentDate,avail)
        return this.getSubGoals().sort(sorty)
      }
      return avail.sort(sorty)
    }
    getAlternatives(){
      let sorty = (a, b) => { 
        if (a.parentGoal > b.parentGoal) return 1; 
        if (a.parentGoal == b.parentGoal) return 0; 
        if (a.parentGoal < b.parentGoal) return -1;
      }

      return Repo.storedAlternatives().sort(sorty)
    }
    getEventsForDate(dt){
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
    schedEvtWithProps(evt,startAt,endAt){
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
      ret.end = endAt

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
      //let clone = structuredClone(evtGoal); //for deep clone with nested objects
      
      if (evtGoal.jeSuis && evtGoal.jeSuis.length > 0){
        clone.details = `Of '${pGoal.title.trim()}' :: << ${evtGoal.jeSuis.join(',')} >>`
      } else {
        clone.details = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(evtGoal?.time)} -> ${evtGoal?.duration}min -- ${evtGoal?.inDefaults ? 'Dft:':':'}${evtGoal?.canMove ? ':Mv:':':'}${evtGoal?.isAlternative ? ':Alt':':'}`
      }
     
      if ('byMood' in evtGoal){ //add moods!
        console.log(`doProppy::BYMOOD found!! `+clone.id, JSON.parse(JSON.stringify(evtGoal)))
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
    massageManyToOneOverlaps(oLaps){ //here merge for conflicts
      let euhOverlaps= []

        let sameTargett = () => { ////try to get only item[1] ...
          let ret = []
          oLaps.filter(item => {
            if (item[0] == "oneToMany") { ret.push(item[1]) }  //better? yep >>...spread if array
          })
          return ret
        }

      //let sameTarget = oLaps.filter(item => item[0] == "oneToMany")
      let properConf = oLaps.filter(item => item[0] != "oneToMany")
      let sameTarget = sameTargett()
      //this.doLog("massageManyToOneOverlaps::properConf",properConf)

      let samey = [] //oneToMany
      for(let i = 0; i < properConf.length; i++){
        let conflictEvt = properConf[i][0]
        let isTarget = sameTarget.some(item => item == conflictEvt) //sameTarget.some(item => {return item[1][0] == conflictEvt}) //huh works
        if (isTarget){
          samey.push(...properConf[i][1])
        }else{
          //manyToOne merge same inConflict
          let exist = euhOverlaps.find(item => item[0] == conflictEvt) //or some()?
          if (exist){
            let f = euhOverlaps.findIndex(item => item[0] == conflictEvt)
            //console.log("WOAH WOAH,massageManyToOneOverlaps same Conflict FOUND at: "+f,JSON.parse(JSON.stringify(exist)))//,JSON.parse(JSON.stringify(euhOverlaps)))
            euhOverlaps[f]= [conflictEvt, [...euhOverlaps[f][1], ...properConf[i][1]]] //exist[1] //gotta unfurl both 
          }else{
            euhOverlaps.push([conflictEvt, [...properConf[i][1]]])
          }
        }
      }

      //this.doLog("massageManyToOneOverlaps::SAMEYTARGET",samey)

      //in case didnt add nothing to euhOverlaps > could be oneToMany 
      ///>>and should return to not mess up array with below logic
      ///...prolly as proper when resolving conflicts later...
      if (euhOverlaps.length < 1 && samey.length > 0){
        this.doLog("massageManyToOneOverlaps::ONETOMANY!! returning original >> "+euhOverlaps.length+ " vs "+samey.length ,oLaps)
        return oLaps
      }

      //then add SameTargets --gotta add each at least once
      //inConf exist? skip : add
      if (samey.length > 0){
        this.doLog("massageManyToOneOverlaps::ADD SAMEY",samey)
        let current = null
        let added = [] //sheesh...//to confirm that all targets added at least once!!
        for(let i = 0; i < samey.length; i++){
          let t = samey[i]
          let exist = euhOverlaps.find(item => item[0] == t.inConflict)
          if (!exist){ //skip existing inConflict already present
            
          //}else{ //def ruins ordering tho...smh--toReview** >>umm COULD help reso as placed in the end? toSee**
            if(t.target != current){
              euhOverlaps.push([t.inConflict,[t]])
              added.push(t.target)
              //current = t.target  //could lead to below error? >>yup!
            }else{
              console.log("massageManyToOneOverlaps::INCONF same current target? ERROR?",current,t)
            }
          }
        }
        //now for proper oneToMany
        //let notAdded = samey.filter(item => !added.some(x => x == item.target))
        let notAddedK = sameTarget.filter(item => !added.some(x => x == item))
        //console.log("massageManyToOneOverlaps::NOTADDED",added,notAddedK)

        if (notAddedK.length > 0){
          let i = 0 
          do{
            let key = notAddedK[i]
            let toAdd = samey.filter(item => item.target == key) //filter by key
            console.log("massageManyToOneOverlaps::ADDING",key,toAdd)
            //let k = sameTarget.find(item => !added.some(x => x == item))
            euhOverlaps.push([key, [...toAdd]]) //should unshift instead? to solve first! toReview**

            if(euhOverlaps.find(item => item[0] == "oneToMany")){ //could happen?!? toMonitor***
              //let i = euhOverlaps.findIndex(item => item[0] == "oneToMany")
              console.log("WOAH WOAH massageManyToOneOverlaps::oneToMany already present?!!ERROR ",euhOverlaps)
              //euhOverlaps[i]= ["oneToMany", [...euhOverlaps[i][1],key]]
            }else{
              euhOverlaps.push(["oneToMany", key]) //could forgo array? toReview**
            }
          } while (++i < notAddedK.length)
        }
      }
      this.doLog("massageManyToOneOverlaps::RETURNING",euhOverlaps)
      return euhOverlaps

    }
    massageOneToMany(overlaps){ //here merge for targets

      let euhOverlaps= [] // oldie >> {} doesnt keep order...
      let sameTarget = {} // to keep track of targets >> oneToMany
      for(let i = 0; i < overlaps.length; i++){
        let toH = overlaps[i]
        //console.log("massageOverlaps",JSON.parse(JSON.stringify(toH)))
        let exist = euhOverlaps.find(item => item[0] == toH.inConflict)
        if (exist){
          let i = euhOverlaps.findIndex(item => item[0] == toH.inConflict)
          //console.log("WOAH WOAH,massageSingleOverlapArr FOUND at: "+i,JSON.parse(JSON.stringify(exist))) //JSON.parse(JSON.stringify(toH)),
          euhOverlaps[i]= [toH.inConflict, [...exist[1],toH]] 
        }else{
          //should make it obj? >>meh redundant >> {key:toH.inConflict, o: [toH]} 
          //euhOverlaps.push([toH.inConflict, [toH]])

          //or oneToMany
          if(!sameTarget[toH.target]) { 
            sameTarget[toH.target] = []
            sameTarget[toH.target].push(toH)
            euhOverlaps.push([toH.inConflict, [toH]]) //add here for new target...
          } else{ 
            let oneToManyExist= euhOverlaps.find(item => item[0] == "oneToMany")
            if(oneToManyExist){ //already encountered oneToMany elts
              let i = euhOverlaps.findIndex(item => item[0] == "oneToMany")
              let tIndex = euhOverlaps.findIndex(item => item[0] == toH.target)
              //this.doLog("WOAH WOAH massageOneToMany::oneToMany already present!! at "+i+" "+euhOverlaps[i][1],oneToManyExist) //euhOverlaps[i]
              
              // push new target
              euhOverlaps[tIndex]= [toH.target, [...euhOverlaps[tIndex][1],toH]]
              //add key if different >> console.log(`massageOneToMany::oneToMany present...skip`)
              toH.target == oneToManyExist[1] ? '' : euhOverlaps[i]= ["oneToMany", [euhOverlaps[i][1],toH.target]] //beware of second elt as array!!!
            }else{
              let last = euhOverlaps.pop() //pop last elt--toMonitor that proper
              //this.doLog(`massageOneToMany::Same Target for `+toH.target,last)//,JSON.parse(JSON.stringify(euhOverlaps)))
              euhOverlaps.push([toH.target, [...last[1],toH]]) //sndLast[1] //added one after other
              //oldie >> euhOverlaps.push(["oneToMany", [toH.target]])
              euhOverlaps.push(["oneToMany", toH.target])
            }

            //let last = euhOverlaps.pop() //pop last elt 
            //console.log(`massageOneToMany::Same Target for`+toH.target,last,JSON.parse(JSON.stringify(euhOverlaps)))
            //also second last? safe assumption BUT could be wrong..toMonitor** as harder to find target in euhOverlaps since in array...
            //assumption that only two>>fails with three evts...
            //let sndLast = euhOverlaps.pop()
            //toH == last[1] 
            //console.log("massageOneToMany::DELETED inConflicts",sndLast[0],last[0],JSON.parse(JSON.stringify(euhOverlaps)))//JSON.parse(JSON.stringify(sndLast)),JSON.parse(JSON.stringify(last)),JSON.parse(JSON.stringify(toH)))

            //euhOverlaps.push([toH.target, [...last[1],toH]]) //sndLast[1] //added one after other 
          }
        }
      }

      //",JSON.parse(JSON.stringify(euhOverlaps)),JSON.parse(JSON.stringify(overlaps)))
      //this.doLog("massageOneToMany::RETURNING",euhOverlaps)
      return euhOverlaps
    }
    //for generic add when it's reload by score/prio/defaults...
    addGoalsToSchedule(toAdd,checkOverlap){
      let euhOverlaps = [] //{}

      //sort for adding by earliest time...empty time is first
      //this.doLog("addGoalsToSchedule::doSortingByTime--BEFORE",toAdd)
      toAdd.sort(function(a, b){return parseTime(a.time)-parseTime(b.time)})
      //this.doLog("addGoalsToSchedule::doSortingByTime--AFTER",toAdd)

      toAdd.forEach((obj) => {
        let added = this.addToSchedule(obj,checkOverlap,false) //false to use proppy() as it's goal
        if(!added){
          console.log('addGoalsToSchedule:: ERROR Evt NOT added',added,checkOverlap, obj.id, obj.title,obj.time) 
          //could be present...should try and just update evt(in case changed time?) >>prolly smh
        }else{
          if(Array.isArray(added)){ //overlap!!!
            //this.doLog('addGoalsToSchedule::overlap for '+obj.id,added)

            //euhOverlaps.push(...added) //spread to use massageSingleOverlapArr //oldie when {} >> euhOverlaps[obj.id] = added
            let hasOneToMany = added.length > 1 && added.find(item => item[0] == "oneToMany") //find better to get array elt
            let ret = {e:obj, ov:added[0], oneToMany:hasOneToMany}
            euhOverlaps.push(ret) //{e:obj, ov:added[0]}
          }
        }
      })
      //this.doLog("addGoalsToSchedule...",euhOverlaps)
      return this.recheckOverlaps(euhOverlaps)//massageManyToOneOverlaps(euhOverlaps)
    }
    addToSchedule(evt,checkOverlap,useProp=false){//useProp flag to use schedEvtWithProps()
      if (! this._dailyScheduled.has(evt.id)){
        let startTime = addToDate(parsed(this.currentDate), { minute: parseTime(evt.time) }) 
        let endTime = addToDate(startTime, { minute: evt.duration })
        //evt.time == '' ? console.log("fixConflicts::addToSchedule...emptyTime",evt,startTime,endTime) : '' 
        //.time >> '00:NaN' ...should be skipped for hasOverlappingEvent even...todo***
        if (checkOverlap) {
          let oOth = this.hasOverlappingEvent(evt.id, startTime, endTime) //before add evt
          if(oOth.length > 0){
            return this.massageOneToMany(oOth) //oOth  //check for oneToMany...
          }
        }
        //evt.time == '' ? console.log("addToSchedule::NOTIME>> "+evt.title,isNaN(startTime),isNaN(startTime.time)) : ''  //isNaN(parseFloat("geoff"))
        //isNaN(startTime) && isNaN(startTime.time) are both true here!
        //BUT when re-assigned > become string so above aint true no more smh

        let eProp = useProp ? this.schedEvtWithProps(evt,startTime,endTime) : this.doProppy(evt,this.currentDate)
        eProp.sortTime = startTime
        //this.actualEvts.push(eProp)
        let add = {...eProp,
          //for: eProp.duration, //redundant
          start: startTime,
          end: endTime,
        }

        this._dailyScheduled.set(eProp.id, add)
        
        this._endTimesSet.add(endTime.time)
        this._startTimesSet.add(startTime.time)
    
        this.enableNoteScoreEdit(eProp.id,startTime,endTime)

        return true
      }else {
        console.log(`addToSchedule--NOT added! present?!!?`,checkOverlap,evt.title) 
        return false //checked at caller
      }
    }
    stillInSchedule(id){
      let inSched = this.findSchedEvent(id)
      let wasStored = this.getStoredRawEvt(id) //could be absent when added during scheduleBy
      //console.log(`stillInSchedule for ${id} ${!inSched ? "ERROR NOT IN?": "" }`,inSched, wasStored)
      //if inSched ==null > add it as in wasStored
      //if both null >> add default evt using this.getSubGoalByID(id)
      return {inSched: inSched,inStore: wasStored}
    }
    doSortingByTime(sched){
      let sorty = (a, b) => {//sort by earlier time--should be array
        let aT = parseTime(a[1].time)
        let bT = parseTime(b[1].time) 
        //let timeDiff = aT-bT  //`${timeDiff > 0 ? "DOWN": "UP"}` //so down is forward in time..prlly
        //console.log('sorty'+a[0],aT,bT,timeDiff)
        //if (timeDiff > 0) return -1
        //if (timeDiff == 0) return 0 
        //if (timeDiff < 0) return 1
        //x<y ? -1 : x>y ? 1 : 0;  //proper than the above...
        return aT < bT ? -1 : bT > aT ? 1 : 0
        
      }
      const sortable=[]

      for (let key in sched){
        sortable.push([key, sched[key]]);
      }

      //this.doLog("doSortingByTime---before",sortable)
      sortable.sort(sorty)
      this.doLog("doSortingByTime---After",sortable)

      return Object.fromEntries(sortable) //still ordered by key smh
    }
    anotherSorting(sched){ //more compact than above
      const sorted = Object.entries(sched)
      .sort(([, v1], [, v2]) => parseTime(v1.time) - parseTime(v2.time))
      //.reduce((obj, [k, v]) => ({ //to make back into object--same as wrapping with >> Object.fromEntries
      //  ...obj,
      //  [k]: v
      //}), {})
      //console.log("anotherSorting",sorted)
      return sorted
    }
    enrichAddToSchedule() {
     
      let euhOverlaps = [] //better for keeping order when added//{}
      let checkOverlaps = this.isViewingToday()

      console.log('enrichAddToSchedule',Object.keys(this.savedRawEvts).length,"overlapCheck:"+checkOverlaps,JSON.stringify(LocNotifications.getState())) //,JSON.parse(JSON.stringify(this.savedRawEvts)))
      
      //so order here by time--would help with overlaps..prolly..toTest** 
      let aSorted = this.anotherSorting(this.savedRawEvts)
      //let aSorted = this.doSortingByTime(this.savedRawEvts)
      //this.doLog("enrichScheduled:Sorting",aSorted)
      //for (let key in this.savedRawEvts) { //oldie
      for(let i = 0; i< aSorted.length;i++){
        //console.log('enrichAddToSchedule::key',key)
        //oldie >> let toH = this.savedRawEvts[key]
        let key = aSorted[i][0]
        let toH = aSorted[i][1]
        //console.log('enrichAddToSchedule::key',key,toH)
        //have to enrich raw with original goal first!
        //toH has rawSaved data that should overwrite/add to original goal...
        let originalG = this.getSubGoalByID(key) 

        //skip deleted evts--should review and try to save them for summary?!?--especially when have notes?!?
        if (!originalG) {
          console.log(`enrichAddToSchedule:: ERROR No goal found for key: ${key}...skipping!`)//,toH)
          this.dayWithDeleted = true
          continue
        }

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
            let hasOneToMany = added.length > 1 && added.find(item => item[0] == "oneToMany") //.find better than .some
            let ret = {e:c, ov:added[0], oneToMany:hasOneToMany}
            //let u = ...added[0] //huh complain about unfurl
            euhOverlaps.push(ret)
            //euhOverlaps.push(...added) //spread was needed to use 'massageManyToOneOverlaps' smh            
          }
        } 
      }

      //this.doLog("enrichAddToSchedule...",euhOverlaps)
      
      return this.recheckOverlaps(euhOverlaps) //this.massageManyToOneOverlaps(euhOverlaps)
    }
    recheckOverlaps(oLaps){ //to recheck overlaps for potential oneToMany..
      let toRet = []

        const findPrevious = (ov) => {
          let exist = toRet.find(item => item[0] == ov[0])
          if (exist){
            let j = toRet.findIndex(item => item[0] == ov[0]) //,m.length
            //console.log("WOAH WOAH,recheckOverlaps PREV FOUND at: "+j,JSON.parse(JSON.stringify(exist))) //JSON.parse(JSON.stringify(toH)),
            toRet[j]= [ov[0], [...exist[1],...ov[1]]] 
          }else{
            toRet.push(ov)
          }
          //return toRet? no need as keeps reference...
        }

      let encountered = null //to skip already seen...

      for(let i = 0; i< oLaps.length;i++){
        let elt = oLaps[i].e
        let overlap = oLaps[i].ov

        // skip if has multiple stuff already...could be already present oneToMany
        if(overlap[1].length > 1){
          this.doLog("recheckOverlaps::MULTI Overlaps!!...skipping"+elt.id,overlap) //overlap[1]
          if(oLaps[i].oneToMany){
            toRet.push(overlap)
            toRet.push(oLaps[i].oneToMany)
          }else{
            //could be manyToOne?!? toMonitor**
            this.doLog("recheckOverlaps::MULTI Overlaps!!...umm NOT oneToMany?!?ERROR?",oLaps[i])
            //prolly still push?
          }
          continue
        }

        //umm skip for multiple manyToOne...
        let m = oLaps.filter(item => item.ov[0] == overlap[0])
        if (m.length > 1){ //oneToMany should be false...toMonitor**
          oLaps[i].oneToMany ? this.doLog("recheckOverlaps::filter >>Multiple oneToMany?!?ERROR?"+elt.id+" "+overlap[0],m) : ''
          //this.doLog("recheckOverlaps::MANYTOONE? encountered "+elt.id+" "+overlap[0],m)

          //could skip potential oneToMany...
          //but avoid extra looping checks to find that oneToMany
          if (overlap[0] == encountered) {
            //this.doLog("recheckOverlaps::SKIPPING encountered "+elt.id+" "+overlap[0]+" "+encountered,m)
            continue
          }

          let f= 0
          do {
            findPrevious(m[f].ov)
          }while (++f < m.length)
          
          encountered = overlap[0]
          //this.doLog("recheckOverlaps...filter "+elt.id+" "+overlap[0],toRet)
          continue
        }
        
        let startTime = addToDate(parsed(this.currentDate), { minute: parseTime(elt.time) }) //huh could currentDate not be proper for next day?!? toTest**
        let endTime = addToDate(startTime, { minute: elt.duration })

        let oOth = this.hasOverlappingEvent(elt.id, startTime, endTime) //before add evt
        if(oOth.length > 0){
          if (oOth.length > overlap[1].length){ //has oneToMany 
            //console.log("recheckOverlaps::EXTRA for "+elt.id,m.length,JSON.parse(JSON.stringify(oOth)),JSON.parse(JSON.stringify(overlap[1])))
            toRet.push(...this.massageOneToMany(oOth)) //merge for oneToMany...
          }else{
            //console.log("recheckOverlaps::NOCHANGE "+elt.id,m.length,JSON.parse(JSON.stringify(oOth)),JSON.parse(JSON.stringify(overlap)))
            findPrevious(overlap)
          }
        }else{ //else? toMonitor** but shouldnt happen
          console.log("recheckOverlaps::ERROR>>hasOverlappingEvent no overlap?!?",elt.id,oOth)
        }
      }

      //this.doLog("recheckOverlaps...",toRet)
      return toRet
    }
    loadEvtsForDay(sameDay){
      if (!sameDay){
        this.resetSchedule(true) //first clear for new different date!
        this.unsavedChanges = false
        this.dayWithDeleted = false
      }

      //console.log('loadEvtsForDay--FOR date',d,this.currentDate,this.savedRawEvts)
      this.savedRawEvts = this.getEventsForDate(this.currentDate) //Repo.getDataForDate(this.currentDate)
      
      if (this.savedRawEvts){
        //this.doLog("loadEvtsForDay",this.savedRawEvts)
        let hasOverlaps = this.enrichAddToSchedule()
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
    onChangeViewDate(toDate){
      let sameDay = toDate == this.currentDate
      //console.log('onChangeViewDate >>',JSON.parse(JSON.stringify(this.currentDate)), toDate,noChange)
      this.currentDate = toDate
      this.enableActionBtns()
      
      return this.loadEvtsForDay(sameDay)
    }
    scheduleLater(doNotify=null){
      if(this.isViewingPast()){
        console.log('scheduleLater >>NOT IN PAST',this.currentDate)
        if (doNotify){doNotify(`scheduleLater::Nope in PAST '${this.currentDate}'`,'warning') }
        return
      }

      //if(this.isViewingToday()){
        let toSchedLater = []
        
        const now = parseDate(new Date()) //should be this.currentDate for future...
        //umm too much looping?!? toReview**
        this._dailyScheduled.forEach( (value, key, map) => {
          if(value.start.time.indexOf('NaN') > -1){////skip those without time
            //console.log("scheduleLater::NOTIME...skipped!",value.title,value.time,value.start.time)
          }else{
            let diffy = diffTimestamp(now,value.start)
            if(diffy > 0){ //evt has NOT started.
              //oldie >> toSchedLater.push(value)
              toSchedLater.push({...value, parent:this.parentGoalById(value.parentGoal)?.title})
            }
          }
        })

       LocNotifications.addPendingEvts(toSchedLater,this.currentDate)
       //console.log("addPendingEvts >>",JSON.stringify(toSchedLater))

       //avoid unnecessary plugin schedule call--toConfirm** that no pending in state?
       toSchedLater.length > 0 ? LocNotifications.scheduleLater() : '' //console.log("scheduleLater >> nothing to scheduleLater")

       if (doNotify){doNotify(`scheduleLater:: '${this.currentDate}' >> ${toSchedLater.length} `,'info') }
       
       console.log("scheduleLater >> #"+toSchedLater.length,JSON.stringify(LocNotifications.getState()))
      //}else{
        //should do in future?!? >> just push?!?  toReview**..
      //  console.log('scheduleLater >>IN FUTURE...what to do?!?',this.currentDate)
      //}
    }
    removeScheduledNotif(id){ //removing notification of removed evt
      LocNotifications.cancel(id) //toTest
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
      this.unsavedChanges = this.hasEventsForDate()
      this.showReloadBtn = false
      this.showClearBtn = false
      this.disableSaveSchedule = true
    }
    chosenScoreLabel() { 
      return this.chosenScore == null ? `By Score` : this.bySign.score ? `Score ${this.bySign.score.label} ${this.chosenScore}` : `Score <= ${this.chosenScore}`
    }
    chosenPrioLabel() { 
      return this.chosenPrio == null ? `By Priority` : this.bySign.prio ? `Prio ${this.bySign.prio.label} ${this.chosenPrio}` : `Prio == ${this.chosenPrio}` 
    }
    filterSchedToCurrentPrio(sign='equalTo'){
      let toRet = []
      this._dailyScheduled.forEach((value, key, map)=> {
        switch (sign) {
          case 'lesserThan':
            if(this.parentGoalById(value.parentGoal)?.priority <= this.chosenPrio){
              toRet.push(value)
            }
            break
          case 'equalTo':
            if(this.parentGoalById(value.parentGoal)?.priority == this.chosenPrio){
              toRet.push(value)
            }
            break
          case 'greaterThan':
            if(this.parentGoalById(value.parentGoal)?.priority >= this.chosenPrio){
              toRet.push(value)
            }
              break
          default: //toMonitor***
            console.log(`ERROR::filterSchedToCurrentPrio::UNKNOWN sign>>${sign} event added: ${value.title}`,this.chosenPrio)
            toRet.push(value)
        }
      })
      return toRet
    }
    calculatePrioEvts(sign='equalTo'){ //default Prio sign ==
      let reset = Repo.goalsByPriority(sign,this.chosenPrio) //oldie >> .goalsUpToScore
      let add = reset.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)

      //let add = this.getSubGoals().filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio).filter(x => !this.actualEvts.find(item => item.id == x.id)) //huh second filter work!!
      //let reset = this.getSubGoals().filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio) //reset with allEvts
      //let add = reset.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)) //add those not scheduled
      this.byPrio={
        prio:this.chosenPrio,
        toAdd:add,  //.length? >>nah used later 
        reset:reset, //oldie >> this.getSubGoals().length
        filter:this.filterSchedToCurrentPrio(sign)
      }
      //console.log(`calculatePrioEvts`, JSON.parse(JSON.stringify(this.byPrio)))
    }
    onChoosenPrio(e){ //redundant--toRemove**
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
    scheduleSamePrio(flag,skipOvCheck = false){
     
        const recalculate = (flag) =>{ //shouldnt get here but just in case--could also invoke calculatePrioEvts() --toMonitor**
          console.log(`scheduleSamePrio::RECALCULATE?!?`,flag,this.chosenPrio, this.byPrio)
          //let toRet = this.getSubGoals().filter(evt => this.parentGoalById(evt.parentGoal)?.priority == this.chosenPrio)
          let toRet = Repo.goalsByPriority('equalTo',this.chosenPrio)
          return flag == 'reset' ? toRet : toRet.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)
        }
      
      let toAdd = []

      //filter && overwrite replaces
      //add concats...
      if(flag == 'filter'){
        toAdd = this.byPrio ? this.byPrio.filter : this.filterSchedToCurrentPrio() //filterCurrent()
        this.resetSchedule() //byPrio
      } else { //flag == 'reset' || flag == 'add'

        if(this.byPrio){
          flag == 'add' ? toAdd = this.byPrio.toAdd : toAdd = this.byPrio.reset //; this.resetSchedule()
        }else{ //have to recalculate...which shouldnt happen!
          toAdd = recalculate(flag)
        }
          
        /*if(flag == 'add'){ //just add to schedule
          // filter out events that are already scheduled..not too expensive?
          toRet =  toRet.filter(x => !this.actualEvts.find(item => item.id == x.id))
        } else { //for reset schedule....
          this.resetSchedule(true) //byPrio
        }*/

        flag != 'add' ? this.resetSchedule() : '' //console.log(`scheduleSamePrio::No resetSchedule`,flag,toRet.length)
      }
      //console.log(`scheduleSamePrio::After ${flag} from size: ${this.actualEvts.length} to evts = ${toRet.length}`, JSON.parse(JSON.stringify(toRet)))
      
      if (toAdd.length < 1) {
        //console.log(`Empty for Priority == ${this.chosenPrio} :(`)
        //this.toggleActionBtns(false,'byPrio') //not here as filter could clear schedule...

        return {
          overlaps:null,
          canContinue:false,//for notify that empty
        }
      }

      let noTime = toAdd.filter(evt => evt.time == '')
      
      //add to schedule!
      let euhOverlaps = this.addGoalsToSchedule(toAdd,!skipOvCheck)//this.isViewingToday())
      let sizey = euhOverlaps.length //oldie >> Object.keys(euhOverlaps).length

      this.updateCurrentMoods()

      let added = toAdd.length - sizey - noTime.length

      this.toggleActionBtns(added > 0,'byPrio')
      this.unsavedChanges = added > 0
      
      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true,//true,
        added: added, //show how many added...might be redundant || wrong oneToMany in euhOverlaps array...
        noTime: noTime.length > 0 ? noTime.length : null
      }
      
    }
    filterSchedToCurrentScore(sign='lesserThan'){
      let toReload = []
      this._dailyScheduled.forEach((value, key, map) => {
        let daScore = parseScore(value.score)
        switch (sign) {
          case 'lesserThan':
            if (daScore > -1 && daScore <= this.chosenScore) {
              toReload.push(value)
            }
            break  //huh suprised break allowed in forEach
          case 'equalTo':
            if (daScore > -1 && daScore == this.chosenScore) {
              toReload.push(value)
            }
            break
          case 'greaterThan':
            if (daScore > -1 && daScore >= this.chosenScore) {
              toReload.push(value)
            }
            break
          default: //toMonitor***
            console.log(`ERROR::filterSchedToCurrentScore::UNKNOWN sign>>${sign} event added: ${value.title}`,value.score,this.chosenScore)
            toReload.push(value)
        }
      })
      return toReload
    }
    calculateScoreEvts(sign='lesserThan'){ //default sign <=
      let reset = Repo.goalsByScore(sign,this.chosenScore) //oldie >> .goalsUpToScore
      let add = reset.filter(x => !this._dailyScheduled.has(x.id)) //!this.actualEvts.find(item => item.id == x.id)

      this.byScore={
        score:this.chosenScore, //redundant but just to confirm still same later mayhaps...
        toAdd:add, //.length? >>nah used later 
        reset:reset,
        filter:this.filterSchedToCurrentScore(sign)
      }
      //console.log(`calculateScoreEvts`, JSON.parse(JSON.stringify(this.byScore)))
    }
    onScheduleBy(by,compareSign,value){ //score && prio with granular comparison choices
      //this.bySign = compareSign //save for later...umm could be confounded when different for score/prio? >>yup! moved down
      if(by == 'score'){
        this.bySign = Object.assign({},{...this.bySign, score:compareSign}) //have to put back into self...
        //this.bySign[by] = compareSign
        this.chosenScore = value
        this.calculateScoreEvts(compareSign.name)
        //console.log('onScheduleBy::'+by,this.bySign,this.byScore)
      }else{
        //this.bySign[by] = compareSign //dont work
        this.bySign = Object.assign({},{...this.bySign, prio:compareSign})
        this.chosenPrio = value
        this.calculatePrioEvts(compareSign.name)
        //console.log('onScheduleBy::'+by,this.bySign,this.byPrio)
      }
    }
    onChoosenScore(e){ //redundant--toRemove**
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
    scheduleByScore(flag,skipOvCheck = false){
      
        const recalculate = (flag) =>{ //shouldnt get here but just in case--could also invoke calculateScoreEvts() --toMonitor**
          console.log(`scheduleByScore::ERROR::RECALCULATE?!?`,flag,this.chosenScore, this.byScore)
          let toRet = Repo.goalsByScore('lesserThan',this.chosenScore) //oldie >> .goalsUpToScore
          return flag == 'reset' ? toRet : toRet.filter(x => !this._dailyScheduled.has(x.id))
        }

      let toAdd = []
     
      //filter && overwrite replaces
      //add concats 
      if(flag == 'filter'){
        toAdd = this.byScore ? this.byScore.filter : this.filterSchedToCurrentScore() //filterCurrent()
        this.resetSchedule() //byScore
      } else { //'reset' || 'add'
       
        if(this.byScore){
          flag == 'add' ?  toAdd = this.byScore.toAdd : toAdd = this.byScore.reset //; this.resetSchedule() //umm it does execute after..huh 
        }else{ //have to recalculate...which shouldnt happen!
          toAdd = recalculate(flag)
        }
        flag != 'add' ? this.resetSchedule() : '' //console.log(`scheduleByScore::No resetSchedule`,flag,toRet.length) //should keep moods still for reset flag! 

      }
      //console.log(`scheduleByScore::AFTER >>${flag} to some evts = ${toRet.length}`,JSON.parse(JSON.stringify(toRet)))
      
      if (toAdd.length < 1) {
        //this.toggleActionBtns(false,'byScore') //not here as filter could clear schedule...
        return {
          overlaps:null,
          canContinue:false, //for doNotify
        }
      }

      let noTime = toAdd.filter(evt => evt.time == '')

      //add to schedule!
      let euhOverlaps = this.addGoalsToSchedule(toAdd,!skipOvCheck)//this.isViewingToday())
      let sizey = euhOverlaps.length //oldie >> Object.keys(euhOverlaps).length
      
      this.updateCurrentMoods()

      let added = toAdd.length - sizey - noTime.length

      this.toggleActionBtns(added > 0,'byScore')
      this.unsavedChanges = added > 0

      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true, //true,
        added: added, //can be wrong with overlaps!!..umm filter?
        noTime: noTime.length > 0 ? noTime.length : null
      }

    }
    scheduleOneEach(flag,skipOvCheck = false,doNotify=null){
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
              //console.log(`scheduleOneEach::selectOneFromP...No subgoals for parentGoal`,value)
              if (doNotify){doNotify(`No Evt goal for Parent: '${value?.title}'`,'warning') }
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
              //console.log('scheduleOneEach::NO SUBGOAL for',key, value?.title)
              let hasSubs = this.subGoalsOfParent(value.id).length > 0  //know if have subgoals or already scheduled

             let mess = hasSubs ? `All goals for Parent: '${value?.title}' already scheduled` : `Parent: '${value?.title}' has No Goals :(`
             if (doNotify){doNotify(mess,hasSubs ? 'info': 'warning') } //`No Evt goal for Parent: '${value?.title}'`
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

      } else { //reset!
        this.resetSchedule() //oneEach
      
        //random...implicit that overwrite and no need to check 'notScheduled' ...

        toAdd = selectOneFromP(true) //**beware flag when false after resetSchedule()
        
      }

      //add to schedule!
      if (toAdd.length < 1) {
        console.log(`Empty for OneEach :(`)
        //this.toggleActionBtns(false,'oneEach')

        return {
          overlaps:null,
          canContinue:false,
        }
      }

      let noTime = toAdd.filter(evt => evt.time == '')

      let euhOverlaps = this.addGoalsToSchedule(toAdd,!skipOvCheck)//this.isViewingToday())
      let sizey = euhOverlaps.length //oldie >> Object.keys(euhOverlaps).length

      this.updateCurrentMoods()

      let added = toAdd.length - sizey - noTime.length
      this.toggleActionBtns(added > 0,'oneEach') //true //(sizey > 0)
      this.unsavedChanges = added > 0
      return {
        overlaps:euhOverlaps,//null,
        canContinue:sizey > 0 ? false : true,//true,
        added: added,  //show how many added...could be misleading with overlaps!!
        noTime: noTime.length > 0 ? noTime.length : null
      }

    }
    scheduleByMood(toAdd){
      let toReload = []
  
      for(let i = 0; i < toAdd.length; i++){
        
        let local = this.getSubGoalByID(toAdd[i].id) //this.getLocalEvt(toAdd[i].id)
        //console.log(`scheduleByMood>>>local>>`,local)
        if (local){ //&& local.time != ''
          //console.log(`scheduleByMood>>>local>>`,toAdd[i],local)
          toReload.push(local)
          this.usingMoods[toAdd[i].id]=toAdd[i]?.mood  //umm add already here?!? hard to undo in case of overlaps smh---toTest**
        }
      }

      if (toReload.length < 1) {
        this.doLog(`scheduleByMood::Error? as Empty Moods with toAdd `,toAdd)
        //this.toggleActionBtns(false,'ByMood')
        return {
          overlaps:null,
          canContinue:false, //for notify
        }
      }

      let noTime = toReload.filter(evt => evt.time == '')

      let euhOverlaps = this.addGoalsToSchedule(toReload,this.isViewingToday())

      let sizey = euhOverlaps.length //oldie >> Object.keys(euhOverlaps).length
     
      //no toggleBtns if overlaps
      sizey > 0 ? '' : this.toggleActionBtns((toReload.length - sizey > 0),'ByMood') //console.log(`scheduleByMood overlaps!! Try reload= ${toReload.length} with overlaps =${sizey}`) : this.toggleActionBtns((toReload.length > 0),'ByMood')

      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true,//true,
        added: toReload.length, //might be redundant...
        noTime: noTime.length > 0 ? noTime.length : null
      }
    }
    scheduleDefaults(flag,skipOvCheck = false){
  
      let dEvts = [] 

      if(flag == 'add'){
        dEvts = this.unscheduledDefaults()
      }else{
        this.resetSchedule() //byDefaults
        dEvts = this.unscheduledDefaults()
      }

      this.showReloadBtn = this.hasEventsForDate()
      this.showClearBtn = !this.isViewingPast() && dEvts.length > 0
      
      let noTime = dEvts.filter(evt => evt.time == '')

      let euhOverlaps = this.addGoalsToSchedule(dEvts,!skipOvCheck)//this.isViewingToday())
      let sizey = euhOverlaps.length //Object.keys(euhOverlaps).length
    
      let added = dEvts.length - sizey - noTime.length

      this.updateCurrentMoods() //just in case...with resetSchedule() above

      this.toggleActionBtns(added > 0,'defaults') 
      this.unsavedChanges = added > 0
      //this.disableSaveSchedule = !(dEvts.length > 0) //false
      
      //this.reset() //nah could have other settings like onScore/Prio.
      return {
        overlaps:euhOverlaps,
        canContinue:sizey > 0 ? false : true,//true
        added: added,
        noTime: noTime.length > 0 ? noTime.length : null
      }
  
    }
    onPickEvent(addE,timey,doForce,useBalance,doNotify=null){

        const allGood = () => {
          //only balance without overlaps for now--
          if (useBalance){
            this.removeFromBalance(addE?.duration) //duration should be present**
            console.log("onPickEvent...useBalance","force?"+doForce)
          }

          let anyO = this.addToSchedule({...addE,time:timey.time},false)
          if(!anyO){ //prolly exists already
            console.log("onPickEvent::ERROR>>NOT added>exists?",addE?.title,anyO)
            if (doNotify){doNotify(`${addE?.title} already scheduled :(`,'warning') }
            return {
              overlaps:null, //or anyO ? >> toSee**
              canContinue:true,
            }
          }
          
          this.unsavedChanges = true 

          //this.toggleActionBtns(true,'onPickEvt')
          if(this.isViewingPast() || useBalance){
            if (doNotify){doNotify(`onPickEvent::Added ${addE?.title}...Saving schedule`,'info') }
            this.saveDaySchedule()
          }else{
            this.toggleActionBtns(true,'onPickEvt')
          } 

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
        console.log(`onPickEvent::OVERLAPS!!`+s,"with force "+doForce,JSON.parse(JSON.stringify(anyOverlap)))//todo** check !surrounding....
        let massgd =  this.massageOneToMany(anyOverlap)
        //s = massgd.length //for new... or leave ? toTest**
        let ret = {
          overlaps: massgd, //this.massageOneToMany(),
          canContinue:false,
        }

        if (s > 1 || !doForce){ //multiple>>oneToMany or no force flag---just return for user to handleOverlap
          return ret
        }

        if (doNotify){doNotify(`onPickEvent:: ${s} OVERLAPS! Forcing...`,'info') }
        
        this.toggleActionBtns(true,'onPickEvt')
        //let i = 0
        //do {
        //  this.recurChangeTime(anyOverlap[i].inConflict,addE,timey,true,doNotify)
        //} while (++i < s)

        for (let l = 0; l < s; l++){
          let toH = massgd[l][1] //anyOverlap //toTest**
          let i = 0
          do {
            //extra evts could be problematic!!--toReview**
            this.recurChangeTime(toH[i].inConflict,addE,timey,true,doNotify)
          }while (++i < toH.length)
        }

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
          if (useBalance || this.isViewingPast()){
            this.removeFromBalance(toAdd?.duration) //duration should be present**
            console.log("onAdHocEvent...using Balance",toAdd?.duration)

            //just save when balance
            this.saveDaySchedule()
            if (doNotify){
              doNotify(`New adHoc Evt!! Saving Schedule ${useBalance ? 'with new balance':''} ....`,'positive')
            }
          }else{
            this.unsavedChanges = true
            if (doNotify){
              doNotify(`New adHoc Evt added!! ...doSave eh`,'info') //
              this.toggleActionBtns(true,'onAdHoc')
            }
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
        //this.doLog(`onAdHocEvent::Overlaps!!`,euhOverlaps) //JSON.parse(JSON.stringify(euhOverlaps) 
        let ret = {
          overlaps: euhOverlaps,
          canContinue:false,
        }

        let s = euhOverlaps.length
        if (isArray && s > 1){ //wrong logic--but works for oneToMany...
          return ret
        }

        //force Add when single overlap
        if (isArray && s == 1){
          if (doNotify){
            doNotify(`onAdHocEvent:: ${s} OVERLAPS! Forcing...`,'warning')
          }
          for (let l = 0; l < s; l++){ //hopefully no oneToMany...toTest***
            let toH = euhOverlaps[l][1]
            let i = 0
            do {
              this.recurChangeTime(toH[i].inConflict,newey,timey,true,doNotify)
            }while (++i < toH.length)
          }

          return allGood(newey)
        }
        return ret  //just in case--should?**
      }

      return allGood(newey)
    }
    addMinsToEvt(evtID,mins,doNotify=null){
        const allGood = (evt,newDura,newEndy) => {
          
          let oldEndy = evt.end
         
          let newy = this.updateDetz({...evt,duration:newDura, end:newEndy})  //for:newDura,
          
          this._dailyScheduled.set(evtID, newy)
          
          if(!this._endTimesSet.delete(oldEndy.time)){ //make sure as should not happen
            console.log(`ERROR endTimesSet item does not exist?!?`+oldEndy.time,evt, this._endTimesSet)
          }
  
          this._endTimesSet.add(newEndy.time)
  
          if(doNotify){ doNotify(`${mins} mins added to '${evt?.title}' Saving...`,"info")}
          
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
      let newDura = parseInt(mins) + evt.duration //for
  
      //console.log(`addMinsToEvt::(${evtID}) add ${mins} from ${evt.for} to> ${newDura}`,endy.time,newEndy.time) 
  
        let anyOverlap = this.hasOverlappingEvent(evtID, evt.start, newEndy) //newDura
        let s = anyOverlap.length
        if (s > 0){
          //console.log(`addMinsToEvt::OVERLAPS of size `+s,JSON.parse(JSON.stringify(anyOverlap)))
          return { //just return
            overlaps:this.massageOneToMany(anyOverlap),
            canContinue:false
          }
          
          /*if (s > 1){ //multiple---just return
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
          }*/
        }
      return allGood(evt,newDura,newEndy)  
    }
    saveNewGoal(timeStart,goalTitle, parentGoal, own, duration){
     
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
              console.log("ERROR? no pID", pId)//could be 0!!! smh
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
  
      //let AllColors = pGColors()
      let available = pGColors().filter(item => !currentArr.some(c => c == item))
  
      //let sizey = currentArr.length

      //console.log(`addParentGoal::bgcolor>>available`,sizey,available)
      //let newy = null
      if (available.length > 1) {
        let i = Math.floor(Math.random() * available.length)
        let newy = available[i]
        console.log(`addParentGoal::bgcolor..index ${i} from ${color} to:`,newy)
        color = newy //? newy : color
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
    recurChangeTime(overlappedEvtID, tEvt, targetTimestamp,doAdd = false,doNotif=null) {
      let overlappedEvt = this.findSchedEvent(overlappedEvtID)
      if (overlappedEvt){
   
        //direction of drag(up or down) >>either - or + 
        let dragTimeInterval = parseTime(overlappedEvt.start.time) - parseTime(targetTimestamp.time)
        
        let dName = `${dragTimeInterval > 0 ? "DOWN": "UP"}` //so down is forward in time..prlly
        
        //console.log(`${overlappedEvtID} of dura: ${overlappedEvt.for} moving <> ${dName} due to evt:${tEvt.id} of dura:${tEvt.duration} at ${targetTimestamp.time}...doAdd:${doAdd} and skipAsk:${skipAsk}`) //overlappedEvt
  
        //tEvt.time >> original Evt time but the targetTimestamp.time >> WHEN it should be scheduled at
  
        let overlappedEvtNew = null
        if (dragTimeInterval >= 0 ) { // umm removal of = ?
          overlappedEvtNew= addToDate(targetTimestamp, { minute: parseInt(tEvt.duration) + 10 }) // add of extra 10 minutes for separation>>could prolly lead to more overlaps!
          let alternative = addToDate(targetTimestamp, { minute: parseInt(overlappedEvt.duration) + 10 })//overlappedEvt.for might be too much...
          console.log(`recurChangeTime::START>>(${overlappedEvtID}) '${overlappedEvt?.title}' ${overlappedEvt?.duration} mins going FORWARD ${dName} for ${dragTimeInterval} due to evt:(${tEvt.id})${tEvt?.title?.trim()} at ${targetTimestamp.time} 
          \n doAdd?:${doAdd} >`, JSON.parse(JSON.stringify(overlappedEvtNew.time)), 'alt:',alternative.time)
          //should use the closer time...avoid multiple overlaps later..
          let diffy = diffTimestamp(alternative,overlappedEvtNew)
          if(diffy > 0){ //so overlappedEvtNew is later...use alternative perhaps? >> nah could sometimes add evt too close and have another overlap!! --especially during CASCADING timechange
            let bo = Math.floor((diffy/1000)/60)
            if (bo <= dragTimeInterval){ //toSee if would help with proper timechange during cascading...>so far so good! >>except for large evts in the else!!
              console.log(`recurChangeTime::(${overlappedEvtID}) duration: ${overlappedEvt.duration} vs Target evtDura:${tEvt.duration}...USING overlappedEvtNew ${overlappedEvtNew.time}!! ${bo} <= dragInterval ${dragTimeInterval} `,alternative.time)
            } else {
              console.log(`recurChangeTime::DIFFY = ${diffy} and ${bo} >= dragInterval ${dragTimeInterval}...\nCOULD USE ALTERNATIVE as duration:${overlappedEvt.duration} vs evtDura:${tEvt.duration}`,overlappedEvtNew.time,alternative.time)  //negative means alternative is worse and should use overlappedEvtNew
              //overlappedEvtNew = alternative 
              //above doesnt work well for large evts which lead to infinite cascading!! >>testing so far shows best NOT to use....toMonitor**
              //minimize cascading though for smaller duration?!?
              //umm doesnt work for surrounding DEF!!
              //not use when evtDura:${tEvt.duration} > bo (as larger evt) otherwise could use alternative?
              //or dragTimeInterval < overlappedEvt.for ? no change || use alt? ...umm dragTimeInterval seem less ad its the if... smh
              //or evtDura:${tEvt.duration} - ${overlappedEvt.for} <= bo ? use alternative?
              //or when dragTimeInterval == 0 >use alt?
              dragTimeInterval == 0 ? overlappedEvtNew = alternative : console.log(`recurChangeTime::NOT USING ALTERNATIVE`,alternative.time)
            }
          }
        } else {//remove instead of add.
          overlappedEvtNew = addToDate(targetTimestamp, { minute: -(parseInt(overlappedEvt.duration) + 10)})
          let alternative = addToDate(targetTimestamp, { minute: -(parseInt(tEvt.duration) + 10) })
          console.log(`recurChangeTime::START>>(${overlappedEvtID}) '${overlappedEvt?.title}' going BACKWARD ${dName} for ${dragTimeInterval} due to evt:(${tEvt.id})${tEvt?.title?.trim()} at ${targetTimestamp.time}
          \n doAdd?:${doAdd}`, overlappedEvtNew.time, 'alt:'+alternative.time) //'diffy='+diffy

          let diffy = diffTimestamp(alternative,overlappedEvtNew) 
          let bo = diffy > 0 ? Math.ceil((diffy/1000)/60) : 0
          console.log(`recurChangeTime::BACKWARD ${dName} for ${dragTimeInterval}`,bo)
          //toSee about using alternative>>but nah
        }
  
        //check if !this.tooClose to midnight as ends up in infinite loop
        if(this.pastMidnight(overlappedEvtNew,overlappedEvt.duration)){
          if (doNotif){doNotif(`'${overlappedEvt?.title}' bleeds PAST Midnight ${dName} for ${dragTimeInterval}...Returning!!`)}
          return
        }

        let anyOtherOverlap = this.hasOverlappingEvent(overlappedEvtID, overlappedEvtNew,addToDate(overlappedEvtNew, { minute: overlappedEvt.duration})) // overlappedEvt.for)
        let sizey = anyOtherOverlap.length
        if(sizey > 0) {
          //console.log(`WARNING WARNING::Extra Overlaps of ${sizey} for OVERLAPPED ${overlappedEvtID} at ${overlappedEvtNew.time}`, anyOtherOverlap)
          let i = 0
          
          //let draggy = this.findEvent(overlappedEvtID) //this.getScheduledEvent(overlappedEvtID)
  
          //console.log(`Cascading time change moving (${overlappedEvtID})'${overlappedEvt?.title}' ${overlappedEvt?.time} due to ${doAdd ? "Adding":"Moving"} ${tEvt.id}-'${tEvt?.title?.trim()}'`) //: console.log(`ERROR::recurChangeTime ${overlappedEvtID} not found`) //umm return?
  
          //too many notifs estiii
          //if (doNotif){doNotif(`Cascading ${sizey} Overlaps >> '${overlappedEvt?.title}' going ${dName} as ${doAdd ? "Adding":"Moving"} '${tEvt?.title?.trim()}'`)} //(${overlappedEvtID})

          do {
            console.log(`CASCADING OVERLAPPED >> ${i} (${overlappedEvtID}) at: ${overlappedEvtNew.time} now at: ${overlappedEvt.start.time} till ${overlappedEvt.end.time}`,anyOtherOverlap[i]) //overlappedEvt.for
            //should prolly skip when seeing own self?!?--toMonitor**
            //should def break or goes in an infinite loop!!--when seeing original evt...
            if(anyOtherOverlap[i].inConflict == tEvt.id){
              console.log(`EUUUH...ERROR::recurChangeTime::self overlap?!?OVERLAPPED:${overlappedEvtID} ...break `+i,sizey, anyOtherOverlap[i].inConflict,tEvt.id) // anyOtherOverlap[i]
              break  //not break causes too many recursions...
            }
            //skipAsk should be true as recursion implicitly force schedule change--instead of using passed in.
             //, doAdd flag default to false as no needed for add with cascading timeChange of scheduled evts
            this.recurChangeTime(anyOtherOverlap[i].inConflict,overlappedEvt,overlappedEvtNew,false,doNotif) 
            
          } while (++i < sizey)
        }

        this.changeEvtTime(overlappedEvt, overlappedEvtNew)
        //console.log(`recurChangeTime::OVERLAPPED (${overlappedEvtID}) '${overlappedEvt?.title}' >> ${dName} to ${overlappedEvtNew.time} >> DONE!!`)

        let draggedNewTime = targetTimestamp //(dragTimeInterval > 0 || goForward) ? addToDate(targetTimestamp, { minute: 0 })
                              //                      : addToDate(targetTimestamp, { minute: 0 }) 
        
        //the evt doing displacement stays the same.
        //console.log(`recurChangeTime::${doAdd ? "Adding":"Moving"} TARGET>>(${tEvt.id})${tEvt?.title?.trim()} >> ${draggedNewTime.time}`) 
        
        if(!doAdd){
          this.changeEvtTime(tEvt,draggedNewTime)
          return
        }
        //add to schedule--still check overlaps with this.isViewingToday())
        let conflicts = this.addToSchedule({...tEvt,time:draggedNewTime.time},this.isViewingToday()) //false
        if(conflicts.length > 0) { //oldie >> Object.keys(conflicts).length
          this.doLog(`recurChangeTime::TARGET extra OVERLAP ${doAdd ? "Adding":"Moving"} ${tEvt?.title?.trim()}`,conflicts) //JSON.parse(JSON.stringify(conflicts))
          
          let hasOneToMany = conflicts.find(item => item[0] == "oneToMany")
          if (hasOneToMany){
            conflicts = conflicts.filter(item => item[0] != "oneToMany") //filter out
            this.doLog(`recurChangeTime::TARGET::WITHID!!!Now>>`,conflicts.length)
          }

          if (doNotif){doNotif(`EXTRA ${conflicts.length} OVERLAPS ${hasOneToMany ? "::OneToMany::":""} Adding TARGET ${tEvt?.title?.trim()}`)} //${dName}

          
          //for (let l = 0; l < conflicts.length; l++) 
          let sizey = conflicts.length
          let i = 0
          do { // //when as {} >>for (let key in conflicts)
            //if(conflicts[l][0] == "oneToMany"){ //!toH[0] //oneToMany...OR try to go from end as well to use hasWithID below?
            //  console.log(`recurChangeTime::TARGET ONETOMANY OVERLAP >> SKIPPING...`,conflicts[l])
              //continue
            //}

            let toH = conflicts[i][1] //oldie >> conflicts[key]
            //huh seems ok oneToMany below....toMonitor
            let j = toH.length - 1
            for (; j >= 0; j--) { //better start from end...in case of surrounding?..toSee***
              //console.log(`recurChangeTime::TARGET CASCADING OVERLAP: ${tEvt.id}-${tEvt?.title} at: ${draggedNewTime.time}`,toH[j].targetStart,toH[j].direction) 
              //should prolly skip when seeing own self?!?--toMonitor**could happen with oneToMany conflicts!!
              //should def break or goes in an infinite loop!!--when seeing original evt...
              if(toH[j].inConflict == tEvt.id){ //should check hasoneToMany flag!!
                console.log(`EUUUH...::recurChangeTime::TARGET>>OVERLAP::self overlap?!?...breaking!`, toH[j].inConflict, tEvt.id,toH[j].targetStart) 
                break  //continue instead?
              }
              this.recurChangeTime(toH[j].inConflict,tEvt,draggedNewTime,doAdd,doNotif) //doAdd flag?          
            }
          } while (++i < sizey)
        }
      } else{
        console.log("recurChangeTime::ERROR ERROR >> overlapped event not found!","doAdd? "+doAdd, overlappedEvtID,tEvt)
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
          let oDirection = this.checkOverlapByTime(targetStart,targetEnd,value.start,value.end,evID) //`${evID}->${key}`
          if (oDirection){
            //console.log(`OverlappingConflict ${evID} en "${oDirection}" of evt:${key} at`,value.start.time)//tStartAt value
            // duration, tStartAt, tEndsAt, value.start, value.end
            //if (this._startTimesSet.has(targetStart.time)){console.log(`hasOverlappingEvent ${evID} same start`,targetStart.time)}
            //could add hasSameStart prop below?---toSee** if needed!
            mappyA.push({ 
              target:evID,
              targetStart:targetStart,
              direction:oDirection,
              inConflict:key //toRename? and make clear that inConflict is already scheduled!!
            })
          }
        }
      })
  
      return mappyA
    }
    checkOverlapByTime(tStart, tEnd, eStart, eEnd,id){
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
        //return 'bas'  //so target is LATER than scheduled evt
        dir = 'bas'
      } 
      if (targetEnd > schedEvtStart && targetEnd < schedEvtEnd){ // overlap right ...>> effects of removing '=' as above (evts can be next to each other!!)
        //return 'haut'  //so target is EARLIER than scheduled evt..
        dir = 'haut'
      }
      let surrounding = (schedEvtStart >= targetStart && targetEnd >= schedEvtEnd)
      let surrounded = (targetStart >= schedEvtStart && targetEnd <= schedEvtEnd)//have to also check opposite!!!
      //if((evtStart >= targetStart && targetEnd >= evtEnd) || (targetStart >= evtStart && targetEnd <= evtEnd)){ 
      if(surrounding || surrounded){ 
        dir = 'surrounding' //no need to distinguish...
        //toReview** as target is surrounded by scheduled evt!
        //surrounded ? console.log("::checkOverlapByTime::"+id,"surrounding:"+surrounding,"surrounded:"+surrounded) : ''
      }
      
      return dir //false
    }
    canDropEvent(targetDrop, draggedItem){
      
      let tEndsAt = addToDate(targetDrop, { minute: draggedItem.duration})
      
      let anyOverlap =  this.hasOverlappingEvent(draggedItem.id, targetDrop,tEndsAt)
      
      if (anyOverlap.length > 0){
        //this.doLog("canDropEvent:Overlaps= "+anyOverlap.length,anyOverlap)
        return {
          overlaps:this.massageOneToMany(anyOverlap),
          canContinue:false,
        }
      }
      
      //this.toggleActionBtns(true,'canDropEvent') //could have no change...

      return {
        overlaps:null,
        canContinue:true
      }
    }
    toggleActionBtns(evtNumAdded,from){ //for toggle after default/oneEach, pick/adhoc,score/prio scheduling...(reload & clear)?
      //'from' flag can be switched for some btns that shouldnt change...redundant though--toRemove**

      this.disableSaveSchedule = !evtNumAdded //false
      this.showReloadBtn = this.hasEventsForDate() && evtNumAdded
      this.showClearBtn = !this.isViewingPast() && evtNumAdded //true  //evtNumAdded == dEvts.length > 0
      
      //for addNew
      from == 'addNew' ? this.unsavedChanges = evtNumAdded : '' //console.log("toggleActionBtns:: NOT changing unsavedChanges > "+from,evtNumAdded)
    }
    resetChosen(){ //explicit reset of dropdown values for score & prio
      this.chosenScore = null
      this.chosenPrio = null

      this.bySign = null
    }
    enableActionBtns(){
      let inPast = this.isViewingPast()
      
      this.showActionBtns = inPast ? false : true
      
      //oldie
      //this.showOneEachBtn = inPast ? false : true
      //this.showLoadDefaults = inPast ? false : true
      //this.showScoreBtn = inPast ? false : true
      //this.showPrioBtn = inPast ? false : true
    }
    pastMidnight(timey, duration){
      let compareTime = addToDate(timey,{ minute: 0})
      //let tTime = this.getTimeNumber(compareTime)
      
      let e = addToDate(timey, { day: 1}) //this proper to use next day's
      let midnightiey = new Date(e.date)
      
      midnightiey.setHours( 24 )
      midnightiey.setMinutes( 0 )
      midnightiey.setSeconds( 0 )
      midnightiey.setMilliseconds( 0 )
      
      let middy = parseDate(midnightiey)
      
      let isClose = Math.floor((diffTimestamp(compareTime,middy)/1000)/60)  //minutes till midnight
      
      if (isClose < duration) {//so when isClose < duration, then would bleed into next day!!--Dont allow!!!
        console.log("pastMidnight eh...:(",isClose) // e, midnightiey
        return true 
      }
      return false
    }

    tooClose(timey, duration){ //too close to other evt--within 10min OR near end of day and could go into next...

      /*let compareTime = addToDate(timey,{ minute: 0})
      let tTime = this.getTimeNumber(compareTime)
      let eTime = this.getTimeNumber(addToDate(compareTime, { minute: duration })) //this.getTimeNumber(compareTime)
      
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
      }*/

     if(this.pastMidnight(timey, duration)){
      return true 
     }
     
     //todo** should put rest below into another method to be explicit
     //also checks overlaps in one go

      let compareTime = addToDate(timey,{ minute: 0})
      let tTime = this.getTimeNumber(compareTime)

      let endCompareTime = addToDate(compareTime, { minute: duration })
      let eTime = this.getTimeNumber(endCompareTime)
      
      //diffTimestamp(now,endTime) //endTimes < now would be that evt hasnt ended! 
      //let toRet = false
      let tooClose = []
      let overlaps = []
  
      //check scheduled higher than timey BUT very close..
      //umm only start tho?!? huh..toReview**
      this._dailyScheduled.forEach((value, key, map)=> {
        let eStart = this.getTimeNumber(value.start)
        let eEnd = this.getTimeNumber(value.end)
        
        let diff = eStart - tTime
        let another = diffTimestamp(compareTime,value.start) //,true flag to discard earlier evts!!! //using timey is same!
        let bo = Math.floor((another/1000)/60)
  
        if (bo <= 10 && diff > 0){ //have to use duration to discard those in past? >>nah could just check negative!!
          console.log("tooClose...:("+key,diff,another,bo)
          //toRet = key  //meh overwrites but oh well!
          tooClose.push(key) //bon use array
        }
        //start is later than Scheduled end OR end is earlier than scheduled start
        let hasEndedOrBefore = tTime >= eEnd || eTime <= eStart

        //if(hasEndedOrBefore){
        //  console.log(`Scheduled ${value?.title} is before or after`,compareTime.time,value.start.time, endCompareTime.time,value.end.time,bo)
        if(!hasEndedOrBefore){
          let surrounding = (eStart >= tTime && eTime >= eEnd)
          let surrounded = (tTime >= eStart && eTime <= eEnd) //redundant? sched already there...meh
          console.log(`Scheduled '${value?.title}' PROLLY overlap?`,"At: "+value.start.time +" vs "+compareTime.time,"Ends: "+ value.end.time+ " vs "+endCompareTime.time,surrounding,surrounded)
          overlaps.push({inConflict:key, surround:surrounding || surrounded})
        }
      })
  
      //return toRet
      return {
        tooClose:tooClose,
        overlap:overlaps
      }
    }
    changeEvtTime(draggedItem, targetDrop,choice =''){
      //console.log("changeEvtTime: "+choice,targetDrop,draggedItem)
      if (choice == 'ok'){
        //this.store.saveSubProp(evtID, timey, score)  
        Repo.doSaveEvtProp(draggedItem.id, targetDrop.time, null)
      }
      //here doing temp.Move/add just changes the time..
      this.doUpdateSchedule(draggedItem,targetDrop)

      this.unsavedChanges = true 

      return choice
    }
    doUpdateSchedule(draggedItem,targetDrop){
      let s = this.findSchedEvent(draggedItem.id)
      //let d = this.findEvent(draggedItem.id) //from  this.actualEvts

      if (!s){ //|| !d
        console.log("doUpdateSchedule-ERROR NOT found",draggedItem.id,s)
        return
      }
      
      let newStart = addToDate(parsed(s.date), { minute: parseTime(targetDrop.time) }) //d.date
      let endTime = addToDate(newStart, { minute: s.duration}) //should be d.duration as up to date with adHoc

      let hadEnd = this._endTimesSet.delete(s.end.time)//(oldEnd.time)
      this._endTimesSet.add(endTime.time)
      if (!hadEnd){console.log("doUpdateSchedule-endTimesSet NOT FOUND?!?",s.id,endTime.time)}

      let hadStart = this._startTimesSet.delete(s.start.time)//(oldStart.time)
      this._startTimesSet.add(newStart.time)
      //if (!hadStart){console.log("doUpdateSchedule-startTimesSet NOT FOUND?!?",draggedItem.id, targetDrop,newStart.time)}

      s.time = targetDrop.time  //d
      s.sortTime = newStart
      let newy = this.updateDetz({...s,time:targetDrop.time,start: newStart,end: endTime})
      this._dailyScheduled.set(draggedItem.id, newy)

      this.enableNoteScoreEdit(draggedItem.id,newStart,endTime)
    }
    saveDaySchedule(){
      
      let toSave = {} //better as could look up by ID later and can also have array for multiple ids for multiple subGoal per day as below example!
      //let toSchedLater = []
      if (this._dailyScheduled.size < 1){ //clearing day
        toSave = null
      } else {
      
        this._dailyScheduled.forEach( (value, key, map) => {
          if(value.start.time.indexOf('NaN') > -1){ //skip those without time
            //console.log("saveDaySchedule::NOTIME...skipped!",value.title,value.time,value.start.time)
          }else{
            toSave[key] = {
              time: value.start.time,
              duration: value.duration, //.for
              atScore: value?.atScore // || should be empty if no score change >>also is NOT current score but what was changed from---for summaryView
            }
          
            if(this.usingMoods[key]){
              toSave[key].byMood = this.usingMoods[key]
            }
            if(value.notes !== void 0 && value?.notes !==''){
              toSave[key].notes = value?.notes
            }
          }
        })
      }
  
       console.log("saveDaySchedule", toSave ? Object.keys(toSave).length : "CLEARED")//JSON.parse(JSON.stringify(toSave)))
       
       //this.doLog("saved",toSave) //saved ordered by key index...

       Repo.saveDailySchedule(this.currentDate, toSave) 
       
       this.unsavedChanges = false //reset 

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
          //nothing to do for end..prolly
          //hasStart ? this.showNotification(val) : '' //console.log(`updateMinEndNowBtn..hasEND..no Notif?`,LocNotifications.getState())
          this.showNotification(val, hasEnd) //small test to see input for end...
          break
        }
      }
    }
    showNotification(evt,useEnd){
      //let at = new Date(Date.now() + 1000 * 100) //adds timezone utc and seem in future smh
      let n = addToDate(parseDate(new Date()),{ minute: 1})
      //let aty = Date.parse("2024-11-07 05:53:58")/1000;//new Date(this.getTimeyNumber(n))
      let aty = Date.parse(`${n.date} ${n.time}`)
      let aty1 = new Date(aty)
      //let aty2 = new Date(aty/1000) //way in past
      //console.log("showNotification::AT", JSON.stringify(at),JSON.stringify(n),JSON.stringify(aty),JSON.stringify(aty1))//,JSON.stringify(aty2))//,JSON.stringify(compareTime))

      let title = useEnd ? `Evt Ending ${whenFrmtTime(evt.end.time)}` : `Evt Starting ${whenFrmtTime(evt.start.time)}`

      LocNotifications.schedule({
        notifications: [{
            title: title,//`Evt Starting ${whenFrmtTime(evt.start.time)}`,
            body: evt.title,//'Body',
            id: evt.id, //umm could have others?!? toMonitor but should be unique //1,
            largeBody: `${evt.title} from ${whenFrmtTime(evt.start.time)} to ${whenFrmtTime(evt.end.time)}`, //toSee
            schedule: { at: aty1 }, //for web could use .on?:{ScheduleOn} ? //count:3, toTry** on web?
            //sound: './public/assets/sounds/alarm.aiff', //meh shouldnt be available..default to system
            //attachments: null,
            actionTypeId: useEnd ? 'atEnd' : 'atStart',//'',
            iconColor:hexColor(evt.bgcolor), //!evt.bgcolor ? '#9d8802' : evt.bgcolor.includes("-") ? '#9d8802' : evt.bgcolor, //'blue',
            extra: {duration:evt.duration, scorey:evt.score}, //null
            //autoCancel >>only for mobile
          }]
        })
        //.then((res) => {
        //    console.log("notify::good",JSON.stringify(res))
        //    console.log(res)
        //}).catch((err) => {
        //    console.log("notify::ERROR",JSON.stringify(err))
        //    console.log(err)
        //})

        //test to see if service starts>>nope :(
        /*PersistentNotification.open({
          title: 'Start',
          icon: 'sleep',  //?!?
          body: evt.title, 
          actions: [{id:'ok',title:'OK'},{id:'go',title:'Nav'}],//Array<NotificationAction>, 
          color: hexColor(evt.bgcolor), 
          badge: ''
        })*/
    }

    reduceEvtDuration(evtID,duration){
      let evt =  this.findSchedEvent(evtID)
      if(!evt){ //umm shouldnt happen!!
        console.log(`ERROR:: reduceEvtDuration Evt not found!!!`, evtID)
        return
      }

      const now = parseDate(new Date())
      let starty = evt.start
      let endy = evt.end

      let newy = this.updateDetz({...evt, duration:duration, end:now}) //for:duration, 
      this._dailyScheduled.set(evtID,newy)
      
      if(!this._endTimesSet.delete(endy.time)){ //should not happen..prolly
        console.log(`ERROR endTimesSet item does not exist?!?`,evt, this._endTimesSet)
      }

      this._endTimesSet.add(now.time)

      this.enableNoteScoreEdit(evtID, starty,now) //not much different than below but meh--just shows score edit immediately
      //this.updateEvtMinsEndNowBtns(evtID, starty,now)

      //just save schedule
      this.saveDaySchedule()

      return 
    }

    updateNoteScore(id,newScore,note=''){
      let ev = this.findSchedEvent(id) //this.dailyScheduled.get(id) //JSON.parse(JSON.stringify(f)))
      if (ev){
        let oldy = ev.score
        let same = oldy == newScore
        if(!same){
          console.log('updateNoteScore::Score change',ev.atScore,oldy,newScore) 
          Repo.doSaveEvtProp(id, null, newScore)
          ev.atScore = oldy  //bon should show what it was...prolly
          this.unsavedChanges = true //toSave schedule as atScore kept with schedule data

          ev.score = newScore //also update score--hopefully no issue?toTest***
        }
          
        if(note !==''){ //should check that notes havent changed too?--meh
          let isSame = JSON.stringify(ev.notes) === JSON.stringify(note)
          if(!isSame){
            console.log(`updateNoteScore::note ${id} from ${ev.notes} to ${note} with score>> `,newScore)
            ev.notes = note
            this.unsavedChanges = true
          }else{
            console.log(`updateNoteScore::note NOT Changed ${ev.notes} to ${note} with score ${newScore}`,this.unsavedChanges)
          }
        }

       this.isViewingPast() ? this.saveDaySchedule() : this.toggleActionBtns(true,'updateNoteScore') //console.log(`updateNoteScore::not auto-saving today`,h,ev)
      }else {
        console.log(`ERROR ERROR::updateNoteScore could not find event ${id}?!?`) //this would be baaad! 
      }
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

      if (!evt){
        console.log("ERROR removeScheduledEvt, NO evt to delete!", evt)
        return
      }

        //if (this.actualEvts[i].id == evt.id) {
        //this.actualEvts.splice(i, 1)
        //console.log("REMOVED event spliced!", evt) //to see if has start/end. and not have to get/erase below...
          
      let toDel = null
      if(this._dailyScheduled.has(evt.id)){
        toDel = this._dailyScheduled.get(evt.id)
        this._dailyScheduled.delete(evt.id)
      }else{
        console.log("removeScheduledEvt:: ERROR NO evt?@? ERROR", evt)
        return
      }

      if(toDel){ //also update scheduleSets
        let hadStart = this._startTimesSet.delete(toDel.start.time)
        let hadEnd = this._endTimesSet.delete(toDel.end.time)
        if (!hadStart || !hadEnd){
          console.log(`removeScheduledEvt ::> ERROR? scheduleSets has no such evt?@? start:${hadStart}...end:${hadEnd}`, toDel, evt.id + ' '+ evt?.title.trim()+' '+ evt?.details )
        }
        this.deleteEvtMood(evt.id)
        this.unsavedChanges = true
      }
        //if (rMood){ //use this.deleteEvtMood() and forgo rMood flag!!
        //console.log(`removeScheduledEvt::Mood Remove...`,this.usingMoods[evt.id])
        //  delete this.usingMoods[evt.id]
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

      //let compareTime = addToDate(now,{ minute: 0})
      //let tTime = this.getTimeNumber(compareTime)

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
      console.log(mess, data ? JSON.parse(JSON.stringify(data)) : '')
    }
}
