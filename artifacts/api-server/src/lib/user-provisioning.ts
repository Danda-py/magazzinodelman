/**
 * JIT (Just-in-Time) user provisioning.
 *
 * On every authenticated request we look up the DB user by Clerk ID.
 * First sign-in: we fetch the Clerk profile, then either link an existing
 * DB user (email match — migration from old auth) or create a new one.
 */
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import type { User } from "@workspace/db";

const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "";

export async function getOrProvisionDbUser(clerkUserId: string): Promise<User> {
  // Fast path: already linked
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);
  if (existing) return existing;

  // Slow path (first sign-in): fetch Clerk profile
  const clerkUser = await clerkClient.users.getUser(clerkUserId);

  // Only use a verified primary email — never trust unverified addresses
  // to prevent privilege escalation via unverified email matches.
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) =>
      e.id === clerkUser.primaryEmailAddressId &&
      e.verification?.status === "verified",
  );

  if (!primaryEmail) {
    throw new Error("Clerk user has no verified primary email address");
  }

  const email = primaryEmail.emailAddress;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    undefined;
  const role: "admin" | "client" = email === ADMIN_EMAIL ? "admin" : "client";

  // Try to link an existing user by email (migration from the previous auth system).
  // The email is Clerk-verified so this link is safe.
  const [byEmail] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (byEmail) {
    const [updated] = await db
      .update(usersTable)
      .set({ clerkId: clerkUserId, role })
      .where(eq(usersTable.id, byEmail.id))
      .returning();
    return updated;
  }

  // New user
  const [created] = await db
    .insert(usersTable)
    .values({ email, name, role, clerkId: clerkUserId })
    .returning();
  return created;
}
