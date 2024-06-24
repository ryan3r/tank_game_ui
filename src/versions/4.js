import { GameVersion } from "./base/index.js";
import { rawV3Config } from "./3.js";
import { Wall } from "./shared/wall.js";

class V4WallDescriptor extends Wall {
    wallUrls = {
        1: "Wall-1",
        2: "Wall-2",
        3: "Wall-3",
        4: "Wall-4",
        5: "Wall-5",
        6: "Wall-6",
    };
}

export const version4 = new GameVersion({
    ...rawV3Config,
    entryDescriptors: {
        ...rawV3Config.entryDescriptors,
        wall: V4WallDescriptor,
    },
    manualPath: "/manuals/Tank_Game_Rules_v4.pdf",
    builderConfig: {
        ...rawV3Config.builderConfig,
        entities: {
            ...rawV3Config.builderConfig.entities,
            wall: {
                ...rawV3Config.builderConfig.entities.wall,
                attributes: {
                    ...rawV3Config.builderConfig.entities.wall.attributes,
                    durability: {
                        ...rawV3Config.builderConfig.entities.wall.attributes.durability,
                        max: 6,
                    },
                },
            },
        },
    },
});
