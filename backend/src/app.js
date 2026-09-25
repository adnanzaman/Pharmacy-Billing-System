
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const pool = require('./config/db');
const auth = require('./middleware/auth');
const asyncHandler = require('./utils/asyncHandler');

const authCtrl = require('./controllers/auth.controller');
const dash = require('./controllers/dashboard.controller');
const patients = require('./controllers/patients.controller');
const doctors = require('./controllers/doctors.controller');
const medicines = require('./controllers/medicines.controller');

const batches = require('./controllers/batches.controller');
const lookup = require('./controllers/lookup.controller');
const purchase = require('./controllers/purchase.controller');
const sales = require('./controllers/sales.controller');
const inventory = require('./controllers/inventory.controller');
const reports = require('./controllers/reports.controller');
const accounting = require('./controllers/accounting.controller');
const expenses = require('./controllers/expenses.controller');
const settings = require('./controllers/settings.controller');
const suppliers = require('./controllers/suppliers.controller')
const categories = require('./controllers/categories.controller');
const units = require('./controllers/units.controller');
const cashBank = require('./controllers/cashbank.controller');
const payments = require('./controllers/payments.controller');
const purchaseReturns = require('./controllers/purchase_returns.controller');
const saleReturns = require('./controllers/sale_returns.controller');
const usersRoles = require('./controllers/users_roles.controller');

const app = express();

app.use(helmet());
app.use(compression());

/* -----------------------------
   CORS
----------------------------- */

const allowedOrigins = (
  process.env.CORS_ORIGIN || 'https://portal-h.raas-llc.com'
)
  .split(',')
  .map(s => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    }
  })
);

app.use(express.json({ limit: '2mb' }));

/* -----------------------------
   Login Rate Limiter
----------------------------- */

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again later'
  }
});

/* -----------------------------
   Suppliers
----------------------------- */

app.get(
  '/api/suppliers',
  auth,
  asyncHandler(suppliers.list)
);

app.post(
  '/api/suppliers',
  auth,
  asyncHandler(suppliers.create)
);

app.get(
  '/api/suppliers/:id',
  auth,
  asyncHandler(suppliers.getOne)
);

app.put(
  '/api/suppliers/:id',
  auth,
  asyncHandler(suppliers.update)
);

app.delete(
  '/api/suppliers/:id',
  auth,
  asyncHandler(suppliers.remove)
);

/* -----------------------------
   Health
----------------------------- */

app.get(
  '/api/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');

    res.json({
      ok: true,
      message: 'Punjab Hospital API is running'
    });
  })
);

/* -----------------------------
   Authentication
----------------------------- */

app.post(
  '/api/auth/login',
  loginLimiter,
  asyncHandler(authCtrl.login)
);

app.get(
  '/api/auth/me',
  auth,
  asyncHandler(authCtrl.me)
);

/* -----------------------------
   Dashboard
----------------------------- */

app.get(
  '/api/dashboard/summary',
  auth,
  asyncHandler(dash.summary)
);

app.get(
  '/api/dashboard/trend',
  auth,
  asyncHandler(dash.trend)
);

/* -----------------------------
   Patients
----------------------------- */

app.get(
  '/api/patients',
  auth,
  asyncHandler(patients.list)
);

app.post(
  '/api/patients',
  auth,
  asyncHandler(patients.create)
);

app.get(
  '/api/patients/:id',
  auth,
  asyncHandler(patients.getOne)
);

app.put(
  '/api/patients/:id',
  auth,
  asyncHandler(patients.update)
);

app.delete(
  '/api/patients/:id',
  auth,
  asyncHandler(patients.remove)
);

app.get(
  '/api/patients/:id/visits',
  auth,
  asyncHandler(patients.visits)
);

/* -----------------------------
   Doctors
----------------------------- */

app.get('/api/doctors', auth, asyncHandler(doctors.list));
app.post('/api/doctors', auth, asyncHandler(doctors.create));
app.get('/api/doctors/:id', auth, asyncHandler(doctors.getOne));
app.put('/api/doctors/:id', auth, asyncHandler(doctors.update));
app.delete('/api/doctors/:id', auth, asyncHandler(doctors.remove));

/* -----------------------------
   Medicines
----------------------------- */
/* -----------------------------
   Medicines
----------------------------- */

app.get(
  '/api/medicines',
  auth,
  asyncHandler(medicines.list)
);

app.get(
  '/api/medicines/next-code',
  auth,
  asyncHandler(medicines.nextCode)
);

app.post(
  '/api/medicines',
  auth,
  asyncHandler(medicines.create)
);

app.get(
  '/api/medicines/:id',
  auth,
  asyncHandler(medicines.getOne)
);

app.put(
  '/api/medicines/:id',
  auth,
  asyncHandler(medicines.update)
);

app.delete(
  '/api/medicines/:id',
  auth,
  asyncHandler(medicines.remove)
);

/* -----------------------------
   Medicine Batches
----------------------------- */

