package org.capacitor.BluTomato;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;

import com.getcapacitor.Plugin;

import java.util.ArrayList;
// my plugin
import org.capacitor.BluTomato.LocalNotification;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
      registerPlugin(LocalNotificationsPlugin.class);

      super.onCreate(savedInstanceState);

        // Initializes the Bridge >>complains..and deprecated
        /*this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        // Additional plugins you've installed go here
        // Ex: add(TotallyAwesomePlugin.class);
            add(LocalNotificationsPlugin.class);
        }}); */
    }
}
