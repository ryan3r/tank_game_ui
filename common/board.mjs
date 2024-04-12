import Entity from "./entity.mjs";
import { FloorTile } from "./floor-tile.mjs";
import { Position } from "./position.mjs";

export default class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this._entities = [];
        this._floor = [];

        for(let y = 0; y < this.height; ++y) {
            this._entities.push([]);
            this._floor.push([]);

            for(let x = 0; x < this.width; ++x) {
                this._entities[y].push(new Entity("empty", new Position(x, y), undefined, []));
                this._floor[y].push(new FloorTile("empty"));
            }
        }
    }

    getEntityAt(position) {
        return this._entities[position.y][position.x];
    }

    setEntity(entity) {
        this._entities[entity.position.y][entity.position.x] = entity;
    }

    getFloorTileAt(position) {
        return this._floor[position.y][position.x];
    }

    setFloorTile(tile) {
        return this._floor[tile.position.y][tile.position.x] = tile;
    }

    getEntitiesOfType(types) {
        let entities = [];
        types = new Set(types);
        const isAny = types.has("any");

        for(let y = 0; y < this.height; ++y) {
            for(let x = 0; x < this.width; ++x) {
                const entity = this.getEntityAt(new Position(x, y));
                if(isAny || types.has(entity.type)) entities.push(entity);
            }
        }

        return entities;
    }
}