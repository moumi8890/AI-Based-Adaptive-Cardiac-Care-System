// Age-specific vital-sign reference ranges — academic research prototype.
// NOT clinically validated. Do NOT use for real diagnosis or treatment.
//
// Adult thresholds are NEVER applied to children: every lookup goes through
// the patient's age group, and ranges marked "pediatric" use pediatric tables.

export type AgeGroupId = 'CHILDREN' | 'TEENAGERS' | 'YOUNG_ADULTS' | 'MIDDLE_AGED' | 'OLDER_ADULTS';

export type AgeGroupInfo = {
  id: AgeGroupId;
  label: string;
  shortLabel: string;
  range: string;
};

const AGE_GROUPS: Array<{ id: AgeGroupId; maxAge: number; info: AgeGroupInfo }> = [
  { id: 'CHILDREN', maxAge: 12, info: { id: 'CHILDREN', label: 'Children', shortLabel: 'Child', range: '0–12 yrs' } },
  { id: 'TEENAGERS', maxAge: 17, info: { id: 'TEENAGERS', label: 'Teenagers', shortLabel: 'Teen', range: '13–17 yrs' } },
  { id: 'YOUNG_ADULTS', maxAge: 39, info: { id: 'YOUNG_ADULTS', label: 'Young Adults', shortLabel: 'Young Adult', range: '18–39 yrs' } },
  { id: 'MIDDLE_AGED', maxAge: 59, info: { id: 'MIDDLE_AGED', label: 'Middle-Aged Adults', shortLabel: 'Middle-Aged', range: '40–59 yrs' } },
  { id: 'OLDER_ADULTS', maxAge: Infinity, info: { id: 'OLDER_ADULTS', label: 'Older Adults', shortLabel: 'Older Adult', range: '60+ yrs' } },
];

/** Age group from date of birth; falls back to the recorded age when DOB is absent. */
export function getAgeGroupFromDob(dob: string | null | undefined, fallbackAge: number): AgeGroupInfo {
  if (dob) {
    const birth = new Date(dob);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const beforeBirthday =
        now.getMonth() < birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
      if (beforeBirthday) age -= 1;
      if (age >= 0) return groupForAge(age);
    }
  }
  return groupForAge(fallbackAge);
}

export function groupForAge(age: number): AgeGroupInfo {
  return (AGE_GROUPS.find(g => age <= g.maxAge) || AGE_GROUPS[AGE_GROUPS.length - 1]).info;
}

export const ALL_AGE_GROUPS: AgeGroupInfo[] = AGE_GROUPS.map(g => g.info);

export function ageGroupById(id: string): AgeGroupInfo | null {
  return ALL_AGE_GROUPS.find(g => g.id === id) || null;
}

export type VitalKey = 'heart_rate' | 'bp_systolic' | 'bp_diastolic' | 'spo2';

export type ReferenceRange = {
  low: number;
  high: number;
  /** Lower bound of the "borderline" band (value >= borderlineLow but < low, or > high but <= borderlineHigh is borderline). */
  borderlineLow: number;
  /** Upper bound of the "borderline" band above the normal high. */
  borderlineHigh: number;
  unit: string;
  source: string;
};

// ---- Sources ----
// Pediatric HR/BP: AAP pediatric vital-sign reference tables and PALS (Pediatric
// Advanced Life Support, AHA) normal ranges for school-age children (6–12 yr,
// HR 70–110, SBP roughly 97–115 percentile band) and adolescents (13–17 yr).
// Adult HR: standard resting heart rate 60–100 bpm (AHA).
// Adult BP: AHA/ACC 2017 categories — normal <120/<80; elevated 120–129 systolic;
// stage 1 hypertension 130–139 or 80–89; stage 2 >=140 or >=90.
// Older adults: many guidelines retain <140/<90 as an acceptable treatment target
// with relaxed lower limits; ranges below reflect that common practice.
// SpO2: healthy >=95%; 90–94% borderline; <90% hypoxemia. Older adults and young
// children are commonly allowed >=93–94% before concern.

