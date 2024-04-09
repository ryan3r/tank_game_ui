import { Resource, ResourceHolder } from "./resource.mjs";

// User keys that should be treated as resources
const resourceKeys = new Set(["health", "actions", "range", "gold"]);

// Map an entity's type to a generic type (playerClass) that can be used for determining it's type of actions
// If an entity is not in this map it's playerClass will be non-player
const entityTypeToPlayerClass = {
    "tank": "tank",
    "council": "council",
    "senate": "council",
};


export default class Entity {
    static NON_PLAYER = "non-player";

    constructor(rawEntity) {
        this.name = rawEntity.name;
        this.type = rawEntity.type;

        // Resources are stored as properties directly on the rawEntity extract them
        this.resources = new ResourceHolder(
            Object.keys(rawEntity)
                .filter(name => resourceKeys.has(name))
                .map(name => new Resource(name, rawEntity[name]))
        );
    }

    get playerClass() {
        return entityTypeToPlayerClass[this.type] || Entity.NON_PLAYER;
    }
}