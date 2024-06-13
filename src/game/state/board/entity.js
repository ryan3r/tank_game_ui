import { AttributeHolder } from "../attribute.js";

export default class Entity {
    constructor(type, position, attributes) {
        this.type = type;
        this._position = position;  // Controlled by board
        this.players = [];  // Conrolled by Player
        this.attributes = new AttributeHolder(attributes);
    }

    get position() { return this._position; }

    static deserialize(rawEntity, position) {
        return new Entity(rawEntity.type, position, AttributeHolder.deserialize(rawEntity.attributes))
    }

    serialize() {
        return {
            type: this.type,
            attributes: this.attributes.serialize(),
        }
    }
}