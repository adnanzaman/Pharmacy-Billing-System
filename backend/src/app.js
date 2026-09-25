
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const pool = require('./config/db');
const auth = require('./middleware/auth');
const asyncHandler = require('./utils/asyncHandler');
// requirePermission(code) / requireAnyPermission(...codes): server-side RBAC.
// This was previously defined but never attached to any route, which is why
// creating a custom Role and ticking permissions for it had no real effect —
// every logged-in user could reach every endpoint regardless of their role.
const requirePermission = require('./middleware/permission');
const { requireAnyPermission } = requirePermission;

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
  auth, requirePermission('suppliers.view'),
  asyncHandler(suppliers.list)
);

app.post(
  '/api/suppliers',
  auth, requirePermission('suppliers.create'),
  asyncHandler(suppliers.create)
);

app.get(
  '/api/suppliers/:id',
  auth, requirePermission('suppliers.view'),
  asyncHandler(suppliers.getOne)
);

app.put(
  '/api/suppliers/:id',
  auth, requirePermission('suppliers.update'),
  asyncHandler(suppliers.update)
);

app.delete(
  '/api/suppliers/:id',
  auth, requirePermission('suppliers.delete'),
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
  auth, requirePermission('dashboard.view'),
  asyncHandler(dash.summary)
);

app.get(
  '/api/dashboard/trend',
  auth, requirePermission('dashboard.view'),
  asyncHandler(dash.trend)
);

/* -----------------------------
   Patients
----------------------------- */

app.get(
  '/api/patients',
  auth, requirePermission('patients.view'),
  asyncHandler(patients.list)
);

app.post(
  '/api/patients',
  auth, requirePermission('patients.create'),
  asyncHandler(patients.create)
);

app.get(
  '/api/patients/:id',
  auth, requirePermission('patients.view'),
  asyncHandler(patients.getOne)
);

app.put(
  '/api/patients/:id',
  auth, requirePermission('patients.update'),
  asyncHandler(patients.update)
);

app.delete(
  '/api/patients/:id',
  auth, requirePermission('patients.delete'),
  asyncHandler(patients.remove)
);

app.get(
  '/api/patients/:id/visits',
  auth, requirePermission('patients.view'),
  asyncHandler(patients.visits)
);

/* -----------------------------
   Doctors
----------------------------- */

app.get('/api/doctors', auth, requirePermission('doctors.view'), asyncHandler(doctors.list));
app.post('/api/doctors', auth, requirePermission('doctors.create'), asyncHandler(doctors.create));
app.get('/api/doctors/:id', auth, requirePermission('doctors.view'), asyncHandler(doctors.getOne));
app.put('/api/doctors/:id', auth, requirePermission('doctors.update'), asyncHandler(doctors.update));
app.delete('/api/doctors/:id', auth, requirePermission('doctors.delete'), asyncHandler(doctors.remove));

/* -----------------------------
   Medicines
----------------------------- */
/* -----------------------------
   Medicines
----------------------------- */

app.get(
  '/api/medicines',
  auth, requirePermission('items.view'),
  asyncHandler(medicines.list)
);

app.get(
  '/api/medicines/next-code',
  auth, requirePermission('items.view'),
  asyncHandler(medicines.nextCode)
);

app.post(
  '/api/medicines',
  auth, requirePermission('items.create'),
  asyncHandler(medicines.create)
);

app.get(
  '/api/medicines/:id',
  auth, requirePermission('items.view'),
  asyncHandler(medicines.getOne)
);

app.put(
  '/api/medicines/:id',
  auth, requirePermission('items.update'),
  asyncHandler(medicines.update)
);

app.delete(
  '/api/medicines/:id',
  auth, requirePermission('items.delete'),
  asyncHandler(medicines.remove)
);

/* -----------------------------
   Medicine Batches
----------------------------- */

app.get(
  '/api/medicine-batches',
  auth, requirePermission('items.view'),
  asyncHandler(batches.list)
);

app.post(
  '/api/medicine-batches',
  auth, requirePermission('items.update'),
  asyncHandler(batches.create)
);

app.get(
  '/api/medicine-batches/:id',
  auth, requirePermission('items.view'),
  asyncHandler(batches.getOne)
);

app.put(
  '/api/medicine-batches/:id',
  auth, requirePermission('items.update'),
  asyncHandler(batches.update)
);

app.delete(
  '/api/medicine-batches/:id',
  auth, requirePermission('items.delete'),
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
  auth, requirePermission('categories.view'),
  asyncHandler(categories.list)
);

