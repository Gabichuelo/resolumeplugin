/**
 * Remote PIN helper for the Wi-Fi phone / tablet Stage Remote.
 * - The PIN arrives automatically inside the QR URL (?remote=1&pin=1234)
 * - It is remembered in localStorage so the phone stays logged in
 * - Every API call from the phone carries the X-GrandDas-Pin header
 */
const PIN_STORAGE_KEY = 'granddas_remote_pin';

export function getRemotePin(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('pin');
    if (fromUrl && /^\d{4,8}$/.test(fromUrl)) {
      localStorage.setItem(PIN_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(PIN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveRemotePin(pin: string): void {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, pin.trim());
  } catch {}
}

export async function remoteFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const pin = getRemotePin();
  if (pin) headers.set('X-GrandDas-Pin', pin);
  return fetch(url, { ...init, headers });
}
