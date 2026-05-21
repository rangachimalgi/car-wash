import { resolveAssetUrl } from '../config/api';

/** Tall image beside add-ons in View Details bottom sheet (falls back to expanded panel image). */
export function resolveServiceDetailsPanelImageUri(service) {
  const raw = service?.detailsPanelImage || service?.panelImage || '';
  return resolveAssetUrl(raw) || '';
}

/** Tall image beside add-ons when the wash card is expanded on list screens. */
export function resolveServicePanelImageUri(service) {
  const raw = service?.panelImage || '';
  return resolveAssetUrl(raw) || '';
}
