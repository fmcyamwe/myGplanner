//using function as Object instead of inheritance...


/*
function createPerson(name) {
    let birthday;
    return {
      name: () => name,
      setName: (aString) => name = aString,
      birthday: () => birthday,
      setBirthday: (aLocalDate) => birthday = aLocalDate,
      age: age,
      canTrust: canTrust,
    };
    function age() {
      return birthday.until(clock.today(), ChronoUnit.YEARS);
    }
    function canTrust() {
      return age() <= 30;
    }
}
*/

//for a scheduledEvt...
//could pose problem with access & update?
//--todo** populate for other stuff with OrigGoal
export function createEvent(data,OrigGoal,pGoal=null) { //data is rawMin stored per day!--toRename** as more like enrich
    let _data = data;
    let _id = OrigGoal.id;
    let _goal = OrigGoal;
    let _pGoal = pGoal;
    let _duration = data.duration;
    let _time = data.time;
    let _date = null; //used for date map...
    let _moods = null; // || = {} ?
    let notes;
    let score;  //data.atScore ?
    return {
      id:_id, //works and no need to use .() when invoking!
      //id: () => _id, 
      duration: _duration,
      time:_time,
      date:() => _date, //_date, //or use () for more up 2 date?
      datey:dater, //equivalent to above! 
      score:atScore(), //works as prop when()..otherwise have to invoke as functin outside!! or have to ()?!?
      atScore:_data.atScore, //to keep distinction with score above
      getGoal:() => _goal, //_data,
      getPGoal:() => _pGoal,
      data: () => _data,
      setData: (newData) => _data = newData, //umm would this update properly as returning original data above? toTest***
      setMoods: (anArray) => _moods = anArray,
      getMoods:usingMoods, //() => usingMoods, //moods,
      setNotes: (aNote) => notes = aNote,
      hasNote: hasNote,
      setDura: (d) => _duration = d,  //prolly redundant...toSee**
      setTime: (t) => _time = t,
      setDate:(d)=> _date = d,
      durationChanged:changedDuration,
      timeChanged:changedTime,
      parsedScore: parseScore,
      withPropsEventsTo:withProps, //not used--toREmove**
      addPropsEventsTo:addProps
    };

    function dater(){
      return _date
    } 
    function atScore() { //huh suprised can still access function params
      //console.log("createEvent::atScore",data.atScore,OrigGoal.score)
      return _data.atScore || OrigGoal.score
    }

    function hasNote() {
      return data.notes !== void 0 ? true : false
    }

    function changedDuration() { //a diff between goal vs stored duration
      //console.log("createEvent::changedDuration",data.duration,OrigGoal.duration)
      return data.duration !== OrigGoal.duration
    }

    function changedTime() { //a diff between goal vs stored time..ie:drag/drop,etc
      //console.log("createEvent::changedTime",data.time,OrigGoal.time)
      return data.time !== OrigGoal.time
    }
    function usingMoods() {
      if ('byMood' in _data) {
        //console.log("savedEvtFunc::usingMoods",_data)
        _moods = _data.byMood
      }
      return _moods
    }

    function parseScore() {
      //return age() <= 30;
      const tokens = atScore().split(/on/) 
      if (tokens.length != 2) {//should be at most two variables....
        //console.log(`parseScore error? >>${t}`, tokens)  
        return -89 //guardrails to distinguish with potensh error below*** could still fail with 'one' though smh..toReview***
      }
      //console.log(`parseScore for ${t}`, tokens)
      return tokens[1] - tokens[0]  //should hopefully be in order....AND be digits!!
    }

    function whenFrmtTime(timey){
      //let when = (timey) => {
      if(!timey) return ''
      
      let o = timey.split(':')
      return parseInt(o[0]) >= 12 ? timey+"PM" : timey+"AM" 
        //}
  
    }

    function withProps(pGoal,datey=null) { //from updatedEvtDetails()
      let sav = this  //OR use this.getGoal() for title and inDefaults, etc.,..
      let clone = Object.assign({}, {...sav}) //{...sav,date:aDate}, data())

      //console.log("withProps",JSON.parse(JSON.stringify(sav)),JSON.parse(JSON.stringify(sav.getGoal()))) //,JSON.parse(JSON.stringify(obj)))
      clone.bgcolor = pGoal.bgcolor  //for weird colors, becomes transparent--beware**
      //evt.title  +=` (${this.parseScore(evt?.score)})`  //oldie that keeps using/adding to title >> ${evt.title.trim()}
      if (clone.jeSuis){
        clone.details = `Of '${pGoal.title.trim()}' :: << ${clone.jeSuis.join(',')} >>`
      }else {
        clone.details = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(clone?.time)} -> ${clone?.duration}min -- ${clone?.inDefaults ? 'Dft:':':'}${clone?.canMove ? ':Mv:':':'}${clone?.isAlternative ? ':Alt':':'}`
      }

      console.log("withProps",JSON.parse(JSON.stringify(clone)),clone.datey(),clone.date(),clone.title,clone.details)
      return clone
    }

    function addProps(onDatey){
      
      if (!_pGoal) {console.log(`addProps:: ERROR no parentGoal`,this.data);return}

      let raw = this.data  //OR use this.getGoal() for title and inDefaults, etc.,..
      let goal = getGoal()
      let clone = Object.assign({}, {...sav}) //{...sav,date:aDate}, data())

      //let cloneUser = JSON.parse(JSON.stringify(evt)); // does not work with functions, symbols, or undefined value

      //console.log("withProps",JSON.parse(JSON.stringify(sav)),JSON.parse(JSON.stringify(sav.getGoal()))) //,JSON.parse(JSON.stringify(obj)))
      clone.bgcolor = pGoal.bgcolor  //for weird colors, becomes transparent--beware**
      //evt.title  +=` (${this.parseScore(evt?.score)})`  //oldie that keeps using/adding to title >> ${evt.title.trim()}
      if (clone.jeSuis){
        clone.details = `Of '${pGoal.title.trim()}' :: << ${clone.jeSuis.join(',')} >>`
      }else {
        clone.details = `Of '${pGoal.title.trim()}' :: ${whenFrmtTime(clone?.time)} -> ${clone?.duration}min -- ${clone?.inDefaults ? 'Dft:':':'}${clone?.canMove ? ':Mv:':':'}${clone?.isAlternative ? ':Alt':':'}`
      }

      console.log("addProps",JSON.parse(JSON.stringify(clone)),clone.datey(),clone.date(),clone.title,clone.details)
      return clone
    }
}