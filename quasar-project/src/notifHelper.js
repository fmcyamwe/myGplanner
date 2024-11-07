//to track Scheduled notifs and schedule

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();
import{parseTime,addToDate,parsed} from '@quasar/quasar-ui-qcalendar/src/index.js'

const registerNotifications = async () => {
    let permStatus = await LocalNotifications.checkPermissions();

    console.log('NotifHelper::registerNotifications>>CheckP',JSON.stringify(permStatus)); //JSON.parse(JSON.stringify(permStatus))
    for (const index in permStatus) { //just to See....
        console.log('registerNotifications>> '+index,permStatus[index])
    }

    if (permStatus.display === 'prompt') {
        permStatus = await LocalNotifications.requestPermissions();
        console.log('NotifHelper::registerNotifications::requestP',JSON.stringify(permStatus)) //JSON.parse(JSON.stringify(permStatus))
    }

    if (permStatus.display !== 'granted') {
        //throw new Error('User denied permissions!');
        console.log('NotifHelper::registerNotifications::NOPE', permStatus.display,permStatus.receive);
    }

   //await PushNotifications.register();
}
const addListeners = async () => { //

    await LocalNotifications.addListener('localNotificationReceived', notification => {
        console.log('NotifHelper::localNotificationReceived: ', JSON.stringify(notification)); //title, body, largeBody,etc,...
    });

    await LocalNotifications.addListener('localNotificationActionPerformed', notificationAction => {
        console.log('NotifHelper::localNotificationActionPerformed::ACtion>> ', JSON.stringify(notificationAction));//also contains action
    });
}

const getDeliveredNotifications = async () => {
    const notificationList = await LocalNotifications.getDeliveredNotifications();
    console.log('NotifHelper::getDeliveredNotifications',JSON.stringify(notificationList)); //JSON.parse(JSON.stringify(notificationList))

    for (const index in notificationList) { //just to See....
        console.log('NotifHelper::getDeliveredNotifications>> '+index,notificationList[index])
    }
}

const otherNotifInfo = async () => { //works!
    
    //can create channel?!? toTry?
    ///await LocalNotifications.createChannel()
    if (platform != "web") {
      let channels = await LocalNotifications.listChannels();
      console.log('NotifHelper::otherNotifInfo',JSON.stringify(channels));
    }

    //for (const index in channels.channels) { //just to See....
    //    console.log('regis::otherNotifInfo>> '+index,channels[index])
    //}
}

export class CapacitorNotificationsWeb { //extends WebPlugin // implements CapacitorAlarmNotificationPlugin
    //try to have Singleton!!!
    ///>>meh seems ok...
    ///BUT toMonitor** these vars below...
    constructor() {
        //super()
        //umm review below...
        this.name = 'CapacitorNotificationsWeb';
        this.platforms = ['web'];
        this.pending = [];  //LocalNotificationSchema[] = [];
        this.deliveredNotifications = [] ;//protected deliveredNotifications: Notification[] = [];
        this.doInit() //or should invoke?
    }

    doPrint(){
        console.log('NotifHelper>>',"ALLGOOD")
    }

    getState(){ //just to see what's in...
        return {
            pending:this.pending.length,
            delivered:this.deliveredNotifications.length
        }
    }

    doInit(){
        if (platform != "web") {
        

            //FCM.subscribeTo({ topic: "updates" })
            //    .catch((err) => console.log(err));
            console.log('NotifHelper>>ANDROID Platform', platform);
        }else{
            //let isM = isMobile()
            console.log('NotifHelper>>WEB Platform', platform); //isM
        }
        
        registerNotifications();
        addListeners();
        getDeliveredNotifications();
        otherNotifInfo();
    }
    async getDeliveredNotifications() { // :Promise<DeliveredNotifications>
        console.log('NotifHelper::getDeliveredNotifications')

        //should save?!?
        return LocalNotifications.getDeliveredNotifications()
        /*const deliveredSchemas = [];
        console.log('NOTIFS::getDeliveredNotifications',this.deliveredNotifications.length)
        for (const notification of this.deliveredNotifications) {
            const deliveredSchema= {  //LocalNotificationSchema =
              title: notification.title,
              id: parseInt(notification.tag),
              body: notification.body,
            };
            deliveredSchemas.push(deliveredSchema);
        }
        return {
            notifications: deliveredSchemas,
        };*/
    }
    async removeDeliveredNotifications(delivered) { //: DeliveredNotifications, : Promise<void>
        console.log('NotifHelper::removeDeliveredNotifications')

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
        console.log('NotifHelper::removeAllDeliveredNotifications')

        //should save?!?
        return LocalNotifications.removeAllDeliveredNotifications()
        /*for (const notification of this.deliveredNotifications) {
          notification.close();
        }
        this.deliveredNotifications = [];
        */
    }
    scheduleLater(evts,dt){//handling of multiple evts to schedule...
        //console.log('NotifHelper::scheduleLater',JSON.stringify(dt),JSON.stringify(evts))
        
        //let midnightiey = new Date(dt + parseTime(targetDrop.time))
        
        for (const e of evts) {
            //issue of schedule{} time..//todo**
            //or use scheduleOn?
            let mid = addToDate(parsed(dt), { minute: parseTime(e.start.time) })
            let aty = Date.parse(`${mid.date} ${mid.time}`)
            let aty1 = new Date(aty)
            //let at = new Date(getDayTimeIdentifier(mid)) //or getTimeIdentifier ? //+ 1000 * 100
            let not = {
                title: 'Scheduled!',
                body: e.title,//'Body',
                id: e.id, //umm could have others?!? toMonitor but should be unique //1,
                schedule: { at: aty1, allowWhileIdle: true,repeats:true },
                sound: './public/assets/sounds/alarm.aiff',
                attachments: null,
                actionTypeId: '',
                iconColor:!e.bgcolor ? '#9d8802' : e.bgcolor.includes("-") ? '#9d8802' : e.bgcolor, // e.bgcolor ?? 'blue', //can break smh color.includes("-")
                extra: null
              }
            this.pending.push(not);
            //console.log('NotifHelper::scheduleLater>>Added',JSON.stringify(not),JSON.stringify(mid),JSON.stringify(aty),JSON.stringify(aty1))
        }
    }
    async schedule(options) { //: ScheduleOptions : Promise<ScheduleResult>
        //if (!this.hasNotificationSupport()) {
        //  throw this.unavailable('Notifications not supported in this browser.');
        //}
        /*console.log('NOTIFS::schedule', JSON.stringify(options))
        for (const notification of options.notifications) {
          this.sendNotification(notification);
        }
    
        return {
          notifications: options.notifications.map(notification => ({
            id: notification.id,
          })),
        };*/
        
        console.log('NotifHelper::schedule',JSON.stringify(options))
        LocalNotifications.schedule(options)
        .then((res) => {
            console.log("NotifHelper::schedule>>good",JSON.stringify(res))
            console.log(res)
            this.deliveredNotifications.push(...options.notifications);
            //also remove from pending--toTest**
            this.pending = this.pending.filter(notification =>!options.notifications.find(n => n.id === notification.id))
        }).catch((err) => {
            console.log("NotifHelper::schedule>>ERROR",JSON.stringify(err))
            console.log(err)
            this.pending.push(...options.notifications);
        })
    }

