import { useParams, Link } from "wouter";
import { useGetProduct, getGetProductQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  
  const { data: product, isLoading, isError } = useGetProduct(id, { query: { enabled: !!id, queryKey: getGetProductQueryKey(id) } });
  const { addItem, items } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-serif">Prodotto non trovato.</h1>
          <Link href="/store" className="text-primary hover:underline">Torna allo store</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const inCart = items.some(item => item.id === product.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <Link href="/store" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Torna alla collezione
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="aspect-[3/4] bg-muted w-full relative"
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Immagine non disponibile</div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col space-y-8 sticky top-32"
          >
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-2">{product.brand}</p>
              <h1 className="text-4xl md:text-5xl font-serif leading-tight">{product.title}</h1>
              
              <div className="mt-6 flex items-baseline gap-4">
                <span className="font-mono text-3xl font-bold">€{product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="font-mono text-lg text-muted-foreground line-through">€{product.originalPrice.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold tracking-widest uppercase mb-2">Descrizione</h3>
                <p className="text-muted-foreground leading-relaxed font-light">
                  {product.description || "Nessuna descrizione disponibile per questo articolo."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Condizione</span>
                  <span className="font-medium capitalize">{product.condition.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Colore</span>
                  <span className="font-medium capitalize">{product.color || 'N/D'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Categoria</span>
                  <span className="font-medium capitalize">{product.category || 'N/D'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Disponibilità</span>
                  <span className="font-medium">{product.inStock ? 'In magazzino (Pezzo Unico)' : 'Esaurito'}</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button 
                size="lg" 
                className="w-full h-16 text-base uppercase tracking-widest font-bold"
                onClick={() => !inCart && addItem(product)}
                disabled={!product.inStock || inCart}
              >
                {!product.inStock ? "Esaurito" : inCart ? "Nel Carrello" : "Aggiungi al Carrello"}
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-6 border-t border-border text-xs text-muted-foreground font-mono">
              <span>✓ Spedizione Gratuita in Italia</span>
              <span>✓ Autenticità Garantita</span>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
