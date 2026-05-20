'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, BACKEND_URL } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { 
  FileText, Check, Clock, Printer, ShoppingBag, 
  MapPin, CheckCircle, ArrowLeft, IndianRupee, BellRing
} from 'lucide-react';

export default function OrderTrackingStepper() {
  const { api, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdateAlert, setLastUpdateAlert] = useState(false);

  // Define the workflow sequence steps
  const STEPS = [
    { key: 'PAID', label: 'Paid / Pending Approval', desc: 'Transaction authorized. Awaiting queue manager confirmation.', icon: ShoppingBag },
    { key: 'PRINTING', label: 'Printing in Progress', desc: 'Documents sent to high-speed Xerox station.', icon: Printer },
    { key: 'READY', label: 'Ready for Pickup', desc: 'Prints processed and packaged at pickup counter.', icon: MapPin },
    { key: 'COMPLETED', label: 'Completed', desc: 'Documents collected and transaction closed.', icon: CheckCircle }
  ];

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my-orders');
      const found = response.data.orders.find(o => o.id === orderId);
      
      if (!found) {
        setError('Printout details could not be found.');
      } else {
        setOrder(found);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to fetch printout specifications.');
    } finally {
      setLoading(false);
    }
  };

  const [paying, setPaying] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!order) return;
    if (!screenshotFile) {
      alert('Please upload your payment confirmation receipt screenshot before proceeding.');
      return;
    }

    setPaying(true);
    try {
      // Small simulated delay for gateway animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const formData = new FormData();
      formData.append('screenshot', screenshotFile);

      const response = await api.post(`/orders/${order.id}/pay`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update local state with the returned paid order
      setOrder(response.data.order);
      setLastUpdateAlert(true);
      setTimeout(() => setLastUpdateAlert(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Receipt verification failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Socket.io Real-Time connection management
  useEffect(() => {
    if (!orderId) return;

    // Establish WebSocket socket client
    const socket = io(BACKEND_URL.replace('/api', ''));

    socket.on('connect', () => {
      console.log(`[Socket.io] Connected to PrintExpress stream: ${socket.id}`);
      setSocketConnected(true);
      
      // Join targeted channels
      socket.emit('join_order', orderId);
    });

    // Listen for order status updates
    socket.on('order_status_updated', (data) => {
      console.log('[Socket.io] Order status shift broadcast received:', data);
      if (data.orderId === orderId) {
        setOrder(data.order);
        
        // Trigger visual flash notification helper
        setLastUpdateAlert(true);
        setTimeout(() => setLastUpdateAlert(false), 3000);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected from status stream.');
      setSocketConnected(false);
    });

    // Clean up connections on unmount
    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950/20">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-sm">Accessing live tracking node...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950/20">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center max-w-sm">
            <h3 className="text-rose-400 font-bold text-lg mb-2">Tracking Error</h3>
            <p className="text-slate-400 text-sm mb-5">{error || 'Order tracking session could not be established.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const config = JSON.parse(order.configOptions || "{}");
  
  // Calculate active index matching status
  const currentStepIndex = STEPS.findIndex(s => s.key === order.orderStatus.toUpperCase());

  return (
    <div className="min-h-screen flex flex-col bg-slate-950/20 relative">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Navigation Head */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
 
          {/* Connection Status tag */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {socketConnected ? 'Live Connection Active' : 'Connecting Stream...'}
            </span>
          </div>
        </div>

        {/* Real-time Toast Flash */}
        {lastUpdateAlert && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2.5 animate-bounce shadow-lg shadow-emerald-500/5">
            <BellRing className="w-4.5 h-4.5 animate-pulse text-emerald-400" />
            <span className="font-semibold">Live update!</span>
            <span>Your printout status was modified to: <strong className="uppercase">{order.orderStatus}</strong></span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Stepper Progression */}
          <div className="md:col-span-8 space-y-6 animate-slide-up">
            
            {/* Visual Stepper Card */}
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-100 mb-8 flex items-center gap-2">
                Live Order Process Tracker
              </h2>

              {/* Vertical timeline steps */}
              <div className="relative space-y-12">
                
                {/* Visual Line connector overlay */}
                <div className="absolute left-6.5 top-2.5 bottom-2.5 w-0.5 bg-slate-800 pointer-events-none z-0"></div>
                <div 
                  className="absolute left-6.5 top-2.5 w-0.5 bg-gradient-to-b from-cyan-500 to-emerald-500 transition-all duration-700 pointer-events-none z-0"
                  style={{
                    height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                    maxHeight: '100%'
                  }}
                ></div>

                {STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isCompleted = idx < currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  const isFuture = idx > currentStepIndex;

                  let stepColorClass = '';
                  let iconBgClass = '';

                  if (isCompleted) {
                    stepColorClass = 'text-emerald-400';
                    iconBgClass = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400';
                  } else if (isActive) {
                    stepColorClass = 'text-cyan-400';
                    iconBgClass = 'bg-cyan-500/20 border-cyan-500 glowing-cyan text-cyan-400 scale-105';
                  } else {
                    stepColorClass = 'text-slate-500';
                    iconBgClass = 'bg-slate-950/80 border-slate-800 text-slate-600';
                  }

                  return (
                    <div key={step.key} className="flex gap-5 items-start relative z-10 transition-all duration-300">
                      
                      {/* Step index badge circle */}
                      <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 ${iconBgClass}`}>
                        {isCompleted ? (
                          <Check className="w-5.5 h-5.5 stroke-[2.5]" />
                        ) : (
                          <StepIcon className={`w-5.5 h-5.5 ${isActive ? 'animate-pulse' : ''}`} />
                        )}
                      </div>

                      {/* Step Labels */}
                      <div className="space-y-1 mt-0.5">
                        <h4 className={`text-base font-extrabold transition-colors duration-500 ${stepColorClass}`}>
                          {step.label}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

          </div>

          {/* RIGHT: Document summary & specs */}
          <div className="md:col-span-4 space-y-6 animate-slide-up">
            
            {/* Print details spec list */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
                Printout Configuration
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Print Style & Paper Size</label>
                  <p className="text-slate-200 font-bold capitalize mt-0.5">
                    {config.paperSize} Size • {config.printType === 'COLOR' ? 'Full Color' : 'Grayscale B&W'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Layout Page Config</label>
                  <p className="text-slate-200 font-bold capitalize mt-0.5">
                    {config.sides === 'double' ? 'Double-Sided Printing' : 'Single-Sided Printing'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Document Binding</label>
                  <p className="text-slate-200 font-bold capitalize mt-0.5">
                    {config.binding === 'NONE' ? 'No Binding (Loose sheets)' : config.binding}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold block">Copies Requested</label>
                  <p className="text-slate-200 font-bold mt-0.5">
                    {config.copies} cop{config.copies > 1 ? 'ies' : 'y'}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Billing Invoice details */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
                Payment Invoice
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Total Pages queued:</span>
                  <strong className="text-slate-200">{order.totalPages}</strong>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Payment Status:</span>
                  {order.paymentStatus === 'PAID' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      PAID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                      PENDING
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-slate-900 pt-4">
                  <span className="text-xs font-bold text-slate-400">Total Charge:</span>
                  <span className="text-lg font-black text-cyan-400 flex items-center gap-0.5">
                    <IndianRupee className="w-4 h-4 stroke-[2.5]" />
                    {order.totalCost}
                  </span>
                </div>
              </div>
            </div>

            {order.paymentStatus === 'PENDING' && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-5 pb-3 border-b border-slate-800">
                  Scan & Pay (UPI)
                </h3>
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative p-4 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl flex items-center justify-center">
                    {/* Corner decorative borders */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500 rounded-tl-xl pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500 rounded-tr-xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500 rounded-bl-xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500 rounded-br-xl pointer-events-none"></div>
                    
                    {/* Scan animation line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400/50 blur-[2px] animate-scan-line z-20 pointer-events-none"></div>

                    {/* Real Slice QR Code Image */}
                    <img 
                      src="/qr.jpg" 
                      alt="UPI Payment QR Code" 
                      className="w-[180px] h-[180px] object-contain rounded-xl border border-slate-200 relative z-10 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold text-center mt-3 tracking-wider">
                    Scan with GPay, PhonePe, Paytm, etc.
                  </p>
                </div>
                
                <form onSubmit={handleSimulatePayment} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Upload Receipt Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      required
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setScreenshotFile(e.target.files[0]);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 mt-4 text-sm transition-all"
                  >
                    {paying ? 'Verifying Receipt...' : 'I Have Scanned and Paid'}
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
