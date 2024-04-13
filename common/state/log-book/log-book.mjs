import { LogEntry } from "./entry.mjs";

export class LogBook {
    constructor(gameVersion, entries) {
        this.gameVersion = gameVersion;
        this._entries = entries;
        this.dayMap = DayMap.buildFromEntries(entries);
    }

    static deserialize({gameVersion, rawEntries}, gameConfig) {
        const versionConfig = gameConfig.getGameVersion(gameVersion);

        let previousDay = 0;
        const entries = rawEntries.map((rawEntry, idx) => {
            const entry = LogEntry.deserialize(idx, previousDay, rawEntry, versionConfig);
            previousDay = entry.day;
            return entry;
        });

        return new LogBook(gameVersion, entries, gameConfig);
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

    addEntry(entry) {
        entry.id = this._entries.length;
        this._entries.push(entry);
    }

    getFirstEntryId() {
        return 0;
    }

    getLastEntryId() {
        return this._entries.length - 1;
    }

    findNextEntryId(currentEntry) {
        return Math.min(currentEntry + 1, this.getLastEntryId());
    }

    findPreviousEntryId(currentEntry) {
        return Math.max(currentEntry - 1, this.getFirstEntryId());
    }
}


class DayMap {
    constructor(dayMap) {
        this._dayMap = dayMap;
        const days = Object.keys(dayMap);
        this._minDay = +days[0]
        this._maxDay = +days[days.length - 1];
    }

    static buildFromEntries(entries) {
        let dayMap = {};

        let previousDay = 0;
        for(const entry of entries) {
            if(entry.day != previousDay) {
                dayMap[entry.day] = entry.id;
            }

            previousDay = entry.day;
        }

        return dayMap;
    }

    getMinDay() {
        return this._minDay;
    }

    getMaxDay() {
        return this._maxDay;
    }

    findDayForEntryId(entryId) {
        const day = Object.keys(this._dayMap)
            .find(day => {
                day = +day;
                const minTurn = this._dayMap[day];
                const maxTurn = this._dayMap[day + 1] || Infinity;
                return minTurn <= entryId && entryId < maxTurn;
            });

        return day ? +day : 0;
    }

    findNextDay(entryId) {
        const currentDay = this.findDayForEntryId(entryId);
        const newDay = Math.min(currentDay + 1, this.getMaxDay());
        return this._dayMap[newDay];
    }

    findPreviousDay(entryId) {
        const currentDay = this.findDayForEntryId(entryId);
        const newDay =  Math.max(currentDay - 1, this.getMinDay());
        return this._dayMap[newDay];
    }

    getFirstEntryIdOfDay(day) {
        const entry = this._dayMap[day];
        return entry || 0;
    }
}
