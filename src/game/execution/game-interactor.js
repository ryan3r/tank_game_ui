import { logger } from "#platform/logging.js";
import { AutomaticStartOfDay } from "../open-hours/automatic-start-of-day.js";
import { PromiseLock } from "../../utils.js";

export class GameInteractor {
    constructor({ engine, gameData, saveHandler, gameVersion }) {
        this._saveHandler = saveHandler;
        this._engine = engine;
        this._gameData = gameData;
        this._gameStates = [];
        this._lock = new PromiseLock();
        this._previousState = gameData.initialGameState;
        this._gameVersion = gameVersion;

        // Process any unprocessed log book entries.
        this.loaded = this._processActions();

        if(this._gameData.openHours?.hasAutomaticStartOfDay?.()) {
            this._automaticStartOfDay = new AutomaticStartOfDay(this);
            this.loaded.then(() => this._automaticStartOfDay.start());
        }
    }

    getLogBook() {
        return this._gameData.logBook;
    }

    _processActions() {
        // Wait for any pending action processing
        return this._lock.use(() => this._processActionsLogic());
    }

    async _processActionsLogic() {
        // Nothing to process
        if(this._gameStates.length === this._gameData.logBook.getLength()) return;

        const startIndex = this._gameStates.length;
        const endIndex = this._gameData.logBook.getLastEntryId();

        if(startIndex > endIndex) {
            throw new Error(`startIndex (${startIndex}) can't be larger than endIndex (${endIndex})`);
        }

        await this.sendPreviousState(startIndex);

        // Remove any states that might already be there
        this._gameStates.splice(startIndex, (endIndex - startIndex) + 1);

        for(let i = startIndex; i <= endIndex; ++i) {
            const logEntry = this._gameData.logBook.getEntry(i);
            const state = await this._engine.processAction(logEntry);
            this._previousState = state;
            const gameState = this._engine.getGameStateFromEngineState(state)
            this._gameStates.splice(i, 0, gameState); // Insert state at i

            // Format log entry with previous state
            logEntry.updateMessageWithBoardState(this._gameStates[this._gameStates.length - 2]);
        }
    }

    async sendPreviousState() {
        await this._engine.setGameVersion(this._gameData.logBook.gameVersion);
        await this._engine.setBoardState(this._previousState);
    }

    getGameStateById(id) {
        return this._gameStates[id];
    }

    getOpenHours() {
        return this._gameData.openHours;
    }

    isGameOpen() {
        return this._gameData.openHours !== undefined ?
            this._gameData.openHours.isGameOpen() : true;
    }

    _throwIfGameNotOpen() {
        if(!this.isGameOpen()) {
            throw new Error("You're currently outside this games open hours.  New actions will be blocked until the game opens back up.");
        }
    }

    async _addLogBookEntry(entry) {
        if(this._gameStates.length !== this._gameData.logBook.getLength()) {
            throw new Error(`Logbook length and states length should be identical (log book = ${this._gameData.logBook.getLength()}, states = ${this._gameStates.length})`);
        }

        this._throwIfGameNotOpen();

        await this.sendPreviousState();
        const state = await this._engine.processAction(entry);
        this._previousState = state;

        const gameState = this._engine.getGameStateFromEngineState(state);
        // Format log entry with previous state
        entry.updateMessageWithBoardState(this._gameStates[this._gameStates.length - 1]);
        this._gameData.logBook.addEntry(entry);
        this._gameStates.push(gameState);

        logger.info({
            msg: "Add logbook entry",
            entry,
        });

        // Save the modified log book if we know were to save it too
        if(this._saveHandler) {
            await this._saveHandler(this._gameData);
        }
    }

    async _canProcessAction(entry) {
        if(this._gameStates.length !== this._gameData.logBook.getLength()) {
            throw new Error(`Logbook length and states length should be identical (log book = ${this._gameData.logBook.getLength()}, states = ${this._gameStates.length})`);
        }

        this._throwIfGameNotOpen();

        await this.sendPreviousState();

        let success = false;
        try {
            await this._engine.processAction(entry);
            success = true;
        }
        catch(err) {}  // eslint-disable-line no-unused-vars, no-empty

        return success;
    }

    _finalizeEntry(entry) {
        entry = this._gameVersion?.finalizeLogEntry?.(entry) || entry;
        entry = this._gameData.logBook.makeEntryFromRaw(entry);
        return entry;
    }

    addLogBookEntry(entry) {
        return this._lock.use(() => {
            return this._addLogBookEntry(this._finalizeEntry(entry));
        });
    }

    canProcessAction(entry) {
        return this._lock.use(() => {
            return this._canProcessAction(this._finalizeEntry(entry));
        });
    }

    shutdown() {
        if(this._automaticStartOfDay) {
            this._automaticStartOfDay.stop();
        }

        return this._engine.shutdown();
    }

    hasAutomaticStartOfDay() {
        return !!this._automaticStartOfDay;
    }
}
