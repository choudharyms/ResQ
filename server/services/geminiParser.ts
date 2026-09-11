import { GoogleGenAI, Type, Schema } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

// ── Response Types ────────────────────────────────────────────────────────────

export type NeedCategory =
  | 'Medical_Emergency'
  | 'Water_Evacuation'
  | 'Structural_Extrication'
  | 'Food_Water_Supply'
  | 'Power_Medical_Equipment'
  | 'Hazmat_Fire'
  | 'Animal_Livestock'
  | 'Recon_Welfare_Check'
  | 'Other';

export type TriageTier =
  | 'T1_Immediate'
  | 'T2_Delayed'
  | 'T3_Minimal'
  | 'T4_Expectant'
  | 'Unclassified';

export interface GeminiSosExtraction {
  primary_need:              NeedCategory;
  primary_need_detail?:      string;      // Required if primary_need === 'Other'
  secondary_needs:           string[];
  required_capability_tags:  string[];    // e.g. ['water_rescue','evac']
  ai_triage_tier:            TriageTier;
  priority_score:            number;      // 0.10 → 1.00
  ai_confidence:             number;      // 0.00 → 1.00 (model self-assessment)
  people_count:              number;
  vulnerable_infants:        number;
  vulnerable_elderly:        number;
  vulnerable_critical_ill:   number;
  urgency_indicators:        string[];
  ai_rationale:              string;      // 1-sentence commander briefing
}

// ── Fallback returned on all Gemini failures ──────────────────────────────────
// We never block incident creation. A failed extraction becomes Unclassified
// and is routed to the commander for manual triage.
const EXTRACTION_FALLBACK: GeminiSosExtraction = {
  primary_need:             'Other',
  primary_need_detail:      'AI extraction failed — manual triage required',
  secondary_needs:          [],
  required_capability_tags: [],
  ai_triage_tier:           'Unclassified',
  priority_score:           0.5,
  ai_confidence:            0.0,
  people_count:             1,
  vulnerable_infants:       0,
  vulnerable_elderly:       0,
  vulnerable_critical_ill:  0,
  urgency_indicators:       [],
  ai_rationale:             'Extraction failed. Commander manual triage required.',
};

// ── Response Schema ───────────────────────────────────────────────────────────
const sosSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    primary_need: {
      type: Type.STRING,
      enum: [
        'Medical_Emergency', 'Water_Evacuation', 'Structural_Extrication',
        'Food_Water_Supply', 'Power_Medical_Equipment', 'Hazmat_Fire',
        'Animal_Livestock', 'Recon_Welfare_Check', 'Other',
      ],
      description: "Primary emergency category. Use 'Other' for unlisted types and populate primary_need_detail.",
    },
    primary_need_detail: {
      type: Type.STRING,
      description: "Required when primary_need is 'Other'. Describe the specific need precisely.",
    },
    secondary_needs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Additional needs beyond the primary. e.g. ["food supply needed", "translation required"]',
    },
    required_capability_tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: [
        'Asset capability tags this incident requires. Choose from:',
        'water_rescue, evac, medical_als, medical_bls, triage, thermal_camera,',
        'recon, search_rescue, structural, supply_drop, floodwater_capable,',
        'shallow_water, road_capable.',
        'Only include tags that are actually needed.',
      ].join(' '),
    },
    ai_triage_tier: {
      type: Type.STRING,
      enum: ['T1_Immediate', 'T2_Delayed', 'T3_Minimal', 'T4_Expectant', 'Unclassified'],
      description: [
        'INSARAG triage classification:',
        'T1_Immediate = imminent loss of life within 1-2 hours (bleeding, drowning, cardiac, trapped in rising water);',
        'T2_Delayed   = serious but stable for 2-6 hours;',
        'T3_Minimal   = walking wounded, basic supply needs;',
        'T4_Expectant = unsurvivable or deceased;',
        'Unclassified = insufficient information.',
      ].join(' '),
    },
    priority_score: {
      type: Type.NUMBER,
      description: 'Urgency scalar 0.10 (low-risk, stable) to 1.00 (critical, imminent death). T1 must be > 0.80.',
    },
    ai_confidence: {
      type: Type.NUMBER,
      description: 'Your confidence in this extraction: 0.00 (complete guess) to 1.00 (high certainty). Be honest — low confidence triggers manual commander review.',
    },
    people_count: {
      type: Type.INTEGER,
      description: 'Total number of people involved. Minimum 1. Estimate if not explicitly stated.',
    },
    vulnerable_infants: {
      type: Type.INTEGER,
      description: 'Number of infants or children under 5.',
    },
    vulnerable_elderly: {
      type: Type.INTEGER,
      description: 'Number of elderly persons (60+).',
    },
    vulnerable_critical_ill: {
      type: Type.INTEGER,
      description: 'Number with critical medical conditions (cardiac, dialysis-dependent, oxygen-dependent, severe trauma).',
    },
    urgency_indicators: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key phrases from the message confirming distress severity. e.g. ["water at chest level", "no pulse", "trapped under slab"]',
    },
    ai_rationale: {
      type: Type.STRING,
      description: 'Concise 1-sentence tactical summary for the incident commander. Include triage tier, key risk, and time sensitivity.',
    },
  },
  required: [
    'primary_need',
    'secondary_needs',
    'required_capability_tags',
    'ai_triage_tier',
    'priority_score',
    'ai_confidence',
    'people_count',
    'vulnerable_infants',
    'vulnerable_elderly',
    'vulnerable_critical_ill',
    'urgency_indicators',
    'ai_rationale',
  ],
};

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert Search and Rescue (SAR) emergency dispatch AI embedded in a real-time disaster management system.

