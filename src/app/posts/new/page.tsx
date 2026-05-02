import { AuthGate } from "@/components/auth-gate";
import { CreatePostWizard } from "@/components/create-post-wizard";

export default function NewPostPage() {
  return (
    <AuthGate>
      <CreatePostWizard />
    </AuthGate>
  );
}
