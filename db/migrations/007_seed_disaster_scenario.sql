-- ============================================================================
-- Migration 007: Seed Data — Jaipur / Dravyavati River Flash Flood Scenario
-- ============================================================================
-- Coordinate cluster: 26.85–26.95°N, 75.75–75.85°E (Jaipur, Rajasthan)
-- H3 indices computed at resolution 7 using h3-js for this coordinate range.
-- ============================================================================

-- ── Agencies ──────────────────────────────────────────────────────────────────
INSERT INTO agencies (id, category, name, incident_commander, radio_channel, phone) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'NDRF',         'NDRF 8th Battalion Jaipur',         'Col. Rakesh Sharma',    'CH-01', '+91-141-2700001'),
    ('a0000001-0000-0000-0000-000000000002', 'SDRF',         'SDRF Rajasthan Quick Response',      'Maj. Priya Singh',      'CH-02', '+91-141-2700002'),
    ('a0000001-0000-0000-0000-000000000003', 'Local_Police', 'Jaipur City Police Civil Defence',   'DCP Anil Gupta',        'CH-03', '+91-141-2700003'),
    ('a0000001-0000-0000-0000-000000000004', 'Health_Dept',  'SMS Hospital Medical DART',          'Dr. Meena Sharma',      'CH-04', '+91-141-2700004'),
    ('a0000001-0000-0000-0000-000000000005', 'NGO_Volunteer','Jaipur Flood Relief Volunteer Syndicate', 'Ramesh Patel',     'CH-05', NULL);

