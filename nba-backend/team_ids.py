from nba_api.stats.static import teams

# Retrieve the list of NBA teams
nba_teams = teams.get_teams()

# Create a dictionary mapping team IDs to team full names
team_id_map = {team['id']: team['full_name'] for team in nba_teams}

# Display the team IDs and their corresponding names
for team_id, name in team_id_map.items():
    print(f'{team_id}, "{name}"')