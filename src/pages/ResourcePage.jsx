import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, LinearProgress, Alert, Chip, TableContainer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';
import { exportCsv } from '../exportCsv';
import ImportStudents from '../components/ImportStudents';
import RESOURCES from '../resources';

export default function ResourcePage() {
  const { key } = useParams();
  const cfg = useMemo(() => RESOURCES.find((r) => r.key === key), [key]);

  const [rows, setRows] = useState([]);
  const [refs, setRefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {} | row

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/${key}`);
      setRows(data);
      const refKeys = [...new Set((cfg?.fields || []).filter((f) => f.type === 'ref').map((f) => f.ref))];
      const results = await Promise.all(refKeys.map((r) => api.get(`/${r}`).then((x) => [r, x.data]).catch(() => [r, []])));
      setRefs(Object.fromEntries(results));
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load records');
    } finally {
      setLoading(false);
    }
  }, [key, cfg]);

  useEffect(() => { load(); }, [load]);

  if (!cfg) return <Alert severity="error">Unknown section.</Alert>;

  const refLabel = (field, value) => {
    const list = refs[field.ref] || [];
    const hit = list.find((x) => x.id === value);
    return hit ? hit[field.refLabel] : value ?? '—';
  };

  const renderCell = (row, col) => {
    const field = cfg.fields.find((f) => f.name === col);
    const v = row[col];
    if (field?.type === 'ref') return refLabel(field, v);
    if (typeof v === 'boolean') return <Chip size="small" label={v ? 'Yes' : 'No'} color={v ? 'success' : 'default'} />;
    if (v == null || v === '') return '—';
    if (col.endsWith('_at') || col.endsWith('_date') || col === 'created_at') return String(v).slice(0, 10);
    return String(v);
  };

  async function save() {
    const body = Object.fromEntries(
      cfg.fields.map((f) => [f.name, editing[f.name] === '' ? undefined : editing[f.name]])
    );
    try {
      if (editing.id) await api.put(`/${key}/${editing.id}`, body);
      else await api.post(`/${key}`, body);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/${key}/${id}`); load(); }
    catch (e) { setError(e.response?.data?.error || 'Delete failed'); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">{cfg.label}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {cfg.key === 'students' && <ImportStudents onImported={load} />}
          <Button variant="outlined" disabled={!rows.length}
            onClick={() => exportCsv(cfg.key, cfg.columns.map((c) => ({ key: c, label: c.replaceAll('_', ' ') })), rows)}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing({})}>
            New
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {loading ? <LinearProgress /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {cfg.columns.map((c) => (
                  <TableCell key={c} sx={{ fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                    {c.replaceAll('_', ' ').replace(' id', '')}
                  </TableCell>
                ))}
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id ?? row.key} hover>
                  {cfg.columns.map((c) => <TableCell key={c}>{renderCell(row, c)}</TableCell>)}
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton size="small" onClick={() => setEditing(row)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => remove(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow><TableCell colSpan={cfg.columns.length + 1}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No records yet.</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing?.id ? `Edit ${cfg.label.replace(/s$/, '')}` : `New ${cfg.label.replace(/s$/, '')}`}</DialogTitle>
        <DialogContent dividers>
          {editing && cfg.fields.map((f) => {
            const value = editing[f.name] ?? '';
            const common = {
              key: f.name, label: f.label, fullWidth: true, margin: 'dense',
              required: !!f.required, multiline: !!f.multiline, minRows: f.multiline ? 3 : undefined,
              value,
              onChange: (e) => setEditing((s) => ({ ...s, [f.name]: e.target.value })),
            };
            if (f.type === 'ref') {
              return (
                <TextField select {...common}>
                  <MenuItem value="">—</MenuItem>
                  {(refs[f.ref] || []).map((o) => <MenuItem key={o.id} value={o.id}>{o[f.refLabel]}</MenuItem>)}
                </TextField>
              );
            }
            if (f.type === 'select') {
              return (
                <TextField select {...common}>
                  {f.options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              );
            }
            const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : f.type === 'password' ? 'password' : 'text';
            return <TextField {...common} type={type} InputLabelProps={f.type === 'date' ? { shrink: true } : undefined} />;
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
