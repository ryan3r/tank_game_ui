import { prettyifyName } from "../../utils.js";

export class DiceLogFieldSpec {
    constructor({ name, display, description, dice }) {
        this.name = name;
        this.discription = description;
        this.display = display || prettyifyName(name);
        this.type = "roll-dice";
        this.dice = dice;
        this._makeDiceDescription();
    }

    _makeDiceDescription() {
        // Create a string representing the dice to roll
        let diceNames = this.dice.map(die => die.name);
        diceNames.sort();
        diceNames = diceNames.map(dieName => ({ count: 1, dieName }));

        for(let i = diceNames.length - 2; i >= 0; --i) {
            // Combine dice with the same name
            if(diceNames[i + 1].dieName === diceNames[i].dieName) {
                diceNames[i].count += diceNames[i + 1].count;
                diceNames.splice(i + 1, 1); // Remove i + 1
            }
        }

        this._diceDescription = diceNames.map(({ dieName, count }) => `${count}x ${dieName}`);
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
                    dice: this.dice.map(die => die.serialize()),
                };
            }

            return {
                type: "manual-roll",
                dice: uiValue.dice.map((value, idx) => this.dice[idx].translateValue(value))
            };
        }
    }

    isValid(value) {
        if(value?.type === "auto-roll") return true;

        // Manual roll
        if(value?.dice?.length !== this.dice.length) return false;

        // If all sides are defined assume they're valid
        return value.dice.reduce((previous, side) => previous && side !== undefined, true);
    }

    describeDice() {
        return this._diceDescription;
    }
}