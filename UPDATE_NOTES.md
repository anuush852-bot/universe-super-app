# Update: Zomato/Amazon-style start flow

## Naya kya hai
- App kholte hi: **Notification permission → Location permission (GPS) → Sign in / Skip** (Amazon jaisa).
- "Enter your location manually" – area/street/pincode search (OpenStreetMap, free).
- Location set hote hi notification: "📍 Location set – Delivering to ...".
- Navbar mein location chip (tap karke badal sakte hain); checkout aur cab pickup mein location auto-fill.
- Order status badalte hi notification (Confirmed / Out for delivery / Delivered).
- Mobile app feel: bottom tab bar, 2-column products, bottom-sheet popups, safe-area support.

## Android app mein chalane ke steps
```
npm install
npx cap sync android
npx cap open android      # Android Studio se Run / Build
```
Zaroori: `capacitor.config.json` mein `"server": {"url": "https://APNA-RENDER-URL"}` daalein, warna app ke andar `/api` calls server tak nahi pahunchengi.

## Limitations
- Notifications abhi app ke andar se (local) aate hain; app band hone par push ke liye Firebase (FCM) chahiye.
- Browser mein GPS sirf HTTPS (ya localhost) par chalta hai.
- Address search Nominatim use karta hai (light use ke liye free; bade scale par paid geocoder).
