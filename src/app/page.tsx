import Navbar from '@/components/home/Navbar'
import ProofBar from '@/components/home/ProofBar'
import TheProblem from '@/components/home/TheProblem'
import HowItWorks from '@/components/home/HowItWorks'
import FormulaSystem from '@/components/home/FormulaSystem'
import RealResults from '@/components/home/RealResults'
import ClinicalTrajectory from '@/components/home/ClinicalTrajectory'
import TheScience from '@/components/home/TheScience'
import GlobalReach from '@/components/home/GlobalReach'
import MarketsStrip from '@/components/home/MarketsStrip'
import FinalCTA from '@/components/home/FinalCTA'
import Footer from '@/components/home/Footer'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-toneek-cream selection:bg-toneek-amber/30">
      <Navbar />

      {/* SECTION 2 — HERO */}
      <section className="relative w-full bg-toneek-brown min-h-[90vh] lg:min-h-screen flex items-center pt-[60px] lg:pt-[72px] overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center py-12 lg:py-0">
          
          {/* Left Column */}
          <div className="flex flex-col z-10 relative mt-8 lg:mt-0">
            {/* Small Label */}
            <div className="animate-slide-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[3px]">Built for melanin-rich skin</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 font-serif font-bold text-white leading-[1.05] text-[50px] sm:text-[60px] lg:text-[72px] animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              Your skin has never<br className="hidden sm:block" />
              had a system built<br className="hidden sm:block" />
              for it.<br />
              <span className="text-toneek-amber">Until now.</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 font-sans text-[16px] lg:text-[18px] text-white/75 max-w-[480px] leading-relaxed animate-slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              Toneek assigns you a personalised formula — compounded specifically for your skin type, your climate, and your primary concern. Then it tracks your outcomes and improves over time.
            </p>

            {/* Trust Signals */}
            <div className="mt-8 space-y-2 animate-slide-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-toneek-amber"></div>
                <span className="font-sans text-[13px] text-white/60">Formulated for FST IV–VI skin</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-toneek-amber"></div>
                <span className="font-sans text-[13px] text-white/60">Ships to 40+ countries</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 animate-slide-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <Link 
                href="/assessment"
                className="inline-flex items-center justify-center bg-toneek-amber hover:bg-[#D4895A] text-toneek-brown font-sans font-semibold text-[15px] px-8 py-4 rounded-lg transition-all shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-lg group"
              >
                Start your skin assessment
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <p className="mt-4 font-sans text-[12px] text-white/50">
                Takes 3 minutes. No credit card required.
              </p>
            </div>
          </div>

          {/* Right Column - Image Cluster */}
          <div className="relative w-full h-[400px] lg:h-[600px] flex items-center justify-center lg:justify-end animate-slide-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
            
            <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
              
              {/* Main Circle (FST VI) */}
              <div 
                className="absolute z-20 w-[280px] h-[280px] lg:w-[380px] lg:h-[380px] rounded-full border-2 border-toneek-amber shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #3D1A0E, #7B3518)' }}
                aria-label="Woman with FST VI skin, close-up confident portrait"
              ></div>

              {/* Secondary Circle (FST V) */}
              <div 
                className="absolute z-10 w-[140px] h-[140px] lg:w-[180px] lg:h-[180px] rounded-full border-2 border-toneek-amber shadow-xl -right-4 lg:-right-8 bottom-12 lg:bottom-24"
                style={{ background: 'linear-gradient(135deg, #3D1A0E, #7B3518)' }}
                aria-label="Woman with FST V skin"
              ></div>

              {/* Tertiary Circle (FST IV) */}
              <div 
                className="absolute z-10 w-[90px] h-[90px] lg:w-[120px] lg:h-[120px] rounded-full border-2 border-toneek-amber shadow-xl top-4 lg:top-8 right-8 lg:right-16"
                style={{ background: 'linear-gradient(135deg, #3D1A0E, #7B3518)' }}
                aria-label="Woman with FST IV skin"
              ></div>

              {/* Floating Skin OS Score Card */}
              <div 
                className="absolute z-30 bottom-0 left-0 lg:-left-12 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] p-4 lg:p-5 w-[180px] lg:w-[200px] animate-slide-up opacity-0"
                style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
              >
                <div className="flex flex-col">
                  <span className="font-sans text-[10px] text-toneek-amber uppercase font-bold tracking-wider">Skin OS Score</span>
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-toneek-amber/20"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="text-toneek-amber"
                          strokeDasharray="70, 100"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-serif text-[20px] text-toneek-amber font-bold">77</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-sans text-[11px] text-toneek-gray leading-tight">Initial<br/>Assessment</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3 — PROOF BAR */}
      <ProofBar />

      {/* SECTION 4 — THE PROBLEM */}
      <TheProblem />

      {/* SECTION 5 — HOW IT WORKS */}
      <HowItWorks />

      {/* SECTION 6 — THE FORMULA SYSTEM */}
      <FormulaSystem />

      {/* SECTION 7 — REAL RESULTS */}
      <RealResults />

      {/* SECTION 8 — CLINICAL TRAJECTORY */}
      <ClinicalTrajectory />

      {/* SECTION 9 — THE SCIENCE */}
      <TheScience />

      {/* SECTION 10 — GLOBAL REACH */}
      <GlobalReach />

      {/* SECTION 11 — MARKETS STRIP */}
      <MarketsStrip />

      {/* SECTION 12 — FINAL CTA */}
      <FinalCTA />

      {/* SECTION 13 — FOOTER */}
      <Footer />

    </div>
  )
}
