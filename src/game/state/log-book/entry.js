import { Dice } from "../../possible-actions/die.js";

export class LogEntry {
    constructor(day, rawLogEntry, versionConfig, message, dieRolls) {
        this.day = day;
        this.type = rawLogEntry.action || "start_of_day";
        this.rawLogEntry = rawLogEntry;
        this.dieRolls = dieRolls;
        this.message = message || versionConfig?.formatLogEntry?.(this) || "";
        this._versionConfig = versionConfig;
    }

    static deserialize(previousDay, rawEntry, versionConfig) {
        if(rawEntry.day) previousDay = rawEntry.day;

        let message;
        let dieRolls;
        if(rawEntry.savedData !== undefined) {
            message = rawEntry.savedData.message;
            dieRolls = rawEntry.savedData.dieRolls;
            rawEntry = Object.assign({}, rawEntry);
            delete rawEntry.savedData;
        }

        return new LogEntry(previousDay, rawEntry, versionConfig, message, dieRolls);
    }

    serialize({ justRawEntries } = {}) {
        if(justRawEntries) return this.rawLogEntry;

        return {
            ...this.rawLogEntry,
            savedData: {
                message: this.message,
                dieRolls: this.dieRolls,
            }
        }
    }

    getTimestamp() {
        return new Date(this.rawLogEntry.timestamp * 1000);
    }

    updateMessageWithBoardState({ previousState, actions }) {
        this.dieRolls = {};
        const rollFields = Object.keys(this.rawLogEntry)
            .map(key => ({ key, value: this.rawLogEntry[key] }))
            .filter(field => field.value?.type == "die-roll");

        for(const rollField of rollFields) {
            const dice = actions.get(this.type).getDiceFor(rollField.key, {
                rawLogEntry: this.rawLogEntry,
            });

            this.dieRolls[rollField.key] = Dice.expandAll(dice)
                .map((die, idx) => die.getSideFromValue(rollField.value.roll[idx]));
        }

        this.message = this._versionConfig.formatLogEntry(this, previousState);
    }

    finalizeEntry({ actions }) {
        const action = actions.get(this.type);

        for(const field of Object.keys(this.rawLogEntry)) {
            const value = this.rawLogEntry[field];

            // Roll any unrolled dice
            if(value?.type == "die-roll" && !value.manual) {
                const dice = action.getDiceFor(field, {
                    rawLogEntry: this.rawLogEntry,
                });

                const expandedDice = Dice.expandAll(dice);
                this.rawLogEntry[field].roll = expandedDice.map(die => die.roll());
            }
        }

        // Apply any version specific transforms before submitting
        const newRawEntry = action?.finalizeLogEntry?.(this.rawLogEntry);
        if(newRawEntry) {
            this.rawLogEntry = newRawEntry
        }
    }
}
