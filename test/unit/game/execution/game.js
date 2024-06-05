import assert from "node:assert";
import { Game } from "../../../../src/game/execution/game.js";
import { MockEngine } from "./game-interactor.js";
import { LogBook } from "../../../../src/game/state/log-book/log-book.js";
import { PossibleActionSourceSet } from "../../../../src/game/possible-actions/index.js";

class MockInteractor {
    constructor(opts) {
        this.opts = opts;
    }

    getLogBook() {
        return this.opts.gameData.logBook;
    }
}

class MockVersionConfig {
    getActionFactories(opts) {
        this.opts = opts;
        return new PossibleActionSourceSet([]);
    }
}

const createEngine = () => new MockEngine();
const createInteractor = opts => new MockInteractor(opts);
const getGameVersion = () => new MockVersionConfig();

describe("Game", () => {
    it("can load a basic game", async () => {
        const createAutoStartOfDay = () => {
            throw new Error("Auto start of day should not be construced if we don't have open hours");
        };

        let game = new Game({
            createEngine,
            createInteractor,
            getGameVersion,
            createAutoStartOfDay,
            gameDataPromise: Promise.resolve({
                logBook: LogBook.deserialize({
                    gameVersion: "3",
                    rawEntries: [],
                }),
            }),
        });

        assert.equal(game.getState(), "loading");
        assert.equal(game.getStatusText(), "Loading...");

        await game.loaded;

        assert.equal(game.getStatusText(), "Playing, last action: Start of day 1");
        assert.equal(game.getState(), "running");
    });
});
