import { Suspense } from "react";
import { AuthGate } from "@/components/auth-gate";
import { CampaignDetailPage } from "@/components/campaign-detail-page";

export default async function CampaignDetailRoute({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  return (
    <AuthGate>
      <Suspense fallback={null}>
        <CampaignDetailPage campaignId={campaignId} />
      </Suspense>
    </AuthGate>
  );
}
