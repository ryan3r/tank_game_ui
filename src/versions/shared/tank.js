import { Badge, EntityDescriptor, Indicator, TileStyle, imageBackground } from "../base/descriptors.js";

export class TankDescriptor extends EntityDescriptor {
    getFeaturedAttribute() {
        const {health, durability} = this.entity.attributes;
        return health?.value || durability?.value;
    }

    getTileStyle() {
        const isDead = this.entity.attributes.durability !== undefined;
        return new TileStyle({
            textColor: "#fff",
            background: imageBackground(isDead ? "DeadTank" : "Tank"),
        });
    }

    getBadge() {
        const {actions} = this.entity.attributes;
        if(actions === undefined) return;

        return new Badge({
            text: actions.value,
            textColor: "#fff",
            background: "#00f",
        });
    }

    getIndicators() {
        const bounty = this.entity.attributes.bounty?.value;
        if(bounty !== undefined && bounty > 0) {
            return [
                new Indicator({
                    symbol: "B",
                    textColor: "orange",
                }),
            ];
        }

        return [];
    }

    getName() {
        return this.entity.player?.name;
    }

    formatForLogEntry() {
        let formatted = this.getName();

        if(this.entity.attributes.durability !== undefined) {
            formatted += " [dead]";
        }

        return formatted;
    }
}