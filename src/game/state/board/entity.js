import { Position } from "./position.js";

export default class Entity {
    constructor(type, attributes) {
        this.type = type;
        this.players = [];  // Conrolled by Player
        this.attributes = attributes;
    }

    get position() {
        const {position} = this.attributes;

        if(position === undefined) return undefined;

        if(!(position instanceof Position)) {
            return new Position(position)
        }

        return position;
    }

    static deserialize(rawEntity) {
        return new Entity(rawEntity.type, rawEntity.attributes);
    }

    serialize() {
        return {
            type: this.type,
            attributes: this.attributes,
        }
    }
}