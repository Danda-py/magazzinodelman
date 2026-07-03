import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SimulateCheckoutBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";
import { sendInvoiceEmail } from "../lib/email";

const router = Router();

router.post("/checkout/simulate", async (req, res) => {
  const parsed = SimulateCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { productId, cardNumber, expiryMonth, expiryYear, cvc, amountCents, buyerEmail, buyerName } = parsed.data;

  // Validate card number starts with 4242
  if (!cardNumber.replace(/\s/g, "").startsWith("4242")) {
    res.status(400).json({ error: "Card declined" });
    return;
  }

  // Validate expiry and CVC present
  if (!expiryMonth || !expiryYear || !cvc) {
    res.status(400).json({ error: "Invalid card details" });
    return;
  }

  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 800));

  // Look up the product and verify it's still in stock
  const [existing] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (!existing.inStock) {
    res.status(409).json({ error: "Product is no longer available" });
    return;
  }

  // Use server-authoritative price — never trust client-supplied amountCents.
  const serverPrice = Number(existing.price);
  const serverAmountCents = Math.round(serverPrice * 100);

  // Calculate net profit for this item
  let netProfit: string | null = existing.netProfit;
  if (!netProfit && existing.commissionType && existing.commissionValue) {
    if (existing.commissionType === "percentage") {
      netProfit = String(serverPrice * (Number(existing.commissionValue) / 100));
    } else {
      netProfit = existing.commissionValue;
    }
  }

  // Atomic update: only marks sold if still in stock (prevents double-sell race).
  const updated = await db
    .update(productsTable)
    .set({
      inStock: false,
      soldAt: new Date(),
      salePrice: String(serverPrice),
      netProfit: netProfit ?? String(serverPrice),
    })
    .where(and(eq(productsTable.id, productId), eq(productsTable.inStock, true)))
    .returning();

  if (updated.length === 0) {
    res.status(409).json({ error: "Product is no longer available" });
    return;
  }

  const transactionId = `pi_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

  // Send invoice email — fire-and-forget so a mail failure doesn't break checkout
  if (buyerEmail) {
    sendInvoiceEmail({
      to: buyerEmail,
      buyerName: buyerName ?? buyerEmail,
      productTitle: updated[0]!.title,
      amountCents: serverAmountCents,
      transactionId,
    }).catch((err) => {
      console.error({ err }, "Failed to send invoice email");
    });
  }

  res.json({
    success: true,
    transactionId,
    amountCents: serverAmountCents,
    message: "Pagamento Riuscito!",
  });
});

export default router;
