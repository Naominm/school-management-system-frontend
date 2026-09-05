import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

/** Fetch the logo as a data URL, for embedding into generated PDFs. */
export async function logoDataUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    // jsPDF cannot rasterise SVG; skip it rather than produce a broken image.
    if (blob.type === 'image/svg+xml') return null;
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}
