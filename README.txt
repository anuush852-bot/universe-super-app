UniVerse backend update  (COD cash limit + Pay now  +  auto location, distance, alerts)

Replace in your project (same names/places):
  server.js
  public/common.js  app.js  seller.js  delivery.js  delivery.html  partner.js  partner.html  admin.js  track.js

Note: public/app.js is based on your app-2.js (the newer one with Track button + OTP).
Index/other files are unchanged.

Render Environment (optional):
  COD_CASH_LIMIT=1500
  SELLER_COMMISSION_PERCENT=XX    (default 10, max 30)

Maps: Leaflet + OpenStreetMap (free, no API key). Address text from GPS uses OpenStreetMap Nominatim
(light use only; for big scale switch to a paid geocoder).
