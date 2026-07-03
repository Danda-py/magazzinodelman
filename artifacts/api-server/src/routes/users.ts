import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { z } from "zod";

const router = Router();

// GET /users — list all users (admin only)
router.get("/users", requireAdmin, async (_req, res) => {
  const users = await db
    .select({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

const PatchRoleBody = z.object({ role: z.enum(["admin", "client"]) });

// PATCH /users/:id/role — change a user's role (admin only)
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  const id = Number(req.params["id"]);
  if (!id) { res.status(400).json({ error: "Invalid user id" }); return; }

  const parsed = PatchRoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid role" }); return; }

  const [updated] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role });

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(updated);
});

export default router;
