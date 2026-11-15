/*
# Cardiac Care System Enhancements

1. New Tables
- `cardiac_reports` — ECG and Echo report records uploaded by patients or doctors.
  - `patient_id` (uuid, references patients, required)
  - `report_type` (text: 'ECG' or 'ECHO')
  - `file_url` (text, storage path for the uploaded PDF/JPG/PNG, nullable)
  - `file_name` (text, original file name)
  - `file_type` (text, mime type)
  - `uploaded_by` (text: 'patient' or 'doctor')
  - ECG fields: `ecg_heart_rate`, `ecg_pr_interval`, `ecg_qrs_duration`, `ecg_qt_interval`,
    `ecg_qtc_interval`, `ecg_rhythm`, `ecg_abnormalities`
  - Echo fields: `echo_lvef` (int, %), `echo_ventricular_function`, `echo_valve_abnormalities`,
    `echo_structural_findings`
  - `report_notes` (free-text notes)
  - `verification` (text: 'PENDING', 'VERIFIED', 'REJECTED'), `verified_by`, `verified_at`,
    `verification_notes`
  - `created_at`
- `emergency_alerts` — emergency SOS alerts raised by patients.
  - `patient_id`, `trigger` ('PATIENT_SOS' or 'AI_HIGH_RISK'), `message`, `status`
    ('OPEN', 'ACKNOWLEDGED', 'RESOLVED'), `acknowledged_by`, `acknowledged_at`,
    `lat`, `lng` (snapshot of patient position when raised), `created_at`
- `emergency_contacts` — authorized contacts notified on emergencies.
  - `patient_id`, `name`, `relationship`, `phone` (required for emergency calling)
- `treatment_plans` — doctor-created personalized plans.
  - `patient_id`, `doctor_name`, `status` ('PROPOSED' -> 'APPROVED'), `medications`,
    `lifestyle_recommendations`, `follow_up_date`, `follow_up_instructions`, `ai_recommendation_id`
    (nullable link to the AI note it approves/modifies), `ai_note` (what the AI suggested),
    `doctor_note` (what the doctor decided), `approval_note`, timestamps
- `model_artifacts` — saved logistic regression model + preprocessing pipeline from training runs.
  - `version` (unique), `algorithm`, `dataset`, `feature_names` (jsonb), `means` (jsonb),
    `stds` (jsonb), `weights` (jsonb), `bias` (numeric), `metrics` (jsonb: accuracy, precision,
    recall, f1, roc_auc, confusion matrix, roc curve points), `train_samples`, `test_samples`,
    `total_samples`, `trained_at`

2. Modified Tables (all non-destructive column additions)
- `patients`: add `family_history` (text), `previous_cardiac_conditions` (text),
  `emergency_notes` (text, e.g. current medications doctor should know in an emergency)
- `health_updates`: add `priority_reasons` (text, human-readable explanation of the priority
  classification), `age_group` (text, the patient's age group at classification time)

3. Security
- RLS enabled on all new tables.
- This is a demo app with custom (non-Supabase-Auth) accounts: all tables use
  `TO anon, authenticated` policies with `USING (true)` / `WITH CHECK (true)`,
  matching the existing schema's security model. Role separation (patient vs doctor)
  is enforced in the application layer, as in the existing tables.
- Grants: full CRUD to anon + authenticated on all new tables, plus SELECT/UPDATE on
  the new columns of modified tables (the Data API already had table-level grants; new
  columns inherit table privileges, but grants are re-issued explicitly for clarity).

4. Notes
- No existing columns are dropped or modified. All changes are additive.
- Report files are stored in Supabase Storage (bucket `medical-reports`, created here).
- Storage policies allow anon + authenticated upload/read within the bucket.
*/

