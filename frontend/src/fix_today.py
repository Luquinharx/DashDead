import requests

DB = 'https://deadbb-2d5a8-default-rtdb.firebaseio.com'
today = '2026-04-07'
yesterday = '2026-04-06'

old_daily = requests.get(f'{DB}/daily/{yesterday}.json').json() or {}
snaps = requests.get(f'{DB}/snapshots.json').json() or {}
profs = requests.get(f'{DB}/profiles.json').json() or {}

fixed_count = 0
for u, data in old_daily.items():
    if u not in profs: continue
    if u not in snaps or today not in snaps[u]: continue
    
    old_loot = data.get('alltimeloot', 0)
    curr_loot = profs[u].get('all_time_loots', 0)
    curr_clan_loot = profs[u].get('all_time_clan_loots', 0)
    
    diff = curr_loot - old_loot
    if diff > 0:
        base_clan_loot = curr_clan_loot - diff
        if base_clan_loot < 0: base_clan_loot = 0
        
        snap = snaps[u][today]
        if base_clan_loot < snap.get('all_time_clan_loots', 0):
            snap['all_time_clan_loots'] = base_clan_loot
            snap['all_time_loots'] = old_loot
            requests.put(f'{DB}/snapshots/{u}/{today}.json', json=snap)
            print(f'Fixed {u}: restored base to {base_clan_loot}')
            fixed_count += 1
            
print(f'Finished fixing {fixed_count} users.')
