import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, UserRound } from "lucide-react";
import { adminDb } from "@/lib/instant-admin";
import type { CreatorPost, CreatorProfile } from "@/lib/post-types";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (!username.startsWith("@")) notFound();
  if (!adminDb) {
    return <PublicError message="Public profiles need Instant admin credentials." />;
  }

  const cleanUsername = username.slice(1);
  const users = await adminDb.query({
    $users: { $: { where: { username: cleanUsername }, limit: 1 } },
  });
  const profile = users.$users[0] as CreatorProfile | undefined;
  if (!profile) notFound();

  const postData = await adminDb.query({
    creator_posts: {
      $: { where: { userId: profile.id, isPublic: true }, order: { createdAt: "desc" } },
    },
  });
  const posts = postData.creator_posts as CreatorPost[];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent/10 text-accent grid place-items-center">
          {profile.imageURL ? <img src={profile.imageURL} alt="" className="w-full h-full object-cover rounded-2xl" /> : <UserRound className="w-7 h-7" />}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile.displayName || `@${profile.username}`}</h1>
          <p className="text-muted">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-sm text-muted">{profile.bio}</p>}
        </div>
      </header>

      <section className="grid gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/@${profile.username}/${post.slug}`}
            className="grid sm:grid-cols-[140px_1fr] gap-4 rounded-2xl border border-border bg-surface p-4 hover:shadow-md transition-shadow"
          >
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface-alt">
              {post.coverImageUrl ? (
                <img src={post.coverImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted">
                  <Link2 className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold leading-snug">{post.title}</h2>
              {post.description && <p className="mt-2 text-sm text-muted line-clamp-2">{post.description}</p>}
              <p className="mt-3 text-xs text-muted">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          </Link>
        ))}
      </section>

      {posts.length === 0 && (
        <div className="text-center text-sm text-muted rounded-2xl border border-border p-10">
          No public posts yet.
        </div>
      )}
    </div>
  );
}

function PublicError({ message }: { message: string }) {
  return <div className="max-w-xl mx-auto px-6 py-20 text-center text-muted">{message}</div>;
}
