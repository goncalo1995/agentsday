import { searchAllProviders } from "@/lib/providers";

export async function POST(req: Request) {
  try {
    const params = await req.json();
    const products = await searchAllProviders(params);
    return Response.json({ products });
  } catch (e) {
    console.error("[providers/search] failed:", e);
    return Response.json({ products: [], error: true }, { status: 500 });
  }
}
