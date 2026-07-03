import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { MessageCircle, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface Proposal {
  id: number;
  itemName: string;
  category: string;
  status: "pending" | "accepted" | "rejected";
  desiredPayout: string;
  submitterName: string;
  submitterEmail: string;
  imageUrl: string | null;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: EASE },
  }),
};

const statusConfig = {
  pending: { label: "In attesa", Icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  accepted: { label: "Accettata", Icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  rejected: { label: "Rifiutata", Icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

export default function MieChat() {
  const { user, isLoading: authLoading } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auth still resolving — wait
    if (authLoading) return;

    // Auth done but no user — show login prompt immediately
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(`${BASE}/api/proposals/my`, { credentials: "include" })
      .then(async res => {
        if (!res.ok) throw new Error("Impossibile caricare le proposte");
        return res.json();
      })
      .then(data => {
        setProposals(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <MessageCircle size={48} className="text-muted-foreground opacity-40" />
          <h2 className="text-2xl font-serif">Accedi per vedere le tue chat</h2>
          <Link href="/login"><Button className="rounded-xl">Accedi</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  // pending + accepted → chat aperta; solo rejected → sezione separata
  const chatOpen = proposals.filter(p => p.status !== "rejected");
  const rejected = proposals.filter(p => p.status === "rejected");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <span className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">Le tue proposte</span>
          <h1 className="text-4xl md:text-5xl font-serif mt-3">Le mie Chat</h1>
          <p className="text-muted-foreground font-light mt-3">
            Tratta direttamente con noi — la chat è aperta fin dall'invio della proposta.
          </p>
        </motion.div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive mb-8">
            {error}
          </div>
        )}

        {proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-24 space-y-6"
          >
            <MessageCircle size={56} className="text-muted-foreground opacity-25 mx-auto" />
            <h2 className="text-2xl font-serif text-muted-foreground">Nessuna proposta ancora</h2>
            <p className="text-muted-foreground font-light">
              Proponi il tuo primo articolo e potrai chattare con noi!
            </p>
            <Link href="/proponi">
              <Button className="rounded-xl" size="lg">Vendi un articolo →</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* Pending + accettate — con chat attiva */}
            {chatOpen.length > 0 && (
              <div>
                <h2 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-4">Chat attive</h2>
                <div className="space-y-4">
                  {chatOpen.map((p, i) => {
                    const { label, Icon, color, bg } = statusConfig[p.status];
                    return (
                      <motion.div
                        key={p.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {p.imageUrl && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                              <img src={p.imageUrl} alt={p.itemName} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium truncate">{p.itemName}</h3>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${color}`}>
                                <Icon size={11} /> {label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{p.category}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Valore richiesto: <span className="font-mono">€{Number(p.desiredPayout).toFixed(2)}</span>
                            </p>
                          </div>
                          <Link href={`/chat/${p.id}`}>
                            <Button size="sm" className="rounded-xl flex-shrink-0 gap-1.5">
                              <MessageCircle size={14} /> Chatta <ArrowRight size={13} />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rifiutate */}
            {rejected.length > 0 && (
              <div>
                <h2 className="text-sm font-mono tracking-widest uppercase text-muted-foreground mb-4">Proposte rifiutate</h2>
                <div className="space-y-3">
                  {rejected.map((p, i) => {
                    const { label, Icon, color, bg } = statusConfig[p.status];
                    return (
                      <motion.div
                        key={p.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        className="bg-card border border-border rounded-2xl p-4 opacity-70"
                      >
                        <div className="flex items-center gap-3">
                          {p.imageUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                              <img src={p.imageUrl} alt={p.itemName} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{p.itemName}</span>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${color}`}>
                                <Icon size={11} /> {label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
