const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDetailsTableToPascalCase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT
        *
        FROM
        player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsTableToPascalCase(eachPlayer)
    )
  );
});

// Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
        SELECT
        *
        FROM 
        player_details
        WHERE
        player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsTableToPascalCase(player));
});

// Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE
        player_details
        SET
        player_name = '${playerName}'
        WHERE 
        player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

const convertMatchDetailsTableToPascalCase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetails = `
        SELECT
        *
        FROM 
        match_details
        WHERE 
        match_id = ${matchId};`;
  const match = await db.get(getMatchDetails);
  response.send(convertMatchDetailsTableToPascalCase(match));
});

// Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getAllMatchesOfPlayerQuery = `
        SELECT
        *
        FROM 
        player_match_score NATURAL JOIN match_details
        WHERE
        player_id = ${playerId};`;
  const playerMatchesArray = await db.all(getAllMatchesOfPlayerQuery);
  response.send(
    playerMatchesArray.map((eahMatch) =>
      convertMatchDetailsTableToPascalCase(eahMatch)
    )
  );
});

// Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchPlayersQuery = `
        SELECT 
        *
        FROM
        player_match_score NATURAL JOIN player_details
        WHERE 
        match_id = ${matchId};`;
  const matchPlayersArray = await db.all(getMatchPlayersQuery);
  response.send(
    matchPlayersArray.map((eachPlayer) =>
      convertPlayerDetailsTableToPascalCase(eachPlayer)
    )
  );
});

// Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerScoreQuery = `
        SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
        FROM 
        player_match_score NATURAL JOIN player_details
        WHERE 
        player_id = ${playerId};`;
  const playerScore = await db.get(getPlayerScoreQuery);
  response.send(playerScore);
});

module.exports = app;
