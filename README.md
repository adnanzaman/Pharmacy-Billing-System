# Punjab Hospital ERP — Xmart Updated

Hospital + Pharmacy + Inventory + Accounting ERP for Web, Desktop and Mobile.

## Updated in this version
- Doctor complete CRUD: Add, View, Edit/Update, Delete/Deactivate.
- Pharmacy Sales: View complete invoice, professional 80mm thermal print, Punjab Hospital header, date/time and Xmart Solution LLC footer.
- Purchases: View complete purchase, professional thermal print.
- Medicine audit history: CREATE/UPDATE/DELETE actions are stored with user, time and before/after details.
- Inventory reports with From/To date and report type selection.
- Stock summary, stock ledger, sales, purchases, low stock, expiry, daily movement and medicine change history reports.
- Trial Balance with date range and debit/credit balancing control.
- Structured Balance Sheet by Assets, Liabilities and Equity.
- Expired-batch sales are blocked.
- Sales/purchase amounts are validated.

## Stack
- Backend: Node.js + Express + MySQL/MariaDB
- Web/Desktop UI: React + Vite + Ant Design
- Desktop: Electron
- Mobile: React Native + Expo
- Authentication: JWT

## Database
Fresh database:
```bash
mysql -u root -p xmart_hospital < backend/database/schema.sql
mysql -u root -p xmart_hospital < backend/database/seed.sql
```
Existing database: run:
```bash
mysql -u root -p xmart_hospital < backend/database/migrations/001_inventory_audit_upgrade.sql
```

## Backend
```bash
cd backend
npm install
npm run dev
```
Default API: `http://localhost:5001/api`
Default login: `admin@gmail.com` / `Admin@123`

## Web
```bash
cd web
npm install
npm run dev
```

## Desktop
Build web first:
```bash
cd web
npm install
npm run build
```
Then:
```bash
cd ../desktop
npm install
npm run dev
```
Production installer:
```bash
npm run dist
```

## Mobile
```bash
cd mobile
npm install
npm start
```
On a physical phone, use the computer LAN IP in the mobile API connection setting. Do not use `localhost` from the phone.

## Printing
Sales and purchase detail screens include Print. The invoice template is designed for 80mm thermal printers using `@page { size: 80mm auto }`. Select the installed thermal printer and disable browser headers/footers.

## Offline / Online architecture
The current release is API/MySQL-first: Web, Electron and Mobile use the same central API. This is safe for online deployment.

For true offline hospital operation, do not connect mobile/desktop directly to MySQL. Use a local SQLite database on the client and a sync queue:
```text
Client SQLite -> pending sync queue -> API -> central MySQL
                         ^
                         |
                 retry / conflict check
```
Each sale, purchase and stock adjustment should have a globally unique client transaction UUID. The server must enforce idempotency so reconnecting does not duplicate transactions. Stock-changing transactions should remain database transactions on the server.

Recommended production mode:
- Hospital LAN desktop: local SQLite for uninterrupted pharmacy operation.
- Central online server: MySQL as source of truth.
- Mobile: SQLite/secure local queue when offline.
- Web: browser IndexedDB for offline cache/queue.
- Sync after reconnection.

This release provides the transaction-oriented backend and reporting foundation for that direction; a full offline sync engine should be implemented as a dedicated production phase rather than treating localStorage as a hospital-grade database.

## Main test checklist
1. Login.
2. Add/View/Edit/Delete doctor.
3. Add medicine and edit it; verify Medicine Change History.
4. Add purchase with batch and expiry; verify stock increases.
5. View purchase and print it.
6. Make pharmacy sale; verify stock decreases.
7. View sale and print it on 80mm thermal printer.
8. Try selling an expired batch; it must be rejected.
9. Generate inventory reports using From/To dates.
10. Check Trial Balance and Balance Sheet.
11. Run web, then build Electron desktop.
12. Run Expo mobile and configure the LAN API URL.
