export class Die {
    constructor({ name, namePlural, sides }) {
        this.name = name;
        this.namePlural = namePlural || name + "s";
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
        return this._displayMappings[display];
    }
}


export class Dice {
    constructor(count, die) {
        this.count = count;
        this.die = die;
    }

    static deserialize(rawDice) {
        return new Dice(rawDice.count, Die.deserialize(rawDice.die));
    }

    serialize() {
        return {
            count: this.count,
            die: this.die.serialize(),
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
