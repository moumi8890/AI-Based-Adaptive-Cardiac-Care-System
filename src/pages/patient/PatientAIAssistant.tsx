import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, type ChatMessage } from '@/lib/supabase';
import { usePatientData } from '@/lib/hooks';
import { patientAIResponse, type AIContext } from '@/lib/ai-engine';
import { ChatPanel } from '@/components/ChatPanel';
import { PageHeader } from '@/components/Layout';

const SUGGESTED_QUESTIONS = [
  'What should I do for my symptoms?',
  'I have fever and headache',
  'How do I manage my blood pressure?',
  'When should I seek urgent care?',
];

export function PatientAIAssistant() {
  const { user } = useAuth();
  const { patient, updates } = usePatientData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load existing conversation
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', user.id)
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
        patient_id: user.patient_id,
        role: 'patient',
        messages: newMessages,
      }).select().maybeSingle();
      if (data) setSessionId(data.id);
    }
  }, [user, sessionId]);

  const handleSend = useCallback((message: string) => {
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const context: AIContext = { role: 'patient', patient, healthUpdates: updates, latestUpdate: updates[0] || null };
    const response = patientAIResponse(message, context);
    const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg, aiMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
  }, [messages, patient, updates, saveMessages]);

  return (
    <div>
      <PageHeader title="AI Health Assistant" subtitle="Get general guidance about your symptoms — not a medical diagnosis" />
      <ChatPanel
        title="MediConnect AI Assistant"
        subtitle="General health guidance • Educational demo"
        messages={messages}
        onSend={handleSend}
        placeholder="Ask about your symptoms..."
        suggestedQuestions={SUGGESTED_QUESTIONS}
      />
    </div>
  );
}
