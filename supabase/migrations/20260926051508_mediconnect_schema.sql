/*
# MediConnect AI - Full Schema

1. New Tables (creation order matters for FK references)
- `patients` — patient profiles with name, age, gender, blood group, conditions, etc.
- `users` — demo accounts (patient1, patient2, patient3, doctor). Stores username, password (plain for demo), role, and linked patient_id.
- `health_updates` — each submission from a patient: vitals, symptoms, notes, AI guidance, risk level, status.
- `doctor_notes` — doctor's summary, recommendation, follow-up instructions sent to a patient for a specific health update.
- `ai_interactions` — log of AI conversations (patient or doctor) with messages stored as JSONB.

2. Relationships
- users.patient_id -> patients.id
- health_updates.patient_id -> patients.id
- doctor_notes.patient_id -> patients.id, doctor_notes.health_update_id -> health_updates.id
- ai_interactions.user_id -> users.id, ai_interactions.patient_id -> patients.id

3. Security
- RLS enabled on all tables with TO anon, authenticated (demo app, custom auth, dummy data).

4. Notes
- Educational demonstration only. All data is fictional.
- Risk levels: LOW, MODERATE, HIGH (demonstration only).
- Status values: 'WAITING FOR DOCTOR', 'UNDER REVIEW', 'REVIEWED'.
*/

-- PATIENTS table (must exist first — users references it)
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age int NOT NULL,
  gender text,
  blood_group text,
  phone text,
  email text,
  address text,
  medical_conditions text,
  allergies text,
  current_status text DEFAULT 'Stable',
  created_at timestamptz DEFAULT now()
);

-- USERS table (demo auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'doctor')),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- HEALTH_UPDATES table
CREATE TABLE IF NOT EXISTS health_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  temperature numeric,
  heart_rate int,
  blood_pressure_systolic int,
  blood_pressure_diastolic int,
  oxygen_saturation int,
  symptoms text,
  feeling text,
  duration text,
  notes text,
  ai_guidance text,
  risk_level text DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH')),
  risk_factors text,
  status text DEFAULT 'WAITING FOR DOCTOR' CHECK (status IN ('WAITING FOR DOCTOR', 'UNDER REVIEW', 'REVIEWED')),
  created_at timestamptz DEFAULT now()
);

-- DOCTOR_NOTES table
CREATE TABLE IF NOT EXISTS doctor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  health_update_id uuid NOT NULL REFERENCES health_updates(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  doctor_summary text,
  doctor_recommendation text,
  follow_up_instructions text,
  created_at timestamptz DEFAULT now()
);

-- AI_INTERACTIONS table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('patient', 'doctor')),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_updates_patient_id ON health_updates(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_updates_risk_level ON health_updates(risk_level);
CREATE INDEX IF NOT EXISTS idx_health_updates_status ON health_updates(status);
CREATE INDEX IF NOT EXISTS idx_doctor_notes_patient_id ON doctor_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- USERS policies
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- PATIENTS policies
DROP POLICY IF EXISTS "anon_select_patients" ON patients;
CREATE POLICY "anon_select_patients" ON patients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;
CREATE POLICY "anon_delete_patients" ON patients FOR DELETE TO anon, authenticated USING (true);

-- HEALTH_UPDATES policies
DROP POLICY IF EXISTS "anon_select_health_updates" ON health_updates;
CREATE POLICY "anon_select_health_updates" ON health_updates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_health_updates" ON health_updates;
CREATE POLICY "anon_insert_health_updates" ON health_updates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_health_updates" ON health_updates;
CREATE POLICY "anon_update_health_updates" ON health_updates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_health_updates" ON health_updates;
CREATE POLICY "anon_delete_health_updates" ON health_updates FOR DELETE TO anon, authenticated USING (true);

-- DOCTOR_NOTES policies
DROP POLICY IF EXISTS "anon_select_doctor_notes" ON doctor_notes;
CREATE POLICY "anon_select_doctor_notes" ON doctor_notes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_doctor_notes" ON doctor_notes;
CREATE POLICY "anon_insert_doctor_notes" ON doctor_notes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_doctor_notes" ON doctor_notes;
CREATE POLICY "anon_update_doctor_notes" ON doctor_notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_doctor_notes" ON doctor_notes;
CREATE POLICY "anon_delete_doctor_notes" ON doctor_notes FOR DELETE TO anon, authenticated USING (true);

-- AI_INTERACTIONS policies
DROP POLICY IF EXISTS "anon_select_ai_interactions" ON ai_interactions;
CREATE POLICY "anon_select_ai_interactions" ON ai_interactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_interactions" ON ai_interactions;
CREATE POLICY "anon_insert_ai_interactions" ON ai_interactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ai_interactions" ON ai_interactions;
CREATE POLICY "anon_update_ai_interactions" ON ai_interactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_interactions" ON ai_interactions;
CREATE POLICY "anon_delete_ai_interactions" ON ai_interactions FOR DELETE TO anon, authenticated USING (true);