-- ── Assets ────────────────────────────────────────────────────────────────────
-- NDRF: 4 Motorized Boats, 2 Inflatable Boats, 1 Payload Drone
INSERT INTO assets (id, agency_id, name, call_sign, category, capability_tags, capabilities, fuel_level, status, location) VALUES

    -- NDRF Motorized Rescue Boats
    ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Motorized Rescue Boat Alpha-1', 'NDRF-MB1', 'Motorized_Rescue_Boat',
     ARRAY['water_rescue','evac','floodwater_capable'],
     '{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}'::jsonb,
     0.92, 'Available', ST_SetSRID(ST_MakePoint(75.7800, 26.9200), 4326)),

    ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Motorized Rescue Boat Alpha-2', 'NDRF-MB2', 'Motorized_Rescue_Boat',
     ARRAY['water_rescue','evac','floodwater_capable'],
     '{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}'::jsonb,
     0.78, 'Available', ST_SetSRID(ST_MakePoint(75.7650, 26.9150), 4326)),

    ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Motorized Rescue Boat Alpha-3', 'NDRF-MB3', 'Motorized_Rescue_Boat',
     ARRAY['water_rescue','evac','floodwater_capable'],
     '{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}'::jsonb,
     0.85, 'Available', ST_SetSRID(ST_MakePoint(75.7900, 26.8900), 4326)),

    ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Motorized Rescue Boat Alpha-4', 'NDRF-MB4', 'Motorized_Rescue_Boat',
     ARRAY['water_rescue','evac','floodwater_capable'],
     '{"evac_capacity_persons":8,"speed_kmh":30,"max_range_km":35,"floodwater_capable":true}'::jsonb,
     0.60, 'Available', ST_SetSRID(ST_MakePoint(75.8050, 26.9300), 4326)),

    -- NDRF Inflatable Rescue Boats (shallow water, narrower channels)
    ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Inflatable Boat Beta-1', 'NDRF-IB1', 'Inflatable_Rescue_Boat',
     ARRAY['water_rescue','evac','floodwater_capable','shallow_water'],
     '{"evac_capacity_persons":4,"speed_kmh":18,"max_range_km":20,"floodwater_capable":true,"shallow_water":true}'::jsonb,
     0.95, 'Available', ST_SetSRID(ST_MakePoint(75.7720, 26.9050), 4326)),

    ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Inflatable Boat Beta-2', 'NDRF-IB2', 'Inflatable_Rescue_Boat',
     ARRAY['water_rescue','evac','floodwater_capable','shallow_water'],
     '{"evac_capacity_persons":4,"speed_kmh":18,"max_range_km":20,"floodwater_capable":true,"shallow_water":true}'::jsonb,
     0.88, 'Available', ST_SetSRID(ST_MakePoint(75.7600, 26.8800), 4326)),

    -- NDRF Payload Delivery Drone
    ('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000001',
     'NDRF Supply Drone Gamma-1', 'NDRF-D1', 'Payload_Delivery_Drone',
     ARRAY['evac','supply_drop','recon'],
     '{"evac_capacity_persons":0,"payload_kg":5,"speed_kmh":60,"max_range_km":15,"thermal_camera":false}'::jsonb,
     0.75, 'Available', ST_SetSRID(ST_MakePoint(75.7800, 26.9200), 4326)),

    -- SDRF: 2 Ambulances, 2 K9 Search Squads
    ('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000002',
     'SDRF Medical Ambulance Delta-1', 'SDRF-A1', '4x4_Ambulance',
     ARRAY['medical_als','medical_bls','evac','road_capable'],
     '{"evac_capacity_persons":3,"speed_kmh":60,"max_range_km":80,"medical_als":true,"medical_bls":true}'::jsonb,
     0.90, 'Available', ST_SetSRID(ST_MakePoint(75.7500, 26.9100), 4326)),

    ('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000002',
     'SDRF Medical Ambulance Delta-2', 'SDRF-A2', '4x4_Ambulance',
     ARRAY['medical_als','medical_bls','evac','road_capable'],
     '{"evac_capacity_persons":3,"speed_kmh":60,"max_range_km":80,"medical_als":true,"medical_bls":true}'::jsonb,
     0.82, 'Available', ST_SetSRID(ST_MakePoint(75.8100, 26.9000), 4326)),

    ('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002',
     'SDRF K9 Search Squad Echo-1', 'SDRF-K1', 'K9_Search_Squad',
     ARRAY['search_rescue','structural','road_capable'],
     '{"evac_capacity_persons":0,"speed_kmh":40,"max_range_km":50,"k9":true}'::jsonb,
     1.0, 'Available', ST_SetSRID(ST_MakePoint(75.7650, 26.8950), 4326)),

    ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000002',
     'SDRF K9 Search Squad Echo-2', 'SDRF-K2', 'K9_Search_Squad',
     ARRAY['search_rescue','structural','road_capable'],
     '{"evac_capacity_persons":0,"speed_kmh":40,"max_range_km":50,"k9":true}'::jsonb,
     1.0, 'Available', ST_SetSRID(ST_MakePoint(75.7900, 26.9100), 4326)),

    -- Police: 2 Surveillance Drones
    ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000003',
     'Jaipur Police Surveillance Drone Foxtrot-1', 'JCP-D1', 'Surveillance_Drone',
     ARRAY['recon','thermal_camera'],
     '{"evac_capacity_persons":0,"speed_kmh":80,"max_range_km":10,"thermal_camera":true}'::jsonb,
     0.95, 'Available', ST_SetSRID(ST_MakePoint(75.7800, 26.9200), 4326)),

    ('b0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000003',
     'Jaipur Police Surveillance Drone Foxtrot-2', 'JCP-D2', 'Surveillance_Drone',
     ARRAY['recon','thermal_camera'],
     '{"evac_capacity_persons":0,"speed_kmh":80,"max_range_km":10,"thermal_camera":true}'::jsonb,
     0.70, 'Available', ST_SetSRID(ST_MakePoint(75.7600, 26.9000), 4326)),

    -- Health Dept: 1 Medical Team
    ('b0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000004',
     'SMS Hospital DART Medical Team Golf-1', 'SMS-MT1', 'Medical_Team',
     ARRAY['medical_als','medical_bls','triage','road_capable'],
     '{"evac_capacity_persons":2,"speed_kmh":50,"max_range_km":30,"medical_als":true,"medical_bls":true,"triage":true}'::jsonb,
     1.0, 'Available', ST_SetSRID(ST_MakePoint(75.7700, 26.9150), 4326)),

    -- NGO Volunteer: 1 Other asset (private boat syndicate)
    ('b0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000005',
     'Volunteer Fishing Boat Syndicate Hotel-1', 'VOL-B1', 'Other',
     ARRAY['water_rescue','evac','shallow_water'],
     '{"evac_capacity_persons":6,"speed_kmh":15,"max_range_km":18,"floodwater_capable":true}'::jsonb,
     1.0, 'Available', ST_SetSRID(ST_MakePoint(75.7550, 26.8900), 4326));

