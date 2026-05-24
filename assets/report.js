window.ReportPage = (() => {
  const state = { selectedPlace: null, geocodeError: null };

  const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  function devLog(...args) {
    if (isDev) console.log('[geocode]', ...args);
  }

  function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google?.maps?.places) return resolve();
      const existing = document.getElementById('gmaps-script');
      if (existing) { existing.addEventListener('load', resolve); return; }
      const s = document.createElement('script');
      s.id = 'gmaps-script';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`; 
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Unable to load Google Maps script'));
      document.head.appendChild(s);
    });
  }

  function parsePlace(place) {
    const comps = Object.fromEntries((place.address_components || []).flatMap(c => c.types.map(t => [t, c.long_name])));
    const short = Object.fromEntries((place.address_components || []).flatMap(c => c.types.map(t => [t, c.short_name])));
    return {
      formattedAddress: place.formatted_address || '',
      street: `${comps.street_number || ''} ${comps.route || ''}`.trim(),
      city: comps.locality || comps.sublocality || '',
      county: comps.administrative_area_level_2 || '',
      state: short.administrative_area_level_1 || comps.administrative_area_level_1 || '',
      zip: comps.postal_code || '',
      lat: place.geometry?.location?.lat?.() ?? null,
      lng: place.geometry?.location?.lng?.() ?? null,
      placeId: place.place_id || ''
    };
  }

  async function init() {
    const host = document.getElementById('addressAutocompleteHost');
    const key = Storage.getGoogleMapsApiKey();
    if (!key) {
      host.innerHTML = '<p class="muted">Google key missing. Open <a href="settings.html">Profile &amp; Settings</a> to add it, or use manual address input.</p>';
      return;
    }
    host.innerHTML = '<p class="muted">Loading Google Places…</p>';
    try {
      await loadGoogleMaps(key);
      host.innerHTML = '<input id="autocompleteInput" placeholder="Start typing an address…"/><button id="clearAddress" class="btn subtle">Clear</button><button id="fallbackManual" class="btn subtle">Manual entry</button><p id="autoError" class="muted small"></p>';
      const input = document.getElementById('autocompleteInput');
      const ac = new google.maps.places.Autocomplete(input, { types: ['address'], fields: ['formatted_address','address_components','geometry','place_id']});
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const parsed = parsePlace(place);
        state.selectedPlace = parsed;
        document.getElementById('manualAddress').value = parsed.formattedAddress;
        document.getElementById('selectedAddressMeta').textContent = `${parsed.city}, ${parsed.state} ${parsed.zip} | lat: ${parsed.lat} lng: ${parsed.lng}`;
        renderMapPreview(parsed.lat, parsed.lng);
      });
      document.getElementById('clearAddress').onclick = () => { input.value = ''; state.selectedPlace = null; };
      document.getElementById('fallbackManual').onclick = () => { input.value = ''; input.blur(); };
    } catch (e) {
      host.innerHTML = '<p class="muted">Google autocomplete unavailable. Manual entry enabled.</p>';
    }
  }

  function renderMapPreview(lat, lng) {
    const el = document.getElementById('mapPreview');
    if (!lat || !lng) {
      el.innerHTML = '<p class="muted">Map preview unavailable.</p>';
      return;
    }
    const key = Storage.getGoogleMapsApiKey();
    el.innerHTML = `<img alt="Map preview" style="width:100%;border-radius:12px" src="https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x300&markers=color:red%7C${lat},${lng}&key=${encodeURIComponent(key)}"/>`;
  }

  async function generateReport() {
    const status = document.getElementById('reportStatus');
    const rawAddress = document.getElementById('manualAddress').value.trim();
    const payload = state.selectedPlace || { formattedAddress: rawAddress };
    state.geocodeError = null;

    if (!payload.lat && rawAddress) {
      const endpoint = '/.netlify/functions/geocode-address';
      const sanitizedAddress = rawAddress.replace(/\s+/g, ' ').trim();
      devLog('request endpoint', endpoint);
      devLog('sanitized address', sanitizedAddress);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: sanitizedAddress })
        });
        const data = await res.json();
        devLog('status', data.googleStatus || (data.success ? 'OK' : 'UNKNOWN_ERROR'));

        if (res.ok && data.success) {
          Object.assign(payload, data);
        } else {
          state.geocodeError = data;
          devLog('error details', {
            error: data.error,
            googleStatus: data.googleStatus,
            googleErrorMessage: data.googleErrorMessage,
            debugHint: data.debugHint
          });
        }
      } catch (error) {
        state.geocodeError = {
          error: 'Google geocoding failed',
          googleStatus: 'UNKNOWN_ERROR',
          googleErrorMessage: error?.message || 'Network error',
          debugHint: 'Check function logs and network connectivity.'
        };
        devLog('error details', state.geocodeError);
      }
    }

    const resolvedAddress = payload.formattedAddress || payload.formatted_address || rawAddress;
    if (!resolvedAddress) return (status.textContent = 'Address is required.');

    const key = Storage.getGoogleMapsApiKey();
    const streetView = payload.lat && payload.lng && key
      ? `https://maps.googleapis.com/maps/api/streetview?size=800x450&location=${payload.lat},${payload.lng}&key=${encodeURIComponent(key)}`
      : '';

    const report = {
      id: crypto.randomUUID(),
      address: resolvedAddress,
      formattedAddress: resolvedAddress,
      street: payload.street || '',
      city: payload.city || '',
      county: payload.county || '',
      state: payload.state || '',
      zip: payload.zip || '',
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      placeId: payload.placeId || '',
      geocodeVerified: !state.geocodeError,
      geocodeError: state.geocodeError,
      main_image_url: streetView,
      created_at: new Date().toISOString()
    };

    Storage.saveReport(report);

    if (state.geocodeError) {
      const details = [state.geocodeError.error, state.geocodeError.debugHint].filter(Boolean).join(' ');
      status.textContent = `Address could not be verified. Report will be generated with limited location data. ${details}`.trim();
    } else {
      status.textContent = 'Report generated successfully.';
    }
  }

  document.getElementById('generateReportBtn').onclick = generateReport;
  init();
})();
