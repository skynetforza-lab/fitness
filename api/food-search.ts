// Vercel serverless function — proxies Open Food Facts search server-side
// to avoid CORS restrictions on the browser.

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const query = url.searchParams.get("query") ?? "";

  if (!query.trim()) {
    return new Response(JSON.stringify({ error: "query param required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiUrl =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(query)}` +
    `&json=1&fields=product_name,nutriments&page_size=20`;

  try {
    const upstream = await fetch(apiUrl, {
      headers: { "User-Agent": "FitnessTracker/1.0 (fitness@example.com)" },
    });
    const data = await upstream.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=3600",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "upstream request failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = { runtime: "edge" };
