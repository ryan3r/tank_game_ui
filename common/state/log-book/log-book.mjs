import { LogEntry } from "./entry.mjs";

export class LogBook {
    constructor(gameVersion, entries, versionConfig) {
        this.gameVersion = gameVersion;
        this._entries = entries;
        this._versionConfig = versionConfig;
        this._buildDayMap();
    }

    _buildDayMap() {
        this._dayMap = {};

        let previousDay = 0;
        for(const entry of this._entries) {
            if(entry.day != previousDay) {
                this._dayMap[entry.day] = entry.id;
            }

            if(this._minDay === undefined) this._minDay = entry.day;
            this._maxDay = entry.day;

            previousDay = entry.day;
        }
    }

    static deserialize({gameVersion, rawEntries}, gameConfig) {
        const versionConfig = gameConfig.getGameVersion(gameVersion);

        let previousDay = 0;
        const entries = rawEntries.map((rawEntry, idx) => {
            const entry = LogEntry.deserialize(idx, previousDay, rawEntry, versionConfig);
            previousDay = entry.day;
            return entry;
        });

        return new LogBook(gameVersion, entries, versionConfig);
    }

    serialize() {
        return {
            gameVersion: this.gameVersion,
            rawEntries: this._entries.map(entry => entry.serialize()),
        }
    }

    getEntry(entryId) {
        return this._entries[entryId];
    }

    addEntry(rawEntry) {
        const day = rawEntry.day || this.getMaxDay();
        const entry = new LogEntry(day, rawEntry, this._entries.length, this._versionConfig);
        this._entries.push(entry);
        return entry.id;
    }

    getFirstEntryId() {
        return 0;
    }

    getLastEntryId() {
        return this._entries.length - 1;
    }

    getMinDay() {
        return this._minDay;
    }

    getMaxDay() {
        return this._maxDay;
    }

    findNextEntry(currentEntry) {
        const nextId = Math.min(currentEntry.id + 1, this.getLastEntryId());
        return this.getEntry(nextId);
    }

    findPreviousEntry(currentEntry) {
        const previousId = Math.max(currentEntry.id - 1, this.getFirstEntryId());
        return this.getEntry(previousId);
    }

    findFirstEntryOfNextDay(entry) {
        const newDay = Math.min(entry.day + 1, this.getMaxDay());
        return this.getFirstEntryOfDay(newDay);
    }

    findFirstEntryOfPreviousDay(entry) {
        const newDay =  Math.max(entry.day - 1, this.getMinDay());
        return this.getFirstEntryOfDay(newDay);
    }

    getFirstEntryOfDay(day) {
        return this.getEntry(this._dayMap[day]);
    }
}
