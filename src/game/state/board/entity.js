import { AttributeHolder } from "../attribute.js";
import { Position } from "./position.js";

export default class Entity {
    constructor(type, attributes) {
        this.type = type;
        this.players = [];  // Conrolled by Player
        this.attributes = new AttributeHolder(attributes);
    }

    get position() {
        const {position} = this.attributes;

        if(position === undefined) return;

        if(!(position.value instanceof Position)) {
            return Position.fromHumanReadable(position.value)
        }

        return position.value;
    }

    static deserialize(rawEntity) {
        return new Entity(rawEntity.type, AttributeHolder.deserialize(rawEntity.attributes))
    }

    serialize() {
        return {
            type: this.type,
            attributes: this.attributes.serialize(),
        }
    }
}