export interface User {
  user_id: number;
  full_name: string;
  reg_number: string; // Matriculation number
  email: string;
  role: 'student' | 'admin';
}

export interface Template {
  template_id: number;
  category: string;
  title: string;
  keywords: string;
  auto_response: string;
  created_at?: string;
}

export interface ComplaintResponse {
  response_id: number;
  complaint_id: number;
  responder_type: 'system' | 'admin';
  response_text: string;
  created_at: string;
}

export interface Complaint {
  complaint_id: number;
  user_id: number;
  studentID: string;
  subject: string;
  category: string;
  content: string;
  description: string;
  status: 'Pending' | 'Auto-Responded' | 'In Progress' | 'Resolved' | 'Closed';
  matched_template_id: number | null;
  matched_template_title?: string;
  created_at: string;
  student_name?: string;
  responses?: ComplaintResponse[];
}

export interface StudentAudit {
  user_id: number;
  full_name: string;
  reg_number: string;
  email: string;
  total_complaints: number;
  complaints: Complaint[];
}

export interface AdminNotification {
  notification_id: number;
  complaint_id: number;
  notification_type: 'new' | 'urgent' | 'reassigned' | 'status_change';
  message?: string;
  is_read: boolean;
  timestamp: string;
  student_name?: string;
  subject?: string;
}
