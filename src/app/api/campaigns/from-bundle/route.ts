import { id } from "@instantdb/admin";
import { adminDb } from "@/lib/instant-admin";
import { makeShortCode, affiliateUrlFor } from "@/lib/affiliate";

export async function POST(req: Request) {
  if (!adminDb) {
    return Response.json({ error: "Instant admin credentials are not configured." }, { status: 500 });
  }

  const { title, niche, products, grouping, userId, creatorCode = "efacil_creator" } = await req.json();

  if (!userId || !products || products.length === 0) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = adminDb;
  const createdAt = new Date().toISOString();
  const transactions: any[] = [];

  try {
    if (grouping === "itinerary") {
      const campaignId = id();
      transactions.push(
        db.tx.campaigns[campaignId].update({
          userId,
          title: title || "New Campaign",
          niche: niche || "Travel",
          status: "draft",
          createdAt,
          updatedAt: createdAt,
        })
      );

      // Group products by dayLabel
      const grouped = products.reduce((acc: any, item: any) => {
        const label = item.query?.destinationDayLabel || "Itinerary";
        if (!acc[label]) acc[label] = [];
        acc[label].push(item);
        return acc;
      }, {});

      for (const label of Object.keys(grouped)) {
        const postId = id();
        const slug = `${title.replace(/\s+/g, '-').toLowerCase()}-${label.replace(/\s+/g, '-').toLowerCase()}-${id().slice(0, 4)}`;
        
        transactions.push(
          db.tx.creator_posts[postId].update({
            userId,
            campaignId,
            title: label,
            slug,
            description: "",
            isPublic: false,
            createdAt,
            updatedAt: createdAt,
          })
        );

        grouped[label].forEach((item: any, idx: number) => {
          const { product } = item;
          const slotId = id();
          const linkId = id();
          const shortCode = makeShortCode(product.id);
          
          transactions.push(
            db.tx.post_slots[slotId].update({
              userId,
              postId,
              slotIndex: idx,
              label: product.title,
              viatorProductId: product.id,
              productTitle: product.title,
              productUrl: product.affiliateLink || product.productUrl || "",
              productImageUrl: product.imageUrl || "",
              destination: item.query?.destination || "",
              price: product.price,
              currency: product.currency,
              rating: product.rating,
              reviewCount: product.reviewCount,
              source: "ai_alternative",
              active: true,
              isPublic: false,
              createdAt,
            }),
            db.tx.affiliate_links[linkId].update({
              linkId,
              userId,
              postId,
              slotId,
              slotLabel: product.title,
              viatorProductId: product.id,
              shortCode,
              affiliateUrl: product.affiliateLink || product.productUrl || "",
              destinationUrl: product.affiliateLink || product.productUrl || "",
              productTitle: product.title,
              productImageUrl: product.imageUrl || "",
              productPrice: product.price,
              productCurrency: product.currency,
              productRating: product.rating,
              reviewCount: product.reviewCount,
              campaignSource: "smart_search",
              creatorCode,
              active: true,
              createdAt,
            })
          );
        });
      }

      await db.transact(transactions);

      // Trigger AI content generation for the campaign
      const firstProduct = products[0]?.product;
      const origin = req.headers.get("origin") || req.headers.get("referer") ? new URL(req.headers.get("referer") || "").origin : "http://localhost:3000";
      
      try {
        fetch(`${origin}/api/campaigns/generate-content`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            campaignId,
            platform: "instagram",
            productUrl: firstProduct?.affiliateLink || "",
            product: firstProduct,
          }),
        }).catch(e => console.error("Async generate-content failed", e));
      } catch (e) {
        console.error("Failed to trigger generate-content", e);
      }

      return Response.json({ success: true, type: "itinerary", campaignId });

    } else {
      // Simple Post
      const postId = id();
      const slug = `${title.replace(/\s+/g, '-').toLowerCase()}-${id().slice(0, 4)}`;
      
      transactions.push(
        db.tx.creator_posts[postId].update({
          userId,
          title: title || "New Post",
          slug,
          description: niche || "",
          isPublic: false,
          createdAt,
          updatedAt: createdAt,
        })
      );

      products.forEach((item: any, idx: number) => {
        const { product } = item;
        const slotId = id();
        const linkId = id();
        const shortCode = makeShortCode(product.id);
        
        transactions.push(
          db.tx.post_slots[slotId].update({
            userId,
            postId,
            slotIndex: idx,
            label: product.title,
            viatorProductId: product.id,
            productTitle: product.title,
            productUrl: product.affiliateLink || product.productUrl || "",
            productImageUrl: product.imageUrl || "",
            destination: item.query?.destination || "",
            price: product.price,
            currency: product.currency,
            rating: product.rating,
            reviewCount: product.reviewCount,
            source: "ai_alternative",
            active: true,
            isPublic: false,
            createdAt,
          }),
          db.tx.affiliate_links[linkId].update({
            linkId,
            userId,
            postId,
            slotId,
            slotLabel: product.title,
            viatorProductId: product.id,
            shortCode,
            affiliateUrl: product.affiliateLink || product.productUrl || "",
            destinationUrl: product.affiliateLink || product.productUrl || "",
            productTitle: product.title,
            productImageUrl: product.imageUrl || "",
            productPrice: product.price,
            productCurrency: product.currency,
            productRating: product.rating,
            reviewCount: product.reviewCount,
            campaignSource: "smart_search",
            creatorCode,
            active: true,
            createdAt,
          })
        );
      });

      await db.transact(transactions);

      return Response.json({ success: true, type: "simple", postId });
    }
  } catch (e) {
    console.error("[from-bundle] failed:", e);
    return Response.json({ error: "Failed to create campaign/post" }, { status: 500 });
  }
}
