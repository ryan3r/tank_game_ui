import { Attribute, AttributeHolder } from "../attribute.js";
import { Position } from "./position.js";

export default class Entity {
    constructor(type, position, attributes) {
        this.type = type;
        this.players = [];  // Conrolled by Player
        this.attributes = new AttributeHolder(attributes);

        if(position !== undefined) {
            this.attributes.position = new Attribute("position", position.humanReadable);
        }
    }

    get position() {
        const {position} = this.attributes;

        return position !== undefined ?
            Position.fromHumanReadable(position.value) : undefined;
    }

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