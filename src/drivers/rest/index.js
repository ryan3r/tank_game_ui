/* globals process */
import express from "express";
import path from "node:path";
import { GameManager } from "../game-file.js";
import { logger } from "#platform/logging.js"
import { makeHttpLogger } from "#platform/logging.js";
import { defineRoutes } from "./routes.js";
import { createEngine } from "../java-engine/engine-interface.js";

// If build info is supplied print it
const buildInfo = process.env.BUILD_INFO;

// Helper to make interacting with games easier for routes
function gameAccessor(gameManager) {
    return (req, res, next) => {
        function getGameIfAvailable() {
            const {loaded, error, sourceSet, interactor} = gameManager.getGame(req.params.gameName);

            if(error) {
                res.json({
                    error: `Failed to load game: ${error}`,
                });
                return {valid: false};
            }

            if(!loaded) {
                res.json({
                    error: {
                        message: "Game is still loading",
                        code: "game-loading",
                    }
                });
                return {valid: false};
            }

            return {valid: true, interactor, sourceSet};
        }

        req.games = {
            getGameIfAvailable,
            gameManager,
        };

        next();
    };
}

async function createGameManager(createEngine, saveUpdatedFiles) {
    const gamesFolder = path.join(process.env.TANK_GAMES_FOLDER || ".");
    const gameManager = new GameManager(gamesFolder, createEngine, { saveBack: saveUpdatedFiles });
    return gameManager;
}

const port = 3333;

(async () => {
    let gameManager = await createGameManager(createEngine, true /* save updated files */);

    const app = express();

    app.use(makeHttpLogger());
    app.use(express.json());
    app.use(gameAccessor(gameManager));

    defineRoutes(app, buildInfo);

    app.listen(port, () => {
        logger.info(`Listening on ${port}`);
    });
})();