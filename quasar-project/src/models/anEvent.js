export default class Event { 
    data = null //for now...toUse the below**

    //title
    //details = ""
    //bgcolor = null //or default ''?
    //jeSuis = []
    //date

    //sortTime?
    //isScheduled?
 
    constructor(data) 
    {
        this.data = data
    }
    getData()
    {
      return this.data
    }
   
}


export class Goal { 
  data = null //for now..use below***

  //should have subclass of subGoal vs parentGoal!!
  //see below>>
  
  //ALL Goals:
    //id
    //title
  
  //pGoal 
      //>> details = ""
      //>> color = ""
      //>> priority = ""

  //subGoal 
      //>> parentID
      //>> score
      //>> time
      //>> duration
      //>> canMove = false
      //>> isDefault = false //inDefaults ?!?
      //>> isAlternative = false
      //>> moods = ""

  //functions
  ///parseScore() ...or should be in aRepo? TBD**
  ///whenFrmtTime >>formatTime()

  constructor(data) 
  {
      this.data = data
  }
  getData()
  {
    return this.data
  }
  
}

/*
class Goal {}

class PGoal extends Goal { 
  constructor(name, id, monthlyCost) {
      super();
      this._id = id;
      this._name = name; 
      this._monthlyCost = monthlyCost;
  }
  ....
}

class SGoal extends Goal {}

*/