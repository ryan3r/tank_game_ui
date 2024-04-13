import fs from "node:fs/promises";
import { LogBook } from "common/state/log-book/log-book.mjs";

const FILE_FORMAT_VERSION = 2;

async function readJson(path) {
    return JSON.parse(await fs.readFile(path, "utf-8"));
}

async function writeJson(path, data) {
    return await fs.writeFile(path, JSON.stringify(data, null, 4));
}

export async function load(filePath) {
    let content = await readJson(filePath);

    if(content?.versions?.fileFormat > FILE_FORMAT_VERSION) {
        throw new Error(`File version ${content?.versions?.fileFormat} is not supported`);
    }

    // Version 1 used a states array instead of initialState and only supported game version 3
    if(content?.versions?.fileFormat == 1) {
        content.initialState = content.gameStates[0];
        delete content.states;
        content.versions.game = 3;
        content.versions.fileFormat = 2;
    }

    // Version 2
    if(content?.versions?.fileFormat == 2) {
        content.initialState = content.initialState.gameState;
    }

    const logBook = LogBook.deserialize({
        gameVersion: content.versions.game,
        rawEntries: content.logBook
    });

    return {
        logBook,
        initialGameState: content.initialState
    };
}

export async function save(filePath, game) {
    await writeJson(filePath, {
        versions: {
            fileFormat: FILE_FORMAT_VERSION,
            game: game.gameVersion,
        },
        // TODO: No private access?
        logBook: game._logBook,
        initialState: game._initialState,
    });
}
