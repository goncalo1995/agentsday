import { AuthGate } from "@/components/auth-gate";
import { PostsDashboard } from "@/components/posts-dashboard";

export default function PostsPage() {
  return (
    <AuthGate>
      <PostsDashboard />
    </AuthGate>
  );
}
