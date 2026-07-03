import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

type Screen = "login" | "register" | "otp";

const cardVariants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function Login() {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { refetch } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });

  // Read ?error= from Google OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      toast({
        title: "Errore Google",
        description: err === "google_not_configured"
          ? "Google OAuth non configurato. Aggiungi GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET."
          : "Accesso con Google fallito. Riprova.",
        variant: "destructive",
      });
    }
  }, []);

  const apiPost = async (path: string, body: object) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Errore ${res.status}`);
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/login", { email, password });
      if (data.requiresOtp) {
        toast({ title: "Codice inviato", description: "Controlla la tua email (o i log del server in sviluppo)." });
        setScreen("otp");
      }
    } catch (err: any) {
      toast({ title: "Accesso negato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiPost("/api/auth/register", { email, password, name });
      if (data.requiresOtp) {
        toast({ title: "Account creato!", description: "Controlla la tua email per il codice di verifica." });
        setScreen("otp");
      }
    } catch (err: any) {
      toast({ title: "Registrazione fallita", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await apiPost("/api/auth/verify-otp", { code: otpCode });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await refetch();
      setLocation(user.role === "admin" ? "/admin/dashboard" : "/store");
    } catch (err: any) {
      toast({ title: "Verifica fallita", description: err.message, variant: "destructive" });
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const SharedCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <motion.div
      key={screen}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl"
    >
      <div className="text-center mb-8">
        <div className="font-serif text-xl mb-1 tracking-wide">IL MAGAZZINO DEL MAN</div>
        <h1 className="text-3xl font-serif mt-4">{title}</h1>
        <p className="text-muted-foreground mt-2 font-light text-sm">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">

          {/* ─── OTP Screen ─── */}
          {screen === "otp" && (
            <SharedCard
              title="Verifica identità"
              subtitle={`Inserisci il codice a 6 cifre inviato a ${email}`}
            >
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Codice OTP
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="h-14 rounded-xl text-center text-2xl tracking-[0.4em] font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    In sviluppo il codice appare nei log del server API.
                  </p>
                </div>
                <Button type="submit" className="w-full h-12 uppercase tracking-widest font-bold rounded-xl" disabled={loading || otpCode.length !== 6}>
                  {loading ? "Verifica…" : "Conferma"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setScreen("login"); setOtpCode(""); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Torna al login
                </button>
              </form>
            </SharedCard>
          )}

          {/* ─── Login Screen ─── */}
          {screen === "login" && (
            <SharedCard title="Accedi" subtitle="Inserisci le tue credenziali per continuare.">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.com" className="h-12 rounded-xl" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 rounded-xl" autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full h-12 uppercase tracking-widest font-bold rounded-xl" disabled={loading}>
                  {loading ? "Accesso…" : "Accedi"}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">oppure</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Google */}
                <Button type="button" variant="outline" className="w-full h-12 rounded-xl gap-3" onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Accedi con Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Non hai un account?{" "}
                  <button type="button" onClick={() => setScreen("register")} className="font-medium text-foreground hover:underline">
                    Registrati
                  </button>
                </p>
              </form>
            </SharedCard>
          )}

          {/* ─── Register Screen ─── */}
          {screen === "register" && (
            <SharedCard title="Crea account" subtitle="Registrati per accedere allo store e inviare proposte.">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome (opzionale)</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mario Rossi" className="h-12 rounded-xl" autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.com" className="h-12 rounded-xl" autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 caratteri" className="h-12 rounded-xl" autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full h-12 uppercase tracking-widest font-bold rounded-xl" disabled={loading}>
                  {loading ? "Registrazione…" : "Crea account"}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">oppure</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button type="button" variant="outline" className="w-full h-12 rounded-xl gap-3" onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Registrati con Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Hai già un account?{" "}
                  <button type="button" onClick={() => setScreen("login")} className="font-medium text-foreground hover:underline">
                    Accedi
                  </button>
                </p>
              </form>
            </SharedCard>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
