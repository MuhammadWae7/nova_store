"use client";

import Link from "next/link"
import { ShoppingBag, Menu, Search, X, ChevronDown } from "lucide-react"
import { Button } from "../ui/button"
import { useState, useEffect, useRef } from "react"
import { Container } from "../ui/container"
import { useCart } from "@/features/cart/context"
import { TaxonomyService, Section } from "@/services/taxonomy-service"

export function Header() {
  const { items, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    TaxonomyService.getActiveSections()
      .then(setSections)
      .catch(() => setSections([]));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-md transition-all">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <nav className="hidden items-center gap-6 md:flex" ref={dropdownRef}>
              {/* Dynamic sections from API */}
              {sections.map((section) => (
                <div key={section.id} className="relative">
                  {section.categories && section.categories.length > 0 ? (
                    <>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === section.id ? null : section.id)}
                        className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-accent"
                      >
                        {section.name}
                        <ChevronDown className={`h-3 w-3 transition-transform ${activeDropdown === section.id ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === section.id && (
                        <div className="absolute top-full right-0 mt-2 min-w-[180px] rounded-lg border border-white/10 bg-neutral-900/95 backdrop-blur-md py-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                          {section.categories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/products?categoryId=${cat.id}`}
                              className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/products?categoryId=${section.id}`}
                      className="text-sm font-medium transition-colors hover:text-accent"
                    >
                      {section.name}
                    </Link>
                  )}
                </div>
              ))}
              <Link href="/products" className="text-sm font-medium transition-colors hover:text-accent">
                تسوق الكل
              </Link>
            </nav>
          </div>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-2xl font-bold tracking-tighter">
              NOVA <span className="text-accent">FASHION</span>
            </h1>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
              <ShoppingBag className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">
                  {items.reduce((acc, item) => acc + (item.quantity || 0), 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Search Bar - Simple Expansion */}
        {isSearchOpen && (
           <div className="border-t border-white/5 py-3 animate-in fade-in slide-in-from-top-2">
             <input 
               type="text" 
               placeholder="ابحث عن منتجات..." 
               className="w-full bg-transparent px-2 text-sm outline-none"
               autoFocus
             />
           </div>
        )}
      </Container>
    </header>

    {/* Mobile Menu Overlay */}
    {isMobileMenuOpen && (
       <div className="fixed inset-0 z-[100] bg-background">
         <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
               <h2 className="text-lg font-bold">القائمة</h2>
               <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                 <X className="h-5 w-5" />
               </Button>
            </div>
            <nav className="flex flex-col p-6 gap-4 text-lg font-medium overflow-y-auto">
              {/* Dynamic sections */}
              {sections.map((section) => (
                <div key={section.id}>
                  <span className="text-neutral-400 text-sm uppercase tracking-wider">{section.name}</span>
                  {section.categories && section.categories.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2 mr-4">
                      {section.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/products?categoryId=${cat.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-base text-neutral-200 hover:text-accent transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="h-px bg-white/10 my-2" />
              <Link href="/products" onClick={() => setIsMobileMenuOpen(false)}>تسوق الكل</Link>
              <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>لوحة التحكم</Link>
            </nav>
         </div>
       </div>
    )}
    </>
  )
}
