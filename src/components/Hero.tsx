import { ArrowRight, Mic } from 'lucide-react'

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-950 to-slate-950" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 opacity-30" />
        </div>
      </div>
      
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
          <Mic className="h-4 w-4" />
          <span>Powered by Whisper AI</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Turn audio into <span className="gradient-text">perfect text</span>
        </h1>
        
        <p className="mt-6 text-lg leading-8 text-slate-400">
          SageScribe transforms your recordings into accurate transcripts in seconds. 
          Private, fast, and incredibly simple. No credit card required to start.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="#pricing"
            className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 hover:shadow-emerald-600/40"
          >
            Start Transcribing Free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
          <a href="#features" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white">
            Learn more <span aria-hidden="true">→</span>
          </a>
        </div>
        
        <div className="mt-16 flex justify-center gap-8 text-sm text-slate-500">
          <span>✓ No credit card</span>
          <span>✓ 10 min free</span>
          <span>✓ Private & secure</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
