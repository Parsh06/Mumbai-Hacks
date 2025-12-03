import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Force dark mode only
    document.documentElement.classList.add("dark");
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/companies", label: "Companies" },
    { to: "/compare", label: "Compare" },
    { to: "/news", label: "Top News" },
    { to: "/ipo", label: "IPO" },
  ];

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(0,255,255,0.08), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,166,0,0.08), transparent 35%)",
      }}
    >
      {/* Navigation */}
      <header className="border-b-3 border-border bg-card/80 backdrop-blur sticky top-0 z-50 shadow-[var(--shadow-brutal)]">
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-2 font-semibold rounded-md transition-colors",
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="brutal-button px-3 py-2 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Link to="/auth">
              <Button
                variant="outline"
                className="brutal-button border-border"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden">
          <button
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-72 bg-card border-l-3 border-border shadow-[var(--shadow-brutal-lg)] z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b-3 border-border">
              <Logo size="sm" />
              <Button
                variant="ghost"
                className="brutal-button px-3 py-2"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <ul className="flex flex-col">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center px-6 py-4 font-semibold border-b border-border/60 hover:bg-muted/40 transition-colors",
                        location.pathname === link.to && "text-primary"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-6 border-t-3 border-border space-y-3">
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button className="w-full brutal-button bg-primary text-primary-foreground">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="mt-20 bg-gradient-to-t from-background via-card/95 to-card/80 border-t border-border/60">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-primary/70 to-primary/0" />
            <p className="text-sm text-muted-foreground font-medium">
              © 2025 FinSightAi
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
            <span className="hidden sm:inline-flex h-px w-8 bg-gradient-to-r from-accent/0 via-accent/60 to-accent/0" />
            <span className="uppercase tracking-[0.25em]">
              For research & education only
            </span>
          </div>
        </div>
        <div className="border-t border-border/40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between text-[11px] text-muted-foreground/80">
            <span>Neo-noir analytics interface · FinSightAi</span>
            <span className="hidden sm:inline">
              Designed for investment teams, not as financial advice.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
