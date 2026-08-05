import React, { useState, useEffect } from 'react';
import { Complaint, User, AdminNotification } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Bot, 
  UserCheck,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  Bell,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Download,
  Printer
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  complaints: Complaint[];
  isLoading: boolean;
  onRefresh: () => void;
  onViewThread: (complaintId: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  complaints,
  isLoading,
  onRefresh,
  onViewThread,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Admin Notifications State
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'new' | 'urgent' | 'status_change'>('all');
  const [showNotifPanel, setShowNotifPanel] = useState(true);

  // Fetch admin notifications from database / API
  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        // Fallback to PHP script check endpoint
        const phpRes = await fetch('/process_complaint.php?action=get_notifications');
        if (phpRes.ok) {
          const phpData = await phpRes.json();
          if (phpData.data) {
            setNotifications(phpData.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [complaints.length]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
    } catch (err) {
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'all') return true;
    return n.notification_type === notifFilter;
  });

  const filtered = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.subject.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.studentID.toLowerCase().includes(q) ||
      (c.student_name && c.student_name.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalCount = complaints.length;
  const autoRespondedCount = complaints.filter((c) => c.status === 'Auto-Responded').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

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

  const statusList = ['All', 'Auto-Responded', 'Pending', 'In Progress', 'Resolved', 'Closed'];

  const generatePdfReport = async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Load Logo Image
    const loadLogo = (): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = "https://res.cloudinary.com/n4kwtphh/image/upload/v1785941933/photo_2026-07-28_22-46-21_vuamoj.jpg";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    };

    const logoImg = await loadLogo();
    if (logoImg) {
      try {
        doc.addImage(logoImg, 'JPEG', 14, 10, 18, 18);
      } catch (e) {
        try {
          doc.addImage(logoImg, 'PNG', 14, 10, 18, 18);
        } catch (e2) {
          // Fallback if canvas draw fails
        }
      }
    }

    // Header Branding - Imo State Polytechnic
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216); // Navy Blue (#1D4ED8)
    doc.text("IMO STATE POLYTECHNIC, OMUMA", 112, 16, { align: "center" });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Accent Green (#16A34A)
    doc.text("(Orlu East Local Government Area, Imo State, Nigeria)", 112, 22, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text("OFFICE OF THE REGISTRAR & DIRECTORATE OF STUDENT AFFAIRS", 112, 27, { align: "center" });
    doc.text("ONLINE STUDENTS' COMPLAINT SYSTEM — OFFICIAL AUDIT REPORT", 112, 32, { align: "center" });

    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.8);
    doc.line(14, 37, 196, 37);

    // Meta details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("REPORT SUMMARY & COMPLAINT REGISTRY", 14, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Generated On: ${new Date().toLocaleString('en-NG', { dateStyle: 'full', timeStyle: 'short' })}`, 14, 51);
    doc.text(`Generated By: ${currentUser.full_name} (${currentUser.reg_number})`, 14, 56);
    doc.text(`Active Filters: Category [${selectedCategory}] | Status [${selectedStatus}] | Search Query ["${searchQuery || 'None'}"]`, 14, 61);

    // Statistics Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 65, 182, 14, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Total Records: ${filtered.length} of ${totalCount}   |   Auto-Responded: ${autoRespondedCount}   |   In Progress: ${inProgressCount}   |   Resolved: ${resolvedCount}`, 18, 74);

    // AutoTable Data
    const tableBody = filtered.map(c => [
      `#${c.complaint_id}`,
      `${c.student_name || 'N/A'}\n(${c.studentID})`,
      c.category,
      c.subject.length > 40 ? c.subject.substring(0, 40) + '...' : c.subject,
      c.status,
      c.created_at
    ]);

    autoTable(doc, {
      startY: 83,
      head: [['ID', 'Student Info', 'Category', 'Subject Overview', 'Status', 'Date Lodged']],
      body: tableBody,
      headStyles: {
        fillColor: [29, 78, 216],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 42 },
        2: { cellWidth: 35 },
        3: { cellWidth: 50 },
        4: { cellWidth: 22 },
        5: { cellWidth: 18 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 83, right: 14, bottom: 35, left: 14 }
    });

    // Signature Block
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 210;
    const pageHeight = doc.internal.pageSize.height;

    let sigY = finalY;
    if (finalY + 30 > pageHeight - 20) {
      doc.addPage();
      sigY = 30;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);

    doc.line(20, sigY + 15, 80, sigY + 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text("Dean / Head of Student Affairs", 20, sigY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text("Imo State Polytechnic, Omuma", 20, sigY + 24);

    doc.line(130, sigY + 15, 190, sigY + 15);
    doc.setFont('helvetica', 'bold');
    doc.text("ICT / Academic Records Officer", 130, sigY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text("Signature & Institutional Stamp", 130, sigY + 24);

    // Page Numbers & Footer
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}  —  Imo State Polytechnic, Omuma | Final Year Project Documentation Audit Report`, 105, pageHeight - 10, { align: 'center' });
    }

    doc.save(`ImoPoly_Student_Complaints_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Admin Title Banner */}
      <div className="geom-card-dark rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-mono font-bold border border-emerald-800 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ADMINISTRATOR CONTROL CENTER</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Complaint Operations & Oversight</h2>
          <p className="text-xs text-slate-300 mt-1 font-sans">
            Imo State Polytechnic, Omuma | Directorate of Academic & Student Affairs Audit Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={generatePdfReport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
            title="Generate Printable PDF Audit Report for Project Documentation"
          >
            <Printer className="w-4 h-4" />
            <span>Export PDF Report</span>
          </button>

          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} UNREAD
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onRefresh();
              fetchNotifications();
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border border-slate-700 transition shadow-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${notifLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Admin Notifications Table/Feed Card */}
      {showNotifPanel && (
        <div className="geom-card rounded-2xl shadow-sm overflow-hidden border-2 border-blue-600/30">
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-800 border border-blue-200">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span>Admin Notifications (`admin_notifications`)</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                      {unreadCount} Unread
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Automated alerts logged on new complaint submission or status escalation to urgent.
                </p>
              </div>
            </div>

            {/* Notification Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-[10px] font-mono font-bold">
                <button
                  onClick={() => setNotifFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${notifFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setNotifFilter('new')}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${notifFilter === 'new' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  New ({notifications.filter(n => n.notification_type === 'new').length})
                </button>
                <button
                  onClick={() => setNotifFilter('urgent')}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${notifFilter === 'urgent' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Urgent ({notifications.filter(n => n.notification_type === 'urgent').length})
                </button>
                <button
                  onClick={() => setNotifFilter('status_change')}
                  className={`px-2.5 py-1 rounded-lg transition uppercase ${notifFilter === 'status_change' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Status Updates
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications Feed List */}
          <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
            {notifLoading ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mb-1" />
                <p>Checking admin_notifications table...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-mono text-xs">
                No notifications found for selected filter.
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isUrgent = n.notification_type === 'urgent';
                const isNew = n.notification_type === 'new';

                return (
                  <div
                    key={n.notification_id}
                    className={`p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      !n.is_read ? (isUrgent ? 'bg-red-50/80 border-l-4 border-red-600' : 'bg-blue-50/60 border-l-4 border-blue-600') : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isUrgent ? 'bg-red-100 text-red-700' : isNew ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isUrgent ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <Sparkles className="w-4 h-4" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                            isUrgent ? 'bg-red-600 text-white border-red-700' : isNew ? 'bg-blue-600 text-white border-blue-700' : 'bg-emerald-700 text-white border-emerald-800'
                          }`}>
                            {n.notification_type}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-900">
                            Complaint #{n.complaint_id}
                          </span>
                          {!n.is_read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600" title="Unread" />
                          )}
                        </div>
                        <p className="text-xs text-slate-800 font-medium">{n.message || n.subject}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          Log Timestamp: {n.timestamp} {n.student_name ? `• Student: ${n.student_name}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.notification_id)}
                          className="text-[10px] font-mono font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                        >
                          Dismiss
                        </button>
                      )}
                      <button
                        onClick={() => onViewThread(n.complaint_id)}
                        className="inline-flex items-center gap-1 bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-lg transition"
                      >
                        <span>Open Complaint</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="geom-card geom-accent-blue p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Total Complaints</p>
            <h3 className="text-3xl font-display font-bold text-slate-900 mt-1">{totalCount}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">All student submissions</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="geom-card geom-accent-emerald p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Auto-Responded</p>
            <h3 className="text-3xl font-display font-bold text-emerald-700 mt-1">{autoRespondedCount}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-sans">Matched by engine</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
        </div>

        <div className="geom-card p-5 rounded-2xl shadow-sm border-t-3 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">In Progress</p>
            <h3 className="text-3xl font-display font-bold text-amber-600 mt-1">{inProgressCount}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5 font-sans">Staff investigating</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="geom-card geom-accent-indigo p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Resolved</p>
            <h3 className="text-3xl font-display font-bold text-indigo-700 mt-1">{resolvedCount}</h3>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-sans">Final resolution</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Complaint Queue Table */}
      <div className="geom-card rounded-2xl shadow-sm overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student, matric, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-600">
              <Filter className="w-4 h-4" />
              <span>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-600">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {statusList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generatePdfReport}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
              title="Print / Save filtered complaints as PDF report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2" />
              <p>Fetching complaint queue...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-mono text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="font-bold text-slate-800 text-sm">No Complaints Match Criteria</p>
              <p className="text-slate-500 mt-1">Try resetting search query or category filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200/90 text-[10px] font-mono uppercase tracking-widest font-bold text-slate-600">
                  <th className="py-3.5 px-4 sm:px-6">ID & Student</th>
                  <th className="py-3.5 px-4 sm:px-6">Subject & Category</th>
                  <th className="py-3.5 px-4 sm:px-6">Matched Auto-Template</th>
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Date Lodged</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Admin Action</th>
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
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-mono font-bold text-slate-900">#{c.complaint_id}</div>
                        <div className="font-bold text-slate-800 text-xs mt-0.5">{c.student_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{c.studentID}</div>
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
                          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Review Thread</span>
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
