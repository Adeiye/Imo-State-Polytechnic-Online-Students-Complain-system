import React from 'react';
import { User } from '../types';
import { 
  Building2, 
  FileText, 
  PlusCircle, 
  ShieldCheck, 
  Users, 
  LogOut, 
  Key,
  GraduationCap
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  onSwitchUserRole: (role: 'student' | 'admin') => void;
  onOpenChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeView,
  setActiveView,
  onLogout,
  onSwitchUserRole,
  onOpenChangePassword,
}) => {
  return (
    <header className="bg-[#021152] border-b border-[#CCCFDC]/30 text-white shadow-2xl sticky top-0 z-50">
      {/* Top Banner - Imo State Polytechnic Omuma Identity */}
      <div className="bg-[#010a33] px-4 py-2 text-xs text-[#E4DECE] flex flex-wrap justify-between items-center border-b border-[#CCCFDC]/20">
        <div className="flex items-center space-x-2 font-mono text-[11px] tracking-wide">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-[#FFFFFF]">IMO STATE POLYTECHNIC, OMUMA</span>
          <span className="text-[#CCCFDC]/60">|</span>
          <span className="text-[#CCCFDC]">Orlu East LGA, Imo State</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-emerald-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase border border-emerald-500/50">
            Official E-Portal
          </span>
        </div>
      </div>

      {/* Main Header Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveView(currentUser?.role === 'admin' ? 'admin_dashboard' : 'student_dashboard')}>
          <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center text-white shadow-lg shadow-black/40 ring-1 ring-white/20 group-hover:scale-105 transition-transform overflow-hidden">
            <img 
              src="https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg" 
              onError={(e) => { e.currentTarget.src = "/logo.png"; }} 
              alt="Imo State Polytechnic Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              <span>Online Students' Complaint System</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/90 border border-emerald-800/90 px-2 py-0.5 rounded">
                AUTO-REPLY v2.0
              </span>
            </h1>
            <p className="text-xs text-[#E4DECE]/80 font-sans">
              Directorate of Academic & Student Affairs Complaints | Imo Poly Omuma
            </p>
          </div>
        </div>

        {/* User Info & Navigation Tabs */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="bg-[#010a33]/90 border border-[#CCCFDC]/30 px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-3 shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold font-mono">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="font-semibold text-[#FFFFFF]">{currentUser.full_name}</div>
                <div className="text-[10px] text-[#E4DECE]/70 font-mono tracking-tight">
                  {currentUser.reg_number} ({currentUser.role.toUpperCase()})
                </div>
              </div>
              {onOpenChangePassword && (
                <button
                  onClick={onOpenChangePassword}
                  title="Change Password"
                  className="text-[#E4DECE]/80 hover:text-white p-1.5 rounded-lg hover:bg-[#021152] transition border border-[#CCCFDC]/20 flex items-center gap-1 text-[11px] font-mono"
                >
                  <Key className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden lg:inline">Password</span>
                </button>
              )}
              <button
                onClick={onLogout}
                title="Logout / Switch Account"
                className="text-[#E4DECE]/80 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#021152] transition border border-[#CCCFDC]/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links Bar */}
      <nav className="bg-[#010b38] border-t border-[#CCCFDC]/20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none text-xs font-medium">
          {/* Student Portal Views */}
          {currentUser?.role === 'student' && (
            <>
              <button
                onClick={() => setActiveView('student_dashboard')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap font-medium ${
                  activeView === 'student_dashboard'
                    ? 'bg-[#E4DECE] text-[#021152] font-bold shadow-md'
                    : 'text-[#E4DECE] hover:text-white hover:bg-[#021152]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>My Dashboard</span>
              </button>

              <button
                onClick={() => setActiveView('lodge_complaint')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap font-medium ${
                  activeView === 'lodge_complaint'
                    ? 'bg-emerald-600 text-white font-bold shadow-md'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/60'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Lodge Complaint</span>
              </button>
            </>
          )}

          {/* Admin Portal Views */}
          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveView('admin_dashboard')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap font-medium ${
                  activeView === 'admin_dashboard'
                    ? 'bg-[#E4DECE] text-[#021152] font-bold shadow-md'
                    : 'text-[#E4DECE] hover:text-white hover:bg-[#021152]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Management</span>
              </button>

              <button
                onClick={() => setActiveView('admin_students')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition whitespace-nowrap font-medium ${
                  activeView === 'admin_students'
                    ? 'bg-[#E4DECE] text-[#021152] font-bold shadow-md'
                    : 'text-[#E4DECE] hover:text-white hover:bg-[#021152]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Student Audit Directory</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
