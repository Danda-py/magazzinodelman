import { Router } from "express";
import { db } from "@workspace/db";
import { proposalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListProposalsQueryParams,
  CreateProposalBody,
  GetProposalParams,
  AcceptProposalParams,
  AcceptProposalBody,
  RejectProposalParams,
} from "@workspace/api-zod";
import { requireAdmin, requireAuth } from "../middlewares/auth";

const router = Router();

// GET /proposals/my — proposals for the currently logged-in user
router.get("/proposals/my", requireAuth, async (req, res) => {
  try {
    const user = req.dbUser!;
    const proposals = await db
      .select()
      .from(proposalsTable)
      .where(eq(proposalsTable.submitterEmail, user.email));
    res.json(proposals);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/proposals", requireAdmin, async (req, res) => {
  const parsed = ListProposalsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const { status } = parsed.data;
  let proposals;
  if (status) {
    proposals = await db.select().from(proposalsTable).where(eq(proposalsTable.status, status));
  } else {
    proposals = await db.select().from(proposalsTable).orderBy(proposalsTable.createdAt);
  }

  res.json(
    proposals.map((p) => ({
      ...p,
      desiredPayout: Number(p.desiredPayout),
      commissionValue: p.commissionValue ? Number(p.commissionValue) : null,
      netProfit: p.netProfit ? Number(p.netProfit) : null,
    }))
  );
});

router.post("/proposals", async (req, res) => {
  const parsed = CreateProposalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const insertValues: any = {
    itemName: data.itemName,
    category: data.category,
    desiredPayout: String(data.desiredPayout),
    imageUrl: data.imageUrl,
    submitterEmail: data.submitterEmail,
    submitterName: data.submitterName,
    instagramHandle: (data as any).instagramHandle ?? null,
    condition: (data as any).condition ?? null,
    status: "pending",
  };

  const [proposal] = await db
    .insert(proposalsTable)
    .values(insertValues)
    .returning();

  res.status(201).json({
    ...proposal,
    desiredPayout: Number(proposal.desiredPayout),
    commissionValue: null,
    netProfit: null,
  });
});

// Only the submitting user or an admin may read a proposal's full details.
router.get("/proposals/:id", requireAuth, async (req, res) => {
  const parsed = GetProposalParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const [proposal] = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.id, parsed.data.id))
    .limit(1);

  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const user = req.dbUser!;
  const isOwner = proposal.submitterEmail === user.email;
  const isAdmin = user.role === "admin";
  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json({
    ...proposal,
    desiredPayout: Number(proposal.desiredPayout),
    commissionValue: proposal.commissionValue ? Number(proposal.commissionValue) : null,
    netProfit: proposal.netProfit ? Number(proposal.netProfit) : null,
  });
});

router.post("/proposals/:id/accept", requireAdmin, async (req, res) => {
  const paramsParsed = AcceptProposalParams.safeParse({ id: Number(req.params["id"]) });
  const bodyParsed = AcceptProposalBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const [current] = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.id, paramsParsed.data.id))
    .limit(1);

  if (!current) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  const { commissionType, commissionValue, adminNotes } = bodyParsed.data;
  let netProfit: number;
  if (commissionType === "percentage") {
    netProfit = Number(current.desiredPayout) * (commissionValue / 100);
  } else {
    netProfit = commissionValue;
  }

  const [proposal] = await db
    .update(proposalsTable)
    .set({
      status: "accepted",
      commissionType,
      commissionValue: String(commissionValue),
      netProfit: String(netProfit),
      adminNotes: adminNotes ?? null,
    })
    .where(eq(proposalsTable.id, paramsParsed.data.id))
    .returning();

  res.json({
    ...proposal,
    desiredPayout: Number(proposal.desiredPayout),
    commissionValue: proposal.commissionValue ? Number(proposal.commissionValue) : null,
    netProfit: proposal.netProfit ? Number(proposal.netProfit) : null,
  });
});

router.post("/proposals/:id/reject", requireAdmin, async (req, res) => {
  const parsed = RejectProposalParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid proposal id" });
    return;
  }

  const [proposal] = await db
    .update(proposalsTable)
    .set({ status: "rejected" })
    .where(eq(proposalsTable.id, parsed.data.id))
    .returning();

  if (!proposal) {
    res.status(404).json({ error: "Proposal not found" });
    return;
  }

  res.json({
    ...proposal,
    desiredPayout: Number(proposal.desiredPayout),
    commissionValue: proposal.commissionValue ? Number(proposal.commissionValue) : null,
    netProfit: proposal.netProfit ? Number(proposal.netProfit) : null,
  });
});

export default router;
