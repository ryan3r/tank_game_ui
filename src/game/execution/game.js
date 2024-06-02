import { prettyifyName } from "../../utils.js";
import { getGameVersion } from "../../versions/index.js";
import { AutomaticStartOfDay } from "../open-hours/automatic-start-of-day.js";
import { StartOfDaySource } from "../possible-actions/start-of-day-source.js";
import { GameInteractor } from "./game-interactor.js";
import { DateTime } from "luxon";

export class Game {
    constructor(opts) {
        this._state = "loading";
        this._hasBeenShutDown = false;
        this.name = opts.name;
        this.title = prettyifyName(this.name);
        this.loaded = this._initializeGame(opts);
    }

    async _initializeGame({ gameDataPromise, createEngine, saveHandler }) {
        try {
            const gameData = await gameDataPromise;
            this._openHours = gameData.openHours;
            this._gameSettings = gameData.gameSettings;

            if(gameData.title !== undefined) {
                this.title = gameData.title;
            }

            if(gameData.startDate !== undefined) {
                this._startDate = DateTime.fromFormat(gameData.startDate, "D"); // For en-US MM/DD/YYYY
                if(!this._startDate.isValid) {
                    throw new Error(`Failed to parse start date ${gameData.startDate}: ${this._startDate.invalidReason}`);
                }
            }

            // Shutdown was called during load bail before we create the interactor
            // After this point shutdown with directly terminte the interactor
            if(this._hasBeenShutDown) return;

            this._state = "running";

            const gameVersion = getGameVersion(gameData.logBook.gameVersion);
            const engine = createEngine();
            let actionFactories = gameVersion.getActionFactories(engine);

            // If we don't automate the start of day process let users submit it as an action
            if(!this.hasAutomaticStartOfDay()) {
                actionFactories.addSource(new StartOfDaySource());
            }

            this._interactor = new GameInteractor({
                engine,
                gameData,
                saveHandler,
                onEntryAdded: this._setStateFromLastEntry.bind(this),
                actionFactories,
            });

            await this._interactor.loaded;
        }
        catch(err) {
            this._state = "error";
            this._error = err.message;
            return;  // failed to load the game bail
        }

        // Shutdown was called while the interactor was starting bail before we start auto start of day
        // After this point shutdown with directly cancel auto start of day
        if(this._hasBeenShutDown) return;

        if(this._state == "running" && this._openHours?.hasAutomaticStartOfDay?.()) {
            this._automaticStartOfDay = new AutomaticStartOfDay(this);
            this.loaded.then(() => this._automaticStartOfDay.start());
        }
    }

    getState() {
        // If the game is ready to start playing check our time based requirements
        if(this._state == "running") {
            if(this._startDate != undefined && this._startDate >= DateTime.now()) {
                return "not-started";
            }

            const isGameOpen = this._openHours !== undefined ?
                this._openHours.isGameOpen() : true;

            if(!isGameOpen) {
                return "off-hours";
            }
        }

        return this._state;
    }

    _setStateFromLastEntry(entryId) {
        const {running} = this._interactor.getGameStateById(entryId);
        this._state = running ? "running" : "game-over";
    }

    _getLastState() {
        const lastEntryId = this._interactor.getLogBook().getLastEntryId();
        return this._interactor.getGameStateById(lastEntryId);
    }

    getOpenHours() {
        return this._openHours;
    }

    getStatusText() {
        const state = this.getState();

        if(state == "loading") {
            return "Loading...";
        }

        if(state == "error") {
            return `Failed to load: ${this._error}`;
        }

        if(state == "off-hours") {
            return "Outside of this games scheduled hours";
        }

        if(state == "not-started") {
            return `Game starts ${this._startDate.toFormat("DDDD")}`;
        }

        const logBook = this._interactor.getLogBook();

        if(state == "running") {
            const lastEntry = logBook.getEntry(logBook.getLastEntryId());
            return `Playing, last action: ${lastEntry.message}`;
        }

        if(state == "game-over") {
            const {winner} = this._getLastState();
            return `Game over, ${winner} is victorious!`;
        }

        return `Game is in state ${state}`;
    }

    async shutdown() {
        this._hasBeenShutDown = true;

        if(this._automaticStartOfDay) {
            this._automaticStartOfDay.stop();
        }

        if(this._interactor) {
            await this._interactor.shutdown();
        }
    }

    hasAutomaticStartOfDay() {
        return !!this._automaticStartOfDay;
    }

    getInteractor() {
        if(!this._interactor) {
            throw new Error(`Game '${this.name}' is in the state ${this.getState()} and does not have an interactor`);
        }

        return this._interactor;
    }

    getSettings() {
        let settings = this._gameSettings || {};

        if(settings.allowManualRolls === undefined) {
            settings.allowManualRolls = true;
        }

        return settings;
    }

    checkUserCreatedEntry(rawLogEntry) {
        if(this.getState() != "running") {
            return {
                canSubmit: false,
                error: `Cannot submit actions while the game is in the ${this.getState()} state`,
            }
        }

        if(this.hasAutomaticStartOfDay() && (rawLogEntry.day !== undefined || rawLogEntry.action == "start_of_day")) {
            return {
                canSubmit: false,
                error: "Automated start of day is enabled users may not start new days",
            };
        }

        if(!this.getSettings().allowManualRolls) {
            for(const key of Object.keys(rawLogEntry)) {
                const value = rawLogEntry[key];

                if(value?.type == "die-roll" && value?.manual) {
                    return {
                        canSubmit: false,
                        error: "Manual die rolls are disabled for this game",
                    };
                }
            }
        }

        return { canSubmit: true };
    }
}