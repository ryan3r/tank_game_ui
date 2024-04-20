import { GenericPossibleAction } from "./generic-possible-action.mjs";
import { StartOfDayFactory } from "./start-of-day-source.mjs";

let registry = {};

function register(Type) {
    registry[Type.prototype.getType()] = Type;
}


export class NamedFactorySet extends Array {
    serialize() {
        return this.map(factory => {
            return({
                type: factory.getType(),
                ...factory.serialize()
            })
        });
    }

    static deserialize(factories) {
        return new NamedFactorySet(
            ...factories.map(rawFactory => {
                const Type = registry[rawFactory.type];

                if(!Type) {
                    throw new Error(`No action factory for ${rawFactory.type}`);
                }

                return Type.deserialize(rawFactory);
            })
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


// Register our action types so we can deserialize them
register(StartOfDayFactory);
register(GenericPossibleAction);