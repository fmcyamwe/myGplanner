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
      return this.parentGoalsMap().get(id)
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
      
      console.log('enrichAddToSchedule',Object.keys(this.savedRawEvts).length)//,this.savedRawEvts) //JSON.parse(JSON.stringify(this.savedRawEvts))) 
      
      let euhOverlaps = {}

      let checkOverlaps = this.isViewingToday()
      
      for (let key in this.savedRawEvts) {
        let toH = this.savedRawEvts[key]
        
        //have to enrich raw with original goal first!
        //toH has rawSaved data that should overwrite/add to what goal has...
        let originalG = this.getSubGoalByID(key) 

        if (!originalG) {console.log(`enrichAddToSchedule:: ERROR no goal foundfor key: ${key} ?!?`, toH); return}

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
        console.log('loadEvtsForDay--Changed', noChange, this.currentDate,JSON.parse(JSON.stringify(this.savedRawEvts)))
        this.resetSchedule() //first clear for new different date!
      }

      //console.log('loadEvtsForDay--FOR date',d,this.currentDate,this.savedRawEvts)
      this.savedRawEvts = Repo.getDataForDate(this.currentDate)
      
      let hasOverlaps = this.enrichAddToSchedule() //this.isViewingToday()
      if(Object.keys(hasOverlaps).length > 0){
        //handle overlaps--todo**
        console.log('loadEvtsForDay--OVERLAPS!!!',hasOverlaps)
      }
      //TODO**
      //this.canEnableEditScore(evt.id,endTime)
      //this.enableEndNowBtn

      //todo** handle overlaps!
      return hasOverlaps  
    }
    onChangeViewDate(toDate){ //same as loadForDate()
      let noChange = toDate == this.currentDate
      console.log('onChangeViewDate >>',JSON.parse(JSON.stringify(this.currentDate)), toDate,noChange)
      this.currentDate = toDate
      
      this.hasEventsForDate() ? this.loadEvtsForDay(noChange) : this.resetSchedule()
    }

    resetSchedule(){
      this.savedRawEvts = []
      this._dailyScheduled = new Map()
      this._endTimesSet = new Set()
      this._startTimesSet = new Set()

      //buttons too? prolly!
      // No SavedEvents
      this.showReloadBtn = false //prolly for clearing when viewing diff days?!? tbd
      this.showClearBtn = false
      this.disableSaveSchedule = true
    }

    chosenScoreLabel() { 
      return this.chosenScore == null ? `By Score` : `Score >= ${this.chosenScore}` 
    }
    chosenPrioLabel() { 
      return this.chosenPrio == null ? `By Priority` : `Prio = ${this.chosenPrio}` 
    }
    onChoosenPrio(e){
      console.log('onChoosenPrio',e,this.chosenPrio)
      let oldy = this.chosenPrio
      if (oldy && oldy == e){
        this.disablePrioBtn = true //.user should not reclick without changing it again...
      }else {
        this.chosenPrio = e
        this.disablePrioBtn = false
      }
    }
    onChoosenScore(e){
      console.log('onChoosenScore',e)
      let oldy = this.chosenScore
      if (oldy && oldy == e){
        this.disableScoreBtn = true //user should not reclick without changing it again...
      }else {
        this.chosenScore = e
        this.disableScoreBtn = false
      }
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
              targetStart:tStartAt,
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

    /*whenFrmtTime(timey){
      //let when = (timey) => {
      if(!timey) return ''
      
      let o = timey.split(':')
      return parseInt(o[0]) >= 12 ? timey+"PM" : timey+"AM" 
        //}
  
    } */
    
    //canDropEvent?
    dropEvent(targetDrop, draggedItem){ //from string needed?!? toSee**
      
      let tEndsAt = addToDate(targetDrop, { minute: draggedItem.duration})
      
      let anyOverlap =  this.hasOverlappingEvent(draggedItem.id, targetDrop,tEndsAt)

      if (anyOverlap.length > 0){
        console.log("dropEvent...OVERLAP handlin::size="+anyOverlap.length, anyOverlap)//[i].direction) //anyOverlap[i], //object
        //todo** handle!//handle at call site?!?
        //return anyOverlap 
        return {
          overlaps:anyOverlap,
          canDrop:false,
        }
      } else {
        //so no overlapp, just change dragged event time--ask User
        console.log(`dropEvent with No overlap (${draggedItem.id}) to ${targetDrop.time}`)  //w
        //this.changeEvtTime(draggedItem.id, targetDrop, false) //onDrop
        //return true
        return {
          overlaps:null,
          canDrop:true,
          //flags about ?.inDefaults || !evt?.canMove ? for timeChanged() || evt.durationChanged() ?!?
        }
      }

      //do btns too?--tbd**
      //this.disableSaveSchedule = false
      //this.showReloadBtn = this.hasEventsForDate
      //this.showClearBtn = true 


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
      console.log("changeEvtTime: "+choice,targetDrop,draggedItem)
      //todo**
      if (choice == 'ok'){
        //this.store.saveSubProp(evtID, timey, score)  
        Repo.doSaveEvtProp(draggedItem.id, targetDrop.time, null)
      }
      //here doing temp.Move/add just changes the time..
      this.doUpdateSchedule(draggedItem,targetDrop)
      
      return choice
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

      //updates---toSee if works!**
      this._dailyScheduled.set(draggedItem.id, {...s,
        //for: eProp.duration,
        start: newStart,
        end: endTime,
        //score: eProp.score
      })

      d.time = targetDrop.time  //works?!? >>yup 
      //and seems details below not needed?!?
      //d.details = `Of '${prtGoal.title.trim()}' :: ${this.whenFrmtTime(evt?.time)} -> ${evt?.duration}min -- ${evt?.inDefaults ? 'Dft:':':'}${evt?.canMove ? ':Mv:':':'}${evt?.isAlternative ? ':Alt':':'}`
      // d.sortTime = addToDate(parsed(evt.date), { minute: parseTime(evt.time) }) 
      
    }

}
