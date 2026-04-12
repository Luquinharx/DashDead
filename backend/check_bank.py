import requests
from datetime import datetime

r = requests.get('https://deadbb-2d5a8-default-rtdb.firebaseio.com/clan_logs/runs.json')
data = r.json()

max_date = None
max_time_str = "Nenhum dado"

if data:
    for run_key, run in data.items():
        if run and 'bank' in run:
            bank_data = run['bank']
            if isinstance(bank_data, dict):
                iterator = bank_data.values()
            elif isinstance(bank_data, list):
                iterator = [item for item in bank_data if isinstance(item, dict)]
            else:
                continue
                
            for doc in iterator:
                fields = doc.get('fields', {})
                if 'time' in fields:
                    t_str = fields['time']
                    try:
                        print("Encontrado:", t_str)
                        # O formato pode variar, vamos ver como ele é
                        if len(t_str.split()) > 1:
                            date_part, time_part = t_str.split(' ', 1)
                            d, m, y = map(int, date_part.split('/'))
                            H, M, S = map(int, time_part.split(':'))
                            dt = datetime(y, m, d, H, M, S)
                            
                            if not max_date or dt > max_date:
                                max_date = dt
                                max_time_str = t_str
                    except Exception as e:
                        print(f"Erro em {t_str}: {e}")

print("Ultima coleta de doação no banco:", max_time_str)
