import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Box, IconButton, Divider, Avatar, Tooltip, useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import GradeIcon from '@mui/icons-material/Grading';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DescriptionIcon from '@mui/icons-material/Description';
import PaidIcon from '@mui/icons-material/Paid';
import GroupsIcon from '@mui/icons-material/Groups';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import TimelineIcon from '@mui/icons-material/Timeline';
import MailIcon from '@mui/icons-material/Mail';
import KeyIcon from '@mui/icons-material/Key';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAuth } from '../auth';
import RESOURCES from '../resources';

const drawerWidth = 264;

/* Ledger tabs: file-divider shape (rounded top, square bottom), muted on the
 * ink drawer, and lifting to paper when active — the sidebar reads as tabs in
 * a physical ledger. Navigation items and role visibility are unchanged. */
const tabSx = {
  borderRadius: '10px 10px 4px 4px',
  color: '#C7CEE0',
  mb: '2px',
  minHeight: 44,
  '& .MuiListItemIcon-root': { color: '#C7CEE0', minWidth: 34 },
  '& .MuiListItemText-primary': { fontSize: 13.5, fontWeight: 500 },
  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' },
  '&.active': {
    bgcolor: 'background.default',
    color: 'ledger.ink',
    boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
    '& .MuiListItemIcon-root': { color: 'ledger.gold' },
    '& .MuiListItemText-primary': { fontWeight: 600 },
  },
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((t) => t.breakpoints.up('md'));
  const [open, setOpen] = useState(false);

  const specials = [
    { to: '/platform', label: 'Platform console', icon: <ApartmentIcon fontSize="small" />, roles: ['super_admin'] },
    { to: '/', label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, roles: ['admin', 'teacher', 'staff', 'parent', 'learner'] },
    { to: '/markbook', label: 'Markbook', icon: <GradeIcon fontSize="small" />, roles: ['admin', 'teacher'] },
    { to: '/attendance', label: 'Attendance', icon: <ChecklistIcon fontSize="small" />, roles: ['admin', 'teacher'] },
    { to: '/merit-list', label: 'Merit list', icon: <EmojiEventsIcon fontSize="small" />, roles: ['admin', 'teacher'] },
    { to: '/report-cards', label: 'Report cards', icon: <DescriptionIcon fontSize="small" />, roles: ['admin', 'teacher', 'parent', 'learner'] },
    { to: '/fees', label: 'Fees', icon: <PaidIcon fontSize="small" />, roles: ['admin', 'staff'] },
    { to: '/teachers', label: 'Teachers', icon: <GroupsIcon fontSize="small" />, roles: ['admin', 'teacher', 'staff'] },
    { to: '/parents', label: 'Parents', icon: <FamilyIcon fontSize="small" />, roles: ['admin', 'teacher', 'staff'] },
    { to: '/progress', label: 'My progress', icon: <TimelineIcon fontSize="small" />, roles: ['parent', 'learner'] },
    { to: '/messages', label: 'Messages', icon: <MailIcon fontSize="small" />, roles: ['admin', 'teacher', 'staff', 'parent', 'learner'] },
    { to: '/change-password', label: 'Change password', icon: <KeyIcon fontSize="small" />, roles: ['admin', 'teacher', 'staff', 'parent', 'learner'] },
  ];

  const visible = (roles) => roles.includes(user?.role);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'ledger.gold', color: '#231A00', width: 34, height: 34, fontSize: 14, fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, borderRadius: '9px' }}>SM</Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ fontFamily: 'Fraunces, Georgia, serif', color: '#fff' }}>School Manager</Typography>
          <Typography variant="caption" sx={{ color: '#A9B4CC', letterSpacing: '0.6px' }}>PERN EDITION</Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.10)' }} />
      <List dense sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {specials.filter((s) => visible(s.roles)).map((s) => (
          <ListItemButton
            key={s.to} component={NavLink} to={s.to} end={s.to === '/'}
            onClick={() => setOpen(false)}
            sx={tabSx}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>{s.icon}</ListItemIcon>
            <ListItemText primary={s.label} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.10)' }} />
        {RESOURCES.filter((r) => visible(r.roles)).map((r) => (
          <ListItemButton
            key={r.key} component={NavLink} to={`/r/${r.key}`}
            onClick={() => setOpen(false)}
            sx={tabSx}
          >
            <ListItemIcon sx={{ minWidth: 34 }}><TableRowsIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary={r.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.10)' }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
          {user?.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap fontWeight={600} sx={{ color: '#fff' }}>{user?.full_name}</Typography>
          <Typography variant="caption" sx={{ textTransform: 'capitalize', color: '#94A0BE' }}>{user?.role}</Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton size="small" sx={{ color: '#C7CEE0' }} onClick={() => { logout(); navigate('/login'); }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar position="fixed" color="inherit" sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, boxShadow: 'none', zIndex: (t) => t.zIndex.drawer + 1, display: { md: 'none' } }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen(true)}><MenuIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>School Manager</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || open}
        onClose={() => setOpen(false)}
        sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, background: (t) => `linear-gradient(180deg, ${t.palette.ledger.ink} 0%, ${t.palette.ledger.ink2} 100%)`, color: '#EDEFF4' } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, mt: { xs: 7, md: 0 }, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
