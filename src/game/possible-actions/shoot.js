import { DiceLogFieldSpec } from "./dice-log-field-spec.js";
import { Die } from "./die.js";
import { GenericPossibleAction } from "./generic-possible-action.js";
import { LogFieldSpec } from "./log-field-spec.js";

export class ShootAction extends GenericPossibleAction {
    constructor({ targets }) {
        super({ actionName: "shoot", type: "shoot" });
        this._targets = targets;

        this._diceToRoll = {};
        for(const target of targets) {
            this._diceToRoll[target.position] = target.dice;
        }
    }

    static canConstruct(type) {
        return type == "shoot";
    }

    static deserialize(rawShootAction) {
        return new ShootAction({
            targets: rawShootAction.targets.map(target => ({
                ...target,
                dice: target.dice.map(die => Die.deserialize(die)),
            })),
        });
    }

    serialize() {
        return {
            targets: this._targets.map(target => ({
                ...target,
                dice: target.dice.map(die => die.serialize()),
            }))
        };
    }

    getParameterSpec(logEntry) {
        const targetSpec = this._targetSpec = new LogFieldSpec({
            name: "target",
            type: "select-position",
            options: this._targets.map(target => target.position),
        });

        let hitFields = [];
        if(logEntry.target) {
            const dice = this._diceToRoll[logEntry.target];

            if(dice.length > 0) {
                hitFields = [
                    new DiceLogFieldSpec({
                        name: "hit_chance",
                        dice,
                    }),
                ];
            }
            else {
                hitFields = [
                    new LogFieldSpec({
                        name: "hit",
                        type: "set-value",
                        value: true,
                    })
                ];
            }
        }

        return [targetSpec, ...hitFields];
    }
}