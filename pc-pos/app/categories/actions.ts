// app/categories/actions.ts
"use server";

import { db } from "../../src/db";
import { categories, products } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCategory(name: string, description: string) {
  await db.insert(categories).values({
    name: name.trim(),
    description: description.trim(),
  });
  revalidatePath("/categories");
}

export async function updateCategory(id: number, name: string, description: string) {
  await db.update(categories).set({
    name: name.trim(),
    description: description.trim(),
  }).where(eq(categories.id, id));
  revalidatePath("/categories");
}

export async function deleteAndMergeCategory(oldCategoryName: string, newCategoryName: string | null) {
  if (newCategoryName && newCategoryName !== "Chưa phân loại") {
    await db.update(products)
      .set({ category: newCategoryName })
      .where(eq(products.category, oldCategoryName));
  } else {
    await db.update(products)
      .set({ category: "Chưa phân loại" })
      .where(eq(products.category, oldCategoryName));
  }

  await db.delete(categories).where(eq(categories.name, oldCategoryName));
  revalidatePath("/categories");
  revalidatePath("/products");
}

// 🔥 BỔ SUNG HÀM KẾT NỐI CSDL ĐỂ GÁN/GỠ SẢN PHẨM KHỎI DANH MỤC
export async function updateProductCategory(productId: number, newCategory: string | null) {
  await db.update(products)
    .set({ category: newCategory })
    .where(eq(products.id, productId));
    
  revalidatePath("/categories");
  revalidatePath("/products");
}