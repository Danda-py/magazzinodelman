import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { isNotNull, and, eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/financial/summary", requireAdmin, async (req, res) => {
  const soldProducts = await db
    .select()
    .from(productsTable)
    .where(and(isNotNull(productsTable.soldAt), isNotNull(productsTable.salePrice)));

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalProfit = 0;

  const monthlyMap = new Map<string, { revenue: number; expenses: number; profit: number }>();

  for (const p of soldProducts) {
    const salePrice = Number(p.salePrice ?? 0);
    const netProfit = Number(p.netProfit ?? 0);
    const expense = salePrice - netProfit;

    totalRevenue += salePrice;
    totalExpenses += expense;
    totalProfit += netProfit;

    const month = p.soldAt
      ? new Date(p.soldAt).toLocaleString("it-IT", { month: "long", year: "numeric" })
      : "Sconosciuto";

    const existing = monthlyMap.get(month) ?? { revenue: 0, expenses: 0, profit: 0 };
    existing.revenue += salePrice;
    existing.expenses += expense;
    existing.profit += netProfit;
    monthlyMap.set(month, existing);
  }

  // Supplement with simulated monthly data if no sold items exist
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));

  if (monthlyData.length === 0) {
    res.json({ totalRevenue: 0, totalExpenses: 0, totalProfit: 0, monthlyData: [] });
    return;
  }

  res.json({ totalRevenue, totalExpenses, totalProfit, monthlyData });
});

router.get("/financial/items", requireAdmin, async (req, res) => {
  const soldProducts = await db
    .select()
    .from(productsTable)
    .where(and(isNotNull(productsTable.soldAt), isNotNull(productsTable.salePrice)));

  res.json(
    soldProducts.map((p) => ({
      id: p.id,
      productTitle: p.title,
      salePrice: Number(p.salePrice ?? 0),
      commissionType: p.commissionType ?? "fixed",
      commissionValue: Number(p.commissionValue ?? 0),
      netProfit: Number(p.netProfit ?? 0),
      soldAt: p.soldAt?.toISOString() ?? new Date().toISOString(),
    }))
  );
});

// DELETE /financial/items/:id — removes a sold-item record from the ERP
router.delete("/financial/items/:id", requireAdmin, async (req, res) => {
  const rawId = req.params["id"];

const id = parseInt(
  Array.isArray(rawId) ? rawId[0] : (rawId ?? ""),
  10
);
  if (Number.isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid item id" });
    return;
  }

  // Verify the product exists and is a sold record before deleting
  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, id), isNotNull(productsTable.soldAt)))
    .limit(1);

  if (!product) {
    res.status(404).json({ error: "Financial record not found" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(200).json({ success: true });
});

export default router;
