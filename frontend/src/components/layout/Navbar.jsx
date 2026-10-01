import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Menu, X, LogOut, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui";

const PUBLIC_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Services", href: "#services" },
  { label: "AI Assistant", href: "#ai" },
];

const APP_LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Documents", to: "/documents" },
  { label: "Payments", to: "/payments" },
  { label: "Grievances", to: "/grievances" },
  { label: "Profile", to: "/profile" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className={`theme-toggle ${theme}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle-knob">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const links = isAuthenticated ? APP_LINKS : PUBLIC_LINKS;

  return (
    <motion.header
      initial={{ y: -70 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong shadow-lg shadow-black/20" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="rounded-xl bg-navy-500 p-2 glow-navy">
            <Landmark size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Civic<span className="text-saffron-500">Connect</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) =>
            l.to ? (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors ${
                  pathname === l.to
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <Bell size={18} />
              </Link>
              <span className="text-sm text-slate-400">
                {user?.fullName?.split(" ")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={15} />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="saffron" size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 text-slate-300 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-strong overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((l) =>
                l.to ? (
                  <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                    {l.label}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                    {l.label}
                  </a>
                )
              )}
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <ThemeToggle />
                {isAuthenticated ? (
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1">
                    Log out
                  </Button>
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button variant="saffron" size="sm" className="w-full">Get started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
