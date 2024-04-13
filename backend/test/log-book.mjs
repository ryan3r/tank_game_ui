import assert from "node:assert";
import { Config } from "../../common/state/config/config.mjs";
import { LogBook } from "../../common/state/log-book/log-book.mjs";

describe("LogBook", () => {
    describe("LogEntry", () => {
        it("can format messages based on the game version config", () => {
            const config = new Config({
                gameVersionConfigs: {
                    3: {
                        logEntryFormatters: {
                            shoot: "{subject} took aim at {position} and {hit}",
                            buy_action: "{subject} traded {quantity} gold for actions.  Big spender.",
                        },
                    },
                    5: {
                        logEntryFormatters: {
                            shoot: "This better now show up (shoot)",
                            move: "This better now show up (move)",
                        },
                    },
                },
            });

            const rawEntries = [
                {
                    "type": "action",
                    "subject": "Corey",
                    "position": "I6",
                    "hit": true,
                    "action": "shoot"
                },
                {
                    "type": "action",
                    "subject": "Xavion",
                    "quantity": 5,
                    "action": "buy_action"
                },
                {
                    "type": "action",
                    "subject": "Corey",
                    "position": "H4",
                    "action": "move"
                },
            ];

            const expectedMessages = [
                "Corey took aim at I6 and hit",
                "Xavion traded 5 gold for actions.  Big spender.",
                "You might want to define a formatter for move",
            ];

            const logBook = LogBook.deserialize({ gameVersion: 3, rawEntries }, config);
            for(let i = 0; i <= logBook.getLastEntryId(); ++i) {
                assert.equal(logBook.getEntry(i).message, expectedMessages[i]);
            }
        });
    });
});