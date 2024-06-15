import { AttributeHolder } from "../attribute.js";
import Entity from "./entity.js";

export default class Board {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this._entities = {};
        this._floor = {};
    }

    static deserialize(rawBoard) {
        let board = new Board(rawBoard.width, rawBoard.height);

        for(const rawEntry of rawBoard.entities) {
            board.setEntity(Entity.deserialize(rawEntry));
        }

        for(const rawFloorTile of rawBoard.floor) {
            board.setFloorTile(Entity.deserialize(rawFloorTile));
        }

        return board;
    }

    serialize() {
        return {
            width: this.width,
            height: this.height,
            entities: Object.values(this._entities).map(entity => entity.serialize()),
            floor: Object.values(this._floor).map(tile => tile.serialize()),
        };
    }

    getEntityAt(position) {
        return this._entities[position.humanReadable] || (new Entity("empty", new AttributeHolder({ "position": position.humanReadable })));
    }

    setEntity(entity) {
        if(entity.type == "empty") {
            delete this._entities[entity.position.humanReadable];
        }
        else {
            this._entities[entity.position.humanReadable] = entity;
        }
    }

    getFloorTileAt(position) {
        return this._floor[position.humanReadable] || (new Entity("empty", new AttributeHolder({ position: position.humanReadable })));
    }

    setFloorTile(tile) {
        if(tile.type == "empty") {
            delete this._floor[tile.position.humanReadable];
        }
        else {
            this._floor[tile.position.humanReadable] = tile;
        }
    }

    isInBounds(position) {
        return position.x < this.width && position.y < this.height;
    }
}