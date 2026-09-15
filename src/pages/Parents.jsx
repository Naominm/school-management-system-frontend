import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, TableContainer,
  Alert, Tabs, Tab, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  LinearProgress, IconButton, Tooltip, useMediaQuery, InputAdornment,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import SendIcon from '@mui/icons-material/Sms';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';
import { useAuth } from '../auth';
import { exportCsv } from '../exportCsv';
import { usePrintBrand } from '../branding';
import { activationSlipsPdf } from '../activationSlips';
import SchoolHeader from '../components/SchoolHeader';
import ImportParents from '../components/ImportParents';

/**
 * Parents and guardians, from the school's side.
 *
 * The point of the page is that every learner ends up with a parent who can
 * sign in. So it opens on how far off that is, lists the learners still
 * without one, and puts the two ways of getting a code to a parent — a text
 * and email, or a printed slip — next to each parent.
 */

const STATUS = {
  activated: { label: 'Active', color: 'success' },
  waiting: { label: 'Not activated', color: 'warning' },
  off: { label: 'Switched off', color: 'default' },
};
const statusOf = (p) => (!p.active ? STATUS.off : (p.activated ? STATUS.activated : STATUS.waiting));
const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Sponsor', 'Other'];
const channelText = { sent: 'sent', failed: 'failed', none: 'no contact', not_configured: 'not configured on the server' };

