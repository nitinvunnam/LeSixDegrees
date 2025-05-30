from nba_api.stats.static import teams

nba_teams = teams.get_teams()

team_id_map = {team['id']: team['full_name'] for team in nba_teams}

for team_id, name in team_id_map.items():
    print(f'{team_id}, "{name}"')
