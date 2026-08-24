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
import { useAuth } from '../auth';
import RESOURCES from '../resources';

const drawerWidth = 264;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((t) => t.breakpoints.up('md'));
  const [open, setOpen] = useState(false);

  const specials = [
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
        <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34, fontSize: 14 }}>SM</Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>School Manager</Typography>
          <Typography variant="caption" color="text.secondary">PERN Edition</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List dense sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {specials.filter((s) => visible(s.roles)).map((s) => (
          <ListItemButton
            key={s.to} component={NavLink} to={s.to} end={s.to === '/'}
            onClick={() => setOpen(false)}
            sx={{ borderRadius: 2, '&.active': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' } } }}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>{s.icon}</ListItemIcon>
            <ListItemText primary={s.label} />
          </ListItemButton>
        ))}
        <Divider sx={{ my: 1 }} />
        {RESOURCES.filter((r) => visible(r.roles)).map((r) => (
          <ListItemButton
            key={r.key} component={NavLink} to={`/r/${r.key}`}
            onClick={() => setOpen(false)}
            sx={{ borderRadius: 2, '&.active': { bgcolor: 'primary.main', color: '#fff', '& .MuiListItemIcon-root': { color: '#fff' } } }}
          >
            <ListItemIcon sx={{ minWidth: 34 }}><TableRowsIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary={r.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
          {user?.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap fontWeight={600}>{user?.full_name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton size="small" onClick={() => { logout(); navigate('/login'); }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar position="fixed" color="inherit" sx={{ borderBottom: '1px solid #E2E8F0', boxShadow: 'none', zIndex: (t) => t.zIndex.drawer + 1, display: { md: 'none' } }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setOpen(true)}><MenuIcon /></IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>School Manager</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || open}
        onClose={() => setOpen(false)}
        sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #E2E8F0' } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, mt: { xs: 7, md: 0 }, minWidth: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
