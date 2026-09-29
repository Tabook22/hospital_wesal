export type UserRole = 'ADMIN' | 'RECEPTION' | 'SECURITY' | 'MANAGEMENT' | 'VISITOR';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Patient {
  id: number;
  hospital_number: string;
  full_name: string;
  civil_id?: string;
  gender: string;
  ward_id: number;
  ward_name?: string;
  room_id: number;
  room_number?: string;
  bed: string;
  admission_status: string;
  admission_date: string;
  max_concurrent_visitors: number;
  max_daily_visitors: number;
  current_visitors_count: number;
  today_visitors_count: number;
  can_admit_visitor: boolean;
}

export interface PatientCapacityStatus {
  patient_id: number;
  hospital_number: string;
  full_name: string;
  ward_name: string;
  room_number: string;
  bed: string;
  current_concurrent_visitors: number;
  max_concurrent_visitors: number;
  today_total_visitors: number;
  max_daily_visitors: number;
  allowed_new_visitor: boolean;
  reason?: string;
}

export interface Visitor {
  id: number;
  full_name: string;
  civil_id: string;
  mobile_number: string;
  visitor_type: 'VISITOR' | 'COMPANION';
  relationship_to_patient?: string;
  notes?: string;
  created_at: string;
  active_visit_id?: number;
  active_visit_status?: string;
}

export interface VisitorTimelineEvent {
  timestamp: string;
  checkpoint_name?: string;
  event_type: string;
  description: string;
  status: string;
}

export interface VisitorDetail extends Visitor {
  total_visits: number;
  timeline: VisitorTimelineEvent[];
}

export interface VisitorPass {
  id: number;
  visit_id: number;
  pass_code: string;
  secure_token: string;
  qr_payload: string;
  qr_image_base64?: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  generated_at: string;
  revoked_at?: string;
}

export type VisitStatus = 'REGISTERED' | 'ACTIVE' | 'ENDING_SOON' | 'OVERDUE' | 'CHECKED_OUT' | 'CANCELLED';

export interface Visit {
  id: number;
  visit_number: string;
  patient_id: number;
  patient_name: string;
  patient_hospital_number: string;
  patient_room: string;
  patient_bed: string;
  visitor_id: number;
  visitor_name: string;
  visitor_civil_id: string;
  visitor_mobile: string;
  visitor_type: 'VISITOR' | 'COMPANION';
  ward_id: number;
  ward_name: string;
  service_type: string;
  status: VisitStatus;
  registered_at: string;
  valid_from: string;
  valid_until: string;
  max_duration_minutes: number;
  check_in_at?: string;
  expected_exit_at?: string;
  checked_out_at?: string;
  last_checkpoint_name?: string;
  last_activity_at?: string;
  pass_obj?: VisitorPass;
  remaining_seconds?: number;
  is_overdue: boolean;
  overdue_seconds?: number;
}

export interface Checkpoint {
  id: number;
  code: string;
  name: string;
  ward_id?: number;
  checkpoint_type: 'ENTRY_GATE' | 'WARD_CHECKPOINT' | 'EXIT_GATE';
  is_active: boolean;
}

export interface ScanResult {
  result: 'GRANTED' | 'DENIED';
  reason?: string;
  checkpoint_code: string;
  checkpoint_name: string;
  scan_time: string;
  visitor_name?: string;
  visitor_type?: string;
  pass_code?: string;
  patient_name?: string;
  patient_hospital_number?: string;
  destination_ward?: string;
  destination_room?: string;
  status?: string;
  remaining_minutes?: number;
  expected_exit_at?: string;
  is_checkout: boolean;
  message: string;
}

export interface DashboardKPIs {
  visitors_inside: number;
  visitors_today: number;
  checked_out: number;
  overdue: number;
  denied_entries: number;
  active_passes: number;
}

export interface HourlyActivity {
  hour: string;
  entries: number;
  exits: number;
}

export interface WardOccupancy {
  ward_name: string;
  code: string;
  current_inside: number;
  capacity: number;
  percent: number;
}

export interface DenialBreakdown {
  reason: string;
  count: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  hourly_activity: HourlyActivity[];
  ward_occupancy: WardOccupancy[];
  denial_breakdown: DenialBreakdown[];
  average_visit_minutes: number;
  peak_visiting_hour: string;
  current_occupancy_rate: number;
  active_visitors: Visit[];
}

export interface NotificationItem {
  id: number;
  visit_id?: number;
  recipient_name: string;
  mobile_number: string;
  message: string;
  notification_type: string;
  status: string;
  sent_at: string;
}

export interface PolicySettings {
  id: number;
  visiting_start: string;
  visiting_end: string;
  default_duration_minutes: number;
  warning_threshold_minutes: number;
  max_concurrent_per_patient: number;
  max_daily_per_patient: number;
  companions_allowed: number;
  demo_mode_enabled: boolean;
  demo_duration_minutes: number;
  updated_at?: string;
}

export interface TodayReport {
  date: string;
  total_registered: number;
  total_entries: number;
  total_exits: number;
  currently_inside: number;
  overdue_count: number;
  denied_attempts: number;
  average_visit_duration_minutes: number;
  peak_visiting_hour: string;
}

export interface WardReportItem {
  ward_name: string;
  ward_code: string;
  visitors_today: number;
  currently_inside: number;
  overdue_count: number;
  average_duration_minutes: number;
}

export interface DenialReportItem {
  reason: string;
  count: number;
  percent: number;
}

export interface CurrentLiveVisitorItem {
  visitor_name: string;
  visitor_type: string;
  pass_code: string;
  patient_name: string;
  patient_hospital_number: string;
  ward_name: string;
  room_number: string;
  last_location: string;
  entered_at?: string;
  expected_exit_at?: string;
  status: string;
  remaining_or_overdue_text: string;
}

export interface CurrentLiveReport {
  generated_at: string;
  total_inside: number;
  visitors: CurrentLiveVisitorItem[];
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  user_id?: number;
  username?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details_json?: string;
  ip_address?: string;
}

export interface VisitorPatientSearchItem {
  id: number;
  hospital_number: string;
  full_name: string;
  arabic_name?: string;
  ward_name: string;
  room_number: string;
  bed: string;
  admission_status: string;
  can_admit_visitor: boolean;
  current_concurrent_visitors: number;
  max_concurrent_visitors: number;
  visiting_hours: string;
}

export interface VisitorPassBookRequest {
  patient_id: number;
  visitor_type?: string;
  duration_minutes?: number;
  notes?: string;
}

export interface VisitorPassDetail {
  visit_id: number;
  visit_number: string;
  pass_code: string;
  secure_token: string;
  qr_payload: string;
  qr_image_base64: string;
  visitor_name: string;
  visitor_civil_id: string;
  visitor_mobile: string;
  visitor_type: string;
  patient_name: string;
  patient_hospital_number: string;
  ward_name: string;
  room_number: string;
  bed: string;
  valid_from: string;
  valid_until: string;
  max_duration_minutes: number;
  status: string;
  generated_at: string;
}

export interface VisitorRegisterRequest {
  full_name: string;
  username: string;
  password: string;
  mobile_number: string;
  civil_id: string;
}