app.get(
  '/api/medicine-batches',
  auth,
  asyncHandler(batches.list)
);

app.post(
  '/api/medicine-batches',
  auth,
  asyncHandler(batches.create)
);

app.get(
  '/api/medicine-batches/:id',
  auth,
  asyncHandler(batches.getOne)
);

app.put(
  '/api/medicine-batches/:id',
  auth,
  asyncHandler(batches.update)
);

app.delete(
  '/api/medicine-batches/:id',
  auth,
  asyncHandler(batches.remove)
);


/* -----------------------------
   Lookups
----------------------------- */

app.get(
  '/api/lookups/units',
  auth,
  asyncHandler(lookup.units)
);

app.get(
  '/api/lookups/departments',
  auth,
  asyncHandler(lookup.departments)
);

app.get(
  '/api/lookups/doctors',
  auth,
  asyncHandler(lookup.doctors)
);

app.get(
  '/api/lookups/categories',
  auth,
  asyncHandler(lookup.categories)
);

app.get(
  '/api/lookups/tax-profiles',
  auth,
  asyncHandler(lookup.taxProfiles)
);

app.get(
  '/api/lookups/warehouses',
  auth,
  asyncHandler(lookup.warehouses)
);

/* -----------------------------
   Categories (Add/Edit/Delete)
----------------------------- */

app.get(
  '/api/categories',
  auth,
  asyncHandler(categories.list)
);

app.post(
  '/api/categories',
  auth,
  asyncHandler(categories.create)
);

app.put(
  '/api/categories/:id',
  auth,
  asyncHandler(categories.update)
);

app.delete(
  '/api/categories/:id',
  auth,
  asyncHandler(categories.remove)
);

/* -----------------------------
   Units (Add/Edit/Delete)
----------------------------- */

app.get(
  '/api/units',
  auth,
  asyncHandler(units.list)
);

app.post(
  '/api/units',
  auth,
  asyncHandler(units.create)
);

app.put(
  '/api/units/:id',
  auth,
  asyncHandler(units.update)
);

app.delete(
  '/api/units/:id',
  auth,
  asyncHandler(units.remove)
);

/* -----------------------------
   Purchases
----------------------------- */

app.get(
  '/api/purchases',
  auth,
  asyncHandler(purchase.list)
);

app.post('/api/purchases', auth, asyncHandler(purchase.create));
// Compatibility endpoint: some deployed/proxy environments reject PUT and return the generic 404 'Not found'.
// Purchase edit uses POST /api/purchases/:id so editing works even when PUT is not allowed upstream.
app.post('/api/purchases/:id', auth, asyncHandler(purchase.update));
app.put('/api/purchases/:id', auth, asyncHandler(purchase.update));
app.get('/api/purchases/:id', auth, asyncHandler(purchase.getOne));

/* -----------------------------
   Sales
----------------------------- */

app.get(
  '/api/sales',
  auth,
  asyncHandler(sales.list)
);

app.post('/api/sales', auth, asyncHandler(sales.create));
// Compatibility endpoint for Sale Edit; POST avoids proxies that reject PUT.
app.post('/api/sales/:id', auth, asyncHandler(sales.update));
app.put('/api/sales/:id', auth, asyncHandler(sales.update));
app.get('/api/sales/batches', auth, asyncHandler(sales.batches));
app.get('/api/sales/:id', auth, asyncHandler(sales.getOne));

/* -----------------------------
   Inventory
----------------------------- */

app.get(
  '/api/inventory/stock',
  auth,
  asyncHandler(inventory.stock)
);

app.post(
  '/api/inventory/adjust',
  auth,
  asyncHandler(inventory.adjust)
);

/* -----------------------------
   Reports
----------------------------- */

app.get(
  '/api/reports/profit-loss',
  auth,
  asyncHandler(reports.profitLoss)
);

app.get('/api/reports/expiry', auth, asyncHandler(reports.expiry));
app.get('/api/reports/sale', auth, asyncHandler(reports.sale));
app.get('/api/reports/bill-wise-profit', auth, asyncHandler(reports.billWiseProfit));
app.get('/api/reports/cash-flow', auth, asyncHandler(reports.cashFlow));
app.get('/api/reports/purchase', auth, asyncHandler(reports.purchase));
app.get('/api/reports/daybook', auth, asyncHandler(reports.daybook));
app.get('/api/reports/all', auth, asyncHandler(reports.allTransactions));
app.get('/api/reports/inventory', auth, asyncHandler(reports.inventory));
app.get('/api/reports/audit', auth, asyncHandler(reports.audit));
app.get('/api/reports/party-statement', auth, asyncHandler(reports.partyStatement));
app.get('/api/reports/party-wise-profit-loss', auth, asyncHandler(reports.partyWiseProfitLoss));
app.get('/api/reports/all-parties', auth, asyncHandler(reports.allParties));
app.get('/api/reports/party-report-by-item', auth, asyncHandler(reports.partyReportByItem));
app.get('/api/reports/sale-purchase-by-party', auth, asyncHandler(reports.salePurchaseByParty));

