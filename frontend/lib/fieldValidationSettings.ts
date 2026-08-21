import { apiGet, apiSend } from './apiClient';

export interface FieldValidationSettings {
  max_name_length: number;
  max_description_length: number;
  min_price: number;
  max_price: number;
  max_image_mb: number;
}

// Fallback used before the real settings load from the server (or if the
// request fails) — mirrors the defaults seeded on the backend.
export const DEFAULT_FIELD_VALIDATION_SETTINGS: FieldValidationSettings = {
  max_name_length: 50,
  max_description_length: 1000,
  min_price: 10000,
  max_price: 5000000,
  max_image_mb: 2,
};

export async function fetchFieldValidationSettings(): Promise<FieldValidationSettings> {
  const res = await apiGet<{ data: FieldValidationSettings }>('/field-validation-settings');
  return res.data;
}

export async function saveFieldValidationSettings(
  payload: FieldValidationSettings
): Promise<FieldValidationSettings> {
  const res = await apiSend<{ data: FieldValidationSettings }>(
    'PUT',
    '/super-admin/field-validation-settings',
    { body: payload }
  );
  return res.data;
}
