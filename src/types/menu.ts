export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  tags: Tag[];
  allergens: Allergen[];
  calories?: number;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isHalal?: boolean;
  isPopular?: boolean;
  isSoldOut?: boolean;
  modifiers?: Modifier[];
  chef?: { id: number; displayName: string; avatar?: string | null; openNow?: boolean; paused?: boolean; nextOpen?: string | null; prepTime?: { min: number; max: number } | null } | null;
  /** Hours of warning the chef needs for this dish. */
  noticeHours?: number;
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  type: 'add' | 'remove' | 'substitute';
}

export type Category = 'mains' | 'sides' | 'drinks' | 'desserts' | 'deals';

export type Tag = 'spicy' | 'mild' | 'sweet' | 'savory' | 'comfort' | 'healthy' | 'chef-special';

export type Allergen = string;

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedModifiers: Modifier[];
  specialInstructions?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  estimatedDelivery?: Date;
  deliveryAddress: DeliveryAddress;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'cancelled';

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  instructions?: string;
}
