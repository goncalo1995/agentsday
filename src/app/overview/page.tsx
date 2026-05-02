import { AuthGate } from "@/components/auth-gate";
import { CreatorDashboardHome } from "@/components/creator-dashboard-home";

export default function OverviewPage() {
  return (
    <AuthGate>
      <CreatorDashboardHome />
    </AuthGate>
  );
}
