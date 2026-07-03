import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Filter, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Store() {
  const [filters, setFilters] = useState({
    brand: "",
    condition: "",
    minPrice: "",
    maxPrice: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: products = [], isLoading } = useListProducts();
  const { addItem, items } = useCart();

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.inStock) return false;
      if (filters.brand && p.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
      if (filters.condition && p.condition !== filters.condition) return false;
      if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [products, filters]);

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))), [products]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center">
          <h1 className="text-3xl font-serif">Collezione</h1>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" /> Filtri
          </Button>
        </div>

        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0 space-y-10`}>
          <div className="hidden md:block">
            <h1 className="text-4xl font-serif mb-2">Store</h1>
            <p className="text-muted-foreground font-light">Pezzi unici, prezzi imbattibili.</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-4 border-b border-border pb-2">Brand</h3>
              <div className="space-y-2">
                <button 
                  className={`block text-sm ${filters.brand === '' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setFilters(f => ({ ...f, brand: '' }))}
                >
                  Tutti
                </button>
                {brands.map(brand => (
                  <button 
                    key={brand}
                    className={`block text-sm ${filters.brand === brand ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setFilters(f => ({ ...f, brand: brand as string }))}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-4 border-b border-border pb-2">Condizione</h3>
              <div className="space-y-2 text-sm">
                {[
                  { id: '', label: 'Qualsiasi' },
                  { id: 'new_with_tags', label: 'Nuovo con cartellino' },
                  { id: 'like_new', label: 'Come nuovo' },
                  { id: 'used', label: 'Usato' }
                ].map(cond => (
                  <button 
                    key={cond.id}
                    className={`block ${filters.condition === cond.id ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setFilters(f => ({ ...f, condition: cond.id }))}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold tracking-widest uppercase mb-4 border-b border-border pb-2">Prezzo</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                />
                <span className="text-muted-foreground">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="aspect-[4/5] bg-muted w-full" />
                  <div className="h-4 bg-muted w-2/3" />
                  <div className="h-4 bg-muted w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              <p className="text-xl font-serif">Nessun prodotto trovato.</p>
              <Button variant="link" onClick={() => setFilters({ brand: "", condition: "", minPrice: "", maxPrice: "" })}>
                Rimuovi filtri
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {filteredProducts.map((product, i) => {
                const inCart = items.some(item => item.id === product.id);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={product.id} 
                    className="group flex flex-col"
                  >
                    <Link href={`/store/${product.id}`} className="block aspect-[4/5] bg-muted relative overflow-hidden mb-4">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-mono">No Image</div>
                      )}
                      {product.condition === 'new_with_tags' && (
                        <div className="absolute top-4 left-4 bg-background text-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                          Nuovo
                        </div>
                      )}
                    </Link>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-base group-hover:text-primary transition-colors">
                          <Link href={`/store/${product.id}`}>{product.title}</Link>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{product.brand}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-base">€{product.price.toFixed(2)}</p>
                        {product.originalPrice && (
                          <p className="font-mono text-xs text-muted-foreground line-through">€{product.originalPrice.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant={inCart ? "secondary" : "outline"} 
                      className="w-full mt-4 rounded-none h-12 text-xs uppercase tracking-widest font-bold"
                      onClick={() => !inCart && addItem(product)}
                      disabled={inCart}
                    >
                      {inCart ? "Nel Carrello" : "Aggiungi"}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
