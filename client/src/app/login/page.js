'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Printer, Mail, Lock, ArrowRight, UserCheck, Shield, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!registrationNumber || !password) {
      setValidationError('Please input both registration number and password.');
      return;
    }

    try {
      await login(registrationNumber, password, 'CUSTOMER');
    } catch (err) {
      // Error handled by AuthContext and exposed via context state
    }
  };



  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 animate-slide-up relative z-10">
        
        {/* Brand Logo header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-xl shadow-lg shadow-cyan-500/20 mb-3 animate-pulse-glow">
            <Printer className="w-8 h-8 text-slate-900 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            PrintExpress
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time print & Xerox portal</p>
        </div>

        {/* Action Error Alerts */}
        {(error || validationError) && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
            <span className="font-semibold">Alert:</span>
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Registration Number input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Registration Number</label>
            <div className="relative">
              <UserCheck className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter registration number"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Secure Password</label>
              <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/25 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Logging in...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold">
                Access Dashboard <ArrowRight className="w-4.5 h-4.5" />
              </span>
            )}
          </button>
        </form>



        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <p className="text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline transition-colors">
              Register Here
            </Link>
          </p>
          <Link href="/admin/login" className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors">
            Manager Login &rarr;
          </Link>
        </div>


      </div>
    </div>
  );
}
