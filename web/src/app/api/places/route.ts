import { NextRequest, NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Proxy for Google Places API (New) — Text Search.
 * - Never exposes API key to the client
 * - No caching/storage of results (Google ToS compliant)
 * - Requires authenticated session
 */
export async function GET(request: NextRequest) {
  // Auth check
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await decodeSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "places_not_configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q"); // e.g. "plombier Casablanca"
  const city = searchParams.get("city") ?? "Casablanca";

  if (!query || query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: "query_invalid" }, { status: 400 });
  }
  if (city.length > 100) {
    return NextResponse.json({ error: "city_invalid" }, { status: 400 });
  }

  try {
    const textQuery = `${query} ${city} Maroc`;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.googleMapsUri,places.businessStatus,places.photos",
      },
      body: JSON.stringify({
        textQuery,
        languageCode: "fr",
        regionCode: "MA",
        maxResultCount: 10,
      }),
    });

    if (!res.ok) {
      console.error("[Places API] Error:", res.status);
      return NextResponse.json({ error: "places_api_error" }, { status: 502 });
    }

    const data = await res.json();

    // Map to minimal shape — no storage, just pass-through
    const places = (data.places ?? []).map((p: any) => ({
      name: p.displayName?.text ?? "",
      address: p.formattedAddress ?? "",
      rating: p.rating ?? 0,
      reviewCount: p.userRatingCount ?? 0,
      phone: p.nationalPhoneNumber ?? null,
      mapsUrl: p.googleMapsUri ?? null,
      open: p.businessStatus === "OPERATIONAL",
      // Photo reference for Google-hosted image (requires attribution)
      photoRef: p.photos?.[0]?.name ?? null,
    }));

    return NextResponse.json({
      places,
      // Google ToS: must include attribution
      attribution: "Powered by Google",
    });
  } catch (err) {
    console.error("[Places API] Fetch error:", err);
    return NextResponse.json({ error: "places_fetch_failed" }, { status: 500 });
  }
}