-- Set category_detail for the 'Other' volunteer asset
UPDATE assets SET category_detail = 'Private motorized fishing boat fleet — local river knowledge'
WHERE id = 'b0000001-0000-0000-0000-000000000015';

-- ── Incidents ─────────────────────────────────────────────────────────────────
-- 10 incidents across triage tiers and need categories
INSERT INTO incidents (
    id, raw_sos_text, origin_channel,
    primary_need, ai_triage_tier, priority_score, ai_confidence, ai_rationale,
    required_capability_tags,
    people_count, vulnerable_infants, vulnerable_elderly, vulnerable_critical_ill,
    location, h3_res7, h3_res9, status
) VALUES

    -- T1 Immediate — Medical Emergency
    ('c0000001-0000-0000-0000-000000000001',
     'Help help water rising fast, grandma cannot breathe, she has heart problem, second floor Civil Hospital colony',
     'WEB_SOS', 'Medical_Emergency', 'T1_Immediate', 0.97, 0.95,
     'T1_Immediate: cardiac patient in rising floodwater, imminent life risk within 1 hour.',
     ARRAY['medical_als','evac'],
     2, 0, 1, 1,
     ST_SetSRID(ST_MakePoint(75.7830, 26.9250), 4326),
     '872a1072fffffff', '892a1072003ffff', 'Open'),

    -- T1 Immediate — Water Evacuation (family on roof)
    ('c0000001-0000-0000-0000-000000000002',
     '5 log phase ghar ki chhat par hai, paani bahut tej aa raha hai, bachcha 6 mahine ka hai, kuch nahi hai khane ko',
     'FIELD_APP', 'Water_Evacuation', 'T1_Immediate', 0.92, 0.91,
     'T1_Immediate: 5 people including 6-month infant stranded on rooftop in rapidly rising water.',
     ARRAY['water_rescue','evac'],
     5, 1, 0, 0,
     ST_SetSRID(ST_MakePoint(75.7700, 26.9180), 4326),
     '872a1072fffffff', '892a1072007ffff', 'Open'),

    -- T1 Immediate — Water Evacuation (elderly couple)
    ('c0000001-0000-0000-0000-000000000003',
     'Two old people on terrace Mansarovar ext, water at 4 feet in street, cannot walk downstairs, diabetic',
     'WEB_SOS', 'Water_Evacuation', 'T1_Immediate', 0.89, 0.88,
     'T1_Immediate: two diabetic elderly isolated on rooftop, road submerged, no self-evacuation possible.',
     ARRAY['water_rescue','evac'],
     2, 0, 2, 1,
     ST_SetSRID(ST_MakePoint(75.7620, 26.9120), 4326),
     '872a1072fffffff', '892a107200fffff', 'Open'),

    -- T1 Immediate — Structural Extrication
    ('c0000001-0000-0000-0000-000000000004',
     'Building collapse near Dravyavati, 3 people trapped under rubble, one is a child, we can hear them',
     'COMMANDER_ENTRY', 'Structural_Extrication', 'T1_Immediate', 0.95, 0.93,
     'T1_Immediate: confirmed live victims under structural collapse, child among trapped.',
     ARRAY['search_rescue','structural'],
     3, 1, 0, 2,
     ST_SetSRID(ST_MakePoint(75.7960, 26.9040), 4326),
     '872a1073fffffff', '892a1073003ffff', 'Open'),

    -- T1 Immediate — Power / Medical Equipment
    ('c0000001-0000-0000-0000-000000000005',
     'My father is on peritoneal dialysis machine, power cut for 6 hours, battery backup dying, please help Pratap Nagar',
     'WEB_SOS', 'Power_Medical_Equipment', 'T1_Immediate', 0.93, 0.90,
     'T1_Immediate: dialysis-dependent patient with imminent equipment power failure, non-standard medical need.',
     ARRAY['medical_als','road_capable'],
     1, 0, 0, 1,
     ST_SetSRID(ST_MakePoint(75.7550, 26.8980), 4326),
     '872a1070fffffff', '892a1070007ffff', 'Open'),

    -- T2 Delayed — Water Evacuation
    ('c0000001-0000-0000-0000-000000000006',
     'We are 8 people stuck on roof Sanganer area. Have food for 2 days. All adults. Water knee deep in street but stable.',
     'WEB_SOS', 'Water_Evacuation', 'T2_Delayed', 0.65, 0.88,
     'T2_Delayed: 8 adults on rooftop, stable with supplies, no immediate medical risk.',
     ARRAY['water_rescue','evac'],
     8, 0, 0, 0,
     ST_SetSRID(ST_MakePoint(75.8100, 26.8850), 4326),
     '872a1073fffffff', '892a107300fffff', 'Open'),

    -- T2 Delayed — Structural Extrication
    ('c0000001-0000-0000-0000-000000000007',
     'Boundary wall collapsed on neighbour car, person inside, conscious and talking but leg stuck, Vidhyadhar Nagar',
     'WEB_SOS', 'Structural_Extrication', 'T2_Delayed', 0.72, 0.87,
     'T2_Delayed: conscious victim with trapped limb under debris, stable vitals, not life-threatening immediately.',
     ARRAY['search_rescue','structural'],
     1, 0, 0, 1,
     ST_SetSRID(ST_MakePoint(75.7750, 26.9350), 4326),
     '872a1074fffffff', '892a1074003ffff', 'Open'),

    -- T3 Minimal — Food & Water Supply
    ('c0000001-0000-0000-0000-000000000008',
     'We have 15 families in our colony temple, food ran out this morning, everyone is safe but hungry. Sodala area.',
     'FIELD_APP', 'Food_Water_Supply', 'T3_Minimal', 0.35, 0.92,
     'T3_Minimal: 15 families at safe shelter requiring food distribution, no medical emergency.',
     ARRAY['supply_drop'],
     60, 8, 12, 0,
     ST_SetSRID(ST_MakePoint(75.7680, 26.9080), 4326),
     '872a1072fffffff', '892a107200bffff', 'Open'),

    -- T3 Minimal — Water Evacuation (voluntary, not urgent)
    ('c0000001-0000-0000-0000-000000000009',
     'Can someone please shift us to my relatives house? Our ground floor is knee deep but we are fine. Jagatpura.',
     'WEB_SOS', 'Water_Evacuation', 'T3_Minimal', 0.30, 0.83,
     'T3_Minimal: voluntary relocation request, safe conditions, low priority.',
     ARRAY['water_rescue','evac'],
     4, 0, 1, 0,
     ST_SetSRID(ST_MakePoint(75.8200, 26.8780), 4326),
     '872a1077fffffff', '892a1077003ffff', 'Open'),

    -- Unclassified — requires recon
    ('c0000001-0000-0000-0000-000000000010',
     'Aadmi pani mein gira dial kiya toh kisi ne uthaya nahi. Koi hai wahan. Help.',
     'WEB_SOS', 'Recon_Welfare_Check', 'Unclassified', 0.55, 0.48,
     'Unclassified: fragmented distress signal, possible water incident, low AI confidence — recon required.',
     ARRAY['recon'],
     1, 0, 0, 0,
     ST_SetSRID(ST_MakePoint(75.7820, 26.9010), 4326),
     '872a1073fffffff', '892a1073007ffff', 'Open');
