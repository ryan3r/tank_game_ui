export class Die {
    constructor(name, sides) {
        this.name = name;
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
        return new Die(rawDie.name, rawDie.sides);
    }

    serialize() {
        return {
            name: this.name,
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


export const hitDie = new Die("hit dice", [
    { display: "hit", value: true },
    { display: "miss", value: false },
]);
