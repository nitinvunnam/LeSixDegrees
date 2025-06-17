from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
import datetime
from datetime import date
import random
import json
import os

app = Flask(__name__)
CORS(app)

daily_data = {
    "date": "",
    "players": []
}

# Load cached player season data
with open("player_seasons.json", "r") as f:
    cached_season_data = json.load(f)

current_year = datetime.datetime.now().year

# Filter initial pool using cached season data
def get_filtered_player_names():
    with open("valid_initial_players.json", "r") as f:
        return json.load(f)
    
@app.route("/players", methods=["GET"])
def get_players(): 
    return jsonify(list(cached_season_data.keys()))  # Full dropdown pool

@app.route("/initial-players", methods=["GET"])
def initial_players():
    today = date.today().isoformat()
    if daily_data["date"] != today:
        daily_data["date"] = today
        daily_data["players"] = random.sample(get_filtered_player_names(), 2)
    return jsonify(daily_data["players"])

@app.route("/player-stats", methods=["GET"])
def player_stats():
    name = request.args.get("player")
    if name not in cached_season_data:
        return jsonify({"error": "Player not found"}), 404
    return jsonify(cached_season_data[name])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # use Render-assigned port
    app.run(host="0.0.0.0", port=port)
