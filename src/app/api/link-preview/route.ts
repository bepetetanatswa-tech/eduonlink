function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re);
  if (m) return m[1];
  // Some pages order content before property/name
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i");
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return Response.json({ error: "url is required" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
    if (!["http:", "https:"].includes(target.protocol)) throw new Error("bad protocol");
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EduconnectBot/1.0; +link-preview)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return Response.json({ error: "Could not fetch URL" }, { status: 502 });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return Response.json({ title: target.hostname, image: null, description: null, url: target.toString() });
    }

    const html = (await res.text()).slice(0, 100_000);
    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
      target.hostname;
    const image = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
    const description = extractMeta(html, "og:description") ?? extractMeta(html, "description");

    return Response.json({ title: title.trim(), image, description, url: target.toString() });
  } catch {
    return Response.json({ error: "Could not fetch preview" }, { status: 502 });
  }
}
