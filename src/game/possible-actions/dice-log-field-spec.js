import { prettyifyName } from "../../utils.js";

export class DiceLogFieldSpec {
    constructor({ name, display, description, dice }) {
        this.name = name;
        this.discription = description;
        this.display = display || prettyifyName(name);
        this.type = "roll-dice";
        this.dice = dice;
    }

    static canConstruct(type) {
        return type == "roll-dice";
    }

    static deserialize(rawSpec) {
        return new DiceLogFieldSpec(rawSpec);
    }

    serialize() {
        return {
            name: this.name,
            display: this.display,
            type: this.type,
            dice: this.dice,
        };
    }

    translateValue(uiValue) {
        if(uiValue !== undefined) {
            return uiValue.map((value, idx) => this.dice[idx].translateValue(value));
        }
    }

    isValid(value) {
        if(value?.length !== this.dice.length) return false;

        // If all sides are defined assume they're valid
        return value.reduce((previous, side) => previous && side !== undefined, true);
    }
}