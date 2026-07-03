import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, and, gte, lte, SQL } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/products", async (req, res) => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { category, condition, brand, color, minPrice, maxPrice, inStock } = parsed.data;
  const filters: SQL[] = [];

  if (category) filters.push(eq(productsTable.category, category));
  if (condition) filters.push(eq(productsTable.condition, condition));
  if (brand) filters.push(eq(productsTable.brand, brand));
  if (color) filters.push(eq(productsTable.color, color));
  if (minPrice !== undefined) filters.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined) filters.push(lte(productsTable.price, String(maxPrice)));
  if (inStock !== undefined) filters.push(eq(productsTable.inStock, inStock));

  const products = await db
    .select()
    .from(productsTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(productsTable.createdAt);

  res.json(
    products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      commissionValue: p.commissionValue ? Number(p.commissionValue) : null,
      netProfit: p.netProfit ? Number(p.netProfit) : null,
    }))
  );
});

router.post("/products", requireAdmin, async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  let netProfit: string | undefined;
  if (data.commissionType === "percentage" && data.commissionValue !== undefined) {
    netProfit = String(data.price * (data.commissionValue / 100));
  } else if (data.commissionType === "fixed" && data.commissionValue !== undefined) {
    netProfit = String(data.commissionValue);
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      ...data,
      price: String(data.price),
      originalPrice: data.originalPrice ? String(data.originalPrice) : undefined,
      commissionValue: data.commissionValue ? String(data.commissionValue) : undefined,
      netProfit,
    })
    .returning();

  res.status(201).json({
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    commissionValue: product.commissionValue ? Number(product.commissionValue) : null,
    netProfit: product.netProfit ? Number(product.netProfit) : null,
  });
});

router.get("/products/stats/summary", async (req, res) => {
  const products = await db.select().from(productsTable);
  const total = products.length;
  const inStock = products.filter((p) => p.inStock).length;
  const sold = products.filter((p) => !p.inStock).length;
  const totalValue = products
    .filter((p) => p.inStock)
    .reduce((acc, p) => acc + Number(p.price), 0);

  const categoryMap = new Map<string, number>();
  for (const p of products) {
    const cat = p.category ?? "Altro";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }
  const categories = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));

  res.json({ total, inStock, sold, categories, totalValue });
});

router.get("/products/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.id))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    commissionValue: product.commissionValue ? Number(product.commissionValue) : null,
    netProfit: product.netProfit ? Number(product.netProfit) : null,
  });
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  const paramsParsed = UpdateProductParams.safeParse({ id: Number(req.params["id"]) });
  const bodyParsed = UpdateProductBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const data = bodyParsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData["title"] = data.title;
  if (data.description !== undefined) updateData["description"] = data.description;
  if (data.price !== undefined) updateData["price"] = String(data.price);
  if (data.originalPrice !== undefined) updateData["originalPrice"] = String(data.originalPrice);
  if (data.condition !== undefined) updateData["condition"] = data.condition;
  if (data.brand !== undefined) updateData["brand"] = data.brand;
  if (data.color !== undefined) updateData["color"] = data.color;
  if (data.category !== undefined) updateData["category"] = data.category;
  if (data.imageUrl !== undefined) updateData["imageUrl"] = data.imageUrl;
  if (data.inStock !== undefined) updateData["inStock"] = data.inStock;
  if (data.commissionType !== undefined) updateData["commissionType"] = data.commissionType;
  if (data.commissionValue !== undefined) updateData["commissionValue"] = String(data.commissionValue);

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, paramsParsed.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json({
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    commissionValue: product.commissionValue ? Number(product.commissionValue) : null,
    netProfit: product.netProfit ? Number(product.netProfit) : null,
  });
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  const parsed = DeleteProductParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, parsed.data.id));
  res.json({ success: true });
});

export default router;
