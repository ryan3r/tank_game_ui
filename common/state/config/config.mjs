import { deepMerge, getCombinedKeys } from "./merge.mjs";

const GAME_VERSION_MERGE_OPTIONS = {};

export function mergeConfig(defaultConfig, userConfig) {
    // Merge everything but the game version config
    let finalConfig = deepMerge([defaultConfig, userConfig], {
        pathsToIgnore: [
            "/gameVersions",
            "/defaultGameVersion",
        ]
    });

    finalConfig.defaultGameVersion = deepMerge([
        defaultConfig?.defaultGameVersion,
        userConfig?.defaultGameVersion,
        {},
    ], GAME_VERSION_MERGE_OPTIONS);

    finalConfig.gameVersions = {};

    const allVersionNames = getCombinedKeys([
        defaultConfig?.gameVersions,
        userConfig?.gameVersions,
    ]);

    for(const gameVersion of allVersionNames) {
        finalConfig.gameVersions[gameVersion] = deepMerge([
            finalConfig?.defaultGameVersion,
            defaultConfig?.gameVersions?.[gameVersion],
            userConfig?.gameVersions?.[gameVersion],
        ], GAME_VERSION_MERGE_OPTIONS);
    }

    return finalConfig;
}