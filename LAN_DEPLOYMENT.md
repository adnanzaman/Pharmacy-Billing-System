# Xmart Hospital ERP — LAN / Web / Desktop / Mobile deployment

## Architecture

- **Main PC / Server:** MariaDB + Node.js API on port `5001`.
- **Desktop clients:** Electron application loads the same React web UI and connects to the main PC API.
- **Browser clients:** open the web build and point it to the same API.
- **Mobile APK:** React Native/Expo app connects to the same API URL.
- **Single source of truth:** all clients use the same MariaDB database through the API. Do not connect desktop/mobile directly to MySQL.

## LAN setup

1. On the main PC install MariaDB and import the supplied database.
2. Run `database/migrations/001_pharmacy_workflow.sql` once against `xmart_hospital`.
3. In `backend/.env` set:
   - `HOST=0.0.0.0`
   - `PORT=5001`
   - `DB_HOST=127.0.0.1`
   - database credentials
   - `CORS_ORIGIN=*` for a simple trusted LAN, or list the exact web origins.
4. Start the API with `npm start` inside `backend`.
5. Find the main PC IPv4 address, e.g. `192.168.1.10`.
6. In web/desktop login enter `http://192.168.1.10:5001/api` as **Server / API URL**.
7. In the mobile app open **API Connection Settings** before login and enter the same URL.
8. Allow TCP port `5001` through the Windows Firewall on the main PC.

### Multiple desktop systems

Install the desktop build on each PC. Each client uses the same API URL, for example:

`http://192.168.1.10:5001/api`

Only the main PC needs the database and API service.

## Web hosting / Hostinger CyberPanel

Deploy the Node API on the server and keep MariaDB private. Put the web build behind the web server and use an HTTPS API URL such as `https://api.example.com/api`.

Set `CORS_ORIGIN` to the exact web/mobile origins required in production instead of `*`.

For Hostinger/CyberPanel, configure the Node application as a service/reverse proxy and expose HTTPS to the API. Do not expose MariaDB port 3306 publicly.

## Printing

The invoice printer is generated as a fixed 80mm thermal layout. The item columns are fixed as Medicine / Qty / Rate / Amount so they do not overlap on thermal paper.

## Pharmacy workflow

- Sales and purchases can be searched by invoice number, party mobile/name, and medicine name.
- Posted sales and purchases can be opened and edited.
- Customer returns support partial quantities, restore stock, create an audit record, and post the accounting reversal.
- A sale with a posted return is protected from normal edit so the return history cannot be silently overwritten.

## Important database rule

Always make corrections through the API. Never manually change stock quantities in the database. Stock is derived from `stock_transactions`, so sale edits, purchases, and returns must go through the application.
