import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";
import { NewCampaignPage } from "@/components/new-campaign-page";

export default function NewCampaignRoute() {
  return (
    <AuthGate>
      <Suspense fallback={null}>
        <NewCampaignPage />
      </Suspense>
    </AuthGate>
  );
}
