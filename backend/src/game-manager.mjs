import { getEngine } from "./engine-interop/engine-manager.mjs";
import { loadGamesFromFolder } from "./game-file.mjs";


export class GameManager {
    constructor({ logBook, initialGameState }) {
        this._logBook = logBook;
        this._initialGameState = initialGameState;
        this._gameStates = [];
        this._ready = Promise.resolve();

        // Process any unprocessed log book entries.
        this._processActions();
    }

    async _processActions() {
        await this._ready;  // Wait for any pending action processing

        this._ready = this._processActionsLogic();
        await this._ready;
    }

    async _processActionsLogic() {
        // Nothing to process
        if(this._gameStates.length === this._logBook.getLastEntryId() + 1) return; // +1 for index to length

        const startIndex = this._gameStates.length;
        const endIndex = this._logBook.getLastEntryId();

        if(startIndex > endIndex) {
            throw new Error(`startIndex (${startIndex}) can't be larger than endIndex (${endIndex})`);
        }

        // If the tank game engine isn't already running start it
        if(!this._engine) {
            this._engine = getEngine();
        }

        await this._sendPreviousState(startIndex);

        // Remove any states that might already be there
        this._gameStates.splice(startIndex, (endIndex - startIndex) + 1);

        for(let i = startIndex; i <= endIndex; ++i) {
            const turn = this._logBook.getEntry(i);
            const state = await this._engine.processAction(turn.serialize());
            this._gameStates.splice(i, 0, state); // Insert state at i
        }

        if(!this._actionTemplate) {
            this._parseActionTemplate(await this._engine.getActionTemplate());
        }
    }

    getActionTemplate() {
        return this._actionTemplate;
    }

    async _sendPreviousState(currentStateIndex) {
        const previousStateIndex = currentStateIndex - 1;

        // Send our previous state to the engine
        const previousState =  previousStateIndex === -1 ?
            this._initialGameState :
            this._gameStates[previousStateIndex];

        if(!previousState) {
            throw new Error(`Expected a state at index ${previousStateIndex}`);
        }

        await this._engine.setBoardState(previousState);
    }

    getGameStateById(id) {
        // State 0 is initial state to external consumers
        if(id == 0) return this._game.initialGameState;

        return this._gameStates[id - 1];
    }

    async _addLogBookEntry(entry) {
        await this._sendPreviousState(this._states.length);

        const state = await this._engine.processAction(entry);
        if(!state.valid) {
            throw new Error(state.error);
        }

        if(this._gameFile.getNumLogEntries() != this._states.length) {
            throw new Error(`Logbook length and states length should be identical (log book = ${this._gameFile.getNumLogEntries()}, states = ${this._states.length})`);
        }

        this._gameFile.addLogBookEntry(entry);
        this._states.push(state);

        await this._rebuildGeneratedState();
        await this._gameFile.save();
    }

    async addLogBookEntry(entry) {
        // This implies that we've waited for this._ready to finish
        await this._processActions();

        const promise = this._addLogBookEntry(entry);

        // Swallow the error before setting ready so we don't fail future submissions
        this._ready = promise.catch(() => {});

        return await promise;
    }

    _parseActionTemplate(descriptors) {
        this._actionTemplate = {};

        for(const descriptor of descriptors) {
            const userType = descriptor.subject.toLowerCase();
            const actionType = descriptor.name;

            if(!this._actionTemplate[userType]) {
                this._actionTemplate[userType] = {};
            }

            this._actionTemplate[userType][actionType] = descriptor;
        }

        // Use our type names
        this._actionTemplate.councilor = this._actionTemplate.council;
        this._actionTemplate.senator = this._actionTemplate.councilor;
        delete this._actionTemplate.council;
    }
}

let gamePromises = loadGamesFromFolder(process.env.TANK_GAMES_FOLDER);

export async function getGame(name) {
    return await (await gamePromises)[name];
}

export async function getGameNames() {
    return Object.keys(await gamePromises);
}
