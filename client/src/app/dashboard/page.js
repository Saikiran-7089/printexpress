'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  FileText, Plus, ShoppingBag, Clock, CheckCircle, 
  IndianRupee, ArrowRight, Eye, FileDown, AlertCircle,
  Settings, X, ShieldCheck, HelpCircle
} from 'lucide-react';

export default function UserDashboard() {
  const { api, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [shopQueueCount, setShopQueueCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState('');

  // Edit Specifications Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editPaperSize, setEditPaperSize] = useState('A4');
  const [editPrintType, setEditPrintType] = useState('BW');
  const [editSides, setEditSides] = useState('single');
  const [editBinding, setEditBinding] = useState('NONE');
  const [editCopies, setEditCopies] = useState(1);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editError, setEditError] = useState('');

  const handleOpenEditModal = (order) => {
    const config = JSON.parse(order.configOptions || "{}");
    setEditingOrder(order);
    setEditPaperSize(config.paperSize || 'A4');
    setEditPrintType(config.printType || 'BW');
    setEditSides(config.sides || 'single');
    setEditBinding(config.binding || 'NONE');
    setEditCopies(config.copies || 1);
    setEditError('');
    setShowEditModal(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingConfig(true);
    setEditError('');

    try {
      const response = await api.patch(`/orders/${editingOrder.id}/config`, {
        paperSize: editPaperSize,
        printType: editPrintType,
        sides: editSides,
        binding: editBinding,
        copies: editCopies
      });

      // Update the order in local state list
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? response.data.order : o));
      setShowEditModal(false);
      setEditingOrder(null);
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.error || 'Failed to update order specifications.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Local live cost preview calculator
  const getLivePreviewTotal = () => {
    if (!editingOrder) return 0;
    const originalConfig = JSON.parse(editingOrder.configOptions || "{}");
    const originalCopies = originalConfig.copies || 1;
    const basePages = Math.round(editingOrder.totalPages / originalCopies) || 1;

    const baseRates = editPrintType === 'COLOR' 
      ? { single: 10.0, double: 20.0 }
      : { single: 2.0, double: 4.0 };
    let multiplier = editPaperSize === 'A3' ? 2.0 : (editPaperSize === 'LEGAL' ? 1.5 : 1.0);
    let bindingCost = editBinding === 'STAPLED' ? 5.0 : (editBinding === 'SPIRAL' ? 30.0 : 0.0);
    let emergencyCost = originalConfig.isEmergency ? basePages * 1.0 * editCopies : 0.0;
    
    let printingCost = 0;
    if (editSides === 'double') {
      printingCost = (Math.floor(basePages / 2) * baseRates.double + (basePages % 2) * baseRates.single) * multiplier;
    } else {
      printingCost = basePages * baseRates.single * multiplier;
    }
    const subtotal = (printingCost + bindingCost) * editCopies + emergencyCost;
    const gst = subtotal * 0.18;
    return Math.round((subtotal + gst) * 100) / 100;
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.orders || []);
      setShopQueueCount(response.data.shopQueueCount || 0);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to retrieve printing queue history.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDownloadInvoice = (order) => {
    const config = JSON.parse(order.configOptions || "{}");
    const txId = order.transactions?.[0]?.gatewayTransactionId || 'pay_ref_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const orderIdShort = order.id.split('-')[0].toUpperCase();
    const dateFormatted = new Date(order.createdAt).toLocaleDateString(undefined, { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print the invoice.');
      return;
    }

    const originalCopies = config.copies || 1;
    const basePages = Math.round(order.totalPages / originalCopies) || 1;
    const isColor = config.printType === 'COLOR';
    const baseRates = isColor ? { single: 10.0, double: 20.0 } : { single: 2.0, double: 4.0 };
    const sizeMultiplier = config.paperSize === 'A3' ? 2.0 : (config.paperSize === 'LEGAL' ? 1.5 : 1.0);
    const bindingCost = config.binding === 'STAPLED' ? 5.0 : (config.binding === 'SPIRAL' ? 30.0 : 0.0);
    const emergencyCost = config.isEmergency ? basePages * 1.0 * originalCopies : 0.0;
    
    let printingCost = 0;
    if (config.sides === 'double') {
      printingCost = (Math.floor(basePages / 2) * baseRates.double + (basePages % 2) * baseRates.single) * sizeMultiplier * originalCopies;
    } else {
      printingCost = basePages * baseRates.single * sizeMultiplier * originalCopies;
    }
    const totalBindingCost = bindingCost * originalCopies;
    const subtotal = printingCost + totalBindingCost + emergencyCost;
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;

    printWindow.document.write(`
      <html>
        <head>
          <title>PrintExpress Invoice - PE-${orderIdShort}</title>
          <style>
            body {
              font-family: 'Outfit', 'Inter', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 40px;
              margin: 0;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 40px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 30px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #0f172a;
              background: linear-gradient(135deg, #06b6d4, #10b981);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: 700;
              color: #64748b;
            }
            .info-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
            }
            .info-col h3 {
              font-size: 14px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin: 0 0 8px 0;
            }
            .info-col p {
              font-size: 15px;
              font-weight: 500;
              color: #334155;
              margin: 4px 0;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            .table th {
              background-color: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 12px;
              letter-spacing: 0.05em;
              padding: 12px 16px;
              text-align: left;
            }
            .table td {
              padding: 16px;
              border-bottom: 1px solid #f1f5f9;
              color: #334155;
              font-size: 14px;
            }
            .badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              background-color: #dcfce7;
              color: #15803d;
              border: 1px solid #bbf7d0;
            }
            .totals-box {
              width: 320px;
              margin-left: auto;
              margin-bottom: 40px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
              color: #475569;
            }
            .totals-row.grand-total {
              border-top: 2px solid #e2e8f0;
              padding-top: 16px;
              margin-top: 8px;
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .footer {
              text-align: center;
              border-top: 1px solid #f1f5f9;
              padding-top: 24px;
              font-size: 12px;
              color: #94a3b8;
              font-weight: 500;
            }
            .btn-print {
              display: block;
              width: 100%;
              max-width: 200px;
              margin: 30px auto 0 auto;
              padding: 12px 24px;
              background-color: #0f172a;
              color: #ffffff;
              font-weight: 700;
              text-align: center;
              border-radius: 12px;
              text-decoration: none;
              font-size: 14px;
              cursor: pointer;
              border: none;
              transition: background-color 0.2s;
            }
            .btn-print:hover {
              background-color: #1e293b;
            }
            @media print {
              .btn-print {
                display: none;
              }
              body {
                padding: 0;
              }
              .invoice-box {
                border: none;
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo">PrintExpress</div>
              <div class="invoice-title">RECEIPT INVOICE</div>
            </div>

            <div class="info-grid">
              <div class="info-col">
                <h3>Billed To</h3>
                <p><strong>Customer Name:</strong> ${user.name}</p>
                <p><strong>Registration ID:</strong> ${user.registrationNumber}</p>
              </div>
              <div class="info-col" style="text-align: right;">
                <h3>Invoice Details</h3>
                <p><strong>Invoice No:</strong> PE-${orderIdShort}</p>
                <p><strong>Transaction Ref:</strong> ${txId}</p>
                <p><strong>Payment Date:</strong> ${dateFormatted}</p>
                <p style="margin-top: 10px;"><span class="badge">Paid & Approved</span></p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Printout Description</th>
                  <th>Sizing & Sidedness</th>
                  <th>Pages</th>
                  <th>Binding</th>
                  <th style="text-align: right;">Qty</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>High-End Xerox Printing</strong><br />
                    <span style="color: #64748b; font-size: 12px;">Type: ${config.printType === 'COLOR' ? 'Color Premium' : 'Black & White Standard'}</span>
                  </td>
                  <td>${config.paperSize} Size • ${config.sides === 'double' ? 'Double-Sided' : 'Single-Sided'}</td>
                  <td>${basePages} pages</td>
                  <td>${config.binding !== 'NONE' ? config.binding : 'No Binding'}</td>
                  <td style="text-align: right;">${originalCopies}</td>
                  <td style="text-align: right;">₹${subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal</span>
                <span>₹${(subtotal - emergencyCost).toFixed(2)}</span>
              </div>
              ${config.isEmergency ? `
              <div class="totals-row">
                <span style="color: #ef4444;">Emergency Speed Fee</span>
                <span style="color: #ef4444;">+₹${emergencyCost.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="totals-row">
                <span>GST (18%)</span>
                <span>₹${gst.toFixed(2)}</span>
              </div>
              <div class="totals-row grand-total">
                <span>Total Paid</span>
                <span>₹${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              Thank you for printing with PrintExpress. For any support, please present this invoice.<br />
              &copy; ${new Date().getFullYear()} PRINTEXPRESS INC. GENERATED SECURELY VIA LOCAL SERVER.
            </div>

            <button class="btn-print" onclick="window.print()">Print or Save PDF</button>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Compute metrics from orders list
  const activeOrdersCount = orders.filter(o => o.orderStatus !== 'COMPLETED' && o.paymentStatus === 'PAID').length;
  const completedOrdersCount = orders.filter(o => o.orderStatus === 'COMPLETED').length;
  const pendingPaymentCount = orders.filter(o => o.paymentStatus === 'PENDING').length;
  
  const totalSpent = orders
    .filter(o => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalCost, 0);

  // Status Badge UI Helpers
  const getPaymentBadge = (status) => {
    if (status === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> PAID
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> PENDING
      </span>
    );
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (paymentStatus === 'PENDING') {
      return (
        <span className="text-xs text-slate-500 font-semibold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          Awaiting Payment
        </span>
      );
    }
    switch (status.toUpperCase()) {
      case 'PAID':
        return <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/5 px-2.5 py-1 rounded-lg border border-cyan-500/20">Pending Approval</span>;
      case 'PRINTING':
        return <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/20 animate-pulse">Printing</span>;
      case 'READY':
        return <span className="text-xs text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/35">Ready for Pickup</span>;
      case 'COMPLETED':
        return <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">Completed</span>;
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950/20 relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Banner Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-slide-up">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Welcome Back, <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{user?.name}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Configure and manage all your printouts and receipts in one secure station.</p>
          </div>

          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 transition-all cursor-pointer transform hover:scale-[1.01]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            Configure New Print
          </Link>
        </div>

        {/* Global Shop Queue Alert */}
        <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Current Shop Queue</p>
              <p className="text-xs text-slate-400">There are <span className="font-bold text-indigo-400">{shopQueueCount}</span> pending printout(s) ahead in the shop queue.</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 animate-slide-up">
          
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Printing</p>
              <h3 className="text-3xl font-black text-slate-100 mt-2">{activeOrdersCount}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting Payment</p>
              <h3 className="text-3xl font-black text-slate-100 mt-2">{pendingPaymentCount}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Printouts</p>
              <h3 className="text-3xl font-black text-slate-100 mt-2">{completedOrdersCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invested</p>
              <h3 className="text-3xl font-black text-slate-100 mt-2">₹{totalSpent.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-xl text-slate-950 font-black text-xl flex items-center justify-center w-12 h-12">
              ₹
            </div>
          </div>

        </div>

        {/* Central Orders Console */}
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Your Printouts History
            </h2>
            <button 
              onClick={fetchOrders}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Refresh Queue
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm">Querying print queue states...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-rose-500/80 mb-3" />
              <p className="text-rose-400 font-semibold">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State Layout */
            <div className="py-16 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-slate-500">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No printouts found</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6">Create and submit documents to our print queue to see them logged here.</p>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 font-bold border border-slate-800 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer text-sm"
              >
                Create Printout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Data Table Grid */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="pb-3 pl-4">Order ID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Options</th>
                    <th className="pb-3">Pages / Cost</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Order Status</th>
                    <th className="pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {orders.map((order) => {
                    const config = JSON.parse(order.configOptions || "{}");
                    return (
                      <tr key={order.id} className="hover:bg-slate-950/20 transition-colors group">
                        
                        {/* Order ID Link */}
                        <td className="py-4 pl-4 font-mono text-xs text-slate-400">
                          {order.id.split('-')[0].toUpperCase()}...
                        </td>

                        {/* Date field */}
                        <td className="py-4 text-slate-300">
                          {new Date(order.createdAt).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </td>

                        {/* Configurations summary */}
                        <td className="py-4">
                          <span className="text-slate-300 font-semibold block capitalize">
                            {config.paperSize} • {config.printType === 'COLOR' ? 'Color' : 'B&W'}
                          </span>
                          <span className="text-[10px] text-slate-500 block capitalize">
                            {config.sides === 'double' ? 'Double' : 'Single'} • {config.binding !== 'NONE' ? config.binding : 'No Binding'}
                          </span>
                        </td>

                        {/* Pages and Cost breakdown */}
                        <td className="py-4">
                          <span className="font-semibold text-slate-300 block">{order.totalPages} pages</span>
                          <span className="text-xs font-bold text-cyan-400 block">₹{order.totalCost}</span>
                        </td>

                        {/* Payment indicator tag */}
                        <td className="py-4">
                          {getPaymentBadge(order.paymentStatus)}
                        </td>

                        {/* Status tracker badge */}
                        <td className="py-4">
                          {getStatusBadge(order.orderStatus, order.paymentStatus)}
                        </td>

                        {/* Actions routes */}
                        <td className="py-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {order.paymentStatus === 'PENDING' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenEditModal(order)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg text-xs font-bold border border-slate-800 hover:border-cyan-500/25 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Settings className="w-3.5 h-3.5 text-cyan-400" /> Edit Specs
                                </button>
                                <Link
                                  href={`/dashboard/order/${order.id}`}
                                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-lg text-xs transition-all shadow-md shadow-amber-500/5 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                >
                                  <IndianRupee className="w-3.5 h-3.5" /> Pay Now
                                </Link>
                              </div>
                            ) : (
                              /* Standard Tracking stepper button */
                              <Link
                                href={`/dashboard/order/${order.id}`}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 rounded-lg text-xs font-bold border border-slate-800 hover:border-cyan-500/25 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Live Track
                              </Link>
                            )}
                            
                            {/* Simulated invoice receipts */}
                            {order.paymentStatus === 'PAID' && (
                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                title="Download Invoice Receipt"
                                className="p-1.5 hover:bg-slate-800/80 text-slate-500 hover:text-slate-200 rounded-lg border border-transparent hover:border-slate-800 transition-all cursor-pointer"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Dynamic Edit Specifications Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-2xl p-6 relative animate-slide-up">
            
            {/* Close button */}
            <button
              onClick={() => { setShowEditModal(false); setEditingOrder(null); }}
              disabled={savingConfig}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-900/60 rounded-lg text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Edit Print Specs</h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Modify specifications before checkout</p>
              </div>
            </div>

            {/* Error alerts */}
            {editError && (
              <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <strong>Error:</strong> {editError}
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Print Tone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Print Tone Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditPrintType('BW')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editPrintType === 'BW'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      B&W
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPrintType('COLOR')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editPrintType === 'COLOR'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Color
                    </button>
                  </div>
                </div>

                {/* Paper Size */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paper Size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['A4', 'A3', 'LEGAL'].map(size => (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setEditPaperSize(size)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          editPaperSize === size
                            ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                            : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sides */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sides Printing</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditSides('single')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editSides === 'single'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Single-Sided
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSides('double')}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editSides === 'double'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Double-Sided
                    </button>
                  </div>
                </div>

                {/* Binding */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Binding Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'NONE', label: 'None' },
                      { key: 'STAPLED', label: 'Staple' },
                      { key: 'SPIRAL', label: 'Spiral' }
                    ].map(opt => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setEditBinding(opt.key)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          editBinding === opt.key
                            ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                            : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Copies Counter */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Number of Copies</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditCopies(Math.max(1, editCopies - 1))}
                      className="w-9 h-9 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={editCopies}
                      onChange={(e) => setEditCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 bg-slate-950/80 border border-slate-800 rounded-xl py-1.5 text-center text-slate-100 focus:outline-none focus:border-cyan-500 font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setEditCopies(editCopies + 1)}
                      className="w-9 h-9 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Recalculated Live Total preview bar */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex justify-between items-center mt-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recalculated Grand Total</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Includes GST (18%) and sizing surcharges</p>
                </div>
                <h4 className="text-xl font-extrabold text-cyan-400">₹{getLivePreviewTotal().toFixed(2)}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  disabled={savingConfig}
                  onClick={() => { setShowEditModal(false); setEditingOrder(null); }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3 px-4 rounded-xl border border-slate-800 transition-colors cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 transition-all text-xs"
                >
                  {savingConfig ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  ) : (
                    <span>Save Specifications</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
