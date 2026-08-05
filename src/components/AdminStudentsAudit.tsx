import React, { useState, useEffect } from 'react';
import { StudentAudit, Complaint } from '../types';
import { 
  Users, 
  Search, 
  History, 
  MessageSquare, 
  Bot, 
  ShieldCheck, 
  ChevronRight, 
  X,
  FileText,
  Building2,
  Calendar
} from 'lucide-react';

export const AdminStudentsAudit: React.FC = () => {
  const [students, setStudents] = useState<StudentAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentAudit | null>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to load student directory');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.reg_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="geom-card geom-accent-blue rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 text-xs font-mono font-bold border border-indigo-200/80 mb-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>STUDENT AUDIT DIRECTORY & HISTORICAL LOG</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">Student History & Activity Logs</h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Complete audit trail of matriculation records, lodged complaints, system auto-matched responses, and staff resolutions.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, matric no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
        </div>
      </div>

      {/* Main Grid: Student Directory List & Selected Student Audit Timeline Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Student Directory Table (Left Side / Full Width if no student selected) */}
        <div className={selectedStudent ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className="geom-card rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Registered Students Directory</span>
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full">
                {filteredStudents.length} Students
              </span>
            </div>

            {isLoading ? (
              <div className="p-10 text-center text-slate-500 font-mono text-xs">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-blue-600 border-t-transparent mb-2" />
                <p>Loading directory...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No students match search query.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudent?.user_id === student.user_id;

                  return (
                    <div
                      key={student.user_id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-4 cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-900 text-white border-l-4 border-emerald-400'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>{student.full_name}</div>
                        <div className={`text-[11px] font-mono flex items-center gap-2 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSelected ? 'bg-blue-950 text-blue-200 border border-blue-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {student.reg_number}
                          </span>
                          <span className="truncate max-w-[140px]">{student.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          isSelected ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          <FileText className="w-3 h-3 text-emerald-500" />
                          <span>{student.total_complaints} Logged</span>
                        </span>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-slate-400'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Student Audit Details & Historical Timeline (Right Side Drawer) */}
        {selectedStudent ? (
          <div className="lg:col-span-7 space-y-4">
            <div className="geom-card geom-accent-emerald rounded-2xl p-6 relative shadow-sm">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-slate-200/80 pb-4 mb-5">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-300/80 mb-2 uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student Complete Audit Log</span>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900">{selectedStudent.full_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-sans">
                  Matric: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{selectedStudent.reg_number}</span> | Email: {selectedStudent.email}
                </p>
              </div>

              {/* Complaints History Timeline for Selected Student */}
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {selectedStudent.complaints.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200">
                    This student has not lodged any complaints yet.
                  </div>
                ) : (
                  selectedStudent.complaints.map((c) => (
                    <div key={c.complaint_id} className="geom-card rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            #{c.complaint_id}
                          </span>
                          <span className="text-xs font-display font-bold text-slate-900">{c.subject}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{c.created_at}</span>
                      </div>

                      {/* Original Complaint Text */}
                      <div className="geom-card-dark p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200">
                        <div className="font-mono font-bold text-blue-400 text-[10px] uppercase tracking-widest mb-1">Lodged Description:</div>
                        <p className="whitespace-pre-wrap font-sans leading-relaxed">{c.content || c.description}</p>
                      </div>

                      {/* Thread Responses Logged */}
                      {c.responses && c.responses.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                            Response Log History:
                          </div>
                          {c.responses.map((resp, rIdx) => {
                            const isSystem = resp.responder_type === 'system';
                            return (
                              <div
                                key={rIdx}
                                className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                                  isSystem
                                    ? 'bg-slate-950 text-emerald-300 border-emerald-900/80'
                                    : 'bg-blue-950 text-blue-100 border-blue-900/80'
                                }`}
                              >
                                <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                                  <span className="flex items-center gap-1">
                                    {isSystem ? (
                                      <>
                                        <Bot className="w-3 h-3 text-emerald-400" />
                                        <span>SYSTEM AUTO-MATCHED REPLY</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShieldCheck className="w-3 h-3 text-blue-400" />
                                        <span>ADMIN FOLLOW-UP REPLY</span>
                                      </>
                                    )}
                                  </span>
                                  <span className="font-mono text-slate-400">{resp.created_at}</span>
                                </div>
                                <p className="text-[11px] font-sans text-slate-200">{resp.response_text}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:block lg:col-span-7 geom-card rounded-2xl p-12 text-center text-slate-400 text-xs space-y-2 shadow-sm">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-display font-bold text-slate-800 text-sm">Select a student from the directory</p>
            <p className="text-slate-500 font-sans max-w-sm mx-auto">Click any student record on the left to inspect their full historical complaint audit timeline.</p>
          </div>
        )}
      </div>
    </div>
  );
};
