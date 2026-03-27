"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Trash2, Pencil, X, ChevronDown, ChevronRight,
  Download, Film, Layers, DollarSign, AlertCircle,
  Loader2, Check, FolderOpen, Tag, FileText,
  TrendingUp, BarChart3, Package, FileDown,
} from "lucide-react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE     = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const EXPENSE_URL  = `${API_BASE}/expense`;
const PROJECTS_URL = `${API_BASE}/projects`;

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  baseCurrency: string;
}

interface Expense {
  id: number;
  projectId: string;
  category: string;
  itemName: string;
  preProduction: number;
  production: number;
  postProduction: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemFormData {
  itemName: string;
  preProduction: number;
  production: number;
  postProduction: number;
  notes: string;
}

interface SummaryData {
  categorySummary: Record<string, {
    items: { itemName: string; preProduction: number; production: number; postProduction: number; totalAmount: number }[];
    categoryTotalPre: number;
    categoryTotalProd: number;
    categoryTotalPost: number;
    categoryTotalAmount: number;
  }>;
  grandTotals: { preProduction: number; production: number; postProduction: number; totalAmount: number };
  taxAmount: number;
  contingencyAmount: number;
  finalTotal: number;
}

// ─── PRESET CATEGORIES ───────────────────────────────────────────────────────
const PRESET_CATS = [
  "Cast & Talent", "Crew & Labor", "Equipment", "Locations",
  "Art & Set Design", "Costumes & Wardrobe", "Sound & Music",
  "Visual Effects", "Marketing & Publicity", "Legal & Insurance",
  "Travel & Transport", "Catering & Craft", "Post Production", "Other",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtMoney = (n: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
};

const fmtNum = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── PDF EXPORT — SINGLE CATEGORY ────────────────────────────────────────────
function printCategoryPDF(
  category: string,
  items: Expense[],
  projectTitle: string,
  currency: string,
) {
  const tot  = items.reduce((s, e) => s + e.totalAmount, 0);
  const pre  = items.reduce((s, e) => s + e.preProduction, 0);
  const prod = items.reduce((s, e) => s + e.production, 0);
  const post = items.reduce((s, e) => s + e.postProduction, 0);
  const f    = (n: number) => fmtMoney(n, currency);

  const rows = items.map(e => `
    <tr>
      <td>${e.itemName}</td>
      <td class="r">${f(e.preProduction)}</td>
      <td class="r">${f(e.production)}</td>
      <td class="r">${f(e.postProduction)}</td>
      <td class="r b">${f(e.totalAmount)}</td>
      <td class="note">${e.notes ?? "—"}</td>
    </tr>`).join("");

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${category} — ${projectTitle}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:48px;font-size:13px}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0ea5e9;padding-bottom:20px;margin-bottom:28px}
    .top h1{font-size:22px;font-weight:800;color:#0f172a}.top p{font-size:12px;color:#64748b;margin-top:4px}
    .top-right{text-align:right}.top-right .cur{font-size:11px;font-weight:700;color:#0ea5e9;background:#f0f9ff;border:1px solid #bae6fd;padding:3px 10px;border-radius:20px}
    .badge{display:inline-flex;align-items:center;gap:6px;background:#0ea5e9;color:#fff;font-size:11px;font-weight:800;padding:4px 14px;border-radius:20px;margin-bottom:20px;text-transform:uppercase;letter-spacing:.05em}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    thead th{background:#0f172a;color:#e2e8f0;padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.07em}
    .r{text-align:right}.b{font-weight:700}
    tbody tr{border-bottom:1px solid #e2e8f0}
    tbody tr:nth-child(even){background:#f8fafc}
    tbody td{padding:9px 12px}
    td.note{font-size:11px;color:#94a3b8;font-style:italic}
    tfoot td{padding:11px 12px;background:#f1f5f9;font-weight:700;border-top:2px solid #cbd5e1}
    .hi{font-size:15px;color:#0ea5e9}
    .phases{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:0}
    .ph{border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}
    .ph span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:4px}
    .ph strong{font-size:16px;font-weight:700;color:#0f172a}
    .ph.accent{border-color:#0ea5e9;background:#f0f9ff}
    .ph.accent strong{color:#0ea5e9}
    .footer{margin-top:36px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{body{padding:24px}@page{margin:15mm}}
  </style></head><body>
  <div class="top">
    <div><h1>🎬 ${projectTitle}</h1>
    <p>Expense Report · Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p></div>
    <div class="top-right"><div class="cur">${currency}</div></div>
  </div>
  <div class="badge">📂 ${category}</div>
  <table>
    <thead><tr><th>Item</th><th class="r">Pre-Production</th><th class="r">Production</th><th class="r">Post-Production</th><th class="r">Total</th><th>Notes</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td><strong>Category Total</strong></td><td class="r">${f(pre)}</td><td class="r">${f(prod)}</td><td class="r">${f(post)}</td><td class="r hi">${f(tot)}</td><td></td></tr></tfoot>
  </table>
  <div class="phases">
    <div class="ph"><span>Pre-Production</span><strong>${f(pre)}</strong></div>
    <div class="ph"><span>Production</span><strong>${f(prod)}</strong></div>
    <div class="ph"><span>Post-Production</span><strong>${f(post)}</strong></div>
    <div class="ph accent"><span>Grand Total (${currency})</span><strong>${f(tot)}</strong></div>
  </div>
  <div class="footer"><span>Film Finance App — ${category} Expense Report</span><span>${items.length} line item${items.length!==1?"s":""}</span></div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`);
  win.document.close();
}

// ─── PDF EXPORT — FULL BUDGET (matches the screenshot format) ────────────────
function printFullBudgetPDF(
  expenses: Expense[],
  project: Project,
  taxRate: number,
  contingency: number,
) {
  const currency = project.baseCurrency;
  const f = (n: number) => fmtNum(n);

  // Group by category
  const grouped: Record<string, Expense[]> = {};
  expenses.forEach(e => {
    (grouped[e.category] = grouped[e.category] || []).push(e);
  });

  // Phase totals (before tax/contingency)
  const grandPre  = expenses.reduce((s, e) => s + e.preProduction, 0);
  const grandProd = expenses.reduce((s, e) => s + e.production, 0);
  const grandPost = expenses.reduce((s, e) => s + e.postProduction, 0);
  const grandTotal = grandPre + grandProd + grandPost;

  const contAmt   = grandTotal * (contingency / 100);
  const taxAmt    = grandTotal * (taxRate / 100);
  const contAndTaxTotal = grandTotal + contAmt + taxAmt;

  // Summary table rows (no tax, with contingency only, with tax only, with both)
  const summaryRows = `
    <tr class="sum-row">
      <td colspan="2">Without Contingency Fund &amp; Tax</td>
      <td><strong>PRE PROD</strong></td><td><strong>PROD</strong></td><td><strong>POST PROD</strong></td><td><strong>TOTAL</strong></td>
    </tr>
    <tr class="sum-data">
      <td colspan="2" class="r-label">Phase Total</td>
      <td class="r">${f(grandPre)}</td><td class="r">${f(grandProd)}</td><td class="r">${f(grandPost)}</td><td class="r b">${f(grandTotal)}</td>
    </tr>
    <tr class="sum-row">
      <td colspan="2">With ${contingency}% Contingency Fund Only</td>
      <td><strong>PRE PROD</strong></td><td><strong>PROD</strong></td><td><strong>POST PROD</strong></td><td><strong>TOTAL</strong></td>
    </tr>
    <tr class="sum-data">
      <td colspan="2" class="r-label">Phase Total</td>
      <td class="r">${f(grandPre * (1 + contingency/100))}</td>
      <td class="r">${f(grandProd * (1 + contingency/100))}</td>
      <td class="r">${f(grandPost * (1 + contingency/100))}</td>
      <td class="r b">${f(grandTotal + contAmt)}</td>
    </tr>
    <tr class="sum-row">
      <td colspan="2">With ${taxRate}% Tax Only</td>
      <td><strong>PRE PROD</strong></td><td><strong>PROD</strong></td><td><strong>POST PROD</strong></td><td><strong>TOTAL</strong></td>
    </tr>
    <tr class="sum-data">
      <td colspan="2" class="r-label">Phase Total</td>
      <td class="r">${f(grandPre * (1 + taxRate/100))}</td>
      <td class="r">${f(grandProd * (1 + taxRate/100))}</td>
      <td class="r">${f(grandPost * (1 + taxRate/100))}</td>
      <td class="r b">${f(grandTotal + taxAmt)}</td>
    </tr>
    <tr class="sum-row">
      <td colspan="2">With ${contingency}% Contingency Fund &amp; ${taxRate}% Tax</td>
      <td><strong>PRE PROD</strong></td><td><strong>PROD</strong></td><td><strong>POST PROD</strong></td><td><strong>TOTAL</strong></td>
    </tr>
    <tr class="sum-data sum-data--final">
      <td colspan="2" class="r-label">Phase Total</td>
      <td class="r">${f(grandPre * (1 + (contingency + taxRate)/100))}</td>
      <td class="r">${f(grandProd * (1 + (contingency + taxRate)/100))}</td>
      <td class="r">${f(grandPost * (1 + (contingency + taxRate)/100))}</td>
      <td class="r b">${f(contAndTaxTotal)}</td>
    </tr>
  `;

  // Category + items rows
  let catRows = "";
  let catIndex = 1;
  Object.entries(grouped).forEach(([cat, items]) => {
    const catPre  = items.reduce((s, e) => s + e.preProduction, 0);
    const catProd = items.reduce((s, e) => s + e.production, 0);
    const catPost = items.reduce((s, e) => s + e.postProduction, 0);
    const catTot  = catPre + catProd + catPost;

    catRows += `
      <tr class="cat-header">
        <td>${catIndex}</td>
        <td><strong>${cat}</strong></td>
        <td class="r"><strong>${f(catPre)}</strong></td>
        <td class="r"><strong>${f(catProd)}</strong></td>
        <td class="r"><strong>${f(catPost)}</strong></td>
        <td class="r"><strong>${f(catTot)}</strong></td>
      </tr>`;

    let subIndex = 1;
    items.forEach(exp => {
      catRows += `
        <tr class="item-row">
          <td class="sub-num">${catIndex}.${subIndex}</td>
          <td class="item-name">${exp.itemName}${exp.notes ? ` <span class="note-inline">(${exp.notes})</span>` : ""}</td>
          <td class="r">${f(exp.preProduction)}</td>
          <td class="r">${f(exp.production)}</td>
          <td class="r">${f(exp.postProduction)}</td>
          <td class="r">${f(exp.totalAmount)}</td>
        </tr>`;
      subIndex++;
    });

    catRows += `<tr class="spacer-row"><td colspan="6"></td></tr>`;
    catIndex++;
  });

  // Contingency & Tax rows
  catRows += `
    <tr class="cat-header cat-header--special">
      <td>${catIndex}</td>
      <td><strong>CONTINGENCY ${contingency}%</strong></td>
      <td class="r"><strong>${f(grandPre * contingency / 100)}</strong></td>
      <td class="r"><strong>${f(grandProd * contingency / 100)}</strong></td>
      <td class="r"><strong>${f(grandPost * contingency / 100)}</strong></td>
      <td class="r"><strong>${f(contAmt)}</strong></td>
    </tr>
    <tr class="spacer-row"><td colspan="6"></td></tr>
    <tr class="cat-header cat-header--special">
      <td>${catIndex + 1}</td>
      <td><strong>TAX ${taxRate}%</strong></td>
      <td class="r"><strong>${f(grandPre * taxRate / 100)}</strong></td>
      <td class="r"><strong>${f(grandProd * taxRate / 100)}</strong></td>
      <td class="r"><strong>${f(grandPost * taxRate / 100)}</strong></td>
      <td class="r"><strong>${f(taxAmt)}</strong></td>
    </tr>
    <tr class="spacer-row"><td colspan="6"></td></tr>
    <tr class="grand-total-row">
      <td colspan="2"><strong>Total</strong></td>
      <td class="r"><strong>${f(grandPre + grandPre * (contingency + taxRate) / 100)}</strong></td>
      <td class="r"><strong>${f(grandProd + grandProd * (contingency + taxRate) / 100)}</strong></td>
      <td class="r"><strong>${f(grandPost + grandPost * (contingency + taxRate) / 100)}</strong></td>
      <td class="r"><strong>${f(contAndTaxTotal)}</strong></td>
    </tr>
  `;

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Full Budget — ${project.title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;padding:40px;font-size:12px;background:#fff}

  /* ── Header ── */
  .page-header{border:2px solid #1e293b;margin-bottom:20px}
  .page-header .top-bar{background:#4472c4;color:#fff;text-align:center;padding:8px;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
  .page-header .sub-bar{text-align:center;padding:5px;font-size:10px;color:#475569;border-bottom:1px solid #e2e8f0}
  .page-header .date-row{text-align:right;padding:4px 12px;font-size:10px;color:#64748b;border-bottom:1px solid #e2e8f0}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
  .info-row{display:flex;border-bottom:1px solid #e2e8f0;padding:5px 12px}
  .info-row .lbl{font-weight:700;min-width:180px;font-size:11px}
  .info-row .val{font-size:11px;color:#0f172a}
  .total-banner{background:#1e293b;color:#fff;display:flex;justify-content:space-between;padding:10px 14px;align-items:center}
  .total-banner .lbl{font-size:12px;font-weight:700}
  .total-banner .val{font-size:16px;font-weight:800;font-family:monospace}

  /* ── Summary table ── */
  .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:18px 0 6px;padding-bottom:4px;border-bottom:2px solid #e2e8f0}
  table.main-table{width:100%;border-collapse:collapse;margin-bottom:0}
  table.main-table th{background:#1e293b;color:#e2e8f0;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.07em}
  table.main-table th.r{text-align:right}
  .sum-row td{background:#4472c4;color:#fff;padding:6px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
  .sum-data td{background:#f0f4ff;padding:5px 10px;border-bottom:1px solid #dde6ff;font-size:11px}
  .sum-data--final td{background:#e8edff;font-weight:700}
  .r{text-align:right}
  .r-label{text-align:right;font-style:italic;color:#64748b;font-size:10px}
  .b{font-weight:700}

  /* ── Category table ── */
  table.cat-table{width:100%;border-collapse:collapse}
  table.cat-table th{background:#1e293b;color:#e2e8f0;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.07em}
  table.cat-table th.r{text-align:right}
  .cat-header td{background:#eaf0fb;padding:7px 10px;font-size:11px;border-bottom:1px solid #c9d8f5;border-top:3px solid #4472c4}
  .cat-header--special td{background:#fef9ec;border-top:3px solid #f59e0b}
  .item-row td{padding:5px 10px 5px 18px;border-bottom:1px solid #f1f5f9;font-size:11px}
  .item-row:nth-child(even) td{background:#fafbfc}
  .sub-num{color:#94a3b8;font-size:10px;width:40px}
  .item-name{color:#0f172a}
  .note-inline{color:#94a3b8;font-style:italic;font-size:10px}
  .spacer-row td{height:6px;background:#f8fafc}
  .grand-total-row td{background:#1e293b;color:#fff;padding:10px;font-size:13px;font-weight:800}
  .grand-total-row td.r{text-align:right}

  /* ── Footer ── */
  .doc-footer{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}

  @media print{
    body{padding:12mm}
    @page{margin:10mm;size:A4}
    .page-break{page-break-before:always}
  }
</style>
</head>
<body>

<!-- ══ PROJECT HEADER ══ -->
<div class="page-header">
  <div class="top-bar">PRODUCTION APPROACH WITH ${currency} BUDGET</div>
  <div class="sub-bar">Film Finance — Full Budget Report</div>
  <div class="date-row">As at ${dateStr}</div>
  <div class="info-grid">
    <div>
      <div class="info-row"><span class="lbl">Project Title:</span><span class="val">${project.title}</span></div>
      <div class="info-row"><span class="lbl">Cinema Format:</span><span class="val">Digital</span></div>
      <div class="info-row"><span class="lbl">Currency:</span><span class="val">${currency}</span></div>
    </div>
    <div>
      <div class="info-row"><span class="lbl">Total Categories:</span><span class="val">${Object.keys(grouped).length}</span></div>
      <div class="info-row"><span class="lbl">Total Line Items:</span><span class="val">${expenses.length}</span></div>
      <div class="info-row"><span class="lbl">Report Generated:</span><span class="val">${dateStr}</span></div>
    </div>
  </div>
  <div class="total-banner">
    <span class="lbl">Total Budget (${currency}) — with ${contingency}% Contingency &amp; ${taxRate}% Tax:</span>
    <span class="val">${fmtNum(contAndTaxTotal)}</span>
  </div>
</div>

<!-- ══ PHASE SUMMARY TABLE ══ -->
<div class="section-title">Budget Summary by Phase</div>
<table class="main-table">
  <thead>
    <tr>
      <th colspan="2">Description</th>
      <th class="r">Pre-Production</th>
      <th class="r">Production</th>
      <th class="r">Post-Production</th>
      <th class="r">Total (${currency})</th>
    </tr>
  </thead>
  <tbody>
    ${summaryRows}
  </tbody>
</table>

<!-- ══ CATEGORY BREAKDOWN ══ -->
<div class="section-title page-break" style="margin-top:24px">Category Description &amp; Line Items</div>
<table class="cat-table">
  <thead>
    <tr>
      <th style="width:40px">#</th>
      <th>Category / Item Description</th>
      <th class="r">Pre-Production</th>
      <th class="r">Production</th>
      <th class="r">Post-Production</th>
      <th class="r">Total (${currency})</th>
    </tr>
  </thead>
  <tbody>
    ${catRows}
  </tbody>
</table>

<div class="doc-footer">
  <span>Film Finance App — Full Budget Report · ${project.title}</span>
  <span>${expenses.length} line items across ${Object.keys(grouped).length} categories</span>
</div>

<script>window.onload = () => window.print();</script>
</body></html>`);
  win.document.close();
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ExpensePage() {
  // Projects
  const [projects, setProjects]         = useState<Project[]>([]);
  const [projectsLoading, setProjLoad]  = useState(true);
  const [selectedProjectId, setSelProj] = useState("");
  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;
  const currency = selectedProject?.baseCurrency ?? "USD";
  const f = useCallback((n: number) => fmtMoney(n, currency), [currency]);

  // Expenses
  const [expenses, setExpenses]           = useState<Expense[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Summary
  const [summary, setSummary]             = useState<SummaryData | null>(null);
  const [summaryLoading, setSumLoad]      = useState(false);
  const [taxRate, setTaxRate]             = useState(10);
  const [contingency, setContingency]     = useState(5);
  const [showSummary, setShowSummary]     = useState(false);

  // UI state
  const [expandedCats, setExpandedCats]   = useState<Set<string>>(new Set());
  const [exportingCat, setExportingCat]   = useState<string | null>(null);
  const [exportingFull, setExportingFull] = useState(false);
  const [deleteId, setDeleteId]           = useState<number | null>(null);
  const [toast, setToast]                 = useState<{msg:string;type:"ok"|"err"}|null>(null);

  // New-category modal
  const [showNewCat, setShowNewCat]       = useState(false);
  const [newCatName, setNewCatName]       = useState("");
  const [catQuery, setCatQuery]           = useState("");
  const catRef = useRef<HTMLDivElement>(null);

  // Add/edit item modal
  const [itemModal, setItemModal]         = useState<{category:string; editing:Expense|null}|null>(null);
  const [itemForm, setItemForm]           = useState<ItemFormData>({itemName:"",preProduction:0,production:0,postProduction:0,notes:""});
  const [itemSubmitting, setItemSub]      = useState(false);

  const showToast = (msg: string, type: "ok"|"err") => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3000);
  };

  // ── Fetch projects ──
  useEffect(()=>{
    (async()=>{
      try {
        setProjLoad(true);
        const r = await fetch(`${PROJECTS_URL}?limit=99999`,{credentials:"include"});
        const d = await r.json();
        setProjects(d.data?.projects ?? []);
      } catch { setProjects([]); }
      finally { setProjLoad(false); }
    })();
  },[]);

  // ── Fetch expenses ──
  const fetchExpenses = useCallback(async()=>{
    if(!selectedProjectId) return;
    try {
      setLoading(true); setError(null);
      const r = await fetch(`${EXPENSE_URL}/project/${selectedProjectId}`,{credentials:"include"});
      if(!r.ok) throw new Error("Failed to load expenses");
      const d = await r.json();
      setExpenses(d.data ?? []);
    } catch(e:any){ setError(e.message); }
    finally { setLoading(false); }
  },[selectedProjectId]);

  useEffect(()=>{
    if(selectedProjectId){ fetchExpenses(); setSummary(null); setShowSummary(false); }
    else { setExpenses([]); setSummary(null); }
  },[selectedProjectId, fetchExpenses]);

  // ── Fetch summary ──
  const fetchSummary = useCallback(async()=>{
    if(!selectedProjectId) return;
    try {
      setSumLoad(true);
      const r = await fetch(
        `${EXPENSE_URL}/project/${selectedProjectId}/summary?taxRate=${taxRate/100}&contingencyRate=${contingency/100}`,
        {credentials:"include"}
      );
      const d = await r.json();
      setSummary(d.data);
    } catch { setSummary(null); }
    finally { setSumLoad(false); }
  },[selectedProjectId, taxRate, contingency]);

  useEffect(()=>{ if(showSummary && selectedProjectId) fetchSummary(); },[showSummary,fetchSummary,selectedProjectId]);

  // ── Group expenses by category ──
  const grouped = expenses.reduce<Record<string,Expense[]>>((acc,e)=>{
    (acc[e.category]??=[]).push(e); return acc;
  },{});
  const categories = Object.keys(grouped);

  // ── Stats ──
  const grandTotal = expenses.reduce((s,e)=>s+e.totalAmount,0);
  const totalPre   = expenses.reduce((s,e)=>s+e.preProduction,0);
  const totalProd  = expenses.reduce((s,e)=>s+e.production,0);
  const totalPost  = expenses.reduce((s,e)=>s+e.postProduction,0);

  // ── Create category ──
  const handleCreateCategory = () => {
    const name = newCatName.trim();
    if(!name){ showToast("Enter a category name","err"); return; }
    if(grouped[name]){ showToast("Category already exists","err"); return; }
    setExpandedCats(p=>new Set([...p, name]));
    setShowNewCat(false);
    setNewCatName(""); setCatQuery("");
    setItemForm({itemName:"",preProduction:0,production:0,postProduction:0,notes:""});
    setItemModal({category:name, editing:null});
  };

  // ── Delete entire category ──
  const handleDeleteCategory = async(cat:string)=>{
    const items = grouped[cat] ?? [];
    if(!confirm(`Delete all ${items.length} item(s) in "${cat}"? This cannot be undone.`)) return;
    try {
      await Promise.all(items.map(e=>
        fetch(`${EXPENSE_URL}/${e.id}`,{method:"DELETE",credentials:"include"})
      ));
      showToast(`"${cat}" deleted`,"ok");
      fetchExpenses();
    } catch { showToast("Failed to delete category","err"); }
  };

  // ── Open add item ──
  const openAddItem = (category:string)=>{
    setItemForm({itemName:"",preProduction:0,production:0,postProduction:0,notes:""});
    setItemModal({category, editing:null});
  };

  // ── Open edit item ──
  const openEditItem = (exp:Expense)=>{
    setItemForm({itemName:exp.itemName,preProduction:exp.preProduction,production:exp.production,postProduction:exp.postProduction,notes:exp.notes??""});
    setItemModal({category:exp.category, editing:exp});
  };

  // ── Submit item ──
  const handleItemSubmit = async()=>{
    if(!itemModal) return;
    const {category, editing} = itemModal;
    if(!itemForm.itemName.trim()){ showToast("Item name is required","err"); return; }
    try {
      setItemSub(true);
      const payload = {
        projectId: selectedProjectId,
        category,
        itemName: itemForm.itemName.trim(),
        preProduction: Number(itemForm.preProduction)||0,
        production: Number(itemForm.production)||0,
        postProduction: Number(itemForm.postProduction)||0,
        notes: itemForm.notes,
      };
      const url    = editing ? `${EXPENSE_URL}/${editing.id}` : `${EXPENSE_URL}/`;
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url,{method,headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(payload)});
      if(!r.ok) throw new Error("Save failed");
      showToast(editing ? "Item updated" : "Item added","ok");
      setItemModal(null);
      setExpandedCats(p=>new Set([...p, category]));
      fetchExpenses();
    } catch(e:any){ showToast(e.message,"err"); }
    finally { setItemSub(false); }
  };

  // ── Delete single item ──
  const handleDeleteItem = async(id:number)=>{
    try {
      setDeleteId(id);
      const r = await fetch(`${EXPENSE_URL}/${id}`,{method:"DELETE",credentials:"include"});
      if(!r.ok) throw new Error();
      showToast("Item deleted","ok");
      setExpenses(p=>p.filter(e=>e.id!==id));
    } catch { showToast("Delete failed","err"); }
    finally { setDeleteId(null); }
  };

  // ── Toggle category collapse ──
  const toggleCat = (cat:string)=>{
    setExpandedCats(p=>{const n=new Set(p); n.has(cat)?n.delete(cat):n.add(cat); return n;});
  };

  // ── Per-category PDF export ──
  const handleExport = (cat:string)=>{
    const items = grouped[cat]??[];
    if(!items.length){ showToast("No items to export","err"); return; }
    setExportingCat(cat);
    printCategoryPDF(cat, items, selectedProject?.title??"Project", currency);
    setTimeout(()=>setExportingCat(null),1000);
  };

  // ── Full budget PDF export ──
  const handleFullExport = () => {
    if(!expenses.length){ showToast("No expenses to export","err"); return; }
    if(!selectedProject) return;
    setExportingFull(true);
    printFullBudgetPDF(expenses, selectedProject, taxRate, contingency);
    setTimeout(()=>setExportingFull(false), 1200);
  };

  const itemFormTotal = Number(itemForm.preProduction)+Number(itemForm.production)+Number(itemForm.postProduction);

  const filteredPresets = PRESET_CATS.filter(c=>
    c.toLowerCase().includes(catQuery.toLowerCase()) && !grouped[c]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="expense-page">
      <style>{PAGE_CSS}</style>

      {/* Toast */}
      {toast && (
        <div className={`ep-toast ep-toast--${toast.type}`}>
          {toast.type==="ok"?<Check size={14}/>:<AlertCircle size={14}/>}
          {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="ep-header">
        <div className="ep-header__left">
          <div className="ep-header__icon"><Film size={20}/></div>
          <div>
            <p className="ep-header__eyebrow">Film Finance</p>
            <h1 className="ep-header__title">Expense Tracker</h1>
          </div>
        </div>

        <div className="ep-header__right">
          <div className="ep-proj-selector">
            <span className="ep-proj-selector__lbl">Project:</span>
            {projectsLoading
              ? <span className="ep-proj-selector__loading"><Loader2 size={13} className="spin"/> Loading…</span>
              : (
                <select
                  className="ep-proj-select"
                  value={selectedProjectId}
                  onChange={e=>{setSelProj(e.target.value); setExpandedCats(new Set());}}
                >
                  <option value="">-- Select Project --</option>
                  {projects.map(p=>(
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              )
            }
          </div>
          {selectedProjectId && (
            <>
              <button className="ep-btn ep-btn--primary" onClick={()=>setShowNewCat(true)}>
                <Plus size={15}/> New Category
              </button>
              {expenses.length > 0 && (
                <button
                  className="ep-btn ep-btn--full-export"
                  onClick={handleFullExport}
                  disabled={exportingFull}
                  title="Export full budget as PDF (like the screenshot)"
                >
                  {exportingFull ? <Loader2 size={14} className="spin"/> : <FileDown size={14}/>}
                  Full Budget PDF
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── NO PROJECT ── */}
      {!selectedProjectId ? (
        <div className="ep-empty-state">
          <div className="ep-empty-state__icon"><FolderOpen size={40}/></div>
          <h2>No Project Selected</h2>
          <p>Select a project from the dropdown above to view and manage expenses.</p>
        </div>
      ) : (
        <>
          {selectedProject && (
            <div className="ep-currency-bar">
              <DollarSign size={13}/>
              Amounts displayed in <strong>{currency}</strong> — {selectedProject.title}
            </div>
          )}

          {/* ── STATS ── */}
          <div className="ep-stats">
            <StatCard label="Categories" value={String(categories.length)} icon={<Tag size={16}/>} color="sky"/>
            <StatCard label="Total Items" value={String(expenses.length)} icon={<Package size={16}/>} color="violet"/>
            <StatCard label="Grand Total" value={f(grandTotal)} icon={<DollarSign size={16}/>} color="emerald" large/>
            <StatCard label="Pre-Production" value={f(totalPre)} icon={<BarChart3 size={16}/>} color="amber"/>
            <StatCard label="Production" value={f(totalProd)} icon={<BarChart3 size={16}/>} color="orange"/>
            <StatCard label="Post-Production" value={f(totalPost)} icon={<BarChart3 size={16}/>} color="rose"/>
          </div>

          {loading && (
            <div className="ep-load-box"><Loader2 size={26} className="spin"/><span>Loading expenses…</span></div>
          )}
          {error && !loading && (
            <div className="ep-err-box"><AlertCircle size={18}/>{error}</div>
          )}

          {!loading && !error && expenses.length===0 && (
            <div className="ep-empty-state ep-empty-state--sm">
              <div className="ep-empty-state__icon"><Layers size={34}/></div>
              <h2>No expenses yet</h2>
              <p>Create a category to start adding expenses for <strong>{selectedProject?.title}</strong>.</p>
              <button className="ep-btn ep-btn--primary ep-btn--lg" onClick={()=>setShowNewCat(true)}>
                <Plus size={15}/> Create First Category
              </button>
            </div>
          )}

          {/* ── CATEGORY CARDS ── */}
          {!loading && !error && categories.map(cat=>{
            const items      = grouped[cat];
            const isOpen     = expandedCats.has(cat);
            const catTotal   = items.reduce((s,e)=>s+e.totalAmount,0);
            const catPre     = items.reduce((s,e)=>s+e.preProduction,0);
            const catProd    = items.reduce((s,e)=>s+e.production,0);
            const catPost    = items.reduce((s,e)=>s+e.postProduction,0);
            const isExporting = exportingCat===cat;

            return (
              <div key={cat} className="ep-cat-card">
                <div className="ep-cat-card__header" onClick={()=>toggleCat(cat)}>
                  <div className="ep-cat-card__header-left">
                    <span className="ep-cat-card__chevron">
                      {isOpen?<ChevronDown size={16}/>:<ChevronRight size={16}/>}
                    </span>
                    <span className="ep-cat-card__name">{cat}</span>
                    <span className="ep-cat-card__count">{items.length} item{items.length!==1?"s":""}</span>
                  </div>
                  <div className="ep-cat-card__header-right" onClick={e=>e.stopPropagation()}>
                    <span className="ep-phase-pill ep-phase-pill--pre">Pre: {f(catPre)}</span>
                    <span className="ep-phase-pill ep-phase-pill--prod">Prod: {f(catProd)}</span>
                    <span className="ep-phase-pill ep-phase-pill--post">Post: {f(catPost)}</span>
                    <span className="ep-cat-total">{f(catTotal)}</span>
                    <button className="ep-btn ep-btn--sm ep-btn--outline" onClick={()=>openAddItem(cat)}>
                      <Plus size={13}/> Add Item
                    </button>
                    <button
                      className="ep-btn ep-btn--sm ep-btn--export"
                      onClick={()=>handleExport(cat)}
                      disabled={isExporting}
                    >
                      {isExporting?<Loader2 size={12} className="spin"/>:<Download size={12}/>}
                      Export PDF
                    </button>
                    <button className="ep-icon-btn ep-icon-btn--danger" onClick={()=>handleDeleteCategory(cat)}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="ep-cat-card__body">
                    {items.length===0 ? (
                      <div className="ep-cat-empty">
                        No items yet.
                        <button className="ep-inline-btn" onClick={()=>openAddItem(cat)}><Plus size={12}/>Add the first item</button>
                      </div>
                    ) : (
                      <table className="ep-items-table">
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th className="r">Pre-Production</th>
                            <th className="r">Production</th>
                            <th className="r">Post-Production</th>
                            <th className="r">Total ({currency})</th>
                            <th>Notes</th>
                            <th style={{width:72}}/>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(exp=>(
                            <tr key={exp.id}>
                              <td className="ep-item-name">{exp.itemName}</td>
                              <td className="r ep-c-pre">{f(exp.preProduction)}</td>
                              <td className="r ep-c-prod">{f(exp.production)}</td>
                              <td className="r ep-c-post">{f(exp.postProduction)}</td>
                              <td className="r ep-item-total">{f(exp.totalAmount)}</td>
                              <td className="ep-notes">{exp.notes||"—"}</td>
                              <td>
                                <div className="ep-row-actions">
                                  <button className="ep-icon-btn ep-icon-btn--edit" onClick={()=>openEditItem(exp)}>
                                    <Pencil size={13}/>
                                  </button>
                                  <button className="ep-icon-btn ep-icon-btn--danger" onClick={()=>handleDeleteItem(exp.id)} disabled={deleteId===exp.id}>
                                    {deleteId===exp.id?<Loader2 size={13} className="spin"/>:<Trash2 size={13}/>}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td className="ep-foot-lbl">Category Total</td>
                            <td className="r ep-foot-num">{f(catPre)}</td>
                            <td className="r ep-foot-num">{f(catProd)}</td>
                            <td className="r ep-foot-num">{f(catPost)}</td>
                            <td className="r ep-foot-total">{f(catTotal)}</td>
                            <td colSpan={2}/>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ── SUMMARY SECTION ── */}
          {!loading && expenses.length>0 && (
            <div className="ep-summary-section">
              <button className="ep-summary-toggle" onClick={()=>setShowSummary(p=>!p)}>
                <TrendingUp size={16}/>
                {showSummary?"Hide":"Show"} Budget Summary
                {showSummary?<ChevronDown size={15}/>:<ChevronRight size={15}/>}
              </button>

              {showSummary && (
                <div className="ep-summary-body">
                  <div className="ep-summary-controls">
                    <div className="ep-rate-ctrl">
                      <label>Tax Rate: <strong>{taxRate}%</strong></label>
                      <input type="range" min={0} max={30} step={0.5} value={taxRate}
                        onChange={e=>setTaxRate(Number(e.target.value))} className="ep-slider"/>
                    </div>
                    <div className="ep-rate-ctrl">
                      <label>Contingency: <strong>{contingency}%</strong></label>
                      <input type="range" min={0} max={30} step={0.5} value={contingency}
                        onChange={e=>setContingency(Number(e.target.value))} className="ep-slider"/>
                    </div>
                    <button className="ep-btn ep-btn--sky" onClick={fetchSummary} disabled={summaryLoading}>
                      {summaryLoading?<Loader2 size={13} className="spin"/>:<TrendingUp size={13}/>}
                      Recalculate
                    </button>
                    <button className="ep-btn ep-btn--full-export" onClick={handleFullExport} disabled={exportingFull}>
                      {exportingFull?<Loader2 size={13} className="spin"/>:<FileDown size={13}/>}
                      Full Budget PDF
                    </button>
                  </div>

                  {summaryLoading && (
                    <div className="ep-load-box"><Loader2 size={22} className="spin"/><span>Calculating…</span></div>
                  )}

                  {summary && !summaryLoading && (
                    <div className="ep-summary-content">
                      <div className="ep-sum-cats">
                        {Object.entries(summary.categorySummary).map(([cat,data])=>(
                          <div className="ep-sum-cat" key={cat}>
                            <div className="ep-sum-cat__head">
                              <span className="ep-cat-badge">{cat}</span>
                              <div className="ep-sum-cat__head-right">
                                <span className="ep-sum-cat__total">{f(data.categoryTotalAmount)}</span>
                                <button className="ep-btn ep-btn--xs ep-btn--export" onClick={()=>handleExport(cat)} disabled={exportingCat===cat}>
                                  {exportingCat===cat?<Loader2 size={10} className="spin"/>:<Download size={10}/>} PDF
                                </button>
                              </div>
                            </div>
                            <div className="ep-sum-phases">
                              <div className="ep-sum-phase ep-sum-phase--pre"><span>Pre</span>{f(data.categoryTotalPre)}</div>
                              <div className="ep-sum-phase ep-sum-phase--prod"><span>Prod</span>{f(data.categoryTotalProd)}</div>
                              <div className="ep-sum-phase ep-sum-phase--post"><span>Post</span>{f(data.categoryTotalPost)}</div>
                            </div>
                            <div className="ep-sum-items">
                              {data.items.map(item=>(
                                <div className="ep-sum-item" key={item.itemName}>
                                  <span>{item.itemName}</span><span>{f(item.totalAmount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="ep-grand-totals">
                        <h3>Final Breakdown <span className="ep-cur-tag">{currency}</span></h3>
                        <div className="ep-total-rows">
                          <div className="ep-total-row"><span>Subtotal</span><span>{f(summary.grandTotals.totalAmount)}</span></div>
                          <div className="ep-total-row ep-total-row--muted"><span>Tax ({taxRate}%)</span><span>+ {f(summary.taxAmount)}</span></div>
                          <div className="ep-total-row ep-total-row--muted"><span>Contingency ({contingency}%)</span><span>+ {f(summary.contingencyAmount)}</span></div>
                          <div className="ep-total-divider"/>
                          <div className="ep-total-row ep-total-row--final"><span>Final Total</span><span>{f(summary.finalTotal)}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ MODAL: NEW CATEGORY ══ */}
      {showNewCat && (
        <div className="ep-overlay" onClick={()=>{setShowNewCat(false);setNewCatName("");setCatQuery("");}}>
          <div className="ep-modal" onClick={e=>e.stopPropagation()}>
            <div className="ep-modal__head">
              <div className="ep-modal__title"><Tag size={16}/> New Category</div>
              <button className="ep-modal__close" onClick={()=>{setShowNewCat(false);setNewCatName("");setCatQuery("");}}>
                <X size={17}/>
              </button>
            </div>
            <div className="ep-modal__body">
              <div className="ep-field">
                <label>Category Name *</label>
                <input
                  className="ep-input"
                  placeholder="e.g. Cast & Talent, Equipment, Custom name…"
                  value={newCatName}
                  onChange={e=>setNewCatName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleCreateCategory()}
                  autoFocus
                />
              </div>
              <div className="ep-field">
                <label>Or pick a preset</label>
                <input className="ep-input ep-input--sm" placeholder="Filter presets…" value={catQuery} onChange={e=>setCatQuery(e.target.value)}/>
                <div className="ep-preset-chips">
                  {filteredPresets.slice(0,12).map(c=>(
                    <button key={c} className={`ep-preset-chip ${newCatName===c?"ep-preset-chip--active":""}`} onClick={()=>setNewCatName(c)}>{c}</button>
                  ))}
                  {filteredPresets.length===0 && <span className="ep-no-presets">No matching presets — use your custom name above</span>}
                </div>
              </div>
              <p className="ep-modal__hint">After creating the category, you'll be prompted to add the first line item.</p>
            </div>
            <div className="ep-modal__foot">
              <button className="ep-btn ep-btn--ghost" onClick={()=>{setShowNewCat(false);setNewCatName("");setCatQuery("");}}>Cancel</button>
              <button className="ep-btn ep-btn--primary" onClick={handleCreateCategory} disabled={!newCatName.trim()}>
                <Check size={14}/> Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: ADD / EDIT ITEM ══ */}
      {itemModal && (
        <div className="ep-overlay" onClick={()=>setItemModal(null)}>
          <div className="ep-modal ep-modal--wide" onClick={e=>e.stopPropagation()}>
            <div className="ep-modal__head">
              <div className="ep-modal__title">
                <FileText size={16}/>
                {itemModal.editing?"Edit Item":"Add Item"}&nbsp;
                <span className="ep-modal__cat-tag">{itemModal.category}</span>
              </div>
              <button className="ep-modal__close" onClick={()=>setItemModal(null)}><X size={17}/></button>
            </div>
            <div className="ep-modal__body">
              <div className="ep-field">
                <label>Item Name *</label>
                <input
                  className="ep-input"
                  placeholder="e.g. Director of Photography, Location Scout…"
                  value={itemForm.itemName}
                  onChange={e=>setItemForm({...itemForm,itemName:e.target.value})}
                  autoFocus
                />
              </div>
              <div className="ep-field-row-3">
                {([
                  {key:"preProduction" as const, label:"Pre-Production", cls:"pre"},
                  {key:"production"    as const, label:"Production",     cls:"prod"},
                  {key:"postProduction"as const, label:"Post-Production",cls:"post"},
                ]).map(({key,label,cls})=>(
                  <div className="ep-field" key={key}>
                    <label className={`ep-phase-label ep-phase-label--${cls}`}>{label}</label>
                    <div className="ep-amount-wrap">
                      <span className="ep-amount-cur">{currency}</span>
                      <input type="number" min={0} className="ep-input ep-input--mono"
                        value={itemForm[key]} onChange={e=>setItemForm({...itemForm,[key]:Number(e.target.value)})}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ep-field">
                <label>Notes <span className="ep-optional">(optional)</span></label>
                <textarea className="ep-input ep-input--ta" placeholder="Any additional notes…" rows={2}
                  value={itemForm.notes} onChange={e=>setItemForm({...itemForm,notes:e.target.value})}/>
              </div>
              <div className="ep-total-preview">
                <span>Calculated Total</span>
                <div className="ep-total-preview__val">{fmtMoney(itemFormTotal, currency)}</div>
              </div>
            </div>
            <div className="ep-modal__foot">
              <button className="ep-btn ep-btn--ghost" onClick={()=>setItemModal(null)}>Cancel</button>
              <button className="ep-btn ep-btn--primary" onClick={handleItemSubmit} disabled={itemSubmitting}>
                {itemSubmitting?<Loader2 size={14} className="spin"/>:<Check size={14}/>}
                {itemModal.editing?"Save Changes":"Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({label,value,icon,color,large}:{label:string;value:string;icon:React.ReactNode;color:string;large?:boolean}) {
  return (
    <div className={`ep-stat ep-stat--${color} ${large?"ep-stat--large":""}`}>
      <div className="ep-stat__icon">{icon}</div>
      <div>
        <p className="ep-stat__lbl">{label}</p>
        <p className="ep-stat__val">{value}</p>
      </div>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.expense-page {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: linear-gradient(135deg, #f0f9ff 0%, #fafafa 40%, #f0fdf4 100%);
  min-height: 100vh;
  color: #0f172a;
  padding: 32px 40px;
  max-width: 1280px;
  margin: 0 auto;
}

/* ── Header ── */
.ep-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
}
.ep-header__left { display: flex; align-items: center; gap: 14px; }
.ep-header__icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  display: flex; align-items: center; justify-content: center;
  color: #fff; box-shadow: 0 4px 12px rgba(14,165,233,.3);
}
.ep-header__eyebrow { font-size: 11px; font-weight: 700; color: #0ea5e9; text-transform: uppercase; letter-spacing: .1em; margin: 0; }
.ep-header__title   { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
.ep-header__right   { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* ── Project selector ── */
.ep-proj-selector { display: flex; align-items: center; gap: 8px; }
.ep-proj-selector__lbl { font-size: 12px; font-weight: 700; color: #64748b; white-space: nowrap; }
.ep-proj-selector__loading { font-size: 13px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
.ep-proj-select {
  height: 40px; border: 1.5px solid #cbd5e1; border-radius: 10px;
  padding: 0 12px; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600; background: #fff; color: #0f172a;
  min-width: 220px; outline: none; cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.ep-proj-select:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,.15); }

/* ── Currency bar ── */
.ep-currency-bar {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #64748b; font-weight: 500;
  background: #f0f9ff; border: 1px solid #bae6fd;
  border-radius: 8px; padding: 8px 14px; margin-bottom: 20px;
}
.ep-currency-bar strong { color: #0284c7; }

/* ── Empty state ── */
.ep-empty-state {
  background: #fff; border: 2px dashed #e2e8f0; border-radius: 16px;
  padding: 72px 32px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.ep-empty-state--sm { padding: 48px 32px; }
.ep-empty-state__icon { color: #94a3b8; margin-bottom: 6px; }
.ep-empty-state h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
.ep-empty-state p  { font-size: 14px; color: #64748b; margin: 0; max-width: 400px; }

/* ── Stats ── */
.ep-stats {
  display: grid; grid-template-columns: repeat(6,1fr);
  gap: 12px; margin-bottom: 24px;
}
.ep-stat {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px;
  padding: 14px 16px; display: flex; align-items: center; gap: 10px;
  transition: box-shadow .15s;
}
.ep-stat:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
.ep-stat--large { border-width: 2px; }
.ep-stat__icon { flex-shrink: 0; opacity: .7; }
.ep-stat__lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin: 0 0 2px; }
.ep-stat__val { font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 600; color: #0f172a; margin: 0; }

.ep-stat--sky    { border-color: #bae6fd; }  .ep-stat--sky .ep-stat__icon { color: #0ea5e9; }
.ep-stat--violet { border-color: #ddd6fe; }  .ep-stat--violet .ep-stat__icon { color: #7c3aed; }
.ep-stat--emerald{ border-color: #a7f3d0; background: #f0fdf4; } .ep-stat--emerald .ep-stat__icon { color: #059669; } .ep-stat--emerald .ep-stat__val { color: #059669; }
.ep-stat--amber  { border-color: #fde68a; }  .ep-stat--amber .ep-stat__icon { color: #d97706; }
.ep-stat--orange { border-color: #fed7aa; }  .ep-stat--orange .ep-stat__icon { color: #ea580c; }
.ep-stat--rose   { border-color: #fecdd3; }  .ep-stat--rose .ep-stat__icon { color: #e11d48; }

/* ── Load / error ── */
.ep-load-box { display: flex; align-items: center; gap: 10px; padding: 32px; justify-content: center; color: #94a3b8; font-size: 14px; }
.ep-err-box  { display: flex; align-items: center; gap: 8px; padding: 16px 20px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; color: #e11d48; font-size: 13px; margin-bottom: 16px; }

/* ── Category card ── */
.ep-cat-card {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
  margin-bottom: 12px; overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
  transition: box-shadow .15s;
}
.ep-cat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.07); }
.ep-cat-card__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; cursor: pointer; gap: 12px;
  border-bottom: 1px solid transparent; transition: background .12s; flex-wrap: wrap;
}
.ep-cat-card__header:hover { background: #f8fafc; }
.ep-cat-card__header-left { display: flex; align-items: center; gap: 10px; }
.ep-cat-card__chevron { color: #94a3b8; flex-shrink: 0; }
.ep-cat-card__name   { font-size: 15px; font-weight: 800; color: #0f172a; }
.ep-cat-card__count  { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
.ep-cat-card__header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ep-cat-total { font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 700; color: #059669; background: #f0fdf4; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 8px; }

.ep-phase-pill { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
.ep-phase-pill--pre  { color: #7c3aed; background: #f5f3ff; border: 1px solid #ddd6fe; }
.ep-phase-pill--prod { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; }
.ep-phase-pill--post { color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; }

.ep-cat-card__body { border-top: 1px solid #f1f5f9; }
.ep-cat-empty { display: flex; align-items: center; gap: 8px; padding: 18px 24px; font-size: 13px; color: #94a3b8; font-style: italic; }
.ep-inline-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #0ea5e9; background: none; border: none; cursor: pointer; padding: 0 4px; font-family: inherit; transition: color .15s; }
.ep-inline-btn:hover { color: #0284c7; }

.ep-items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.ep-items-table thead th { padding: 10px 16px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.ep-items-table th.r, .ep-items-table td.r { text-align: right; }
.ep-items-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background .1s; }
.ep-items-table tbody tr:hover { background: #f8fafc; }
.ep-items-table tbody td { padding: 10px 16px; }
.ep-item-name  { font-weight: 600; color: #0f172a; }
.ep-c-pre      { font-family: 'IBM Plex Mono', monospace; color: #7c3aed; }
.ep-c-prod     { font-family: 'IBM Plex Mono', monospace; color: #d97706; }
.ep-c-post     { font-family: 'IBM Plex Mono', monospace; color: #059669; }
.ep-item-total { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #0f172a; }
.ep-notes      { font-size: 12px; color: #94a3b8; font-style: italic; max-width: 200px; }
.ep-row-actions { display: flex; gap: 4px; justify-content: flex-end; }
.ep-items-table tfoot td { padding: 10px 16px; background: #f8fafc; border-top: 1.5px solid #e2e8f0; }
.ep-foot-lbl   { font-size: 12px; font-weight: 700; color: #475569; }
.ep-foot-num   { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; color: #475569; }
.ep-foot-total { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 800; color: #059669; }

/* ── Summary ── */
.ep-summary-section { margin-top: 20px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.ep-summary-toggle { width: 100%; display: flex; align-items: center; gap: 8px; padding: 16px 20px; font-size: 14px; font-weight: 700; color: #0f172a; background: none; border: none; cursor: pointer; font-family: inherit; transition: background .12s; }
.ep-summary-toggle:hover { background: #f8fafc; }
.ep-summary-body { border-top: 1px solid #f1f5f9; padding: 20px; }
.ep-summary-controls { display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
.ep-rate-ctrl { flex: 1; min-width: 200px; }
.ep-rate-ctrl label { font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 8px; }
.ep-rate-ctrl strong { color: #0ea5e9; }
.ep-slider { width: 100%; -webkit-appearance: none; height: 4px; background: #e2e8f0; border-radius: 2px; outline: none; }
.ep-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #0ea5e9; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.2); }
.ep-summary-content { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
.ep-sum-cats { display: flex; flex-direction: column; gap: 10px; }
.ep-sum-cat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
.ep-sum-cat__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; }
.ep-sum-cat__head-right { display: flex; align-items: center; gap: 8px; }
.ep-sum-cat__total { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #059669; font-size: 14px; }
.ep-cat-badge { font-size: 12px; font-weight: 700; color: #0f172a; background: #e2e8f0; padding: 3px 10px; border-radius: 20px; }
.ep-sum-phases { display: flex; gap: 6px; margin-bottom: 10px; }
.ep-sum-phase { flex: 1; text-align: center; padding: 6px 4px; border-radius: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; }
.ep-sum-phase span { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; font-family: 'Plus Jakarta Sans', sans-serif; }
.ep-sum-phase--pre  { background: #f5f3ff; color: #7c3aed; } .ep-sum-phase--pre span { color: #7c3aed; }
.ep-sum-phase--prod { background: #fffbeb; color: #d97706; } .ep-sum-phase--prod span { color: #d97706; }
.ep-sum-phase--post { background: #ecfdf5; color: #059669; } .ep-sum-phase--post span { color: #059669; }
.ep-sum-items { display: flex; flex-direction: column; gap: 3px; }
.ep-sum-item { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; padding: 3px 0; border-bottom: 1px solid #e2e8f0; }
.ep-sum-item:last-child { border-bottom: none; }
.ep-grand-totals { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; align-self: start; position: sticky; top: 20px; }
.ep-grand-totals h3 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
.ep-cur-tag { font-size: 11px; font-weight: 700; color: #0ea5e9; background: #f0f9ff; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 20px; font-family: 'IBM Plex Mono', monospace; }
.ep-total-rows { display: flex; flex-direction: column; }
.ep-total-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
.ep-total-row:last-child { border-bottom: none; }
.ep-total-row--muted { font-size: 13px; color: #94a3b8; }
.ep-total-row--final { font-size: 18px; font-weight: 800; color: #059669; font-family: 'IBM Plex Mono', monospace; }
.ep-total-divider { height: 1.5px; background: #e2e8f0; margin: 6px 0; }

/* ── Buttons ── */
.ep-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 9px; font-size: 13px; font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
  border: none; transition: all .15s; white-space: nowrap;
}
.ep-btn:disabled { opacity: .5; cursor: not-allowed; }
.ep-btn--primary { background: linear-gradient(135deg,#0ea5e9,#0284c7); color: #fff; box-shadow: 0 2px 8px rgba(14,165,233,.3); }
.ep-btn--primary:hover:not(:disabled) { background: linear-gradient(135deg,#0284c7,#0369a1); }
.ep-btn--sky     { background: #f0f9ff; color: #0284c7; border: 1.5px solid #bae6fd; }
.ep-btn--sky:hover:not(:disabled) { background: #e0f2fe; }
.ep-btn--outline { background: #fff; color: #0ea5e9; border: 1.5px solid #bae6fd; }
.ep-btn--outline:hover:not(:disabled) { background: #f0f9ff; }
.ep-btn--export  { background: #fffbeb; color: #d97706; border: 1.5px solid #fde68a; }
.ep-btn--export:hover:not(:disabled) { background: #fef3c7; }
.ep-btn--full-export { background: linear-gradient(135deg,#7c3aed,#6d28d9); color: #fff; box-shadow: 0 2px 8px rgba(124,58,237,.3); }
.ep-btn--full-export:hover:not(:disabled) { background: linear-gradient(135deg,#6d28d9,#5b21b6); box-shadow: 0 4px 12px rgba(124,58,237,.4); }
.ep-btn--ghost   { background: transparent; color: #64748b; border: 1.5px solid #e2e8f0; }
.ep-btn--ghost:hover:not(:disabled)  { background: #f8fafc; color: #0f172a; }
.ep-btn--sm  { padding: 6px 12px; font-size: 12px; border-radius: 7px; }
.ep-btn--xs  { padding: 4px 9px;  font-size: 11px; border-radius: 6px; }
.ep-btn--lg  { padding: 11px 20px; font-size: 14px; }

.ep-icon-btn { width: 30px; height: 30px; border-radius: 7px; border: 1.5px solid #e2e8f0; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; transition: all .15s; }
.ep-icon-btn--edit:hover   { color: #0ea5e9; border-color: #bae6fd; background: #f0f9ff; }
.ep-icon-btn--danger:hover { color: #e11d48; border-color: #fecdd3; background: #fff1f2; }

/* ── Modal ── */
.ep-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); animation: epFadeIn .15s ease; }
.ep-modal { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; width: 480px; max-width: calc(100vw - 32px); max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(15,23,42,.15); animation: epSlideUp .18s ease; }
.ep-modal--wide { width: 560px; }
.ep-modal__head { display: flex; justify-content: space-between; align-items: center; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
.ep-modal__title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; color: #0f172a; }
.ep-modal__cat-tag { font-size: 12px; font-weight: 700; color: #0ea5e9; background: #f0f9ff; border: 1px solid #bae6fd; padding: 2px 10px; border-radius: 20px; }
.ep-modal__close { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; transition: color .15s; }
.ep-modal__close:hover { color: #0f172a; }
.ep-modal__body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
.ep-modal__foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 22px; border-top: 1px solid #f1f5f9; }
.ep-modal__hint { font-size: 12px; color: #94a3b8; font-style: italic; }

/* ── Form ── */
.ep-field { display: flex; flex-direction: column; gap: 6px; }
.ep-field label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
.ep-optional { font-size: 10px; color: #94a3b8; text-transform: none; letter-spacing: 0; font-weight: 400; }
.ep-field-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.ep-input { width: 100%; box-sizing: border-box; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 9px; color: #0f172a; padding: 10px 12px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; transition: border-color .15s, box-shadow .15s; }
.ep-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 3px rgba(14,165,233,.12); }
.ep-input--sm   { padding: 8px 11px; font-size: 12px; }
.ep-input--mono { font-family: 'IBM Plex Mono', monospace; }
.ep-input--ta   { resize: vertical; }
.ep-amount-wrap { position: relative; display: flex; align-items: center; }
.ep-amount-cur  { position: absolute; left: 10px; font-size: 10px; font-weight: 700; color: #94a3b8; font-family: 'IBM Plex Mono', monospace; pointer-events: none; white-space: nowrap; }
.ep-amount-wrap .ep-input { padding-left: 40px; }
.ep-phase-label        { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.ep-phase-label--pre   { color: #7c3aed; }
.ep-phase-label--prod  { color: #d97706; }
.ep-phase-label--post  { color: #059669; }
.ep-total-preview { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 10px; font-size: 13px; font-weight: 600; color: #059669; }
.ep-total-preview__val { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 800; color: #059669; }

/* ── Preset chips ── */
.ep-preset-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.ep-preset-chip { font-size: 12px; font-weight: 600; color: #475569; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 4px 12px; cursor: pointer; font-family: inherit; transition: all .12s; }
.ep-preset-chip:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
.ep-preset-chip--active { border-color: #0ea5e9; color: #0284c7; background: #f0f9ff; }
.ep-no-presets { font-size: 12px; color: #94a3b8; font-style: italic; }

/* ── Toast ── */
.ep-toast { position: fixed; bottom: 24px; right: 24px; z-index: 200; display: flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; animation: epSlideUp .2s ease; box-shadow: 0 8px 24px rgba(0,0,0,.12); }
.ep-toast--ok  { background: #f0fdf4; border: 1.5px solid #a7f3d0; color: #059669; }
.ep-toast--err { background: #fff1f2; border: 1.5px solid #fecdd3; color: #e11d48; }

/* ── Animations ── */
.spin { animation: epSpin 1s linear infinite; }
@keyframes epSpin    { to { transform: rotate(360deg); } }
@keyframes epFadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes epSlideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

@media (max-width: 1024px) {
  .ep-stats { grid-template-columns: repeat(3,1fr); }
  .ep-summary-content { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .expense-page { padding: 16px; }
  .ep-stats { grid-template-columns: 1fr 1fr; }
  .ep-field-row-3 { grid-template-columns: 1fr; }
  .ep-header { flex-direction: column; align-items: flex-start; }
  .ep-cat-card__header { flex-direction: column; align-items: flex-start; }
  .ep-cat-card__header-right { flex-wrap: wrap; }
  .ep-phase-pill { display: none; }
}
`;