import express from "express";
import fs from "node:fs";
import { logger } from "./logging.mjs"
import path from "node:path";
import { makeHttpLogger } from "./logging.mjs";
import { GameManager } from "./game-file.mjs";
import { Config } from "../../common/state/config/config.mjs";
import { createEngine } from "./java-engine/engine-interface.mjs";

// If build info is supplied print it
const buildInfo = process.env.BUILD_INFO;
if(buildInfo) logger.info(`Build info: ${buildInfo}`);

const PORT = 3333;
const STATIC_DIR = "../www";

const app = express();

app.use(makeHttpLogger());
app.use(express.json());

try {
    fs.accessSync(STATIC_DIR);
    app.use(express.static(STATIC_DIR));
    logger.info(`Serving static files from: ${path.resolve(STATIC_DIR)}`);
}
catch(err) {}

function checkGame(req, res) {
    const {loaded, error, interactor} = gameManager.getGame(req.params.gameName);

    if(error) {
        res.json({
            error: `Failed to load game: ${error}`,
        });
        return;
    }

    if(!loaded) {
        res.json({
            error: "Game is still loading"
        });
        return;
    }

    return interactor;
}

// Load the games
let config = new Config({
    gameVersionConfigs: {},
    backend: {
        gamesFolder: process.env.TANK_GAMES_FOLDER,
    },
});
let gameManager = new GameManager(config, createEngine);


app.get("/api/games", async (req, res) => {
    res.json(gameManager.getAllGames());
});

app.get("/api/game/:gameName/", (req, res) => {
    const game = checkGame(req, res);
    if(!game) return;

    res.json({
        logBook: game.getLogBook().serialize(),
        config: config.serialize(),
    });
});

app.get("/api/game/:gameName/turn/:turnId", (req, res) => {
    const game = checkGame(req, res);
    if(!game) return;

    const state = game.getGameStateById(req.params.turnId);
    res.json(state && state.serialize());
});

app.post("/api/game/:gameName/turn", async (req, res) => {
    const game = checkGame(req, res);
    if(!game) return;

    try {
        await game.addLogBookEntry(req.body);
        req.log.info({ msg: "Added log book entry", entry: req.body });
        res.json({ success: true });
    }
    catch(err) {
        req.log.info({ msg: "Rejected log book entry", entry: req.body });
        res.json({ success: false, error: err.message });
    }
});

app.get("/api/game/:gameName/action-template", async (req, res) => {
    const game = checkGame(req, res);
    if(!game) return;

    res.json(game.getActionTemplate());
});

app.use(function(req, res) {
    res.sendFile(path.resolve(path.join(STATIC_DIR, "index.html")));
});

app.listen(PORT, () => {
    logger.info(`Listening on ${PORT}`);
});
