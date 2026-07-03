import { useCart } from "@/lib/cart";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ArrowRight, CheckCircle2, User, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulateCheckout } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Step = 'cart' | 'info' | 'payment' | 'success';

interface BuyerInfo {
  firstName: string;
  lastName: string;
  instagram: string;
  email: string;
}

const StepIndicator = ({ current }: { current: Step }) => {
  const steps: { key: Step; label: string; Icon: any }[] = [
    { key: 'cart', label: 'Carrello', Icon: ShoppingBag },
    { key: 'info', label: 'Dati', Icon: User },
    { key: 'payment', label: 'Pagamento', Icon: CreditCard },
  ];
  const idx = steps.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'}`}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-px w-6 ${done ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        );
      })}
    </div>
  );
};

export function CartPanel() {
  const { items, isOpen, setIsOpen, removeItem, total, clearCart } = useCart();
  const checkout = useSimulateCheckout();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('cart');
  const [buyer, setBuyer] = useState<BuyerInfo>({ firstName: '', lastName: '', instagram: '', email: '' });
  const [card, setCard] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');

  const closeCart = () => {
    setIsOpen(false);
    setTimeout(() => setStep('cart'), 400);
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;

    try {
      // Process each item in the cart
      for (const item of items) {
        await checkout.mutateAsync({
          data: {
            productId: item.id,
            cardNumber: card,
            expiryMonth: parseInt(expMonth),
            expiryYear: parseInt(expYear),
            cvc,
            amountCents: Math.round(item.price * 100),
            buyerEmail: buyer.email || undefined,
            buyerName: `${buyer.firstName} ${buyer.lastName}`.trim() || undefined,
          },
        });
      }
      setStep('success');
      clearCart();
    } catch (err: any) {
      toast({
        title: "Errore di pagamento",
        description: err.message || "Controlla i dati della carta e riprova.",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col rounded-l-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-serif text-2xl">
                {step === 'cart' && 'Carrello'}
                {step === 'info' && 'I tuoi dati'}
                {step === 'payment' && 'Pagamento'}
                {step === 'success' && 'Completato!'}
              </h2>
              <button onClick={closeCart} className="p-2 hover:bg-muted rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Step indicator */}
              {step !== 'success' && step !== 'cart' && <StepIndicator current={step} />}

              <AnimatePresence mode="wait">
                {/* CART */}
                {step === 'cart' && (
                  <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {items.length === 0 ? (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                        <ShoppingBag size={40} className="opacity-30" />
                        <p>Il tuo carrello è vuoto.</p>
                        <Button variant="outline" onClick={closeCart} className="rounded-xl">Torna allo store</Button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {items.map(item => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            className="flex gap-4 border-b border-border pb-5"
                          >
                            <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                              {item.imageUrl
                                ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-secondary" />
                              }
                            </div>
                            <div className="flex-1 flex flex-col">
                              <h3 className="font-medium leading-tight">{item.title}</h3>
                              <p className="text-sm text-muted-foreground capitalize mt-1">{item.brand} · {item.condition.replace(/_/g, ' ')}</p>
                              <div className="mt-auto flex items-center justify-between">
                                <span className="font-mono font-bold">€{item.price.toFixed(2)}</span>
                                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* INFO */}
                {step === 'info' && (
                  <motion.form
                    key="info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleInfoSubmit}
                    id="info-form"
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome</label>
                        <Input required value={buyer.firstName} onChange={e => setBuyer(b => ({ ...b, firstName: e.target.value }))} placeholder="Mario" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cognome</label>
                        <Input required value={buyer.lastName} onChange={e => setBuyer(b => ({ ...b, lastName: e.target.value }))} placeholder="Rossi" className="rounded-xl h-11" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username Instagram</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                        <Input required value={buyer.instagram} onChange={e => setBuyer(b => ({ ...b, instagram: e.target.value }))} placeholder="tuousername" className="rounded-xl h-11 pl-7" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                      <Input type="email" required value={buyer.email} onChange={e => setBuyer(b => ({ ...b, email: e.target.value }))} placeholder="mario@esempio.com" className="rounded-xl h-11" />
                      <p className="text-xs text-muted-foreground">La fattura verrà inviata a questo indirizzo.</p>
                    </div>
                  </motion.form>
                )}

                {/* PAYMENT */}
                {step === 'payment' && (
                  <motion.form
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleCheckout}
                    id="payment-form"
                    className="space-y-5"
                  >
                    <div className="p-4 bg-muted/40 rounded-xl text-sm text-muted-foreground">
                      Fattura per: <span className="text-foreground font-medium">{buyer.firstName} {buyer.lastName}</span>
                      <br />
                      Invio a: <span className="text-foreground font-medium">{buyer.email}</span>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Numero Carta</label>
                      <Input required value={card} onChange={e => setCard(e.target.value)} placeholder="4242 4242 4242 4242" className="rounded-xl h-11 font-mono" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">MM</label>
                        <Input required maxLength={2} value={expMonth} onChange={e => setExpMonth(e.target.value)} placeholder="12" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AA</label>
                        <Input required maxLength={2} value={expYear} onChange={e => setExpYear(e.target.value)} placeholder="27" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CVC</label>
                        <Input required maxLength={3} value={cvc} onChange={e => setCvc(e.target.value)} placeholder="123" className="rounded-xl h-11" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Usa carta test: 4242 4242 4242 4242</p>
                  </motion.form>
                )}

                {/* SUCCESS */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center space-y-6 text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 size={40} className="text-primary" />
                    </motion.div>
                    <h3 className="font-serif text-2xl">Pagamento Riuscito!</h3>
                    <p className="text-muted-foreground">
                      Grazie <span className="font-medium text-foreground">{buyer.firstName}</span>! 🎉<br />
                      La fattura è stata inviata a<br />
                      <span className="font-mono text-sm text-primary">{buyer.email}</span>
                    </p>
                    <Button onClick={closeCart} className="w-full rounded-xl" size="lg">Continua lo Shopping</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer CTA */}
            {items.length > 0 && step !== 'success' && (
              <div className="p-6 border-t border-border bg-muted/20">
                {step === 'cart' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted-foreground">Totale</span>
                      <span className="font-mono text-xl font-bold">€{total.toFixed(2)}</span>
                    </div>
                    <Button className="w-full h-13 text-base rounded-xl" onClick={() => setStep('info')}>
                      Procedi <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
                {step === 'info' && (
                  <Button type="submit" form="info-form" className="w-full h-12 rounded-xl">
                    Continua al Pagamento <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {step === 'payment' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-muted-foreground">Totale</span>
                      <span className="font-mono text-xl font-bold">€{total.toFixed(2)}</span>
                    </div>
                    <Button type="submit" form="payment-form" className="w-full h-13 text-base rounded-xl" disabled={checkout.isPending}>
                      {checkout.isPending
                        ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>Elaborazione...</motion.span>
                        : `Paga €${total.toFixed(2)}`
                      }
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
