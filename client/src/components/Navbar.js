'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Printer, LogOut, User, ShieldAlert, FileText } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <nav className="w-full bg-slate-950/40 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo Link */}
          <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2.5 hover:opacity-95 transition-all group">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-lg group-hover:scale-105 transition-transform duration-300">
              <Printer className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              PrintExpress
            </span>
          </Link>

          {/* User Status Options */}
          <div className="flex items-center gap-6">
            
            {/* Quick dashboard shortcuts */}
            {!isAdmin && (
              <Link 
                href="/dashboard/upload" 
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/20 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                New Printout
              </Link>
            )}

            {/* Profile Avatar badge card */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="flex flex-col items-end text-right hidden sm:flex">
                <span className="text-sm font-bold text-slate-100">{user.name}</span>
                {isAdmin ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                    <ShieldAlert className="w-2.5 h-2.5" /> Admin Deck
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                    <User className="w-2.5 h-2.5" /> Customer Portal
                  </span>
                )}
              </div>

              {/* Avatar circle */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-slate-900 border text-sm ${
                isAdmin 
                  ? 'bg-gradient-to-tr from-emerald-400 to-teal-400 border-emerald-500/30' 
                  : 'bg-gradient-to-tr from-cyan-400 to-blue-400 border-cyan-500/30'
              }`}>
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 bg-slate-900/60 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>

          </div>

        </div>
      </div>
    </nav>
  );
}
