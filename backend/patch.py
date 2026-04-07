import os
import re

filepath = r'c:\Users\Lucas\Desktop\dash\DashDead-main\backend\scraper_v2.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """# Lógica de Snapshot Diário para Gráficos
        today_str = datetime.now(tz=BRAZIL_TZ).strftime("%Y-%m-%d")
        safe_username_key = requests.utils.requote_uri(m["username"])
        
        snapshot_url = FIREBASE_DB_URL.rstrip('/') + f"/snapshots/{safe_username_key}/{today_str}.json"
        snapshot_data = None
        try:
            snap_resp = requests.get(snapshot_url, timeout=10)
            if snap_resp.status_code == 200:
                snapshot_data = snap_resp.json()
        except Exception as e:
            logging.error(f"Erro ao buscar snapshot para {m['username']}: {e}")
            
        if not snapshot_data:
            snapshot_data = {
                "all_time_ts": user_data.get("all_time_ts", 0),
                "all_time_clan_loots": user_data.get("all_time_clan_loots", 0)
            }
            try:
                requests.put(snapshot_url, json=snapshot_data, timeout=10)
            except Exception as e:
                logging.error(f"Erro ao salvar snapshot para {m['username']}: {e}")

        daily_ts = user_data.get("all_time_ts", 0) - snapshot_data.get("all_time_ts", user_data.get("all_time_ts", 0))
        daily_loot = user_data.get("all_time_clan_loots", 0) - snapshot_data.get("all_time_clan_loots", user_data.get("all_time_clan_loots", 0))
        
        user_data["daily_ts_calc"] = daily_ts
        user_data["daily_loot_calc"] = daily_loot

        url = FIREBASE_DB_URL.rstrip('/') + f"/profiles/{safe_username_key}.json"
        try:
            requests.put(url, json=user_data, timeout=10)
        except Exception as e:
            logging.error(f"Erro ao salvar DB para {m['username']}: {e}")

        hist_url = FIREBASE_DB_URL.rstrip('/') + f"/historical/{today_str}/{safe_username_key}.json"
        try:
            hist_data = {
                "daily_ts": daily_ts,
                "daily_loot": daily_loot,
                "total_ts": user_data.get("all_time_ts", 0),
                "total_clan_loots": user_data.get("all_time_clan_loots", 0),
                "timestamp": now_iso
            }
            requests.put(hist_url, json=hist_data, timeout=10)
        except Exception as e:
            logging.error(f"Erro ao salvar historico para {m['username']}: {e}")

    logging.info("Scrape de perfis concluido com sucesso.")"""

# Replace the specific comments and try/except DB put
content = re.sub(
    r"# Salva no Firebase substituindo a l.*?conclu[Ãí]do com sucesso\.",
    replacement,
    content,
    flags=re.DOTALL
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied")