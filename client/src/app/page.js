import Link from 'next/link';
import { 
  Printer, ArrowRight, UploadCloud, Cpu, Sparkles, 
  ShieldCheck, Layers, Eye, User, Shield
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#090b11]">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Modern Landing Page Navbar */}
      <nav className="w-full bg-slate-950/40 border-b border-slate-900/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-lg shadow-md shadow-cyan-500/10">
              <Printer className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              PrintExpress
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6">
            <Link href="/" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
              Home
            </Link>
            <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
              Customer Portal
            </Link>
            <Link href="/admin/login" className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">
              Admin Operations
            </Link>
            <Link href="/register" className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold border border-slate-800 hover:border-cyan-500/20 rounded-lg text-[11px] transition-all">
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      {/* Brand Hero Showcase Section */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 md:py-20 flex-1 flex flex-col justify-center relative z-10 animate-slide-up">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Headline details */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-100 leading-tight">
              Instant Printing <br />
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Command Station
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
              Upload PDF, DOCX, and images. Configure print styles, compute pricing breakdowns instantly, and track orders in real-time.
            </p>

            {/* Premium Dual Portal Entry Buttons */}
            <div className="space-y-4 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/login"
                  className="p-5 bg-gradient-to-tr from-slate-950/80 to-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left gap-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 group cursor-pointer"
                >
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">Customer Portal</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium">Order prints, edit specs, and pay simulation bills.</p>
                  </div>
                </Link>

                <Link
                  href="/admin/login"
                  className="p-5 bg-gradient-to-tr from-slate-950/80 to-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left gap-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 group cursor-pointer"
                >
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">Admin Terminal</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-medium">Manage print queues, update step-stages, view revenue.</p>
                  </div>
                </Link>
              </div>

              <div className="flex justify-center md:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-bold group mt-2"
                >
                  Don't have an account? Register here <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Graphical features panel grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">AWS S3 Uploads</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Multi-file drag-and-drop system. Pages auto-analyzed upon uploading to S3 mockup bucket.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Dynamic Pricing</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Itemized breakdown calculated dynamically in real-time as print configurations shift.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Socket.io Steppers</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Watch printouts shift stages instantly on screen as administrators progress through queues.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Stripe Simulator</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Authorize print checks through full simulated credit card payment callback layers securely.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* Footer info branding */}
      <footer className="w-full text-center py-6 border-t border-slate-900 text-[10px] text-slate-600 font-semibold tracking-wider relative z-10 bg-slate-950/20">
        &copy; {new Date().getFullYear()} PRINTEXPRESS INC. CODES COMPLY WITH INDUSTRY-STANDARD WEB DEV BEST PRACTICES.
      </footer>
    </div>
  );
}
