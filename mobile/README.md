# Punjab Hospital — Mobile

React Native app (Expo) covering: Login, Dashboard, Patients (list + register),
Medicines & Batches (stock + expiry), Pharmacy Sales (list + new sale cart),
Reports (P&L + expiry), Doctors, and connection Settings. It talks to the same
`/api` backend as the web app.

## Run it

```bash
cd mobile
npm install
npm start
```

This opens the Expo dev tools. Scan the QR code with the Expo Go app
(iOS/Android) on your phone, or press `a` / `i` in the terminal for an
Android/iOS emulator.

## Connecting to the backend

Your phone cannot reach your computer via localhost — it needs your
computer LAN IP address. Both devices must be on the same Wi-Fi network.

1. Find your computer IP: ipconfig (Windows) or ifconfig / ip a (Mac/Linux).
2. Start the backend (see the main README) so it is listening on that IP,
   not just 127.0.0.1 (the default Express app.listen already binds to all
   interfaces).
3. In the app, on the Login screen tap "API connection settings", enter
   http://YOUR-IP:5001/api, and tap "Save & Test Connection".
4. Also add that same origin to backend/.env as CORS_ORIGIN (comma-separated
   if you need more than one), for example:
   CORS_ORIGIN=http://localhost:5173,http://YOUR-IP:19006

Default demo login: admin@gmail.com / Admin@123
