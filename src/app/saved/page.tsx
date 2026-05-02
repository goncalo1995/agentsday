import { AuthGate } from "@/components/auth-gate";
import { SavedLinksPage } from "@/components/saved-links-page";

export default function SavedPage() {
  return (
    <AuthGate>
      <SavedLinksPage />
    </AuthGate>
  );
}
