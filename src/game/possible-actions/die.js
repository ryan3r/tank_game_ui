import { LogFieldSpec } from "./log-field-spec.js";

export class Die {
    constructor(sides) {
        this.sides = sides;
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

    getLogFieldSpec(specParameters) {
        return new LogFieldSpec({
            ...specParameters,
            type: "select",
            options: this.sides,
        });
    }
}


export const hitDie = new Die([
    { display: "hit", value: true },
    { display: "miss", value: false },
]);
