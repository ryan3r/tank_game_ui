export class StartOfDaySource {
    getActionFactoryForPlayer({logEntry}) {
        return new StartOfDayFactory(logEntry.day + 1);
    }
}

export class StartOfDayFactory {
    constructor(dayToStart) {
        this.type = StartOfDayFactory.type;
        this._dayToStart = dayToStart;
    }

    static type = "start-of-day";

    static deserialize(rawStartOfDayFactory) {
        return new StartOfDayFactory(rawStartOfDayFactory.dayToStart);
    }

    serialize() {
        return {
            dayToStart: this._dayToStart,
        };
    }

    areParemetersValid() {
        return true;
    }

    getParameterSpec() {
        return [];
    }

    buildRawEntry() {
        return {
            type: "action",
            day: this._dayToStart,
        };
    }

    toString() {
        return "Start of Day";
    }
}