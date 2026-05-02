import { AuthGate } from "@/components/auth-gate";
import { DiscoverTabs } from "@/components/discover-tabs";

export default function DiscoverPage() {
  return (
    <AuthGate>
      <DiscoverTabs />
    </AuthGate>
  );
}
