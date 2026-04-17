import { getProducts } from "@/lib/api";
import { BrandProduct, SwiftCartProduct } from "@/types";

export const PRODUCT_META: Record<
  string,
  {
    price: number;
    originalPrice: number;
    weight: string;
    image: string;
    deliveryTime: string;
    inStock: boolean;
  }
> = {
  "LAYS-001": {
    price: 20,
    originalPrice: 25,
    weight: "26g",
    image:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "HALD-001": {
    price: 30,
    originalPrice: 35,
    weight: "200g",
    image:
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "AMUL-001": {
    price: 28,
    originalPrice: 28,
    weight: "500ml",
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "EPIG-001": {
    price: 55,
    originalPrice: 65,
    weight: "90g",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "REAL-001": {
    price: 45,
    originalPrice: 50,
    weight: "1L",
    image:
      "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "MAGG-001": {
    price: 14,
    originalPrice: 14,
    weight: "70g",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "DOVE-001": {
    price: 199,
    originalPrice: 250,
    weight: "250ml",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
  "DMILK-001": {
    price: 99,
    originalPrice: 109,
    weight: "162g",
    image:
      "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?auto=format&fit=crop&q=80&w=400",
    deliveryTime: "10 mins",
    inStock: true,
  },
};

const FALLBACK_META = {
  price: 49,
  originalPrice: 59,
  weight: "1 unit",
  image:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
  deliveryTime: "10 mins",
  inStock: true,
};

export const CATEGORIES = [
  "Snacks & Munchies",
  "Dairy & Breakfast",
  "Cold Drinks & Juices",
  "Instant & Frozen Food",
  "Personal Care",
  "Chocolates & Sweets",
  "Fruits & Vegetables",
  "Tea & Coffee",
  "Home Care",
  "Baby Care",
  "Pet Care",
  "Paan Corner",
];

export async function fetchSwiftCartProducts(brandId: string): Promise<SwiftCartProduct[]> {
  const products: BrandProduct[] = await getProducts(brandId);

  return products.map((product) => {
    const meta = PRODUCT_META[product.sku] || FALLBACK_META;
    return {
      ...product,
      ...meta,
      rating: 0,
      reviewCount: 0,
    } satisfies SwiftCartProduct;
  });
}
