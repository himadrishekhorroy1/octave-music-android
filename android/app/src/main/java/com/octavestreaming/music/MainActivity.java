package com.octavestreaming.music;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "OctaveMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // After the bridge is initialised, wrap the existing WebViewClient
        // with our OfflineFallbackWebViewClient so main-frame network errors
        // (device offline while on music.octavestreaming.com) drop the user
        // back to the bundled offline UI.
        try {
            if (bridge != null && bridge.getWebView() != null) {
                WebView webView = bridge.getWebView();
                WebViewClient existing = webView.getWebViewClient();
                if (existing instanceof OfflineFallbackWebViewClient) {
                    Log.i(TAG, "WebViewClient already wrapped, skipping.");
                } else {
                    webView.setWebViewClient(new OfflineFallbackWebViewClient(existing));
                    Log.i(TAG, "Installed OfflineFallbackWebViewClient.");
                }
            } else {
                Log.w(TAG, "Bridge or WebView null, cannot install offline fallback.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to install offline fallback", e);
        }
    }
}
