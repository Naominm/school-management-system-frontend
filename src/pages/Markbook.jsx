import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Typography, TextField, MenuItem, Button, Table, TableHead,
  TableRow, TableCell, TableBody, LinearProgress, Alert, TableContainer, Tooltip,
} from '@mui/material';
import api from '../api';
import { useAuth } from '../auth';
import GradeStamp from '../components/GradeStamp';

const ALL_SUBJECTS = '__all__';

export default function Markbook() {
  const { user } = useAuth();
  const isManagement = ['admin', 'staff'].includes(user?.role);

  const [classes, setClasses] = useState([]);          // [{id, name}]
  const [assignments, setAssignments] = useState([]);  // teacher's subject assignments
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState(ALL_SUBJECTS);
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [grid, setGrid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  /* Management picks from every class; a teacher picks only from the classes
   * they teach in or are class teacher of — both come from /teacher/dashboard. */
  useEffect(() => {
    let cancelled = false;
    async function loadScope() {
      try {
        if (isManagement) {
          const { data } = await api.get('/classes');
          if (!cancelled) setClasses(data.map((c) => ({ id: c.id, name: c.name })));
          return;
        }
        const { data } = await api.get('/teacher/dashboard');
        if (cancelled) return;
        const subs = data.subject_assignments || [];
        setAssignments(subs);
        const byId = new Map();
        (data.class_teacher_of || []).forEach((c) => byId.set(c.id, { id: c.id, name: c.name }));
        subs.forEach((a) => byId.set(a.class_id, { id: a.class_id, name: a.class_name }));
        const list = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
        setClasses(list);
        if (!list.length) {
          setNotice('You have no classes assigned yet. An administrator assigns your subjects and classes.');
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Could not load your classes');
      }
    }
    loadScope();
    return () => { cancelled = true; };
  }, [isManagement]);

  /* Subjects offered for the chosen class: the teacher's assignments there.
   * Once a grid is loaded the server's list wins, because it also includes the
   * whole-class subjects a class teacher may see. */
  const subjectOptions = useMemo(() => {
    if (grid?.learning_areas?.length) {
      return grid.learning_areas.map((la) => ({ id: la.id, name: la.name, can_edit: la.can_edit !== false }));
    }
    if (isManagement) return [];
    return assignments
      .filter((a) => String(a.class_id) === String(classId))
      .map((a) => ({ id: a.learning_area_id, name: a.learning_area_name, can_edit: true }));
  }, [grid, assignments, classId, isManagement]);

  useEffect(() => { setGrid(null); setSubjectId(ALL_SUBJECTS); }, [classId]);

  async function load() {
    if (!classId) return;
    setBusy(true); setError('');
    try {
      const { data } = await api.get('/markbook', { params: { class_id: classId, term, academic_year: year } });
      setGrid(data);
    } catch (e) { setGrid(null); setError(e.response?.data?.error || 'Could not load markbook'); }
    finally { setBusy(false); }
  }

  const markFor = (sid, laid) => grid?.marks.find((m) => m.student_id === sid && m.learning_area_id === laid);

  async function saveMark(sid, laid, score) {
    if (score === '' || score == null) return;
    try {
      await api.post('/marks', {
        student_id: sid, learning_area_id: laid,
        score: Number(score), total: 100, term, academic_year: year,
      });
      load();
    } catch (e) { setError(e.response?.data?.error || 'Could not save mark'); }
  }

  const columns = (grid?.learning_areas || []).filter(
    (la) => subjectId === ALL_SUBJECTS || String(la.id) === String(subjectId)
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Markbook</Typography>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select size="small" label="Class" value={classId}
          onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 200 }}
          disabled={!classes.length}
        >
          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Subject" value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)} sx={{ minWidth: 200 }}
          disabled={!subjectOptions.length}
        >
          <MenuItem value={ALL_SUBJECTS}>All my subjects</MenuItem>
          {subjectOptions.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.name}{s.can_edit ? '' : ' (view only)'}
            </MenuItem>
          ))}
        </TextField>

        <TextField size="small" label="Term" type="number" value={term}
          onChange={(e) => setTerm(Number(e.target.value))} sx={{ width: 100 }} />
        <TextField size="small" label="Year" type="number" value={year}
          onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }} />
        <Button variant="contained" onClick={load} disabled={!classId || busy}>Load</Button>
      </Paper>

      {notice && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {busy && <LinearProgress />}

      {grid && !busy && grid.is_class_teacher && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are the class teacher here, so every subject of this class is shown.
        </Alert>
      )}

      {grid && !busy && !!columns.length && (
        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Learner</TableCell>
                {columns.map((la) => (
                  <TableCell key={la.id} sx={{ fontWeight: 700 }}>
                    {la.name}{la.can_edit === false ? ' (view only)' : ''}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {grid.students.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {s.last_name} {s.first_name}
                    <Box component="span" sx={{ ml: 1, fontFamily: (t) => t.typography.mono.fontFamily, color: 'text.secondary', fontSize: 12 }}>
                      {s.admission_number}
                    </Box>
                  </TableCell>
                  {columns.map((la) => {
                    const m = markFor(s.id, la.id);
                    const readOnly = la.can_edit === false;
                    return (
                      <TableCell key={la.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {readOnly ? (
                            <Tooltip title="You do not teach this subject in this class">
                              <Box component="span" sx={{ fontFamily: (t) => t.typography.mono.fontFamily, minWidth: 40 }}>
                                {m ? m.score : '—'}
                              </Box>
                            </Tooltip>
                          ) : (
                            <TextField
                              size="small" type="number" sx={{ width: 84 }}
                              defaultValue={m ? m.score : ''}
                              placeholder="—"
                              onBlur={(e) => saveMark(s.id, la.id, e.target.value)}
                              inputProps={{ min: 0, max: 100 }}
                            />
                          )}
                          {m?.grade && <GradeStamp grade={m.grade} size={30} />}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {grid && !busy && !columns.length && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No subjects to show for this class yet — an administrator assigns subjects under Class learning areas.
        </Alert>
      )}
    </Box>
  );
}
