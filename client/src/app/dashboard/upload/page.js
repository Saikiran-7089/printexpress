'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { 
  FileText, UploadCloud, X, ArrowLeft, ArrowRight, Check,
  ShieldCheck, HelpCircle, FileCheck, Landmark, Smartphone
} from 'lucide-react';

export default function DocumentUploadHub() {
  const { api } = useAuth();
  const router = useRouter();

  // Attached files state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Configuration options state
  const [paperSize, setPaperSize] = useState('A4'); // A4, A3, LEGAL
  const [printType, setPrintType] = useState('BW'); // BW, COLOR
  const [sides, setSides] = useState('single'); // single, double
  const [binding, setBinding] = useState('NONE'); // NONE, STAPLED, SPIRAL
  const [copies, setCopies] = useState(1);
  const [isEmergency, setIsEmergency] = useState(false); // emergency print

  // Invoice calculations state
  const [invoice, setInvoice] = useState({ items: [], subtotal: 0, emergencyTotal: 0, gst: 0, total: 0 });

  // Checkout payment overlay state
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);

  // 1. Drag & drop upload handler
  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await api.post('/orders/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newFilesList = [...files, ...response.data.files];
      setFiles(newFilesList);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Unsupported file type or oversized file. PDF, DOCX, Images only (Max 15MB).');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  // 2. Dynamic live price calculator
  const calculateLiveCosts = () => {
    if (files.length === 0) {
      setInvoice({ items: [], subtotal: 0, emergencyTotal: 0, gst: 0, total: 0 });
      return;
    }

    // A4 baseline rates
    let basePageRate = 2.0; // BW single
    if (printType === 'COLOR') {
      basePageRate = sides === 'double' ? 7.5 : 10.0;
    } else {
      basePageRate = sides === 'double' ? 4.0 : 2.0;
    }

    // Emergency printing base adder
    const emergencyCostRate = isEmergency ? 1.0 : 0.0;

    // Size multipliers
    let sizeMultiplier = 1.0;
    if (paperSize === 'A3') sizeMultiplier = 2.0;
    if (paperSize === 'LEGAL') sizeMultiplier = 1.5;

    const pageRate = basePageRate * sizeMultiplier;

    // Binding flat add-ons
    let bindingCost = 0.0;
    if (binding === 'STAPLED') bindingCost = 5.0;
    if (binding === 'SPIRAL') bindingCost = 30.0;

    let subtotal = 0;
    let emergencyTotal = 0;
    const items = files.map((file, idx) => {
      const sheets = sides === 'double' ? Math.ceil(file.estimatedPages / 2) : file.estimatedPages;
      const docPrintingCost = sheets * pageRate;
      const docEmergencyCost = file.estimatedPages * emergencyCostRate * copies;
      emergencyTotal += docEmergencyCost;
      const docCost = (docPrintingCost + bindingCost) * copies + docEmergencyCost;
      subtotal += docCost;

      return {
        fileName: file.originalName,
        pages: file.estimatedPages,
        printingCost: docPrintingCost * copies,
        bindingCost: bindingCost * copies,
        total: Math.round(docCost * 100) / 100
      };
    });

    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;

    setInvoice({
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      emergencyTotal: Math.round(emergencyTotal * 100) / 100,
      gst,
      total
    });
  };

  // Recalculate price when variables or files lists adjust
  useEffect(() => {
    calculateLiveCosts();
  }, [files, paperSize, printType, sides, binding, copies, isEmergency]);

  // 3. Checkout Creator Route
  const handleProceedCheckout = async () => {
    if (files.length === 0) return;
    setError('');

    try {
      const response = await api.post('/orders/checkout', {
        documents: files.map(f => ({
          originalName: f.originalName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize,
          totalPages: f.estimatedPages
        })),
        paperSize,
        printType,
        sides,
        binding,
        copies,
        isEmergency
      });

      setCreatedOrder(response.data.order);
      setShowCheckout(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize order checkout.');
    }
  };

  // 4. Simulated Payment Handler
  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!createdOrder) return;
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

      const response = await api.post(`/orders/${createdOrder.id}/pay`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setPaymentDone(true);
      // Wait for success checkmark animation
      setTimeout(() => {
        router.push(`/dashboard/order/${createdOrder.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Receipt verification failed. Please try again.');
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950/20 relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Back Link Header */}
        <div className="mb-6 animate-slide-up">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        {/* Dynamic Title */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Configure Your <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Printout</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Upload documents, choose print configurations, and calculate prices dynamically.</p>
        </div>

        {/* Global Alert Notification */}
        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm animate-slide-up">
            <span className="font-semibold block">Processing Error</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: File upload & settings block */}
          <div className="lg:col-span-8 space-y-8 animate-slide-up">
            
            {/* Multi-file drag upload hub */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-md text-xs">1</span>
                Upload Printing Documents
              </h2>

              <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/40 bg-slate-950/40 rounded-2xl p-8 transition-colors text-center relative cursor-pointer group">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-slate-900 group-hover:bg-cyan-500/10 rounded-2xl border border-slate-800 group-hover:border-cyan-500/20 text-slate-400 group-hover:text-cyan-400 transition-all">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Drag & drop files here, or click to browse</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, and images (PNG, JPG, GIF) up to 15MB</p>
                  </div>

                </div>
              </div>

              {/* Uploading loading panel */}
              {uploading && (
                <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">Uploading and extracting file properties...</p>
                </div>
              )}

              {/* Attached file list view */}
              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Uploaded Files ({files.length})</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl group hover:border-slate-700 transition-colors animate-slide-up">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200 truncate max-w-xs sm:max-w-md">{file.originalName}</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB • <span className="text-cyan-400 font-black">{file.estimatedPages} pages</span> (exactly detected)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Printing configuration options details */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-200 mb-5 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-md text-xs">2</span>
                Choose Print Specifications
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Print Layout details B&W vs COLOR */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Print Tone Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPrintType('BW')}
                      className={`py-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        printType === 'BW'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>Black & White</span>
                      <span className="text-[10px] font-normal text-slate-500">₹2.00 / page</span>
                    </button>
                    <button
                      onClick={() => setPrintType('COLOR')}
                      className={`py-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        printType === 'COLOR'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="bg-gradient-to-r from-red-400 via-green-400 to-blue-400 bg-clip-text text-transparent">Color Print</span>
                      <span className="text-[10px] font-normal text-slate-500">₹10.00 / page</span>
                    </button>
                  </div>
                </div>

                {/* Sizing options */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Paper Size Sizing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['A4', 'A3', 'LEGAL'].map(size => (
                      <button
                        key={size}
                        onClick={() => setPaperSize(size)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer capitalize ${
                          paperSize === size
                            ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                            : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {size}
                        <span className="block text-[9px] font-normal text-slate-500 mt-0.5">
                          {size === 'A4' ? '1.0x rate' : size === 'A3' ? '2.0x rate' : '1.5x rate'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Sides */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sides Printing</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSides('single')}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        sides === 'single'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Single-Sided
                    </button>
                    <button
                      onClick={() => setSides('double')}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        sides === 'double'
                          ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Double-Sided
                      <span className="block text-[9px] font-normal text-slate-500 mt-0.5">₹4.00 per page</span>
                    </button>
                  </div>
                </div>

                {/* Emergency Print Option */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Processing Speed</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setIsEmergency(!isEmergency)}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isEmergency
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span>Emergency Print Out</span>
                        <span className="text-[9px] font-normal opacity-80 mt-0.5">Jump the queue for urgent prints</span>
                      </div>
                      <span className="text-xs font-black">+₹1.00 / page</span>
                    </button>
                  </div>
                </div>

                {/* Binding Options selector */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Binding Options</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'NONE', label: 'None', price: '₹0' },
                      { key: 'STAPLED', label: 'Stapled', price: '+₹5' },
                      { key: 'SPIRAL', label: 'Spiral', price: '+₹30' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setBinding(opt.key)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          binding === opt.key
                            ? 'border-cyan-500 bg-cyan-500/5 text-cyan-400'
                            : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                        <span className="block text-[9px] font-normal text-slate-500 mt-0.5">{opt.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number of copies */}
                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Number of Copies</label>
                  <div className="flex items-center gap-3 max-w-[200px]">
                    <button
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 bg-slate-950/80 border border-slate-800 rounded-xl py-2 text-center text-slate-100 focus:outline-none focus:border-cyan-500 font-bold"
                    />
                    <button
                      onClick={() => setCopies(copies + 1)}
                      className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT: Dynamic Invoice & Checkout Panel */}
          <div className="lg:col-span-4 animate-slide-up">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-200 mb-5 pb-3 border-b border-slate-800">
                Billing Invoice Breakdown
              </h2>

              {files.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Upload document files to display real-time printing calculations.
                </div>
              ) : (
                <div className="space-y-5">
                  
                  {/* Itemized details list */}
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {invoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-900 pb-3">
                        <div className="max-w-[70%]">
                          <p className="font-semibold text-slate-300 truncate">{item.fileName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {item.pages} pages × {copies} copies
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-300">₹{item.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calculations breakdown totals */}
                  <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-300">₹{(invoice.subtotal - invoice.emergencyTotal).toFixed(2)}</span>
                    </div>
                    {isEmergency && invoice.emergencyTotal > 0 && (
                      <div className="flex justify-between text-xs text-rose-400">
                        <span>Emergency Speed Fee</span>
                        <span className="font-semibold">+₹{invoice.emergencyTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>GST (18% printing service tax)</span>
                      <span className="font-semibold text-slate-300">₹{invoice.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-200 border-t border-slate-900 pt-3">
                      <span className="text-cyan-400">Grand Total</span>
                      <span className="text-cyan-400 text-base">₹{invoice.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Pricing info tip alert */}
                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-[10px] text-slate-400 leading-relaxed flex gap-2">
                    <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Prices are computed dynamically based on current base store rates. Double-sided B&W drops rate per sheet page.</span>
                  </div>

                  {/* Glowing Submit Button */}
                  <button
                    onClick={handleProceedCheckout}
                    className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 transition-all transform hover:scale-[1.01]"
                  >
                    Proceed to Payment <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* Simulated secure checkout overlay modal */}
      {showCheckout && createdOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 relative animate-slide-up">
            
            {/* Close modal */}
            <button
              onClick={() => setShowCheckout(false)}
              disabled={paying}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-900/60 rounded-lg text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Modal state shifts: PAYMENT IN PROGRESS OR DONE */}
            {paymentDone ? (
              /* Checkmark completed transaction screen */
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mb-6 animate-pulse-glow">
                  <Check className="w-9 h-9 text-emerald-400 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">Payment Success</h3>
                <p className="text-slate-400 text-xs mt-1 mb-2">Transaction ID generated: pay_{createdOrder.id.split('-')[0]}</p>
                <p className="text-emerald-400/90 font-semibold text-xs mt-3">Routing you to the live status screen...</p>
              </div>
            ) : (
              /* Gateway interface */
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Scan & Pay (UPI)</h3>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Dynamic Payment QR</p>
                  </div>
                </div>

                {/* Amount details card */}
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">Total Printable Amount (GST Inc.)</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{files.length} document configuration(s)</p>
                  </div>
                  <h4 className="text-xl font-extrabold text-cyan-400">₹{invoice.total.toFixed(2)}</h4>
                </div>

                <div className="flex flex-col items-center justify-center mb-6">
                  {/* QR Scan Border Overlay container */}
                  <div className="relative p-4 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl flex items-center justify-center">
                    {/* Scanner glow corner lines */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500 rounded-br-lg"></div>
                    
                    {/* Scan horizontal laser animation line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-cyan-400/80 blur-[1px] animate-pulse-laser z-20"></div>

                    {/* Real Slice QR Code Image */}
                    <img 
                      src="/qr.jpg" 
                      alt="UPI Payment QR Code" 
                      className="w-[180px] h-[180px] object-contain rounded-xl border border-slate-200 relative z-10 bg-white"
                    />
                  </div>
                  
                  <p className="text-[10px] text-slate-400 font-bold text-center mt-3 tracking-wider">
                    Scan with GPay, PhonePe, Paytm, or any banking app
                  </p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-0.5 font-bold bg-cyan-950/20 px-2.5 py-1 rounded-lg border border-cyan-800/30">
                    UPI ID: 8688915833@slc
                  </p>
                </div>

                <form onSubmit={handleSimulatePayment} className="space-y-4">
                  {/* Screenshot Receipt Upload Field */}
                  <div className="space-y-1.5 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Upload Payment Screenshot Receipt (Required)
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
                      className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-semibold cursor-pointer transition-all"
                    />
                    <p className="text-[9px] text-slate-500">Supports PNG, JPG, or PDF receipts up to 10MB</p>
                  </div>

                  {/* Info alert */}
                  <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-slate-400 leading-relaxed">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-300 block mb-0.5">Payment Verification</strong>
                      Scan QR, upload payment receipt confirmation screenshot, and click the confirmation button to dispatch the verification callback.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 mt-6 text-sm"
                  >
                    {paying ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                        Verifying Screenshot Receipt...
                      </span>
                    ) : (
                      <span>I Have Scanned and Paid</span>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
