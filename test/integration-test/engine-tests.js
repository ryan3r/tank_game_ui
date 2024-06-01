// A suite of tests to make sure we're properly interfacing with the engine
import fs from "node:fs";
import { createGameManager } from "../../src/drivers/game-file.js";
import { logger } from "#platform/logging.js";
import { getAllVersions } from "../../src/versions/index.js";
import { testPossibleActions } from "./engine-tests/possible-actions.js";
import { incrementalPlaythrough } from "./engine-tests/incremental-playthrough.js";


function exists(filePath) {
    try {
        fs.accessSync(filePath);
        return true;
    }
    catch(err) {
        return false;
    }
}

export function defineTestsForEngine(createEngine) {
    function defTest(name, testFunc, { requiresFile } = {}) {
        // Disable the tests if we don't have a given engine on hand or we don't have a test file for them
        let register = createEngine === undefined || (requiresFile && !exists(requiresFile)) ? xit : it;

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

    defTest("can process the entire example folder", async () => {
        let gameManager = await createGameManager(createEngine);
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

    for(const supportedGameVersion of getAllVersions()) {
        const TEST_GAME_PATH = `example/tank_game_v${supportedGameVersion}.json`;
        const TEST_POSSIBLE_ACTIONS_PATH = `example/possible_actions_v${supportedGameVersion}.json`;

        describe(`Game version: ${supportedGameVersion}`, () => {
            defTest("can process actions together and individually", async () => {
                incrementalPlaythrough(createEngine, TEST_GAME_PATH);
            }, { requiresFile: TEST_GAME_PATH });


            defTest("can provide a list of possible actions", async () => {
                await testPossibleActions(createEngine, TEST_POSSIBLE_ACTIONS_PATH);
            }, { requiresFile: TEST_POSSIBLE_ACTIONS_PATH });
        });
    }
}