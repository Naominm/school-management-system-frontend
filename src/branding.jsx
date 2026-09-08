import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';
import { useAuth } from './auth';

/**
 * School branding — logo, name and theme colour — fetched once after sign-in
 * and shared by the sidebar, page headers and every exported document.
 *
 * The logo is served as an image by the API rather than embedded in JSON, so
 * the browser caches it like any other asset. `logoVersion` is the logo's
 * last-updated stamp, appended to the URL so a newly uploaded logo appears
 * immediately instead of being served from cache.
 */
const BrandingContext = createContext({ branding: null, refresh: () => {}, logoUrl: null });

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`;

export const schoolLogoUrl = (schoolId, version) =>
  schoolId ? `${API_BASE}/schools/${schoolId}/logo${version ? `?v=${encodeURIComponent(version)}` : ''}` : null;

export function BrandingProvider({ children }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState(null);

  async function refresh() {
    if (!user || !user.school_id) { setBranding(null); return; }
    try { setBranding((await api.get('/branding')).data); }
    catch { setBranding(null); }
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.school_id]);

  const value = useMemo(() => ({
    branding,
    refresh,
    logoUrl: branding?.has_logo ? schoolLogoUrl(branding.id, branding.logo_updated_at) : null,
  }), [branding]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export const useBranding = () => useContext(BrandingContext);

/**
 * Fetch an image and hand back a PNG data URL for embedding in a PDF —
 * a school crest, a learner's photo or a teacher's signature.
 *
 * jsPDF only embeds raster formats reliably, so whatever was uploaded — PNG,
 * JPEG, WEBP, GIF or SVG — is redrawn onto a canvas and exported as PNG. The
 * blob is loaded through an object URL, which counts as same-origin, so the
 * canvas is never tainted and toDataURL is allowed even though the image is
 * served from the API host.
 *
 * Returns null on any failure; every caller treats that as "no image" and the
 * document is produced without it rather than failing.
 */
export async function imageDataUrl(url, maxSize = 512) {
  if (!url) return null;
  let objectUrl = null;
  try {
    // Crests are public, but photos and signatures are not — send the token
    // when we have one so the same helper serves all three.
    const token = localStorage.getItem('sms_token');
    const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    if (!res.ok) return null;
    const blob = await res.blob();
    objectUrl = URL.createObjectURL(blob);

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('decode failed'));
      i.src = objectUrl;
    });

    // An SVG without intrinsic dimensions decodes at the browser's default
    // size; fall back to a square so it still renders rather than vanishing.
    const w = img.naturalWidth || maxSize;
    const h = img.naturalHeight || maxSize;
    const scale = Math.min(maxSize / w, maxSize / h, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** The school crest, by its older name. */
export const logoDataUrl = imageDataUrl;

/** Where a learner's photo is served from. */
export const studentPhotoUrl = (id, version) =>
  (id ? `${API_BASE}/students/${id}/photo${version ? `?v=${encodeURIComponent(version)}` : ''}` : null);

/** Where a teacher's signature is served from. */
export const teacherSignatureUrl = (id, version) =>
  (id ? `${API_BASE}/teachers/${id}/signature${version ? `?v=${encodeURIComponent(version)}` : ''}` : null);

/** The API root, for callers that build their own image URLs. */
export const apiBase = API_BASE;

/**
 * An authenticated image, as a data URL usable by `<img src>`.
 *
 * Learner photos and signatures need a bearer token, which a plain `<img>`
 * cannot send, so they are fetched here and handed over as data. Returns null
 * until it loads, and stays null if there is nothing to show — every caller
 * renders a fallback for that rather than a broken image.
 */
export function useAuthedImage(url) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let live = true;
    setSrc(null);
    if (url) imageDataUrl(url, 640).then((d) => { if (live) setSrc(d); });
    return () => { live = false; };
  }, [url]);
  return src;
}

/**
 * Everything an exported document needs to carry the school's identity:
 * the crest as embeddable data, the name, contacts, motto and accent.
 *
 * Returned as a function rather than a value because the crest has to be
 * fetched — a page calls it when the user asks for a document, not on render.
 */
export function usePrintBrand() {
  const { branding, logoUrl } = useBranding();
  return useCallback(async () => ({
    logo: await imageDataUrl(logoUrl),
    schoolName: branding?.name,
    motto: branding?.motto,
    address: branding?.address,
    phone: branding?.phone,
    email: branding?.email,
  }), [branding, logoUrl]);
}
