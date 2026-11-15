// Demo AI Engine — Predefined safe responses for MediConnect AI
// Educational demonstration only. NOT a medical diagnostic system.
// This module provides conversational AI responses without requiring
// an external API key. It uses rule-based natural language processing
// to understand symptoms and provide general, non-prescriptive guidance.

import type { HealthUpdate, Patient } from '@/lib/supabase';

export type AIRole = 'patient' | 'doctor';

export type AIContext = {
  role: AIRole;
  patient?: Patient | null;
  healthUpdates?: HealthUpdate[];
  latestUpdate?: HealthUpdate | null;
};

const SAFETY_DISCLAIMER = '\n\nThis is general information, not a diagnosis. Please wait for your doctor\'s advice.';

const SEVERE_SYMPTOMS = [
  'chest pain', 'chest pressure', 'chest tightness', 'difficulty breathing',
  'shortness of breath at rest', 'severe bleeding', 'loss of consciousness',
  'fainting', 'confusion', 'slurred speech', 'weakness on one side',
  'severe headache', 'suicidal', 'not breathing', 'blue lips', 'unresponsive',
];

const MODERATE_SYMPTOMS = [
  'fever', 'high fever', 'persistent cough', 'vomiting', 'diarrhea',
  'dizziness', 'palpitations', 'rapid heart', 'high blood pressure',
  'swelling', 'fatigue', 'weakness', 'nausea', 'migraine', 'wheezing',
  'shortness of breath on exertion', 'ankle swelling',
];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function hasSevereSymptoms(symptoms: string): boolean {
  return containsAny(symptoms, SEVERE_SYMPTOMS);
}

function hasModerateSymptoms(symptoms: string): boolean {
  return containsAny(symptoms, MODERATE_SYMPTOMS);
}

// Patient AI — generates guidance based on symptoms
export function generatePatientGuidance(update: {
  symptoms: string;
  feeling: string;
  temperature: number | null;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  oxygenSaturation: number | null;
}): string {
  const symptoms = update.symptoms || '';
  const isSevere = hasSevereSymptoms(symptoms);
  const isModerate = hasModerateSymptoms(symptoms);

  if (isSevere) {
    return `URGENT: Based on what you entered, your symptoms may require immediate medical attention. Please seek urgent medical care or go to the nearest emergency room. Do not wait for a routine doctor's response for symptoms like chest pain, difficulty breathing, or loss of consciousness.${SAFETY_DISCLAIMER}`;
  }

  const advice: string[] = [];
  advice.push('Based on what you entered, here are some general self-care tips:');

  if (containsAny(symptoms, ['fever', 'temperature'])) {
    advice.push('• Rest and stay hydrated with plenty of fluids');
    advice.push('• Monitor your temperature regularly');
    advice.push('• Wear light clothing and keep the room well-ventilated');
  }
  if (containsAny(symptoms, ['headache', 'migraine'])) {
    advice.push('• Rest in a quiet, dark room');
    advice.push('• Stay hydrated and avoid screen time');
    advice.push('• Consider a cold compress on your forehead');
  }
  if (containsAny(symptoms, ['cough', 'cold', 'sore throat', 'sneezing'])) {
    advice.push('• Gargle with warm salt water');
    advice.push('• Drink warm fluids like soup or herbal tea');
    advice.push('• Get adequate rest');
  }
  if (containsAny(symptoms, ['fatigue', 'tired', 'weakness', 'exhaustion'])) {
    advice.push('• Ensure you get 7-8 hours of sleep');
    advice.push('• Eat balanced meals and stay hydrated');
    advice.push('• Avoid strenuous activity until you feel better');
  }
  if (containsAny(symptoms, ['dizziness', 'lightheaded'])) {
    advice.push('• Stand up slowly from sitting or lying positions');
    advice.push('• Stay hydrated and avoid sudden movements');
    advice.push('• Sit or lie down immediately if you feel dizzy');
  }
  if (containsAny(symptoms, ['blood pressure', 'hypertension'])) {
    advice.push('• Monitor your blood pressure regularly');
    advice.push('• Reduce salt intake and manage stress');
    advice.push('• Avoid caffeine and alcohol');
  }
  if (containsAny(symptoms, ['shortness of breath', 'breathing', 'wheezing', 'asthma'])) {
    advice.push('• Sit upright and try to remain calm');
    advice.push('• Use prescribed inhalers as directed');
    advice.push('• Avoid known triggers like dust or pollen');
  }
  if (containsAny(symptoms, ['stomach', 'nausea', 'vomiting', 'diarrhea', 'indigestion'])) {
    advice.push('• Eat small, bland meals (rice, toast, bananas)');
    advice.push('• Drink clear fluids to stay hydrated');
    advice.push('• Avoid spicy or fatty foods');
  }

  if (advice.length === 1) {
    advice.push('• Rest and monitor your symptoms');
    advice.push('• Stay hydrated and maintain a healthy routine');
  }

  if (isModerate) {
    advice.push('\nYour symptoms appear to need attention. Your information will be sent to your doctor for review.');
  } else {
    advice.push('\nYour information will be sent to your doctor for review.');
  }

  advice.push('Continue to monitor your condition and report any changes.');

  return advice.join('\n') + SAFETY_DISCLAIMER;
}

