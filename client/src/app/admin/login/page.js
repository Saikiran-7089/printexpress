'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Lock, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';

export default function AdminLoginPage() {
  const { login, loading, error } = useAuth();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showSeedHint, setShowSeedHint] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!registrationNumber || !password) {
      setValidationError('Please input administrative identifier and passcode.');
      return;
    }

    try {
      await login(registrationNumber, password);
    } catch (err) {
      // Handled by Context
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-slate-950">
      {/* Intense dark luxury background ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-emerald-500/10 shadow-2xl relative z-10">
        
        {/* Shield Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-cyan-600 rounded-xl shadow-lg shadow-emerald-500/20 mb-3 animate-pulse-glow">
            <ShieldCheck className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Manager Console
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold text-center">
            PrintExpress Secure Terminal
          </p>
        </div>

        {/* Security Alert Warning Banner */}
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-[10px] leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-bold block uppercase tracking-wider mb-0.5">Authorized Personnel Only</span>
            This terminal is private. Unverified login attempts are recorded and monitored.
          </div>
        </div>

        {/* Action Error Alerts */}
        {(error || validationError) && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
            <span className="font-semibold text-xs uppercase tracking-wider block">Security Notice:</span>
            <span className="text-xs">{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Registration Number input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Admin Username / Reg Number</label>
            <div className="relative">
              <UserCheck className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter admin ID"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Private Passcode</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter secure passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Verifying Credentials...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-sm">
                Authenticate Session <ArrowRight className="w-4.5 h-4.5" />
              </span>
            )}
          </button>
        </form>

        {/* Private Local Seeder Accordion */}
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowSeedHint(!showSeedHint)}
            className="text-[9px] text-slate-600 hover:text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors duration-200 focus:outline-none"
          >
            <span>Terminal Guidelines</span>
            <span>({showSeedHint ? 'Hide Details' : 'Show Details'})</span>
          </button>
          
          {showSeedHint && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed max-w-xs animate-slide-up">
              Default seeder access parameters are configured as: <code className="text-emerald-500 font-mono font-bold bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/10">admin</code> with password <code className="text-emerald-500 font-mono font-bold bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/10">password123</code>.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
