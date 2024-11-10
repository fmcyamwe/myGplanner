//to track Scheduled notifs and schedule

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core'; // registerPlugin ,WebPlugin

const platform = Capacitor.getPlatform();
import{parseTime,addToDate,parsed,parseTimestamp} from '@quasar/quasar-ui-qcalendar/src/index.js'

import { whenFrmtTime, hexColor} from 'pages/util/utiFunc'


export class CapacitorNotificationsWeb { //extends WebPlugin // implements CapacitorAlarmNotificationPlugin
    //try to have Singleton!!!
    ///>>meh seems ok...
    ///BUT toMonitor** with these vars below...
    constructor() {
        //super()
        //umm review below...
        this.name = 'CapacitorNotificationsWeb';
        this.platforms = ['web'];
        this.pending = [];  //LocalNotificationSchema[] = [];
        this.deliveredNotifications = [] ;//protected deliveredNotifications: Notification[] = [];
        this.doInit() //or should invoke?
        this.seen = {}  //or make it single?!?
        this.lastSeen = null
    }

    doInit(){
      if (platform != "web") {
          //FCM.subscribeTo({ topic: "updates" })
          //    .catch((err) => console.log(err));
          console.log('CapacitorNotificationsWeb>>ANDROID Platform', platform);
      }else{
          //let isM = isMobile()
          console.log('CapacitorNotificationsWeb>>WEB Platform', platform); //isM
      }

      this.checkPermissions();
      this.addListeners();
      this.createChannel();
      this.registerActions();
      this.getDeliveredNotifications(); //redundant?!?
      this.getPending();

    }

    doPrint(){
      console.log('CapacitorNotificationsWeb>>',"ALLGOOD")
      //is class even instantiated at this point?!? >>yup as shows up After doInit() below...
    }

    getState(){ //just to see what's in...
      return {
          pending:this.pending.length,
          delivered:this.deliveredNotifications.length
      }
    }

    async checkPermissions() { //= async () =>
      let permStatus = await LocalNotifications.checkPermissions();
  
      console.log('registerNotifications>>CheckP',JSON.stringify(permStatus)); //JSON.parse(JSON.stringify(permStatus))
      //for (const index in permStatus) {
      //    console.log('registerNotifications>> '+index,permStatus[index])
      //}
  
      if (permStatus.display === 'prompt') {
          permStatus = await LocalNotifications.requestPermissions();
          console.log('registerNotifications::requestP',JSON.stringify(permStatus)) //JSON.parse(JSON.stringify(permStatus))
      }
  
      if (permStatus.display !== 'granted') {
          //throw new Error('User denied permissions!');
          console.log('registerNotifications::NOPE', permStatus.display,permStatus.receive);
      }
  
     //await PushNotifications.register();
    }
    //todo** separate the two for clarity...
    async addListeners() { //= async () => { //
    
        await LocalNotifications.addListener('localNotificationReceived', notification => {
            console.log('localNotificationReceived>>', JSON.stringify(notification)); //title, body, largeBody,etc,...
            //why undefined the second time?!?
            //should prolly remove if have repeats?!?
            if (notification !== undefined){
              //this.removeDeliveredNotifications(notification) //nah this removes the notification entirely...
              this.deliveredNotifications.push(notification);
              this.seen[notification.id] = true //makes id key as string smh
              this.lastSeen = notification.id
              //or cancel?!? specially when seen again esti >>prolly cause of that repeat....
            }else{
              console.log('localNotificationReceived>>UNDEFINED...what to do?',notification,JSON.stringify(this.seen),JSON.stringify(this.lastSeen))
              if(this.lastSeen){
                LocalNotifications.cancel({
                  notifications:[{id:this.lastSeen}] //much better!
                })
                this.lastSeen = null //reset
              }//else?

              /*if(Object.keys(this.seen) > 0) {//if("key" in obj)
                //would prolly erase existing notif?!?toSee**
                for (let k of Object.keys(this.seen)) {
                  //this.cancel(k)
                  LocalNotifications.cancel({
                    notifications:[k]
                  })
                }

                this.seen = {} //reset
              }*/
            }
        });
    
        await LocalNotifications.addListener('localNotificationActionPerformed', notificationAction => {
            console.log('localNotificationActionPerformed::ACtion>> ', JSON.stringify(notificationAction));//also contains action
            //should prolly cancel? 
            //this.cancel(notification.id)
            
            //do the action actually...todo**
            ////when it's start > should perhaps create End notif

        });
    }
  
    async getDeliveredNotifications() { //= async () => 
        const notificationList = await LocalNotifications.getDeliveredNotifications();
        console.log('getDeliveredNotifications',JSON.stringify(notificationList)); //JSON.parse(JSON.stringify(notificationList))
    
        for (const index in notificationList.notifications) { 
            console.log('getDeliveredNotifications::Notif '+index,JSON.stringify(notificationList.notifications[index]))
            this.deliveredNotifications.push(notificationList.notifications[index]);
        }
    }
  
