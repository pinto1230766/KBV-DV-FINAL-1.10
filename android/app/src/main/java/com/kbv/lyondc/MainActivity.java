package com.kbv.lyondc;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Disable edge-to-edge to ensure status bar is always visible
        // androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
