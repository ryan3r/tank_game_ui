import { GenericPossibleAction } from "../../game/possible-actions/generic-possible-action.js";
import { logger } from "#platform/logging.js";
import { LogFieldSpec } from "../../game/possible-actions/log-field-spec.js";
import { Position } from "../../game/state/board/position.js";

export class JavaEngineSource {
    constructor({ actionsToSkip = [] } = {}) {
        this._actionsToSkip = new Set(actionsToSkip);
    }

    async getActionFactoriesForPlayer({playerName, gameState, engine}) {
        const player = gameState.players.getPlayerByName(playerName);
        if(!player) return [];

        const isCouncil = ["senator", "councilor"].includes(player.type);
        const subject = playerName;

        let possibleActions = await engine.getPossibleActions(isCouncil ? "Council" : playerName);

        return possibleActions.map(possibleAction => {
            const actionName = possibleAction.rule;

            // This action will be handled by another factory
            if(this._actionsToSkip.has(actionName)) return;

            const fieldSpecs = this._buildFieldSpecs(possibleAction.fields);

            // There is no way this action could be taken
            if(!fieldSpecs) return;

            return new GenericPossibleAction({
                subject,
                actionName: actionName,
                fieldSpecs,
            });
        })

        // Remove any actions that can never be taken
        .filter(possibleAction => possibleAction !== undefined);
    }

    _buildFieldSpecs(fields) {
        let unSubmitableAction = false;
        const specs = fields.map(field => {
            const commonFields = {
                name: field.name,
            };

            // No possible inputs for this action
            if(field.range?.length === 0) {
                unSubmitableAction = true;
                return undefined;
            }

            // Handle the custom data types
            if(field.data_type == "tank") {
                return new LogFieldSpec({
                    type: "select-position",
                    options: field.range.map(tank => {
                        const position = (tank.entities?.[0]?.position || new Position(tank.attributes.POSITION)).humanReadable;
                        if(typeof position !== "string") {
                            logger.error({
                                msg: "Expected a object with position or player",
                                obj: tank,
                            });
                            throw new Error(`Got bad data expected a position but got ${position}`);
                        }

                        const name = tank.name || tank.attributes.PLAYER.attributes.NAME;

                        return {
                            position,
                            value: name,
                        };
                    }),
                    ...commonFields,
                });
            }

            if(field.data_type == "position") {
                return new LogFieldSpec({
                    type: "select-position",
                    options: field.range.map(position => {
                        position = new Position(position).humanReadable;

                        return {
                            position,
                            value: position,
                        };
                    }),
                    ...commonFields,
                });
            }

            // Generic data type with a list of options
            if(field.range?.length > 0) {
                let options = field.range;
                let description;

                return new LogFieldSpec({
                    type: "select",
                    options,
                    description,
                    ...commonFields,
                });
            }

            // Data types with no options
            if(field.data_type == "integer") {
                return new LogFieldSpec({
                    type: "input-number",
                    ...commonFields,
                });
            }

            return new LogFieldSpec({
                type: "input",
                ...commonFields,
            });
        });

        return unSubmitableAction ? undefined : specs;
    }
}
