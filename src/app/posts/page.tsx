import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";
import { PostsDashboard } from "@/components/posts-dashboard";

export default function PostsPage() {
  return (
    <AuthGate>
      <Suspense fallback={null}>
        <PostsDashboard />
      </Suspense>
    </AuthGate>
  );
}
