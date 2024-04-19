import { StartOfDayFactory } from "./start-of-day-source.mjs";

let registry = {};

function register(Type) {
    registry[Type.type] = Type;
}


export class NamedFactorySet extends Array {
    serialize() {
        return this.map(factory => ({
            type: factory.type,
            ...factory.serialize()
        }));
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

    getActionFactoriesForPlayer(params) {
        let factorySet = new NamedFactorySet();

        for(const source of this._sources) {
            const factory = source.getActionFactoryForPlayer(params);
            if(factory) factorySet.push(factory);
        }

        return factorySet;
    }
}


register(StartOfDayFactory);