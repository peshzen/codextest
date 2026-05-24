import type { Handler } from "@netlify/functions";

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { address } = JSON.parse(event.body || "{}");
    if (!address) return { statusCode: 400, body: JSON.stringify({ error: "address is required" }) };
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return { statusCode: 500, body: JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }) };

    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (!res.ok || data.status !== "OK" || !data.results?.length) {
      return { statusCode: 400, body: JSON.stringify({ error: data.error_message || data.status || "Geocoding failed" }) };
    }

    const result = data.results[0];
    const comps = Object.fromEntries(result.address_components.flatMap((c: any) => c.types.map((t: string) => [t, c.long_name])));
    const short = Object.fromEntries(result.address_components.flatMap((c: any) => c.types.map((t: string) => [t, c.short_name])));

    return {
      statusCode: 200,
      body: JSON.stringify({
        formatted_address: result.formatted_address,
        street_address: `${comps.street_number || ""} ${comps.route || ""}`.trim(),
        city: comps.locality || comps.sublocality || "",
        county: comps.administrative_area_level_2 || "",
        state: short.administrative_area_level_1 || comps.administrative_area_level_1 || "",
        zip: comps.postal_code || "",
        latitude: result.geometry?.location?.lat ?? null,
        longitude: result.geometry?.location?.lng ?? null,
        place_id: result.place_id || ""
      })
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Unknown error" }) };
  }
};

export { handler };
