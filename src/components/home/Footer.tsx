import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="w-full bg-[#1A0A04] pt-20 pb-8 border-t border-white/5">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* Top Section - Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* Column 1 - Brand */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start">
            <Link href="/" className="mb-6">
              <img src="/logo-dark.svg" alt="Toneek" className="h-8 w-auto invert brightness-0" />
            </Link>
            <p className="font-sans text-[13px] text-toneek-gray leading-relaxed max-w-[280px]">
              Skin intelligence for melanin-rich skin. Climate-adaptive formulas compounded specifically for FST IV–VI skin types.
            </p>
          </div>

          <div className="md:col-span-1 lg:col-span-4 hidden md:block"></div>

          {/* Column 2 - Platform */}
          <div className="md:col-span-3 lg:col-span-2 flex flex-col">
            <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[2px] mb-6">
              Platform
            </span>
            <div className="flex flex-col space-y-4">
              <Link href="/#science" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                The Science
              </Link>
              <Link href="/#the-formula" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                The Formula
              </Link>
              <Link href="/#results" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                Real Results
              </Link>
              <Link href="/assessment" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                Clinical Assessment
              </Link>
            </div>
          </div>

          {/* Column 3 - Support */}
          <div className="md:col-span-3 lg:col-span-2 flex flex-col">
            <span className="font-sans text-[11px] text-toneek-amber uppercase tracking-[2px] mb-6">
              Support
            </span>
            <div className="flex flex-col space-y-4">
              <Link href="/login" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                Log In
              </Link>
              <Link href="mailto:support@toneek.com" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/privacy" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="font-sans text-[13px] text-white/70 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
          <span className="font-sans text-[11px] text-white/50">
            © {new Date().getFullYear()} Toneek. All rights reserved.
          </span>
          <span className="font-sans text-[11px] text-white/50">
            Skin intelligence for melanin-rich skin.
          </span>
        </div>

      </div>
    </footer>
  )
}