CREATE TABLE IF NOT EXISTS cardiac_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('ECG', 'ECHO')),
  file_url text,
  file_name text,
  file_type text,
  uploaded_by text NOT NULL DEFAULT 'patient' CHECK (uploaded_by IN ('patient', 'doctor')),
  ecg_heart_rate int,
  ecg_pr_interval int,
  ecg_qrs_duration int,
  ecg_qt_interval int,
  ecg_qtc_interval int,
  ecg_rhythm text,
  ecg_abnormalities text,
  echo_lvef int,
  echo_ventricular_function text,
  echo_valve_abnormalities text,
  echo_structural_findings text,
  report_notes text,
  verification text NOT NULL DEFAULT 'PENDING' CHECK (verification IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by text,
  verified_at timestamptz,
  verification_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  trigger text NOT NULL CHECK (trigger IN ('PATIENT_SOS', 'AI_HIGH_RISK')),
  message text,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  acknowledged_by text,
  acknowledged_at timestamptz,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  status text NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'APPROVED')),
  medications text,
  lifestyle_recommendations text,
  follow_up_date date,
  follow_up_instructions text,
  ai_recommendation_id uuid REFERENCES doctor_notes(id) ON DELETE SET NULL,
  ai_note text,
  doctor_note text,
  approval_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text UNIQUE NOT NULL,
  algorithm text NOT NULL DEFAULT 'Logistic Regression',
  dataset text NOT NULL,
  feature_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  means jsonb NOT NULL DEFAULT '[]'::jsonb,
  stds jsonb NOT NULL DEFAULT '[]'::jsonb,
  weights jsonb NOT NULL DEFAULT '[]'::jsonb,
  bias numeric,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  train_samples int,
  test_samples int,
  total_samples int,
  trained_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cardiac_reports_patient ON cardiac_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiac_reports_type ON cardiac_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_patient ON emergency_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient ON emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);

-- New columns on existing tables (idempotent)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS family_history text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS previous_cardiac_conditions text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_notes text;
ALTER TABLE health_updates ADD COLUMN IF NOT EXISTS priority_reasons text;
ALTER TABLE health_updates ADD COLUMN IF NOT EXISTS age_group text;

-- RLS
ALTER TABLE cardiac_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_artifacts ENABLE ROW LEVEL SECURITY;

-- Policies (demo app: custom auth, anon + authenticated, matching existing schema)
DROP POLICY IF EXISTS "anon_select_cardiac_reports" ON cardiac_reports;
CREATE POLICY "anon_select_cardiac_reports" ON cardiac_reports FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_cardiac_reports" ON cardiac_reports;
CREATE POLICY "anon_insert_cardiac_reports" ON cardiac_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cardiac_reports" ON cardiac_reports;
CREATE POLICY "anon_update_cardiac_reports" ON cardiac_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cardiac_reports" ON cardiac_reports;
CREATE POLICY "anon_delete_cardiac_reports" ON cardiac_reports FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_emergency_alerts" ON emergency_alerts;
CREATE POLICY "anon_select_emergency_alerts" ON emergency_alerts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_emergency_alerts" ON emergency_alerts;
CREATE POLICY "anon_insert_emergency_alerts" ON emergency_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_emergency_alerts" ON emergency_alerts;
CREATE POLICY "anon_update_emergency_alerts" ON emergency_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_emergency_alerts" ON emergency_alerts;
CREATE POLICY "anon_delete_emergency_alerts" ON emergency_alerts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_emergency_contacts" ON emergency_contacts;
CREATE POLICY "anon_select_emergency_contacts" ON emergency_contacts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_emergency_contacts" ON emergency_contacts;
CREATE POLICY "anon_insert_emergency_contacts" ON emergency_contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_emergency_contacts" ON emergency_contacts;
CREATE POLICY "anon_update_emergency_contacts" ON emergency_contacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_emergency_contacts" ON emergency_contacts;
CREATE POLICY "anon_delete_emergency_contacts" ON emergency_contacts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_select_treatment_plans" ON treatment_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_insert_treatment_plans" ON treatment_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_update_treatment_plans" ON treatment_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_delete_treatment_plans" ON treatment_plans FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_model_artifacts" ON model_artifacts;
CREATE POLICY "anon_select_model_artifacts" ON model_artifacts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_model_artifacts" ON model_artifacts;
CREATE POLICY "anon_insert_model_artifacts" ON model_artifacts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_model_artifacts" ON model_artifacts;
CREATE POLICY "anon_update_model_artifacts" ON model_artifacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_model_artifacts" ON model_artifacts;
CREATE POLICY "anon_delete_model_artifacts" ON model_artifacts FOR DELETE TO anon, authenticated USING (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON cardiac_reports TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency_alerts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency_contacts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON treatment_plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON model_artifacts TO anon, authenticated;
GRANT SELECT, UPDATE ON patients TO anon, authenticated;
GRANT SELECT, UPDATE ON health_updates TO anon, authenticated;

-- Storage bucket for medical reports (PDF/JPG/PNG)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', true)
ON CONFLICT (id) DO NOTHING;