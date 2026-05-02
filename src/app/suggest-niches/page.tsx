import { AuthGate } from "@/components/auth-gate";
import { SuggestNichesPage } from "@/components/suggest-niches-page";

export default function SuggestNichesRoute() {
  return (
    <AuthGate>
      <SuggestNichesPage />
    </AuthGate>
  );
}
