import Link from 'next/link';
import { 
  Printer, ArrowRight, UploadCloud, Cpu, Sparkles, 
  ShieldCheck, Layers, Eye
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#090b11]">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand Hero Showcase Section */}
      <main className="max-w-6xl w-full mx-auto px-6 py-20 flex-1 flex flex-col justify-center relative z-10 animate-slide-up">
        
        {/* Logo header branding */}
        <div className="flex items-center gap-2.5 mb-6 self-center md:self-start">
          <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-xl shadow-lg shadow-cyan-500/10">
            <Printer className="w-6 h-6 text-slate-900 stroke-[2.5]" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            PrintExpress
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-4">
          
          {/* Headline details */}
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-100 leading-tight">
              Instant Printing <br />
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Command Station
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
              Upload PDF, DOCX, and images from your phone or laptop. Configure print styles, compute pricing breakdowns instantly, and track orders in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start pt-3">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20 transition-all transform hover:scale-[1.01] cursor-pointer"
              >
                Access Dashboard <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 font-bold border border-slate-800 hover:border-cyan-500/20 rounded-xl transition-all cursor-pointer"
              >
                Create Account
              </Link>
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
