import assert from "node:assert";
import { Schedule } from "../../../common/open-hours/schedule.mjs";
import { OpenHours } from "../../../common/open-hours/index.mjs";

function checkIsOpen(scheduleName, schedule, date, expected) {
    assert.equal(schedule.isGameOpen(date), expected, `is ${scheduleName} game open ${date}`);
}

function makeDate(year, month, day, hours, minutes) {
    let date = new Date();
    date.setFullYear(year);
    date.setMonth(month - 1);
    date.setDate(day);
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
}

const monday1133 = makeDate(2024, 4, 29, 11, 33);
const monday0217 = makeDate(2022, 12, 26, 14, 17);
const tuesday0348 = makeDate(2024, 2, 13, 15, 48);
const sunday0400 = makeDate(2024, 7, 7, 16, 0);
const friday0501 = makeDate(2024, 7, 19, 17, 5);

const nineToFive = new Schedule([1, 2, 3, 4, 5], 9 * 60, 17 * 60); // 9am to 5pm week days
const noonTo9 = new Schedule([2, 4, 0], 12 * 60, 21 * 60); // 12pm to 9pm Tu, Th, Su

describe("Schedule", () => {
    it("can determine if a given date/time is part of its schedule", () => {
        checkIsOpen("9to5", nineToFive, monday1133, true);
        checkIsOpen("9to5", nineToFive, monday0217, true);
        checkIsOpen("9to5", nineToFive, tuesday0348, true);
        checkIsOpen("9to5", nineToFive, sunday0400, false);
        checkIsOpen("9to5", nineToFive, friday0501, false);

        checkIsOpen("noonTo9", noonTo9, monday1133, false);
        checkIsOpen("noonTo9", noonTo9, monday0217, false);
        checkIsOpen("noonTo9", noonTo9, tuesday0348, true);
        checkIsOpen("noonTo9", noonTo9, sunday0400, true);
        checkIsOpen("noonTo9", noonTo9, friday0501, false);
    });
});

describe("OpenHours", () => {
    it("can check if any of it's schedules are open", () => {
        const mockClosedSchedule = { isGameOpen() { return false; } }
        const mockOpenIfTrueSchedule = { isGameOpen(date) { return !!date; } }

        const closedHours = new OpenHours([mockClosedSchedule, mockClosedSchedule]);
        const maybeOpenHours = new OpenHours([mockClosedSchedule, mockOpenIfTrueSchedule, mockClosedSchedule]);

        assert.ok(!closedHours.isGameOpen(), "Closed hours are closed");
        assert.ok(!maybeOpenHours.isGameOpen(), "Maybe open hours are closed without date");
        assert.ok(maybeOpenHours.isGameOpen(new Date()), "Maybe open hours are open with date");
    });
});