app.post(
  '/api/categories',
  auth, requirePermission('categories.create'),
  asyncHandler(categories.create)
);

app.put(
  '/api/categories/:id',
  auth, requirePermission('categories.update'),
  asyncHandler(categories.update)
);

app.delete(
  '/api/categories/:id',
  auth, requirePermission('categories.delete'),
  asyncHandler(categories.remove)
);

/* -----------------------------
   Units (Add/Edit/Delete)
----------------------------- */

app.get(
  '/api/units',
  auth, requirePermission('units.view'),
  asyncHandler(units.list)
);

app.post(
  '/api/units',
  auth, requirePermission('units.create'),
  asyncHandler(units.create)
);

app.put(
  '/api/units/:id',
  auth, requirePermission('units.update'),
  asyncHandler(units.update)
);

app.delete(
  '/api/units/:id',
  auth, requirePermission('units.delete'),
  asyncHandler(units.remove)
);

/* -----------------------------
   Purchases
----------------------------- */

app.get(
  '/api/purchases',
  auth, requirePermission('purchase.view'),
  asyncHandler(purchase.list)
);

app.post('/api/purchases', auth, requirePermission('purchase.create'), asyncHandler(purchase.create));
// Compatibility endpoint: some deployed/proxy environments reject PUT and return the generic 404 'Not found'.
// Purchase edit uses POST /api/purchases/:id so editing works even when PUT is not allowed upstream.
app.post('/api/purchases/:id', auth, requirePermission('purchase.update'), asyncHandler(purchase.update));
app.put('/api/purchases/:id', auth, requirePermission('purchase.update'), asyncHandler(purchase.update));
app.get('/api/purchases/:id', auth, requirePermission('purchase.view'), asyncHandler(purchase.getOne));

/* -----------------------------
   Sales
----------------------------- */

app.get(
  '/api/sales',
  auth, requirePermission('sale.view'),
  asyncHandler(sales.list)
);

app.post('/api/sales', auth, requirePermission('sale.create'), asyncHandler(sales.create));
// Compatibility endpoint for Sale Edit; POST avoids proxies that reject PUT.
app.post('/api/sales/:id', auth, requirePermission('sale.update'), asyncHandler(sales.update));
app.put('/api/sales/:id', auth, requirePermission('sale.update'), asyncHandler(sales.update));
app.get('/api/sales/batches', auth, requirePermission('sale.view'), asyncHandler(sales.batches));
app.get('/api/sales/:id', auth, requirePermission('sale.view'), asyncHandler(sales.getOne));

/* -----------------------------
   Inventory
----------------------------- */

app.get(
  '/api/inventory/stock',
  auth, requirePermission('stock.view'),
  asyncHandler(inventory.stock)
);

app.post(
  '/api/inventory/adjust',
  auth, requirePermission('stock.adjust'),
  asyncHandler(inventory.adjust)
);

/* -----------------------------
   Reports
----------------------------- */

app.get(
  '/api/reports/profit-loss',
  auth, requirePermission('reports.profit_loss'),
  asyncHandler(reports.profitLoss)
);

app.get('/api/reports/expiry', auth, requirePermission('reports.view'), asyncHandler(reports.expiry));
app.get('/api/reports/sale', auth, requirePermission('reports.sale'), asyncHandler(reports.sale));
app.get('/api/reports/bill-wise-profit', auth, requirePermission('reports.view'), asyncHandler(reports.billWiseProfit));
app.get('/api/reports/cash-flow', auth, requirePermission('reports.cash_flow'), asyncHandler(reports.cashFlow));
app.get('/api/reports/purchase', auth, requirePermission('reports.purchase'), asyncHandler(reports.purchase));
app.get('/api/reports/daybook', auth, requirePermission('reports.daybook'), asyncHandler(reports.daybook));
app.get('/api/reports/all', auth, requirePermission('reports.view'), asyncHandler(reports.allTransactions));
app.get('/api/reports/inventory', auth, requirePermission('reports.inventory'), asyncHandler(reports.inventory));
app.get('/api/reports/audit', auth, requirePermission('reports.audit'), asyncHandler(reports.audit));
app.get('/api/reports/party-statement', auth, requirePermission('reports.party_statement'), asyncHandler(reports.partyStatement));
app.get('/api/reports/party-wise-profit-loss', auth, requirePermission('reports.party_profit_loss'), asyncHandler(reports.partyWiseProfitLoss));
app.get('/api/reports/all-parties', auth, requirePermission('reports.all_parties'), asyncHandler(reports.allParties));
app.get('/api/reports/party-report-by-item', auth, requirePermission('reports.party_report_by_item'), asyncHandler(reports.partyReportByItem));
app.get('/api/reports/sale-purchase-by-party', auth, requirePermission('reports.sale_purchase_by_party'), asyncHandler(reports.salePurchaseByParty));

