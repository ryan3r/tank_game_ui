import { ResourceHolder } from "../resource.mjs";

export default class Player {
    constructor(name, type, entities) {
        this.name = name;
        this.type = type;
        this.entities = entities;
    }

    getControlledResources() {
        let controlledResources = new ResourceHolder();
        for(const entity of this.entities) {
            Object.assign(controlledResources, entity.resources);
        }

        return controlledResources;
    }
}