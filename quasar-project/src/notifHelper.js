//to track Scheduled notifs and schedule

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor,registerPlugin,WebPlugin } from '@capacitor/core';

const platform = Capacitor.getPlatform();
import{parseTime,addToDate,parsed} from '@quasar/quasar-ui-qcalendar/src/index.js'

import { whenFrmtTime, hexColor} from 'pages/util/utiFunc'

//import {} from 'chrome';// chrome.notifications;


export class CapacitorNotificationsWeb { //extends WebPlugin {// implements CapacitorAlarmNotificationPlugin
    //try to have Singleton!!!
    ///>>meh seems ok...
    ///BUT toMonitor** with these vars below...
    constructor() {
      //super({
      //  name: 'CapacitorNotificationsWeb',
      //  platforms: ['android']  //umm makes diff?!?
      //});
      //this.name = 'CapacitorNotificationsWeb';
      //this.platforms = ['web'];

      this.pending = []  //LocalNotificationSchema[] = [];
      this.realPlat = null
      this.deliveredNotifications = [] ;//protected deliveredNotifications: Notification[] = [];
      this.doInit() //or should invoke?
      this.seen = {}  //or make it single?!?
      this.lastSeen = null //this single of above
    }

    doInit(){
      if (platform != "web") {
          //FCM.subscribeTo({ topic: "updates" })
          //    .catch((err) => console.log(err));
          console.log('CapacitorNotificationsWeb>>ANDROID Platform', platform);
          this.realPlat = platform
      }else{
          //let isM = isMobile()
          console.log('CapacitorNotificationsWeb>>WEB Platform', platform); //isM
          this.realPlat = platform
      }

      this.checkPermissions();
      this.addListeners();
      this.createChannel();
      this.registerActions();
      this.getPending();  //bon get pending first
      this.getDeliveredNotifications(); //redundant?!?
    }

    doPrint(){
      console.log('CapacitorNotificationsWeb>>',"ALLGOOD")
      //is class even instantiated at this point?!? >>yup as shows up After doInit() below...
    }

    getState(){ //current state
      return {
        platform:this.realPlat,
        pending:this.pending.length,
        delivered:this.deliveredNotifications.length,
      }
    }

    async checkPermissions() { //= async () =>
      let permStatus = await LocalNotifications.checkPermissions();
  
      console.log('checkPermissions>>CheckP',JSON.stringify(permStatus)); //JSON.parse(JSON.stringify(permStatus))
      //for (const index in permStatus) {
      //    console.log('registerNotifications>> '+index,permStatus[index])
      //}
  
      if (permStatus.display === 'prompt') {
          permStatus = await LocalNotifications.requestPermissions();
          console.log('checkPermissions::requestP',JSON.stringify(permStatus)) //JSON.parse(JSON.stringify(permStatus))
      }
  
      if (permStatus.display !== 'granted') {
          //throw new Error('User denied permissions!');
          console.log('checkPermissions::NOPE', permStatus.display,permStatus.receive);
      }

      //below borks!
      //chrome.runtime.getPlatformInfo().then((res) => {
      //  console.log('checkPermissions>>Chromey',JSON.stringify(res));
      //})
  
      if (platform !== "web") {
        //bon instead check for exactNotifSettings?
        //cannot be changed on API 32 and higher so would need SCHEDULE_EXACT_ALARM permissions in manifest(default to granted on lower apis) 
        let exactNotifs = await LocalNotifications.checkExactNotificationSetting(); 
        console.log('ExactNotificationSetting>>CheckP',JSON.stringify(exactNotifs)); 
        if (exactNotifs.exact_alarm !== 'granted') { //=== 'prompt'
          exactNotifs = await LocalNotifications.changeExactNotificationSetting();
          console.log('ExactNotificationSetting::requestP',JSON.stringify(exactNotifs))
        }
      
        if (exactNotifs.exact_alarm !== 'granted') {
          //throw new Error('User denied permissions!');
          console.log('ExactNotificationSetting::NOPE', exactNotifs.exact_alarm);
        }
      }
      
     //await PushNotifications.register();
    }
    //umm would to pull below out due to chrome?!? >>not invoked but redundant--toREmove
    notifClicked(notifUrl) {
      console.log("notifClicked::WOAH >>clicked on notif:", notifUrl);
      var creating = chrome.tabs.create({
        url: notifUrl
      });
      console.log("clicked on notif:", notifUrl); //notifUrl == notifId
      //console.log(creating); 
      //creating.then((e) => {
      //  console.log("after clicking", e); //just to see
      //});
      chrome.notifications.clear(notifUrl); //clear notifId
    }
    /*
    //errors out at .create in (Vue)
    //same error here in JS? >>yup
    chrome.notifications.create(data.url, {
        "type": data.type,
        "iconUrl": chrome.runtime.getURL("icons/manga-48.png"), //chrome.extension.getURL("icons/manga-48.png"),
        "title": data.title,
        "message": data.content
      });
    */

