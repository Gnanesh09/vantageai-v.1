export const PRODUCT_MAP = {
  "57e787b0-7666-4f75-b887-f5a0391ad3d2": { sku: "LAYS-001", name: "Lays Classic Salted" },
  "2478eac8-d117-4702-969e-2037395f0229": { sku: "HALD-001", name: "Haldirams Aloo Bhujia" },
  "84ef4b9e-91de-420b-b5ca-59b0763c4040": { sku: "AMUL-001", name: "Amul Taaza Toned Milk" },
  "fc7455ee-3e41-421b-86dd-b5d403cbec58": { sku: "EPIG-001", name: "Epigamia Greek Yogurt" },
  "9417e035-fc5c-4784-a2ce-fa7a7a57be16": { sku: "REAL-001", name: "Real Fruit Juice Mango" },
  "6b5564ed-b5b5-4f54-b99d-6ae5e07e4f8c": { sku: "MAGG-001", name: "Maggi 2 Minute Noodles" },
  "3b2ae675-b01c-481d-b5d1-b6d858a5b62c": { sku: "DOVE-001", name: "Dove Body Wash" },
  "6ad804e9-2a8a-42bc-9a21-57e0d0f369e3": { sku: "DMILK-001", name: "Dairy Milk Silk" },
} as const;

export function productNameById(productId?: string): string {
  if (!productId) return "Unknown Product";
  return PRODUCT_MAP[productId as keyof typeof PRODUCT_MAP]?.name || productId;
}
