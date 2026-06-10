export const PHOTO_SLOTS = [
  { key: 'front', label: 'Front', required: true },
  { key: 'right', label: 'Right side', required: false },
  { key: 'left', label: 'Left side', required: false },
  { key: 'back', label: 'Back side', required: false },
  { key: 'damages1', label: 'Damages 1', required: false },
  { key: 'damages2', label: 'Damages 2', required: false },
];

export const PHOTO_SLOT_KEYS = PHOTO_SLOTS.map((s) => s.key);

export function emptyPhotoSlots() {
  return Object.fromEntries(PHOTO_SLOT_KEYS.map((key) => [key, '']));
}

/** Supports legacy string[] or labeled slot object from API. */
export function normalizePhotoSlots(value) {
  if (!value) return emptyPhotoSlots();
  if (Array.isArray(value)) {
    const out = emptyPhotoSlots();
    value.forEach((url, index) => {
      const key = PHOTO_SLOT_KEYS[index];
      if (key && url) out[key] = String(url);
    });
    return out;
  }
  if (typeof value === 'object') {
    const out = emptyPhotoSlots();
    for (const key of PHOTO_SLOT_KEYS) {
      if (value[key]) out[key] = String(value[key]);
    }
    return out;
  }
  return emptyPhotoSlots();
}

export function countFilledSlots(value) {
  const slots = normalizePhotoSlots(value);
  return PHOTO_SLOT_KEYS.filter((key) => slots[key]).length;
}

export function hasRequiredPhotos(value) {
  const slots = normalizePhotoSlots(value);
  return Boolean(slots.front);
}
