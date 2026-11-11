import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CartItem, MenuItem, Modifier } from '@/types/menu';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { menuItem: MenuItem; quantity: number; modifiers: Modifier[]; instructions?: string } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; modifiers: Modifier[] } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; modifiers: Modifier[]; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const getCartItemKey = (itemId: string, modifiers: Modifier[]): string => {
  const modifierIds = modifiers.map(m => m.id).sort().join('-');
  return `${itemId}:${modifierIds}`;
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { menuItem, quantity, modifiers, instructions } = action.payload;
      const itemKey = getCartItemKey(menuItem.id, modifiers);
      
      const existingIndex = state.items.findIndex(
        item => getCartItemKey(item.menuItem.id, item.selectedModifiers) === itemKey
      );

      if (existingIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity,
          specialInstructions: instructions || updatedItems[existingIndex].specialInstructions,
        };
        return { ...state, items: updatedItems };
      }

      return {
        ...state,
        items: [
          ...state.items,
          { menuItem, quantity, selectedModifiers: modifiers, specialInstructions: instructions },
        ],
      };
    }

    case 'REMOVE_ITEM': {
      const itemKey = getCartItemKey(action.payload.itemId, action.payload.modifiers);
      return {
        ...state,
        items: state.items.filter(
          item => getCartItemKey(item.menuItem.id, item.selectedModifiers) !== itemKey
        ),
      };
    }

    case 'UPDATE_QUANTITY': {
      const itemKey = getCartItemKey(action.payload.itemId, action.payload.modifiers);
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            item => getCartItemKey(item.menuItem.id, item.selectedModifiers) !== itemKey
          ),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          getCartItemKey(item.menuItem.id, item.selectedModifiers) === itemKey
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'SET_CART_OPEN':
      return { ...state, isOpen: action.payload };

    case 'LOAD_CART':
      return { ...state, items: action.payload };

    default:
      return state;
  }
};

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (menuItem: MenuItem, quantity?: number, modifiers?: Modifier[], instructions?: string) => void;
  removeItem: (itemId: string, modifiers?: Modifier[]) => void;
  updateQuantity: (itemId: string, modifiers: Modifier[], quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);


export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('myukchef-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (e) {
        console.error('Failed to load cart from localStorage', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('myukchef-cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (
    menuItem: MenuItem,
    quantity = 1,
    modifiers: Modifier[] = [],
    instructions?: string
  ) => {
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity, modifiers, instructions } });
  };

  const removeItem = (itemId: string, modifiers: Modifier[] = []) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, modifiers } });
  };

  const updateQuantity = (itemId: string, modifiers: Modifier[], quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, modifiers, quantity } });
  };

  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const setCartOpen = (open: boolean) => dispatch({ type: 'SET_CART_OPEN', payload: open });

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = state.items.reduce((sum, item) => {
    const itemPrice = item.menuItem.price;
    const modifiersPrice = item.selectedModifiers.reduce((m, mod) => m + mod.price, 0);
    return sum + (itemPrice + modifiersPrice) * item.quantity;
  }, 0);

  // Same defaults and rules as the server, which has the final say on the total.
  const { data: settings } = useQuery<any>({ queryKey: ['site-settings'], queryFn: () => api.get('/settings'), staleTime: 300_000 });
  const delivery = settings?.delivery_config ?? {};
  const fee = Number(delivery.fee ?? 3.99);
  const freeOver = Number(delivery.freeOver ?? 0);
  const serviceFee = subtotal * (Number(delivery.serviceFeePercent ?? 10) / 100);
  const deliveryFee = subtotal === 0 || (freeOver > 0 && subtotal >= freeOver) ? 0 : fee;
  const total = subtotal + serviceFee + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        setCartOpen,
        itemCount,
        subtotal,
        deliveryFee,
        serviceFee,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
