# Fix: "This page didn't load Google Maps correctly"

The customer app shows Google Maps **inside a WebView** (not the native SDK). For that to work, the API key must be allowed to be used from **web-style** requests. If your key is restricted to **Android apps** or **iOS apps** only, the WebView request is blocked and you see the error above.

---

## Fix in Google Cloud Console

1. Open **[Google Cloud Console](https://console.cloud.google.com/)** → **APIs & Services** → **Credentials**.
2. Click your **API key** (the one you use in `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`).
3. Under **Application restrictions**:
   - Select **"None"** (so the key can be used from the WebView).
   - Do **not** use "Android apps" or "iOS apps" for this key if you use it in the WebView map.
4. Under **API restrictions**:
   - Choose **"Restrict key"**.
   - Enable at least: **Maps JavaScript API** (for the map), **Geocoding API** (for address search/reverse geocode), and **Places API** if you use autocomplete.
5. Click **Save**.

---

## Why this works

- The map is loaded in a **WebView** with `source={{ html: ... }}`. The request to `maps.googleapis.com` is a normal HTTP request from that WebView.
- It does **not** send your Android package name or iOS bundle ID, so Google treats it like a "web" request.
- If the key is restricted to "Android apps" or "iOS apps", Google rejects these WebView requests → "This page didn't load Google Maps correctly."
- With **Application restrictions = None**, the key is accepted. You still limit risk by **API restrictions** (only the APIs you need).

---

## Checklist

- [ ] **Application restrictions** = **None**
- [ ] **API restrictions** = **Restrict key** with **Maps JavaScript API** (and Geocoding API, Places API if needed)
- [ ] **Maps JavaScript API** is **enabled** for the project (APIs & Services → Library → search "Maps JavaScript API" → Enable)
- [ ] **Billing** is enabled on the project (required for Maps Platform; free tier still applies)

After saving, wait a minute and reload the app; the map should load.
