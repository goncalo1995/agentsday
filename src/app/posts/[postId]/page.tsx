import { AuthGate } from "@/components/auth-gate";
import { PostDetailPage } from "@/components/post-detail-page";

export default async function CreatorPostDetail({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return (
    <AuthGate>
      <PostDetailPage postId={postId} />
    </AuthGate>
  );
}
