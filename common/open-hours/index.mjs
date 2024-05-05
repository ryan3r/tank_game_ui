import { Schedule } from "./schedule.mjs";

export class OpenHours {
    constructor(schedules) {
        this._schedules = schedules;
    }

    static deserialize(rawOpenHours) {
        return new OpenHours(
            rawOpenHours.map(rawSchedule => Schedule.deserialize(rawSchedule))
        );
    }

    serialize() {
        return this._schedules.map(schedule => schedule.serialize());
    }

    isGameOpen(now) {
        return !!this._schedules.find(schedule => schedule.isGameOpen(now));
    }
}