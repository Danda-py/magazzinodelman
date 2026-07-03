import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cmsTable = pgTable("cms", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCmsSchema = createInsertSchema(cmsTable).omit({ id: true, updatedAt: true });
export type InsertCms = z.infer<typeof insertCmsSchema>;
export type Cms = typeof cmsTable.$inferSelect;
