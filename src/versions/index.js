import { version3 } from "./3.js";

const gameVersions = {
    3: version3,
};


export function getGameVersion(version) {
    return gameVersions[version];
}
