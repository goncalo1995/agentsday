import { NextRequest, NextResponse } from "next/server";
import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/instant-admin";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ shortCode: string }> },
) {
  const { shortCode } = await ctx.params;

  if (!adminDb) {
    return NextResponse.json(
      { error: "Instant admin credentials are not configured." },
      { status: 500 },
    );
  }

  const data = await adminDb.query({
    affiliate_links: {
      $: {
        where: { shortCode },
        limit: 1,
      },
    },
  });

  const link = data.affiliate_links[0];
  if (!link) {
    return NextResponse.json({ error: "Short link not found." }, { status: 404 });
  }

  if (link.active === false) {
    return NextResponse.json({ error: "This short link is inactive." }, { status: 410 });
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "";
  const userAgent = req.headers.get("user-agent") ?? "";

  await adminDb.transact(
    adminDb.tx.click_logs[id()].update({
      userId: link.userId,
      linkId: link.linkId,
      postId: link.postId,
      slotId: link.slotId,
      shortCode: link.shortCode,
      viatorProductId: link.viatorProductId,
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
    }),
  );

  return NextResponse.redirect(link.affiliateUrl);
}