    schedulePending(){ //toReview
        console.log('NotifHelper::schedulePending!!')
        for (const notification of this.pending) {
            LocalNotifications.schedule({
                notifications:[notification] 
            })
        }
    }
    /* no need for all below...unless gotta do extra stuff...
    async getPending() { //: Promise<PendingResult>
        return {
          notifications: this.pending,
        };
    }
    async cancel(pending) { //: ScheduleResult  : Promise<void>
        this.pending = this.pending.filter(
          notification =>
            !pending.notifications.find(n => n.id === notification.id),
        );
    }
    
    sendPending() { //: void
        const toRemove = []; //: LocalNotificationSchema[] 
        const now = new Date().getTime();
    
        for (const notification of this.pending) {
          if (notification.schedule?.at && notification.schedule.at.getTime() <= now) {
            this.buildNotification(notification);
            toRemove.push(notification);
          }else{
            console.log('sendPending::ERROR>>skipped!',JSON.stringify(notification))
          }
        }
    
        this.pending = this.pending.filter(
          notification => !toRemove.find(n => n === notification),
        );
    }
    sendNotification(notification) { // LocalNotificationSchema //: void
        if (notification.schedule?.at) {
          let acTime = notification.schedule.at.getTime()
          const diff = acTime - new Date().getTime();
    
          console.log('sendNotification::',JSON.stringify(acTime),JSON.stringify(diff))
          this.pending.push(notification);
          setTimeout(() => {
            this.sendPending();
          }, diff); //diff //should do immediately? yup or get Err>>Scheduled time must be *after* current time BUT gets skipp when immediate smdh
          return;
        }
        this.buildNotification(notification);
    }
    //huh seems more for Web...>>yup complains Notification is not defined
    buildNotification(notification) { //: LocalNotificationSchema, : Notification
        
        if (platform != "web") {
            console.log('buildNotification::ANDROID', JSON.stringify(notification));

            //let done = await LocalNotifications.schedule() //no await without async
            return new Promise((resolve, reject) => {
                // Implementation of the alarm setting logic goes here
                // For now, we will just resolve the promise with a mock result
                //const mockResult = {options}; // Replace with actual result

                //resolve(LocalNotifications.schedule(notification)); //complains no options array...
                resolve(LocalNotifications.schedule({//umm redoing same thing....
                    notifications:[{...notification}]
                }))
              });
              
              //finger crossed...dont seem to do anything smh
              //return Promise.resolve({
              //  notifications:[{...notification}]
              //});
            
        }

        //for browser....should see if works?!?
        const localNotification = new Notification(notification.title, {
          body: notification.body,
          tag: String(notification.id),
        });
        localNotification.addEventListener(
          'click',
          this.onClick.bind(this, notification),
          false,
        );
        localNotification.addEventListener(
          'show',
          this.onShow.bind(this, notification),
          false,
        );
        localNotification.addEventListener(
          'close',
          () => {
            this.deliveredNotifications = this.deliveredNotifications.filter(
              () => !this,
            );
          },
          false,
        );
        this.deliveredNotifications.push(localNotification);
        return localNotification;
    }

    //huh handlers...
    onClick(notification) { //: LocalNotificationSchema : void
        const data = {
          actionId: 'tap',
          notification,
        };
        //wonder if would trigger listeners below!!!
        this.notifyListeners('localNotificationActionPerformed', data);
    }
    
    onShow(notification) { //: LocalNotificationSchema  : void
        this.notifyListeners('localNotificationReceived', notification);
    }*/
}

const LocNotifications = new CapacitorNotificationsWeb();
  //const LocNotification = registerPlugin('LocNotifications'); //Echo //bon to see if naming is diff...
export { LocNotifications };
// registerPlugin(LocNotifications); //huh seems to work?!?