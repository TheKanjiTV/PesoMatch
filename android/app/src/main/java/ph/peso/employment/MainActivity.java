package ph.peso.employment;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.text.InputType;
import java.net.URI;
import java.util.Locale;

/** Same-origin web companion: Laravel keeps its real session and CSRF protection. */
public class MainActivity extends Activity {
    private static final String LIVE_ORIGIN = "https://pesomatch.site";
    private WebView web;
    private LinearLayout root;
    private ProgressBar progress;
    private String origin;
    private SharedPreferences prefs;
    private boolean loadingError = false;
    private boolean debugBuild;
    private String pendingCsv;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingPdf;
    private int dp(int n) { return Math.round(n * getResources().getDisplayMetrics().density); }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        debugBuild = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        prefs = getSharedPreferences("peso-platform", MODE_PRIVATE);
        origin = prefs.getString("origin", "");
        if (origin.isEmpty() || origin.equals("https://pesomatch.bongabonghealthup.online")
                || origin.equals("https://snow-stingray-241500.hostingersite.com")
                || origin.equals("https://navajowhite-curlew-967305.hostingersite.com")) {
            origin = LIVE_ORIGIN;
            prefs.edit().putString("origin", origin).apply();
        }
        startPlatform();
    }
    private void startPlatform() {
        LinearLayout loading = screen();
        loading.setGravity(Gravity.CENTER);
        android.widget.ImageView logo = new android.widget.ImageView(this);
        logo.setImageResource(R.drawable.peso_icon);
        loading.addView(logo, new LinearLayout.LayoutParams(dp(84), dp(84)));
        loading.addView(text("Opening PESO…", 20, true));
        ProgressBar spinner = new ProgressBar(this);
        spinner.setContentDescription("Loading PESO");
        loading.addView(spinner, new LinearLayout.LayoutParams(dp(32), dp(32)));

        if (!LIVE_ORIGIN.equals(origin)) {
            openPlatform();
            return;
        }
        new Thread(() -> {
            int latestVersion = fetchPublishedVersion();
            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed()) return;
                openPlatform();
                if (latestVersion > installedVersion()) showUpdate(latestVersion);
            });
        }, "peso-release-check").start();
    }

    private int installedVersion() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (android.content.pm.PackageManager.NameNotFoundException ex) {
            return Integer.MAX_VALUE;
        }
    }

    private int fetchPublishedVersion() {
        java.net.HttpURLConnection connection = null;
        try {
            connection = (java.net.HttpURLConnection) new java.net.URL(
                    LIVE_ORIGIN + "/app-release.json").openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(2000);
            connection.setReadTimeout(2000);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("Cache-Control", "no-cache");
            if (connection.getResponseCode() != 200) return 0;
            try (java.io.InputStream input = connection.getInputStream()) {
                java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
                byte[] chunk = new byte[1024];
                int count;
                while ((count = input.read(chunk)) != -1) {
                    if (buffer.size() + count > 8192) return 0;
                    buffer.write(chunk, 0, count);
                }
                byte[] bytes = buffer.toByteArray();
                org.json.JSONObject release = new org.json.JSONObject(
                        new String(bytes, java.nio.charset.StandardCharsets.UTF_8));
                return release.optBoolean("available") ? release.optInt("versionCode") : 0;
            }
        } catch (java.io.IOException | org.json.JSONException ex) {
            return 0;
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private void showUpdate(int version) {
        new AlertDialog.Builder(this)
                .setTitle("Please Update")
                .setMessage("A newer version of PESO is available. Download it to update this app.")
                .setPositiveButton("Download update", (dialog, which) -> {
                    Uri download = Uri.parse(LIVE_ORIGIN + "/downloads/peso-android-local.apk?v=" + version);
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, download));
                    } catch (android.content.ActivityNotFoundException ex) {
                        new AlertDialog.Builder(this).setMessage("Open pesomatch.site/app in your browser to download the update.")
                                .setPositiveButton("OK", null).show();
                    }
                })
                .setNegativeButton("Later", null)
                .show();
    }

    private LinearLayout screen() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.rgb(237,244,240));
        layout.setPadding(dp(24),dp(36),dp(24),dp(24));
        setContentView(layout);
        layout.setOnApplyWindowInsetsListener((v,insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(dp(24)+bars.left, dp(24)+bars.top, dp(24)+bars.right, dp(24)+bars.bottom);
            }
            return insets;
        });
        return layout;
    }
    private TextView text(String value, int size, boolean bold) {
        TextView view = new TextView(this); view.setText(value); view.setTextSize(size);
        view.setTextColor(Color.rgb(18,61,53)); view.setLineSpacing(dp(4),1);
        if (bold) view.setTypeface(null,android.graphics.Typeface.BOLD);
        view.setPadding(0,dp(8),0,dp(8)); return view;
    }
    private Button button(String label) {
        Button button = new Button(this); button.setText(label); button.setAllCaps(false);
        button.setTextSize(16); button.setMinHeight(dp(52));
        button.setTextColor(Color.WHITE); button.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(18,61,53)));
        return button;
    }
    private void setup() {
        LinearLayout layout=screen();
        android.widget.ImageView logo=new android.widget.ImageView(this);logo.setImageResource(ph.peso.employment.R.drawable.peso_icon);
        layout.addView(logo,new LinearLayout.LayoutParams(dp(90),dp(90)));
        layout.addView(text("Your next step,\nconnected.",32,true));
        layout.addView(text("PESO Employment Services",19,true));
        layout.addView(text("Enter the platform address provided by your PESO administrator. This app uses the same account, referrals, training and employment records.",16,false));
        layout.addView(text("Platform address",15,true));
        EditText address=new EditText(this); address.setSingleLine(true);
        address.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        address.setHint(LIVE_ORIGIN); address.setText(origin);
        address.setContentDescription("PESO platform address");
        layout.addView(address,new LinearLayout.LayoutParams(-1,dp(56)));
        TextView error=text("",15,true);error.setTextColor(Color.rgb(139,46,36));layout.addView(error);
        Button connect=button("Connect to PESO");layout.addView(connect);
        connect.setOnClickListener(v->{
            try {
                String candidate=validateOrigin(address.getText().toString(),debugBuild);
                if (!origin.equals(candidate)) { CookieManager.getInstance().removeAllCookies(null);CookieManager.getInstance().flush(); }
                origin=candidate;prefs.edit().putString("origin",origin).apply();openPlatform();
            } catch (IllegalArgumentException ex) { error.setText(ex.getMessage());error.announceForAccessibility(ex.getMessage()); }
        });
        layout.addView(text(debugBuild ? "Local development build. HTTPS is required except for a private LAN or Android emulator address. The office platform must be reachable from this phone." : "Use your office’s HTTPS platform address. Internet access is required for all service records.",14,false));
    }
    static String validateOrigin(String input, boolean debug) {
        try {
            URI uri=new URI(input.trim());String scheme=uri.getScheme(),host=uri.getHost();
            if(host==null||uri.getRawUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null||!(uri.getPath()==null||uri.getPath().isEmpty()||uri.getPath().equals("/")))throw new Exception();
            host=host.toLowerCase(Locale.ROOT);
            boolean ipv4=host.matches("(\\d{1,3}\\.){3}\\d{1,3}");
            if (ipv4) for (String octet : host.split("\\.")) if(Integer.parseInt(octet)>255) throw new Exception();
            boolean privateHost=host.equals("localhost")||(ipv4&&(host.startsWith("192.168.")||host.startsWith("10.")||host.matches("172\\.(1[6-9]|2[0-9]|3[01])\\..+")));
            if (!"https".equals(scheme)&&!(debug&&"http".equals(scheme)&&privateHost)) throw new Exception();
            return new URI(scheme,null,host,uri.getPort(),null,null,null).toString();
        } catch(Exception ex) {throw new IllegalArgumentException("Enter a valid HTTPS platform address, without a page path or password.");}
    }
    private boolean sameOrigin(Uri uri) {
        Uri base=Uri.parse(origin);
        int a=base.getPort()!=-1?base.getPort():("https".equals(base.getScheme())?443:80);
        int b=uri.getPort()!=-1?uri.getPort():("https".equals(uri.getScheme())?443:80);
        return base.getScheme().equals(uri.getScheme())&&base.getHost().equalsIgnoreCase(uri.getHost()==null?"":uri.getHost())&&a==b;
    }
    private void openPlatform() {
        if(web!=null){web.destroy();web=null;}
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(18,61,53));
        setContentView(root);
        root.setOnApplyWindowInsetsListener((v,insets)->{
            if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}
            return insets;
        });
        progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setIndeterminate(true);root.addView(progress,new LinearLayout.LayoutParams(-1,dp(3)));
        web=new WebView(this);root.addView(web,new LinearLayout.LayoutParams(-1,0,1));
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setUserAgentString(s.getUserAgentString()+" PESOAndroid/1.2.0");
        CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        WebView.setWebContentsDebuggingEnabled(debugBuild);
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=null;
                if(view.getUrl()==null||!sameOrigin(Uri.parse(view.getUrl())))return false;
                fileCallback=callback;
                Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT);pick.addCategory(Intent.CATEGORY_OPENABLE);pick.setType("application/pdf");
                try{startActivityForResult(pick,41);}catch(android.content.ActivityNotFoundException ex){fileCallback.onReceiveValue(null);fileCallback=null;}
                return true;
            }
        });
        web.setDownloadListener((url,agent,disposition,mime,length)->{
            Uri uri=Uri.parse(url);
            if(!sameOrigin(uri)||!"/api/jobseeker/resume/download".equals(uri.getPath()))return;
            pendingPdf=url;
            Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);save.addCategory(Intent.CATEGORY_OPENABLE);save.setType("application/pdf");save.putExtra(Intent.EXTRA_TITLE,"my-resume.pdf");
            try{startActivityForResult(save,43);}catch(android.content.ActivityNotFoundException ex){pendingPdf=null;}
        });
        // A narrow CSV-only export bridge; no filesystem reads or arbitrary commands.
        web.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface public void saveCsv(String csv,String filename) {
                if(csv==null||csv.length()>2000000||filename==null||!filename.matches("[a-zA-Z0-9_-]+\\.csv"))return;
                runOnUiThread(()->{
                    if(web==null||web.getUrl()==null||!sameOrigin(Uri.parse(web.getUrl())))return;
                    pendingCsv=csv;
                    Intent save=new Intent(Intent.ACTION_CREATE_DOCUMENT);save.addCategory(Intent.CATEGORY_OPENABLE);save.setType("text/csv");save.putExtra(Intent.EXTRA_TITLE,filename);
                    startActivityForResult(save,42);
                });
            }
        },"PesoDownloads");
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();if(sameOrigin(uri))return false;
                if("https".equals(uri.getScheme())||"mailto".equals(uri.getScheme())||"tel".equals(uri.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}}
                return true;
            }
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){loadingError=false;progress.setVisibility(View.VISIBLE);}
            @Override public void onPageFinished(WebView view,String url){progress.setVisibility(View.GONE);CookieManager.getInstance().flush();}
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame()&&!loadingError){loadingError=true;showConnectionError();}}
        });
        web.loadUrl(origin+"/dashboard?source=android");
    }
    private void showConnectionError(){
        progress.setVisibility(View.GONE);
        new AlertDialog.Builder(this).setTitle("Unable to connect to PESO").setMessage("Check your connection and platform address. Personal records require a live connection; no updates are queued offline.").setPositiveButton("Retry",(d,w)->web.loadUrl(origin+"/dashboard?source=android")).setNeutralButton("Platform address",(d,w)->{web.destroy();web=null;setup();}).setNegativeButton("Close",null).show();
    }
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else new AlertDialog.Builder(this).setTitle("Close PESO?").setMessage("Save any changes before leaving.").setPositiveButton("Close",(d,w)->finish()).setNegativeButton("Stay",null).show();}
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==41&&fileCallback!=null){
            Uri selected=result==RESULT_OK&&data!=null?data.getData():null;
            fileCallback.onReceiveValue(selected!=null&&"content".equals(selected.getScheme())?new Uri[]{selected}:null);fileCallback=null;
        }
        if(request==43){
            String download=pendingPdf;pendingPdf=null;
            if(result==RESULT_OK&&data!=null&&data.getData()!=null&&download!=null&&sameOrigin(Uri.parse(download)))saveResume(download,data.getData());
        }
        if(request==42&&result==RESULT_OK&&data!=null&&data.getData()!=null&&pendingCsv!=null){
            try(java.io.OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out!=null)out.write(pendingCsv.getBytes(java.nio.charset.StandardCharsets.UTF_8));}
            catch(java.io.IOException ex){new AlertDialog.Builder(this).setMessage("The CSV could not be saved. Try exporting again.").setPositiveButton("OK",null).show();}
        }
        if(request==42)pendingCsv=null;
    }
    private void saveResume(String address,Uri destination){
        final String cookie=CookieManager.getInstance().getCookie(address);
        new Thread(()->{
            java.net.HttpURLConnection connection=null;
            try{
                connection=(java.net.HttpURLConnection)new java.net.URL(address).openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(15000);connection.setReadTimeout(20000);connection.setRequestProperty("Accept","application/pdf");
                if(cookie!=null)connection.setRequestProperty("Cookie",cookie);
                if(connection.getResponseCode()!=200||!connection.getContentType().toLowerCase(Locale.ROOT).contains("pdf"))throw new java.io.IOException();
                java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();
                try(java.io.InputStream in=connection.getInputStream()){
                    byte[] buffer=new byte[8192];int count;
                    while((count=in.read(buffer))!=-1){if(bytes.size()+count>5*1024*1024)throw new java.io.IOException();bytes.write(buffer,0,count);}
                }
                try(java.io.OutputStream out=getContentResolver().openOutputStream(destination)){if(out==null)throw new java.io.IOException();bytes.writeTo(out);}
            }catch(Exception ex){runOnUiThread(()->{if(!isFinishing()&&!isDestroyed())new AlertDialog.Builder(this).setMessage("Your PDF could not be saved. Check your connection and sign in again if needed.").setPositiveButton("OK",null).show();});}
            finally{if(connection!=null)connection.disconnect();}
        },"peso-resume-download").start();
    }
    @Override protected void onPause(){if(web!=null)web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
    @Override protected void onDestroy(){if(fileCallback!=null){fileCallback.onReceiveValue(null);fileCallback=null;}if(web!=null)web.destroy();super.onDestroy();}
}
