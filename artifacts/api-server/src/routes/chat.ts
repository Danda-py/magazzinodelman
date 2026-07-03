import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, proposalsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListMessagesParams, SendMessageParams, SendMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import type { User } from "@workspace/db";

const router = Router();

/** Verify that the requesting user owns or can admin the given proposal. */
async function resolveAccess(
  proposalId: number,
  dbUser: User | undefined,
): Promise<{ ok: boolean; status: number; error?: string; isAdmin?: boolean }> {
  if (!dbUser) return { ok: false, status: 401, error: "Authentication required" };

  if (dbUser.role === "admin") return { ok: true, status: 200, isAdmin: true };

  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.id, proposalId))
    .limit(1);
  if (!proposal) return { ok: false, status: 404, error: "Proposal not found" };

  if (proposal.submitterEmail !== dbUser.email) {
    return { ok: false, status: 403, error: "Access denied" };
  }

  return { ok: true, status: 200, isAdmin: false };
}

router.get("/proposals/:id/messages", requireAuth, async (req, res) => {
  const parsed = ListMessagesParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const access = await resolveAccess(parsed.data.id, req.dbUser);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.proposalId, parsed.data.id))
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

router.post("/proposals/:id/messages", requireAuth, async (req, res) => {
  const paramsParsed = SendMessageParams.safeParse({ id: Number(req.params["id"]) });
  const bodyParsed = SendMessageBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const access = await resolveAccess(paramsParsed.data.id, req.dbUser);
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }

  // Derive identity from the authenticated session — never trust client-supplied role/name.
  const senderRole = req.dbUser!.role === "admin" ? "admin" : "client";
  const senderName = req.dbUser!.name ?? req.dbUser!.email;

  const [message] = await db
    .insert(chatMessagesTable)
    .values({
      proposalId: paramsParsed.data.id,
      senderRole,
      senderName,
      content: bodyParsed.data.content,
    })
    .returning();

  res.status(201).json(message);
});

export default router;