    //todo** separate the two listeners for clarity...if needed
    async addListeners() { //= async () => { //
    
      //for web >>not needed tho...
      if (platform == "web") {
        //console.log('CapacitorNotificationsWeb::addListeners>> ',platform)

        await LocalNotifications.addListener('localNotificationReceived', notification => {
            console.log('localNotificationReceived', JSON.stringify(notification)); //title, body, largeBody,etc,...
            //why undefined the second time?!?
            //should prolly remove if have repeats?!?
            if (notification !== undefined){
              //this.removeDeliveredNotifications(notification) //nah this removes the notification entirely...
              this.deliveredNotifications.push(notification);
              this.seen[notification.id] = true //makes id key as string smh
              this.lastSeen = notification.id
              //or cancel?!? specially when seen again esti >>prolly cause of that repeat....
              //umm would it do to update notif with dismiss action?!?
            }else{
              console.log('localNotificationReceived>>UNDEFINED...what to do?',notification,JSON.stringify(this.seen),JSON.stringify(this.lastSeen))
              if(this.lastSeen){
                //also check in this.seen in case there was multiple?!? toSee if necessary**
                //also this does remove the notification even when NOT interacted with it yet!!!>>bon no cancel for now

                //this.doCancel({
                //  notifications:[{id:this.lastSeen}]
                //})
                
                //LocalNotifications.cancel({
                //  notifications:[{id:this.lastSeen}] //much better!
                //})
                this.lastSeen = null //reset

              }else{ //see if in delivered /pending?
                console.log('localNotificationReceived>>UNDEFINED..inDeliv/pending?',notification,JSON.stringify(this.deliveredNotifications),JSON.stringify(this.pending))
                //then?!? toReview**

              }

              /*if(Object.keys(this.seen) > 0) {//if("key" in obj)
                
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
        
        //would below work? >>borks >> undefined onClicked :( 
        //chrome.notifications.onClicked.addListener((notifId) =>{console.log('WOAH >>clicked on notif!!',notifId)}); //this.notifClicked
        
        //umm below work with webPlugin? >>nope!!
        /*this.addListener('localNotificationReceived', notification => {
          console.log('localNotificationReceived::WEB?!?>> ', JSON.stringify(notification));

        });
        
        //or below? >>nope too //chrome.events.Event
        this.addListener('NotificationClickedEvent', notification => {
          console.log('localNotificationReceived::WEB?!?>> ', JSON.stringify(notification));

        }); //btn clicked in notif with >> NotificationButtonClickedEvent

        //oldie >>'onClosed'
        this.addListener('chrome.notifications.onClosed', notification => {
          console.log('localNotificationReceived::WEB?!?>> ', JSON.stringify(notification));

        });
        //onClicked
        this.addListener('chrome.notifications.onClicked', notification => {
          console.log('localNotificationReceived::WEB?!?>> ', JSON.stringify(notification));

        });
        //onButtonClicked
        this.addListener('chrome.notifications.onButtonClicked', notification => {
          console.log('localNotificationReceived::WEB?!?>> ', JSON.stringify(notification));

        });*/

        return
      }

      // for mobile_Android hannoying and not needed?!? >>toReview**
      console.log('CapacitorNotificationsWeb::addListeners>>SKIPPED for ',platform)

    }
    

    async getDeliveredNotifications() {//to catch any errors from getDeliveredNotifications...prolly
      let notificationList = null
      
      LocalNotifications.getDeliveredNotifications().then((res) => {
        console.log('getDeliveredNotifications',JSON.stringify(res)); //JSON.parse(JSON.stringify(notificationList))
        //console.log(res)

        notificationList = res //issue with const?!?
        //should check if in pending?!?
        for (const index in notificationList.notifications) { 
          console.log('getDeliveredNotifications::Notif...inPENDING?'+index,JSON.stringify(notificationList.notifications[index]),JSON.stringify(this.pending))
          this.deliveredNotifications.push(notificationList.notifications[index]);
        }

      }).catch((err) => {
        console.log("getDeliveredNotifications>>ERROR",JSON.stringify(err))
        console.log(err)
      })
    
    }

    /*async getDeliveredNotifications() { //= async () => 
        const notificationList = await LocalNotifications.getDeliveredNotifications();
        console.log('getDeliveredNotifications',JSON.stringify(notificationList)); //JSON.parse(JSON.stringify(notificationList))

        //should check if in pending?!?
        for (const index in notificationList.notifications) { 
            console.log('getDeliveredNotifications::Notif...inPENDING?'+index,JSON.stringify(notificationList.notifications[index]))
            this.deliveredNotifications.push(notificationList.notifications[index]);
        }
    }*/
  
    async createChannel() { //= async () =>
        
      //mobile
      if (platform !== "web") {
        let channels = await LocalNotifications.listChannels();
        console.log('createChannel',JSON.stringify(channels)); //umm shouldnt the LocNotifs show up on second start >>yup does!!--bon prolly skip create again?
          
        let doExist = false 
        for (const index in channels.channels) {
          if (channels.channels[index].id == 'LocNotifs'){
            doExist = true
            break
          }
        }

        if(doExist){
          console.log('createChannel>>WOO LocNotifs exists!!')
          return 
        }
          
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
        console.log('createChannel>>channelz>>CREATED',JSON.stringify(channelz));
      }

        //not possible for web!
    }
    async registerActions() {
      const actions = { 
        "start":{id:'start',title:'Start'}, //progress at startEvt 
        "add":{id:'add',title:'Add3'}, //addMins at endEvt
        "skip":{id:'skip',title:'Skip'}, //skip at startEvt
        "go":{id:'go',title:'Nav'}, //nav...
        "note":{id:'note',title:'Notey',input:true},//add input?: boolean; (IOS) >>huh works!!
      }

      const startType = {
        id:'atStart',
        actions:[actions['add'],actions['start'],actions['skip']] //umm could add multi actions? >> yup!!
      }
      const endType = {
        id:'atEnd',
        actions:[actions['note']]
      }
      const navType = { //toSee if needed...
        id:'nav',
        actions:[actions['start'],actions['go']]
      }
      
      //mobile
      if (platform != "web") {
        let toReg = {
          types: [startType,endType,navType]
          }
        await LocalNotifications.registerActionTypes(toReg);
        
        //console.log('registerActions',JSON.stringify(toReg));
        return
      }

      //not possible for web!
    }

    async getPending() { //: Promise<PendingResult>
      const pending = await LocalNotifications.getPending();
      
      console.log('getPending',JSON.stringify(pending));
    
      for (const index in pending.notifications) {
        //console.log('getPending:: Notif::AT?!? >> '+index,JSON.stringify(pending.notifications[index]))
            
        //at from mobile wrong colis!! >>"at":"Fri Nov 08 14:30:00 EST 2024"
        let notif = pending.notifications[index]
        let at = notif.schedule.at
        let aty = Date.parse(at) //bon in epoch needing for new Date(aty)
        let aty1 = new Date(at)  //huh seems good...

        ////--instead of scheduling again >>leave notif as is! >>is shown!! 
        ///--cancel the skipped oldy so that it's not seen again?
        let diff = aty - Date.now()
        if(diff <= 0){ //has passed
          console.log('getPending:: SKIPPED oldy>> ',diff, JSON.stringify(at),JSON.stringify(aty),JSON.stringify(aty1))
        }else{
          //this.pending.push({...notif,schedule: { at: aty1 }}); //no need to re-add just schedule it.
          console.log('getPending:: Notif>>WOULDA>> ',JSON.stringify(notif), JSON.stringify(at),JSON.stringify(aty),JSON.stringify(new Date(aty)),JSON.stringify(aty1))
          //LocalNotifications.schedule({notifications:[{...notif,schedule:{at: aty1},actionTypeId:'start'}]});
        }
      }
    }

    async schedule(options) { //: ScheduleOptions : Promise<ScheduleResult>
        
        //console.log('schedule',JSON.stringify(options))
        LocalNotifications.schedule(options)
        .then((res) => {
            console.log("schedule>>good",JSON.stringify(res))
            console.log(res)
            ////add to delivered as now now -toTest**
            this.deliveredNotifications.push(...options.notifications);
    
            //potential remove from pending
            let oldy = this.pending.length
            this.pending = this.pending.filter(notification =>!options.notifications.find(n => n.id === notification.id))
            oldy != this.pending.length ? console.log("schedule>>PENDING change",oldy,this.pending.length) : console.log("schedule>>PENDING SAME", oldy,this.pending.length) // '' //JSON.stringify(res)
        }).catch((err) => {
            console.log("schedule>>ERROR",JSON.stringify(err))
            console.log(err)
            this.pending.push(...options.notifications);
        })

        //nope error out with undefined
        /*chrome.notifications.create(options.notifications[0].title, {
          "type": 'basic',//data.type,
          "iconUrl": options.notifications[0].title, //chrome.runtime.getURL("icons/manga-48.png"), //chrome.extension.getURL("icons/manga-48.png"),
          "title": options.notifications[0].title,
          "message": options.notifications[0].body
        },
        (notif) => {console.log("WOAH:: clicked on notif:", notif);}
      );*/
    }
    // multiple evts to schedule later...
    addPendingEvts(evts,dt){ //need dt?--evts already have it!--toReview**
        //console.log('NotifHelper::addPendingEvts',JSON.stringify(dt),JSON.stringify(evts))
        
        for (const e of evts) {
            let mid = addToDate(parsed(dt), { minute: parseTime(e.start.time) - 1 }) //try showing notif one minute in advance
            let aty = Date.parse(`${mid.date} ${mid.time}`) 
            //let another = parseTimestamp(`${dt} ${e.start.time}`)
            let aty1 = new Date(aty) //huh works!! 
            //let another1 = new Date(another) //null...should add now above? bof
            //let at = new Date(getDayTimeIdentifier(mid)) //or getTimeIdentifier ? //+ 1000 * 100
    
            let midEnd = addToDate(parsed(dt), { minute: parseTime(e.end.time)})
            let atyEnd = Date.parse(`${midEnd.date} ${midEnd.time}`)
            let aty1End = new Date(atyEnd) //to avoid calculating this for End notif
            //console.log('NotifHelper::addPendingEvts',JSON.stringify(aty1),JSON.stringify(aty1End))
            let not = {
                title: `'${e.title}' Starting at ${whenFrmtTime(e.start.time)}`,
                body: ` Be/Do '${e.title}' for ${e.duration} mins`,//starting:: ${whenFrmtTime(e.start.time)} //e.title,
                largeBody: ` Be/Do '${e.title}' (${e.score}) from ${whenFrmtTime(e.start.time)} to ${whenFrmtTime(e.end.time)}`, //toSee** look
                id: e.id, //umm could have others?!? toMonitor but should be unique per day? //1,
                schedule: { at: aty1, allowWhileIdle: true },  //add count maybe? //use scheduleOn? prolly no need   // repeats:true >>>>huh that what's cause not scheduling on time?
                //sound: './public/assets/sounds/alarm.aiff', //meh default
                //attachments: null,
                actionTypeId: 'atStart',
                iconColor:hexColor(e.bgcolor), //!e.bgcolor ? '#9d8802' : e.bgcolor.includes("-") ? '#9d8802' : e.bgcolor, // e.bgcolor ?? 'blue', //can break smh color.includes("-") //even normal named can be invalid color smh
                extra: {duration:e.duration, scorey:e.score, end: aty1End, endsAt:whenFrmtTime(e.end.time), name:e.title}, //e.end.time //null,
                channelId: platform != "web" ? 'LocNotifs' : ''  //could use default but prolly better to have custom one(for android)
                //autoCancel?(only for mobile)
              }
            this.pending.push(not); //JSON.stringify(not)
            //console.log('addPendingEvts::Added>>'+e.title,JSON.stringify(not),JSON.stringify(aty),JSON.stringify(aty1),JSON.stringify(another),JSON.stringify(another1))
        }
    }

    scheduleLater(){
        //console.log('scheduleLater!!',JSON.stringify(this.pending.length),this.deliveredNotifications.length)
        //for (const notification of this.pending) {
            //umm no need to do one by one estiii...
            LocalNotifications.schedule({
                notifications: [...this.pending]  //[notification] 
            }).then((res) => {
              console.log("scheduleLater>>good",JSON.stringify(res))
              //console.log(res)

              //prolly no add to delivered yet as later?
              //this.deliveredNotifications.push(notification);
              
              //remove from pending
              //this.pending = this.pending.filter(e => e.id !== notification.id)
              //oldy != this.pending.length ? console.log("schedulePending>>PENDING change",oldy,this.pending.length) : console.log("schedulePending>>PENDING SAME", oldy,this.pending.length) // '' //JSON.stringify(res)
          }).catch((err) => {
              console.log("scheduleLater>>ERROR",err)
              console.log(err)
              //bon here just cancel it.
              //this.cancel(notification.id)
          })
        //}
    }

    async cancel(pendingID) { //: ScheduleResult  : Promise<void>
      
      //for (const notification of this.pending) {
      for(let i = 0; i < this.pending.length; i++){
        if(pendingID == this.pending[i].id){ //notification.id
          console.log('cancel>>notif',pendingID,JSON.stringify(this.pending[i])) //notification
          this.doCancel({
            notifications:[this.pending[i]]
          })
          //LocalNotifications.cancel({
          //  notifications:[this.pending[i]] //notification
          //})

          this.pending.splice(i, 1);
        }
      }

      //this.pending = this.pending.filter(
      //  notification =>
      //    !pending.notifications.find(n => n.id === notification.id),
      //);
    }

    doCancel(toCancel){
      LocalNotifications.cancel(toCancel) //would prolly erase existing notif?!?toSee**
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
//registerPlugin("LocNotifications");



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