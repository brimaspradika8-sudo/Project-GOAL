import {
  type FieldValidationSettings,
  DEFAULT_FIELD_VALIDATION_SETTINGS,
} from './fieldValidationSettings';

export const SPORT_OPTIONS = ['Futsal', 'Basket', 'Badminton', 'Voli', 'Tenis', 'Mini Soccer', 'Padel'];

export const SPORT_MAP: Record<string, string> = {
  'Futsal': 'futsal',
  'Basket': 'basketball',
  'Badminton': 'badminton',
  'Voli': 'volleyball',
  'Tenis': 'tennis',
  'Mini Soccer': 'mini_soccer',
  'Padel': 'padel',
};

export const VALID_SPORT_VALUES = Object.values(SPORT_MAP);

export const SPORT_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_MAP).map(([label, key]) => [key, label]),
);

const ALLOWED_IMAGE_MIMES = ['image/jpeg'];
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg'];

export type FieldFormErrors = {
  name: string;
  sport_type: string;
  price_per_hour: string;
  image: string;
  description: string;
  location: string;
};

export const EMPTY_ERRORS: FieldFormErrors = {
  name: '',
  sport_type: '',
  price_per_hour: '',
  image: '',
  description: '',
  location: '',
};

export function validateFieldName(
  value: string,
  settings: Partial<FieldValidationSettings> = DEFAULT_FIELD_VALIDATION_SETTINGS,
): string {
  const max = settings.max_name_length ?? DEFAULT_FIELD_VALIDATION_SETTINGS.max_name_length;
  const v = value.trim();
  if (!v) return 'Nama lapangan wajib diisi.';
  if (v.length < 5) return 'Nama lapangan minimal 5 karakter.';
  if (v.length > max) return `Nama lapangan tidak boleh lebih dari ${max} karakter.`;
  return '';
}

export function validateFieldSportType(value: string): string {
  const v = value.trim();
  if (!v) return 'Jenis olahraga wajib diisi.';
  if (v.length > 50) return 'Jenis olahraga tidak boleh lebih dari 50 karakter.';
  return '';
}

export function validateFieldPrice(
  value: string,
  settings: Partial<FieldValidationSettings> = DEFAULT_FIELD_VALIDATION_SETTINGS,
): string {
  const min = settings.min_price ?? DEFAULT_FIELD_VALIDATION_SETTINGS.min_price;
  const max = settings.max_price ?? DEFAULT_FIELD_VALIDATION_SETTINGS.max_price;
  const v = value.trim();
  if (!v) return '';
  if (/\D/.test(v)) {
    return 'Harga harus berupa angka bulat (tanpa huruf/simbol).';
  }
  const num = parseInt(v, 10);
  if (isNaN(num)) return 'Harga harus berupa angka.';
  if (num < min) return `Harga per jam tidak boleh kurang dari Rp ${min.toLocaleString('id-ID')}.`;
  if (num > max) return `Harga per jam tidak boleh lebih dari Rp ${max.toLocaleString('id-ID')}.`;
  return '';
}

export function validateFieldImage(uri: string, existingUrl: string, mimeType?: string): string {
  const source = uri || existingUrl;
  if (!source) return 'Foto venue wajib diunggah';
  if (mimeType) {
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType.toLowerCase())) {
      return 'Hanya Menggunakan Format JPG';
    }
    return '';
  }
  const ext = source.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return 'Hanya JPG yang diperbolehkan';
  }
  return '';
}

export function mimeFromExt(ext: string): string {
  const map: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  return map[ext.toLowerCase()] || 'image/jpeg';
}

export function validateFieldImageSize(
  fileSize: number,
  settings: Partial<FieldValidationSettings> = DEFAULT_FIELD_VALIDATION_SETTINGS,
): string {
  const maxMb = settings.max_image_mb ?? DEFAULT_FIELD_VALIDATION_SETTINGS.max_image_mb;
  const maxBytes = maxMb * 1024 * 1024;
  if (fileSize > maxBytes) {
    return `Ukuran gambar maksimal ${maxMb}MB`;
  }
  return '';
}

export function validateFieldDescription(
  value: string,
  settings: Partial<FieldValidationSettings> = DEFAULT_FIELD_VALIDATION_SETTINGS,
): string {
  const max = settings.max_description_length ?? DEFAULT_FIELD_VALIDATION_SETTINGS.max_description_length;
  const v = value.trim();
  if (!v) return '';
  if (v.length < 10) return 'Deskripsi minimal 10 karakter jika diisi.';
  if (v.length > max) return `Deskripsi tidak boleh lebih dari ${max} karakter.`;
  return '';
}

export function validateFieldLocation(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (v.length > 255) return 'Lokasi tidak boleh lebih dari 255 karakter.';
  return '';
}

export type FieldFormData = {
  name: string;
  sport_type: string;
  description: string;
  price_per_hour: string;
  image_url: string;
  image_uri: string;
  image_mime: string;
  location: string;
};

export function validateAllFields(
  form: FieldFormData,
  settings: Partial<FieldValidationSettings> = DEFAULT_FIELD_VALIDATION_SETTINGS,
): FieldFormErrors {
  return {
    name: validateFieldName(form.name, settings),
    sport_type: validateFieldSportType(form.sport_type),
    price_per_hour: validateFieldPrice(form.price_per_hour, settings),
    image: validateFieldImage(form.image_uri, form.image_url, form.image_mime),
    description: validateFieldDescription(form.description, settings),
    location: validateFieldLocation(form.location),
  };
}

export function hasErrors(errors: FieldFormErrors): boolean {
  return Object.values(errors).some(e => e !== '');
}

