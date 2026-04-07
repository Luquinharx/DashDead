import codecs
with codecs.open('c:/Users/Lucas/Desktop/dash/DashDead-main/backend/scraper_v2.py', 'r', 'utf-8') as f:
    text = f.read()

target = '        user_data["daily_ts_calc"] = daily_ts'
replacement = '        daily_loot = user_data.get("all_time_loots", 0) - snapshot_data.get("all_time_loots", user_data.get("all_time_loots", 0))\n' + target

text = text.replace(target, replacement)

with codecs.open('c:/Users/Lucas/Desktop/dash/DashDead-main/backend/scraper_v2.py', 'w', 'utf-8') as f:
    f.write(text)
