
import os

path = r'c:\Users\Lucas\Desktop\dash\DashDead-main\frontend\src\hooks\useClanData.ts'
content = open(path, 'r', encoding='utf-8').read()

old_block = '''      const adjustedDate = new Date(spDate.getTime() - 8 * 60 * 60 * 1000);

      const yyyy = adjustedDate.getFullYear();
      const mm = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(adjustedDate.getDate()).padStart(2, '0');
      const todayStr = ${yyyy}--;'''

new_block = '''      const adjustedDate = new Date(spDate.getTime() - 8 * 60 * 60 * 1000);

      const yyyy = adjustedDate.getFullYear();
      const mm = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(adjustedDate.getDate()).padStart(2, '0');
      const todayStr = ${yyyy}--;

      // Snapshot 8 AM = End of Yesterday's logical day
      const yesterday = new Date(adjustedDate.getTime() - 24 * 60 * 60 * 1000);
      const yY = yesterday.getFullYear();
      const yM = String(yesterday.getMonth() + 1).padStart(2, '0');
      const yD = String(yesterday.getDate()).padStart(2, '0');
      const yesterdayStr = ${yY}--;'''

content = content.replace(old_block, new_block)

content = content.replace(
    '''fetch(${FIREBASE_URL}/daily/.json).catch(() => null),''',
    '''fetch(${FIREBASE_URL}/daily/.json).catch(() => null),'''
)

open(path, 'w', encoding='utf-8').write(content)

