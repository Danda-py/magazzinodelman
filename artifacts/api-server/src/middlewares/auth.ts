import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { getOrProvisionDbUser } from "../lib/user-provisioning";
import type { User } from "@workspace/db";

// Attach the resolved DB user to every authenticated request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      dbUser?: User;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    req.dbUser = await getOrProvisionDbUser(userId);
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const user = await getOrProvisionDbUser(userId);
    if (user.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    req.dbUser = user;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
}
