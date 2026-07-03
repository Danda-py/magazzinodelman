import { useState } from "react";
import {
  useListProposals,
  useListProducts,
  useAcceptProposal,
  useRejectProposal,
  useCreateProduct,
  useDeleteProduct,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Check, X, Trash2, Plus, Instagram } from "lucide-react";

const CONDITION_LABELS: Record<string, string> = {
  new_with_tags: "Nuovo con cartellino",
  like_new: "Come nuovo",
  used: "Usato",
};

export default function Inventory() {
  const [tab, setTab] = useState<"inventory" | "proposals">("proposals");
  const { data: proposals = [], isLoading: pLoading } = useListProposals();
  // No inStock filter → returns all products (available + sold) for admin view
  const { data: products = [], isLoading: prLoading } = useListProducts();
  const accept = useAcceptProposal();
  const reject = useRejectProposal();
  const createProduct = useCreateProduct();
  const delProduct = useDeleteProduct();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Accept modal
  const [showAccept, setShowAccept] = useState(false);
  const [activeProposal, setActiveProposal] = useState<any>(null);
  const [commType, setCommType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [commValue, setCommValue] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Add product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    brand: "",
    color: "",
    category: "",
    condition: "like_new",
    imageUrl: "",
    commissionType: "percentage" as "percentage" | "fixed",
    commissionValue: "",
  });

  const handleAccept = async () => {
    if (!activeProposal) return;
    try {
      await accept.mutateAsync({
        id: activeProposal.id,
        data: {
          commissionType: commType,
          commissionValue: Number(commValue),
          adminNotes: adminNotes || undefined,
        },
      });
      setShowAccept(false);
      setActiveProposal(null);
      setCommValue("");
      setAdminNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({
        title: "Proposta accettata",
        description: "La chat è ora disponibile.",
      });
    } catch (e: any) {
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reject.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      toast({ title: "Proposta rifiutata" });
    } catch (e: any) {
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Eliminare questo prodotto?")) return;
    try {
      await delProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Prodotto eliminato" });
    } catch {
      toast({ title: "Errore", variant: "destructive" });
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        data: {
          title: newProduct.title,
          description: newProduct.description || undefined,
          price: Number(newProduct.price),
          originalPrice: newProduct.originalPrice
            ? Number(newProduct.originalPrice)
            : undefined,
          brand: newProduct.brand || undefined,
          color: newProduct.color || undefined,
          category: newProduct.category,
          condition: newProduct.condition as any,
          imageUrl: newProduct.imageUrl || undefined,
          commissionType: newProduct.commissionType,
          commissionValue: newProduct.commissionValue
            ? Number(newProduct.commissionValue)
            : undefined,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Prodotto aggiunto allo store" });
      setShowAddProduct(false);
      setNewProduct({
        title: "",
        description: "",
        price: "",
        originalPrice: "",
        brand: "",
        color: "",
        category: "",
        condition: "like_new",
        imageUrl: "",
        commissionType: "percentage",
        commissionValue: "",
      });
    } catch (e: any) {
      toast({
        title: "Errore",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Inventario & Proposte</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci stock e richieste clienti.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tab === "inventory" && (
            <Button
              size="sm"
              className="gap-2 text-xs"
              onClick={() => setShowAddProduct(true)}
            >
              <Plus size={14} /> Aggiungi Prodotto
            </Button>
          )}
          <div className="flex bg-muted p-1 rounded-md">
            <button
              className={`px-5 py-2 text-sm font-medium rounded-sm transition-colors ${tab === "proposals" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setTab("proposals")}
            >
              Proposte ({proposals.filter((p) => p.status === "pending").length}
              )
            </button>
            <button
              className={`px-5 py-2 text-sm font-medium rounded-sm transition-colors ${tab === "inventory" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setTab("inventory")}
            >
              Prodotti ({products.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── Proposals tab ── */}
      {tab === "proposals" && (
        <div className="bg-card border border-border shadow-sm overflow-x-auto">
          {pLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Caricamento…
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-bold">Data</th>
                  <th className="p-4 font-bold">Articolo</th>
                  <th className="p-4 font-bold">Cliente</th>
                  <th className="p-4 font-bold">Condizioni</th>
                  <th className="p-4 font-bold">Payout</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {proposals.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="p-4 font-medium">
                      {p.itemName}
                      <br />
                      <span className="text-xs text-muted-foreground font-normal">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{p.submitterName}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.submitterEmail}
                      </div>
                      {(p as any).instagramHandle && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Instagram size={10} />
                          {(p as any).instagramHandle}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {(p as any).condition
                        ? (CONDITION_LABELS[(p as any).condition] ??
                          (p as any).condition)
                        : "—"}
                    </td>
                    <td className="p-4 font-mono font-bold">
                      €{Number(p.desiredPayout).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-sm ${
                          p.status === "pending"
                            ? "bg-amber-500/10 text-amber-600"
                            : p.status === "accepted"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {p.status === "pending"
                          ? "In attesa"
                          : p.status === "accepted"
                            ? "Accettata"
                            : "Rifiutata"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Chat link — uses <a> to escape the nested /admin router */}
                        {(p.status === "accepted" ||
                          p.status === "pending") && (
                          <a
                            href={`/chat/${p.id}`}
                            className="text-primary hover:bg-muted p-2 rounded-full inline-flex"
                            title="Apri Chat"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setActiveProposal(p);
                                setShowAccept(true);
                              }}
                              className="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors"
                              title="Accetta"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors"
                              title="Rifiuta"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!pLoading && proposals.length === 0 && (
            <p className="text-center p-8 text-muted-foreground">
              Nessuna proposta ricevuta.
            </p>
          )}
        </div>
      )}

      {/* ── Inventory tab ── */}
      {tab === "inventory" && (
        <div className="bg-card border border-border shadow-sm overflow-x-auto">
          {prLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              Caricamento…
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50">
                <tr className="text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-bold">Articolo</th>
                  <th className="p-4 font-bold">Brand</th>
                  <th className="p-4 font-bold">Condizione</th>
                  <th className="p-4 font-bold">Prezzo</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-4 font-medium">{p.title}</td>
                    <td className="p-4 capitalize text-muted-foreground">
                      {p.brand ?? "—"}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {p.condition
                        ? (CONDITION_LABELS[p.condition] ?? p.condition)
                        : "—"}
                    </td>
                    <td className="p-4 font-mono font-bold">
                      €{Number(p.price).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-sm ${
                          p.inStock
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.inStock ? "Disponibile" : "Venduto"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-destructive hover:bg-destructive/10 p-2 rounded-full transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!prLoading && products.length === 0 && (
            <p className="text-center p-8 text-muted-foreground">
              Nessun prodotto. Clicca "Aggiungi Prodotto" per iniziare.
            </p>
          )}
        </div>
      )}

      {/* ── Accept proposal modal ── */}
      {showAccept && activeProposal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border p-6 max-w-md w-full shadow-2xl rounded-xl">
            <h3 className="font-serif text-2xl mb-1">Accetta Proposta</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Imposta la commissione per{" "}
              <strong>{activeProposal.itemName}</strong>.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Tipo Commissione
                </label>
                <select
                  className="w-full h-11 border border-input bg-background text-foreground px-3 py-1 text-sm rounded-lg outline-none focus:ring-1 focus:ring-primary"
                  value={commType}
                  onChange={(e) => setCommType(e.target.value as any)}
                >
                  <option value="percentage">Percentuale (%)</option>
                  <option value="fixed">Valore Fisso (EUR)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Valore
                </label>
                <Input
                  type="number"
                  value={commValue}
                  onChange={(e) => setCommValue(e.target.value)}
                  placeholder={commType === "percentage" ? "Es. 15" : "Es. 50"}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Note Admin (opzionale)
                </label>
                <Input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Note per il venditore…"
                  className="rounded-lg"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAccept(false);
                    setActiveProposal(null);
                  }}
                >
                  Annulla
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAccept}
                  disabled={!commValue || accept.isPending}
                >
                  {accept.isPending ? "Salvataggio…" : "Accetta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add product modal ── */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border p-6 max-w-lg w-full shadow-2xl rounded-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl mb-1">Aggiungi Prodotto</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Inserisci il nuovo articolo nello store.
            </p>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Titolo *
                  </label>
                  <Input
                    required
                    placeholder="Es. Giubbotto Moncler Tg. L"
                    value={newProduct.title}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, title: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Prezzo (€) *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Es. 120"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, price: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Prezzo Originale (€)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Es. 350"
                    value={newProduct.originalPrice}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        originalPrice: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Brand
                  </label>
                  <Input
                    placeholder="Es. Moncler"
                    value={newProduct.brand}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, brand: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Categoria *
                  </label>
                  <Input
                    required
                    placeholder="Es. Giubbotti"
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, category: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Condizione
                  </label>
                  <select
                    className="w-full h-10 border border-input bg-background text-foreground px-3 text-sm rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={newProduct.condition}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        condition: e.target.value,
                      }))
                    }
                  >
                    <option value="new_with_tags">Nuovo con cartellino</option>
                    <option value="like_new">Come nuovo</option>
                    <option value="used">Usato</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Colore
                  </label>
                  <Input
                    placeholder="Es. Nero"
                    value={newProduct.color}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, color: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    URL Immagine
                  </label>
                  <Input
                    placeholder="https://…"
                    value={newProduct.imageUrl}
                    onChange={(e) =>
                      setNewProduct((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Descrizione
                  </label>
                  <Input
                    placeholder="Descrizione articolo…"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Tipo Commissione
                  </label>
                  <select
                    className="w-full h-10 border border-input bg-background text-foreground px-3 text-sm rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={newProduct.commissionType}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        commissionType: e.target.value as any,
                      }))
                    }
                  >
                    <option value="percentage">Percentuale (%)</option>
                    <option value="fixed">Valore Fisso (€)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Valore Commissione
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={
                      newProduct.commissionType === "percentage"
                        ? "Es. 15"
                        : "Es. 30"
                    }
                    value={newProduct.commissionValue}
                    onChange={(e) =>
                      setNewProduct((p) => ({
                        ...p,
                        commissionValue: e.target.value,
                      }))
                    }
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddProduct(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createProduct.isPending}
                >
                  {createProduct.isPending ? "Salvataggio…" : "Aggiungi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
