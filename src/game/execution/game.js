import { getGameVersion } from "../../versions/index.js";
import { StartOfDaySource } from "../possible-actions/start-of-day-source.js";
import { GameInteractor } from "./game-interactor.js";


export class Game {
    constructor(opts) {
        this.state = "loading";
        this._hasBeenShutDown = false;
        this.loaded = this._initializeGame(opts);
    }

    async _initializeGame({ gameDataPromise, createEngine, saveHandler }) {
        try {
            const gameData = await gameDataPromise;
            this._openHours = gameData.openHours;
            this._gameSettings = gameData.gameSettings;

            // Shutdown was called during load bail before we create the interactor
            // After this point shutdown with directly terminte the interactor
            if(this._hasBeenShutDown) return;

            this.state = "running";

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
            this.state = "error";
            this._error = err.message;
            return;  // failed to load the game bail
        }

        // Shutdown was called while the interactor was starting bail before we start auto start of day
        // After this point shutdown with directly cancel auto start of day
        if(this._hasBeenShutDown) return;

        if(this._openHours?.hasAutomaticStartOfDay?.()) {
            this._automaticStartOfDay = new AutomaticStartOfDay(this);
            this.loaded.then(() => this._automaticStartOfDay.start());
        }
    }

    _setStateFromLastEntry() {
        const {running} = this._getLastState();
        this.state = running ? "running" : "game-over";
    }

    _getLastState() {
        const lastEntryId = this._interactor.getLogBook().getLastEntryId();
        return this._interactor.getGameStateById(lastEntryId);
    }

    getOpenHours() {
        return this._gameData.openHours;
    }

    isGameOpen() {
        return this._gameData.openHours !== undefined ?
            this._gameData.openHours.isGameOpen() : true;
    }

    getStatusText() {
        if(this.state == "loading") {
            return "Loading...";
        }

        if(this.state == "error") {
            return `Failed to load: ${this._error}`;
        }

        const logBook = this._interactor.getLogBook();

        if(this.state == "running") {
            const lastEntry = logBook.getEntry(logBook.getLastEntryId());
            return `Last action: ${lastEntry.message}`;
        }

        if(this.state == "game-over") {
            const {winner} = this._getLastState();
            return `${winner} is victorious!`;
        }
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
            throw new Error(`Game '${this.name}' is in the state ${this.state} and does not have an interactor`);
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
        if(this.state != "running") {
            return {
                canSubmit: false,
                error: `Cannot submit actions while the game is in the ${this.state} state`,
            }
        }

        if(!this.isGameOpen()) {
            return {
                canSubmit: false,
                error: "Cannot submit actions outside of a games open hours",
            };
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