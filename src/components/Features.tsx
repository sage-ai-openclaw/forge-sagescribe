import { Zap, Shield, Clock, Globe, FileText, Sparkles } from 'lucide-react'

const features = [
  {
    name: 'Lightning Fast',
    description: 'Get your transcripts in seconds, not hours. Our AI processes audio at 10x real-time speed.',
    icon: Zap,
  },
  {
    name: 'Privacy First',
    description: 'Your audio never leaves our secure servers. Automatic deletion after processing available.',
    icon: Shield,
  },
  {
    name: 'Always Available',
    description: '24/7 transcription service. Upload anytime, get results instantly.',
    icon: Clock,
  },
  {
    name: 'Multi-language',
    description: 'Support for 99 languages. Accurate transcription regardless of accent or dialect.',
    icon: Globe,
  },
  {
    name: 'Multiple Formats',
    description: 'Export as TXT, SRT, VTT, or JSON. Perfect for subtitles, notes, or analysis.',
    icon: FileText,
  },
  {
    name: 'AI-Powered Accuracy',
    description: 'State-of-the-art Whisper models deliver human-level transcription quality.',
    icon: Sparkles,
  },
]

function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-emerald-400">Features</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need for perfect transcripts
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            Built for podcasters, journalists, researchers, and anyone who needs reliable transcription.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <feature.icon className="h-5 w-5 flex-none text-emerald-400" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export default Features
