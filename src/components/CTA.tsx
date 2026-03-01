import { ArrowRight } from 'lucide-react'

function CTA() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-slate-950 to-slate-950" />
      </div>
      
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to transcribe your first audio?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-400">
          Join thousands of users who trust SageScribe for their transcription needs. 
          Start free today.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 hover:shadow-emerald-600/40"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
          <a href="#" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white">
            Contact sales <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default CTA
