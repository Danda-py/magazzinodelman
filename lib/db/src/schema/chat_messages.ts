import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { proposalsTable } from "./proposals";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposalsTable.id),
  senderRole: text("sender_role").notNull(), // admin | client
  senderName: text("sender_name"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
