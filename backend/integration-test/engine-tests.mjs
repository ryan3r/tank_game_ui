// A suite of tests to make sure we're properly interfacing with the engine

import { loadConfig } from "../src/config-loader.mjs";

export function defineTestsForEngine(createEngine) {
    // Disable the tests if we don't have a given engine on hand
    const defTest = createEngine === undefined ? xit : it;

    defTest("can process the entire example folder", async () => {
        let { gameManager } = await loadConfig(createEngine);
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
}