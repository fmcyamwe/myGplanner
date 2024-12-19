import { boot } from "quasar/wrappers";
import { registerPlugin ,WebPlugin} from '@capacitor/core';

//no need to register in boot really...
export default boot(async ({ app }) => {
    // something to do
  
    //const { Plugins } = Capacitor;
    //const { PersistentNotification } = Plugins;
    //logBatteryInfo(); //toSee if will print?!? if even imported smh
    //logDeviceInfo();
  
    //PersistentNotification.addListener();
  
    //Capacitor.addListener();
});

export class MyNotifActions extends WebPlugin {
    constructor() {
        super({
          name: 'MyNotifActions',
          platforms: ['android']  //umm makes diff?!?>>yup does!
        });
    }

    async getSkippedNotifs(data=null) {//has date >> should not be null?! 
        return { 
            //ids:[] //>> should be array prolly...using '' weirdly surrounds return?!? 
            //bon leaving it blank like for getNotes below
        };
    }
    
    async getStartEndTimes() { //combine Start and EndTimes
        return {}
    }
    
    //async getEndTimes() {
    //    return {}
    //}

    async getNotes(){
        return { 
            //{}
            //what would happen if nothing? can be any object? >>yup set by call 
            //>>getNotes>> {"notes":[{"id":5,"note":"Test test"}]}
        };
    }

    async hasStoredKey(){
        return { 
            //{}
            //what would happen if nothing? can be any object? >>yup set by call 
            //>>getNotes>> {"notes":[{"id":5,"note":"Test test"}]}
        };
    }

    async clearStorage() {
        return {
            value: '',
        };
    }

    async clearStoreKey(data) {
        return {
            value: '',
        };
    }

    async addListeners() { 
        await super.addListener("pauseReceived",()=> {
            console.log('pauseReceived!!!'); //JSON.stringify(notification)
            return{
                uhuh:"oui?"
            }
        })
    }


    //doPrint = async () =>{ //see if better than above? >>nope>> TypeError about destructure
    //    return {
    //        value: '',//this.getUid(),
    //    }; 
    //}
      
    async echo() {
        return {
            identifier: '',//this.getUid(),
        };
    }

    async doPrint(){ //huh not implemented on Android error!!!--have to declare method in JAVA
        console.log('MyNotifActions>>',JSON.stringify("PRINT")) //this dont show huh
       //huh >> one-to-one map with java plugin methods
       
        //add async better? >>YEEES!! and gets populated by promise result too!!
        return {
            value: '',//this.getUid(),
        };
    }

    //async orientation() { //toRemove--not needed
    //    return { type: window.screen.orientation.type };
    //}
}

//const MyNotifActions = new MyNotifActions();
const NotifActions = registerPlugin('MyNotifActions', new MyNotifActions());
export { NotifActions }; //huh above works!!! >toTest if works with just name(as below)?
//registerPlugin("MyNotifActions");

//const ScreenOrientation = registerPlugin('ScreenOrientation', {
//    web: () => import('./web').then(m => new m.ScreenOrientationWeb()),
//});