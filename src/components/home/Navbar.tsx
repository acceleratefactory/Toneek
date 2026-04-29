"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [mobileMenuOpen])

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
          scrolled ? 'bg-toneek-brown border-b border-toneek-amber/20' : 'bg-transparent'
        }`}
      >
        <div className="h-[60px] lg:h-[72px] px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img src="/logo-dark.svg" alt="Toneek" className="h-8 lg:h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/#how-it-works" className="text-[13px] font-sans font-medium text-white tracking-[0.5px] relative group">
              How it works
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-toneek-amber transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="/#the-formula" className="text-[13px] font-sans font-medium text-white tracking-[0.5px] relative group">
              The formula
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-toneek-amber transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="/#results" className="text-[13px] font-sans font-medium text-white tracking-[0.5px] relative group">
              Results
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-toneek-amber transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link href="/#science" className="text-[13px] font-sans font-medium text-white tracking-[0.5px] relative group">
              Our science
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-toneek-amber transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </div>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/login" className="text-[13px] font-sans text-white opacity-70 hover:opacity-100 transition-opacity">
              Log in
            </Link>
            <Link 
              href="/assessment" 
              className="bg-toneek-amber hover:bg-[#D4895A] text-toneek-brown text-[13px] font-sans font-medium px-5 py-2.5 rounded-md transition-colors"
            >
              Start assessment
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button 
            className="lg:hidden text-white"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[85%] bg-toneek-brown transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-end p-4 h-[60px] items-center">
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-white"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 px-8 py-8 flex flex-col space-y-6">
          <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-sans font-medium text-white">How it works</Link>
          <Link href="/#the-formula" onClick={() => setMobileMenuOpen(false)} className="text-base font-sans font-medium text-white">The formula</Link>
          <Link href="/#results" onClick={() => setMobileMenuOpen(false)} className="text-base font-sans font-medium text-white">Results</Link>
          <Link href="/#science" onClick={() => setMobileMenuOpen(false)} className="text-base font-sans font-medium text-white">Our science</Link>
          <div className="h-[1px] bg-white/10 my-4" />
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-sans font-medium text-white opacity-80">Log in</Link>
        </div>

        <div className="p-8">
          <Link 
            href="/assessment" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex w-full items-center justify-center bg-toneek-amber hover:bg-[#D4895A] text-toneek-brown text-base font-sans font-medium py-3 rounded-md transition-colors"
          >
            Start assessment
          </Link>
        </div>
      </div>
    </>
  )
}
