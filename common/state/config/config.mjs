import { GameVersionConfig } from "./game-version.mjs";

export class Config {
    constructor({ gameVersionConfigs }) {
        this._gameVersionConfigs = gameVersionConfigs;

        for(const version of this.getSupportedGameVersions()) {
            this._gameVersionConfigs[version] = new GameVersionConfig(gameVersionConfigs[version])
        }
    }

    static deserialize(rawConfig) {
        return new Config(rawConfig);
    }

    serialize() {
        return {
            gameVersionConfigs: this._gameVersionConfigs,
        }
    }

    isGameVersionSupported(version) {
        return !!this.getGameVersion(version);
    }

    getGameVersion(version) {
        return this._gameVersionConfigs[version];
    }

    getSupportedGameVersions() {
        return Object.keys(this._gameVersionConfigs);
    }
}