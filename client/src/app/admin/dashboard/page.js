'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { io } from 'socket.io-client';
import { 
  FileText, IndianRupee, Clock, CheckCircle, 
  Layers, BellRing, Filter, ShieldCheck, Download,
  ExternalLink
} from 'lucide-react';

export default function AdminDashboard() {
  const { api, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PAID, PRINTING, READY, COMPLETED
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const fetchAdminQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/admin/queue');
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error(err);
      setError('Unable to load operational print queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminQueue();
  }, []);

  // Socket.io Dynamic Real-time sync for admin
  useEffect(() => {
    const socket = io(`http://${window.location.hostname}:5000`);

    socket.on('connect', () => {
      console.log('[Socket.io] Admin channel listening active:', socket.id);
      socket.emit('join_admin');
    });

    // Auto-sync incoming paid orders
    socket.on('new_order_received', (newOrder) => {
      console.log('[Socket.io] Admin received new order entry:', newOrder);
      
      // Flash Alert and Prepend to order lists
      setNewOrderAlert(newOrder);
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      
      // Auto dismiss alert after 5s
      setTimeout(() => setNewOrderAlert(null), 5000);
    });

    // Synchronize updates triggered by other admins if any
    socket.on('admin_order_updated', (data) => {
      console.log('[Socket.io] Admin synchronized order update:', data);
      setOrders(prev => prev.map(o => o.id === data.orderId ? data.order : o));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update Status Callback
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      
      // Update local state details
      setOrders(prev => prev.map(o => o.id === orderId ? response.data.order : o));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to modify order status.');
    }
  };

  // Metric computations (limited to PAID/processed transactions)
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  
  const todayRevenue = paidOrders.reduce((sum, o) => sum + o.totalCost, 0);
  
  const activeQueuesCount = paidOrders.filter(o => o.orderStatus === 'PRINTING').length;
  
  const readyForPickupCount = paidOrders.filter(o => o.orderStatus === 'READY').length;
  
  const completedTodayCount = paidOrders.filter(o => o.orderStatus === 'COMPLETED').length;

  // Filters application
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'ALL') return true;
    return order.orderStatus.toUpperCase() === filterStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950/20 relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 animate-slide-up">
        
        {/* Header Console */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              Print Operations Deck
            </h1>
            <p className="text-slate-400 text-sm mt-1">Central printing queue controller, dynamic revenue logs, and status triggers.</p>
          </div>

          <button
            onClick={fetchAdminQueue}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 font-bold border border-slate-800 hover:border-cyan-500/25 rounded-xl transition-all cursor-pointer text-xs"
          >
            Force Sync Queue
          </button>
        </div>

        {/* Real-time Toast Alert */}
        {newOrderAlert && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-400 text-xs flex items-center justify-between gap-2.5 animate-pulse shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 animate-bounce" />
              <span>
                <strong>Incoming Printout!</strong> Customer <strong>{newOrderAlert.user?.name}</strong> just paid <strong>₹{newOrderAlert.totalCost}</strong> for <strong>{newOrderAlert.totalPages} pages</strong>.
              </span>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase px-2 py-1 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{todayRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backlog Printing</p>
              <h3 className="text-3xl font-black text-indigo-400 mt-2">{activeQueuesCount}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ready counter</p>
              <h3 className="text-3xl font-black text-cyan-400 mt-2">{readyForPickupCount}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Today</p>
              <h3 className="text-3xl font-black text-slate-100 mt-2">{completedTodayCount}</h3>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

        </div>

        {/* Central Printing Table Queue */}
        <div className="glass-card rounded-2xl p-6">
          
          {/* Header & filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Store Print Queues
            </h2>

            {/* Filter Pill Row */}
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
              {['ALL', 'PAID', 'PRINTING', 'READY', 'COMPLETED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer capitalize ${
                    filterStatus === status
                      ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                      : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {status === 'PAID' ? 'New Paid' : status.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm">Synchronizing queue lists...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No orders matches the selected filter status tag.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="pb-3 pl-4">Customer</th>
                    <th className="pb-3">Uploaded Documents</th>
                    <th className="pb-3">Configurations</th>
                    <th className="pb-3">Invoice Details</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Order Status</th>
                    <th className="pb-3 pr-4 text-right">Queue Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                  {filteredOrders.map(order => {
                    const config = JSON.parse(order.configOptions || "{}");
                    return (
                      <tr key={order.id} className="hover:bg-slate-950/25 transition-colors">
                        
                        {/* Customer profile */}
                        <td className="py-4 pl-4">
                          <p className="font-bold text-slate-200">{order.user?.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{order.user?.registrationNumber}</p>
                          <p className="text-[9px] text-slate-500 mt-1">ID: {order.id.split('-')[0].toUpperCase()}...</p>
                        </td>

                        {/* Documents details with S3 downloader links */}
                        <td className="py-4">
                          <div className="space-y-1.5 max-w-[200px]">
                            {order.documents?.map((doc, idx) => (
                              <a
                                key={doc.id}
                                href={`http://localhost:5000/uploads/${doc.fileUrl.split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-semibold group"
                                title="Open or Download Uploaded Document"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[130px] underline">{doc.originalName}</span>
                              </a>
                            ))}
                          </div>
                        </td>

                        {/* Print configurations */}
                        <td className="py-4">
                          <span className="text-slate-300 font-bold block capitalize">
                            {config.paperSize} Size • {config.printType === 'COLOR' ? 'Color' : 'B&W'}
                          </span>
                          <span className="text-[10px] text-slate-500 block capitalize">
                            {config.sides === 'double' ? 'Double' : 'Single'} • {config.binding !== 'NONE' ? config.binding : 'No Binding'}
                          </span>
                          <span className="text-[10px] font-semibold text-cyan-400 block mt-1">
                            {config.copies} copy / copies
                          </span>
                        </td>

                        {/* Cost & page counts */}
                        <td className="py-4">
                          <span className="font-bold text-slate-300 block">{order.totalPages} pages</span>
                          <span className="text-sm font-black text-emerald-400 block">₹{order.totalCost}</span>
                        </td>

                        <td className="py-4">
                          {order.paymentStatus === 'PAID' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                PAID
                              </span>
                              {order.transactions?.[0]?.gatewayTransactionId && (
                                <a
                                  href={`http://localhost:5000/uploads/${order.transactions[0].gatewayTransactionId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-[10px] text-cyan-400 hover:text-cyan-300 underline font-bold mt-1"
                                >
                                  View Screenshot
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              UNPAID
                            </span>
                          )}
                        </td>

                        {/* Order status badge */}
                        <td className="py-4">
                          {order.paymentStatus === 'PENDING' ? (
                            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Unpaid</span>
                          ) : order.orderStatus === 'PAID' ? (
                            <span className="text-xs text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 px-2 py-0.5 rounded font-semibold">Incoming</span>
                          ) : order.orderStatus === 'PRINTING' ? (
                            <span className="text-xs text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 px-2 py-0.5 rounded font-semibold animate-pulse">Printing</span>
                          ) : order.orderStatus === 'READY' ? (
                            <span className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/35 px-2 py-0.5 rounded font-bold">Ready</span>
                          ) : (
                            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">Completed</span>
                          )}
                        </td>

                        {/* Action operations dropdown selection */}
                        <td className="py-4 pr-4 text-right">
                          {order.paymentStatus === 'PAID' ? (
                            <div className="inline-block text-left">
                              <select
                                value={order.orderStatus}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-emerald-500 font-bold transition-all cursor-pointer hover:border-slate-700"
                              >
                                <option value="PAID">📥 Incoming Job</option>
                                <option value="PRINTING">🖨️ Start Printing</option>
                                <option value="READY">📦 Set Ready for Pickup</option>
                                <option value="COMPLETED">✅ Mark Completed</option>
                              </select>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 font-semibold italic">Unpaid queue locked</span>
                          )}
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
    </div>
  );
}
