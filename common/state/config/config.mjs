import { GameVersionConfig } from "./game-version.mjs";

export class Config {
    constructor({ gameVersionConfigs }) {
        this._gameVersionConfigs = gameVersionConfigs;

        for(const version of this.getSupportedGameVersions()) {
            this._gameVersionConfigs[version] = new GameVersionConfig(gameVersionConfigs[version])
        }
    }

    isGameVersionSupported(version) {
        return !!this.getVersion(version);
    }

    getGameVersion(version) {
        return this._gameVersionConfigs[version];
    }

    getSupportedGameVersions() {
        return Object.keys(this._gameVersionConfigs);
    }
}