const RANGES: Record<AgeGroupId, Record<VitalKey, ReferenceRange>> = {
  CHILDREN: {
    // PALS/AAP school-age (6–12 yr): resting HR 70–110 bpm; bradycardia concern <60.
    heart_rate: { low: 70, high: 110, borderlineLow: 60, borderlineHigh: 120, unit: 'bpm', source: 'AAP/PALS pediatric vital signs (school age 6–12 yr)' },
    // AAP school-age: SBP ~97–112 mmHg (50th–95th percentile band); >115 elevated.
    bp_systolic: { low: 97, high: 112, borderlineLow: 90, borderlineHigh: 119, unit: 'mmHg', source: 'AAP pediatric BP percentiles (school age)' },
    // AAP school-age: DBP ~55–70 mmHg.
    bp_diastolic: { low: 55, high: 70, borderlineLow: 50, borderlineHigh: 75, unit: 'mmHg', source: 'AAP pediatric BP percentiles (school age)' },
    // Healthy children >=94%; <94% evaluate, <90% hypoxemia.
    spo2: { low: 94, high: 100, borderlineLow: 90, borderlineHigh: 100, unit: '%', source: 'AAP/pediatric pulse-oximetry thresholds' },
  },
  TEENAGERS: {
    // PALS adolescent (13–17 yr): resting HR 60–105 bpm.
    heart_rate: { low: 60, high: 105, borderlineLow: 55, borderlineHigh: 115, unit: 'bpm', source: 'PALS adolescent vital signs (13–17 yr)' },
    // AAP adolescent: SBP <120 normal; 120–129 elevated; >=130 hypertensive.
    bp_systolic: { low: 110, high: 120, borderlineLow: 100, borderlineHigh: 129, unit: 'mmHg', source: 'AAP adolescent BP percentiles' },
    // AAP adolescent: DBP <80 normal; 80–85 borderline.
    bp_diastolic: { low: 65, high: 80, borderlineLow: 60, borderlineHigh: 85, unit: 'mmHg', source: 'AAP adolescent BP percentiles' },
    // Healthy adolescents >=95%.
    spo2: { low: 95, high: 100, borderlineLow: 90, borderlineHigh: 100, unit: '%', source: 'Pediatric pulse-oximetry thresholds' },
  },
  YOUNG_ADULTS: {
    // AHA: normal adult resting HR 60–100 bpm.
    heart_rate: { low: 60, high: 100, borderlineLow: 55, borderlineHigh: 105, unit: 'bpm', source: 'AHA resting heart rate (adults)' },
    // AHA/ACC 2017: normal <120/<80; 120–129 elevated; 130–139 stage 1 HTN.
    bp_systolic: { low: 90, high: 120, borderlineLow: 85, borderlineHigh: 129, unit: 'mmHg', source: 'AHA/ACC 2017 BP categories (adults)' },
    bp_diastolic: { low: 60, high: 80, borderlineLow: 55, borderlineHigh: 84, unit: 'mmHg', source: 'AHA/ACC 2017 BP categories (adults)' },
    spo2: { low: 95, high: 100, borderlineLow: 90, borderlineHigh: 100, unit: '%', source: 'Adult pulse-oximetry thresholds' },
  },
  MIDDLE_AGED: {
    heart_rate: { low: 60, high: 100, borderlineLow: 55, borderlineHigh: 105, unit: 'bpm', source: 'AHA resting heart rate (adults)' },
    // Middle-aged adults: 130–139 treated as stage 1 hypertension but flagged borderline here.
    bp_systolic: { low: 90, high: 130, borderlineLow: 85, borderlineHigh: 139, unit: 'mmHg', source: 'AHA/ACC 2017 BP categories (adults)' },
    bp_diastolic: { low: 60, high: 85, borderlineLow: 55, borderlineHigh: 89, unit: 'mmHg', source: 'AHA/ACC 2017 BP categories (adults)' },
    spo2: { low: 95, high: 100, borderlineLow: 90, borderlineHigh: 100, unit: '%', source: 'Adult pulse-oximetry thresholds' },
  },
  OLDER_ADULTS: {
    // Older adults: resting HR 55–95 commonly tolerated; bradycardia concern <50–55.
    heart_rate: { low: 55, high: 95, borderlineLow: 50, borderlineHigh: 100, unit: 'bpm', source: 'Geriatric HR reference (relaxed adult range)' },
    // Many geriatric guidelines accept SBP up to 140 as a treatment target.
    bp_systolic: { low: 90, high: 140, borderlineLow: 85, borderlineHigh: 149, unit: 'mmHg', source: 'Geriatric BP targets (<140/<90 commonly accepted)' },
    bp_diastolic: { low: 60, high: 90, borderlineLow: 55, borderlineHigh: 94, unit: 'mmHg', source: 'Geriatric BP targets' },
    // Older adults: >=93% commonly accepted before concern.
    spo2: { low: 93, high: 100, borderlineLow: 90, borderlineHigh: 100, unit: '%', source: 'Geriatric pulse-oximetry thresholds' },
  },
};

export type VitalStatus = 'normal' | 'borderline' | 'abnormal' | 'missing';

export type VitalAssessment = {
  status: VitalStatus;
  label: string;
  range: ReferenceRange;
  /** "low" / "high" direction when abnormal or borderline; null when normal/missing. */
  direction: 'low' | 'high' | null;
};

export function assessVital(group: AgeGroupId, vital: VitalKey, value: number | null | undefined): VitalAssessment {
  const range = RANGES[group][vital];
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { status: 'missing', label: 'Not recorded', range, direction: null };
  }
  if (value >= range.low && value <= range.high) {
    return { status: 'normal', label: 'Normal', range, direction: null };
  }
  const belowNormal = value < range.low;
  const withinBorderline = belowNormal ? value >= range.borderlineLow : value <= range.borderlineHigh;
  if (withinBorderline) {
    return { status: 'borderline', label: `Borderline (${belowNormal ? 'low' : 'high'})`, range, direction: belowNormal ? 'low' : 'high' };
  }
  return { status: 'abnormal', label: `Abnormal (${belowNormal ? 'low' : 'high'})`, range, direction: belowNormal ? 'low' : 'high' };
}

export function getReferenceRange(group: AgeGroupId, vital: VitalKey): ReferenceRange {
  return RANGES[group][vital];
}
