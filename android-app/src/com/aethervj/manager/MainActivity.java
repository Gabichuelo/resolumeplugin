package com.aethervj.manager;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiNetworkSpecifier;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class MainActivity extends Activity {

    private static final String PREFS_NAME = "aether_vj_manager_prefs";
    private static final String KEY_SAVED_LIST = "saved_minipcs_v1";
    private static final String KEY_LAST_ENTRY = "last_minipc_v1";
    private static final String DEFAULT_HOTSPOT_PASS = "aethervj2026";
    private static final int REQ_LOCATION_PERMS = 1001;
    private static final int REQ_FILE_CHOOSER = 1002;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private SharedPreferences prefs;
    private WifiManager wifiManager;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback activeHotspotCallback;

    // UI raiz: gestor vs mando webview
    private LinearLayout managerContainer;
    private LinearLayout webContainer;
    private LinearLayout lastUsedCardWrap;
    private LinearLayout lanListLayout;
    private LinearLayout wifiListLayout;
    private LinearLayout savedListLayout;
    private TextView statusBanner;
    private CheckBox chkShowAllWifi;

    // WebView
    private WebView webView;
    private TextView webTitleText;
    private String activeBaseUrl = "";
    private String activeFallbackUrl = "";
    private boolean fallbackTried = false;
    private ValueCallback<Uri[]> filePathCallback;

    // Estado de escaneo
    private boolean showAllWifi = false;
    private boolean scanningLan = false;
    private boolean wifiReceiverRegistered = false;
    private final Map<String, WifiFound> foundWifiMap = new LinkedHashMap<>();
    private final List<DiscoveredHost> foundLanList = new ArrayList<>();

    private static class WifiFound {
        String ssid;
        int level;
    }

    private static class DiscoveredHost {
        String name;
        String url;
        String fallbackUrl;
        String detail;
        boolean isHotspot;
    }

    private final BroadcastReceiver wifiScanReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            readWifiScanResults();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        wifiManager = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        buildUi();
        renderSavedList();
        renderLastUsedCard();
        registerWifiReceiver();
        refreshAllScans();
    }

    @Override
    protected void onDestroy() {
        if (wifiReceiverRegistered) {
            try {
                unregisterReceiver(wifiScanReceiver);
            } catch (Exception ignored) {
            }
            wifiReceiverRegistered = false;
        }
        unbindProcessNetwork();
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webContainer.getVisibility() == View.VISIBLE) {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
            } else {
                showManagerScreen();
            }
            return;
        }
        super.onBackPressed();
    }

    // ==================== CONSTRUCCIÓN DE UI NATIVA ====================

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private GradientDrawable boxBg(int fillColor, int strokeColor, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fillColor);
        d.setCornerRadius(dp(radiusDp));
        if (strokeColor != 0) {
            d.setStroke(dp(1), strokeColor);
        }
        return d;
    }

    private Button makeBtn(String label, int fillColor, int textColor, int strokeColor) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(textColor);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setBackground(boxBg(fillColor, strokeColor, 8));
        b.setPadding(dp(12), dp(8), dp(12), dp(8));
        b.setMinHeight(dp(40));
        b.setMinimumHeight(dp(40));
        return b;
    }

    private TextView makeSectionHeader(String title) {
        TextView tv = new TextView(this);
        tv.setText(title);
        tv.setTextColor(Color.parseColor("#00E5FF"));
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(14);
        lp.bottomMargin = dp(6);
        tv.setLayoutParams(lp);
        return tv;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void buildUi() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#060910"));

        // ---------- PANTALLA 1: GESTOR DE MINI-PCs ----------
        managerContainer = new LinearLayout(this);
        managerContainer.setOrientation(LinearLayout.VERTICAL);

        // Cabecera
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        topBar.setBackgroundColor(Color.parseColor("#0B111E"));
        topBar.setPadding(dp(14), dp(12), dp(14), dp(12));

        LinearLayout titleCol = new LinearLayout(this);
        titleCol.setOrientation(LinearLayout.VERTICAL);
        titleCol.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView appTitle = new TextView(this);
        appTitle.setText("AETHER-VJ MANAGER");
        appTitle.setTextColor(Color.parseColor("#00E5FF"));
        appTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        appTitle.setTypeface(Typeface.DEFAULT_BOLD);
        titleCol.addView(appTitle);

        TextView appSub = new TextView(this);
        appSub.setText("Mini-PCs por Hotspot Wi-Fi o Red Local");
        appSub.setTextColor(Color.parseColor("#94A3B8"));
        appSub.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        titleCol.addView(appSub);
        topBar.addView(titleCol);

        Button btnScan = makeBtn("🔄 BUSCAR", Color.parseColor("#132A3E"), Color.parseColor("#00E5FF"), Color.parseColor("#00E5FF"));
        LinearLayout.LayoutParams bScanLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bScanLp.rightMargin = dp(6);
        btnScan.setLayoutParams(bScanLp);
        btnScan.setOnClickListener(v -> refreshAllScans());
        topBar.addView(btnScan);

        Button btnAdd = makeBtn("➕ IP", Color.parseColor("#1E293B"), Color.WHITE, Color.parseColor("#475569"));
        btnAdd.setOnClickListener(v -> showAddManualDialog());
        topBar.addView(btnAdd);

        managerContainer.addView(topBar);

        // Barra de estado
        statusBanner = new TextView(this);
        statusBanner.setText("Buscando redes AETHER y Mini-PCs...");
        statusBanner.setTextColor(Color.parseColor("#E2E8F0"));
        statusBanner.setBackgroundColor(Color.parseColor("#0F172A"));
        statusBanner.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        statusBanner.setPadding(dp(14), dp(8), dp(14), dp(8));
        managerContainer.addView(statusBanner);

        ScrollView scroll = new ScrollView(this);
        scroll.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(12), dp(8), dp(12), dp(24));

        // Acceso rápido al último Mini-PC
        lastUsedCardWrap = new LinearLayout(this);
        lastUsedCardWrap.setOrientation(LinearLayout.VERTICAL);
        body.addView(lastUsedCardWrap);

        // Mini-PCs en la red actual
        body.addView(makeSectionHeader("🌐 CONECTADOS AHORA EN TU RED / HOTSPOT"));
        lanListLayout = new LinearLayout(this);
        lanListLayout.setOrientation(LinearLayout.VERTICAL);
        body.addView(lanListLayout);

        // Redes Wi-Fi AETHER cercanas
        body.addView(makeSectionHeader("📡 REDES WI-FI DE MINI-PCs (HOTSPOT)"));
        chkShowAllWifi = new CheckBox(this);
        chkShowAllWifi.setText("Mostrar todas las redes Wi-Fi (si cambiaste el nombre)");
        chkShowAllWifi.setTextColor(Color.parseColor("#CBD5E1"));
        chkShowAllWifi.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        chkShowAllWifi.setOnCheckedChangeListener((buttonView, isChecked) -> {
            showAllWifi = isChecked;
            renderWifiList();
        });
        body.addView(chkShowAllWifi);

        wifiListLayout = new LinearLayout(this);
        wifiListLayout.setOrientation(LinearLayout.VERTICAL);
        body.addView(wifiListLayout);

        // Mini-PCs Guardados
        body.addView(makeSectionHeader("⭐ MINI-PCs GUARDADOS"));
        savedListLayout = new LinearLayout(this);
        savedListLayout.setOrientation(LinearLayout.VERTICAL);
        body.addView(savedListLayout);

        scroll.addView(body);
        managerContainer.addView(scroll);
        root.addView(managerContainer);

        // ---------- PANTALLA 2: MANDO REMOTO WEBVIEW ----------
        webContainer = new LinearLayout(this);
        webContainer.setOrientation(LinearLayout.VERTICAL);
        webContainer.setVisibility(View.GONE);

        LinearLayout webBar = new LinearLayout(this);
        webBar.setOrientation(LinearLayout.HORIZONTAL);
        webBar.setGravity(Gravity.CENTER_VERTICAL);
        webBar.setBackgroundColor(Color.parseColor("#0B111E"));
        webBar.setPadding(dp(8), dp(6), dp(8), dp(6));

        Button btnBack = makeBtn("⬅ MINI-PCs", Color.parseColor("#1E293B"), Color.parseColor("#00E5FF"), Color.parseColor("#334155"));
        btnBack.setMinHeight(dp(34));
        btnBack.setMinimumHeight(dp(34));
        btnBack.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnBack.setOnClickListener(v -> showManagerScreen());
        webBar.addView(btnBack);

        webTitleText = new TextView(this);
        webTitleText.setText("Mando Remoto");
        webTitleText.setTextColor(Color.WHITE);
        webTitleText.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        webTitleText.setTypeface(Typeface.DEFAULT_BOLD);
        webTitleText.setSingleLine(true);
        webTitleText.setEllipsize(TextUtils.TruncateAt.END);
        webTitleText.setPadding(dp(10), 0, dp(10), 0);
        webTitleText.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        webBar.addView(webTitleText);

        Button btnReload = makeBtn("🔄", Color.parseColor("#1E293B"), Color.WHITE, Color.parseColor("#334155"));
        btnReload.setMinHeight(dp(34));
        btnReload.setMinimumHeight(dp(34));
        btnReload.setPadding(dp(10), dp(4), dp(10), dp(4));
        btnReload.setOnClickListener(v -> {
            if (webView != null) webView.reload();
        });
        webBar.addView(btnReload);
        webContainer.addView(webBar);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#070A10"));
        webView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame() && !fallbackTried
                        && activeFallbackUrl != null && !activeFallbackUrl.isEmpty()
                        && !activeFallbackUrl.equals(activeBaseUrl)) {
                    fallbackTried = true;
                    mainHandler.post(() -> webView.loadUrl(activeFallbackUrl));
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("AETHER-VJ")
                        .setMessage(message)
                        .setPositiveButton("OK", (d, w) -> result.confirm())
                        .setOnCancelListener(d -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setTitle("AETHER-VJ")
                        .setMessage(message)
                        .setPositiveButton("Sí", (d, w) -> result.confirm())
                        .setNegativeButton("Cancelar", (d, w) -> result.cancel())
                        .setOnCancelListener(d -> result.cancel())
                        .show();
                return true;
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "video/*"});
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(intent, "Elegir fotos, logos o vídeos"), REQ_FILE_CHOOSER);
                } catch (Exception e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "No se pudo abrir el selector de archivos", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webContainer.addView(webView);
        root.addView(webContainer);

        setContentView(root);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE_CHOOSER) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    ClipData clip = data.getClipData();
                    if (clip != null && clip.getItemCount() > 0) {
                        results = new Uri[clip.getItemCount()];
                        for (int i = 0; i < clip.getItemCount(); i++) {
                            results[i] = clip.getItemAt(i).getUri();
                        }
                    } else if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    // ==================== PERMISOS Y ESCANEO WI-FI / LAN ====================

    private void registerWifiReceiver() {
        if (wifiReceiverRegistered) return;
        IntentFilter filter = new IntentFilter(WifiManager.SCAN_RESULTS_AVAILABLE_ACTION);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(wifiScanReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(wifiScanReceiver, filter);
        }
        wifiReceiverRegistered = true;
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void refreshAllScans() {
        statusBanner.setText("⏳ Buscando redes Wi-Fi AETHER y Mini-PCs en red...");
        scanWifiNetworks();
        scanLanAndHotspot();
    }

    private void scanWifiNetworks() {
        if (wifiManager == null) {
            renderWifiList();
            return;
        }
        if (!hasLocationPermission()) {
            requestPermissions(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, REQ_LOCATION_PERMS);
            renderWifiList();
            return;
        }
        readWifiScanResults();
        try {
            wifiManager.startScan();
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_LOCATION_PERMS) {
            scanWifiNetworks();
        }
    }

    @SuppressLint("MissingPermission")
    private void readWifiScanResults() {
        if (wifiManager == null || !hasLocationPermission()) {
            renderWifiList();
            return;
        }
        try {
            List<ScanResult> results = wifiManager.getScanResults();
            foundWifiMap.clear();
            if (results != null) {
                for (ScanResult sr : results) {
                    if (sr == null || TextUtils.isEmpty(sr.SSID)) continue;
                    WifiFound existing = foundWifiMap.get(sr.SSID);
                    if (existing == null || sr.level > existing.level) {
                        WifiFound wf = new WifiFound();
                        wf.ssid = sr.SSID;
                        wf.level = sr.level;
                        foundWifiMap.put(sr.SSID, wf);
                    }
                }
            }
        } catch (Exception ignored) {
        }
        renderWifiList();
    }

    private void scanLanAndHotspot() {
        if (scanningLan) return;
        scanningLan = true;
        foundLanList.clear();
        renderLanList();

        ExecutorService pool = Executors.newFixedThreadPool(32);
        List<String> prefixes = new ArrayList<>();
        String wifiSub = getCurrentWifiSubnetPrefix();
        if (wifiSub != null) prefixes.add(wifiSub);

        try {
            Enumeration<NetworkInterface> ifaces = NetworkInterface.getNetworkInterfaces();
            while (ifaces != null && ifaces.hasMoreElements()) {
                NetworkInterface ni = ifaces.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                Enumeration<InetAddress> addrs = ni.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (addr instanceof Inet4Address) {
                        String host = addr.getHostAddress();
                        if (host != null && (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172."))) {
                            int dot = host.lastIndexOf('.');
                            if (dot > 0) {
                                String p = host.substring(0, dot + 1);
                                if (!prefixes.contains(p)) prefixes.add(p);
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // Siempre comprobar primero el Hotspot directo 10.42.0.1
        pool.submit(() -> probeHost("10.42.0.1", true));

        for (String prefix : prefixes) {
            for (int i = 1; i <= 254; i++) {
                final String ip = prefix + i;
                if ("10.42.0.1".equals(ip)) continue;
                pool.submit(() -> probeHost(ip, false));
            }
        }

        new Thread(() -> {
            pool.shutdown();
            try {
                pool.awaitTermination(4500, TimeUnit.MILLISECONDS);
            } catch (InterruptedException ignored) {
            }
            mainHandler.post(() -> {
                scanningLan = false;
                renderLanList();
                int total = foundLanList.size() + countAetherWifis();
                if (total > 0) {
                    statusBanner.setText("✅ Escaneo listo: " + foundLanList.size() + " en red actual · "
                            + countAetherWifis() + " Wi-Fi AETHER detectada(s).");
                } else {
                    statusBanner.setText("Pulsa 🔄 BUSCAR si acabas de encender un Mini-PC o entra por IP manual.");
                }
            });
        }).start();
    }

    private String getCurrentWifiSubnetPrefix() {
        if (wifiManager == null) return null;
        try {
            WifiInfo info = wifiManager.getConnectionInfo();
            if (info != null && info.getIpAddress() != 0) {
                int ip = info.getIpAddress();
                return String.format(Locale.US, "%d.%d.%d.",
                        (ip & 0xff), ((ip >> 8) & 0xff), ((ip >> 16) & 0xff));
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private void probeHost(String ip, boolean isHotspotIp) {
        int[] ports = isHotspotIp ? new int[]{80, 8080} : new int[]{8080};
        for (int port : ports) {
            HttpURLConnection conn = null;
            try {
                String baseUrl = port == 80
                        ? "http://" + ip + "/remote.html"
                        : "http://" + ip + ":" + port + "/remote.html";
                String infoUrl = port == 80
                        ? "http://" + ip + "/api/network-info"
                        : "http://" + ip + ":" + port + "/api/network-info";
                conn = (HttpURLConnection) new URL(infoUrl).openConnection();
                conn.setConnectTimeout(isHotspotIp ? 550 : 320);
                conn.setReadTimeout(isHotspotIp ? 650 : 350);
                if (conn.getResponseCode() == 200) {
                    BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) sb.append(line);
                    br.close();
                    JSONObject obj = new JSONObject(sb.toString());
                    if (obj.optBoolean("ok", false)) {
                        DiscoveredHost dh = new DiscoveredHost();
                        dh.isHotspot = isHotspotIp;
                        dh.url = baseUrl;
                        dh.fallbackUrl = "http://" + ip + ":8080/remote.html";
                        String label = obj.optString("hostname", "aether");
                        if (isHotspotIp) {
                            String curSsid = getConnectedWifiSsid();
                            dh.name = !curSsid.isEmpty() ? ("Hotspot " + curSsid) : "Mini-PC Hotspot (10.42.0.1)";
                        } else {
                            dh.name = "Mini-PC (" + ip + ")";
                        }
                        dh.detail = label + " · " + ip + (port == 80 ? "" : ":" + port);
                        synchronized (foundLanList) {
                            boolean dup = false;
                            for (DiscoveredHost ex : foundLanList) {
                                if (ex.fallbackUrl.equals(dh.fallbackUrl)) {
                                    dup = true;
                                    break;
                                }
                            }
                            if (!dup) foundLanList.add(dh);
                        }
                        mainHandler.post(this::renderLanList);
                        return;
                    }
                }
            } catch (Exception ignored) {
            } finally {
                if (conn != null) conn.disconnect();
            }
        }
    }

    private String getConnectedWifiSsid() {
        if (wifiManager == null || !hasLocationPermission()) return "";
        try {
            WifiInfo info = wifiManager.getConnectionInfo();
            if (info != null && info.getSSID() != null) {
                String s = info.getSSID();
                if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) {
                    s = s.substring(1, s.length() - 1);
                }
                if (!"<unknown ssid>".equalsIgnoreCase(s)) return s;
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private int countAetherWifis() {
        int c = 0;
        for (WifiFound wf : foundWifiMap.values()) {
            if (wf.ssid.toUpperCase(Locale.ROOT).contains("AETHER")) c++;
        }
        return c;
    }

    // ==================== CONEXIÓN A HOTSPOT & WEBVIEW ====================

    private void unbindProcessNetwork() {
        if (connectivityManager != null) {
            try {
                connectivityManager.bindProcessToNetwork(null);
            } catch (Exception ignored) {
            }
            if (activeHotspotCallback != null) {
                try {
                    connectivityManager.unregisterNetworkCallback(activeHotspotCallback);
                } catch (Exception ignored) {
                }
                activeHotspotCallback = null;
            }
        }
    }

    private void connectToHotspot(String ssid, String pass) {
        final String usePass = TextUtils.isEmpty(pass) ? DEFAULT_HOTSPOT_PASS : pass;
        statusBanner.setText("📡 Conectando a Wi-Fi '" + ssid + "'...");

        if (Build.VERSION.SDK_INT >= 29 && connectivityManager != null) {
            unbindProcessNetwork();
            try {
                WifiNetworkSpecifier spec = new WifiNetworkSpecifier.Builder()
                        .setSsid(ssid)
                        .setWpa2Passphrase(usePass)
                        .build();
                NetworkRequest req = new NetworkRequest.Builder()
                        .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                        .removeCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                        .setNetworkSpecifier(spec)
                        .build();

                activeHotspotCallback = new ConnectivityManager.NetworkCallback() {
                    @Override
                    public void onAvailable(Network network) {
                        connectivityManager.bindProcessToNetwork(network);
                        mainHandler.postDelayed(() -> {
                            saveMiniPcEntry(ssid, "hotspot", ssid, usePass, "http://10.42.0.1/remote.html");
                            statusBanner.setText("✅ Conectado a " + ssid + " (10.42.0.1)");
                            openRemoteUrl(ssid, "http://10.42.0.1/remote.html", "http://10.42.0.1:8080/remote.html");
                        }, 700);
                    }

                    @Override
                    public void onUnavailable() {
                        mainHandler.post(() -> {
                            statusBanner.setText("❌ No se pudo conectar a '" + ssid + "'. Revisa clave (defecto: " + DEFAULT_HOTSPOT_PASS + ") o pulsa 🔑.");
                            Toast.makeText(MainActivity.this, "No conectó con " + ssid, Toast.LENGTH_LONG).show();
                        });
                    }
                };
                connectivityManager.requestNetwork(req, activeHotspotCallback, 25000);
            } catch (Exception e) {
                statusBanner.setText("❌ Error conectando a Wi-Fi: " + e.getMessage());
            }
        } else {
            // Android 8/9 fallback
            try {
                WifiConfiguration conf = new WifiConfiguration();
                conf.SSID = "\"" + ssid + "\"";
                conf.preSharedKey = "\"" + usePass + "\"";
                int netId = wifiManager.addNetwork(conf);
                if (netId != -1) {
                    wifiManager.disconnect();
                    wifiManager.enableNetwork(netId, true);
                    wifiManager.reconnect();
                    mainHandler.postDelayed(() -> {
                        saveMiniPcEntry(ssid, "hotspot", ssid, usePass, "http://10.42.0.1/remote.html");
                        openRemoteUrl(ssid, "http://10.42.0.1/remote.html", "http://10.42.0.1:8080/remote.html");
                    }, 3500);
                }
            } catch (Exception e) {
                Toast.makeText(this, "Conéctate manualmente a la Wi-Fi " + ssid, Toast.LENGTH_LONG).show();
            }
        }
    }

    private void openLanEntry(String name, String url, String fallbackUrl) {
        if (!url.contains("10.42.0.1")) {
            unbindProcessNetwork();
        }
        saveMiniPcEntry(name, "lan", "", "", url);
        openRemoteUrl(name, url, fallbackUrl);
    }

    private void openRemoteUrl(String name, String url, String fallbackUrl) {
        activeBaseUrl = url;
        activeFallbackUrl = TextUtils.isEmpty(fallbackUrl) ? url : fallbackUrl;
        fallbackTried = false;
        webTitleText.setText(name + " · " + url.replace("http://", "").replace("/remote.html", ""));
        managerContainer.setVisibility(View.GONE);
        webContainer.setVisibility(View.VISIBLE);
        webView.loadUrl(url);
    }

    private void showManagerScreen() {
        webContainer.setVisibility(View.GONE);
        managerContainer.setVisibility(View.VISIBLE);
        renderLastUsedCard();
        renderSavedList();
    }

    // ==================== PERSISTENCIA (SHARED PREFERENCES) ====================

    private JSONArray loadSavedArray() {
        try {
            String raw = prefs.getString(KEY_SAVED_LIST, "[]");
            return new JSONArray(raw);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private void saveSavedArray(JSONArray arr) {
        prefs.edit().putString(KEY_SAVED_LIST, arr.toString()).apply();
        renderSavedList();
        renderLastUsedCard();
    }

    private void saveMiniPcEntry(String name, String type, String ssid, String pass, String url) {
        try {
            JSONObject entry = new JSONObject();
            entry.put("name", name);
            entry.put("type", type);
            entry.put("ssid", ssid == null ? "" : ssid);
            entry.put("pass", TextUtils.isEmpty(pass) ? DEFAULT_HOTSPOT_PASS : pass);
            entry.put("url", url);

            prefs.edit().putString(KEY_LAST_ENTRY, entry.toString()).apply();

            JSONArray arr = loadSavedArray();
            JSONArray next = new JSONArray();
            next.put(entry);
            String keyNew = "hotspot".equals(type) ? ("H:" + ssid) : ("L:" + url);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.optJSONObject(i);
                if (o == null) continue;
                String k = "hotspot".equals(o.optString("type"))
                        ? ("H:" + o.optString("ssid"))
                        : ("L:" + o.optString("url"));
                if (!keyNew.equals(k)) {
                    next.put(o);
                }
            }
            saveSavedArray(next);
        } catch (Exception ignored) {
        }
    }

    private String getSavedPassForSsid(String ssid) {
        JSONArray arr = loadSavedArray();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o != null && ssid.equals(o.optString("ssid")) && !TextUtils.isEmpty(o.optString("pass"))) {
                return o.optString("pass");
            }
        }
        return DEFAULT_HOTSPOT_PASS;
    }

    private void deleteSavedIndex(int idx) {
        JSONArray arr = loadSavedArray();
        JSONArray next = new JSONArray();
        for (int i = 0; i < arr.length(); i++) {
            if (i != idx) {
                JSONObject o = arr.optJSONObject(i);
                if (o != null) next.put(o);
            }
        }
        saveSavedArray(next);
    }

    // ==================== RENDER DE LISTAS Y DIÁLOGOS ====================

    private void addEmptyHint(LinearLayout parent, String text) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextColor(Color.parseColor("#64748B"));
        tv.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        tv.setBackground(boxBg(Color.parseColor("#0B111E"), Color.parseColor("#1E293B"), 8));
        tv.setPadding(dp(12), dp(10), dp(12), dp(10));
        parent.addView(tv);
    }

    private LinearLayout makeCardRow(String title, String subtitle, String actionText, View.OnClickListener onAction) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setBackground(boxBg(Color.parseColor("#0F172A"), Color.parseColor("#1E293B"), 10));
        card.setPadding(dp(12), dp(10), dp(12), dp(10));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = dp(8);
        card.setLayoutParams(lp);

        LinearLayout txtCol = new LinearLayout(this);
        txtCol.setOrientation(LinearLayout.VERTICAL);
        txtCol.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView tvTitle = new TextView(this);
        tvTitle.setText(title);
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        tvTitle.setTypeface(Typeface.DEFAULT_BOLD);
        txtCol.addView(tvTitle);

        TextView tvSub = new TextView(this);
        tvSub.setText(subtitle);
        tvSub.setTextColor(Color.parseColor("#94A3B8"));
        tvSub.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        txtCol.addView(tvSub);
        card.addView(txtCol);

        Button btn = makeBtn(actionText, Color.parseColor("#083344"), Color.parseColor("#00E5FF"), Color.parseColor("#00E5FF"));
        btn.setOnClickListener(onAction);
        card.addView(btn);
        return card;
    }

    private void renderLastUsedCard() {
        lastUsedCardWrap.removeAllViews();
        try {
            String raw = prefs.getString(KEY_LAST_ENTRY, "");
            if (TextUtils.isEmpty(raw)) return;
            JSONObject last = new JSONObject(raw);
            String name = last.optString("name", "Último Mini-PC");
            String type = last.optString("type", "lan");
            String ssid = last.optString("ssid", "");
            String pass = last.optString("pass", DEFAULT_HOTSPOT_PASS);
            String url = last.optString("url", "http://10.42.0.1/remote.html");

            lastUsedCardWrap.addView(makeSectionHeader("⚡ ÚLTIMO MINI-PC USADO"));
            String sub = "hotspot".equals(type) ? ("Wi-Fi " + ssid + " · 10.42.0.1") : url;
            LinearLayout card = makeCardRow("▶ " + name, sub, "ABRIR", v -> {
                if ("hotspot".equals(type) && !TextUtils.isEmpty(ssid)) {
                    connectToHotspot(ssid, pass);
                } else {
                    openLanEntry(name, url, url.replace("/remote.html", ":8080/remote.html"));
                }
            });
            card.setBackground(boxBg(Color.parseColor("#091B26"), Color.parseColor("#00E5FF"), 10));
            lastUsedCardWrap.addView(card);
        } catch (Exception ignored) {
        }
    }

    private void renderLanList() {
        lanListLayout.removeAllViews();
        List<DiscoveredHost> copy;
        synchronized (foundLanList) {
            copy = new ArrayList<>(foundLanList);
        }
        if (copy.isEmpty()) {
            addEmptyHint(lanListLayout, scanningLan
                    ? "⏳ Escaneando tu red actual..."
                    : "Ninguno detectado en la Wi-Fi/red actual. Conéctate abajo a un Hotspot o añade su IP.");
            return;
        }
        for (DiscoveredHost dh : copy) {
            lanListLayout.addView(makeCardRow(
                    (dh.isHotspot ? "🟢 " : "🖥 ") + dh.name,
                    dh.detail,
                    "ABRIR MANDO",
                    v -> openLanEntry(dh.name, dh.url, dh.fallbackUrl)
            ));
        }
    }

    private void renderWifiList() {
        wifiListLayout.removeAllViews();
        if (!hasLocationPermission()) {
            addEmptyHint(wifiListLayout, "Concede permiso de Ubicación (obligatorio en Android para ver redes Wi-Fi cercanas) y pulsa 🔄 BUSCAR.");
            return;
        }
        List<WifiFound> list = new ArrayList<>(foundWifiMap.values());
        Collections.sort(list, Comparator.comparingInt((WifiFound a) -> a.level).reversed());

        List<WifiFound> filtered = new ArrayList<>();
        for (WifiFound wf : list) {
            boolean isAether = wf.ssid.toUpperCase(Locale.ROOT).contains("AETHER");
            if (isAether || showAllWifi) {
                filtered.add(wf);
            }
        }
        if (filtered.isEmpty()) {
            addEmptyHint(wifiListLayout, "No se ven redes Wi-Fi 'AETHER*' cerca. Activa la casilla de arriba si usaste otro nombre o pulsa 🔄 BUSCAR.");
            return;
        }
        for (WifiFound wf : filtered) {
            String sigLabel = wf.level >= -60 ? "📶 Muy fuerte" : (wf.level >= -75 ? "📶 Buena" : "📶 Débil");
            LinearLayout card = makeCardRow(
                    "📡 " + wf.ssid,
                    sigLabel + " (" + wf.level + " dBm)",
                    "CONECTAR",
                    v -> connectToHotspot(wf.ssid, getSavedPassForSsid(wf.ssid))
            );
            Button keyBtn = makeBtn("🔑", Color.parseColor("#1E293B"), Color.WHITE, Color.parseColor("#334155"));
            LinearLayout.LayoutParams klp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            klp.leftMargin = dp(6);
            keyBtn.setLayoutParams(klp);
            keyBtn.setOnClickListener(v -> showWifiPasswordDialog(wf.ssid));
            card.addView(keyBtn);
            wifiListLayout.addView(card);
        }
    }

    private void renderSavedList() {
        savedListLayout.removeAllViews();
        JSONArray arr = loadSavedArray();
        if (arr.length() == 0) {
            addEmptyHint(savedListLayout, "Aquí se guardarán automáticamente todos tus Mini-PCs al entrar por primera vez.");
            return;
        }
        for (int i = 0; i < arr.length(); i++) {
            final int idx = i;
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            final String name = o.optString("name", "Mini-PC");
            final String type = o.optString("type", "lan");
            final String ssid = o.optString("ssid", "");
            final String pass = o.optString("pass", DEFAULT_HOTSPOT_PASS);
            final String url = o.optString("url", "http://10.42.0.1/remote.html");

            String sub = "hotspot".equals(type) ? ("Hotspot Wi-Fi: " + ssid + " · 10.42.0.1") : url;
            LinearLayout card = makeCardRow(
                    ("hotspot".equals(type) ? "📡 " : "🌐 ") + name,
                    sub,
                    "▶ ABRIR",
                    v -> {
                        if ("hotspot".equals(type) && !TextUtils.isEmpty(ssid)) {
                            connectToHotspot(ssid, pass);
                        } else {
                            openLanEntry(name, url, url);
                        }
                    }
            );
            Button delBtn = makeBtn("🗑", Color.parseColor("#3B0A0A"), Color.parseColor("#FCA5A5"), Color.parseColor("#7F1D1D"));
            LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            dlp.leftMargin = dp(6);
            delBtn.setLayoutParams(dlp);
            delBtn.setOnClickListener(v -> deleteSavedIndex(idx));
            card.addView(delBtn);
            savedListLayout.addView(card);
        }
    }

    private void showWifiPasswordDialog(String ssid) {
        EditText input = new EditText(this);
        input.setText(getSavedPassForSsid(ssid));
        input.setHint("Contraseña Wi-Fi");
        input.setPadding(dp(16), dp(12), dp(16), dp(12));
        new AlertDialog.Builder(this)
                .setTitle("Clave para " + ssid)
                .setView(input)
                .setPositiveButton("Conectar y Guardar", (d, w) -> {
                    String p = input.getText().toString().trim();
                    if (TextUtils.isEmpty(p)) p = DEFAULT_HOTSPOT_PASS;
                    saveMiniPcEntry(ssid, "hotspot", ssid, p, "http://10.42.0.1/remote.html");
                    connectToHotspot(ssid, p);
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void showAddManualDialog() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18), dp(12), dp(18), dp(4));

        EditText inpName = new EditText(this);
        inpName.setHint("Nombre (ej: Escenario Izquierda)");
        box.addView(inpName);

        EditText inpHost = new EditText(this);
        inpHost.setHint("IP (ej: 192.168.1.151) o Nombre Wi-Fi (ej: AETHER-2)");
        inpHost.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        box.addView(inpHost);

        EditText inpPass = new EditText(this);
        inpPass.setHint("Clave Hotspot si es Wi-Fi (defecto: " + DEFAULT_HOTSPOT_PASS + ")");
        box.addView(inpPass);

        new AlertDialog.Builder(this)
                .setTitle("Añadir Mini-PC")
                .setView(box)
                .setPositiveButton("Guardar y Abrir", (d, w) -> {
                    String val = inpHost.getText().toString().trim();
                    if (TextUtils.isEmpty(val)) return;
                    String name = inpName.getText().toString().trim();
                    if (TextUtils.isEmpty(name)) name = val;
                    boolean looksLikeIpOrUrl = val.startsWith("http") || val.matches("^[0-9]{1,3}(\\.[0-9]{1,3}){3}(:[0-9]+)?$") || val.endsWith(".local");
                    if (looksLikeIpOrUrl) {
                        String u = val.startsWith("http") ? val : ("http://" + (val.contains(":") ? val : (val + ":8080")) + "/remote.html");
                        if (!u.endsWith(".html") && !u.endsWith("/")) u += "/remote.html";
                        openLanEntry(name, u, u);
                    } else {
                        String pass = inpPass.getText().toString().trim();
                        if (TextUtils.isEmpty(pass)) pass = DEFAULT_HOTSPOT_PASS;
                        saveMiniPcEntry(name, "hotspot", val, pass, "http://10.42.0.1/remote.html");
                        connectToHotspot(val, pass);
                    }
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }
}
