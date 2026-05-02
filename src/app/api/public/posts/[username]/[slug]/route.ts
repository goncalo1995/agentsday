import { adminDb } from "@/lib/instant-admin";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ username: string; slug: string }> },
) {
  const { username, slug } = await ctx.params;
  const cleanUsername = username.replace(/^@/, "");

  if (!adminDb) {
    return Response.json({ error: "Instant admin credentials are not configured." }, { status: 500 });
  }

  const users = await adminDb.query({
    $users: {
      $: { where: { username: cleanUsername }, limit: 1 },
    },
  });
  const profile = users.$users[0];
  if (!profile) return Response.json({ error: "Creator not found" }, { status: 404 });

  const posts = await adminDb.query({
    creator_posts: {
      $: {
        where: { userId: profile.id, slug, isPublic: true },
        limit: 1,
      },
    },
  });
  const post = posts.creator_posts[0];
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  const [slots, links] = await Promise.all([
    adminDb.query({
      post_slots: {
        $: {
          where: { userId: profile.id, postId: post.id, active: true, isPublic: true },
          order: { slotIndex: "asc" },
        },
      },
    }),
    adminDb.query({
      affiliate_links: {
        $: {
          where: { userId: profile.id, postId: post.id, active: true },
          order: { createdAt: "asc" },
        },
      },
    }),
  ]);

  return Response.json({
    profile: {
      id: profile.id,
      username: profile.username,
      bio: profile.bio,
      displayName: profile.displayName,
      imageURL: profile.imageURL,
    },
    post,
    slots: slots.post_slots,
    links: links.affiliate_links,
  });
}
