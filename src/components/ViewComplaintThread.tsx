import React, { useState, useEffect } from 'react';
import { Complaint, User } from '../types';
import { 
  ArrowLeft, 
  Bot, 
  UserCheck, 
  Send, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  MessageSquare,
  Building2,
  FileText
} from 'lucide-react';

interface ViewComplaintThreadProps {
  complaintId: number;
  currentUser: User;
  onBack: () => void;
}

export const ViewComplaintThread: React.FC<ViewComplaintThreadProps> = ({
  complaintId,
  currentUser,
  onBack,
}) => {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchThread = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`);
      if (!res.ok) throw new Error('Failed to load complaint thread');
      const data = await res.json();
      setComplaint(data);
      setStatusUpdate(data.status);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching complaint thread');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [complaintId]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responder_type: currentUser.role === 'admin' ? 'admin' : 'system',
          response_text: responseText,
          update_status: currentUser.role === 'admin' ? statusUpdate : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to post reply');
      setResponseText('');
      await fetchThread();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error posting reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setStatusUpdate(newStatus);
      await fetchThread();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200 shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2" />
        <p className="text-sm">Loading complaint thread details...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-600 border border-slate-200">
        <p>Complaint not found.</p>
        <button onClick={onBack} className="mt-4 text-xs font-semibold text-blue-600 underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    'Auto-Responded': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Pending': 'bg-slate-100 text-slate-800 border-slate-200',
    'In Progress': 'bg-amber-50 text-amber-800 border-amber-200',
    'Resolved': 'bg-blue-50 text-blue-800 border-blue-200',
    'Closed': 'bg-purple-50 text-purple-800 border-purple-200',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints Directory</span>
        </button>
        <span className="text-xs font-mono font-bold text-slate-500">
          Complaint Ticket #{complaint.complaint_id}
        </span>
      </div>

      {/* Main Ticket Banner */}
      <div className="geom-card geom-accent-blue rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                {complaint.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {complaint.created_at}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900">{complaint.subject}</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider border ${statusColors[complaint.status]}`}>
              <span className="w-2 h-2 rounded-full bg-current" />
              {complaint.status}
            </span>

            {/* Admin Status Quick Updater */}
            {currentUser.role === 'admin' && (
              <select
                value={complaint.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs font-mono font-bold bg-slate-950 text-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer border border-slate-800"
              >
                <option value="Auto-Responded">Set: Auto-Responded</option>
                <option value="In Progress">Set: In Progress</option>
                <option value="Resolved">Set: Resolved</option>
                <option value="Closed">Set: Closed</option>
              </select>
            )}
          </div>
        </div>

        {/* Student Credential Meta */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
          <div>
            <span className="text-slate-400 font-mono">Student Name:</span>{' '}
            <span className="font-bold text-slate-900">{complaint.student_name}</span>
          </div>
          <div>
            <span className="text-slate-400 font-mono">Matric / Reg No:</span>{' '}
            <span className="font-mono font-bold text-slate-900 bg-slate-200/70 px-1.5 py-0.5 rounded">{complaint.studentID}</span>
          </div>
          {complaint.matched_template_title && (
            <div className="text-emerald-700 font-mono font-semibold flex items-center gap-1 text-[11px]">
              <Bot className="w-3.5 h-3.5" />
              <span>Matched: {complaint.matched_template_title}</span>
            </div>
          )}
        </div>

        {/* Original Complaint Content Block */}
        <div className="geom-card-dark text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Original Lodged Complaint Description</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200 font-sans pt-1">
            {complaint.content || complaint.description}
          </p>
        </div>
      </div>

      {/* Chronological Response Thread */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Official Resolution Thread History</span>
        </h3>

        {complaint.responses && complaint.responses.length > 0 ? (
          complaint.responses.map((resp, idx) => {
            const isSystem = resp.responder_type === 'system';

            return (
              <div
                key={resp.response_id || idx}
                className={`p-5 rounded-2xl border shadow-sm space-y-2 transition ${
                  isSystem
                    ? 'geom-card-dark text-white border-emerald-800/80'
                    : 'geom-card text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    {isSystem ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}

                    <span className={`text-xs font-mono font-bold ${isSystem ? 'text-emerald-400' : 'text-slate-900'}`}>
                      {isSystem ? 'AUTOMATED SYSTEM RESPONSE (IMO POLY ENGINE)' : 'POLYTECHNIC ADMIN / STAFF REPLY'}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono ${isSystem ? 'text-slate-400' : 'text-slate-500'}`}>
                    {resp.created_at}
                  </span>
                </div>

                <p className={`text-sm leading-relaxed ${isSystem ? 'text-emerald-100 font-sans' : 'text-slate-700 font-sans'}`}>
                  {resp.response_text}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-6 geom-card text-center text-xs text-slate-500 font-mono">
            No response logs recorded yet.
          </div>
        )}
      </div>

      {/* Reply Box */}
      <div className="geom-card rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Send className="w-4 h-4 text-blue-600" />
          <span>Post Follow-up Message or Resolution Update</span>
        </h4>

        {errorMessage && (
          <div className="text-xs font-mono text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSendResponse} className="space-y-3">
          <textarea
            rows={3}
            placeholder={
              currentUser.role === 'admin'
                ? "Enter manual staff response or resolution update..."
                : "Enter additional student details or follow-up note..."
            }
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-y"
          />

          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono text-slate-500">
              Posting as: <span className="font-bold text-slate-800">{currentUser.full_name} ({currentUser.role.toUpperCase()})</span>
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !responseText.trim()}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Send Follow-up Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
