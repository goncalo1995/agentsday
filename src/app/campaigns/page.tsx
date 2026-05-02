import { AuthGate } from "@/components/auth-gate";
import { CampaignsPage } from "@/components/campaigns-page";

export default function CampaignsRoute() {
  return (
    <AuthGate>
      <CampaignsPage />
    </AuthGate>
  );
}
