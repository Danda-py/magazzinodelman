import { Link, useLocation } from "wouter";
import { BarChart3, Package, FileText, LogOut, ArrowLeft, Users } from "lucide-react";
import { useClerk } from "@clerk/react";

export function AdminSidebar() {
  const [location] = useLocation();
  const { signOut } = useClerk();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/inventory", label: "Inventario & Proposte", icon: Package },
    { href: "/users", label: "Utenti", icon: Users },
    { href: "/cms", label: "CMS Editor", icon: FileText },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <h2 className="font-serif text-xl">ERP Panel</h2>
        <p className="text-sm text-muted-foreground mt-1">Gestione Boutique</p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        {/* Torna al sito — navigazione semplice, non fa logout */}
        <a
          href="/"
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          Torna al Sito
        </a>
        {/* Disconnetti — fa il vero logout */}
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={18} />
          Disconnetti
        </button>
      </div>
    </aside>
  );
}
