import { boot } from "quasar/wrappers";
import { PersistentNotification } from "capacitor-persistent-notification";

//import { registerPlugin } from "@capacitor/core"; //borks...not exported...

//import { Capacitor, Plugin } from "@capacitor/core"; //complains about Plugin(normal build)
import { Device } from "@capacitor/device";

//import type { LocalNotificationsPlugin } from './definitions';
//import App from './App';

const logDeviceInfo = async () => {
  const info = await Device.getInfo();

  console.log("::logDeviceInfo::", info);
};

const logBatteryInfo = async () => {
  const info = await Device.getBatteryInfo();

  console.log("::logBatteryInfo::", info);
};

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app }) => {
  // something to do

  //const { Plugins } = Capacitor;
  //const { PersistentNotification } = Plugins;
  logBatteryInfo(); //toSee if will print?!? if even imported smh
  logDeviceInfo();

  //PersistentNotification.addListener();

  //Capacitor.addListener();
});
