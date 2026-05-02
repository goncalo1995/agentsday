const VIATOR_BASE =
  process.env.VIATOR_API_BASE_URL ??
  process.env.VIATOR_BASE_URL ??
  "https://api.sandbox.viator.com/partner";

const VIATOR_KEY = process.env.VIATOR_API_KEY ?? "";

let cachedTags: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 3600_000; // 1 hour

export async function GET() {
  // Return from cache if fresh
  if (cachedTags && Date.now() - cacheTime < CACHE_TTL) {
    return Response.json(cachedTags);
  }

  if (!VIATOR_KEY) {
    return Response.json({});
  }

  try {
    const res = await fetch(`${VIATOR_BASE}/products/tags`, {
      method: "GET",
      headers: {
        "exp-api-key": VIATOR_KEY,
        Accept: "application/json;version=2.0",
        "Accept-Language": "en-US",
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      console.error(`[viator/tags] ${res.status}`);
      return Response.json({});
    }

    const data = await res.json();
    const map: Record<string, string> = {};

    for (const tag of data.tags ?? []) {
      const name =
        tag.allNamesByLocale?.en ??
        tag.allNamesByLocale?.["en-US"] ??
        tag.allNamesByLocale?.["en_US"] ??
        Object.values(tag.allNamesByLocale ?? {})[0];
      if (tag.tagId != null && name) {
        map[String(tag.tagId)] = String(name);
      }
    }

    cachedTags = map;
    cacheTime = Date.now();
    return Response.json(map);
  } catch (e) {
    console.error("[viator/tags] fetch failed:", e);
    return Response.json({});
  }
}
