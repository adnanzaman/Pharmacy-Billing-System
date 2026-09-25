import React, { useState } from 'react';
import SaleReport from './SaleReport.jsx';
import PurchaseReport from './PurchaseReport.jsx';
import DayBookReport from './DayBookReport.jsx';
import AllTransactionsReport from './AllTransactionsReport.jsx';
import ItemStockReport from './ItemStockReports.jsx';
import ProfitLossReport from './ProfitLossReport.jsx';
import BillWiseProfitReport from './BillWiseProfitReport.jsx';
import CashFlowReport from './CashFlowReport.jsx';
import TrialBalanceReport from './TrialBalanceReport.jsx';
import BalanceSheetReport from './BalanceSheetReport.jsx';
import { PartyStatementReport, PartyWiseProfitLossReport, AllPartiesReport, PartyReportByItem, SalePurchaseByParty } from './PartyReports.jsx';

/* =========================================================
   REPORTS  -  left list of reports + the selected report on the right.

   HOW TO ADD THE NEXT REPORT
     1. create reports/<Name>Report.jsx (copy SaleReport.jsx as the pattern; API call in backend/src/controllers/reports.controller.js)
     2. add one line to a group below:   { key: 'daybook', title: 'Day book', render: () => <DaybookReport /> }
     Groups: 'grey' header = Transaction report, 'mint' header = Item/Stock report (heading hidden, see hideTitle).
========================================================= */

export default function Reports({ renderAddSale, printSale, renderAddPurchase, printPurchase }) {
  const GROUPS = [
    {
      title: 'Transaction report', tone: 'grey',
      reports: [
        
        { key: 'sale', title: 'Sale', render: () => <SaleReport renderAddSale={renderAddSale} printSale={printSale} /> },
        { key: 'purchase', title: 'Purchase', render: () => <PurchaseReport renderAddPurchase={renderAddPurchase} printPurchase={printPurchase} /> },
        { key: 'daybook', title: 'Day book', render: () => <DayBookReport printSale={printSale} printPurchase={printPurchase} /> },
        { key: 'all', title: 'All Transactions', render: () => <AllTransactionsReport printSale={printSale} printPurchase={printPurchase} /> },
      { key: 'profit_loss', title: 'Profit And Loss', render: () => <ProfitLossReport /> },
        { key: 'bill_wise_profit', title: 'Bill Wise Profit', render: () => <BillWiseProfitReport /> },
        { key: 'cash_flow', title: 'Cash flow', render: () => <CashFlowReport /> },
        { key: 'trial_balance', title: 'Trial Balance Report', render: () => <TrialBalanceReport /> },
        { key: 'balance_sheet', title: 'Balance Sheet', render: () => <BalanceSheetReport /> }
      ]
    },
    {
      title: 'Party report', tone: 'mint',
      reports: [
        { key: 'party_statement', title: 'Party Statement', render: () => <PartyStatementReport /> },
        { key: 'party_wise_profit_loss', title: 'Party wise Profit & Loss', render: () => <PartyWiseProfitLossReport /> },
        { key: 'all_parties', title: 'All parties', render: () => <AllPartiesReport /> },
        { key: 'party_report_by_item', title: 'Party Report By Item', render: () => <PartyReportByItem /> },
        { key: 'sale_purchase_by_party', title: 'Sale Purchase By Party', render: () => <SalePurchaseByParty /> }
      ]
    },
    {
      title: 'Item/ Stock report', tone: 'mint', hideTitle: true,
      reports: [
        { key: 'stock_summary', title: 'Stock Summary', render: () => <ItemStockReport type="stock_summary" /> },
        { key: 'item_report_by_party', title: 'Item Report By Party', render: () => <ItemStockReport type="item_report_by_party" /> },
        { key: 'item_wise_profit_loss', title: 'Item Wise Profit And Loss', render: () => <ItemStockReport type="item_wise_profit_loss" /> },
        { key: 'item_category_wise_profit_loss', title: 'Item Category Wise Profit And Loss', render: () => <ItemStockReport type="item_category_wise_profit_loss" /> },
        { key: 'low_stock_summary', title: 'Low Stock Summary', render: () => <ItemStockReport type="low_stock_summary" /> },
        { key: 'stock_detail', title: 'Stock Detail', render: () => <ItemStockReport type="stock_detail" /> },
        { key: 'item_detail', title: 'Item Detail', render: () => <ItemStockReport type="item_detail" /> },
        { key: 'sale_purchase_by_item_category', title: 'Sale/ Purchase Report By Item Category', render: () => <ItemStockReport type="sale_purchase_by_item_category" /> },
        { key: 'stock_summary_by_item_category', title: 'Stock Summary Report By Item Category', render: () => <ItemStockReport type="stock_summary_by_item_category" /> },
        { key: 'item_wise_discount', title: 'Item Wise Discount', render: () => <ItemStockReport type="item_wise_discount" /> }
      ]
    }
  ];

  const all = GROUPS.flatMap(g => g.reports);
  const [active, setActive] = useState(all[0].key);          // Sale is first, so it opens by default
  const current = all.find(r => r.key === active) || all[0];

  return (
    <div className="rp-shell">
      <aside className="rp-nav" aria-label="Reports">
        {GROUPS.map(g => (
          <div key={g.title}>
            {!g.hideTitle && <div className={`rp-group rp-group-${g.tone}`}>{g.title}</div>}
            {g.reports.map(r => (
              <button key={r.key} type="button" className={`rp-item${r.key === current.key ? ' active' : ''}`} onClick={() => setActive(r.key)}>
                {r.title}
              </button>
            ))}
          </div>
        ))}
      </aside>
      <section className="rp-body" key={current.key}>{current.render()}</section>
    </div>
  );
}
