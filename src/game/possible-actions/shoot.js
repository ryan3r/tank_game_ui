import { Position } from "../state/board/position.js";
import { GenericPossibleAction } from "./generic-possible-action.js";
import { LogFieldSpec } from "./log-field-spec.js";

export class ShootAction extends GenericPossibleAction {
    constructor({ targets }) {
        super({ actionName: "shoot" });
        this._targets = targets;
    }

    getType() {
        return "shoot";
    }

    static deserialize(rawShootAction) {
        return new ShootAction(rawShootAction);
    }

    serialize() {
        return {
            targets: this._targets,
        };
    }

    getParameterSpec(logEntry, context) {
        const targetSpec = this._targetSpec = new LogFieldSpec({
            name: "target",
            type: "select-position",
            options: this._targets,
        });

        let hit;
        if(logEntry.target) {
            const targetEntity = context.board.getEntityAt(Position.fromHumanReadable(logEntry.target));
            if(targetEntity.resources.health !== undefined) {
                hit = new LogFieldSpec({
                    name: "hit",
                    type: "select",
                    options: [
                        { display: "miss", value: false },
                        { display: "hit", value: true },
                    ],
                });
            }
            else {
                hit = new LogFieldSpec({
                    name: "hit",
                    type: "set-value",
                    value: true,
                });
            }
        }

        return hit ? [targetSpec, hit] : [targetSpec];
    }
}