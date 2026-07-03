import { Router } from "express";
import { db } from "@workspace/db";
import { cmsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateCmsContentBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

const DEFAULT_CONTENT = {
  heroHeadline: "Il magazzino del man. I prodotti migliori, ai prezzi più competitivi.",
  heroSubheadline: "Capi selezionati, condizioni impeccabili, prezzi imbattibili.",
  chiSiamoTitle: "Chi Siamo",
  chiSiamoBody:
    "Il magazzino del man nasce dalla passione di Lucchini Luca per la moda e il reselling di qualità. Con anni di esperienza su Vinted ed eBay come Star Seller, offriamo articoli autentici, verificati e a prezzi che non trovi altrove. La nostra reputazione si costruisce su ogni singola recensione — e non abbiamo intenzione di smettere di guadagnarcele.",
  founderName: "Lucchini Luca",
  socialLinks: JSON.stringify([
    { label: "Instagram", url: "https://www.instagram.com/ilmagazzinodelman/", icon: "SiInstagram" },
    { label: "Vinted", url: "https://www.vinted.it", icon: "SiVinted" },
    { label: "TikTok", url: "https://www.tiktok.com/@ilmagazzinodelman", icon: "SiTiktok" },
  ]),
};

async function ensureDefaults() {
  for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
    const existing = await db.select().from(cmsTable).where(eq(cmsTable.key, key)).limit(1);
    if (existing.length === 0) {
      await db.insert(cmsTable).values({ key, value });
    }
  }
}

router.get("/cms", async (req, res) => {
  await ensureDefaults();
  const rows = await db.select().from(cmsTable);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  let socialLinks = [];
  try {
    socialLinks = JSON.parse(map["socialLinks"] ?? "[]");
  } catch {
    socialLinks = [];
  }

  res.json({
    heroHeadline: map["heroHeadline"] ?? DEFAULT_CONTENT.heroHeadline,
    heroSubheadline: map["heroSubheadline"] ?? DEFAULT_CONTENT.heroSubheadline,
    chiSiamoTitle: map["chiSiamoTitle"] ?? DEFAULT_CONTENT.chiSiamoTitle,
    chiSiamoBody: map["chiSiamoBody"] ?? DEFAULT_CONTENT.chiSiamoBody,
    founderName: map["founderName"] ?? DEFAULT_CONTENT.founderName,
    socialLinks,
  });
});

router.patch("/cms", requireAdmin, async (req, res) => {
  const parsed = UpdateCmsContentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const updates: Record<string, string> = {};

  if (data.heroHeadline !== undefined) updates["heroHeadline"] = data.heroHeadline;
  if (data.heroSubheadline !== undefined) updates["heroSubheadline"] = data.heroSubheadline;
  if (data.chiSiamoTitle !== undefined) updates["chiSiamoTitle"] = data.chiSiamoTitle;
  if (data.chiSiamoBody !== undefined) updates["chiSiamoBody"] = data.chiSiamoBody;
  if (data.founderName !== undefined) updates["founderName"] = data.founderName;
  if (data.socialLinks !== undefined) updates["socialLinks"] = JSON.stringify(data.socialLinks);

  for (const [key, value] of Object.entries(updates)) {
    const existing = await db.select().from(cmsTable).where(eq(cmsTable.key, key)).limit(1);
    if (existing.length > 0) {
      await db
        .update(cmsTable)
        .set({ value, updatedAt: new Date() })
        .where(eq(cmsTable.key, key));
    } else {
      await db.insert(cmsTable).values({ key, value });
    }
  }

  // Return updated content
  const rows = await db.select().from(cmsTable);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  let socialLinks = [];
  try {
    socialLinks = JSON.parse(map["socialLinks"] ?? "[]");
  } catch {
    socialLinks = [];
  }

  res.json({
    heroHeadline: map["heroHeadline"] ?? DEFAULT_CONTENT.heroHeadline,
    heroSubheadline: map["heroSubheadline"] ?? DEFAULT_CONTENT.heroSubheadline,
    chiSiamoTitle: map["chiSiamoTitle"] ?? DEFAULT_CONTENT.chiSiamoTitle,
    chiSiamoBody: map["chiSiamoBody"] ?? DEFAULT_CONTENT.chiSiamoBody,
    founderName: map["founderName"] ?? DEFAULT_CONTENT.founderName,
    socialLinks,
  });
});

export default router;