    async createChannel() { //= async () =>
        
        if (platform != "web") {
          //let channels = await LocalNotifications.listChannels();
          //console.log('otherNotifInfo',JSON.stringify(channels));
          
          // channel with high importance..>>dont seem to help with wake device but oh well..
          await LocalNotifications.createChannel({
            id:'LocNotifs',
            name:'Notifs',
            description:'Blu Notifs',
            //sound:'' //should use default
            importance:5, //int or default to 3
            visibility:1,
            vibration:true
          })

          let channelz = await LocalNotifications.listChannels();
          console.log('createChannel>>channelz',JSON.stringify(channelz));
        }
    }
    async registerActions() {
      const actions = {
        "ok":{id:'ok',title:'OK'}, //progress at startEvt
        "add":{id:'add',title:'Add3'}, //addMins at endEvt
        "rem":{id:'rem',title:'End'}, //skip at startEvt
        "go":{id:'go',title:'Nav'}, //nav...
      }

      const startType = {
        id:'start',
        actions:[actions['ok'],actions['rem']]
      }
      const endType = {
        id:'end',
        actions:[actions['add'],actions['go']]
      }
      const navType = { //toSee if needed...
        id:'nav',
        actions:[actions['ok'],actions['go']]
      }
      
      let toReg = {
        types: [startType,endType,navType]
        }
      await LocalNotifications.registerActionTypes(toReg);
      
      //console.log('registerActions',JSON.stringify(toReg));
    }

    async getPending() { //: Promise<PendingResult>
      const pending = await LocalNotifications.getPending();
        console.log('getPending',JSON.stringify(pending)); //JSON.parse(JSON.stringify(notificationList))
    
        for (const index in pending.notifications) {
            //console.log('getPending:: Notif::AT?!? >> '+index,JSON.stringify(pending.notifications[index]))
            
            //wrong at at this point colis!! >>"at":"Fri Nov 08 14:30:00 EST 2024"
            let notif = pending.notifications[index]
            let at = notif.schedule.at
            let aty = Date.parse(at) //bon in epoch needing for new Date(aty)
            let aty1 = new Date(at)  //huh seems good...

            console.log('getPending:: Notif::AT?!? >> ',JSON.stringify(at),JSON.stringify(aty),JSON.stringify(new Date(aty)),JSON.stringify(aty1))
            let diff = aty - Date.now()
            if(diff <= 0){ //has passed
              console.log('getPending:: SKIPPED oldy>> ',diff, JSON.stringify(at),JSON.stringify(aty),JSON.stringify(aty1))
            }else{
              this.pending.push({...notif,schedule: { at: aty1 }});
            }
        }
    }
    //handling of multiple evts to schedule...
    //toReview** if need dt--evts already have it!
    scheduleLater(evts,dt){
        //console.log('NotifHelper::scheduleLater',JSON.stringify(dt),JSON.stringify(evts))
        
        for (const e of evts) {
            let mid = addToDate(parsed(dt), { minute: parseTime(e.start.time) })
            let aty = Date.parse(`${mid.date} ${mid.time}`) 
            //let another = parseTimestamp(`${dt} ${e.start.time}`)
            let aty1 = new Date(aty) //huh works!! >>or not as formatted wrong...
            //let another1 = new Date(another) //null...should add now above? bof
            //let at = new Date(getDayTimeIdentifier(mid)) //or getTimeIdentifier ? //+ 1000 * 100
            let not = {
                title: 'Scheduled!',
                body: e.title,//'Body',
                id: e.id, //umm could have others?!? toMonitor but should be unique per day //1,
                schedule: { at: aty1, allowWhileIdle: true, repeats:true },  //use scheduleOn? prolly no need
                //sound: './public/assets/sounds/alarm.aiff', //meh default
                attachments: null,
                actionTypeId: 'nav', //'',
                iconColor:hexColor(e.bgcolor), //!e.bgcolor ? '#9d8802' : e.bgcolor.includes("-") ? '#9d8802' : e.bgcolor, // e.bgcolor ?? 'blue', //can break smh color.includes("-") //even normal named can be invalid color smh
                extra: null,
                channelId:'LocNotifs' 
              }
            this.pending.push(not); //JSON.stringify(not)
            //console.log('scheduleLater::Added>>'+e.title,JSON.stringify(not),JSON.stringify(aty),JSON.stringify(aty1),JSON.stringify(another),JSON.stringify(another1))
        }
    }
    async schedule(options) { //: ScheduleOptions : Promise<ScheduleResult>
        
        //console.log('schedule',JSON.stringify(options))
        LocalNotifications.schedule(options)
        .then((res) => {
            console.log("schedule>>good",JSON.stringify(res))
            console.log(res)
            this.deliveredNotifications.push(...options.notifications);
            //also remove from pending--toTest**
            let oldy = this.pending.length
            this.pending = this.pending.filter(notification =>!options.notifications.find(n => n.id === notification.id))
            oldy != this.pending.length ? console.log("schedule>>PENDING change",oldy,this.pending.length) : console.log("schedule>>PENDING SAME", oldy,this.pending.length) // '' //JSON.stringify(res)
        }).catch((err) => {
            console.log("schedule>>ERROR",JSON.stringify(err))
            console.log(err)
            this.pending.push(...options.notifications);
        })
    }

