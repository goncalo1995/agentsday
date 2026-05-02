import { AuthGate } from "@/components/auth-gate";
import { Dashboard } from "@/components/dashboard";

export default function DiscoverPage() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  );
}
