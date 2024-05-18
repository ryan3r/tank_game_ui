import { Badge, EntityDescriptor, Indicator, TileStyle, imageBackground } from "../base/descriptors.js";

export class TankDescriptor extends EntityDescriptor {
    getFeaturedAttribute() {
        return this.entity.resources.health.value;
    }

    getTileStyle() {
        return new TileStyle({
            textColor: "#fff",
            background: imageBackground("Tank"),
        });
    }

    getBadge() {
        return new Badge({
            text: this.entity.resources.actions.value,
            textColor: "#fff",
            background: "#00f",
        });
    }

    getIndicators() {
        const bounty = this.entity.resources.bounty?.value;
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
}