import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, date
import random
import urllib.request
import json

def excel_date_to_str(excel_num):
    try:
        val = float(excel_num)
        base = datetime(1899, 12, 30)
        dt = base + timedelta(days=val)
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return '2008-01-01'

# Read env variables
env = {}
with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip("'").strip('"')

supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def supabase_get(endpoint):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def supabase_post(endpoint, data):
    url = f"{supabase_url}/rest/v1/{endpoint}"
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

print("Connecting to Supabase...")
orgs = supabase_get('organizations?select=*&limit=1')
if not orgs:
    print("No organization found. Creating default...")
    new_org = supabase_post('organizations', [{
        'name': 'Dojo Karate BRTC',
        'slug': 'dojo-karate-brtc'
    }])
    org_id = new_org[0]['id']
else:
    org_id = orgs[0]['id']

print(f"Using Organization ID: {org_id}")

# 1. Parse Excel
print("Parsing ISCRITTI.xlsx...")
with zipfile.ZipFile('../ISCRITTI.xlsx') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
            if t is not None:
                shared_strings.append(t.text or '')
            else:
                text_parts = [elem.text for elem in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t') if elem.text]
                shared_strings.append(''.join(text_parts))

    sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    rows = sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
    
    gyms_dict = {
        'Dojo Shotokan Roma': {'city': 'Roma', 'address': 'Via Appia Nuova 450', 'province': 'RM', 'cap': '00179'},
        'Karate Club Milano': {'city': 'Milano', 'address': 'Viale Monza 120', 'province': 'MI', 'cap': '20127'},
        'Budokan Napoli': {'city': 'Napoli', 'address': 'Corso Umberto I 88', 'province': 'NA', 'cap': '80138'},
        'Sakura Dojo Torino': {'city': 'Torino', 'address': 'Corso Francia 52', 'province': 'TO', 'cap': '10143'}
    }
    
    # Check or create locations
    existing_locs = supabase_get(f'locations?organization_id=eq.{org_id}&select=*')
    loc_map = {l['name']: l['id'] for l in existing_locs}
    
    for g_name, g_info in gyms_dict.items():
        if g_name not in loc_map:
            new_loc = supabase_post('locations', [{
                'organization_id': org_id,
                'name': g_name,
                'city': g_info['city'],
                'address': g_info['address'],
                'province': g_info['province'],
                'cap': g_info['cap'],
                'phone': '+39 06 1234567',
                'email': f"info@{g_name.lower().replace(' ', '')}.it",
                'is_active': True
            }])
            loc_map[g_name] = new_loc[0]['id']
            print(f"Created location: {g_name}")

    # Check if athletes already loaded
    existing_ath = supabase_get(f'athletes?organization_id=eq.{org_id}&select=id&limit=1')
    if existing_ath:
        print(f"Athletes already present in DB. Cleaning up old demo data first...")
        # delete old athletes
        del_req = urllib.request.Request(f"{supabase_url}/rest/v1/athletes?organization_id=eq.{org_id}", headers=headers, method='DELETE')
        try:
            urllib.request.urlopen(del_req)
        except Exception as e:
            print("Delete error:", e)

    today = date.today()
    athletes_to_insert = []
    
    for idx, r in enumerate(rows[1:]):
        cells = {}
        for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            r_ref = c.get('r')
            col = ''.join([ch for ch in r_ref if ch.isalpha()])
            t = c.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if t == 's' and val:
                val = shared_strings[int(val)]
            cells[col] = val
        
        full_name = cells.get('B', '').strip()
        gym = cells.get('C', '').strip()
        dob_raw = cells.get('D', '')
        gender = cells.get('E', 'M').strip().upper()
        weight = cells.get('F', None)
        height = cells.get('G', None)
        belt = cells.get('H', '').strip()
        
        if not full_name:
            continue
            
        parts = full_name.split()
        first_name = parts[0]
        last_name = ' '.join(parts[1:]) if len(parts) > 1 else 'Atleta'
        dob = excel_date_to_str(dob_raw)
        
        # Medical certificate expiry logic
        # 10 expired, 15 expiring soon (1-25 days), 75 valid (6-12 months)
        if idx < 10:
            med_expiry = (today - timedelta(days=random.randint(5, 60))).strftime('%Y-%m-%d')
        elif idx < 25:
            med_expiry = (today + timedelta(days=random.randint(3, 25))).strftime('%Y-%m-%d')
        else:
            med_expiry = (today + timedelta(days=random.randint(90, 365))).strftime('%Y-%m-%d')
            
        athletes_to_insert.append({
            'organization_id': org_id,
            'location_id': loc_map.get(gym),
            'first_name': first_name,
            'last_name': last_name,
            'date_of_birth': dob,
            'gender': gender if gender in ['M', 'F'] else 'M',
            'belt_category': belt,
            'weight': float(weight) if weight else None,
            'height': int(float(height)) if height else None,
            'gym_branch': gym,
            'medical_cert_expiry': med_expiry,
            'enrollment_date': (today - timedelta(days=random.randint(30, 700))).strftime('%Y-%m-%d'),
            'is_active': True
        })

    # Batch insert athletes (in chunks of 25)
    inserted_athletes = []
    chunk_size = 25
    for i in range(0, len(athletes_to_insert), chunk_size):
        chunk = athletes_to_insert[i:i+chunk_size]
        res = supabase_post('athletes', chunk)
        inserted_athletes.extend(res)
        print(f"Inserted athletes {i+1} to {min(i+chunk_size, len(athletes_to_insert))} of {len(athletes_to_insert)}")

    print(f"[OK] Total {len(inserted_athletes)} athletes inserted successfully!")

    # 3. Create Sample Tournament
    tournaments = supabase_get(f'tournaments?organization_id=eq.{org_id}&select=*&limit=1')
    if not tournaments:
        print("Creating Sample Tournament...")
        tourn = supabase_post('tournaments', [{
            'organization_id': org_id,
            'name': 'Gran Premio d\'Italia Karate 2026',
            'date': (today + timedelta(days=45)).strftime('%Y-%m-%d'),
            'location': 'Palasport Olimpico - Roma',
            'description': 'Campionato Nazionale aperto a tutte le categorie Kata e Kumite.',
            'status': 'active'
        }])[0]
        tourn_id = tourn['id']
        
        # Categories
        cat1 = supabase_post('tournament_categories', [{
            'tournament_id': tourn_id,
            'name': 'Kumite Senior Maschile -75kg',
            'type': 'kumite',
            'gender': 'M',
            'age_group': 'Senior',
            'weight_category': '-75kg',
            'belt_category': 'Nera-Marrone'
        }])[0]
        
        cat2 = supabase_post('tournament_categories', [{
            'tournament_id': tourn_id,
            'name': 'Kata Open Femminile',
            'type': 'kata',
            'gender': 'F',
            'age_group': 'Open',
            'belt_category': 'Tutte'
        }])[0]
        
        # Inscribe 8 athletes in cat1
        males = [a['id'] for a in inserted_athletes if a.get('gender') == 'M'][:8]
        participants_data = [{'tournament_id': tourn_id, 'category_id': cat1['id'], 'athlete_id': aid} for aid in males]
        supabase_post('tournament_participants', participants_data)
        
        # Inscribe 8 athletes in cat2
        females = [a['id'] for a in inserted_athletes if a.get('gender') == 'F'][:8]
        participants_data_f = [{'tournament_id': tourn_id, 'category_id': cat2['id'], 'athlete_id': aid} for aid in females]
        supabase_post('tournament_participants', participants_data_f)
        
        print("[OK] Sample tournament and categories created with 16 competitors!")

    # 4. Create Sample Belt Exam Session
    exams = supabase_get(f'exam_sessions?organization_id=eq.{org_id}&select=*&limit=1')
    if not exams:
        print("Creating Sample Exam Session...")
        session = supabase_post('exam_sessions', [{
            'organization_id': org_id,
            'name': 'Sessione Esami di Grado - Estate 2026',
            'date': (today + timedelta(days=20)).strftime('%Y-%m-%d'),
            'status': 'draft'
        }])[0]
        
        # Candidates
        sample_candidates = inserted_athletes[15:23]
        target_belts = {'Gialla': 'Arancione', 'Arancione': 'Verde', 'Verde': 'Blu', 'Blu': 'Marrone', 'Marrone': 'Nera'}
        candidates_data = []
        for c in sample_candidates:
            curr_belt = c.get('belt_category') or 'Bianca'
            nxt_belt = target_belts.get(curr_belt, 'Nera 1° Dan')
            candidates_data.append({
                'session_id': session['id'],
                'athlete_id': c['id'],
                'target_belt': nxt_belt,
                'status': 'pending'
            })
        supabase_post('exam_candidates', candidates_data)
        print("[OK] Sample Exam Session created with 8 candidates!")

    # 5. Create Sample Attendance records
    print("Generating sample attendance...")
    loc_id = list(loc_map.values())[0]
    att_data = []
    for days_ago in [0, 2, 4]:
        att_date = (today - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        for a in inserted_athletes[:15]:
            att_data.append({
                'organization_id': org_id,
                'athlete_id': a['id'],
                'location_id': loc_id,
                'date': att_date,
                'status': random.choice(['present', 'present', 'present', 'absent'])
            })
    supabase_post('attendance', att_data)
    print("[OK] Attendance records created!")

print("\nALL DEMO DATA LOADED SUCCESSFULLY!")