// Patient AI — conversational responses
export function patientAIResponse(message: string, context: AIContext): string {
  const lower = message.toLowerCase();

  if (hasSevereSymptoms(message)) {
    return `URGENT: Based on what you're describing, you should seek immediate medical care. Symptoms like chest pain, difficulty breathing, or loss of consciousness require emergency evaluation. Please go to the nearest emergency room or call emergency services.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('what should i do') || lower.includes('what do you suggest') || lower.includes('advice') || lower.includes('help')) {
    const symptoms = context.latestUpdate?.symptoms || message;
    const guidance = generatePatientGuidance({
      symptoms,
      feeling: context.latestUpdate?.feeling || '',
      temperature: context.latestUpdate?.temperature ?? null,
      heartRate: context.latestUpdate?.heart_rate ?? null,
      bloodPressureSystolic: context.latestUpdate?.blood_pressure_systolic ?? null,
      bloodPressureDiastolic: context.latestUpdate?.blood_pressure_diastolic ?? null,
      oxygenSaturation: context.latestUpdate?.oxygen_saturation ?? null,
    });
    return guidance;
  }

  if (lower.includes('fever') || lower.includes('temperature')) {
    return `For fever, general guidance includes: rest, stay hydrated with plenty of fluids, monitor your temperature regularly, wear light clothing, and use a cold compress if needed. If your fever is very high (above 103°F/39.4°C) or lasts more than 3 days, contact your doctor. Your information will be sent to your doctor for review.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('headache') || lower.includes('head pain') || lower.includes('migraine')) {
    return `For headaches, general guidance includes: rest in a quiet, dark room, stay hydrated, apply a cold compress to your forehead, and avoid screen time. If you experience the worst headache of your life, headache with fever and stiff neck, or headache after a head injury, seek urgent medical care.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('blood pressure') || lower.includes('bp')) {
    return `For blood pressure concerns, general guidance includes: monitor your BP regularly, reduce salt intake, manage stress, maintain a healthy weight, exercise regularly, and limit caffeine and alcohol. If your BP is consistently above 140/90, inform your doctor. Your information will be sent to your doctor for review.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('cough') || lower.includes('cold') || lower.includes('sore throat')) {
    return `For cough and cold symptoms, general guidance includes: gargle with warm salt water, drink warm fluids like soup or herbal tea, get adequate rest, use a humidifier, and stay hydrated. If symptoms persist beyond a week or you develop high fever or difficulty breathing, contact your doctor.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('tired') || lower.includes('fatigue') || lower.includes('weak') || lower.includes('exhausted')) {
    return `For fatigue, general guidance includes: ensure 7-8 hours of sleep, eat balanced meals, stay hydrated, manage stress, and get regular moderate exercise. If fatigue is persistent or accompanied by other symptoms like dizziness or shortness of breath, inform your doctor.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('dizz') || lower.includes('lightheaded') || lower.includes('faint')) {
    return `For dizziness, general guidance includes: stand up slowly, stay hydrated, avoid sudden movements, sit or lie down when feeling dizzy, and check if medications might be causing it. If dizziness is severe, recurrent, or accompanied by chest pain or fainting, seek medical attention.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('stomach') || lower.includes('nausea') || lower.includes('vomit') || lower.includes('diarrhea')) {
    return `For stomach issues, general guidance includes: eat small bland meals (rice, toast, bananas), drink clear fluids to stay hydrated, avoid spicy or fatty foods, and get rest. If symptoms are severe, persistent, or accompanied by high fever or blood in stool, seek medical attention.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('sleep') || lower.includes('insomnia')) {
    return `For sleep issues, general guidance includes: maintain a regular sleep schedule, avoid screens before bedtime, limit caffeine in the afternoon, create a comfortable sleep environment, and try relaxation techniques. If sleep problems persist, discuss with your doctor.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('worried')) {
    return `For stress and anxiety, general guidance includes: practice deep breathing or meditation, get regular exercise, maintain social connections, ensure adequate sleep, and consider talking to someone you trust. If anxiety is overwhelming or affects daily life, please discuss with your doctor.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('thank')) {
    return `You're welcome. Remember to submit your health update so your doctor can review it. If you experience any severe symptoms like chest pain or difficulty breathing, seek emergency care immediately.${SAFETY_DISCLAIMER}`;
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! I'm your AI health assistant. I can provide general guidance based on your symptoms. You can tell me how you're feeling or ask about self-care tips. Remember, I provide general information only — your doctor will make the final assessment. What symptoms are you experiencing today?`;
  }

  if (lower.includes('what can you do') || lower.includes('who are you') || lower.includes('help me')) {
    return `I'm MediConnect AI, your health assistant. I can:
• Provide general self-care guidance based on your symptoms
• Help you understand when to seek urgent care
• Assist you in describing your symptoms before submitting to your doctor

I cannot diagnose diseases, prescribe medication, or replace your doctor's judgment. Please describe your symptoms and I'll do my best to help.${SAFETY_DISCLAIMER}`;
  }

  const symptoms = context.latestUpdate?.symptoms || '';
  if (symptoms) {
    return `I see you've reported: "${symptoms}". Based on this, I recommend rest, hydration, and monitoring your symptoms. Your information will be sent to your doctor for a professional review. You can also ask me about specific symptoms like fever, headache, or blood pressure for more targeted guidance.${SAFETY_DISCLAIMER}`;
  }

  return `I understand you're asking about: "${message}". I can provide general guidance on common symptoms like fever, headache, fatigue, blood pressure, breathing issues, stomach problems, and more. Could you describe your symptoms more specifically? Remember, I provide general information only, not a diagnosis.${SAFETY_DISCLAIMER}`;
}

