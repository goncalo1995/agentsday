import { adminDb } from "@/lib/instant-admin";

const ALLOWED_STATUSES = new Set(["draft", "active", "archived"]);

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const userId = typeof body.userId === "string" ? body.userId : "";

  if (!adminDb) {
    return Response.json({ error: "Instant admin credentials are not configured." }, { status: 500 });
  }
  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 401 });
  }

  const campaigns = await adminDb.query({
    campaigns: {
      $: { where: { id, userId }, limit: 1 },
    },
  });
  const campaign = campaigns.campaigns[0];
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const update: Record<string, string> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof body.title === "string") update.title = body.title;
  if (typeof body.niche === "string") update.niche = body.niche;
  if (typeof body.startDate === "string") update.startDate = body.startDate;
  if (typeof body.endDate === "string") update.endDate = body.endDate;
  if (typeof body.scheduledDate === "string") update.scheduledDate = body.scheduledDate;
  if (typeof body.status === "string" && ALLOWED_STATUSES.has(body.status)) update.status = body.status;

  await adminDb.transact(adminDb.tx.campaigns[id].update(update));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const userId = typeof body.userId === "string" ? body.userId : "";

  if (!adminDb) {
    return Response.json({ error: "Instant admin credentials are not configured." }, { status: 500 });
  }
  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 401 });
  }

  const campaigns = await adminDb.query({
    campaigns: {
      $: { where: { id, userId }, limit: 1 },
    },
  });
  if (!campaigns.campaigns[0]) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  await adminDb.transact(adminDb.tx.campaigns[id].delete());
  return Response.json({ ok: true });
}
