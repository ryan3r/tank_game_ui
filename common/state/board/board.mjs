import { ResourceHolder } from "../resource.mjs";
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
                const position = new Position(x, y);
                this._entities[y].push(new Entity("empty", position, new ResourceHolder()));
                this._floor[y].push(new FloorTile("empty", position));
            }
        }
    }

    static deserialize(rawBoard) {
        // Skip the constructor to avoid filling the board twice
        let board = Object.create(Board.prototype);
        board.width = rawBoard.entities[0].length;
        board.height = rawBoard.entities.length;
        board._entities = rawBoard.entities.map((row, y) => row.map((entity, x) => Entity.deserialize(entity, new Position(x, y))));
        board._floor = rawBoard.floor.map((row, y) => row.map((floor, x) => FloorTile.deserialize(floor, new Position(x, y))));
        return board;
    }

    serialize() {
        return {
            entities: this._entities.map(row => row.map(entity => entity.serialize())),
            floor: this._floor.map(row => row.map(tile => tile.serialize())),
        };
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