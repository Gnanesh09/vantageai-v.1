export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  weight: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  images: string[];
  description: string;
  deliveryTime: string;
}

// Substantial dataset covering Quick-Commerce Grocery items
const DB: Product[] = [
  {
    id: "lays-classic-salted",
    name: "Lay's Classic Salted Potato Chips",
    category: "Snacks & Munchies",
    price: 20.00,
    originalPrice: 20.00,
    weight: "52 g",
    rating: 4.5,
    reviewCount: 3120,
    inStock: true,
    deliveryTime: "8 MINS",
    images: ["https://images.unsplash.com/photo-1566478989037-e6270b200bdf?auto=format&fit=crop&q=80&w=800"],
    description: "Crispy, crunchy, and perfectly salted potato chips."
  },
  {
    id: "haldirams-aloo-bhujia",
    name: "Haldiram's Aloo Bhujia",
    category: "Snacks & Munchies",
    price: 55.00,
    originalPrice: 60.00,
    weight: "200 g",
    rating: 4.8,
    reviewCount: 8432,
    inStock: true,
    deliveryTime: "11 MINS",
    images: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=800"],
    description: "Classic Indian mildly spicy potato noodle snack."
  },
  {
    id: "amul-taaza-toned-milk",
    name: "Amul Taaza Toned Milk",
    category: "Dairy & Breakfast",
    price: 28.00,
    originalPrice: 28.00,
    weight: "500 ml",
    rating: 4.9,
    reviewCount: 15302,
    inStock: true,
    deliveryTime: "6 MINS",
    images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=800"],
    description: "Fresh, healthy, and hygienic toned milk by Amul."
  },
  {
    id: "epigamia-greek-yogurt",
    name: "Epigamia Greek Yogurt - Blueberry",
    category: "Dairy & Breakfast",
    price: 60.00,
    originalPrice: 60.00,
    weight: "90 g",
    rating: 4.7,
    reviewCount: 1205,
    inStock: true,
    deliveryTime: "9 MINS",
    images: ["https://images.unsplash.com/photo-1488477181946-b9287a942a12?auto=format&fit=crop&q=80&w=800"],
    description: "Thick and creamy tasting greek yogurt with natural blueberry chunks."
  },
  {
    id: "real-fruit-juice-mango",
    name: "Real Fruit Power - Mango Juice",
    category: "Cold Drinks & Juices",
    price: 110.00,
    originalPrice: 125.00,
    weight: "1 L",
    rating: 4.6,
    reviewCount: 5410,
    inStock: true,
    deliveryTime: "12 MINS",
    images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800"],
    description: "Rich mango nectar made from the best quality mangoes."
  },
  {
    id: "maggi-2-minute-noodles",
    name: "Maggi 2-Minute Masala Noodles",
    category: "Instant & Frozen Food",
    price: 14.00,
    originalPrice: 14.00,
    weight: "70 g",
    rating: 4.9,
    reviewCount: 20140,
    inStock: true,
    deliveryTime: "7 MINS",
    images: ["https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=800"],
    description: "The classic favorite 2-minute instant masala noodles."
  },
  {
    id: "dove-body-wash",
    name: "Dove Deeply Nourishing Body Wash",
    category: "Personal Care",
    price: 199.00,
    originalPrice: 240.00,
    weight: "250 ml",
    rating: 4.8,
    reviewCount: 3421,
    inStock: true,
    deliveryTime: "10 MINS",
    images: ["https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&q=80&w=800"],
    description: "Nourishes deeply into the surface layers of the skin."
  },
  {
    id: "dairy-milk-silk",
    name: "Cadbury Dairy Milk Silk Chocolate",
    category: "Chocolates & Sweets",
    price: 85.00,
    originalPrice: 85.00,
    weight: "60 g",
    rating: 4.9,
    reviewCount: 9811,
    inStock: true,
    deliveryTime: "6 MINS",
    images: ["https://images.unsplash.com/photo-1548881267-8c35cb58afeb?auto=format&fit=crop&q=80&w=800"],
    description: "Smooth, perfectly creamy milk chocolate."
  }
];

const LATENCY_MS = 400; // Simulated latency optimized for UX

export const Api = {
  getProducts: async (): Promise<Product[]> => {
    return new Promise(resolve => setTimeout(() => resolve(DB), LATENCY_MS));
  },
  getProductById: async (id: string): Promise<Product | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(DB.find(p => p.id === id)), LATENCY_MS));
  },
  searchProducts: async (query: string): Promise<Product[]> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const q = query.toLowerCase();
        resolve(DB.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
      }, 200);
    });
  },
  getTrendingProducts: async (): Promise<Product[]> => {
    return new Promise(resolve => setTimeout(() => {
      resolve(DB.sort((a,b) => b.rating - a.rating).slice(0, 10)); // return 10 items to fill 5-column grid nicely (2 rows)
    }, LATENCY_MS));
  }
};
