import json
from nba_api.stats.endpoints import commonallplayers

# 1. Load your cache
with open("player_seasons.json", "r") as f:
    cached_names = set(json.load(f).keys())

# 2. Fetch the same master list (1976+ filter)
players_df = (
    commonallplayers.CommonAllPlayers(is_only_current_season=0)
    .get_data_frames()[0]
)
players_df = players_df[players_df['FROM_YEAR'].astype(int) >= 1976]
all_names = set(players_df['DISPLAY_FIRST_LAST'])

# 3. Compare
missing = sorted(all_names - cached_names)
extra   = sorted(cached_names - all_names)

print(f"Expected players: {len(all_names)}")
print(f"Cached players:   {len(cached_names)}\n")

if missing:
    print(f" Missing {len(missing)} players:")
    for name in missing:
        print(" -", name)
else:
    print("All API players are cached!")

if extra:
    print(f"\n{len(extra)} extra entries (check for typos):")
    for name in extra:
        print(" -", name)
