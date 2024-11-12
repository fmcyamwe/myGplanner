//Redo of notifs.js to see about registering listeners?

import { boot } from "quasar/wrappers";
// Platform
//import { Capacitor } from '@capacitor/core';
//const platform = Capacitor.getPlatform();
//import { isMobile } from '../pages/util/isMobile'

//import { registerWebPlugin } from '@capacitor/core'; //deprecated
//import { registerPlugin ,WebPlugin} from '@capacitor/core'; //PluginListenerHandle
//import { LocalNotifications } from '@capacitor/local-notifications';

const PluginsConfig = { //toSee*** when removed in capacitor.config.json
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample", // Example value
      iconColor: "#488AFF", // Example value
      sound: "beep.wav" // Example value
    }
  };


/* //moved into notifHelper...
const registerNotifications = async () => {
    let permStatus = await LocalNotifications.checkPermissions();

    console.log('regis::registerNotifications>>CheckP',JSON.stringify(permStatus)); //JSON.parse(JSON.stringify(permStatus))
    for (const index in permStatus) { //just to See....
        console.log('registerNotifications>> '+index,permStatus[index])
    }

    if (permStatus.display === 'prompt') {
        permStatus = await LocalNotifications.requestPermissions();
        console.log('regis::registerNotifications::requestP',JSON.stringify(permStatus)) //JSON.parse(JSON.stringify(permStatus))
    }

    if (permStatus.display !== 'granted') {
        //throw new Error('User denied permissions!');
        console.log('regis::registerNotifications::NOPE', permStatus.display,permStatus.receive);
    }

   //await PushNotifications.register();
}
const addListeners = async () => { //

    await LocalNotifications.addListener('localNotificationReceived', notification => {
        console.log('regis::localNotificationReceived: ', JSON.stringify(notification)); //title, body, largeBody,etc,...
    });

    await LocalNotifications.addListener('localNotificationActionPerformed', notificationAction => {
        console.log('regis::localNotificationActionPerformed::ACtion>> ', JSON.stringify(notificationAction));//also contains action
    });
}
const otherNotifInfo = async () => { //works!
    
    //can create channel?!? toTry?
    ///await LocalNotifications.createChannel()
    
    let channels = await LocalNotifications.listChannels();
    console.log('regis::otherNotifInfo',JSON.stringify(channels));

    //for (const index in channels.channels) { //just to See....
    //    console.log('regis::otherNotifInfo>> '+index,channels[index])
    //}
}*/


//import { CapacitorAlarmNotificationPlugin, AlarmSetResult } from '../otherDefs';
import {LocNotifications} from '../notifHelper';

//import {PersistentNotification} from '../persistNotif'; //bof still cant call plugin methods smh

//export default async ({ /*app, router, store */ }) => {
export default boot(async ({ /*app, router, store */ }) => { //huh still work when wrapped by boot!!
    // something to do
    //await something()

    /*if (platform != "web") {
        registerNotifications();
        addListeners();
        getDeliveredNotifications();
        otherNotifInfo();

        //FCM.subscribeTo({ topic: "updates" })
        //    .catch((err) => console.log(err));
        console.log('ANDROID Platform', platform);
    }else{
        let isM = isMobile()
        console.log('WEB Platform', platform,isM);
        //if (isM){ //bon just do it still for dev mobile >>permStatus doesnt have .receive in it so throws Error above
        //    registerNotifications();
        //    addListeners();
        //    getDeliveredNotifications();
        //}
    }*/
    
        LocNotifications.doPrint() //huh works...BUT eventListeners dont work for Web

       //PersistentNotification.doPrint() 
})