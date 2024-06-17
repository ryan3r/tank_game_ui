import { Position } from "./position.js";

export default class Entity {
    constructor(type, attributes, players = []) {
        this.type = type;
        this.players = [];  // Conrolled by Player
        this.attributes = attributes;

        for(let player of players) this.addPlayer(player);
    }

    get position() {
        return this.attributes.position;
    }

    addPlayer(player) {
        player.entities.push(this);
        this.players.push(player);
    }

    static deserialize(rawEntity, players) {
        let attributes = Object.assign({}, rawEntity);
        delete attributes.type;
        delete attributes.players;

        if(attributes.position !== undefined) {
            attributes.position = new Position(attributes.position);
        }

        const myPlayers = rawEntity.players.map(playerName => players.getPlayerByName(playerName));
        return new Entity(rawEntity.type, attributes, myPlayers);
    }

    serialize() {
        return {
            ...this.attributes,
            type: this.type,
            position: this.position?.humanReadable,
            players: this.players.map(player => player.name),
        };
    }
}