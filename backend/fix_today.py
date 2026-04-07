import requests
import datetime
import pytz

DB_URL = "https://deadbb-2d5a8-default-rtdb.firebaseio.com"
sp_tz = pytz.timezone("America/Sao_Paulo")
now = datetime.datetime.now(sp_tz)
today = (now - datetime.timedelta(hours=9)).strftime("%Y-%m-%d")
yesterday = (now - datetime.timedelta(hours=9) - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

print(f"Applying fix for today: {today}, reading baseline from: {yesterday}")

old_daily = requests.get(f"{DB_URL}/daily/{yesterday}.json").json() or {}
snaps = requests.get(f"{DB_URL}/snapshots.json").json() or {}
profs = requests.get(f"{DB_URL}/profiles.json").json() or {}

fixed_count = 0
for username, data in old_daily.items():
    if username not in profs: continue
    if username not in snaps or today not in snaps[username]: continue
    
    old_loot = data.get("alltimeloot", 0)
    curr_loot = profs[username].get("all_time_loots", 0)
    curr_clan_loot = profs[username].get("all_time_clan_loots", 0)
    
    diff = curr_loot - old_loot
    if diff > 0:
        base_clan_loot = max(0, curr_clan_loot - diff)
        
        snap = snaps[username][today]
        current_snap_clan_loot = snap.get("all_time_clan_loots", 0)
        
        # If the currently saved base clan loot is higher than what it actually was at 09:00,
        # it means the early loots were "swallowed". So we lower the base back to the real 08:02 AM levels.
        if base_clan_loot < current_snap_clan_loot:
            snap["all_time_clan_loots"] = base_clan_loot
            snap["all_time_loots"] = old_loot
            requests.put(f"{DB_URL}/snapshots/{username}/{today}.json", json=snap)
            print(f"Fixed {username}: restored base clan loot from {current_snap_clan_loot} to {base_clan_loot} (diff = {diff})")
            fixed_count += 1
            
print(f"Finished fixing {fixed_count} users.")