/* -----------------------------
   Accounting
----------------------------- */

app.get(
  '/api/accounting/trial-balance',
  auth, requirePermission('accounting.trial_balance'),
  asyncHandler(accounting.trialBalance)
);

app.get(
  '/api/accounting/gl',
  auth, requirePermission('accounting.gl'),
  asyncHandler(accounting.gl)
);

app.get(
  '/api/accounting/balance-sheet',
  auth, requirePermission('accounting.balance_sheet'),
  asyncHandler(accounting.balanceSheet)
);

/* -----------------------------
   Cash & Bank
----------------------------- */

app.get('/api/cash-bank/accounts', auth, requirePermission('cash_bank.view'), asyncHandler(cashBank.list));
app.post('/api/cash-bank/accounts', auth, requirePermission('cash_bank.create'), asyncHandler(cashBank.create));
app.put('/api/cash-bank/accounts/:id', auth, requirePermission('cash_bank.update'), asyncHandler(cashBank.update));
app.delete('/api/cash-bank/accounts/:id', auth, requirePermission('cash_bank.delete'), asyncHandler(cashBank.remove));
app.get('/api/cash-bank/ledger', auth, requirePermission('cash_bank.view'), asyncHandler(cashBank.ledger));
app.post('/api/cash-bank/transfer', auth, requirePermission('cash_bank.transfer'), asyncHandler(cashBank.transfer));
app.post('/api/cash-bank/opening-cash', auth, requirePermission('cash_bank.update'), asyncHandler(cashBank.openingCash));

/* -----------------------------
   Payments (collect from patients / pay suppliers)
----------------------------- */

app.get('/api/payments/pending', auth, requireAnyPermission('payment_in.view', 'payment_out.view'), asyncHandler(payments.pending));
app.get('/api/payments/party-invoices', auth, requireAnyPermission('payment_in.view', 'payment_out.view'), asyncHandler(payments.partyInvoices));
app.post('/api/payments', auth, requireAnyPermission('payment_in.create', 'payment_out.create'), asyncHandler(payments.create));
app.get('/api/payments', auth, requireAnyPermission('payment_in.view', 'payment_out.view'), asyncHandler(payments.list));

/* -----------------------------
   Purchase Returns (Debit Notes)
----------------------------- */

app.get('/api/purchase-returns', auth, requirePermission('purchase.return'), asyncHandler(purchaseReturns.list));
app.post('/api/purchase-returns', auth, requirePermission('purchase.return'), asyncHandler(purchaseReturns.create));
app.get('/api/purchase-returns/:id', auth, requirePermission('purchase.return'), asyncHandler(purchaseReturns.getOne));
app.put('/api/purchase-returns/:id', auth, requirePermission('purchase.return'), asyncHandler(purchaseReturns.update));

/* -----------------------------
   Sale Returns (Credit Notes)
----------------------------- */

app.get('/api/sale-returns', auth, requirePermission('sale.return'), asyncHandler(saleReturns.list));
app.post('/api/sale-returns', auth, requirePermission('sale.return'), asyncHandler(saleReturns.create));
app.get('/api/sale-returns/:id', auth, requirePermission('sale.return'), asyncHandler(saleReturns.getOne));
app.put('/api/sale-returns/:id', auth, requirePermission('sale.return'), asyncHandler(saleReturns.update));

/* -----------------------------
   Users, Roles & Permissions (Administrator)
   These stay restricted to the Admin / System Administrator role itself
   (see requireAdmin() inside users_roles.controller.js) rather than being
   opened up by the generic permission codes below, since managing other
   users' accounts and roles is intentionally admin-only regardless of what
   a custom role is granted.
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
  auth, requirePermission('expenses.view'),
  asyncHandler(expenses.list)
);

app.post(
  '/api/expenses',
  auth, requirePermission('expenses.create'),
  asyncHandler(expenses.create)
);
app.get('/api/expenses/:id', auth, requirePermission('expenses.view'), asyncHandler(expenses.getOne));
app.put('/api/expenses/:id', auth, requirePermission('expenses.update'), asyncHandler(expenses.update));

/* -----------------------------
   Settings
----------------------------- */

app.get(
  '/api/settings',
  auth, requirePermission('settings.view'),
  asyncHandler(settings.list)
);

app.post(
  '/api/settings',
  auth, requirePermission('settings.update'),
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

