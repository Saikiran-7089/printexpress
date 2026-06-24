'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/context/AuthContext';
import { Printer, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectSeconds, setRedirectSeconds] = useState(4);

  // Password rules validation states
  const [rules, setRules] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    match: false
  });

  // Run validation on value changes
  useEffect(() => {
    setRules({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&#]/.test(password),
      match: password.length > 0 && password === confirmPassword
    });
  }, [password, confirmPassword]);

  const allRulesPassed = Object.values(rules).every(rule => rule === true);

  // Auto redirect countdown on success
  useEffect(() => {
    if (!success) return;

    const interval = setInterval(() => {
      setRedirectSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [success, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!allRulesPassed) {
      setError('Please satisfy all password rules and match confirmation.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword
      });
      setSuccess(response.data.message || 'Password reset successfully. Please log in with your new password.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const RuleCheck = ({ label, passed }) => (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-all ${
        passed 
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
          : 'bg-slate-950/40 border-slate-800 text-slate-500'
      }`}>
        {passed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-slate-600"></div>}
      </div>
      <span className={passed ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[#090b11]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 animate-slide-up relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-xl shadow-lg mb-3 animate-pulse-glow">
            <Lock className="w-8 h-8 text-slate-900 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">Set your new account credentials</p>
        </div>

        {/* Success Alert & Redirect Info */}
        {success && (
          <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex flex-col gap-1.5 animate-pulse-glow">
            <span className="font-bold text-emerald-400">Success!</span>
            <span>{success}</span>
            <span className="text-[11px] text-emerald-500/80 font-medium mt-1">
              Redirecting to login in <span className="font-black text-slate-100">{redirectSeconds}</span> seconds...
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-2">
            <span className="font-semibold">Alert:</span>
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-11 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm font-sans"
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

            {/* Confirm password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm font-sans"
                />
              </div>
            </div>

            {/* Password Rules Checklist Panel */}
            <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2 mt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Password Requirements</p>
              <div className="grid grid-cols-2 gap-2">
                <RuleCheck label="Min 8 characters" passed={rules.minLength} />
                <RuleCheck label="Uppercase letter" passed={rules.hasUpper} />
                <RuleCheck label="Lowercase letter" passed={rules.hasLower} />
                <RuleCheck label="Contains number" passed={rules.hasNumber} />
                <RuleCheck label="Special character" passed={rules.hasSpecial} />
                <RuleCheck label="Passwords match" passed={rules.match} />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !allRulesPassed}
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50 mt-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  Updating password...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-bold">
                  Reset Password <ArrowRight className="w-4.5 h-4.5" />
                </span>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-900/50 flex justify-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 font-semibold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
