import json
import datetime
import time
import requests
from nba_api.stats.endpoints import playercareerstats, commonallplayers
from nba_api.stats.library.http import NBAStatsHTTP

NBAStatsHTTP.timeout = 10

def fetch_player_data():
    # load existing cache (so i don’t re-fetch everyone)
    try:
        with open("player_seasons.json", "r") as f:
            player_cache = json.load(f)
    except FileNotFoundError:
        player_cache = {}

    current_year = datetime.datetime.now().year
    players = commonallplayers.CommonAllPlayers(is_only_current_season=0)\
        .get_data_frames()[0]
    players = players[players['FROM_YEAR'].astype(int) >= 1976]

    for i, (_, row) in enumerate(players.iterrows()):
        name = row['DISPLAY_FIRST_LAST']
        if name in player_cache:
            continue
        player_id = row['PERSON_ID']
        print(f"[{i}] (missing) Fetching {name}…")

        for attempt in range(3):
            try:
                career = playercareerstats.PlayerCareerStats(player_id=player_id)
                df = career.get_data_frames()[0]
                df = df[df['TEAM_ABBREVIATION'] != 'TOT']
                simplified = df[['TEAM_ID', 'SEASON_ID']].to_dict(orient='records')
                player_cache[name] = simplified
                break
            except Exception as e:
                print(f" Attempt {attempt+1} failed for {name}: {e}")
                time.sleep(1)
        else:
            print(f" Giving up on {name} after 3 attempts.")

    # overwrite the file with both old + newly fetched players
    with open("player_seasons.json", "w") as f:
        json.dump(player_cache, f, indent=2)


if __name__ == "__main__":
    fetch_player_data()
