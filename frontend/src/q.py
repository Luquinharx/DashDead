import requests
r=requests.get('https://deadbb-2d5a8-default-rtdb.firebaseio.com/members_scrapes.json?orderBy=""&limitToLast=2')
for k,v in r.json().items(): print(k, type(v))
