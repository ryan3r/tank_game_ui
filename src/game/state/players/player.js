export default class Player {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.entities = [];
    }

    static deserialize(rawPlayer) {
        return new Player(rawPlayer.name, rawPlayer.type);
    }

    serialize() {
        return {
            name: this.name,
            type: this.type,
            entities: this.entities.map(entity => entity.position.humanReadable)
        };
    }

    adopt(entity) {
        this.entities.push(entity);
        entity.players.push(this);
    }
}