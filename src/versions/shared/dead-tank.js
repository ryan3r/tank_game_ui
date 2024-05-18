import { EntityDescriptor, TileStyle, imageBackground } from "../base/descriptors.js";

export class DeadTankDescriptor extends EntityDescriptor {
    getTileStyle() {
        return new TileStyle({
            background: imageBackground("DeadTank"),
            textColor: "#fff"
        });
    }

    getFeaturedAttribute() {
        return this.entity.resources.health.value;
    }
}