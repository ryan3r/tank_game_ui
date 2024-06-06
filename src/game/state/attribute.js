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

        if(this.max !== undefined) {
            serialized.max = this.max;
        }

        return serialized;
    }

    toString() {
        return this.max === undefined ?
            this.value : `${this.value} / ${this.max}`;
    }
}


export class AttributeHolder {
    constructor(attributes = []) {
        for(const attribute of attributes) {
            this[attribute.name] = attribute;
        }
    }

    static deserialize(rawAttributes) {
        return new AttributeHolder(
            Object.keys(rawAttributes).map(attributeName => Attribute.deserialize(rawAttributes[attributeName], attributeName)));
    }

    serialize() {
        let serialized = {};

        Object.keys(this)
            .map(attributeName => serialized[attributeName] = this[attributeName].serialize());

        return serialized;
    }

    // Helper to reduce the number of Object.keys calls
    *[Symbol.iterator]() {
        for(const attributeName of Object.keys(this)) {
            yield this[attributeName];
        }
    }
}