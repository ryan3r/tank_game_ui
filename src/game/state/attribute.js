export class AttributeHolder {
    constructor(attributes = []) {
        for(const attributeName of Object.getOwnPropertyNames(attributes)) {
            this[attributeName] = attributes[attributeName];
        }
    }

    static deserialize(rawAttributes) {
        let attributes = {};

        for(const attributeName of Object.keys(rawAttributes)) {
            attributes[attributeName] = rawAttributes[attributeName];
        }

        return new AttributeHolder(attributes);
    }

    serialize() {
        let serialized = {};

        for(const attributeName of Object.getOwnPropertyNames(this)) {
            serialized[attributeName] = this[attributeName];
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