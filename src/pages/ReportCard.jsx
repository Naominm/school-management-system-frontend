import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, MenuItem, Button, Alert, Stack, Divider, Collapse,
} from '@mui/material';
import api from '../api';
import { useBranding, apiBase } from '../branding';
import SchoolHeader from '../components/SchoolHeader';
import ReportCardView from '../components/ReportCardView';
import PhotoUpload from '../components/PhotoUpload';
import { exportCsv } from '../exportCsv';
import { reportCardsPdf } from '../reportCardPdf';
import { useAuth } from '../auth';

export default function ReportCard() {
  const { user } = useAuth();
  const staff = ['admin', 'teacher'].includes(user?.role);
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [comment, setComment] = useState('');
  const [headComment, setHeadComment] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [singleBusy, setSingleBusy] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  const { branding, logoUrl } = useBranding();

  useEffect(() => {
    if (!staff) return;
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {});
    api.get('/classes').then((r) => setClasses(r.data)).catch(() => {});
  }, [staff]);

  async function load(id = studentId) {
    setError('');
    setNotice('');
    try {
      const { data } = await api.get(`/report-card/${id}`, { params: { term, academic_year: year } });
      setCard(data);
      setComment(data.student.comments?.class_teacher_comment || '');
      setHeadComment(data.student.comments?.headteacher_comment || '');
    } catch (e) {
      setCard(null);
      setError(e.response?.data?.error || 'Could not load report card');
    }
  }

  async function saveComments() {
    setError('');
    try {
      await api.post(`/report-card/${studentId}/comments`, {
        term, academic_year: year,
        class_teacher_comment: comment,
        headteacher_comment: headComment,
      });
      setNotice('Remarks saved.');
      load();
    } catch (e) { setError(e.response?.data?.error || 'Could not save the remarks'); }
  }

  const className = () => classes.find((c) => String(c.id) === String(classId))?.name || 'Class';

  /* One request for the whole class, rather than one per learner. */
  const fetchClassCards = async () =>
    (await api.get('/report-cards', { params: { class_id: classId, term, academic_year: year } })).data;

  /** The learner on screen, printed on their own. */
  async function exportOnePdf() {
    if (!card) return;
    setSingleBusy(true);
    setError('');
    try {
      await reportCardsPdf({
        card: { ...card, students: [card.student], class: { name: card.student.class_name } },
        apiBase,
        logoUrl,
        filename: `report-card-${card.student.admission_number || card.student.id}-T${term}-${year}`,
      });
    } catch (e) { setError(e.message || 'Could not export that report card'); }
    finally { setSingleBusy(false); }
  }

  async function exportClassPdf() {
    setBulkBusy(true);
    setError('');
    try {
      const d = await fetchClassCards();
      if (!d.students.length) { setError('That class has no learners.'); return; }
      await reportCardsPdf({
        card: d,
        apiBase,
        logoUrl,
        filename: `report-cards-${d.class.name.replace(/[^\w-]+/g, '_')}-T${term}-${year}`,
      });
    } catch (e) { setError(e.response?.data?.error || e.message || 'Could not export report cards'); }
    finally { setBulkBusy(false); }
  }

  async function exportClassCsv() {
    setBulkBusy(true);
    setError('');
    try {
      const d = await fetchClassCards();
      if (!d.students.length) { setError('That class has no learners.'); return; }
      // One row per learner per subject — the shape spreadsheets expect.
      const rows = [];
      for (const st of d.students) {
        const base = {
          adm: st.admission_number || '', name: `${st.last_name} ${st.first_name}`,
          level: st.performance_level?.grade || '',
          average: st.average_percentage?.toFixed(1) ?? '', position: st.position ?? '',
        };
        if (!st.marks.length) {
          rows.push({ ...base, subject: '', score: '', total: '', percentage: '', grade: '', points: '', teacher: '' });
          continue;
        }
        for (const m of st.marks) {
          rows.push({
            ...base,
            subject: m.learning_area, score: m.score, total: m.total,
            percentage: m.percentage?.toFixed(1) ?? '', grade: m.grade || '',
            points: m.points ?? '', teacher: m.teacher || '',
          });
        }
      }
      exportCsv(`report-cards-${d.class.name.replace(/[^\w-]+/g, '_')}-T${term}-${year}`, [
        { key: 'adm', label: 'Admission No.' }, { key: 'name', label: 'Learner' },
        { key: 'subject', label: 'Learning area' }, { key: 'score', label: 'Score' },
        { key: 'total', label: 'Out of' }, { key: 'percentage', label: '%' },
        { key: 'grade', label: 'Grade' }, { key: 'points', label: 'Points' },
        { key: 'teacher', label: 'Teacher' },
        { key: 'level', label: 'Performance level' },
        { key: 'average', label: 'Learner average %' }, { key: 'position', label: 'Position' },
      ], rows);
    } catch (e) { setError(e.response?.data?.error || 'Could not export report cards'); }
    finally { setBulkBusy(false); }
  }

  return (
    <Box>
      <SchoolHeader title="Report cards" subtitle={branding?.motto || undefined} />

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        {staff && (
          <TextField select size="small" label="Learner" value={studentId}
            onChange={(e) => setStudentId(e.target.value)} sx={{ minWidth: 220 }}>
            {students.map((s) => <MenuItem key={s.id} value={s.id}>{s.last_name} {s.first_name}</MenuItem>)}
          </TextField>
        )}
        <TextField size="small" label="Term" type="number" value={term}
          onChange={(e) => setTerm(Number(e.target.value))} sx={{ width: 100 }} />
        <TextField size="small" label="Year" type="number" value={year}
          onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }} />
        <Button variant="contained" onClick={() => load()} disabled={staff && !studentId}>Load</Button>
        {card && (
          <Button variant="outlined" onClick={exportOnePdf} disabled={singleBusy}>
            {singleBusy ? 'Preparing…' : 'Download this card'}
          </Button>
        )}
      </Paper>

      {staff && (
        <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Whole class</Typography>
          <TextField select size="small" label="Class" value={classId}
            onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 200 }}>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <Button variant="outlined" disabled={!classId || bulkBusy} onClick={exportClassPdf}>
            {bulkBusy ? 'Preparing…' : 'Export all as PDF'}
          </Button>
          <Button variant="outlined" disabled={!classId || bulkBusy} onClick={exportClassCsv}>
            Export all as CSV
          </Button>
          <Typography variant="caption" color="text.secondary">
            One page per learner in {className()}, for Term {term} {year}.
          </Typography>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      {card && (
        <Stack spacing={2}>
          <ReportCardView card={card} student={card.student} />

          {staff && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Remarks</Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                <TextField label="Class teacher" multiline minRows={3} value={comment}
                  onChange={(e) => setComment(e.target.value)} sx={{ flex: 1, minWidth: 280 }} />
                <TextField label="Principal" multiline minRows={3} value={headComment}
                  onChange={(e) => setHeadComment(e.target.value)} sx={{ flex: 1, minWidth: 280 }} />
              </Stack>
              <Button variant="contained" sx={{ mt: 2 }} onClick={saveComments}>Save remarks</Button>

              <Divider sx={{ my: 2 }} />

              <Button size="small" onClick={() => setShowPhoto((v) => !v)}>
                {showPhoto ? 'Hide photo' : 'Learner photo'}
              </Button>
              <Collapse in={showPhoto}>
                <Box sx={{ mt: 2 }}>
                  <PhotoUpload student={card.student} onChange={() => load()} />
                </Box>
              </Collapse>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
}
