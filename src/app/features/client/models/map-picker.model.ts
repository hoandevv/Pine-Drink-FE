export interface MapPickerResult {
  latitude: number;
  longitude: number;
  displayName?: string;
  addressLine?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
}
