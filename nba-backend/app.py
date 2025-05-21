from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
from nba_api.stats.endpoints import commonallplayers, commonplayerinfo
import datetime
from datetime import date
import random
import json
import os

app = Flask(__name__)
CORS(app)

IP_FILE = "daily_initial_players.json"

def load_daily_players():
    if os.path.exists(IP_FILE):
        with open(IP_FILE, "r") as f:
            return json.load(f)
    return {"date": "", "players": []}

def save_daily_players(date_str, players):
    with open(IP_FILE, "w") as f:
        json.dump({"date": date_str, "players": players}, f)

# Load cached player season data
with open("player_seasons.json", "r") as f:
    cached_season_data = json.load(f)

current_year = datetime.datetime.now().year

# Get all players (to apply initial player filtering only)
allPlayers = commonallplayers.CommonAllPlayers(is_only_current_season=0)
all_new = commonplayerinfo.CommonPlayerInfo
players_df = allPlayers.get_data_frames()[0]

# Post-merger filter (standard for both uses)
players_df = players_df[players_df['FROM_YEAR'].astype(int) >= 1976]
players_df['TO_YEAR'] = players_df['TO_YEAR'].apply(
    lambda x: current_year if x == 'Active' else int(x)
)
players_df['FROM_YEAR'] = players_df['FROM_YEAR'].astype(int)

# 🎯 This filter applies only to initial challenge players
players_df = players_df[
    ((players_df['TO_YEAR'] - players_df['FROM_YEAR']) >= 4) |
    (players_df['FROM_YEAR'] >= 2019)
]

# Used for selecting initial challenge players
players_names = players_df['DISPLAY_FIRST_LAST']

@app.route("/players", methods=["GET"])
def get_players(): 
    return jsonify(list(cached_season_data.keys()))  # Full dropdown pool

@app.route("/initial-players", methods=["GET"])
def initial_players():
    today = date.today().isoformat()
    data = load_daily_players()
    if data["date"] != today:
        random_players = random.sample(players_names.tolist(), 2)
        save_daily_players(today, random_players)
        return jsonify(random_players)  # Filtered pool
    else:
        return jsonify(data["players"])

@app.route("/player-stats", methods=["GET"])
def player_stats():
    name = request.args.get("player")
    if name not in cached_season_data:
        return jsonify({"error": "Player not found"}), 404
    return jsonify(cached_season_data[name])

if __name__ == "__main__":
    app.run(port=5001, debug=True)

