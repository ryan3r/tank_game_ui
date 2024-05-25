export class Die {
    constructor({ name, namePlural, sides }) {
        this.name = name;
        this.namePlural = namePlural || name + "s";
        this.sides = sides;

        this._displayToRaw = {};
        this._rawToDisplay = {};
        this.sideNames = [];
        for(const side of sides) {
            const display = side.display !== undefined ? side.display : side;
            const value = side.value !== undefined ? side.value : side;
            this.sideNames.push(display);
            this._displayToRaw[display] = value;
            this._rawToDisplay[value] = display;
        }
    }

    static deserialize(rawDie) {
        return new Die(rawDie);
    }

    serialize() {
        return {
            name: this.name,
            namePlural: this.namePlural,
            sides: this.sides,
        };
    }

    roll() {
        const sideIdx = Math.round(Math.random() * (this.sides.length - 1));
        return this.sides[sideIdx].value;
    }

    translateValue(display) {
        return this._displayToRaw[display];
    }

    getSideNameFromValue(value) {
        return this._rawToDisplay[value];
    }
}


export class Dice {
    constructor(count, die) {
        this.count = count;
        this.die = die;
    }

    static expandAll(dice) {
        return dice.flatMap(dice => dice.expandDice());
    }

    static deserialize(rawDice) {
        let die;
        if(typeof rawDice.die == "string") {
            die = commonDice[rawDice.die];
        }
        else {
            die = Die.deserialize(rawDice.die);
        }

        return new Dice(rawDice.count, die);
    }

    serialize() {
        let die = this.die.serialize();
        // If this die is known just serialize it as its name
        if(commonDice[this.die.name] !== undefined) {
            die = this.die.name;
        }

        return {
            count: this.count,
            die,
        };
    }

    expandDice() {
        let dice = [];
        for(let i = 0; i < this.count; ++i) {
            dice.push(this.die);
        }
        return dice;
    }

    toString() {
        const dieName = this.count == 1 ? this.die.name : this.die.namePlural;
        return `${this.count}x ${dieName}`;
    }
}


export const hitDie = new Die({
    name: "hit die",
    namePlural: "hit dice",
    sides: [
        { display: "hit", value: true },
        { display: "miss", value: false },
    ]
});


const commonDice = {
    "hit die": hitDie,
};

export function getDieByName(name) {
    return commonDice[name];
}
