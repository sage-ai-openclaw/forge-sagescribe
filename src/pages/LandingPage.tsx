import Hero from '../components/Hero'
import Features from '../components/Features'
import Pricing from '../components/Pricing'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}

export default LandingPage
