package com.octavestreaming.music;

import android.graphics.Bitmap;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;

/**
 * Wraps Capacitor's internal WebViewClient so that we can intercept
 * main-frame network errors (e.g. when the device goes offline while
 * showing https://music.octavestreaming.com/) and fall back to the
 * bundled offline UI at https://localhost/?offline=1.
 *
 * Sub-resource errors are forwarded to the delegate so the live site's
 * own error handling is not disturbed.
 */
public class OfflineFallbackWebViewClient extends WebViewClient {

    private static final String TAG = "OctaveOffline";
    private static final String LOCAL_OFFLINE_URL = "https://localhost/?offline=1";

    private final WebViewClient delegate;

    public OfflineFallbackWebViewClient(WebViewClient delegate) {
        this.delegate = delegate;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        return delegate.shouldOverrideUrlLoading(view, request);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return delegate.shouldOverrideUrlLoading(view, url);
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        delegate.onPageStarted(view, url, favicon);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        delegate.onPageFinished(view, url);
    }

    @Override
    public void onPageCommitVisible(WebView view, String url) {
        delegate.onPageCommitVisible(view, url);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return delegate.shouldInterceptRequest(view, request);
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        return delegate.shouldInterceptRequest(view, url);
    }

    @Override
    public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
        // Legacy callback - only fires for main frame on older APIs.
        Log.w(TAG, "onReceivedError(legacy) " + errorCode + " " + description + " " + failingUrl);
        if (isMainFrameUrl(view, failingUrl)) {
            loadOffline(view, failingUrl);
        } else {
            delegate.onReceivedError(view, errorCode, description, failingUrl);
        }
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        Log.w(TAG, "onReceivedError " + (request.isForMainFrame() ? "[main]" : "[sub]") + " " + request.getUrl());
        if (request.isForMainFrame()) {
            loadOffline(view, request.getUrl().toString());
        } else {
            delegate.onReceivedError(view, request, error);
        }
    }

    @Override
    public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
        // 5xx on main frame -> also fall back to offline UI (server down / CF blocked)
        if (request.isForMainFrame() && errorResponse.getStatusCode() >= 500) {
            Log.w(TAG, "onReceivedHttpError " + errorResponse.getStatusCode() + " on main frame -> offline");
            loadOffline(view, request.getUrl().toString());
        } else {
            delegate.onReceivedHttpError(view, request, errorResponse);
        }
    }

    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        delegate.onReceivedSslError(view, handler, error);
    }

    private boolean isMainFrameUrl(WebView view, String url) {
        return url != null && view != null && url.equals(view.getUrl());
    }

    private void loadOffline(WebView view, String failingUrl) {
        Log.i(TAG, "Falling back to offline UI. failingUrl=" + failingUrl);
        // Avoid infinite loop: never re-load offline URL on top of itself.
        if (LOCAL_OFFLINE_URL.equals(failingUrl) || (failingUrl != null && failingUrl.startsWith("https://localhost"))) {
            Log.i(TAG, "Already on local URL, not reloading.");
            return;
        }
        view.loadUrl(LOCAL_OFFLINE_URL);
    }
}
