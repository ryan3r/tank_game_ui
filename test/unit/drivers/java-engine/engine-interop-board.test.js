import fs from "node:fs";
import assert from "node:assert";
import { gameStateFromRawState, gameStateToRawState } from "../../../../src/drivers/java-engine/board-state.js";
import { getAllVersions } from "../../../../src/versions/index.js";
import { GameState } from "../../../../src/game/state/game-state.js";

const UNIT_TEST_FILES = "test/unit/drivers/test-files";

function exists(filePath) {
    try {
        fs.accessSync(filePath);
        return true;
    }
    catch(err) {
        return false;
    }
}

describe("EngineInterop", () => {
    describe("BoardState", () => {
        for(const supportedGameVersion of getAllVersions()) {
            const JAR_GAME_STATE = `${UNIT_TEST_FILES}/jar-game-state-${supportedGameVersion}.json`;
            const EXPECTED_UI_STATE = `${UNIT_TEST_FILES}/jar-game-state-${supportedGameVersion}-expected.json`;
            const GENERATED_ENGINE_STATE = `${UNIT_TEST_FILES}/jar-game-state-${supportedGameVersion}-generated.json`

            const hasJarState = exists(JAR_GAME_STATE);
            const hasExpectedUI = exists(EXPECTED_UI_STATE);
            const hasGenerated = exists(GENERATED_ENGINE_STATE);

            (hasJarState && hasExpectedUI ? it : xit)(`can deserialize ${supportedGameVersion} state`, () => {
                const tankGameJarState = JSON.parse(fs.readFileSync(JAR_GAME_STATE, "utf8"));
                const expectedTankGameJarState = JSON.parse(fs.readFileSync(EXPECTED_UI_STATE, "utf8"));

                const gameState = gameStateFromRawState(tankGameJarState);

                assert.deepEqual(gameState.serialize(), expectedTankGameJarState);
            });

            (hasGenerated && hasExpectedUI ? it : xit)(`can serialize ${supportedGameVersion} state`, () => {
                const tankGameState = JSON.parse(fs.readFileSync(EXPECTED_UI_STATE, "utf8"));
                const expectedGeneratedJarState = JSON.parse(fs.readFileSync(GENERATED_ENGINE_STATE, "utf8"));

                const reversedState = gameStateToRawState(GameState.deserialize(tankGameState));

                assert.deepEqual(reversedState, expectedGeneratedJarState);
            });
        }
    });
});