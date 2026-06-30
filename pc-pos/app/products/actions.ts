// app/products/actions.ts
"use server";

import { db } from "../../src/db"; 
import { products } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Hàm Thêm sản phẩm mới
export async function addProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const unit = formData.get("unit") as string;
  const price_sell = Number(formData.get("price_sell"));
  const price_import = Number(formData.get("price_import"));
  const stock = Number(formData.get("stock"));

  await db.insert(products).values({
    name,
    category: category?.trim() || "Chưa phân loại",
    unit: unit?.trim() || "Cái",
    price_sell,
    price_import,
    stock,
  });

  revalidatePath("/products"); 
}

// Hàm Sửa sản phẩm
export async function updateProduct(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const unit = formData.get("unit") as string;
  const price_sell = Number(formData.get("price_sell"));
  const price_import = Number(formData.get("price_import"));
  const stock = Number(formData.get("stock"));

  await db.update(products)
    .set({ 
      name, 
      category: category?.trim() || "Chưa phân loại", 
      unit: unit?.trim() || "Cái", 
      price_sell, 
      price_import, 
      stock 
    })
    .where(eq(products.id, id));

  revalidatePath("/products");
}

// Hàm Xóa sản phẩm
export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/products");
}