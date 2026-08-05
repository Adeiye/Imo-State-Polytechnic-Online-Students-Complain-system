import React, { useState } from 'react';
import { Complaint, User } from '../types';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  MessageSquare,
  Bot
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  isLoading: boolean;
  onLodgeNew: () => void;
  onViewThread: (complaintId: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  complaints,
  isLoading,
  onLodgeNew,
  onViewThread,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter student's complaints
  const studentComplaints = complaints.filter(
    (c) => c.user_id === currentUser.user_id || c.studentID === currentUser.reg_number
  );

  const filtered = studentComplaints.filter((c) => {
    const matchesSearch =
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate Metrics
  const totalCount = studentComplaints.length;
  const autoRespondedCount = studentComplaints.filter((c) => c.status === 'Auto-Responded').length;
  const inProgressCount = studentComplaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = studentComplaints.filter((c) => c.status === 'Resolved').length;

  const categoriesList = [
    'All',
    'Result Delays',
    'Hostel Water Supply',
    'ID Card Issuance',
    'Library Access',
    'Course Registration',
    'Departmental Fees',
    'Missing CA Marks',
    'Classroom Defects',
    'Exam Clash',
    'Transcript Delay'
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Student Credentials Header */}
      <div className="geom-card geom-accent-blue rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-xs font-mono font-semibold border border-blue-200/80 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>STUDENT E-PORTAL DASHBOARD</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Welcome, {currentUser.full_name}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Matriculation Number: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{currentUser.reg_number}</span> | Imo State Polytechnic, Omuma Campus
          </p>
        </div>

        <button
          onClick={onLodgeNew}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition ring-1 ring-blue-400/30 active:scale-[0.98] font-mono tracking-wider uppercase"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Lodge New Complaint</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="geom-card geom-accent-blue p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Total Complaints</p>
            <h3 className="text-3xl font-display font-bold text-slate-900 mt-1">{totalCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Lodged history</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="geom-card geom-accent-emerald p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Auto-Responded</p>
            <h3 className="text-3xl font-display font-bold text-emerald-700 mt-1">{autoRespondedCount}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-sans">Matched by Engine</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
        </div>

        <div className="geom-card p-5 rounded-2xl shadow-sm border-t-3 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">In Progress</p>
            <h3 className="text-3xl font-display font-bold text-amber-600 mt-1">{inProgressCount}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5 font-sans">Under Admin Review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="geom-card geom-accent-indigo p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Resolved</p>
            <h3 className="text-3xl font-display font-bold text-indigo-700 mt-1">{resolvedCount}</h3>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-sans">Successfully closed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Complaints List Table Section */}
      <div className="geom-card rounded-2xl shadow-sm overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search complaints or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-mono font-bold text-slate-600 uppercase shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2" />
              <p>Loading complaint directory...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-display font-bold text-slate-800">No Complaints Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                You have not lodged any complaints matching this filter. Click below to submit a new issue.
              </p>
              <button
                onClick={onLodgeNew}
                className="mt-4 inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider bg-blue-700 text-white px-4 py-2.5 rounded-xl hover:bg-blue-800 transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Lodge Complaint Now</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200/90 text-[10px] font-mono uppercase tracking-widest font-bold text-slate-600">
                  <th className="py-3.5 px-4 sm:px-6">Complaint ID</th>
                  <th className="py-3.5 px-4 sm:px-6">Subject & Category</th>
                  <th className="py-3.5 px-4 sm:px-6">Auto-Match Template</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Date Lodged</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((c) => {
                  const statusColors: Record<string, string> = {
                    'Auto-Responded': 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
                    'Pending': 'bg-slate-100 text-slate-800 border-slate-300/80',
                    'In Progress': 'bg-amber-50 text-amber-800 border-amber-300/80',
                    'Resolved': 'bg-blue-50 text-blue-800 border-blue-300/80',
                    'Closed': 'bg-purple-50 text-purple-800 border-purple-300/80',
                  };

                  return (
                    <tr key={c.complaint_id} className="hover:bg-slate-50/90 transition">
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900">
                        #{c.complaint_id}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 max-w-xs truncate">{c.subject}</div>
                        <div className="inline-block mt-1 text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.category}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-600">
                        {c.matched_template_title ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <Bot className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[180px] font-mono text-[11px]">{c.matched_template_title}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">General Evaluation</span>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${statusColors[c.status] || 'bg-slate-100 text-slate-700'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-[11px] text-slate-500 font-mono">
                        {c.created_at}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => onViewThread(c.complaint_id)}
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-blue-700 text-white text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Thread</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
