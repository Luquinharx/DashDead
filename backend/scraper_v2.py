# -*- coding: utf-8 -*-
import os
import logging
import re
from datetime import datetime
import pytz
import requests
from bs4 import BeautifulSoup
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

# Config
CLAN_URL = "https://www.dfprofiler.com/clan/view/2166"
BASE_URL = "https://www.dfprofiler.com"
FIREBASE_DB_URL = os.getenv("FIREBASE_DB_URL", "https://deadbb-2d5a8-default-rtdb.firebaseio.com/")
USER_AGENT = "Mozilla/5.0 (compatible; scraper/2.0)"
BRAZIL_TZ = pytz.timezone("America/Sao_Paulo")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

def parse_int(text):
    if not text:
        return 0
    s = "".join(ch for ch in text if ch.isdigit() or ch == '-')
    return int(s) if s and s != '-' else 0

def get_rank_and_score(months_in_clan, clan_loots, donated_amt=0):
    """
    Ranks:
    1. IronHeart (Not specified, assumed highest)
    2. High Warden (Not specified)
    3. Blade Master (40M)
    4. Guardian (15M)
    5. Gate Soldier (1M)
    6. Street Cleaner (starting)

    Rules:
    1 month = 7m
    1k clan loots = 500k
    1mil donated = 1mil
    """
    score = (months_in_clan * 7_000_000) + ((clan_loots / 1000.0) * 500_000) + donated_amt
    
    if score >= 40_000_000:
        rank = "Blade Master" # Pode ser ajustado para incluir IronHeart/High Warden caso as metas sejam conhecidas
    elif score >= 15_000_000:
        rank = "Guardian"
    elif score >= 1_000_000:
        rank = "Gate Soldier"
    else:
        rank = "Street Cleaner"
        
    return rank, int(score)

def parse_profile(profile_url):
    try:
        r = requests.get(profile_url, headers={"User-Agent": USER_AGENT}, timeout=15)
        r.raise_for_status()
    except Exception as e:
        logging.error(f"Erro ao acessar perfil: {profile_url} - {e}")
        return {}

    soup = BeautifulSoup(r.text, "html.parser")
    data = {}
    
    for div in soup.find_all("div", class_=["col-md-6", "col-sm-3"]):
        h4 = div.find("h4")
        if h4:
            # Buscar no nó seguinte ou dentro do div
            content_div = div.find("div", class_="display") or div.find("div", class_="pdata")
            if content_div:
                key = h4.get_text(strip=True).lower().replace(" ", "_").replace("?", "")
                val_text = content_div.get_text(strip=True)
                data[key] = val_text
            else:
                # Pode estar direto text-align etc
                # Tratamento básico para fallback
                pass
                
    # Fallback se a estrutura pdata/display falhar, varremos text nodes:
    if not data:
        for div in soup.find_all("div", class_="col-md-6"):
            text_parts = list(div.stripped_strings)
            # Geralmente o formato é "Weekly TS" "783,730,354"
            if len(text_parts) >= 2:
                key = text_parts[0].lower().replace(" ", "_").replace("?", "")
                # Valores com pipes Ex: Last Players Killed | Cancerbero | ...
                val = "".join(text_parts[1:])
                data[key] = val
                
    return data

def scrape_and_push():
    logging.info("Iniciando scrape na página do clã para obter links de perfil...")
    try:
        resp = requests.get(CLAN_URL, headers={"User-Agent": USER_AGENT}, timeout=20)
        resp.raise_for_status()
    except Exception:
        logging.exception("Erro ao buscar a página do clã")
        return
        
    soup = BeautifulSoup(resp.text, "html.parser")
    table = None
    for t in soup.find_all("table"):
        if t.find("a", href=re.compile(r"/profile/view/")):
            table = t
            break
            
    if not table:
        logging.error("Tabela de membros não encontrada")
        return
        
    members = []
    # Coleta username e href de cada um
    for a in table.find_all("a", href=re.compile(r"/profile/view/")):
        name = a.get_text(strip=True)
        if name:
            members.append({"username": name, "url": BASE_URL + a["href"]})
        
    now_iso = datetime.now(tz=BRAZIL_TZ).isoformat()
    logging.info(f"Encontrados {len(members)} membros no clã. Iniciando scraping por perfil...")
    
    for m in members:
        logging.info(f"Scraping perfil de {m['username']} ({m['url']})")
        pdata = parse_profile(m["url"])
        
        # Mapeamento e limpeza de dados
        user_data = {
            "username": m["username"],
            "collected_at": now_iso,
            
            # --- TS Records ---
            "weekly_ts": parse_int(pdata.get("weekly_ts", "0")),
            "clan_weekly_ts": parse_int(pdata.get("clan_weekly_ts", "0")),
            "exp_since_death": parse_int(pdata.get("exp_since_death", "0")),
            "all_time_ts": parse_int(pdata.get("all_time_ts", "0")),
            "total_exp": parse_int(pdata.get("total_exp", "0")),
            "expected_loss_on_death": parse_int(pdata.get("expected_loss_on_death", "0")),
            
            # --- TPK Records ---  (Coletados mas você pode optar por não exibir no frontend ainda)
            "daily_tpk": parse_int(pdata.get("daily_tpk", "0")),
            "weekly_tpk": parse_int(pdata.get("weekly_tpk", "0")),
            "clan_weekly_tpk": parse_int(pdata.get("clan_weekly_tpk", "0")),
            "all_time_tpk": parse_int(pdata.get("all_time_tpk", "0")),
            "last_players_killed": pdata.get("last_players_killed", ""),
            "last_hit_by": pdata.get("last_hit_by", ""),
            
            # --- Loot Records ---
            "weekly_loots": parse_int(pdata.get("weekly_loots", "0")),
            "all_time_loots": parse_int(pdata.get("all_time_loots", "0")),
            "clan_weekly_loots": parse_int(pdata.get("clan_weekly_loots", "0")),
            "all_time_clan_loots": parse_int(pdata.get("all_time_clan_loots", "0")),
            
            # --- Misc ---
            "last_clan_join": pdata.get("last_clan_join", "")
        }
        
        # Rank / Hierarquia
        months = 0
        try:
            if user_data["last_clan_join"]:
                # Formato usualmente retornado M/D/Y ou MM/DD/YYYY
                join_date = datetime.strptime(user_data["last_clan_join"], "%m/%d/%Y") 
                # Considera tempo local vs braziltz - ok usar naive pra dias
                months = (datetime.now() - join_date).days // 30
        except Exception as e:
            # Em caso da data não estar em um formato esperado
            pass
            
        rank, score = get_rank_and_score(months, user_data["all_time_clan_loots"])
        user_data["rank"] = rank
        user_data["rank_score"] = score
        
        # Salva no Firebase substituindo a lógica antiga de snapshots pontuais por enquanto 
        # (Ou pode adicionar a lógica de "daily / weekly snapshots" que tinha no outro usando esses dados)
        safe_username_key = requests.utils.requote_uri(m["username"])
        url = FIREBASE_DB_URL.rstrip('/') + f"/profiles/{safe_username_key}.json"
        try:
            requests.put(url, json=user_data, timeout=10)
        except Exception as e:
            logging.error(f"Erro ao salvar DB para {m['username']}: {e}")

    logging.info("Scrape de perfis concluído com sucesso.")

if __name__ == "__main__":
    scrape_and_push()
