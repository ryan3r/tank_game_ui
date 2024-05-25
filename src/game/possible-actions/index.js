import { buildDeserializer } from "../../utils.js";
import { DiceLogFieldSpec } from "./dice-log-field-spec.js";
import { GenericPossibleAction } from "./generic-possible-action.js";
import { LogFieldSpec } from "./log-field-spec.js";
import { ShootAction } from "./shoot.js";
import { StartOfDayFactory } from "./start-of-day-source.js";


// Build the default registry with all of the action types
const possibleActionsDeserializer = buildDeserializer([
    StartOfDayFactory,
    GenericPossibleAction,
    ShootAction,
]);


export class NamedFactorySet extends Array {
    serialize() {
        return this.map(factory => {
            return({
                type: factory.type,
                ...factory.serialize()
            })
        });
    }

    static deserialize(factories, deserializer = possibleActionsDeserializer) {
        return new NamedFactorySet(
            ...factories.map(rawFactory => deserializer(rawFactory)),
        );
    }
}

export class PossibleActionSourceSet {
    constructor(sources) {
        this._sources = sources;
    }

    async getActionFactoriesForPlayer(params) {
        let factorySet = new NamedFactorySet();

        for(const source of this._sources) {
            const factories = await source.getActionFactoriesForPlayer(params);
            for(const factory of factories) factorySet.push(factory);
        }

        return factorySet;
    }
}