function Tile({ label, value, sub, tone }) {
  return (
    <Paper sx={{ p: 2, flex: '1 1 150px', minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4, display: 'block' }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: tone || 'text.primary' }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

/** Link a parent to a learner — a new contact, or one already on file. */
function LinkDialog({ learner, onClose, onDone }) {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', relationship: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (learner) {
      setForm({
        full_name: learner.parent_name || '', phone: learner.parent_phone || '',
        email: learner.parent_email || '', relationship: '',
      });
      setError('');
    }
  }, [learner]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(`/students/${learner.id}/guardians`, form);
      onDone(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not link that parent');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={!!learner} onClose={onClose} maxWidth="xs">
      <DialogTitle>Add a parent{learner ? ` for ${learner.name}` : ''}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          A phone number or email is needed — it is how the parent signs in, and where their code is sent. A parent
          already registered at this or another school is found by the same phone or email.
        </Typography>
        <TextField label="Full name" fullWidth margin="dense" value={form.full_name} onChange={set('full_name')} />
        <TextField label="Phone number" fullWidth margin="dense" placeholder="0712 345 678" value={form.phone} onChange={set('phone')} />
        <TextField label="Email" type="email" fullWidth margin="dense" value={form.email} onChange={set('email')} />
        <TextField select label="Relationship" fullWidth margin="dense" value={form.relationship} onChange={set('relationship')}>
          <MenuItem value="">—</MenuItem>
          {RELATIONSHIPS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy || (!form.phone.trim() && !form.email.trim())}>
          {busy ? 'Linking…' : 'Link parent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Correct a parent's details. Contacts lock once the parent has activated. */
function EditDialog({ parent, onClose, onDone }) {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (parent) {
      setForm({ full_name: parent.full_name || '', phone: parent.phone || '', email: parent.email || '' });
      setError('');
    }
  }, [parent]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    setError('');
    try {
      const body = parent.activated ? { full_name: form.full_name } : form;
      await api.put(`/guardians/${parent.id}`, body);
      onDone();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={!!parent} onClose={onClose} maxWidth="xs">
      <DialogTitle>Edit parent</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
        {parent?.activated && (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            This parent has activated their account, so their phone number and email are theirs to change.
          </Alert>
        )}
        <TextField label="Full name" fullWidth margin="dense" value={form.full_name} onChange={set('full_name')} />
        <TextField label="Phone number" fullWidth margin="dense" value={form.phone} onChange={set('phone')} disabled={parent?.activated} />
        <TextField label="Email" type="email" fullWidth margin="dense" value={form.email} onChange={set('email')} disabled={parent?.activated} />
        {!parent?.activated && (
          <Typography variant="caption" color="text.secondary">
            Changing a contact cancels any code already sent to the old one.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Parents() {
  const { user } = useAuth();
  const manage = user?.role === 'admin' || /head|deputy/i.test(`${user?.position || ''} ${user?.role || ''}`);
  // Class teachers may link parents as well as administrators.
  const mayLink = manage || user?.role === 'teacher';
  const compact = useMediaQuery((t) => t.breakpoints.down('sm'));
  const printBrand = usePrintBrand();

  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [linking, setLinking] = useState(null);
  const [editing, setEditing] = useState(null);
  const [slipClass, setSlipClass] = useState('');

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/guardians/overview');
      setData(d);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load parents');
    }
  }, []);

  useEffect(() => {
    load();
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => setClasses([]));
  }, [load]);

  const q = query.trim().toLowerCase();
  const match = (...values) => !q || values.some((v) => String(v || '').toLowerCase().includes(q));
  const parents = useMemo(() => (data?.parents || []).filter((p) => match(
    p.full_name, p.phone, p.email, ...p.learners.map((l) => `${l.name} ${l.admission_number || ''}`),
  )), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const unlinked = useMemo(() => (data?.unlinked || []).filter((s) => match(s.name, s.admission_number, s.class_name, s.parent_phone, s.parent_email)),
    [data, q]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(key, fn) {
    setBusy(key);
    setError('');
    setNotice('');
    try { await fn(); } catch (e) {
      setError(e.response?.data?.error || e.message || 'Something went wrong');
    } finally { setBusy(''); }
  }

  const linkRecords = () => run('link', async () => {
    const { data: r } = await api.post('/guardians/link-records');
    const parts = [`${r.linked} learner(s) linked to a parent`];
    if (r.accounts_created) parts.push(`${r.accounts_created} new parent account(s)`);
    if (r.remaining) parts.push(`${r.remaining} more to go — run it again`);
    setNotice(parts.join(' · '));
    if (r.problems.length) {
      setError(`${r.problems.length} could not be linked: ${r.problems.slice(0, 5).map((p) => `${p.name} (${p.reason})`).join('; ')}${r.problems.length > 5 ? '…' : ''}`);
    }
    await load();
  });

  const sendCode = (p) => run(`send-${p.id}`, async () => {
    const { data: r } = await api.post(`/guardians/${p.id}/send-code`);
    const parts = [];
    if (r.phone) parts.push(`text to ${r.phone} ${channelText[r.sms] || r.sms}`);
    if (r.email) parts.push(`email to ${r.email} ${channelText[r.email] || r.email}`);
    setNotice(`Code for ${p.full_name}: ${parts.join(', ') || 'no phone or email on file — print a slip instead'}.`);
    await load();
  });

  const printSlips = (body, filename) => run('slips', async () => {
    const { data: r } = await api.post('/guardians/slips', body);
    if (!r.slips.length) {
      setNotice(r.skipped_activated ? 'Everyone selected has already activated their account — no slips needed.' : 'No parents to print slips for.');
      return;
    }
    await activationSlipsPdf({
      slips: r.slips,
      brand: await printBrand(),
      activateUrl: `${window.location.origin}/activate`,
      filename,
    });
    setNotice(`${r.slips.length} slip(s) printed. Earlier codes for these parents no longer work.${r.skipped_activated ? ` ${r.skipped_activated} already active, left out.` : ''}`);
    await load();
  });

  const unlink = (parent, learner) => run(`unlink-${parent.id}-${learner.id}`, async () => {
    if (!window.confirm(`Unlink ${parent.full_name} from ${learner.name}? They will no longer see this learner's records, and their contact is removed from the learner's record.`)) return;
    await api.delete(`/students/${learner.id}/guardians/${parent.id}`);
    await load();
  });

  const t = data?.totals;
  const coverage = t?.learners ? Math.round((t.with_active_parent / t.learners) * 100) : 0;
  const linkable = (data?.unlinked || []).filter((s) => s.has_contact).length;

  const parentActions = (p) => manage && (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" justifyContent={compact ? 'flex-start' : 'flex-end'}>
      {p.active && (
        <Button size="small" startIcon={<SendIcon fontSize="small" />} disabled={!!busy || (!p.phone && !p.email)}
          onClick={() => sendCode(p)}>
          {p.activated ? 'Reset code' : 'Send code'}
        </Button>
      )}
      {!p.activated && p.active && (
        <Button size="small" startIcon={<PrintIcon fontSize="small" />} disabled={!!busy}
          onClick={() => printSlips({ parent_ids: [p.id] }, `activation-slip-${p.full_name.replace(/[^\w-]+/g, '_')}`)}>
          Slip
        </Button>
      )}
      <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditing(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
    </Stack>
  );

  const learnerChips = (p) => p.learners.map((l) => (
    <Chip key={l.id} size="small" sx={{ mr: 0.5, mb: 0.5, maxWidth: '100%' }}
      label={`${l.name}${l.class_name ? ` · ${l.class_name}` : ''}${l.relationship ? ` (${l.relationship})` : ''}`}
      onDelete={manage || user?.role === 'teacher' ? () => unlink(p, l) : undefined} />
  ));

  return (
    <Box>
      <SchoolHeader
        title="Parents & guardians"
        right={(
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {mayLink && <ImportParents onImported={load} />}
          <Button variant="outlined" disabled={!data?.parents.length}
            onClick={() => exportCsv('parents', [
              { key: 'full_name', label: 'Name' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
              { key: 'status', label: 'Status' }, { key: 'learners', label: 'Learners' },
            ], data.parents.map((p) => ({
              ...p, status: statusOf(p).label, learners: p.learners.map((l) => `${l.name} (${l.admission_number || '—'})`).join('; '),
            })))}>
            Export CSV
          </Button>
          </Stack>
        )}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
      {!data && !error && <LinearProgress />}

      {t && (
        <>
          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            <Tile label="Learners with a parent" value={`${t.with_parent} / ${t.learners}`} />
            <Tile label="Parent can sign in" value={`${coverage}%`} sub={`${t.with_active_parent} learner(s)`}
              tone={coverage === 100 ? 'success.main' : undefined} />
            <Tile label="Without a parent" value={t.without_parent} tone={t.without_parent ? 'warning.main' : 'success.main'} />
            <Tile label="Parents not activated" value={t.parents - t.parents_activated} />
          </Stack>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap alignItems={{ xs: 'stretch', md: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2">Getting every learner a parent</Typography>
                <Typography variant="body2" color="text.secondary">
                  Parents cannot sign up themselves. Link them here, import them from a CSV, or through the learner
                  import — then send each a code by text and email, or print slips to send home.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Button variant="contained" startIcon={<LinkIcon />} disabled={!!busy || !linkable} onClick={linkRecords}>
                  {busy === 'link' ? 'Linking…' : `Link from learner records${linkable ? ` (${linkable})` : ''}`}
                </Button>
                {manage && (
                  <>
                    <TextField select size="small" label="Slips for" value={slipClass}
                      SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}
                      onChange={(e) => setSlipClass(e.target.value)} sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                      <MenuItem value="">All parents not activated</MenuItem>
                      {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                    <Button variant="outlined" startIcon={<PrintIcon />} disabled={!!busy}
                      onClick={() => {
                        const cls = classes.find((c) => String(c.id) === String(slipClass));
                        if (!window.confirm('Print new activation slips? Codes already sent to these parents will stop working.')) return;
                        printSlips(
                          cls ? { class_id: cls.id } : { all: true },
                          `activation-slips-${(cls?.name || 'all').replace(/[^\w-]+/g, '_')}`,
                        );
                      }}>
                      {busy === 'slips' ? 'Preparing…' : 'Print slips'}
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, px: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ flex: '1 1 auto', minWidth: 0 }}>
                <Tab label={`Parents (${t.parents})`} />
                <Tab label={`Without a parent (${t.without_parent})`} />
              </Tabs>
              <TextField size="small" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)}
                sx={{ width: { xs: '100%', sm: 220 }, mb: { xs: 1, sm: 0 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            </Box>

            {tab === 0 && (compact ? (
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                {parents.map((p) => (
                  <Box key={p.id} sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600 }}>{p.full_name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                          {[p.phone, p.email].filter(Boolean).join(' · ')}
                        </Typography>
                      </Box>
                      <Chip size="small" {...statusOf(p)} />
                    </Box>
                    <Box sx={{ mt: 1 }}>{learnerChips(p)}</Box>
                    {parentActions(p)}
                  </Box>
                ))}
                {!parents.length && <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>No parents{q ? ' match' : ' yet'}.</Typography>}
              </Stack>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Parent</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Learners</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parents.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{p.full_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{p.phone || '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.email || ''}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>{learnerChips(p)}</TableCell>
                        <TableCell>
                          <Chip size="small" {...statusOf(p)} />
                          {!p.activated && p.last_code_at && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, whiteSpace: 'nowrap' }}>
                              Code {new Date(p.last_code_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{parentActions(p)}</TableCell>
                      </TableRow>
                    ))}
                    {!parents.length && (
                      <TableRow><TableCell colSpan={5}>
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                          No parents{q ? ' match' : ' yet — link them from learner records, or add one from the other tab'}.
                        </Typography>
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ))}

            {tab === 1 && (
              <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
                {unlinked.map((s) => (
                  <Box key={s.id} sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{s.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {[s.class_name, s.admission_number && `Adm. ${s.admission_number}`].filter(Boolean).join(' · ') || '—'}
                      </Typography>
                      <Typography variant="caption" color={s.has_contact ? 'text.secondary' : 'warning.main'} sx={{ overflowWrap: 'anywhere' }}>
                        {s.has_contact
                          ? `On record: ${[s.parent_name, s.parent_phone, s.parent_email].filter(Boolean).join(' · ')}`
                          : 'No parent phone or email on record'}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setLinking(s)}>
                      Add parent
                    </Button>
                  </Box>
                ))}
                {!unlinked.length && (
                  <Typography color={q ? 'text.secondary' : 'success.main'} sx={{ p: 3, textAlign: 'center' }}>
                    {q ? 'No learners match.' : 'Every learner has a parent linked.'}
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>
        </>
      )}

      <LinkDialog
        learner={linking}
        onClose={() => setLinking(null)}
        onDone={(r) => {
          setLinking(null);
          setNotice(r.created_account
            ? 'Parent added. Send them a code or print a slip so they can activate.'
            : `Linked to an existing parent account${r.activated ? ' — they can already sign in and will see this learner' : ''}.`);
          load();
        }}
      />
      <EditDialog parent={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); setNotice('Saved.'); load(); }} />
    </Box>
  );
}