    schedulePending(){ //toReview
        console.log('schedulePending!!',JSON.stringify(this.pending),this.deliveredNotifications.length)
        for (const notification of this.pending) {
            LocalNotifications.schedule({
                notifications:[notification] 
            }).then((res) => {
              console.log("schedulePending>>good",JSON.stringify(res))
              console.log(res)
              //this.deliveredNotifications.push(notification); //prolly not yet?
              
              // remove from pending
              //let oldy = this.pending.length
              this.pending = this.pending.filter(e => e.id !== notification.id)
              //oldy != this.pending.length ? console.log("schedulePending>>PENDING change",oldy,this.pending.length) : console.log("schedulePending>>PENDING SAME", oldy,this.pending.length) // '' //JSON.stringify(res)
          }).catch((err) => {
              console.log("schedulePending>>ERROR",err)
              console.log(err)
              //bon here just cancel it...could be parsing error
              this.cancel(notification.id)
          })
        }
    }

    //bon cancel notifID >>invokes LocalNotifications.cancel(pending)
    async cancel(pendingID) { //: ScheduleResult  : Promise<void>
      
      //for (const notification of this.pending) {
      for(let i = 0; i < this.pending.length; i++){
        if(pendingID == this.pending[i].id){ //notification.id
          console.log('cancel>>notif',pendingID,JSON.stringify(this.pending[i])) //notification
          LocalNotifications.cancel({
            notifications:[this.pending[i]] //notification
          })

          this.pending.splice(i, 1);
        }
      }

      //this.pending = this.pending.filter(
      //  notification =>
      //    !pending.notifications.find(n => n.id === notification.id),
      //);
    }

    async removeDeliveredNotifications(delivered) { //: DeliveredNotifications, : Promise<void>
      console.log('CapacitorNotificationsWeb::removeDeliveredNotifications')

      //should save?!?
      return LocalNotifications.removeDeliveredNotifications(delivered)
      /*for (const toRemove of delivered.notifications) {
        const found = this.deliveredNotifications.find(
          n => n.tag === String(toRemove.id),
        );
        found?.close();

        this.deliveredNotifications = this.deliveredNotifications.filter(
          () => !found,
        );
      }*/
  }
  async removeAllDeliveredNotifications() { //: Promise<void> 
      console.log('CapacitorNotificationsWeb::removeAllDeliveredNotifications')

      //should save?!?
      return LocalNotifications.removeAllDeliveredNotifications()
      /*for (const notification of this.deliveredNotifications) {
        notification.close();
      }
      this.deliveredNotifications = [];
      */
  }
}

const LocNotifications = new CapacitorNotificationsWeb();
  //const LocNotification = registerPlugin('LocNotifications'); //Echo //bon to see if naming is diff...
export { LocNotifications };
// registerPlugin(LocNotifications); //huh seems to work?!?



/*moved in class... class member cant have const ?!?
const registerNotifications = async () => {
    let permStatus = await LocalNotifications.checkPermissions();

    console.log('notifHelper::registerNotifications>>CheckP',JSON.stringify(permStatus)); //JSON.parse(JSON.stringify(permStatus))
    for (const index in permStatus) { //just to See....
        console.log('registerNotifications>> '+index,permStatus[index])
    }

    if (permStatus.display === 'prompt') {
        permStatus = await LocalNotifications.requestPermissions();
        console.log('notifHelper::registerNotifications::requestP',JSON.stringify(permStatus)) //JSON.parse(JSON.stringify(permStatus))
    }

    if (permStatus.display !== 'granted') {
        //throw new Error('User denied permissions!');
        console.log('notifHelper::registerNotifications::NOPE', permStatus.display,permStatus.receive);
    }

   //await PushNotifications.register();
}
const addListeners = async () => { //

    await LocalNotifications.addListener('localNotificationReceived', notification => {
        console.log('notifHelper::localNotificationReceived: ', JSON.stringify(notification)); //title, body, largeBody,etc,...
    });

    await LocalNotifications.addListener('localNotificationActionPerformed', notificationAction => {
        console.log('notifHelper::localNotificationActionPerformed::ACtion>> ', JSON.stringify(notificationAction));//also contains action
    });
}

const getDeliveredNotifications = async () => {
    const notificationList = await LocalNotifications.getDeliveredNotifications();
    console.log('notifHelper::getDeliveredNotifications',JSON.stringify(notificationList)); //JSON.parse(JSON.stringify(notificationList))

    for (const index in notificationList) { //just to See....
        console.log('notifHelper::getDeliveredNotifications>> '+index,notificationList[index])
    }
}

const otherNotifInfo = async () => { //works!
    
    //can create channel?!? toTry?
    ///await LocalNotifications.createChannel()
    if (platform != "web") {
      let channels = await LocalNotifications.listChannels();
      console.log('notifHelper::otherNotifInfo',JSON.stringify(channels));
    }

    //for (const index in channels.channels) { //just to See....
    //    console.log('regis::otherNotifInfo>> '+index,channels[index])
    //}
}*/