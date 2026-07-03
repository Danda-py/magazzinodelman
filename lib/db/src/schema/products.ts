import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  condition: text("condition").notNull(), // new_with_tags | like_new | used
  brand: text("brand"),
  color: text("color"),
  category: text("category"),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  commissionType: text("commission_type"), // percentage | fixed
  commissionValue: numeric("commission_value", { precision: 10, scale: 2 }),
  netProfit: numeric("net_profit", { precision: 10, scale: 2 }),
  soldAt: timestamp("sold_at"),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