Your job is to analyze urgent distress messages — which may be in Hindi, English, Hinglish, or broken/panicked text — and extract structured operational data for incident commanders.

TRIAGE RULES (be rigorous):
- Rising/entered water + vulnerable person (child, elderly, cardiac, diabetic) → T1_Immediate, priority > 0.88
- Confirmed submersion / drowning / chest pain / arterial bleeding → T1_Immediate, priority > 0.92  
- Structural collapse with confirmed live trapped victims → T1_Immediate, priority > 0.90
- Critical medical device (dialysis, oxygen concentrator) losing power → T1_Immediate, priority > 0.88
- Adults on rooftop, stable, no medical crisis, supplies available → T2_Delayed, priority 0.55–0.75
- Walking wounded, basic supply distribution → T3_Minimal, priority 0.20–0.45
- Voluntary relocation, no urgency stated → T3_Minimal, priority 0.15–0.35
- Insufficient information → Unclassified, ai_confidence < 0.60

CAPABILITY TAG RULES:
- Water incident (boat/raft needed) → include 'water_rescue'
- People need to be moved → include 'evac'
- Medical emergency (ALS needed) → include 'medical_als'
- Structural collapse → include 'search_rescue', 'structural'
- Supply/food drop → include 'supply_drop'
- Welfare check / verify status → include 'recon'
- Need to visually confirm from air → include 'recon', 'thermal_camera'

HONESTY: Set ai_confidence honestly. If the message is ambiguous, set it low. Commanders will manually triage low-confidence incidents.`;

// ── Main extraction function ───────────────────────────────────────────────────
// Retries up to 3 times with exponential backoff.
// Falls back to EXTRACTION_FALLBACK on all failures — never blocks incident creation.
export async function extractSosIntent(rawText: string): Promise<GeminiSosExtraction> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nDistress Message:\n"${rawText}"` }] },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema:   sosSchema,
          temperature:      0.1,  // Near-zero: deterministic, reproducible extractions
        },
      });

      const raw = response.text;
      if (!raw) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(raw) as GeminiSosExtraction;

      // Enforce: 'Other' must always have a detail
      if (parsed.primary_need === 'Other' && !parsed.primary_need_detail) {
        parsed.primary_need_detail = 'Unspecified non-standard emergency';
      }

      // Clamp numeric fields to valid ranges
      parsed.priority_score  = Math.min(1.0, Math.max(0.1,  parsed.priority_score));
      parsed.ai_confidence   = Math.min(1.0, Math.max(0.0,  parsed.ai_confidence));
      parsed.people_count    = Math.max(1,   parsed.people_count);
      parsed.vulnerable_infants       = Math.max(0, parsed.vulnerable_infants);
      parsed.vulnerable_elderly       = Math.max(0, parsed.vulnerable_elderly);
      parsed.vulnerable_critical_ill  = Math.max(0, parsed.vulnerable_critical_ill);

      return parsed;

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Gemini] Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // All retries exhausted — log and return safe fallback
  console.error('[Gemini] All retries failed, using fallback:', lastError?.message);
  return { ...EXTRACTION_FALLBACK };
}
