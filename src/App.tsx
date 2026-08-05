import React, { useState, useEffect } from 'react';
import { User, Complaint, Template } from './types';
import { Header } from './components/Header';
import { StudentDashboard } from './components/StudentDashboard';
import { LodgeComplaint } from './components/LodgeComplaint';
import { ViewComplaintThread } from './components/ViewComplaintThread';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminStudentsAudit } from './components/AdminStudentsAudit';
import { GraduationCap, ShieldCheck, UserCheck, KeyRound, Sparkles, Key, X, CheckCircle2, Lock } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeView, setActiveView] = useState<string>('student_dashboard');
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  // Auth form states
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<'student' | 'admin'>('student');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Student Registration form states
  const [regFullName, setRegFullName] = useState('');
  const [regMatricNumber, setRegMatricNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Google Login Modal state
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');
  const [googleRegNumber, setGoogleRegNumber] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Change Password Modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch initial templates and complaints
  const fetchComplaints = async () => {
    setIsLoadingComplaints(true);
    try {
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchTemplates();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
          role: authRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      setCurrentUser(data);
      if (data.role === 'admin') {
        setActiveView('admin_dashboard');
        setFlashMessage('Authenticated successfully as Administrator.');
      } else {
        setActiveView('student_dashboard');
        setFlashMessage(`Welcome back, ${data.full_name}!`);
      }
      setTimeout(() => setFlashMessage(null), 4000);
    } catch (err) {
      setAuthError('Server communication error. Please try again.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthSubmitting(true);

    if (!regFullName || !regMatricNumber || !regEmail || !regPassword) {
      setAuthError('Please fill in all registration fields.');
      setIsAuthSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          reg_number: regMatricNumber,
          email: regEmail,
          password: regPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Registration failed.');
        return;
      }

      // Auto login student on successful registration
      setCurrentUser(data);
      setActiveView('student_dashboard');
      setFlashMessage(`Account created successfully! Welcome, ${data.full_name}.`);
      setTimeout(() => setFlashMessage(null), 4000);
    } catch (err) {
      setAuthError('Server communication error during registration.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError(null);

    if (!googleEmail) {
      setGoogleError('Please enter your Google email address.');
      return;
    }

    const cleanE = googleEmail.trim().toLowerCase();
    if (!cleanE.endsWith('@gmail.com') && !cleanE.endsWith('@googlemail.com') && !cleanE.endsWith('@imopoly.edu.ng') && !cleanE.endsWith('@student.imopoly.edu.ng')) {
      setGoogleError('Only Google accounts (@gmail.com or @student.imopoly.edu.ng) are allowed.');
      return;
    }

    setIsAuthSubmitting(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanE,
          full_name: googleFullName,
          reg_number: googleRegNumber
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setGoogleError(data.error || 'Google authentication failed.');
        return;
      }

      setCurrentUser(data);
      setIsGoogleModalOpen(false);
      setActiveView('student_dashboard');
      setFlashMessage(`Logged in with Google as ${data.email}! Welcome.`);
      setTimeout(() => setFlashMessage(null), 4000);
    } catch (err) {
      setGoogleError('Error connecting to authentication service.');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);

    if (!currentUser) return;

    if (newPasswordInput.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          current_password: currentPasswordInput,
          new_password: newPasswordInput
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setChangePasswordError(data.error || 'Failed to update password.');
        return;
      }

      setIsChangePasswordOpen(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setFlashMessage('Your account password has been updated successfully!');
      setTimeout(() => setFlashMessage(null), 4000);
    } catch (err) {
      setChangePasswordError('Server error updating password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setLoginPassword('');
    setFlashMessage('You have logged out successfully.');
    setTimeout(() => setFlashMessage(null), 3000);
  };

  const handleOpenThread = (complaintId: number) => {
    setSelectedThreadId(complaintId);
    setActiveView('view_complaint');
  };

  const handleComplaintSubmitted = (newComplaintId: number) => {
    fetchComplaints();
    setSelectedThreadId(newComplaintId);
    setActiveView('view_complaint');
    setFlashMessage(`Complaint #${newComplaintId} lodged successfully! System auto-reply attached.`);
    setTimeout(() => setFlashMessage(null), 4000);
  };

  return (
    <div className="min-h-screen geometric-bg text-[#141414] flex flex-col font-sans selection:bg-[#021152] selection:text-white">
      {/* Top Header Navigation */}
      <Header
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          if (view !== 'view_complaint') setSelectedThreadId(null);
        }}
        onLogout={handleLogout}
        onSwitchUserRole={() => {}}
        onOpenChangePassword={() => {
          setChangePasswordError(null);
          setIsChangePasswordOpen(true);
        }}
      />

      {/* Flash Message Banner */}
      {flashMessage && (
        <div className="bg-[#021152] text-[#E4DECE] text-xs font-semibold px-4 py-2.5 text-center shadow-md flex items-center justify-center gap-2 border-b border-[#CCCFDC]">
          <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
          <span className="tracking-wide font-mono">{flashMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If no user logged in, show Auth Portal Card */}
        {!currentUser ? (
          <div className="max-w-md mx-auto my-8 geom-card geom-accent-blue rounded-2xl p-8 border border-[#CCCFDC] shadow-xl space-y-6 bg-white">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#021152]/10 ring-4 ring-[#CCCFDC]/40 p-2 overflow-hidden">
                <img 
                  src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" 
                  onError={(e) => { e.currentTarget.src = "/logo.png"; }} 
                  alt="Imo State Polytechnic Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#021152] tracking-tight">Imo Poly E-Portal Access</h2>
              <p className="text-xs font-mono text-[#141414]/70">Online Students' Complaint System - Omuma Campus</p>
            </div>

            {/* Google Sign-In Quick Access Banner */}
            <div className="bg-[#021152]/5 border border-[#CCCFDC] p-3 rounded-xl text-center space-y-2">
              <p className="text-[11px] font-semibold text-[#021152]">
                Students: Google Email Login Required
              </p>
              <button
                type="button"
                onClick={() => { setGoogleError(null); setIsGoogleModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2.5 bg-white border border-[#CCCFDC] hover:bg-[#E4DECE]/40 text-[#141414] font-bold py-2.5 px-4 rounded-xl shadow-sm transition text-xs font-mono group border-b-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>LOG IN WITH GOOGLE EMAIL</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#CCCFDC] w-full"></div>
              <span className="bg-white px-2 text-[10px] font-mono text-[#141414]/60 uppercase tracking-widest absolute">OR PORTAL PASSWORD</span>
            </div>

            {/* Auth Mode Navigation Tabs */}
            <div className="flex bg-[#E4DECE]/50 p-1 rounded-xl text-xs font-semibold text-[#141414] border border-[#CCCFDC]">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-lg transition font-mono ${
                  authTab === 'login' ? 'bg-[#021152] text-white shadow-sm font-bold' : 'hover:text-[#021152]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('register'); setAuthError(null); }}
                className={`flex-1 py-2.5 rounded-lg transition font-mono ${
                  authTab === 'register' ? 'bg-emerald-700 text-white shadow-sm font-bold' : 'hover:text-emerald-900'
                }`}
              >
                Student Registration
              </button>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium space-y-1 shadow-sm">
                <div className="font-bold flex items-center gap-1 text-rose-900">
                  <span>Authentication Error</span>
                </div>
                <p className="text-[11px] leading-relaxed">{authError}</p>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {/* Portal Role Selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#E4DECE]/40 rounded-xl border border-[#CCCFDC] text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => { setAuthRole('student'); setLoginIdentifier(''); setAuthError(null); }}
                    className={`py-1.5 rounded-lg transition font-semibold ${
                      authRole === 'student' ? 'bg-[#021152] text-white shadow' : 'text-[#141414] hover:text-[#021152]'
                    }`}
                  >
                    Student Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthRole('admin'); setLoginIdentifier(''); setAuthError(null); }}
                    className={`py-1.5 rounded-lg transition font-semibold ${
                      authRole === 'admin' ? 'bg-emerald-700 text-white shadow' : 'text-[#141414] hover:text-emerald-900'
                    }`}
                  >
                    Admin Portal
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-[#021152] mb-1.5 uppercase text-[10px] tracking-wider font-mono">
                    {authRole === 'student' ? 'Student Google Email or Matric Number' : 'Administrator Approved ID'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={authRole === 'student' ? 'e.g., student@gmail.com or IMOPOLY/ND/2024/0142' : 'Enter Admin ID'}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#021152] transition"
                  />
                  {authRole === 'student' && (
                    <p className="text-[10px] font-mono text-[#021152]/70 mt-1">
                      Note: Only Google emails (@gmail.com or @student.imopoly.edu.ng) are supported.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-[#021152] mb-1.5 uppercase text-[10px] tracking-wider font-mono">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#021152] transition"
                  />
                </div>



                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full bg-[#021152] hover:bg-[#010a33] text-white font-bold py-3 rounded-xl transition text-xs shadow-md active:scale-[0.99] font-mono tracking-wide mt-2 disabled:opacity-50"
                >
                  {isAuthSubmitting ? 'VERIFYING CREDENTIALS...' : `LOG IN TO ${authRole.toUpperCase()} PORTAL`}
                </button>
              </form>
            ) : (
              /* STUDENT REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#021152] mb-1 uppercase text-[10px] tracking-wider font-mono">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Chidi Chukwuemeka"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#021152] mb-1 uppercase text-[10px] tracking-wider font-mono">
                    Matric / Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., IMOPOLY/ND/2024/0142"
                    value={regMatricNumber}
                    onChange={(e) => setRegMatricNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl font-mono text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#021152] mb-1 uppercase text-[10px] tracking-wider font-mono">
                    Google Email Address (Required)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., student.name@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                  <p className="text-[10px] font-mono text-[#021152]/70 mt-1">
                    Must end with @gmail.com or @student.imopoly.edu.ng
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-[#021152] mb-1 uppercase text-[10px] tracking-wider font-mono">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition text-xs shadow-md active:scale-[0.99] font-mono tracking-wide mt-2 disabled:opacity-50"
                >
                  {isAuthSubmitting ? 'CREATING STUDENT ACCOUNT...' : 'CREATE ACCOUNT & LOG IN'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Active Views Switcher - Strictly Segregated by Role */
          <>
            {currentUser.role === 'student' && (
              <>
                {activeView === 'student_dashboard' && (
                  <StudentDashboard
                    currentUser={currentUser}
                    complaints={complaints}
                    isLoading={isLoadingComplaints}
                    onLodgeNew={() => setActiveView('lodge_complaint')}
                    onViewThread={handleOpenThread}
                  />
                )}

                {activeView === 'lodge_complaint' && (
                  <LodgeComplaint
                    currentUser={currentUser}
                    templates={templates}
                    onSubmitSuccess={handleComplaintSubmitted}
                    onCancel={() => setActiveView('student_dashboard')}
                  />
                )}

                {activeView === 'view_complaint' && selectedThreadId && (
                  <ViewComplaintThread
                    complaintId={selectedThreadId}
                    currentUser={currentUser}
                    onBack={() => setActiveView('student_dashboard')}
                  />
                )}
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                {(activeView === 'admin_dashboard' || activeView === 'student_dashboard') && (
                  <AdminDashboard
                    currentUser={currentUser}
                    complaints={complaints}
                    isLoading={isLoadingComplaints}
                    onRefresh={fetchComplaints}
                    onViewThread={handleOpenThread}
                  />
                )}

                {activeView === 'admin_students' && <AdminStudentsAudit />}

                {activeView === 'view_complaint' && selectedThreadId && (
                  <ViewComplaintThread
                    complaintId={selectedThreadId}
                    currentUser={currentUser}
                    onBack={() => setActiveView('admin_dashboard')}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* GOOGLE AUTH MODAL */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CCCFDC] space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-[#CCCFDC]/60 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <h3 className="text-lg font-bold text-[#021152]">Google Student Sign-In</h3>
              </div>
              <button 
                onClick={() => setIsGoogleModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {googleError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-mono">
                {googleError}
              </div>
            )}

            <form onSubmit={handleGoogleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#021152] mb-1 font-mono uppercase text-[10px]">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g., student.name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#021152]"
                />
                <p className="text-[10px] text-slate-500 font-mono mt-1">Must be an active @gmail.com or @student.imopoly.edu.ng address.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#021152] mb-1 font-mono uppercase text-[10px]">
                  Full Name (Optional for new accounts)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chidi Chukwuemeka"
                  value={googleFullName}
                  onChange={(e) => setGoogleFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#021152]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#021152] mb-1 font-mono uppercase text-[10px]">
                  Matric / Reg Number (Optional for new accounts)
                </label>
                <input
                  type="text"
                  placeholder="e.g. IMOPOLY/ND/2024/0142"
                  value={googleRegNumber}
                  onChange={(e) => setGoogleRegNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#021152]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAuthSubmitting}
                  className="px-5 py-2 bg-[#021152] hover:bg-[#010a33] text-white font-bold rounded-xl font-mono text-xs shadow-md"
                >
                  {isAuthSubmitting ? 'Authenticating...' : 'Authenticate Google Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && currentUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#CCCFDC] space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-[#CCCFDC]/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#021152] text-amber-300 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#021152]">Change Account Password</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{currentUser.full_name} ({currentUser.role.toUpperCase()})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChangePasswordOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changePasswordError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-mono">
                {changePasswordError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#021152] mb-1 font-mono uppercase text-[10px]">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#021152]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#021152] mb-1 font-mono uppercase text-[10px]">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#021152]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#021152] mb-1 font-mono uppercase text-[10px]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#E4DECE]/20 border border-[#CCCFDC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#021152]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 bg-[#021152] hover:bg-[#010a33] text-white font-bold rounded-xl font-mono text-xs shadow-md"
                >
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#021152] text-[#E4DECE]/80 border-t border-[#CCCFDC]/30 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-semibold text-white">
              Online Students' Complaint System &copy; 2026
            </p>
            <p className="text-[11px] text-[#E4DECE]/90 mt-0.5 font-medium">
              Imo State Polytechnic Omuma (Orlu East LGA, Imo State)
            </p>
            <p className="text-[11px] text-[#E4DECE]/70 mt-0.5">
              Created by: Ebubedike Kelechi Humphrey - 08068880163
            </p>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="text-emerald-400 font-mono font-medium">Keyword Auto-Reply Engine Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
