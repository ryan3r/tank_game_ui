import { LogFieldSpec } from "./log-field-spec.js";

export class Die {
    constructor(sides) {
        this.sides = sides;

        this._displayMappings = {};
        this.sideNames = [];
        for(const side of sides) {
            const display = side.display !== undefined ? side.display : side;
            this.sideNames.push(display);
            this._displayMappings[display] = side.value !== undefined ? side.value : side;
        }
    }

    static deserialize(rawDie) {
        return new Die(rawDie.sides);
    }

    serialize() {
        return {
            sides: this.sides,
        };
    }

    roll() {
        const sideIdx = Math.round(Math.random() * (this.sides.length - 1));
        return this.sides[sideIdx].value;
    }

    translateValue(display) {
        return this._displayMappings[display];
    }
}


export const hitDie = new Die([
    { display: "hit", value: true },
    { display: "miss", value: false },
]);
