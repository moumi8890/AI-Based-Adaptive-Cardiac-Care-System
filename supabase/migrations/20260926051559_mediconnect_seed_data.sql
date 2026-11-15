/*
# MediConnect AI - Seed Demo Data

1. Inserts
- 8 fictional patients (Aarav Sharma, Priya Nair, Rahul Menon, Ananya Rao, Vikram Patel, Meera Joshi, Arjun Kumar, Sneha Reddy)
- 4 demo user accounts: patient1, patient2, patient3 (linked to first 3 patients), doctor
- Multiple health_updates per patient with mixed risk levels (LOW, MODERATE, HIGH)
- 2 doctor_notes for completed reviews

2. Notes
- All data is fictional. Educational demonstration only.
- Passwords stored in plain text for demo simplicity (not for production).
*/

-- Insert patients
INSERT INTO patients (id, name, age, gender, blood_group, phone, email, address, medical_conditions, allergies, current_status)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Aarav Sharma', 54, 'Male', 'O+', '555-0101', 'aarav.sharma@demo.com', '12 MG Road, Bangalore', 'Hypertension, High Cholesterol', 'Penicillin', 'Under Observation'),
  ('a2222222-2222-2222-2222-222222222222', 'Priya Nair', 47, 'Female', 'A+', '555-0102', 'priya.nair@demo.com', '45 Marine Drive, Kochi', 'Asthma', 'Dust, Pollen', 'Stable'),
  ('a3333333-3333-3333-3333-333333333333', 'Rahul Menon', 61, 'Male', 'B+', '555-0103', 'rahul.menon@demo.com', '78 Park Street, Kolkata', 'Type 2 Diabetes, Previous cardiac event', 'None', 'High Priority'),
  ('a4444444-4444-4444-4444-444444444444', 'Ananya Rao', 29, 'Female', 'AB+', '555-0104', 'ananya.rao@demo.com', '23 Banjara Hills, Hyderabad', 'None', 'None', 'Stable'),
  ('a5555555-5555-5555-5555-555555555555', 'Vikram Patel', 58, 'Male', 'O-', '555-0105', 'vikram.patel@demo.com', '67 Satellite Road, Ahmedabad', 'Hypertension, Obesity', 'Sulfa drugs', 'Under Observation'),
  ('a6666666-6666-6666-6666-666666666666', 'Meera Joshi', 35, 'Female', 'A-', '555-0106', 'meera.joshi@demo.com', '34 FC Road, Pune', 'Migraine', 'None', 'Stable'),
  ('a7777777-7777-7777-7777-777777777777', 'Arjun Kumar', 67, 'Male', 'B-', '555-0107', 'arjun.kumar@demo.com', '89 Anna Salai, Chennai', 'Coronary Artery Disease, Hypertension', 'Aspirin', 'High Priority'),
  ('a8888888-8888-8888-8888-888888888888', 'Sneha Reddy', 42, 'Female', 'O+', '555-0108', 'sneha.reddy@demo.com', '56 Jubilee Hills, Hyderabad', 'Hypothyroidism', 'None', 'Stable')
ON CONFLICT (id) DO NOTHING;

