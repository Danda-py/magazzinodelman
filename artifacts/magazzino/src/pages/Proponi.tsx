import { useState, useRef } from "react";
import { useCreateProposal } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, Instagram } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any },
  },
};

const CATEGORIES = [
  "Giubbotti & Piumini",
  "Maglioni & Felpe",
  "Camicie",
  "T-Shirt & Polo",
  "Pantaloni & Jeans",
  "Scarpe & Sneakers",
  "Accessori",
  "Altro",
];

const CONDITIONS = [
  { value: "new_with_tags", label: "Nuovo con cartellino" },
  { value: "like_new", label: "Come nuovo (usato 1-2 volte)" },
  { value: "used", label: "Usato (buone condizioni)" },
];

export default function Proponi() {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    condition: "",
    desiredPayout: "",
    submitterEmail: "",
    submitterName: "",
    instagramHandle: "",
  });

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const createProposal = useCreateProposal();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: { file: File; preview: string }[] = [];
    Array.from(files)
      .slice(0, 5 - photos.length)
      .forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File troppo grande",
            description: `${file.name} supera 5MB`,
            variant: "destructive",
          });
          return;
        }
        newPhotos.push({ file, preview: URL.createObjectURL(file) });
      });
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const toDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.condition) {
      toast({
        title: "Condizione richiesta",
        description: "Seleziona le condizioni dell'articolo.",
        variant: "destructive",
      });
      return;
    }
    try {
      let imageUrl =
        "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1200";
      if (photos.length > 0) {
        imageUrl = await toDataUrl(photos[0].file);
      }
      await createProposal.mutateAsync({
        data: {
          itemName: formData.itemName,
          category: formData.category,
          desiredPayout: Number(formData.desiredPayout),
          submitterEmail: formData.submitterEmail,
          submitterName: formData.submitterName,
          imageUrl,
          // Extra fields passed through (accepted by API)
          ...(formData.instagramHandle
            ? { instagramHandle: formData.instagramHandle }
            : {}),
          ...(formData.condition ? { condition: formData.condition } : {}),
        } as any,
      });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile inviare la proposta. Riprova.",
        variant: "destructive",
      });
    }
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6 py-24"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 stroke-primary stroke-2 fill-none stroke-linecap-round stroke-linejoin-round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-serif">Proposta inviata</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Ti contatteremo via email o tramite chat sul sito, entro 24–48
                ore con la nostra valutazione.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    itemName: "",
                    category: "",
                    condition: "",
                    desiredPayout: "",
                    submitterEmail: "",
                    submitterName: "",
                    instagramHandle: "",
                  });
                  setPhotos([]);
                }}
              >
                Invia un'altra proposta
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="space-y-12"
            >
              <div>
                <h1 className="text-4xl font-serif">Proponi un Articolo</h1>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Vendi i tuoi capi di qualità tramite il nostro store.
                  Valutiamo ogni proposta e ti offriamo un payout equo.
                </p>
              </div>

              <motion.form
                onSubmit={handleSubmit}
                className="space-y-10"
                variants={fadeUp}
              >
                {/* ── Informazioni articolo ── */}
                <div className="space-y-6">
                  <h3 className="text-lg font-serif border-b border-border pb-3">
                    L'articolo
                  </h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Nome Articolo *
                    </label>
                    <Input
                      required
                      placeholder="Es. Giubbotto The North Face Tg. L"
                      value={formData.itemName}
                      onChange={set("itemName")}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Categoria *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={set("category")}
                        className="w-full h-11 border border-input bg-background text-foreground px-3 text-sm rounded-xl outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Seleziona categoria</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Condizioni *
                      </label>
                      <select
                        required
                        value={formData.condition}
                        onChange={set("condition")}
                        className="w-full h-11 border border-input bg-background text-foreground px-3 text-sm rounded-xl outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Seleziona condizione</option>
                        {CONDITIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Valore Desiderato (€) *
                    </label>
                    <Input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Es. 80"
                      value={formData.desiredPayout}
                      onChange={set("desiredPayout")}
                      className="rounded-xl h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      La cifra netta che vorresti ricevere. Noi gestiremo prezzo
                      e commissioni.
                    </p>
                  </div>
                </div>

                {/* ── Foto ── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-serif border-b border-border pb-3">
                    Foto dell'articolo
                  </h3>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {photos.map((p, i) => (
                        <div key={i} className="relative aspect-square">
                          <img
                            src={p.preview}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {photos.length < 5 && (
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 border border-dashed border-border rounded-xl px-5 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Upload size={16} /> Carica foto
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-2 border border-dashed border-border rounded-xl px-5 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors md:hidden"
                      >
                        <Camera size={16} /> Fotocamera
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Max 5 foto · max 5 MB ciascuna. La prima sarà la foto
                    principale.
                  </p>
                </div>

                {/* ── Dati personali ── */}
                <div className="space-y-6">
                  <h3 className="text-lg font-serif border-b border-border pb-3">
                    I tuoi dati
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Nome Completo *
                      </label>
                      <Input
                        required
                        placeholder="Mario Rossi"
                        value={formData.submitterName}
                        onChange={set("submitterName")}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Email *
                      </label>
                      <Input
                        type="email"
                        required
                        placeholder="mario@esempio.com"
                        value={formData.submitterEmail}
                        onChange={set("submitterEmail")}
                        className="rounded-xl h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        *Inserisci la stessa mail con la quale hai effettuato il
                        login
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Instagram size={12} /> Instagram *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        @
                      </span>
                      <Input
                        placeholder="tuonomeutente"
                        value={formData.instagramHandle}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            instagramHandle: e.target.value.replace(/^@/, ""),
                          }))
                        }
                        className="rounded-xl h-11 pl-7"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-base uppercase tracking-widest font-bold rounded-xl"
                  disabled={createProposal.isPending}
                >
                  {createProposal.isPending ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      Invio in corso…
                    </motion.span>
                  ) : (
                    "Invia Proposta"
                  )}
                </Button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
