import { Resource, ResourceHolder } from "../resource.mjs";

export default class Entity {
    constructor(type, position, player, resources) {
        this.type = type;
        this.position = position;
        this.player = player;
        this.resources = new ResourceHolder(resources);
    }
}