import { prettyifyName } from "../../utils.js";

export class DiceLogFieldSpec {
    constructor({ name, display, description, dice }) {
        this.name = name;
        this.discription = description;
        this.display = display || prettyifyName(name);
        this.type = "roll-dice";
        this.dice = dice;
        this.expandedDice = this.dice.flatMap(dice => dice.expandDice());
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
            if(uiValue.type === "auto-roll") {
                return {
                    type: "auto-roll",
                    dice: this.expandedDice.map(die => die.serialize()),
                };
            }

            // Bad dice count reject it
            if(uiValue.dice.length != this.expandedDice.length) {
                return undefined;
            }

            return {
                type: "manual-roll",
                dice: uiValue.dice.map((value, idx) => this.expandedDice[idx].translateValue(value))
            };
        }
    }

    isValid(value) {
        if(value?.type === "auto-roll") return true;

        // Manual roll
        if(value?.dice?.length !== this.expandedDice.length) return false;

        // If all sides are defined assume they're valid
        return value.dice.reduce((previous, side) => previous && side !== undefined, true);
    }

    describeDice() {
        return this.dice.map(dice => dice.toString());
    }
}