import assert from "node:assert";
import fs from "node:fs";
import { GameInteractor } from "../../../src/game/execution/game-interactor.js";
import { LogBook } from "../../../src/game/state/log-book/log-book.js";
import { load, save } from "../../../src/drivers/game-file.js";
import { logger } from "#platform/logging.js";
import { OpenHours } from "../../../src/game/open-hours/index.js";
import { hashFile } from "../../../src/drivers/file-utils.js";
import { getGameVersion } from "../../../src/versions/index.js";

const TEST_GAME_RECREATE_PATH = `example/tank-game-recreate.json`;

export async function incrementalPlaythrough(createEngine, testGamePath) {
    let { logBook, initialGameState } = await load(testGamePath);

    let timeStampEntryId = 0;
    const makeTimeStamp = () => {
        return logBook.getEntry(timeStampEntryId)?.rawLogEntry?.timestamp || -1;
    };

    const versionConfig = getGameVersion(logBook.gameVersion);
    let emptyLogBook = new LogBook(logBook.gameVersion, [], versionConfig, makeTimeStamp);

    let fullEngine = createEngine();
    let incrementalEngine = createEngine();
    const fullFactories = versionConfig.getActionFactories(fullEngine);
    const incrementalFactories = versionConfig.getActionFactories(incrementalEngine);
    try {
        // Create one instance that starts with the log book full
        // This triggers a set version, set state, and a series of process actions
        logger.debug("[integration-test] Process actions as a group");
        let fullInteractor = new GameInteractor({
            engine: fullEngine,
            actionFactories: fullFactories,
            gameData: {
                logBook,
                initialGameState,
                openHours: new OpenHours([]),
            },
        });
        await fullInteractor.loaded;

        // Create another instance that starts with no log enties and has then added
        // This triggers a set version and then a set state and process action for each entry
        logger.debug("[integration-test] Process individual actions");
        const saveHandler = (...args) => save(TEST_GAME_RECREATE_PATH, ...args);
        let incrementalInteractor = new GameInteractor({
            engine: incrementalEngine,
            actionFactories: incrementalFactories,
            gameData: {
                logBook: emptyLogBook,
                initialGameState,
                openHours: new OpenHours([]),
            },
            saveHandler,
        });

        for(const entry of logBook) {
            await incrementalInteractor.addLogBookEntry(entry.rawLogEntry);

            // Compare the entries and states and make sure they match
            assert.deepEqual(logBook.getEntry(timeStampEntryId), emptyLogBook.getEntry(timeStampEntryId));
            assert.deepEqual(fullInteractor.getGameStateById(entry.id), incrementalInteractor.getGameStateById(entry.id));
            timeStampEntryId++;
        }

        // Make sure the log books are identical
        assert.deepEqual(emptyLogBook.getAllDays(), logBook.getAllDays());

        const orig = await hashFile(testGamePath);
        const recreated = await hashFile(TEST_GAME_RECREATE_PATH);

        assert.equal(orig, recreated);

        // This only deletes the temp file on success so that it can be analyzed on failure.  The temp file
        // is in the git ignore.
        fs.unlinkSync(TEST_GAME_RECREATE_PATH);
    }
    finally {
        await Promise.all([
            fullEngine.shutdown(),
            incrementalEngine.shutdown(),
        ]);
    }
}