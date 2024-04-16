import fs from "node:fs/promises";
import path from "node:path";
import { LogBook } from "../../common/state/log-book/log-book.mjs";
import { readJson, writeJson } from "./utils.mjs";
import { logger } from "./logging.mjs";
import { gameStateFromRawState } from "./java-engine/board-state.mjs";
import { GameState } from "../../common/state/game-state.mjs";
import { GameInteractor } from "../../common/game/game-interactor.mjs";

export const FILE_FORMAT_VERSION = 2;
export const MINIMUM_SUPPORTED_FILE_FORMAT_VERSION = 1;

export async function load(filePath, gameConfig) {
    let content = await readJson(filePath);
    let fileFormatVersion = content?.versions?.fileFormat || content.fileFormatVersion;

    if(fileFormatVersion > FILE_FORMAT_VERSION) {
        throw new Error(`File version ${fileFormatVersion} is not supported.  Try a newer Tank Game UI version..`);
    }

    if(fileFormatVersion < MINIMUM_SUPPORTED_FILE_FORMAT_VERSION) {
        throw new Error(`File version ${fileFormatVersion} is no longer supported.  Try an older Tank Game UI version.`);
    }

    // Version 1 used a states array instead of initialState and only supported game version 3
    if(fileFormatVersion == 1) {
        content.initialState = content.gameStates[0];
        delete content.states;
        content.versions.game = 3;
        fileFormatVersion = 2;
    }

    // Version 2 uses the jar format for initial state and an array of log enties
    if(fileFormatVersion == 2) {
        content.initialState = gameStateFromRawState(content.initialState.gameState)
            // It seems kind of silly to deserialize, serialize, and deserialize but normal v3 files will have
            // the initial state serialized so we need to leave it that way for consistency
            .gameState.serialize();

        content.logBook = {
            gameVersion: content.versions.game.toString(),
            rawEntries: content.logBook,
        };

        fileFormatVersion = 3;
    }

    // Make sure we have the config required to load this game.  This
    // does not check if the engine supports this game version.
    if(!gameConfig.isGameVersionSupported(content.versions.game)) {
        logger.warn({
            msg: `Tank Game UI is not configured for game version ${content.versions.game}.  You may experience strage behavior.`,
            supportedVersions: gameConfig.getSupportedGameVersions(),
        });
    }

    const logBook = LogBook.deserialize(content.logBook);
    const initialGameState = GameState.deserialize(content.initialState)

    return {
        logBook,
        initialGameState,
    };
}

export async function save(filePath, {logBook, initialGameState}) {
    await writeJson(filePath, {
        fileFormatVersion: FILE_FORMAT_VERSION,
        logBook: logBook.serialize(),
        initialState: initialGameState.serialize(),
    });
}

export async function loadGamesFromFolder(dir, gameConfig, createEngine) {
    let games = {};

    for(const gameFile of await fs.readdir(dir)) {
        const filePath = path.join(dir, gameFile);
        const {name} = path.parse(gameFile);

        logger.info(`Loading ${name} from ${filePath}`);
        try {
            const saveHandler = data => save(filePath, data);
            const engine = createEngine();

            const game = new GameInteractor(engine, await load(filePath, gameConfig), saveHandler);
            await game.loaded;
            games[name] = game;
        }
        catch(err) {
            logger.warn({
                msg: `Failed to load ${name} from ${filePath} (skipping)`,
                err,
            });
        }
    }

    return games;
}