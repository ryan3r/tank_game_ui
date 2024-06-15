import { prettyifyName } from "../../utils.js";
import { Position } from "./board/position.js";

export class Attribute {
    constructor(name, value, max) {
        this.name = name;
        this.value = value;
        this.max = max;
    }

    static deserialize(rawAttribute, name) {
        return new Attribute(name, rawAttribute.value, rawAttribute.max);
    }

    serialize() {
        let serialized = {
            value: this.value,
        };

        if(serialized.value instanceof Position) {
            serialized.value = serialized.value.humanReadable;
        }

        if(this.max !== undefined) {
            serialized.max = this.max;
        }

        return serialized;
    }

    toString() {
        if(this.max !== undefined) {
            return `${this.value} / ${this.max}`;
        }

        if(typeof this.value == "string") {
            return prettyifyName(this.value);
        }

        return this.value;
    }
}


export class AttributeHolder {
    constructor(attributes = []) {
        for(const attributeName of Object.getOwnPropertyNames(attributes)) {
            let attribute = attributes[attributeName];
            if(!(attribute instanceof Attribute)) {
                attribute = new Attribute(attributeName, attribute);
            }

            this[attributeName] = attribute;
        }
    }

    static deserialize(rawAttributes) {
        let attributes = {};

        for(const attributeName of Object.keys(rawAttributes)) {
            attributes[attributeName] = Attribute.deserialize(rawAttributes[attributeName], attributeName);
        }

        return new AttributeHolder(attributes);
    }

    serialize() {
        let serialized = {};

        for(const attributeName of Object.getOwnPropertyNames(this)) {
            serialized[attributeName] = this[attributeName].serialize();
        }

        return serialized;
    }

    // Helper to reduce the number of Object.keys calls
    *[Symbol.iterator]() {
        for(const attributeName of Object.keys(this)) {
            yield this[attributeName];
        }
    }
}