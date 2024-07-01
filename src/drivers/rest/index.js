/* globals process */
import express from "express";
import { createGameManager } from "../game-file.js";
import { logger } from "#platform/logging.js"
import { makeHttpLogger } from "#platform/logging.js";
import { defineRoutes } from "./routes.js";
import { createEngine } from "../java-engine/engine-interface.js";

// If build info is supplied print it
const buildInfo = process.env.BUILD_INFO;

// Helper to make interacting with games easier for routes
function gameAccessor(gameManager) {
    return (req, res, next) => {
        function getGameIfAvailable(name) {
            const game = gameManager.getGame(name || req.params.gameName);

            if(!game) {
                res.json({
                    error: `${req.params.gameName} is not a game`,
                });
                return {valid: false};
            }

            if(game.getState() == "error") {
                res.json({
                    error: game.getStatusText(),
                });
                return {valid: false};
            }

            if(game.getState() == "loading") {
                res.json({
                    error: {
                        message: "Game is still loading",
                        code: "game-loading",
                    }
                });
                return {valid: false};
            }

            return {valid: true, interactor: game.getInteractor(), game};
        }

        req.games = {
            getGameIfAvailable,
            gameManager,
        };

        next();
    };
}

const port = 3333;
let gameManager = createGameManager(createEngine, false /* save updated files */);

const app = express();

app.use(makeHttpLogger());
app.use(express.json());
app.use(gameAccessor(gameManager));

defineRoutes(app, buildInfo);

app.listen(port, () => {
    logger.info(`Listening on ${port}`);
});
