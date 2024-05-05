// Mappings from human readable days of the week to js integers
const DAY_OF_WEEK_SHORTHAND = {
    monday: 1,
    m: 1,
    tuesday: 2,
    t: 2,
    wednesday: 3,
    w: 3,
    thursday: 4,
    r: 4,
    friday: 5,
    f: 5,
    saturday: 6,
    s: 6,
    sunday: 0,
    u: 0,
};

const TIME_EXPR = /(\d+):(\d+)(AM|PM|am|pm)?/;


function parseTimeString(timeString) {
    const match = TIME_EXPR.exec(timeString);
    if(!match) {
        throw new Error(`Unable to parse time string ${timeString}`);
    }

    return ((+match[1]) * 60) + (+match[2]);
}

function serializeToTimeString(minutes) {
    return `${Math.floor(minutes / 60)}:${minutes % 60}`;
}


export class Schedule {
    constructor(daysOfWeek, startMinutes, endMinutes) {
        this._daysOfWeek = daysOfWeek;
        this._startMinutes = startMinutes;
        this._endMinutes = endMinutes;
        if(startMinutes > endMinutes) {
            throw new Error("Scheduled time cannot be before start time (start = ${serializeToTimeString(this._startMinutes)}, end = ${serializeToTimeString(this._endMinutes)})");
        }
    }

    static deserialize(rawSchedule) {
        return new Schedule(
            rawSchedule.daysOfWeek.map(day => DAY_OF_WEEK_SHORTHAND[day]),
            parseTimeString(rawSchedule.startTime),
            parseTimeString(rawSchedule.endTime),
        );
    }

    serialize() {
        return {
            daysOfWeek: this._daysOfWeek.map(day => {
                return Object.keys(DAY_OF_WEEK_SHORTHAND).find(dayName => DAY_OF_WEEK_SHORTHAND[dayName] == day);
            }),
            startTime: serializeToTimeString(this._startMinutes),
            endTime: serializeToTimeString(this._endMinutes),
        };
    }

    isGameOpen(now) {
        if(!now) now = new Date();

        // Not a valid date for this schedule
        if(!this._daysOfWeek.includes(now.getDay())) {
            return false;
        }

        const currentMinutes = (now.getHours() * 60) + now.getMinutes();
        return this._startMinutes <= currentMinutes && currentMinutes < this._endMinutes;
    }
}