import { useEffect, useState } from 'react';
import { Box, Typography, Switch, Stack, Divider, Button, Alert, LinearProgress } from '@mui/material';
import api from '../api';
import { useBranding } from '../branding';

/**
 * The school administrator's own feature choices.
 *
 * Lists only what the platform allows this school — anything switched off in
 * the platform console is not here at all — and hiding is all it can do.
 * Saving refreshes the school's branding, which is what the menu is built
 * from, so a hidden item leaves the sidebar at once rather than on next sign-in.
 */
export default function SchoolFeatures() {
  const { refresh } = useBranding();
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/school-features');
      setItems(data);
      setDraft(Object.fromEntries(data.map((f) => [f.key, f.on])));
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load features');
      setItems([]);
    }
  }

  useEffect(() => { load(); }, []);

  /* A feature hidden takes its dependents with it (SMS goes with Notices), and
   * showing a dependent brings its parent back. The server applies the same. */
  function toggle(key, on) {
    setDraft((d) => {
      const next = { ...d, [key]: on };
      if (!on) items.filter((f) => f.requires === key).forEach((f) => { next[f.key] = false; });
      if (on) {
        const f = items.find((x) => x.key === key);
        if (f?.requires && f.requires in next) next[f.requires] = true;
      }
      return next;
    });
  }

  async function save() {
    setBusy(true); setError(''); setOk('');
    try {
      const hidden = items.filter((f) => !draft[f.key]).map((f) => f.key);
      await api.put('/school-features', { hidden });
      await refresh();
      await load();
      setOk('Saved. Hidden features are gone for everyone at your school.');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your choices');
    } finally {
      setBusy(false);
    }
  }

  if (!items) return <LinearProgress />;

  const changed = items.some((f) => f.on !== draft[f.key]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError('')}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 1.5 }} onClose={() => setOk('')}>{ok}</Alert>}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Hide the parts of the system your school does not use. A hidden feature disappears for
        everyone here — from the menu, its pages and the dashboards. Nothing is deleted: switching
        it back on brings its records back. Learners, classes, marks and report cards are always on.
      </Typography>

      {!items.length ? (
        <Typography variant="body2" color="text.secondary">
          There is nothing to choose here — contact the platform administrator.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />}>
          {items.map((f) => {
            const on = !!draft[f.key];
            const parentOff = f.requires && f.requires in draft && !draft[f.requires];
            const parent = items.find((x) => x.key === f.requires);
            return (
              <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, pl: f.requires ? 3 : 0 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {parentOff ? `Needs ${parent?.label} on.` : f.description}
                  </Typography>
                </Box>
                <Switch
                  checked={on} disabled={!!parentOff || busy}
                  onChange={(e) => toggle(f.key, e.target.checked)}
                  inputProps={{ 'aria-label': `${f.label} ${on ? 'on' : 'off'}` }}
                />
              </Box>
            );
          })}
        </Stack>
      )}

      {!!items.length && (
        <Button variant="contained" sx={{ mt: 2 }} disabled={busy || !changed} onClick={save}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      )}
    </Box>
  );
}
