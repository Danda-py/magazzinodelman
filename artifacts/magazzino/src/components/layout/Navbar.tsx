import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { ShoppingBag, Menu, X, MessageCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk } from "@clerk/react";

export function Navbar() {
  const { user } = useAuth();
  const { items, setIsOpen } = useCart();
  const [location] = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const { signOut } = useClerk();

  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!user;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center gap-12">
        <Link href="/" className="font-serif text-xl tracking-tight flex items-center gap-2 shrink-0">
          IL MAGAZZINO DEL MAN
          {isAdmin && (
            <span className="text-[10px] font-sans tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">
              ADMIN
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/store" className={`hover:text-primary transition-colors ${location.startsWith("/store") ? "text-primary" : "text-muted-foreground"}`}>
            STORE
          </Link>
          <Link href="/proponi" className={`hover:text-primary transition-colors ${location === "/proponi" ? "text-primary" : "text-muted-foreground"}`}>
            VENDI
          </Link>
          {isLoggedIn && !isAdmin && (
            <Link href="/le-mie-chat" className={`hover:text-primary transition-colors flex items-center gap-1.5 ${location === "/le-mie-chat" ? "text-primary" : "text-muted-foreground"}`}>
              <MessageCircle size={15} /> CHAT
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className={`hover:text-primary transition-colors ${location.startsWith("/admin") ? "text-primary" : "text-muted-foreground"}`}>
              ERP PANEL
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-3">
          {isLoggedIn && !isAdmin && (
            <Link href="/le-mie-chat" className="relative w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors md:hidden">
              <MessageCircle size={20} />
            </Link>
          )}

          <button className="relative w-8 h-8 flex items-center justify-center text-primary" onClick={() => setIsOpen(true)}>
            <ShoppingBag size={20} />
            {items.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full translate-x-1 -translate-y-1"
              >
                {items.length}
              </motion.span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href={isAdmin ? "/admin" : "/store"}
                  className="text-sm font-medium tracking-wide hover:underline underline-offset-4"
                >
                  {user.name || "ACCOUNT"}
                </Link>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Disconnetti"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link href="/sign-in" className="text-sm font-medium tracking-wide hover:underline underline-offset-4">
                ACCEDI
              </Link>
            )}
          </div>

          <button className="md:hidden w-8 h-8 flex items-center justify-center" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 w-full bg-background/95 backdrop-blur-md border-b border-border shadow-xl p-6 flex flex-col gap-4"
          >
            <Link href="/store" className="text-lg font-serif border-b border-border/40 pb-3" onClick={() => setMobileMenu(false)}>STORE</Link>
            <Link href="/proponi" className="text-lg font-serif border-b border-border/40 pb-3" onClick={() => setMobileMenu(false)}>VENDI</Link>
            {isLoggedIn && !isAdmin && (
              <Link href="/le-mie-chat" className="text-lg font-serif border-b border-border/40 pb-3 flex items-center gap-2" onClick={() => setMobileMenu(false)}>
                <MessageCircle size={18} /> CHAT
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" className="text-lg font-serif border-b border-border/40 pb-3" onClick={() => setMobileMenu(false)}>ERP PANEL</Link>
            )}
            {isLoggedIn ? (
              <>
                <Link href={isAdmin ? "/admin" : "/store"} className="text-lg font-serif border-b border-border/40 pb-3" onClick={() => setMobileMenu(false)}>
                  {user.name || "ACCOUNT"}
                </Link>
                <button
                  onClick={() => { setMobileMenu(false); signOut({ redirectUrl: "/" }); }}
                  className="text-lg font-serif pb-2 text-left flex items-center gap-2 text-muted-foreground"
                >
                  <LogOut size={18} /> Disconnetti
                </button>
              </>
            ) : (
              <Link href="/sign-in" className="text-lg font-serif pb-2" onClick={() => setMobileMenu(false)}>ACCEDI</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
