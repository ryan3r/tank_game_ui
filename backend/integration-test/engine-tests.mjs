// A suite of tests to make sure we're properly interfacing with the engine

import assert from "node:assert";
import { GameInteractor } from "../../common/game/game-interactor.mjs";
import { LogBook } from "../../common/state/log-book/log-book.mjs";
import { loadConfig, loadConfigAndGames } from "../src/config-loader.mjs";
import { load } from "../src/game-file.mjs";
import { logger } from "../src/logging.mjs";

export function defineTestsForEngine(createEngine) {
    function defTest(name, testFunc) {
        // Disable the tests if we don't have a given engine on hand
        let register = createEngine === undefined ? xit : it;

        register(name, async () => {
            logger.debug(`[integration-test] Starting ${name}`);

            try {
                await testFunc();
            }
            finally {
                logger.debug(`[integration-test] Finished ${name}`);
            }
        });
    }

    const TEST_GAME_PATH = "../example/tank_game_v3.json";

    defTest("can process the entire example folder", async () => {
        let { gameManager } = await loadConfigAndGames(createEngine);
        try {
            await gameManager.loaded;

            await Promise.all(
                gameManager.getAllGames().map(gameName => {
                    return gameManager.getGamePromise(gameName);
                })
            );
        }
        finally {
            await gameManager.shutdown();
        }
    });

    defTest("can process actions together and individually", async () => {
        const config = await loadConfig();
        let { logBook, initialGameState } = await load(TEST_GAME_PATH, config);
        let emptyLogBook = new LogBook(logBook.gameVersion, [], config.getGameVersion(logBook.gameVersion));

        let fullEngine = createEngine();
        let incrementalEngine = createEngine();
        try {
            // Create one instance that starts with the log book full
            // This triggers a set version, set state, and a series of process actions
            logger.debug("[integration-test] Process actions as a group");
            let fullInteractor = new GameInteractor(fullEngine, { logBook, initialGameState });
            await fullInteractor.loaded;

            // Create another instance that starts with no log enties and has then added
            // This triggers a set version and then a set state and process action for each entry
            logger.debug("[integration-test] Process individual actions");
            let incrementalInteractor = new GameInteractor(incrementalEngine, { logBook: emptyLogBook, initialGameState });

            for(const entry of logBook) {
                await incrementalInteractor.addLogBookEntry(entry.rawLogEntry);

                // Compare the states and make sure they match
                assert.deepEqual(fullInteractor.getGameStateById(entry.id), incrementalInteractor.getGameStateById(entry.id));
            }
        }
        finally {
            await Promise.all([
                fullEngine.shutdown(),
                incrementalEngine.shutdown(),
            ]);
        }
    });
}