// Doctor AI — generates patient summary and considerations
export function generateDoctorSummary(patient: Patient, updates: HealthUpdate[]): string {
  const latest = updates[0];
  if (!latest) {
    return `No health updates have been submitted by ${patient.name} yet.`;
  }

  const lines: string[] = [];
  lines.push(`**Patient Summary for ${patient.name} (Age ${patient.age}, ${patient.gender})**\n`);
  lines.push(`**1. Brief Summary:**`);
  lines.push(`${patient.name} is a ${patient.age}-year-old ${patient.gender?.toLowerCase()} with ${patient.medical_conditions || 'no known conditions'}. Latest submission shows ${latest.symptoms || 'no reported symptoms'} with a feeling of "${latest.feeling || 'not specified'}".\n`);

  lines.push(`**2. Reported Symptoms:**`);
  lines.push(`• ${latest.symptoms || 'None reported'}`);
  if (latest.notes) lines.push(`• Additional notes: ${latest.notes}`);
  lines.push('');

  lines.push(`**3. Important Reported Values:**`);
  if (latest.temperature) lines.push(`• Temperature: ${latest.temperature}°F`);
  if (latest.heart_rate) lines.push(`• Heart Rate: ${latest.heart_rate} bpm`);
  if (latest.blood_pressure_systolic && latest.blood_pressure_diastolic) {
    lines.push(`• Blood Pressure: ${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic} mmHg`);
  }
  if (latest.oxygen_saturation) lines.push(`• Oxygen Saturation: ${latest.oxygen_saturation}%`);
  if (latest.duration) lines.push(`• Duration: ${latest.duration}`);
  lines.push('');

  lines.push(`**4. Changes from Previous Updates:**`);
  if (updates.length > 1) {
    const prev = updates[1];
    if (prev) {
      const tempChange = (latest.temperature && prev.temperature) ? (latest.temperature - prev.temperature).toFixed(1) : 'N/A';
      const hrChange = (latest.heart_rate && prev.heart_rate) ? (latest.heart_rate - prev.heart_rate) : 'N/A';
      const bpChange = (latest.blood_pressure_systolic && prev.blood_pressure_systolic) ? (latest.blood_pressure_systolic - prev.blood_pressure_systolic) : 'N/A';
      lines.push(`• Previous symptoms: ${prev.symptoms || 'None'}`);
      lines.push(`• Temperature change: ${tempChange}°F`);
      lines.push(`• Heart rate change: ${hrChange} bpm`);
      lines.push(`• Systolic BP change: ${bpChange} mmHg`);
      lines.push(`• Previous risk level: ${prev.risk_level}`);
    }
  } else {
    lines.push('• This is the first health update — no previous data for comparison.');
  }
  lines.push('');

  lines.push(`**5. Possible Considerations:**`);
  if (latest.risk_level === 'HIGH') {
    lines.push('• Symptoms suggest potentially urgent findings requiring prompt evaluation');
    lines.push('• Consider immediate clinical assessment');
    lines.push('• Review vital sign trends carefully');
  } else if (latest.risk_level === 'MODERATE') {
    lines.push('• Monitor for progression of symptoms');
    lines.push('• Consider follow-up within a reasonable timeframe');
    lines.push('• Review medication adherence and lifestyle factors');
  } else {
    lines.push('• Symptoms appear mild and within manageable range');
    lines.push('• Routine follow-up recommended');
    lines.push('• Continue current management plan if applicable');
  }
  lines.push('');

  lines.push(`**6. Suggested Questions for the Doctor to Ask:**`);
  lines.push(`• When did the symptoms start exactly and have they worsened?`);
  lines.push(`• Are there any new triggers or lifestyle changes?`);
  lines.push(`• Are current medications being taken as prescribed?`);
  lines.push(`• Has there been any response to self-care measures?`);
  lines.push(`• Are there any family history factors to consider?`);
  lines.push('');

  lines.push(`**7. Warning Signs That May Deserve Attention:**`);
  if (latest.blood_pressure_systolic && latest.blood_pressure_systolic > 160) {
    lines.push('• Severely elevated blood pressure');
  }
  if (latest.heart_rate && latest.heart_rate > 100) {
    lines.push('• Elevated heart rate (tachycardia)');
  }
  if (latest.oxygen_saturation && latest.oxygen_saturation < 95) {
    lines.push('• Low oxygen saturation');
  }
  if (latest.temperature && latest.temperature > 100.4) {
    lines.push('• Elevated temperature (fever)');
  }
  const symptomsLower = (latest.symptoms || '').toLowerCase();
  if (containsAny(symptomsLower, SEVERE_SYMPTOMS)) {
    lines.push('• Reported severe symptoms requiring urgent evaluation');
  }
  if (patient.medical_conditions && patient.medical_conditions.toLowerCase().includes('cardiac')) {
    lines.push('• Patient has cardiac history — exercise extra caution');
  }
  lines.push('');

  lines.push(`**Three Possible Consideration Options:**\n`);
  lines.push(`**Option 1: Continue Monitoring and Reassess**`);
  lines.push(`Schedule a follow-up within a reasonable timeframe. Continue current treatment plan and ask the patient to monitor and report any changes.\n`);
  lines.push(`**Option 2: Request Additional Information / Vitals**`);
  lines.push(`Ask the patient for additional details or repeated vital sign measurements to better understand the trend before making changes.\n`);
  lines.push(`**Option 3: Consider Escalation / Urgent Evaluation**`);
  lines.push(`If concerning symptoms are present or worsening, consider referring for urgent evaluation, additional testing, or specialist consultation.\n`);

  lines.push(`*Note: This AI-generated summary is for educational demonstration only. The doctor must make the final clinical decision.*`);

  return lines.join('\n');
}

