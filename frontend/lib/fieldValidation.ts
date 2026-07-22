export const SPORT_OPTIONS = ['Futsal', 'Basket', 'Badminton', 'Voli', 'Tenis', 'Mini Soccer', 'Lainnya'];

export const SPORT_MAP: Record<string, string> = {
  'Futsal': 'futsal',
  'Basket': 'basketball',
  'Badminton': 'badminton',
  'Voli': 'volleyball',
  'Tenis': 'tennis',
  'Mini Soccer': 'mini_soccer',
  'Lainnya': 'other',
};

export const VALID_SPORT_VALUES = Object.values(SPORT_MAP);

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export type FieldFormErrors = {
  name: string;
  sport_type: string;
  price_per_hour: string;
  image: string;
  description: string;
};

export const EMPTY_ERRORS: FieldFormErrors = {
  name: '',
  sport_type: '',
  price_per_hour: '',
  image: '',
  description: '',
};

export function validateFieldName(value: string): string {
  const v = value.trim();
  if (!v) return 'Nama lapangan wajib diisi';
  if (v.length < 5) return 'Nama lapangan minimal 5 karakter';
  if (v.length > 50) return 'Nama lapangan maksimal 50 karakter';
  return '';
}

export function validateFieldSportType(value: string): string {
  if (!value.trim()) return 'Silahkan pilih kategori lapangan';
  if (!VALID_SPORT_VALUES.includes(value.trim())) return 'Kategori tidak valid';
  return '';
}

export function validateFieldPrice(value: string): string {
  const v = value.trim();
  if (!v) return '';
  const cleaned = v.replace(/\D/g, '');
  if (cleaned !== v.replace(/[^0-9]/g, '') || /\D/.test(v.replace(/\./g, '').replace(/,/g, ''))) {
    return 'Harga harus berupa angka';
  }
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return 'Harga harus berupa angka';
  if (num < 10000) return 'Harga minimal Rp10.000';
  if (num > 10000000) return 'Harga maksimal Rp10.000.000';
  return '';
}

export function validateFieldImage(uri: string, existingUrl: string, mimeType?: string): string {
  const source = uri || existingUrl;
  if (!source) return 'Foto venue wajib diunggah';
  if (mimeType) {
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType.toLowerCase())) {
      return 'Format gambar harus JPG, JPEG, PNG, atau WEBP';
    }
    return '';
  }
  const ext = source.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    return 'Format gambar harus JPG, JPEG, PNG, atau WEBP';
  }
  return '';
}

export function mimeFromExt(ext: string): string {
  const e = ext.toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function validateFieldImageSize(fileSize: number): string {
  if (fileSize > MAX_IMAGE_SIZE) {
    return 'Ukuran gambar maksimal 5MB';
  }
  return '';
}

export function validateFieldDescription(value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (v.length < 50) return 'Deskripsi minimal 50 karakter';
  if (v.length > 255) return 'Deskripsi maksimal 255 karakter';
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
};

export function validateAllFields(form: FieldFormData): FieldFormErrors {
  return {
    name: validateFieldName(form.name),
    sport_type: validateFieldSportType(form.sport_type),
    price_per_hour: validateFieldPrice(form.price_per_hour),
    image: validateFieldImage(form.image_uri, form.image_url, form.image_mime),
    description: validateFieldDescription(form.description),
  };
}

export function hasErrors(errors: FieldFormErrors): boolean {
  return Object.values(errors).some(e => e !== '');
}
