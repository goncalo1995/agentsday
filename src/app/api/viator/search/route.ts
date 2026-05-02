const VIATOR_BASE =
  process.env.VIATOR_API_BASE_URL ??
  process.env.VIATOR_BASE_URL ??
  "https://api.sandbox.viator.com/partner";

const VIATOR_KEY = process.env.VIATOR_API_KEY ?? "";

const HEADERS: Record<string, string> = {
  "exp-api-key": VIATOR_KEY,
  Accept: "application/json;version=2.0",
  "Content-Type": "application/json;version=2.0",
  "Accept-Language": "en-US",
};

export async function POST(req: Request) {
  const { searchTerm, destinationId, currency } = await req.json();

  if (!VIATOR_KEY) {
    return Response.json(
      { products: [], attractions: [], totalProducts: 0, error: true },
      { status: 200 },
    );
  }

  const searchTypes: Record<string, unknown>[] = [
    { searchType: "PRODUCTS", pagination: { start: 1, count: 20 } },
    { searchType: "ATTRACTIONS", pagination: { start: 1, count: 5 } },
  ];

  const body: Record<string, unknown> = {
    searchTerm: searchTerm || "",
    searchTypes,
    currency: currency || "USD",
  };

  if (destinationId) {
    body.productFiltering = { destination: String(destinationId) };
  }

  try {
    const res = await fetch(`${VIATOR_BASE}/search/freetext`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[viator/search] ${res.status}: ${text.slice(0, 200)}`);
      return Response.json(
        { products: [], attractions: [], totalProducts: 0, error: true },
        { status: 200 },
      );
    }

    const data = await res.json();

    return Response.json({
      products: data.products?.results ?? [],
      attractions: data.attractions?.results ?? [],
      totalProducts: data.products?.totalCount ?? 0,
      error: false,
    });
  } catch (e) {
    console.error("[viator/search] fetch failed:", e);
    return Response.json(
      { products: [], attractions: [], totalProducts: 0, error: true },
      { status: 200 },
    );
  }
}
