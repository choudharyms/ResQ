/**
 * Seed script: inserts demo agencies, assets, and incidents with H3 indices
 * computed at runtime from coordinates (never hardcoded).
 *
 * Usage: npm run db:seed
 *
 * This replaces the hardcoded H3 strings in 007_seed_disaster_scenario.sql.
 * Run AFTER db:migrate (which runs 001-006 only; seed is separate).
 */

import pg       from 'pg';
import dotenv   from 'dotenv';
import { latLngToCell } from 'h3-js';

dotenv.config();

const { Client } = pg;

const H3_RES7 = 7;
const H3_RES9 = 9;

function h3pair(lat: number, lng: number) {
  return {
    h3_res7: latLngToCell(lat, lng, H3_RES7),
    h3_res9: latLngToCell(lat, lng, H3_RES9),
  };
}

// ── Incident definitions (no hardcoded H3 — computed below) ──────────────────
const INCIDENTS = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    raw_sos_text: 'Help help water rising fast, grandma cannot breathe, she has heart problem, second floor Civil Hospital colony',
    primary_need: 'Medical_Emergency', ai_triage_tier: 'T1_Immediate', priority_score: 0.97, ai_confidence: 0.95,
    required_capability_tags: ['medical_als', 'evac'],
    ai_rationale: 'T1_Immediate: cardiac patient in rising floodwater, imminent life risk within 1 hour.',
    people_count: 2, vulnerable_infants: 0, vulnerable_elderly: 1, vulnerable_critical_ill: 1,
    lat: 26.9250, lng: 75.7830,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    raw_sos_text: '5 log phase ghar ki chhat par hai, paani bahut tej aa raha hai, bachcha 6 mahine ka hai',
    primary_need: 'Water_Evacuation', ai_triage_tier: 'T1_Immediate', priority_score: 0.92, ai_confidence: 0.91,
    required_capability_tags: ['water_rescue', 'evac'],
    ai_rationale: 'T1_Immediate: 5 people including 6-month infant stranded on rooftop in rapidly rising water.',
    people_count: 5, vulnerable_infants: 1, vulnerable_elderly: 0, vulnerable_critical_ill: 0,
    lat: 26.9180, lng: 75.7700,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    raw_sos_text: 'Two old people on terrace Mansarovar ext, water at 4 feet in street, cannot walk downstairs, diabetic',
    primary_need: 'Water_Evacuation', ai_triage_tier: 'T1_Immediate', priority_score: 0.89, ai_confidence: 0.88,
    required_capability_tags: ['water_rescue', 'evac'],
    ai_rationale: 'T1_Immediate: two diabetic elderly isolated on rooftop, road submerged, no self-evacuation possible.',
    people_count: 2, vulnerable_infants: 0, vulnerable_elderly: 1, vulnerable_critical_ill: 1,
    lat: 26.9120, lng: 75.7620,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    raw_sos_text: 'Building collapse near Dravyavati, 3 people trapped under rubble, one is a child, we can hear them',
    primary_need: 'Structural_Extrication', ai_triage_tier: 'T1_Immediate', priority_score: 0.95, ai_confidence: 0.93,
    required_capability_tags: ['search_rescue', 'structural'],
    ai_rationale: 'T1_Immediate: confirmed live victims under structural collapse, child among trapped.',
    people_count: 3, vulnerable_infants: 1, vulnerable_elderly: 0, vulnerable_critical_ill: 2,
    lat: 26.9040, lng: 75.7960,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    raw_sos_text: 'My father is on peritoneal dialysis machine, power cut for 6 hours, battery backup dying, please help Pratap Nagar',
    primary_need: 'Power_Medical_Equipment', ai_triage_tier: 'T1_Immediate', priority_score: 0.93, ai_confidence: 0.90,
    required_capability_tags: ['medical_als', 'road_capable'],
    ai_rationale: 'T1_Immediate: dialysis-dependent patient with imminent equipment power failure.',
    people_count: 1, vulnerable_infants: 0, vulnerable_elderly: 0, vulnerable_critical_ill: 1,
    lat: 26.8980, lng: 75.7550,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000006',
    raw_sos_text: 'We are 8 people stuck on roof Sanganer area. Have food for 2 days. All adults. Water knee deep in street but stable.',
    primary_need: 'Water_Evacuation', ai_triage_tier: 'T2_Delayed', priority_score: 0.65, ai_confidence: 0.88,
    required_capability_tags: ['water_rescue', 'evac'],
    ai_rationale: 'T2_Delayed: 8 adults on rooftop, stable with supplies, no immediate medical risk.',
    people_count: 8, vulnerable_infants: 0, vulnerable_elderly: 0, vulnerable_critical_ill: 0,
    lat: 26.8850, lng: 75.8100,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000007',
    raw_sos_text: 'Boundary wall collapsed on neighbour car, person inside, conscious and talking but leg stuck, Vidhyadhar Nagar',
    primary_need: 'Structural_Extrication', ai_triage_tier: 'T2_Delayed', priority_score: 0.72, ai_confidence: 0.87,
    required_capability_tags: ['search_rescue', 'structural'],
    ai_rationale: 'T2_Delayed: conscious victim with trapped limb, stable vitals, not immediately life-threatening.',
    people_count: 1, vulnerable_infants: 0, vulnerable_elderly: 0, vulnerable_critical_ill: 1,
    lat: 26.9350, lng: 75.7750,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000008',
    raw_sos_text: 'We have 15 families in our colony temple, food ran out this morning, everyone is safe but hungry. Sodala area.',
    primary_need: 'Food_Water_Supply', ai_triage_tier: 'T3_Minimal', priority_score: 0.35, ai_confidence: 0.92,
    required_capability_tags: ['supply_drop'],
    ai_rationale: 'T3_Minimal: 15 families at safe shelter requiring food distribution, no medical emergency.',
    people_count: 60, vulnerable_infants: 8, vulnerable_elderly: 12, vulnerable_critical_ill: 0,
    lat: 26.9080, lng: 75.7680,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000009',
    raw_sos_text: 'Can someone please shift us to my relatives house? Our ground floor is knee deep but we are fine. Jagatpura.',
    primary_need: 'Water_Evacuation', ai_triage_tier: 'T3_Minimal', priority_score: 0.30, ai_confidence: 0.83,
    required_capability_tags: ['water_rescue', 'evac'],
    ai_rationale: 'T3_Minimal: voluntary relocation request, safe conditions, low priority.',
    people_count: 4, vulnerable_infants: 0, vulnerable_elderly: 1, vulnerable_critical_ill: 0,
    lat: 26.8780, lng: 75.8200,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000010',
    raw_sos_text: 'Aadmi pani mein gira dial kiya toh kisi ne uthaya nahi. Koi hai wahan. Help.',
    primary_need: 'Recon_Welfare_Check', ai_triage_tier: 'Unclassified', priority_score: 0.55, ai_confidence: 0.48,
    required_capability_tags: ['recon'],
    ai_rationale: 'Unclassified: fragmented distress signal, possible water incident, low AI confidence — recon required.',
    people_count: 1, vulnerable_infants: 0, vulnerable_elderly: 0, vulnerable_critical_ill: 0,
    lat: 26.9010, lng: 75.7820,
  },
];

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅  Connected to database\n');

  // Clear existing seed data (idempotent re-run)
  await client.query(`DELETE FROM allocations`);
  await client.query(`DELETE FROM incidents WHERE id LIKE 'c0000001%'`);
  await client.query(`DELETE FROM assets WHERE id LIKE 'b0000001%'`);
  await client.query(`DELETE FROM agencies WHERE id LIKE 'a0000001%'`);
  console.log('🗑   Cleared previous seed data\n');

  // ── Agencies ────────────────────────────────────────────────────────────────
  await client.query(`
    INSERT INTO agencies (id, category, name, incident_commander, radio_channel, phone) VALUES
    ('a0000001-0000-0000-0000-000000000001','NDRF','NDRF 8th Battalion Jaipur','Col. Rakesh Sharma','CH-01','+91-141-2700001'),
    ('a0000001-0000-0000-0000-000000000002','SDRF','SDRF Rajasthan Quick Response','Maj. Priya Singh','CH-02','+91-141-2700002'),
    ('a0000001-0000-0000-0000-000000000003','Local_Police','Jaipur City Police Civil Defence','DCP Anil Gupta','CH-03','+91-141-2700003'),
    ('a0000001-0000-0000-0000-000000000004','Health_Dept','SMS Hospital Medical DART','Dr. Meena Sharma','CH-04','+91-141-2700004'),
    ('a0000001-0000-0000-0000-000000000005','NGO_Volunteer','Jaipur Flood Relief Volunteer Syndicate','Ramesh Patel','CH-05',NULL)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('✅  Agencies seeded');

  // ── Assets (same as migration 007) ─────────────────────────────────────────
  await client.query(`
    INSERT INTO assets (id, agency_id, name, call_sign, category, capability_tags, capabilities, fuel_level, status, location) VALUES
    ('b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','NDRF Motorized Rescue Boat Alpha-1','NDRF-MB1','Motorized_Rescue_Boat',ARRAY['water_rescue','evac','floodwater_capable'],'{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}',0.92,'Available',ST_SetSRID(ST_MakePoint(75.7800,26.9200),4326)),
    ('b0000001-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000001','NDRF Motorized Rescue Boat Alpha-2','NDRF-MB2','Motorized_Rescue_Boat',ARRAY['water_rescue','evac','floodwater_capable'],'{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}',0.78,'Available',ST_SetSRID(ST_MakePoint(75.7650,26.9150),4326)),
    ('b0000001-0000-0000-0000-000000000003','a0000001-0000-0000-0000-000000000001','NDRF Motorized Rescue Boat Alpha-3','NDRF-MB3','Motorized_Rescue_Boat',ARRAY['water_rescue','evac','floodwater_capable'],'{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}',0.85,'Available',ST_SetSRID(ST_MakePoint(75.7900,26.8900),4326)),
    ('b0000001-0000-0000-0000-000000000004','a0000001-0000-0000-0000-000000000001','NDRF Motorized Rescue Boat Alpha-4','NDRF-MB4','Motorized_Rescue_Boat',ARRAY['water_rescue','evac','floodwater_capable'],'{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}',0.60,'Available',ST_SetSRID(ST_MakePoint(75.8050,26.9300),4326)),
    ('b0000001-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000001','NDRF Inflatable Boat Beta-1','NDRF-IB1','Inflatable_Rescue_Boat',ARRAY['water_rescue','evac','floodwater_capable','shallow_water'],'{"evac_capacity_persons":4,"speed_kmh":18,"max_range_km":20,"floodwater_capable":true,"shallow_water":true}',0.95,'Available',ST_SetSRID(ST_MakePoint(75.7720,26.9050),4326)),
    ('b0000001-0000-0000-0000-000000000006','a0000001-0000-0000-0000-000000000001','NDRF Inflatable Boat Beta-2','NDRF-IB2','Inflatable_Rescue_Boat',ARRAY['water_rescue','evac','floodwater_capable','shallow_water'],'{"evac_capacity_persons":4,"speed_kmh":18,"max_range_km":20,"floodwater_capable":true,"shallow_water":true}',0.88,'Available',ST_SetSRID(ST_MakePoint(75.7600,26.8800),4326)),
    ('b0000001-0000-0000-0000-000000000007','a0000001-0000-0000-0000-000000000001','NDRF Supply Drone Gamma-1','NDRF-D1','Payload_Delivery_Drone',ARRAY['evac','supply_drop','recon'],'{"evac_capacity_persons":0,"payload_kg":5,"speed_kmh":60,"max_range_km":15,"thermal_camera":false}',0.75,'Available',ST_SetSRID(ST_MakePoint(75.7800,26.9200),4326)),
    ('b0000001-0000-0000-0000-000000000008','a0000001-0000-0000-0000-000000000002','SDRF Medical Ambulance Delta-1','SDRF-A1','4x4_Ambulance',ARRAY['medical_als','medical_bls','evac','road_capable'],'{"evac_capacity_persons":3,"speed_kmh":60,"max_range_km":80,"medical_als":true,"medical_bls":true}',0.90,'Available',ST_SetSRID(ST_MakePoint(75.7500,26.9100),4326)),
    ('b0000001-0000-0000-0000-000000000009','a0000001-0000-0000-0000-000000000002','SDRF Medical Ambulance Delta-2','SDRF-A2','4x4_Ambulance',ARRAY['medical_als','medical_bls','evac','road_capable'],'{"evac_capacity_persons":3,"speed_kmh":60,"max_range_km":80,"medical_als":true,"medical_bls":true}',0.82,'Available',ST_SetSRID(ST_MakePoint(75.8100,26.9000),4326)),
    ('b0000001-0000-0000-0000-000000000010','a0000001-0000-0000-0000-000000000002','SDRF K9 Search Squad Echo-1','SDRF-K1','K9_Search_Squad',ARRAY['search_rescue','structural','road_capable'],'{"evac_capacity_persons":0,"speed_kmh":40,"max_range_km":50,"k9":true}',1.0,'Available',ST_SetSRID(ST_MakePoint(75.7650,26.8950),4326)),
    ('b0000001-0000-0000-0000-000000000011','a0000001-0000-0000-0000-000000000002','SDRF K9 Search Squad Echo-2','SDRF-K2','K9_Search_Squad',ARRAY['search_rescue','structural','road_capable'],'{"evac_capacity_persons":0,"speed_kmh":40,"max_range_km":50,"k9":true}',1.0,'Available',ST_SetSRID(ST_MakePoint(75.7900,26.9100),4326)),
    ('b0000001-0000-0000-0000-000000000012','a0000001-0000-0000-0000-000000000003','Jaipur Police Surveillance Drone Foxtrot-1','JCP-D1','Surveillance_Drone',ARRAY['recon','thermal_camera'],'{"evac_capacity_persons":0,"speed_kmh":80,"max_range_km":10,"thermal_camera":true}',0.95,'Available',ST_SetSRID(ST_MakePoint(75.7800,26.9200),4326)),
    ('b0000001-0000-0000-0000-000000000013','a0000001-0000-0000-0000-000000000003','Jaipur Police Surveillance Drone Foxtrot-2','JCP-D2','Surveillance_Drone',ARRAY['recon','thermal_camera'],'{"evac_capacity_persons":0,"speed_kmh":80,"max_range_km":10,"thermal_camera":true}',0.70,'Available',ST_SetSRID(ST_MakePoint(75.7600,26.9000),4326)),
    ('b0000001-0000-0000-0000-000000000014','a0000001-0000-0000-0000-000000000004','SMS Hospital DART Medical Team Golf-1','SMS-MT1','Medical_Team',ARRAY['medical_als','medical_bls','triage','road_capable'],'{"evac_capacity_persons":2,"speed_kmh":50,"max_range_km":30,"medical_als":true,"medical_bls":true,"triage":true}',1.0,'Available',ST_SetSRID(ST_MakePoint(75.7700,26.9150),4326)),
    ('b0000001-0000-0000-0000-000000000015','a0000001-0000-0000-0000-000000000005','Volunteer Fishing Boat Syndicate Hotel-1','VOL-B1','Other',ARRAY['water_rescue','evac','shallow_water'],'{"evac_capacity_persons":6,"speed_kmh":15,"max_range_km":18,"floodwater_capable":true}',1.0,'Available',ST_SetSRID(ST_MakePoint(75.7550,26.8900),4326))
    ON CONFLICT (id) DO NOTHING
  `);
  await client.query(`
    UPDATE assets SET category_detail = 'Private motorized fishing boat fleet — local river knowledge'
    WHERE id = 'b0000001-0000-0000-0000-000000000015'
  `);
  console.log('✅  Assets seeded');

  // ── Incidents (H3 computed at runtime) ─────────────────────────────────────
  for (const inc of INCIDENTS) {
    const { h3_res7, h3_res9 } = h3pair(inc.lat, inc.lng);
    await client.query(
      `INSERT INTO incidents (
        id, raw_sos_text, origin_channel,
        primary_need, secondary_needs, required_capability_tags,
        ai_triage_tier, priority_score, ai_confidence, ai_rationale,
        people_count, vulnerable_infants, vulnerable_elderly, vulnerable_critical_ill,
        location, h3_res7, h3_res9
      ) VALUES (
        $1, $2, 'WEB_SOS',
        $3, ARRAY[]::TEXT[], $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12,
        ST_SetSRID(ST_MakePoint($14, $13), 4326), $15, $16
      ) ON CONFLICT (id) DO NOTHING`,
      [
        inc.id, inc.raw_sos_text,
        inc.primary_need, inc.required_capability_tags,
        inc.ai_triage_tier, inc.priority_score, inc.ai_confidence, inc.ai_rationale,
        inc.people_count, inc.vulnerable_infants, inc.vulnerable_elderly, inc.vulnerable_critical_ill,
        inc.lat, inc.lng, h3_res7, h3_res9,
      ]
    );
    console.log(`  ✅  ${inc.id.slice(-4)} [${inc.ai_triage_tier}] ${inc.primary_need} → h3_res7=${h3_res7}`);
  }
  console.log('\n✅  Incidents seeded');

  await client.end();
  console.log('\n🎉  Seed complete. Run npm run server:dev and hit GET /health');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