// Doctor AI — conversational responses about a specific patient
export function doctorAIResponse(message: string, context: AIContext): string {
  const lower = message.toLowerCase();
  const patient = context.patient;
  const updates = context.healthUpdates || [];

  if (!patient) {
    return 'Please select a patient first so I can provide relevant information.';
  }

  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('overview')) {
    return generateDoctorSummary(patient, updates);
  }

  if (lower.includes('latest') || lower.includes('current') || lower.includes('recent')) {
    const latest = updates[0];
    if (!latest) return `${patient.name} has no health updates yet.`;
    return `**Latest Update for ${patient.name}:**
• Symptoms: ${latest.symptoms || 'None'}
• Feeling: ${latest.feeling || 'Not specified'}
• Temperature: ${latest.temperature || 'N/A'}°F
• Heart Rate: ${latest.heart_rate || 'N/A'} bpm
• BP: ${latest.blood_pressure_systolic || 'N/A'}/${latest.blood_pressure_diastolic || 'N/A'} mmHg
• SpO2: ${latest.oxygen_saturation || 'N/A'}%
• Risk Level: ${latest.risk_level}
• Status: ${latest.status}
• Submitted: ${new Date(latest.created_at).toLocaleString()}

*This is educational demonstration data, not clinical advice. The doctor must make the final decision.*`;
  }

  if (lower.includes('vital') || lower.includes('blood pressure') || lower.includes('heart rate') || lower.includes('temperature')) {
    const latest = updates[0];
    if (!latest) return `No vital data available for ${patient.name}.`;
    return `**Vital Signs for ${patient.name} (Latest):**
• Temperature: ${latest.temperature || 'N/A'}°F
• Heart Rate: ${latest.heart_rate || 'N/A'} bpm
• Blood Pressure: ${latest.blood_pressure_systolic || 'N/A'}/${latest.blood_pressure_diastolic || 'N/A'} mmHg
• Oxygen Saturation: ${latest.oxygen_saturation || 'N/A'}%

${latest.blood_pressure_systolic && latest.blood_pressure_systolic > 140 ? 'Blood pressure appears elevated. ' : ''}${latest.heart_rate && latest.heart_rate > 100 ? 'Heart rate appears elevated. ' : ''}${latest.oxygen_saturation && latest.oxygen_saturation < 95 ? 'Oxygen saturation is below normal range. ' : ''}

*Educational demonstration only. The doctor must make the final clinical assessment.*`;
  }

  if (lower.includes('history') || lower.includes('previous') || lower.includes('past') || lower.includes('timeline')) {
    if (updates.length === 0) return `${patient.name} has no health update history.`;
    const lines = [`**Health Update History for ${patient.name} (${updates.length} submissions):**\n`];
    updates.forEach((u, i) => {
      lines.push(`**Update ${i + 1} — ${new Date(u.created_at).toLocaleDateString()}**`);
      lines.push(`• Symptoms: ${u.symptoms || 'None'}`);
      lines.push(`• Risk: ${u.risk_level} | Status: ${u.status}`);
      lines.push(`• Vitals: T=${u.temperature || 'N/A'}°F, HR=${u.heart_rate || 'N/A'}, BP=${u.blood_pressure_systolic || 'N/A'}/${u.blood_pressure_diastolic || 'N/A'}, SpO2=${u.oxygen_saturation || 'N/A'}%\n`);
    });
    lines.push('*Educational demonstration only. The doctor must make the final clinical decision.*');
    return lines.join('\n');
  }

  if (lower.includes('risk') || lower.includes('priority')) {
    const latest = updates[0];
    if (!latest) return `No risk data available for ${patient.name}.`;
    return `**Risk Assessment for ${patient.name}:**
• Current Risk Level: ${latest.risk_level}
• Risk Factors: ${latest.risk_factors || 'None identified'}
• ML Demonstration Risk: ${latest.risk_level}

The risk classification is produced by a logistic regression model trained on the UCI Heart Disease dataset for educational demonstration. It is NOT a medical diagnosis.

*The doctor must make the final clinical judgment.*`;
  }

  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('what should') || lower.includes('option')) {
    const latest = updates[0];
    const risk = latest?.risk_level || 'LOW';
    return `**Suggested Considerations for ${patient.name}:**

Given the ${risk} risk classification, here are three options:

**Option 1: Continue Monitoring and Reassess**
Schedule a follow-up and ask the patient to continue monitoring symptoms. Suitable for stable or low-risk cases.

**Option 2: Request Additional Information / Vitals**
Ask the patient for more detailed symptom descriptions or repeat vital measurements to establish trends before making changes.

**Option 3: Consider Escalation / Urgent Evaluation**
${risk === 'HIGH' ? 'Recommended given the HIGH risk classification — consider urgent evaluation, additional testing, or specialist referral.' : 'Consider if symptoms worsen or new concerning symptoms develop — refer for additional evaluation.'}

*These are AI-generated suggestions for educational demonstration. The doctor must choose what to do.*`;
  }

  if (lower.includes('condition') || lower.includes('medical history') || lower.includes('background')) {
    return `**Medical Background for ${patient.name}:**
• Age: ${patient.age}
• Gender: ${patient.gender || 'N/A'}
• Blood Group: ${patient.blood_group || 'N/A'}
• Known Conditions: ${patient.medical_conditions || 'None'}
• Allergies: ${patient.allergies || 'None'}
• Current Status: ${patient.current_status || 'Stable'}

*Educational demonstration data. The doctor must verify and make clinical decisions.*`;
  }

  if (lower.includes('warning') || lower.includes('concern') || lower.includes('red flag')) {
    const latest = updates[0];
    if (!latest) return `No data to assess warning signs for ${patient.name}.`;
    const warnings: string[] = [];
    if (latest.blood_pressure_systolic && latest.blood_pressure_systolic > 160) warnings.push('Severely elevated blood pressure');
    if (latest.heart_rate && latest.heart_rate > 100) warnings.push('Elevated heart rate');
    if (latest.oxygen_saturation && latest.oxygen_saturation < 95) warnings.push('Low oxygen saturation');
    if (latest.temperature && latest.temperature > 100.4) warnings.push('Fever');
    if (containsAny(latest.symptoms || '', SEVERE_SYMPTOMS)) warnings.push('Severe reported symptoms');
    if (patient.medical_conditions && patient.medical_conditions.toLowerCase().includes('cardiac')) warnings.push('Cardiac history');
    return `**Warning Signs for ${patient.name}:**
${warnings.length > 0 ? warnings.map(w => `• ${w}`).join('\n') : '• No significant warning signs identified in the latest update.'}

*Educational demonstration only. The doctor must make the final clinical assessment.*`;
  }

  if (lower.includes('compare') || lower.includes('trend') || lower.includes('change')) {
    if (updates.length < 2) return `${patient.name} has only ${updates.length} update(s) — not enough data for trend comparison.`;
    const lines = [`**Trend Comparison for ${patient.name}:**\n`];
    for (let i = 0; i < Math.min(updates.length, 3); i++) {
      const u = updates[i];
      lines.push(`**Update ${i + 1} (${new Date(u.created_at).toLocaleDateString()}):**`);
      lines.push(`• T=${u.temperature || 'N/A'}°F, HR=${u.heart_rate || 'N/A'}, BP=${u.blood_pressure_systolic || 'N/A'}/${u.blood_pressure_diastolic || 'N/A'}, SpO2=${u.oxygen_saturation || 'N/A'}%`);
      lines.push(`• Risk: ${u.risk_level} | Symptoms: ${u.symptoms || 'None'}\n`);
    }
    lines.push('*Educational demonstration only. The doctor must interpret trends clinically.*');
    return lines.join('\n');
  }

  if (lower.includes('thank')) {
    return `You're welcome, Doctor. Remember that all AI-generated content is for educational demonstration and must not replace your clinical judgment.`;
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello, Doctor. I'm your AI assistant for ${patient.name}. I can:
• Summarize the patient's latest issue
• Show vital signs and trends
• Provide possible considerations and options
• Highlight warning signs
• Compare previous updates

I only use information actually entered in the application — I will not invent patient data. What would you like to know about ${patient.name}?

*Educational demonstration only. You make the final clinical decision.*`;
  }

  return `I can help you with ${patient.name}'s information. You can ask me to:
• "Summarize this patient's latest issue"
• "Show me their vitals"
• "What are the warning signs?"
• "Compare previous updates"
• "What do you recommend?"

I only use information actually entered in the application. What would you like to know?

*Educational demonstration only. You make the final clinical decision.*`;
}
