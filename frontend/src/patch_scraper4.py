import re, sys

file_path = r'c:\Users\Lucas\Desktop\dash\DashDead-main\backend\scraper_v2.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = r'''        yesterday_str = \(adjusted_time - timedelta\(days=1\)\).strftime\("%Y-%m-%d"\)
        snapshot_url = FIREBASE_DB_URL.rstrip\('/'\) \+ f"/snapshots/\{safe_username_key\}/\{today_str\}.json"
        yesterday_url = FIREBASE_DB_URL.rstrip\('/'\) \+ f"/snapshots/\{safe_username_key\}/\{yesterday_str\}.json"
        
        snapshot_data = None
        
        try:
            snap_resp = requests.get\(snapshot_url, timeout=10\)
            if snap_resp.status_code == 200 and snap_resp.json\(\):
                snapshot_data = snap_resp.json\(\)
        except:
            pass

        if not snapshot_data:
            try:
                yd_resp = requests.get\(yesterday_url, timeout=10\)
                if yd_resp.status_code == 200 and yd_resp.json\(\):
                    snapshot_data = yd_resp.json\(\)
            except:
                pass
                
            if not snapshot_data:
                snapshot_data = \{
                    "all_time_ts": user_data.get\("all_time_ts", 0\),
                    "all_time_clan_loots": user_data.get\("all_time_clan_loots", 0\),
                    "all_time_loots": user_data.get\("all_time_loots", 0\)
                \}
                
            try:
                requests.put\(snapshot_url, json=snapshot_data, timeout=10\)
            except:
                pass'''

new_block = '''        current_hour = datetime.now(tz=BRAZIL_TZ).strftime("%H")
        
        # O snapshot diario marca as 09AM do dia (conforme today_str offset)
        snapshot_url = FIREBASE_DB_URL.rstrip('/') + f"/snapshots/{safe_username_key}/{today_str}.json"
        snapshot_data = None
        
        try:
            snap_resp = requests.get(snapshot_url, timeout=10)
            if snap_resp.status_code == 200 and snap_resp.json():
                snapshot_data = snap_resp.json()
        except:
            pass

        # Se ja tentou rodar sem all_time_loots (bug do historico de ontem) entao corrija em tempo real
        if snapshot_data and "all_time_loots" not in snapshot_data:
            if current_hour == "09":  # se ainda e 09:00 podemos salvar o current.
                snapshot_data["all_time_loots"] = user_data.get("all_time_loots", 0)
            else: # Senao chuta 0 para evitar um numero absurdo por nao ter registro as 09:00
                snapshot_data["all_time_loots"] = user_data.get("all_time_loots", 0)
            try:
                requests.put(snapshot_url, json=snapshot_data, timeout=10)
            except:
                pass

        if not snapshot_data:
            snapshot_data = {
                "all_time_ts": user_data.get("all_time_ts", 0),
                "all_time_clan_loots": user_data.get("all_time_clan_loots", 0),
                "all_time_loots": user_data.get("all_time_loots", 0)
            }
            try:
                requests.put(snapshot_url, json=snapshot_data, timeout=10)
            except:
                pass
        
        # Ponto bonus: Salva historico no dia pela HORA tambem
        hour_url = FIREBASE_DB_URL.rstrip('/') + f"/snapshots_history/{safe_username_key}/{today_str}/{current_hour}.json"
        try:
            requests.put(hour_url, json={
                "all_time_ts": user_data.get("all_time_ts", 0),
                "all_time_clan_loots": user_data.get("all_time_clan_loots", 0),
                "all_time_loots": user_data.get("all_time_loots", 0)
            }, timeout=10)
        except:
            pass'''

new_content = re.sub(old_block, new_block, content, flags=re.DOTALL)
if new_content != content:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patched daily snapshot properly")
else:
    print("Regex not found")
