import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  desiredPayout: numeric("desired_payout", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected
  submitterEmail: text("submitter_email").notNull(),
  submitterName: text("submitter_name"),
  instagramHandle: text("instagram_handle"),
  condition: text("condition"), // new_with_tags | like_new | used
  commissionType: text("commission_type"), // percentage | fixed
  commissionValue: numeric("commission_value", { precision: 10, scale: 2 }),
  netProfit: numeric("net_profit", { precision: 10, scale: 2 }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({ id: true, createdAt: true });
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
