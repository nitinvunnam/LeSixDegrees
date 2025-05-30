import { useEffect, useState, useRef, MouseEvent, ChangeEvent } from "react";
import { BarChart2, HelpCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatsSeason {
  TEAM_ID: string;
  SEASON_ID: string;
  [key: string]: any;
}

type SeasonsByTeam = Record<string, Set<string>>;

interface GameState {
  initialPlayers: string[];
  playerChain: string[];
  connectionResults: boolean[];
  counter: number;
  gameOver: boolean;
  seeResults: boolean;
  noFinish: boolean;
  lastUpdated: string; //to track when to reset
}

function App() {
  const [help, setHelp] = useState<boolean>(false);

  const [players, setPlayers] = useState<string[]>([]);
  const [initialPlayers, setInitialPlayers] = useState<string[]>([]);

  // New: track the full player connection chain (up to 8 degrees)
  const [playerChain, setPlayerChain] = useState<string[]>([]);
  const [connectedChain, setConnectedChain] = useState<string[]>([]);
  const [connectionResults, setConnectionResults] = useState<boolean[]>([]);

  const [searchText, setSearchText] = useState<string>("");
  const [filteredPlayers, setFilteredPlayers] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [gameModal, setGameModal] = useState<boolean>(false);

  const [noFinish, setNoFinish] = useState<boolean>(false);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [seeResults, setSeeResults] = useState<boolean>(false);

  const [playedTogether, setPlayedTogether] = useState<boolean>(false);

  const [counter, setCounter] = useState(0);

  const [statsModal, setStatsModal] = useState<{
    name: string;
    seasons: StatsSeason[];
  } | null>(null);

  //map of all team ids to team names

  const teams: Map<string, string> = new Map();

  teams.set("1610612737", "Atlanta Hawks");
  teams.set("1610612738", "Boston Celtics");
  teams.set("1610612739", "Cleveland Cavaliers");
  teams.set("1610612740", "New Orleans Pelicans");
  teams.set("1610612741", "Chicago Bulls");
  teams.set("1610612742", "Dallas Mavericks");
  teams.set("1610612743", "Denver Nuggets");
  teams.set("1610612744", "Golden State Warriors");
  teams.set("1610612745", "Houston Rockets");
  teams.set("1610612746", "Los Angeles Clippers");
  teams.set("1610612747", "Los Angeles Lakers");
  teams.set("1610612748", "Miami Heat");
  teams.set("1610612749", "Milwaukee Bucks");
  teams.set("1610612750", "Minnesota Timberwolves");
  teams.set("1610612751", "Brooklyn Nets");
  teams.set("1610612752", "New York Knicks");
  teams.set("1610612753", "Orlando Magic");
  teams.set("1610612754", "Indiana Pacers");
  teams.set("1610612755", "Philadelphia 76ers");
  teams.set("1610612756", "Phoenix Suns");
  teams.set("1610612757", "Portland Trail Blazers");
  teams.set("1610612758", "Sacramento Kings");
  teams.set("1610612759", "San Antonio Spurs");
  teams.set("1610612760", "Oklahoma City Thunder");
  teams.set("1610612761", "Toronto Raptors");
  teams.set("1610612762", "Utah Jazz");
  teams.set("1610612763", "Memphis Grizzlies");
  teams.set("1610612764", "Washington Wizards");
  teams.set("1610612765", "Detroit Pistons");
  teams.set("1610612766", "Charlotte Hornets");

  // Function to save game state to localStorage
  const saveGameState = () => {
    const gameState: GameState = {
      initialPlayers,
      playerChain,
      connectionResults,
      counter,
      gameOver,
      seeResults,
      noFinish,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem("gameState", JSON.stringify(gameState));
  };

  // Function to load game state from localStorage
  const loadGameState = () => {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      const gameState = JSON.parse(savedState);
      // Check if the saved state is from today
      const savedDate = new Date(gameState.lastUpdated);
      const today = new Date();
      if (savedDate.toDateString() === today.toDateString()) {
        setInitialPlayers(gameState.initialPlayers);
        setPlayerChain(gameState.playerChain);
        setConnectionResults(gameState.connectionResults);
        setCounter(gameState.counter);
        setGameOver(gameState.gameOver);
        setSeeResults(gameState.seeResults);
        setNoFinish(gameState.noFinish);
      } else {
        // Clear saved state if it's from a different day
        localStorage.removeItem("gameState");
      }
    }
  };

  // Recalculate connectedChain from initialPlayers[0], playerChain, and connectionResults
  useEffect(() => {
    if (initialPlayers.length === 2) {
      const chain = [initialPlayers[0]];
      for (let i = 0; i < playerChain.length; i++) {
        if (connectionResults[i]) {
          chain.push(playerChain[i]);
        }
      }
      setConnectedChain(chain);
    }
  }, [initialPlayers, playerChain, connectionResults]);

  const undoLastWin = () => {
    const degreeWins = JSON.parse(localStorage.getItem("degreeWins") || "[]");
    degreeWins.push(connectedChain.length);
    localStorage.setItem("degreeWins", JSON.stringify(degreeWins));
  };

  // Load game state on component mount
  useEffect(() => {
    loadGameState();
  }, []);

  // Save game state whenever relevant state changes
  useEffect(() => {
    if (initialPlayers.length > 0) {
      saveGameState();
    }
  }, [
    initialPlayers,
    playerChain,
    connectionResults,
    counter,
    gameOver,
    seeResults,
    noFinish,
  ]);

  // Fetch all available player names
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("http://localhost:5001/players");
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };
    fetchPlayers();
  }, []);

  // Modify the fetchInitialPlayers function to only fetch if no saved state exists
  useEffect(() => {
    const fetchInitialPlayers = async () => {
      const savedState = localStorage.getItem("gameState");
      if (!savedState) {
        try {
          const response = await fetch("http://localhost:5001/initial-players");
          const data = await response.json();
          setInitialPlayers(data);
        } catch (error) {
          console.error("Error fetching initial players:", error);
        }
      }
    };
    fetchInitialPlayers();
  }, []);

  // Dropdown keyboard support and outside click logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const handleKeyPressed = (event: KeyboardEvent | any) => {
      const maxVisible = 20;
      const isVisible =
        filteredPlayers.length > maxVisible
          ? maxVisible
          : filteredPlayers.length;
      if (event.key == "Escape") {
        setShowDropdown(false);
      }

      if (!showDropdown) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % isVisible);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + isVisible) % isVisible);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredPlayers.length) {
          selectPlayer(filteredPlayers[activeIndex]);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyPressed);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyPressed);
    };
  }, [showDropdown, activeIndex, filteredPlayers]);

  // Handle special characters in search filtering
  const normalizeString = (str: string) =>
    str.normalize("NFKD").replace(/\p{M}/gu, "");

  // Filter players live based on search input
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value;
    setSearchText(searchValue);

    if (searchValue.trim() === "") {
      setFilteredPlayers(players);
      setShowDropdown(false);
    } else {
      const filtered = players.filter((player) =>
        normalizeString(player)
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      );
      setFilteredPlayers(filtered);
      setShowDropdown(true);
    }
  };

  const showStats = async (player: string) => {
    try {
      const resp = await fetch(
        `http://localhost:5001/player-stats?player=${encodeURIComponent(
          player
        )}`
      );
      if (!resp.ok) throw new Error("Player not found");
      const seasons: StatsSeason[] = await resp.json();
      setStatsModal({ name: player, seasons });
    } catch (e) {
      console.error(e);
    }
  };

  async function checkConnection(a: string, b: string): Promise<boolean> {
    //fetch player typed and previous player
    const [respA, respB] = await Promise.all([
      fetch(
        `http://localhost:5001/player-stats?player=${encodeURIComponent(a)}`
      ),
      fetch(
        `http://localhost:5001/player-stats?player=${encodeURIComponent(b)}`
      ),
    ]);

    // makes fetched data usable JS stuff
    const [seasonsA, seasonsB] = await Promise.all([
      respA.json(),
      respB.json(),
    ]);

    for (let i = 0; i < seasonsA.length; i++) {
      for (let j = 0; j < seasonsB.length; j++) {
        if (
          seasonsA[i].TEAM_ID === seasonsB[j].TEAM_ID &&
          seasonsA[i].SEASON_ID === seasonsB[j].SEASON_ID
        ) {
          console.log("Match found:", {
            team: seasonsA[i].TEAM_ID,
            season: seasonsA[i].SEASON_ID,
          });
          return true;
        }
      }
    }
    console.log("match not found");
    return false;
  }

  // New: Add selected player to the chain
  const selectPlayer = async (player: string) => {
    if (playerChain.length >= 8) return; // prevent overflow
    setSearchText(""); // clear input
    setShowDropdown(false);
    setActiveIndex(0); // reset keyboard nav

    const prev =
      connectedChain.length == 0
        ? initialPlayers[0]
        : connectedChain[connectedChain.length - 1];

    let connected = false;

    try {
      connected = await checkConnection(player, prev);
    } catch (error) {
      console.error("Error checking connection:", error);
    }

    const newChain = [...playerChain, player];
    setPlayerChain(newChain);
    setPlayedTogether(connected);
    setConnectionResults((prev) => [...prev, connected]);

    if (connected) {
      setConnectedChain((prevChain) => [...prevChain, player]);
      setCounter(counter + 1);
    }

    if (player == initialPlayers[1] && connected) {
      const degreeWins = JSON.parse(localStorage.getItem("degreeWins") || "[]");
      degreeWins.push(playerChain.length);
      localStorage.setItem("degreeWins", JSON.stringify(degreeWins));
      setGameOver(true);
      setGameModal(true);
      setSeeResults(true);
    }
    if (newChain.length == 8 && player != initialPlayers[1]) {
      setNoFinish(true);
      setSeeResults(true);
    }
  };

  useEffect(() => {
    console.log("playerChain:", playerChain);
    console.log("connectionResults:", connectionResults);
  }, [playerChain, connectionResults]);

  // Helper function to group seasons into stints
  function groupSeasonsIntoStints(seasons: string[]): string[][] {
    if (seasons.length === 0) return [];
    // Sort seasons (assuming format 'YYYY-YY')
    const sorted = seasons.slice().sort();
    const stints: string[][] = [];
    let currentStint: string[] = [sorted[0]];

    function nextSeason(season: string) {
      // e.g. '2005-06' => 2005
      const [start] = season.split("-");
      return (
        String(Number(start) + 1) +
        "-" +
        String(Number(start.slice(2)) + 1).padStart(2, "0")
      );
    }

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (nextSeason(prev) === curr) {
        currentStint.push(curr);
      } else {
        stints.push(currentStint);
        currentStint = [curr];
      }
    }
    stints.push(currentStint);
    return stints;
  }

  // Helper function to format a stint as multiple lines for the modal
  function formatStintLines(stint: string[]): string[] {
    if (stint.length === 1) {
      return [stint[0]];
    } else {
      return [stint[0], `until ${stint[stint.length - 1]}`];
    }
  }

  const chartData = Array.from({ length: 8 }, (_, i) => {
    const degreeWins: number[] = JSON.parse(
      localStorage.getItem("degreeWins") || "[]"
    );
    const degree = i + 1;
    const count = degreeWins.filter((d: number) => d === degree).length;
    return {
      name: degree,
      count,
    };
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mt-3">
        <div className="flex items-center space-x-4">
          <h1 className="text-5xl font-bold font-sans">🏀 LeSixDegrees</h1>
          <div className="h-12 w-[4px] bg-white"></div>
          <h1 className="text-3xl font-bold font-sans text-center transition-transform duration-200 hover:scale-105">
            Daily Basketball Trivia
          </h1>
        </div>
        <div className="flex items-center">
          {seeResults && (
            <button
              className={`text-2xl p-3 rounded-md transition-transform duration-200 hover:opacity-50 
                text-white`}
              onClick={() =>
                gameOver ? setGameModal(true) : setNoFinish(true)
              }
            >
              <BarChart2 className="w-10 h-10" />
            </button>
          )}

          <button
            className={`text-2xl p-3 rounded-md transition-transform duration-200 hover:opacity-50 
          text-white`}
            onClick={() => setHelp(!help)}
          >
            <HelpCircle className="w-10 h-10" />
          </button>
        </div>
      </div>

      {/* Help Box */}
      {help && (
        <div className="flex items-start justify-center">
          <div className="bg-gray-700 w-1/2 rounded-lg mt-5 p-5">
            <h1 className="text-2xl font-bold text-center py-4">How to Play</h1>
            <div className="mx-auto h-1 rounded-md w-19/20 mb-2.5 bg-white"></div>
            <p className="ml-3">
              The goal is to connect both players through common teammates.{" "}
              <br />
              <br />
              The number of teammates you need to connect the two is the degrees
              of separation. You have a maximum of 8 degrees to connect the
              players.
              <br />
              <br />
              <span className="font-bold">
                Example: Connect LeBron ➡️ Jordan
              </span>{" "}
              <br />
              <br />
              LeBron ➡️ Shaq (1st degree) <br />
              Shaq ➡️ Rodman (2nd degree) <br />
              Rodman ➡️ Jordan (3rd degree) <br />
              <br />
              If you need some hints click on the initial players' names to see
              what teams they played on and what years.
            </p>
          </div>
          <button
            className="absolute mt-5 right-[18%] bg-white text-black font-bold p-3 rounded-lg 
              transition-transform duration-200 hover:scale-110"
            onClick={() => setHelp(false)}
          >
            Close
          </button>
        </div>
      )}

      {/* Main gameplay container */}
      <div className="p-4 mt-10 shadow-lg rounded">
        <h3 className="text-2xl font-bold text-center">
          {initialPlayers.length === 2 && (
            <>
              Connect{" "}
              <span
                className="cursor-pointer hover:text-blue-300"
                onClick={() => showStats(initialPlayers[0])}
              >
                {initialPlayers[0]}
              </span>{" "}
              ➡️{" "}
              <span
                className="cursor-pointer hover:text-blue-300"
                onClick={() => showStats(initialPlayers[1])}
              >
                {initialPlayers[1]}
              </span>
            </>
          )}
        </h3>
        {/*Visualize the path of selected players */}
        <div className="mt-4 mx-auto w-1/2">
          {playerChain.map((player, i) => {
            const wasConnected = connectionResults[i];
            if (i === 0) {
              return (
                <div
                  key={i}
                  className={`text-center font-semibold text-lg my-2 p-2 rounded ${
                    wasConnected ? "bg-green-600" : "bg-red-500"
                  }`}
                >
                  {`${initialPlayers[0]} ➡️ ${player}`}
                </div>
              );
            }

            let connectionSource = "";

            let successfulConnectionsBeforeIndex = 0;
            for (let j = 0; j < i; j++) {
              if (connectionResults[j]) {
                successfulConnectionsBeforeIndex++;
              }
            }

            connectionSource = connectedChain[successfulConnectionsBeforeIndex];

            console.log(wasConnected);
            return (
              <div
                key={i}
                className={`text-center font-semibold text-lg my-2 p-2 rounded ${
                  wasConnected ? "bg-green-600" : "bg-red-500"
                }`}
              >
                {`${connectionSource} ➡️ ${player}`}
              </div>
            );
          })}
        </div>

        <button
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
          onClick={undoLastWin}
        >
          Undo Last Win
        </button>

        {/*Show one dynamic dropdown at a time, until 8 degrees max */}
        {playerChain.length < 8 && !gameOver && (
          <div className="relative mx-auto w-1/2 mt-6" ref={dropdownRef}>
            <input
              type="text"
              placeholder={`${
                playerChain.length === 0
                  ? `${initialPlayers[0]} played with...`
                  : `${
                      connectedChain[connectedChain.length - 1]
                    } played with...`
              }`}
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchText}
              onChange={handleSearchChange}
              onClick={() => setShowDropdown(true)}
            />
            {showDropdown && filteredPlayers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredPlayers.slice(0, 20).map((player, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    className={`p-2 cursor-pointer text-black 
                      ${
                        index === activeIndex
                          ? "bg-blue-200 font-semibold"
                          : "hover:bg-gray-200"
                      }`}
                    onClick={() => selectPlayer(player)}
                  >
                    {player}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Game Over Modal */}
      {gameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-slate-300 p-6 rounded-lg shadow-lg text-black text-center w-4/5 sm:w-1/2 lg:w-1/3">
            <h2 className="text-2xl font-bold mb-4">🎉 You Won!</h2>
            <p>
              You completed the game in {connectedChain.length - 1} degrees!
            </p>
            <div className="mx-auto mt-6 w-full max-w-md h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#C9ADDC" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <button
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-400 transition"
              onClick={() => setGameModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {noFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-slate-300 p-6 rounded-lg shadow-lg text-black text-center w-4/5 sm:w-1/2 lg:w-1/3">
            <h2 className="text-2xl font-bold mb-4">😔 Game over</h2>
            <p>You ran out of connections, but try again tomorrow!</p>
            <button
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-400 transition"
              onClick={() => setNoFinish(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {statsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-600 p-6 rounded-lg shadow-lg w-4/5 max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {statsModal.name}’s Teams & Seasons
            </h2>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {Object.entries(
                statsModal.seasons.reduce<SeasonsByTeam>(
                  (acc, { TEAM_ID, SEASON_ID }) => {
                    if (!acc[TEAM_ID]) acc[TEAM_ID] = new Set<string>();
                    acc[TEAM_ID].add(SEASON_ID);
                    return acc;
                  },
                  {} as SeasonsByTeam
                )
              )
                // Sort teams by the earliest season (rookie year to retirement)
                .sort((a, b) => {
                  const aFirst = Array.from(a[1]).sort()[0];
                  const bFirst = Array.from(b[1]).sort()[0];
                  return aFirst.localeCompare(bFirst);
                })
                .map(([team, seasonsSet]) => (
                  <div key={team}>
                    <p className="font-semibold">{teams.get(team)}:</p>
                    <ul className="list-disc list-inside ml-4">
                      {groupSeasonsIntoStints(Array.from(seasonsSet)).map(
                        (stint, idx) =>
                          formatStintLines(stint).map((line, i) => (
                            <li key={idx + "-" + i}>{line}</li>
                          ))
                      )}
                    </ul>
                  </div>
                ))}
            </div>
            <button
              className="mt-4 px-4 py-2 bg-gray-800 items-center text-white rounded hover:bg-gray-400"
              onClick={() => setStatsModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
