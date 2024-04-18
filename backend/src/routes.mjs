import express from "express";
import fs from "node:fs";
import path from "node:path";

const STATIC_DIR = "../www";

export function defineRoutes(app) {
    try {
        fs.accessSync(STATIC_DIR);
        app.use(express.static(STATIC_DIR));
        logger.info(`Serving static files from: ${path.resolve(STATIC_DIR)}`);
    }
    catch(err) {}

    app.get("/api/games", async (req, res) => {
        res.json(req.games.gameManager.getAllGames());
    });

    app.get("/api/game/:gameName/", (req, res) => {
        const game = req.games.getGameIfAvailable();
        if(!game) return;

        res.json({
            logBook: game.getLogBook().serialize(),
            config: req.games.config.serialize(),
        });
    });

    app.get("/api/game/:gameName/turn/:turnId", (req, res) => {
        const game = req.games.getGameIfAvailable();
        if(!game) return;

        const state = game.getGameStateById(req.params.turnId);
        res.json(state && state.serialize());
    });

    app.post("/api/game/:gameName/turn", async (req, res) => {
        const game = req.games.getGameIfAvailable();
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
        const game = req.games.getGameIfAvailable();
        if(!game) return;

        res.json(game.getActionTemplate());
    });

    app.use(function(req, res) {
        res.sendFile(path.resolve(path.join(STATIC_DIR, "index.html")));
    });
}