/* -----------------------------
   Accounting
----------------------------- */

app.get(
  '/api/accounting/trial-balance',
  auth,
  asyncHandler(accounting.trialBalance)
);

app.get(
  '/api/accounting/gl',
  auth,
  asyncHandler(accounting.gl)
);

app.get(
  '/api/accounting/balance-sheet',
  auth,
  asyncHandler(accounting.balanceSheet)
);

/* -----------------------------
   Cash & Bank
----------------------------- */

app.get('/api/cash-bank/accounts', auth, asyncHandler(cashBank.list));
app.post('/api/cash-bank/accounts', auth, asyncHandler(cashBank.create));
app.put('/api/cash-bank/accounts/:id', auth, asyncHandler(cashBank.update));
app.delete('/api/cash-bank/accounts/:id', auth, asyncHandler(cashBank.remove));
app.get('/api/cash-bank/ledger', auth, asyncHandler(cashBank.ledger));
app.post('/api/cash-bank/transfer', auth, asyncHandler(cashBank.transfer));
app.post('/api/cash-bank/opening-cash', auth, asyncHandler(cashBank.openingCash));

/* -----------------------------
   Payments (collect from patients / pay suppliers)
----------------------------- */

app.get('/api/payments/pending', auth, asyncHandler(payments.pending));
app.get('/api/payments/party-invoices', auth, asyncHandler(payments.partyInvoices));
app.post('/api/payments', auth, asyncHandler(payments.create));
app.get('/api/payments', auth, asyncHandler(payments.list));

/* -----------------------------
   Purchase Returns (Debit Notes)
----------------------------- */

app.get('/api/purchase-returns', auth, asyncHandler(purchaseReturns.list));
app.post('/api/purchase-returns', auth, asyncHandler(purchaseReturns.create));
app.get('/api/purchase-returns/:id', auth, asyncHandler(purchaseReturns.getOne));
app.put('/api/purchase-returns/:id', auth, asyncHandler(purchaseReturns.update));

/* -----------------------------
   Sale Returns (Credit Notes)
----------------------------- */

app.get('/api/sale-returns', auth, asyncHandler(saleReturns.list));
app.post('/api/sale-returns', auth, asyncHandler(saleReturns.create));
app.get('/api/sale-returns/:id', auth, asyncHandler(saleReturns.getOne));
app.put('/api/sale-returns/:id', auth, asyncHandler(saleReturns.update));

/* -----------------------------
   Users, Roles & Permissions (Administrator)
----------------------------- */
app.get('/api/admin/users', auth, asyncHandler(usersRoles.listUsers));
app.post('/api/admin/users', auth, asyncHandler(usersRoles.createUser));
app.put('/api/admin/users/:id', auth, asyncHandler(usersRoles.updateUser));
app.get('/api/admin/roles', auth, asyncHandler(usersRoles.listRoles));
app.get('/api/admin/permissions', auth, asyncHandler(usersRoles.listPermissions));
app.post('/api/admin/roles', auth, asyncHandler(usersRoles.createRole));
app.put('/api/admin/roles/:id', auth, asyncHandler(usersRoles.updateRole));


/* -----------------------------
   Expenses
----------------------------- */

app.get(
  '/api/expenses',
  auth,
  asyncHandler(expenses.list)
);

app.post(
  '/api/expenses',
  auth,
  asyncHandler(expenses.create)
);
app.get('/api/expenses/:id', auth, asyncHandler(expenses.getOne));
app.put('/api/expenses/:id', auth, asyncHandler(expenses.update));

/* -----------------------------
   Settings
----------------------------- */

app.get(
  '/api/settings',
  auth,
  asyncHandler(settings.list)
);

app.post(
  '/api/settings',
  auth,
  asyncHandler(settings.save)
);

/* -----------------------------
   404
----------------------------- */

app.use((req, res) => {
  res.status(404).json({
    message: 'Not found'
  });
});

/* -----------------------------
   Error Handler
----------------------------- */

app.use((err, req, res, next) => {
  //console.error(err);

  const messageText = err.message || 'Server error';

  const status =
    err.status ||
    (/insufficient stock|invalid batch|required|not found/i.test(
      messageText
    )
      ? 400
      : 500);

  res.status(status).json({
    message: messageText
  });
});

/* -----------------------------
   Start Server
----------------------------- */

const PORT = Number(process.env.PORT || 5001);
const { ensureCoreAccounts } = require('./services_accounting');

(async()=>{
  try {
    const [hospitals] = await require('./config/db').query('SELECT id FROM hospitals');
    for (const h of hospitals) await ensureCoreAccounts(require('./config/db'), h.id);
  } catch (e) {
    console.error('Accounting account initialization failed:', e.message);
  }

app.listen(PORT, () => {
 // console.log(
   // `Punjab Hospital API: http://localhost:${PORT}`
  //);
});
})();

