import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  username: string;
  password: string;
  role: 'patient' | 'doctor';
  patient_id: string | null;
  created_at: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  current_status: string | null;
  is_sharing_location: boolean;
  date_of_birth: string | null;
  medical_history: string | null;
  family_history: string | null;
  previous_cardiac_conditions: string | null;
  emergency_notes: string | null;
  created_at: string;
};

export type HealthUpdate = {
  id: string;
  patient_id: string;
  temperature: number | null;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  symptoms: string | null;
  feeling: string | null;
  duration: string | null;
  notes: string | null;
  ai_guidance: string | null;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH';
  risk_factors: string | null;
  status: 'WAITING FOR DOCTOR' | 'UNDER REVIEW' | 'REVIEWED';
  age_group: string | null;
  priority_reasons: string | null;
  created_at: string;
};

export type DoctorNote = {
  id: string;
  health_update_id: string;
  patient_id: string;
  doctor_name: string;
  doctor_summary: string | null;
  doctor_recommendation: string | null;
  follow_up_instructions: string | null;
  created_at: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type CardiacReport = {
  id: string;
  patient_id: string;
  report_type: 'ECG' | 'ECHO';
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  uploaded_by: 'patient' | 'doctor';
  ecg_heart_rate: number | null;
  ecg_pr_interval: number | null;
  ecg_qrs_duration: number | null;
  ecg_qt_interval: number | null;
  ecg_qtc_interval: number | null;
  ecg_rhythm: string | null;
  ecg_abnormalities: string | null;
  echo_lvef: number | null;
  echo_ventricular_function: string | null;
  echo_valve_abnormalities: string | null;
  echo_structural_findings: string | null;
  report_notes: string | null;
  verification: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
};

export type TreatmentPlan = {
  id: string;
  patient_id: string;
  doctor_name: string;
  status: 'PROPOSED' | 'APPROVED';
  medications: string | null;
  lifestyle_recommendations: string | null;
  follow_up_date: string | null;
  follow_up_instructions: string | null;
  ai_note: string | null;
  doctor_note: string | null;
  approval_note: string | null;
  created_at: string;
  updated_at: string;
};

export type FollowUp = {
  id: string;
  patient_id: string;
  doctor_name: string;
  title: string;
  due_date: string | null;
  instructions: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  completed_at: string | null;
  created_at: string;
};

export type Hospital = {
  id: string;
  name: string;
  phone: string | null;
  specialties: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

export type LocationUpdate = {
  id: string;
  patient_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  created_at: string;
};
