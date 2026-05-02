import { AuthGate } from "@/components/auth-gate";
import { PostReportPage } from "@/components/post-report-page";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const [{ postId }, query] = await Promise.all([params, searchParams]);
  return (
    <AuthGate>
      <PostReportPage postId={postId} from={query.from ?? ""} to={query.to ?? ""} />
    </AuthGate>
  );
}
