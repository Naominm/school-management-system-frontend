import { useBranding } from './branding';

/**
 * Which part of the app belongs to which switchable feature.
 *
 * Keys match the server's registry. The server is what enforces a feature
 * being off — this only keeps a school from seeing menu items and pages that
 * would answer "not enabled" if opened.
 */
export const PAGE_FEATURES = {
  '/attendance': 'attendance',
  '/merit-list': 'merit_list',
  '/fees': 'fees',
  '/progress': 'progress',
  '/messages': 'messages',
  '/notices': 'notices',
};

export const RESOURCE_FEATURES = {
  assignments: 'assignments',
  assessments: 'assessments',
  announcements: 'announcements',
  timetables: 'timetables',
  resources: 'teaching_records',
  schemes: 'teaching_records',
  'lesson-plans': 'teaching_records',
  notes: 'teaching_records',
};

/** The feature a pathname belongs to, or null for core pages. */
export function featureForPath(pathname) {
  if (PAGE_FEATURES[pathname]) return PAGE_FEATURES[pathname];
  const m = /^\/r\/([^/]+)/.exec(pathname || '');
  return m ? RESOURCE_FEATURES[m[1]] || null : null;
}

/** `enabled(key)` for the signed-in school. Everything is on until told otherwise. */
export function useFeatures() {
  const { branding } = useBranding();
  const off = new Set(branding?.disabled_features || []);
  return { enabled: (key) => !key || !off.has(key), disabled: off };
}
