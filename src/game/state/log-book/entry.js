import { Die } from "../../possible-actions/die.js";

export class LogEntry {
    constructor(day, rawLogEntry, id, versionConfig, message) {
        this.id = id;
        this.day = day;
        this.type = rawLogEntry.action || "start_of_day";
        this.rawLogEntry = rawLogEntry;
        this.message = message || versionConfig?.formatLogEntry?.(this) || "";
        this._versionConfig = versionConfig;
    }

    static deserialize(id, previousDay, rawEntry, versionConfig) {
        if(rawEntry.day) previousDay = rawEntry.day;

        let message;
        if(rawEntry.savedData !== undefined) {
            message = rawEntry.savedData.message;
            rawEntry = Object.assign({}, rawEntry);
            delete rawEntry.savedData;
        }

        return new LogEntry(previousDay, rawEntry, id, versionConfig, message);
    }

    serialize({ justRawEntries } = {}) {
        if(justRawEntries) return this.rawLogEntry;

        return {
            ...this.rawLogEntry,
            savedData: {
                message: this.message,
            }
        }
    }

    getTimestamp() {
        return new Date(this.rawLogEntry.timestamp * 1000);
    }

    updateMessageWithBoardState(gameState) {
        this.message = this._versionConfig.formatLogEntry(this, gameState);
    }

    finalizeEntry() {
        for(const field of Object.keys(this.rawLogEntry)) {
            const value = this.rawLogEntry[field];

            // Roll any unrolled dice
            if(value?.type == "auto-roll") {
                const dice = value.dice.map(die => Die.deserialize(die));

                this.rawLogEntry[field] = {
                    type: "auto-roll-resolved",
                    dice: dice.map(die => die.roll()),
                };
            }
        }
    }
}
