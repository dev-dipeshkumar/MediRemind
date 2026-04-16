import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BarChart3, Bell, LayoutDashboard, Pill, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import MedicineSearch from "./pages/MedicineSearch";
import Reminders from "./pages/Reminders";

type Tab = "dashboard" | "reminders" | "search" | "history";

export default function App() {
  const { login, clear, isLoginSuccess, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Pill className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
              <Pill className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              MediRemind
            </h1>
            <p className="text-muted-foreground">
              Smart medicine reminders on the Internet Computer
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to access your personalized medicine reminders, track your
              doses, and view health analytics.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs">
                  ✓
                </span>
                Persistent data across devices
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs">
                  ✓
                </span>
                Dose tracking &amp; streak rewards
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs">
                  ✓
                </span>
                AI-powered medicine information
              </div>
            </div>
            <Button
              data-ocid="login.primary_button"
              className="w-full"
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Connecting..." : "Sign In"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Powered by Internet Identity
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Home",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    { id: "reminders", label: "Reminders", icon: <Bell className="w-5 h-5" /> },
    { id: "search", label: "Search", icon: <Search className="w-5 h-5" /> },
    {
      id: "history",
      label: "History",
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toaster />
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-foreground">MediRemind</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="app.toggle"
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            type="button"
            data-ocid="app.secondary_button"
            onClick={clear}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "reminders" && <Reminders />}
            {activeTab === "search" && <MedicineSearch />}
            {activeTab === "history" && <History />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
