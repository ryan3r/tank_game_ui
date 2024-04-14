import fs from "node:fs";
import assert from "node:assert";
import { gameStateFromRawState, gameStateToRawState } from "../../src/engine-interop/board-state.mjs";

const tankGameJarState = JSON.parse(fs.readFileSync("test/common/jar-game-state.json", "utf8"));

describe("EngineInterop", () => {
    describe("BoardState", () => {
        it("can serialize and deserialize", () => {
            const {day, gameState} = gameStateFromRawState(tankGameJarState);
            let rawState = gameStateToRawState(day, gameState);

            assert.deepEqual(rawState, tankGameJarState);
        });
    });
});