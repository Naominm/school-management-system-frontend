import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import Teachers from './pages/Teachers';
import Parents from './pages/Parents';
import Progress from './pages/Progress';
import Messages from './pages/Messages';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import Markbook from './pages/Markbook';
import Attendance from './pages/Attendance';
import MeritList from './pages/MeritList';
import ReportCard from './pages/ReportCard';
import Fees from './pages/Fees';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markbook" element={<Markbook />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/merit-list" element={<MeritList />} />
            <Route path="/report-cards" element={<ReportCard />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/parents" element={<Parents />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/r/:key" element={<ResourcePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
