import React, { useState, useMemo } from 'react';
import { Template, User } from '../types';
import { 
  PlusCircle, 
  Send, 
  Sparkles, 
  Bot, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft,
  Building2,
  FileCheck2
} from 'lucide-react';

interface LodgeComplaintProps {
  currentUser: User;
  templates: Template[];
  onSubmitSuccess: (newComplaintId: number) => void;
  onCancel: () => void;
}

export const LodgeComplaint: React.FC<LodgeComplaintProps> = ({
  currentUser,
  templates,
  onSubmitSuccess,
  onCancel,
}) => {
  const [studentID, setStudentID] = useState(currentUser.reg_number);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Course Registration Problem');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ----------------------------------------------------------------
  // LIVE CLIENT-SIDE KEYWORD AUTO-MATCH PREVIEW (Mirrors PHP Engine)
  // ----------------------------------------------------------------
  const liveMatch = useMemo(() => {
    if (!content.trim() && !subject.trim()) return null;

    const searchable = `${subject} ${category} ${content}`.toLowerCase();
    let bestTmpl: Template | null = null;
    let highestScore = 0;
    let matchedKeywords: string[] = [];

    for (const tmpl of templates) {
      const kwList = tmpl.keywords.split(',').map((k) => k.trim().toLowerCase());
      let score = 0;
      const foundInThis: string[] = [];

      for (const kw of kwList) {
        if (kw && searchable.includes(kw)) {
          score += 1;
          foundInThis.push(kw);
        }
      }

      if (tmpl.category.toLowerCase() === category.toLowerCase()) {
        score += 2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTmpl = tmpl;
        matchedKeywords = foundInThis;
      }
    }

    return {
      template: bestTmpl,
      score: highestScore,
      matchedKeywords,
    };
  }, [subject, category, content, templates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      setErrorMessage('Please fill in both the Subject and Description fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/process-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          studentID: studentID,
          subject: subject,
          category: category,
          content: content,
          description: content,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      onSubmitSuccess(data.complaint.complaint_id);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while lodging complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = [
    'Course Registration Problem',
    'Missing Result',
    'School Fees Payment Not Reflecting',
    'Portal Login Problem',
    'Wrong Course Allocation',
    'Timetable Clash',
    'Hostel Allocation Issue',
    'Library Access Problem',
    'Examination Card Issue',
    'Identity Card Delay',
    'Others'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs font-mono font-semibold text-slate-500">
          Imo State Polytechnic, Omuma E-Lodgement Form
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Complaint Form */}
        <div className="lg:col-span-2 geom-card geom-accent-emerald rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-200/80 pb-4">
            <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-emerald-600" />
              <span>Lodge Official Student Complaint</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Submissions are automatically processed through the Imo Poly Intelligent Keyword Resolution Engine.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl font-mono font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                  Matriculation / Reg Number
                </label>
                <input
                  type="text"
                  value={studentID}
                  onChange={(e) => setStudentID(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                Complaint Subject Line
              </label>
              <input
                type="text"
                placeholder="e.g., Delay in 1st Semester Exam Scores for COM 111"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase tracking-widest mb-1.5">
                Detailed Complaint Description / Content
              </label>
              <textarea
                rows={6}
                placeholder="Describe your issue clearly. Mention relevant course codes, hostel room numbers, transaction reference numbers, or dates..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-y"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Auto-Reply...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Run Auto-Reply Engine</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Auto-Response Engine Preview Sidebar */}
        <div className="space-y-4">
          <div className="geom-card-dark rounded-2xl p-5 text-white border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Real-Time Keyword Matcher</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              As you type your complaint description, our keyword evaluator tests your input against the 10 core template triggers.
            </p>

            <div className="mt-2 pt-2">
              {liveMatch && liveMatch.template ? (
                <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-xl border border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      <Bot className="w-3.5 h-3.5" />
                      Template Matched
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Score: +{liveMatch.score}
                    </span>
                  </div>

                  <h4 className="text-xs font-display font-bold text-white">
                    {liveMatch.template.title}
                  </h4>

                  {liveMatch.matchedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {liveMatch.matchedKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] bg-blue-900/70 text-blue-200 border border-blue-700/60 px-1.5 py-0.5 rounded font-mono">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-relaxed italic">
                    "{liveMatch.template.auto_response}"
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs space-y-1">
                  <HelpCircle className="w-6 h-6 mx-auto text-slate-500" />
                  <span className="block font-mono text-[11px]">Type keywords (e.g., "result", "hostel", "water", "id card") to trigger instant response preview.</span>
                </div>
              )}
            </div>
          </div>

          <div className="geom-card rounded-2xl p-5 text-xs text-slate-600 space-y-2 shadow-sm">
            <h4 className="font-display font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Imo Poly Service SLA</span>
            </h4>
            <p className="leading-relaxed">
              Automated responses are attached instantaneously upon complaint submission. If staff follow-up is required, academic officers respond within 24-48 business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
