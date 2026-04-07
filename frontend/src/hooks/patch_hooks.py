import re

def patch_file(filepath, name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove old functions in useClanData and useClanMemberData
    content = re.sub(r'/\*\*.*?getDayStartSaoPaulo\(\): Date \{.*?\n  return todayAt9;\n\}\n*', '', content, flags=re.DOTALL)
    
    # calculateDailyLoot
    content = re.sub(r'/\*\*.*?calculateDailyLoot\(username: string, weeklyLoots: number\): number \{.*?\n  \}\n\}\n*', '', content, flags=re.DOTALL)
    
    # useProfilesData calculateDailyTS
    content = re.sub(r'/\*\*.*?calculateDailyTS\(username: string, weeklyTS: number\): number \{.*?\n  \}\n\}\n*', '', content, flags=re.DOTALL)

    if "useClanData" in name:
        content = content.replace(
            "const dailyLoot = calculateDailyLoot(u, weeklyLoot); // Calculate daily based on 09:00 SP reset",
            "const dailyLoot = val.daily_loot_calc || 0; // Calculated by scraper"
        )
    elif "useClanMemberData" in name:
        content = content.replace(
            "const dailyLoot = calculateDailyLoot(username, weeklyLootsUser);",
            "const dailyLoot = data.daily_loot_calc || 0;"
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {name}")

patch_file(r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\hooks\useClanData.ts', 'useClanData')
patch_file(r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\hooks\useClanMemberData.ts', 'useClanMemberData')
patch_file(r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\hooks\useProfilesData.ts', 'useProfilesData')
