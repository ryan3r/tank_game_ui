import { ResourceHolder } from "../resource.mjs";

export default class Entity {
    constructor(type, position, resources) {
        this.type = type;
        this.position = position;
        this.player = undefined;
        this.resources = new ResourceHolder(resources);
    }

    static deserialize(rawEntity, position) {
        return new Entity(rawEntity.type, position, ResourceHolder.deserialize(rawEntity.resources))
    }

    serialize() {
        return {
            type: this.type,
            resources: this.resources.serialize(),
        }
    }

    get(key) {
        if(!key) return;

        const parts = key.split(":");
        if(parts.length !== 2) throw new Error(`Entity.get() expected a type:name but got ${key}`);

        let holder;
        switch(parts[0]) {
            case "attr":
            case "attribute":
                holder = this.resources;
                break;
        }

        if(!holder) throw new Error(`Entity.get() could not find the type ${parts[0]}`);

        return holder[parts[1]];
    }
}