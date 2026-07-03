import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@workspace/api-client-react';

interface CartContextType {
  items: Product[];
  addItem: (item: Product) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (item: Product) => {
    setItems((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((acc, item) => acc + item.price, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, isOpen, setIsOpen, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
