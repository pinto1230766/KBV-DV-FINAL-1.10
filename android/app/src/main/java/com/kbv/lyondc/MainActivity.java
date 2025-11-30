package com.kbv.lyondc;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.graphics.Insets;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Hybrid solution for Samsung S10 Ultra (Android 15) and S25 Ultra (Android 16/One UI 8.0)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            // Android 16+ (S25 Ultra with One UI 8.0) - Enable edge-to-edge with WindowInsets
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            
            // Set WindowInsets listener for proper status bar handling
            getWindow().getDecorView().setOnApplyWindowInsetsListener((view, insets) -> {
                Insets statusBarInsets = insets.getInsets(WindowInsets.Type.statusBars());
                Insets navigationBarInsets = insets.getInsets(WindowInsets.Type.navigationBars());
                
                // Apply padding to avoid overlap with system bars
                view.setPadding(0, statusBarInsets.top, 0, navigationBarInsets.bottom);
                
                return insets;
            });
        } else {
            // Android 15 and below (S10 Ultra) - Disable edge-to-edge for fixed margins
            // androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        }
    }
}
