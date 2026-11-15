/*
# Step 1: Patient profile fields + follow_ups table

1. Modified Tables (non-destructive additions only)
- `patients`: add `date_of_birth` (date, nullable — age stays the source of truth until
  DOB is filled in), `medical_history` (text, past illnesses/procedures).
  (`family_history`, `previous_cardiac_conditions`, `emergency_notes` already exist.)
- `health_updates`: add `age_group` (text, age group at classification time) and
  `priority_reasons` (text) if missing — reserved for later steps, added now to avoid
  a second schema touch.

2. New Tables
- `follow_ups` — doctor-created follow-up schedule entries for a patient.
  - `patient_id` (uuid, references patients, required)
  - `doctor_name` (text)
  - `title` (text, e.g. "Repeat ECG"), `due_date` (date), `instructions` (text),
    `status` ('PENDING' | 'COMPLETED' | 'CANCELLED', default 'PENDING'),
    `completed_at` (timestamptz), `created_at`

3. Security
- RLS enabled on `follow_ups`. This app uses custom demo auth (users table), not
  Supabase Auth, so — matching every existing table — policies are
  `TO anon, authenticated` with full CRUD; role separation is enforced in the
  application layer exactly as the existing schema does.
- Explicit grants to anon + authenticated.

4. Notes
- No existing columns dropped or altered. Fully idempotent (IF NOT EXISTS / DO blocks).
*/

ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_history text;
ALTER TABLE health_updates ADD COLUMN IF NOT EXISTS age_group text;
ALTER TABLE health_updates ADD COLUMN IF NOT EXISTS priority_reasons text;

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_name text NOT NULL,
  title text NOT NULL,
  due_date date,
  instructions text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_patient ON follow_ups(patient_id);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_follow_ups" ON follow_ups;
CREATE POLICY "anon_select_follow_ups" ON follow_ups FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_follow_ups" ON follow_ups;
CREATE POLICY "anon_insert_follow_ups" ON follow_ups FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_follow_ups" ON follow_ups;
CREATE POLICY "anon_update_follow_ups" ON follow_ups FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_follow_ups" ON follow_ups;
CREATE POLICY "anon_delete_follow_ups" ON follow_ups FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON follow_ups TO anon, authenticated;
GRANT SELECT, UPDATE ON patients TO anon, authenticated;
GRANT SELECT, UPDATE ON health_updates TO anon, authenticated;

-- Backfill DOB from existing age (approximate: birthday on Jan 1 of birth year)
UPDATE patients
SET date_of_birth = make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int - age, 1, 1)
WHERE date_of_birth IS NULL;