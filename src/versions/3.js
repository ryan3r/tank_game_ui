import { StartOfDaySource } from "../game/possible-actions/start-of-day-source.js";
import { GameVersion } from "./base/index.js";
import { LogEntryFormatter, baseEntryFunctions } from "./base/log-entry-formatter.js";
import { GoldMineDescriptor } from "./shared/gold-mine.js";
import { TankDescriptor } from "./shared/tank.js";
import { Wall } from "./shared/wall.js";

class V3WallDescriptor extends Wall {
    wallUrls = {
        1: "Wall-1",
        2: "Wall-2",
        3: "Wall-4",
    };
}

function possibleActionsFactory(engine) {
    let actionSets = [new StartOfDaySource()];

    const engineSpecificSource = engine.getEngineSpecificSource &&
        engine.getEngineSpecificSource();

    if(engineSpecificSource) {
        actionSets.push(engineSpecificSource);
    }

    return actionSets;
}

// V4 is almost identical to v3 so let it reuse everything
export const rawV3Config = {
    logFormatter: new LogEntryFormatter(baseEntryFunctions),
    entryDescriptors: {
        tank: TankDescriptor,
        wall: V3WallDescriptor,
    },
    floorTileDescriptors: {
        gold_mine: GoldMineDescriptor,
    },
    councilPlayerTypes: [
        "councilor",
        "senator",
    ],
    manualPath: "/manuals/Tank_Game_Rules_v3.pdf",
    possibleActionsFactory,
    entryFinalizers: {
        shoot(logEntry) {
            // If the hit field wasn't set process the dice
            if(logEntry.rawLogEntry.hit === undefined) {
                // If any dice hit the shot hits
                logEntry.rawLogEntry.hit = !!logEntry.rawLogEntry.hit_roll.dice.find(hit => hit);
            }

            return logEntry;
        }
    },
};

export const version3 = new GameVersion(rawV3Config);
