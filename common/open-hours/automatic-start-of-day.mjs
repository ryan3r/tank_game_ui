import { StartOfDayFactory } from "../state/possible-actions/start-of-day-source.mjs";

// HACK: Cap the amount of time the timer can be set for so we don't get thrown off by day light savings time
const MAX_TIMER_INTERVAL = 60 * 60 * 1000; // 1 hour in ms


export class AutomaticStartOfDay {
    constructor(interactor) {
        this._interactor = interactor;
    }

    hasGameDayBeenStartedToday(now) {
        if(!now) now = new Date();

        let logBook = this._interactor.getLogBook();
        const lastStartOfDay = logBook.getFirstEntryOfDay(logBook.getMaxDay());
        if(lastStartOfDay.type !== "start_of_day") {
            throw new Error(`First action of day ${logBook.getMaxDay()} is type ${lastStartOfDay.type} not start_of_day`);
        }

        const realWorldStartDate = lastStartOfDay.getTimestamp();

        return now.getFullYear() === realWorldStartDate.getFullYear() &&
            now.getMonth() === realWorldStartDate.getMonth() &&
            now.getDate() === realWorldStartDate.getDate();
    }

    attemptToStartDay(now) {
        // We already started the game day on this real day don't do it again
        if(this.hasGameDayBeenStartedToday(now)) return;

        let logBook = this._interactor.getLogBook();
        const factory = new StartOfDayFactory(logBook.getMaxDay() + 1);
        this._interactor.addLogBookEntry(factory.buildRawEntry());
    }

    start() {
        this._setNextTimer();
    }

    stop() {
        clearTimeout(this._timer);
    }

    _setNextTimer() {
        const nextStartOfDay = Date.now() - this._interactor.getOpenHours().getNextOpenHoursStart();
        const duration = Math.min(MAX_TIMER_INTERVAL, nextStartOfDay);

        this._timer = setTimeout(() => {

        }, duration);
    }
}