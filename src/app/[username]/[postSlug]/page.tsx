import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Star } from "lucide-react";
import { adminDb } from "@/lib/instant-admin";
import { SHORT_LINK_PREFIX } from "@/lib/affiliate";
import type { AffiliateLink, CreatorPost, CreatorProfile, PostSlot } from "@/lib/post-types";

export default async function PublicPostPage({
  params,
}: {
  params: Promise<{ username: string; postSlug: string }>;
}) {
  const { username, postSlug } = await params;
  if (!username.startsWith("@")) notFound();
  if (!adminDb) return <div className="max-w-xl mx-auto px-6 py-20 text-center text-muted">Public posts need Instant admin credentials.</div>;

  const cleanUsername = username.slice(1);
  const users = await adminDb.query({
    $users: { $: { where: { username: cleanUsername }, limit: 1 } },
  });
  const profile = users.$users[0] as CreatorProfile | undefined;
  if (!profile) notFound();

  const posts = await adminDb.query({
    creator_posts: {
      $: { where: { userId: profile.id, slug: postSlug, isPublic: true }, limit: 1 },
    },
  });
  const post = posts.creator_posts[0] as CreatorPost | undefined;
  if (!post) notFound();

  const [slotData, linkData] = await Promise.all([
    adminDb.query({
      post_slots: {
        $: { where: { userId: profile.id, postId: post.id, active: true, isPublic: true }, order: { slotIndex: "asc" } },
      },
    }),
    adminDb.query({
      affiliate_links: {
        $: { where: { userId: profile.id, postId: post.id, active: true }, order: { createdAt: "asc" } },
      },
    }),
  ]);
  const slots = slotData.post_slots as PostSlot[];
  const links = linkData.affiliate_links as AffiliateLink[];
  const linksBySlot = new Map(links.map((link) => [link.slotId, link]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <header className="space-y-3">
        <Link href={`/@${profile.username}`} className="text-sm text-muted hover:text-foreground">
          @{profile.username}
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        {post.description && <p className="text-muted max-w-2xl">{post.description}</p>}
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        {slots.map((slot) => {
          const link = linksBySlot.get(slot.id);
          return (
            <article key={slot.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="aspect-[3/2] bg-surface-alt">
                {slot.productImageUrl ? (
                  <img src={slot.productImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted">No image</div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-accent">{slot.label}</div>
                  <h2 className="font-semibold leading-snug">{slot.productTitle}</h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted">
                  {slot.rating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {slot.rating.toFixed(1)}
                    </span>
                  )}
                  {slot.price && <span>{slot.currency ?? "USD"} {slot.price.toFixed(0)}</span>}
                </div>
                {link && (
                  <a
                    href={`${SHORT_LINK_PREFIX}/${link.shortCode}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    Open deal
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
