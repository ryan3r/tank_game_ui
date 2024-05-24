// A suite of tests to make sure we're properly interfacing with the engine

import assert from "node:assert";
import fs from "node:fs";
import { GameInteractor } from "../../src/game/execution/game-interactor.js";
import { LogBook } from "../../src/game/state/log-book/log-book.js";
import { load, save, createGameManager, loadGameFromFile } from "../../src/drivers/game-file.js";
import { logger } from "#platform/logging.js";
import { OpenHours } from "../../src/game/open-hours/index.js";
import { hashFile } from "../../src/drivers/file-utils.js";
import { getAllVersions, getGameVersion } from "../../src/versions/index.js";
import { buildTurnReducer, makeInitalState, selectActionType, selectLocation, setActionSpecificField, setPossibleActions, setSubject } from "../../src/interface-adapters/build-turn.js";

// Random numbers to give input-number fields
const NUMBERS_TO_TRY = [1, 2, 3];

export function defineTestsForEngine(createEngine) {
    const NUM_RANDOM_ATTEMPTS = 30;

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

    const TEST_GAME_RECREATE_PATH = `example/tank_game_v3-recreate.json`;

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
        const POSSIBLE_ACTIONS_PATH = `example/possible_actions_v${supportedGameVersion}.json`;
        const TEST_GAME_PATH = `example/tank_game_v${supportedGameVersion}.json`;

        describe(`Game version: ${supportedGameVersion}`, () => {
            defTest("can process actions together and individually", async () => {
                let { logBook, initialGameState } = await load(TEST_GAME_PATH);

                let timeStampEntryId = 0;
                const makeTimeStamp = () => {
                    return logBook.getEntry(timeStampEntryId)?.rawLogEntry?.timestamp || -1;
                };

                let emptyLogBook = new LogBook(logBook.gameVersion, [], getGameVersion(logBook.gameVersion), makeTimeStamp);

                let fullEngine = createEngine();
                let incrementalEngine = createEngine();
                try {
                    // Create one instance that starts with the log book full
                    // This triggers a set version, set state, and a series of process actions
                    logger.debug("[integration-test] Process actions as a group");
                    let fullInteractor = new GameInteractor({
                        engine: fullEngine,
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

                    const orig = await hashFile(TEST_GAME_PATH);
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
            });

            async function buildAllPossibleActions(actionBuilder, specIdx, callback) {
                // We've built a full action spit it out
                if(specIdx == actionBuilder.currentSpecs.length) {
                    await callback(actionBuilder);
                    return;
                }

                const spec = actionBuilder.currentSpecs[specIdx];
                const options = spec.type == "input-number" ? NUMBERS_TO_TRY : spec.options;

                // nothing to iterate
                if(!options?.length) {
                    return;
                }

                for(const option of options) {
                    let currentBuilder;
                    if(spec.type == "select-position") {
                        // HACK: Engine claims that Dan can sent stimulus to Lena (B3, dead tank) which is invald
                        if(option == "B3") continue;

                        // HACK: Engine claims that B0 and @2 are a valid spaces
                        if(typeof option == "string" && (option.match(/[A-Z]0/) || !option.match(/[A-Z]\d+/))) continue;

                        currentBuilder = buildTurnReducer(actionBuilder, selectLocation(option));
                    }
                    else {
                        currentBuilder = buildTurnReducer(actionBuilder, setActionSpecificField(spec.name, option));
                    }

                    await buildAllPossibleActions(currentBuilder, specIdx + 1, callback);
                }
            }

            defTest("can provide a list of possible actions", async () => {
                let lastTime = 0;
                const makeTimeStamp = () => {
                    lastTime += 20 * 60; // 20 minutes in seconds
                    return lastTime;
                };

                const {sourceSet, interactor} = await loadGameFromFile(POSSIBLE_ACTIONS_PATH, createEngine, {makeTimeStamp});
                try {
                    const logBook = interactor.getLogBook();
                    const lastId = logBook.getLastEntryId();

                    const players = interactor.getGameStateById(lastId).players.getAllPlayers();
                    if(players.length === 0) {
                        throw new Error("Expected at least on player");
                    }

                    for(const player of players) {
                        const factories = await sourceSet.getActionFactoriesForPlayer({
                            playerName: player.name,
                            logBook,
                            logEntry: logBook.getEntry(lastId),
                            gameState: interactor.getGameStateById(lastId),
                            interactor: interactor,
                        });

                        let actionBuilder = buildTurnReducer(makeInitalState(), setSubject(player.name));
                        actionBuilder = buildTurnReducer(actionBuilder, setPossibleActions(factories));

                        for(const action of actionBuilder.actions) {
                            actionBuilder = buildTurnReducer(actionBuilder, selectActionType(action.name));

                            let actionsAttempted = 0;
                            await buildAllPossibleActions(actionBuilder, 0, async finalizedBuilder => {
                                if(finalizedBuilder.isValid) {
                                    ++actionsAttempted;

                                    logger.info({ msg: "Testing action", finalizedBuilder });

                                    // It's possible that a possible action could fail due to players not having
                                    // enough resouces so we can rettry until one passes.  We just care that
                                    // it can generate at least one valid action
                                    assert.ok(await interactor.canProcessAction(finalizedBuilder.logBookEntry),
                                        `Processing ${JSON.stringify(finalizedBuilder.logBookEntry, null, 4)}`);
                                }
                                else {
                                    logger.warn({
                                        msg: `Failed to build a possible action for ${action.name}`,
                                        finalizedBuilder,
                                    });
                                }
                            });

                            assert.ok(actionsAttempted > 0, `Didn't attempt any actions for ${player.name} ${action.name}`);
                        }
                    }
                }
                finally {
                    await interactor.shutdown();
                }
            });
        });
    }
}