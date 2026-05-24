import type { Handler } from "@netlify/functions";

type GoogleGeocodeStatus =
  | "OK"
  | "ZERO_RESULTS"
  | "REQUEST_DENIED"
  | "OVER_QUERY_LIMIT"
  | "INVALID_REQUEST"
  | "UNKNOWN_ERROR";

const STATUS_HINTS: Record<Exclude<GoogleGeocodeStatus, "OK">, string> = {
  REQUEST_DENIED:
    "API key invalid, Geocoding API not enabled, billing not enabled, or key restrictions are wrong.",
  ZERO_RESULTS: "Address may be incomplete or invalid.",
  OVER_QUERY_LIMIT: "Quota or billing issue.",
  INVALID_REQUEST: "Missing or malformed address.",
  UNKNOWN_ERROR: "Google had a temporary issue. Retry the request."
};

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

function parseAddressComponents(result: any) {
  const long = Object.fromEntries(
    (result.address_components || []).flatMap((component: any) =>
      (component.types || []).map((type: string) => [type, component.long_name])
    )
  );
  const short = Object.fromEntries(
    (result.address_components || []).flatMap((component: any) =>
      (component.types || []).map((type: string) => [type, component.short_name])
    )
  );

  return {
    street: `${long.street_number || ""} ${long.route || ""}`.trim(),
    city: long.locality || long.sublocality || "",
    county: long.administrative_area_level_2 || "",
    state: short.administrative_area_level_1 || long.administrative_area_level_1 || "",
    zip: long.postal_code || ""
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { success: false, error: "Method not allowed" });
  }

  let body: { address?: string } = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, {
      success: false,
      error: "Invalid JSON body",
      debugHint: "Send JSON in the format: { \"address\": \"full address here\" }."
    });
  }

  const address = body.address?.trim();
  if (!address) {
    return json(400, {
      success: false,
      error: "Address is required",
      googleStatus: "INVALID_REQUEST",
      googleErrorMessage: "Missing address",
      debugHint: "Missing or malformed address."
    });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return json(500, {
      success: false,
      error: "Google geocoding failed",
      googleStatus: "REQUEST_DENIED",
      googleErrorMessage: "GOOGLE_MAPS_API_KEY is not configured",
      debugHint: "Add GOOGLE_MAPS_API_KEY to Netlify environment variables."
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`;
    const response = await fetch(url);
    const data = await response.json();
    const status = data.status as GoogleGeocodeStatus;

    if (!response.ok || status !== "OK" || !data.results?.length) {
      const normalizedStatus: GoogleGeocodeStatus =
        status && ["OK", "ZERO_RESULTS", "REQUEST_DENIED", "OVER_QUERY_LIMIT", "INVALID_REQUEST", "UNKNOWN_ERROR"].includes(status)
          ? status
          : "UNKNOWN_ERROR";

      return json(400, {
        success: false,
        error: "Google geocoding failed",
        googleStatus: normalizedStatus,
        googleErrorMessage: data.error_message || "No Google error message provided.",
        debugHint: STATUS_HINTS[normalizedStatus === "OK" ? "UNKNOWN_ERROR" : normalizedStatus]
      });
    }

    const result = data.results[0];
    const parsed = parseAddressComponents(result);

    return json(200, {
      success: true,
      formattedAddress: result.formatted_address || address,
      street: parsed.street,
      city: parsed.city,
      county: parsed.county,
      state: parsed.state,
      zip: parsed.zip,
      lat: result.geometry?.location?.lat ?? 0,
      lng: result.geometry?.location?.lng ?? 0,
      placeId: result.place_id || ""
    });
  } catch (error: any) {
    return json(500, {
      success: false,
      error: "Google geocoding failed",
      googleStatus: "UNKNOWN_ERROR",
      googleErrorMessage: error?.message || "Unknown error",
      debugHint: STATUS_HINTS.UNKNOWN_ERROR
    });
  }
};

export { handler };
