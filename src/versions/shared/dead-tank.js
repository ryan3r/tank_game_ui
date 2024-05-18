import { EntityDescriptor, TileStyle, imageBackground } from "../base/descriptors.js";

export class DeadTankDescriptor extends EntityDescriptor {
    getTileStyle() {
        return new TileStyle({
            background: imageBackground("/assets/DeadTank.png"),
            textColor: "#fff"
        });
    }

    getFeaturedAttribute() {
        return this.entity.resources.health.value;
    }
}