import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { imageDataUrl } from './branding';
import { drawReportCards } from './reportCardLayout';

/* ── Asset loading ─────────────────────────────────────────────────────── */

/**
 * Fetch every image the batch needs, once each.
 *
 * A failed fetch resolves to null rather than rejecting: a missing photo must
 * not stop a class of cards from printing.
 */
async function loadAssets({ card, apiBase, logoUrl, origin }) {
  const [logo, photos, signatures, qrs] = await Promise.all([
    imageDataUrl(logoUrl),
    Promise.all(card.students
      .filter((s) => s.has_photo)
      .map(async (s) => [s.id, await imageDataUrl(
        `${apiBase}/students/${s.id}/photo?v=${encodeURIComponent(s.photo_updated_at || '')}`, 400,
      )])),
    Promise.all([...new Map(card.students
      .flatMap((s) => [s.class_teacher, s.headteacher])
      .filter((t) => t?.has_signature)
      .map((t) => [t.id, t])).values()]
      .map(async (t) => [t.id, await imageDataUrl(
        `${apiBase}/teachers/${t.id}/signature?v=${encodeURIComponent(t.signature_updated_at || '')}`, 400,
      )])),
    Promise.all(card.students.map(async (s) => {
      try {
        const url = `${origin}/report-cards?code=${s.verification_code}&student=${s.id}`;
        return [s.id, await QRCode.toDataURL(url, { margin: 0, width: 220, color: { dark: '#28B24Bff', light: '#FFFFFFff' } })];
      } catch { return [s.id, null]; }
    })),
  ]);

  const map = (pairs) => new Map(pairs.filter(([, v]) => v));
  return { logo, photos: map(photos), signatures: map(signatures), qrs: map(qrs) };
}

/* ── Entry point ───────────────────────────────────────────────────────── */

/**
 * Render a class (or a single learner) as one page each, and save it.
 *
 * `card` is the server's report-card payload verbatim, so the printed
 * document and the on-screen card cannot drift apart.
 */
export async function reportCardsPdf({ card, filename, apiBase, logoUrl, origin = window.location.origin }) {
  const assets = await loadAssets({ card, apiBase, logoUrl, origin });
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  drawReportCards(doc, card, assets);
  doc.save(`${filename}.pdf`);
}
