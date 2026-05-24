export type SelectedAddress = {
  formattedAddress: string;
  street: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  placeId: string;
};

type Props = {
  apiKey?: string;
  onSelect: (address: SelectedAddress) => void;
  onManualFallback?: () => void;
};

export function GoogleAddressAutocomplete({ apiKey, onSelect, onManualFallback }: Props) {
  // This repository is static HTML/JS today; this TSX component documents
  // the reusable interface used by the runtime implementation in assets/report.js.
  // Migrate this component into your React bundle if/when the app is upgraded.
  void apiKey;
  void onSelect;
  void onManualFallback;
  return null;
}
