import { Router } from "express";
import { getAuth } from "@clerk/express";
import { getOrProvisionDbUser } from "../lib/user-provisioning";

const router = Router();

/**
 * GET /api/auth/me
 *
 * Returns the current user's DB profile (including role).
 * Used by the frontend's useGetMe() hook — must stay at this path.
 * Authentication is verified via Clerk's session cookie (set by clerkMiddleware in app.ts).
 */
router.get("/auth/me", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const user = await getOrProvisionDbUser(userId);
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
