import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { doctorAIResponse, type AIContext } from '@/lib/ai-engine';
import { ChatPanel } from '@/components/ChatPanel';
import { PageHeader } from '@/components/Layout';
import { useDoctorData } from '@/lib/hooks';

const SUGGESTED_QUESTIONS = [
  'Which patients need urgent attention?',
  'How many patients are waiting for review?',
];

export function DoctorAIAssistant() {
  const { user } = useAuth();
  const { patients, allUpdates } = useDoctorData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', user.id)
        .is('patient_id', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setSessionId(data.id);
        setMessages(data.messages || []);
      }
    })();
  }, [user]);

  const saveMessages = useCallback(async (newMessages: ChatMessage[]) => {
    if (!user) return;
    if (sessionId) {
      await supabase.from('ai_interactions').update({ messages: newMessages, updated_at: new Date().toISOString() }).eq('id', sessionId);
    } else {
      const { data } = await supabase.from('ai_interactions').insert({
        user_id: user.id,
        patient_id: null,
        role: 'doctor',
        messages: newMessages,
      }).select().maybeSingle();
      if (data) setSessionId(data.id);
    }
  }, [user, sessionId]);

  const handleSend = useCallback((message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const lower = message.toLowerCase();

    let response: string;

    if (lower.includes('urgent') || lower.includes('high priority')) {
      const highRisk = patients.filter(p => {
        const updates = allUpdates.filter(u => u.patient_id === p.id);
        return updates[0]?.risk_level === 'HIGH' && updates[0]?.status === 'WAITING FOR DOCTOR';
      });
      response = `**Patients Needing Urgent Attention (${highRisk.length}):**

${highRisk.length > 0
  ? highRisk.map(p => {
      const u = allUpdates.find(u => u.patient_id === p.id);
      return `• **${p.name}** (${p.age}y, ${p.gender}) — ${u?.symptoms || 'No symptoms'} | Risk: HIGH | Submitted: ${u ? new Date(u.created_at).toLocaleString() : 'N/A'}`;
    }).join('\n')
  : 'No patients currently flagged as high priority and waiting for review.'}

*Educational demonstration only. The doctor must make the final clinical decision.*`;
    } else if (lower.includes('waiting') || lower.includes('pending') || lower.includes('review')) {
      const waiting = allUpdates.filter(u => u.status === 'WAITING FOR DOCTOR');
      response = `**Patients Waiting for Review (${waiting.length}):**

${waiting.length > 0
  ? waiting.map(u => {
      const p = patients.find(p => p.id === u.patient_id);
      return `• **${p?.name || 'Unknown'}** — Risk: ${u.risk_level} | ${u.symptoms || 'No symptoms'} | Submitted: ${new Date(u.created_at).toLocaleString()}`;
    }).join('\n')
  : 'No patients currently waiting for review.'}

*Educational demonstration only. The doctor must make the final clinical decision.*`;
    } else if (lower.includes('summary') || lower.includes('overview') || lower.includes('all')) {
      response = `**Patient Overview (${patients.length} total):**

${patients.map(p => {
  const u = allUpdates.find(u => u.patient_id === p.id);
  return `• **${p.name}** (${p.age}y) — Risk: ${u?.risk_level || 'N/A'} | Status: ${u?.status || 'No updates'} | ${u?.symptoms || 'No symptoms'}`;
}).join('\n')}

*Educational demonstration only. The doctor must make the final clinical decision.*`;
    } else {
      response = `I'm your AI assistant, Doctor. I can help you with:

• **"Which patients need urgent attention?"** — Shows high-priority patients waiting for review
• **"How many patients are waiting?"** — Lists all pending reviews
• **"Give me an overview"** — Summary of all patients

To get detailed analysis of a specific patient, please open that patient's record and use the AI assistant there.

*Educational demonstration only. You make the final clinical decision.*`;
    }

    const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg, aiMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
  }, [messages, patients, allUpdates, saveMessages]);

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="General assistant for the doctor — open a patient for patient-specific AI analysis" />
      <ChatPanel
        title="Doctor AI Assistant"
        subtitle="General queries • Educational demo"
        messages={messages}
        onSend={handleSend}
        placeholder="Ask about your patients..."
        suggestedQuestions={SUGGESTED_QUESTIONS}
      />
    </div>
  );
}
