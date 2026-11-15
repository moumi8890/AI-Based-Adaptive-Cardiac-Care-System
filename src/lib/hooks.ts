import { useState, useEffect, useCallback } from 'react';
import { supabase, type Patient, type HealthUpdate, type DoctorNote, type CardiacReport, type TreatmentPlan, type FollowUp } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function usePatientData() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [updates, setUpdates] = useState<HealthUpdate[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user?.patient_id) {
      setLoading(false);
      return;
    }
    const [patientRes, updatesRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', user.patient_id).maybeSingle(),
      supabase.from('health_updates').select('*').eq('patient_id', user.patient_id).order('created_at', { ascending: false }),
    ]);

    if (patientRes.data) setPatient(patientRes.data);
    if (updatesRes.data) setUpdates(updatesRes.data);

    if (updatesRes.data && updatesRes.data.length > 0) {
      const updateIds = updatesRes.data.map(u => u.id);
      const { data: notes } = await supabase
        .from('doctor_notes')
        .select('*')
        .in('health_update_id', updateIds)
        .order('created_at', { ascending: false });
      if (notes) setDoctorNotes(notes);
    }

    setLoading(false);
  }, [user?.patient_id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { patient, updates, doctorNotes, loading, refetch: fetchAll };
}

export function useDoctorData() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allUpdates, setAllUpdates] = useState<HealthUpdate[]>([]);
  const [allDoctorNotes, setAllDoctorNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [patientsRes, updatesRes, notesRes] = await Promise.all([
      supabase.from('patients').select('*').order('name'),
      supabase.from('health_updates').select('*').order('created_at', { ascending: false }),
      supabase.from('doctor_notes').select('*').order('created_at', { ascending: false }),
    ]);

    if (patientsRes.data) setPatients(patientsRes.data);
    if (updatesRes.data) setAllUpdates(updatesRes.data);
    if (notesRes.data) setAllDoctorNotes(notesRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { patients, allUpdates, allDoctorNotes, loading, refetch: fetchAll };
}

export function getLatestUpdateForPatient(patientId: string, updates: HealthUpdate[]): HealthUpdate | null {
  return updates.find(u => u.patient_id === patientId) || null;
}

export function getUpdatesForPatient(patientId: string, updates: HealthUpdate[]): HealthUpdate[] {
  return updates.filter(u => u.patient_id === patientId);
}

export function getDoctorNoteForUpdate(updateId: string, notes: DoctorNote[]): DoctorNote | null {
  return notes.find(n => n.health_update_id === updateId) || null;
}

export function useCardiacReports(patientId: string | null | undefined) {
  const [reports, setReports] = useState<CardiacReport[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!patientId) {
      setReports([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('cardiac_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { reports, loading, refetch };
}

export function useTreatmentPlans(patientId: string | null | undefined, approvedOnly = false) {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!patientId) {
      setPlans([]);
      setFollowUps([]);
      setLoading(false);
      return;
    }
    let query = supabase
      .from('treatment_plans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (approvedOnly) query = query.eq('status', 'APPROVED');
    const [{ data: planData }, { data: fuData }] = await Promise.all([
      query,
      supabase
        .from('follow_ups')
        .select('*')
        .eq('patient_id', patientId)
        .order('due_date', { ascending: true }),
    ]);
    setPlans(planData || []);
    setFollowUps(fuData || []);
    setLoading(false);
  }, [patientId, approvedOnly]);

  useEffect(() => { refetch(); }, [refetch]);

  return { plans, followUps, loading, refetch };
}