-- Insert demo user accounts
INSERT INTO users (id, username, password, role, patient_id)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'patient1', 'patient123', 'patient', 'a1111111-1111-1111-1111-111111111111'),
  ('b2222222-2222-2222-2222-222222222222', 'patient2', 'patient123', 'patient', 'a2222222-2222-2222-2222-222222222222'),
  ('b3333333-3333-3333-3333-333333333333', 'patient3', 'patient123', 'patient', 'a3333333-3333-3333-3333-333333333333'),
  ('b4444444-4444-4444-4444-444444444444', 'doctor', 'doctor123', 'doctor', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert health updates (mixed risk levels)
-- Aarav Sharma (patient1) - MODERATE
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 98.6, 88, 145, 92, 97, 'Mild headache, slight fatigue', 'Okay but tired', '2 days', 'Blood pressure has been slightly elevated at home readings', 'Based on your reported symptoms, rest and monitor your blood pressure regularly. Stay hydrated and avoid stress. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'MODERATE', 'Elevated BP, Age >50, Hypertension history', 'REVIEWED', now() - interval '5 days'),
  ('a1111111-1111-1111-1111-111111111111', 99.1, 92, 150, 95, 96, 'Headache, fatigue, mild dizziness', 'A bit unwell', '1 day', 'Feeling lightheaded when standing up quickly', 'Your symptoms warrant attention. Please rest, stay hydrated, and monitor your blood pressure. Avoid sudden position changes. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'MODERATE', 'Elevated BP, Elevated heart rate, Age >50', 'WAITING FOR DOCTOR', now() - interval '3 hours');

-- Priya Nair (patient2) - LOW
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a2222222-2222-2222-2222-222222222222', 98.4, 74, 118, 78, 99, 'Mild seasonal allergies, occasional sneezing', 'Good', '3 days', 'Pollen season causing mild discomfort', 'Your vitals look within normal ranges. Manage allergies with standard precautions. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'LOW', 'None significant', 'REVIEWED', now() - interval '7 days'),
  ('a2222222-2222-2222-2222-222222222222', 98.6, 78, 120, 80, 98, 'Slight wheezing after morning jog', 'Fine', '1 day', 'Used inhaler as prescribed, felt better after', 'Monitor your breathing and use your prescribed inhaler as directed. If wheezing worsens, contact your doctor. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'LOW', 'Asthma history, mild exertion symptoms', 'WAITING FOR DOCTOR', now() - interval '6 hours');

-- Rahul Menon (patient3) - HIGH
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a3333333-3333-3333-3333-333333333333', 100.4, 105, 160, 100, 94, 'Chest tightness, shortness of breath, sweating', 'Very unwell', '4 hours', 'Feeling pressure in chest, especially when walking. Has history of cardiac event.', 'Your symptoms are concerning. Please seek urgent medical care immediately. Chest tightness with shortness of breath requires immediate evaluation. This is general information, not a diagnosis. Please seek emergency care.', 'HIGH', 'Chest tightness, Low SpO2, High BP, High heart rate, Cardiac history, Age >60', 'WAITING FOR DOCTOR', now() - interval '1 hour'),
  ('a3333333-3333-3333-3333-333333333333', 99.2, 95, 155, 96, 96, 'Fatigue, mild chest discomfort', 'Tired', '2 days', 'Discomfort comes and goes, worse after meals', 'Please monitor your symptoms closely. If chest discomfort worsens, seek medical attention promptly. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'MODERATE', 'High BP, Age >60, Cardiac history', 'REVIEWED', now() - interval '10 days');

-- Ananya Rao - LOW
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a4444444-4444-4444-4444-444444444444', 98.6, 72, 110, 70, 99, 'None', 'Great', 'N/A', 'Routine check-in, feeling healthy', 'Your vitals look good. Continue maintaining a healthy lifestyle. This is general information, not a diagnosis.', 'LOW', 'None significant', 'REVIEWED', now() - interval '4 days');

-- Vikram Patel - MODERATE
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a5555555-5555-5555-5555-555555555555', 99.0, 90, 148, 96, 97, 'Shortness of breath on exertion, ankle swelling', 'Uncomfortable', '5 days', 'Swelling worse in evenings, breathless after climbing one flight of stairs', 'Monitor your breathing and swelling. Elevate legs when resting. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'MODERATE', 'Elevated BP, Exertional dyspnea, Age >50, Obesity', 'WAITING FOR DOCTOR', now() - interval '5 hours'),
  ('a5555555-5555-5555-5555-555555555555', 98.8, 85, 142, 92, 98, 'Mild fatigue', 'Okay', '2 days', 'Feeling better than last week', 'Continue monitoring. Maintain regular activity as tolerated. This is general information, not a diagnosis.', 'LOW', 'Elevated BP, Age >50', 'REVIEWED', now() - interval '12 days');

-- Meera Joshi - LOW
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a6666666-6666-6666-6666-666666666666', 98.4, 76, 115, 75, 99, 'Migraine episode', 'Okay with medication', '6 hours', 'Took prescribed medication, pain reducing', 'Rest in a dark, quiet room. Stay hydrated. If migraine frequency increases, consult your doctor. This is general information, not a diagnosis.', 'LOW', 'Migraine history', 'REVIEWED', now() - interval '2 days');

-- Arjun Kumar - HIGH
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a7777777-7777-7777-7777-777777777777', 100.1, 110, 165, 102, 93, 'Severe chest pain radiating to left arm, sweating, nausea', 'Very unwell', '2 hours', 'Pain started suddenly, rated 8/10. History of CAD.', 'Your symptoms are very concerning. Please seek emergency medical care immediately. Severe chest pain with radiating pain requires urgent evaluation. This is general information — please seek emergency care now.', 'HIGH', 'Severe chest pain, Low SpO2, High BP, High heart rate, CAD history, Age >65', 'WAITING FOR DOCTOR', now() - interval '2 hours'),
  ('a7777777-7777-7777-7777-777777777777', 99.0, 88, 150, 90, 96, 'Mild chest discomfort, fatigue', 'Tired', '1 day', 'Discomfort managed with rest', 'Continue monitoring. If symptoms worsen, seek medical attention. This is general information, not a diagnosis. Please wait for your doctor''s advice.', 'MODERATE', 'High BP, CAD history, Age >65', 'REVIEWED', now() - interval '8 days');

-- Sneha Reddy - LOW
INSERT INTO health_updates (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, symptoms, feeling, duration, notes, ai_guidance, risk_level, risk_factors, status, created_at)
VALUES
  ('a8888888-8888-8888-8888-888888888888', 98.6, 80, 122, 82, 98, 'Mild fatigue, feeling cold', 'Okay', '3 days', 'Thyroid medication dose was adjusted recently', 'Monitor how you feel after the medication adjustment. If fatigue persists, inform your doctor. This is general information, not a diagnosis.', 'LOW', 'Thyroid history, recent medication change', 'WAITING FOR DOCTOR', now() - interval '8 hours');

-- Doctor notes for reviewed updates
INSERT INTO doctor_notes (health_update_id, patient_id, doctor_name, doctor_summary, doctor_recommendation, follow_up_instructions, created_at)
SELECT hu.id, hu.patient_id, 'Dr. Demo', 'Patient''s blood pressure remains mildly elevated. Headache and fatigue are consistent with BP fluctuations. No acute distress noted.', 'Continue current antihypertensive medication. Increase dosage consideration at next visit if BP remains elevated. Lifestyle modifications: reduce salt intake, regular exercise.', 'Monitor BP twice daily for 2 weeks. Report if readings consistently above 150/95. Follow-up appointment in 2 weeks.', now() - interval '4 days'
FROM health_updates hu
WHERE hu.patient_id = 'a1111111-1111-1111-1111-111111111111' AND hu.status = 'REVIEWED'
LIMIT 1;

INSERT INTO doctor_notes (health_update_id, patient_id, doctor_name, doctor_summary, doctor_recommendation, follow_up_instructions, created_at)
SELECT hu.id, hu.patient_id, 'Dr. Demo', 'Seasonal allergy symptoms well controlled. Vitals are within normal limits. No concerns at this time.', 'Continue current allergy medication as needed during pollen season. No changes to treatment plan required.', 'Use allergy medication as directed. Follow up if symptoms worsen or new symptoms develop. Routine check-up in 3 months.', now() - interval '6 days'
FROM health_updates hu
WHERE hu.patient_id = 'a2222222-2222-2222-2222-222222222222' AND hu.status = 'REVIEWED'
LIMIT 1;