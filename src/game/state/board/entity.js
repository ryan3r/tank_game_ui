import { Position } from "./position.js";

export default class Entity {
    constructor(type, attributes) {
        this.type = type;
        this.players = [];  // Conrolled by Player
        this.attributes = attributes;
    }

    get position() {
        return this.attributes.position;
    }

    static deserialize(rawEntity) {
        let attributes = Object.assign({}, rawEntity);
        delete attributes.type;

        if(attributes.position !== undefined) {
            attributes.position = new Position(attributes.position);
        }

        return new Entity(rawEntity.type, attributes);
    }

    serialize() {
        return {
            type: this.type,
            ...this.attributes,
            position: this.position?.humanReadable,
        };
    }
}