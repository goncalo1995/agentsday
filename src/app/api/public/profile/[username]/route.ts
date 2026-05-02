import { adminDb } from "@/lib/instant-admin";

export async function GET(_req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
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
        where: { userId: profile.id, isPublic: true },
        order: { createdAt: "desc" },
      },
    },
  });

  return Response.json({
    profile: {
      id: profile.id,
      username: profile.username,
      bio: profile.bio,
      displayName: profile.displayName,
      imageURL: profile.imageURL,
    },
    posts: posts.creator_posts,
  });
}
