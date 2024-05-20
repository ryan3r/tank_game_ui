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
            const targetPosition = Position.fromHumanReadable(logEntry.target);
            const targetEntity = context.gameState.board.getEntityAt();
            if(targetEntity.resources.health !== undefined) {
                const ownEntities = context.gameState.players.getPlayerByName(logEntry.subject).entities;
                const ownPosition = ownEntities[0].position;

                const dice = ownEntities[0].resources.range.value - distance;

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