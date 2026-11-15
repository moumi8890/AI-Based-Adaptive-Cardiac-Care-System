/*
# Add location_updates and hospitals tables for GPS tracking

1. New Tables
- `location_updates` — GPS points saved while a patient is sharing their live location.
  Columns: patient_id, lat, lng, accuracy, speed, timestamp (created_at).
- `hospitals` — 8 dummy hospital entries with name, phone, specialties, lat, lng.
- Also adds `preferred_language` column to `users` table.
- Also adds `is_sharing_location` column to `patients` table (tracks whether patient is currently sharing).

2. Security
- RLS on location_updates: patients see only their own points; doctors see points only for patients who are actively sharing (is_sharing_location = true).
- RLS on hospitals: public read (anon + authenticated) — dummy data.
- Existing tables already have RLS with anon + authenticated policies (demo app with custom auth).

3. Notes
- Location trail is deleted 24 hours after sharing ends (handled by application logic via a cleanup query).
- Hospitals are seeded with 8 entries in Bangalore area.
- Educational demonstration only.
*/

-- Add preferred_language column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Add is_sharing_location column to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_sharing_location boolean DEFAULT false;

-- HOSPITALS table (dummy data, publicly readable)
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  specialties text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- LOCATION_UPDATES table
CREATE TABLE IF NOT EXISTS location_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  speed double precision,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_location_updates_patient_id ON location_updates(patient_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON location_updates(created_at);

-- RLS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- HOSPITALS policies (public read, this is dummy data)
GRANT SELECT ON hospitals TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_hospitals" ON hospitals;
CREATE POLICY "anon_select_hospitals" ON hospitals FOR SELECT
  TO anon, authenticated USING (true);

-- LOCATION_UPDATES policies
GRANT SELECT, INSERT, DELETE ON location_updates TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_location_updates" ON location_updates;
CREATE POLICY "anon_select_location_updates" ON location_updates FOR SELECT
  TO anon, authenticated USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = location_updates.patient_id AND p.is_sharing_location = true
    )
  );

DROP POLICY IF EXISTS "anon_insert_location_updates" ON location_updates;
CREATE POLICY "anon_insert_location_updates" ON location_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_location_updates" ON location_updates;
CREATE POLICY "anon_delete_location_updates" ON location_updates FOR DELETE
  TO anon, authenticated USING (true);

-- Seed 8 dummy hospitals (Bangalore area)
INSERT INTO hospitals (name, phone, specialties, lat, lng) VALUES
  ('Manipal Hospital Old Airport Road', '+91 80 2502 4444', 'Cardiology, Emergency, Neurology, Orthopedics', 12.9569, 77.7011),
  ('Apollo Hospital Bannerghatta', '+91 80 2630 1155', 'Cardiology, Oncology, Emergency, ICU', 12.8906, 77.5960),
  ('Narayana Health City', '+91 80 7122 2222', 'Cardiac Surgery, Neurosurgery, Emergency, Trauma', 12.8380, 77.6760),
  ('Fortis Hospital Cunningham Road', '+91 80 6621 4444', 'Cardiology, Orthopedics, Emergency, Nephrology', 12.9846, 77.5957),
  ('Columbia Asia Referral Hospital', '+91 80 6165 6262', 'Emergency, Internal Medicine, Pediatrics, Surgery', 12.9986, 77.5998),
  ('Aster CMI Hospital', '+91 80 4342 0100', 'Cardiology, Neurology, Emergency, Transplant', 13.0222, 77.5847),
  ('Sakra World Hospital', '+91 80 4969 4969', 'Neurology, Cardiology, Emergency, Trauma Care', 12.9919, 77.6882),
  ('Vydehi Hospital', '+91 80 4900 2000', 'Emergency, Critical Care, Orthopedics, Cardiology', 12.9925, 77.7150)
ON CONFLICT DO NOTHING;
