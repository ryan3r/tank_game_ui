import { GenericPossibleAction } from "../../game/possible-actions/generic-possible-action.js";
import { logger } from "#platform/logging.js";
import { LogFieldSpec } from "../../game/possible-actions/log-field-spec.js";
import { ShootAction } from "../../game/possible-actions/shoot.js";
import { Position } from "../../game/state/board/position.js";
import { hitDie } from "../../game/possible-actions/die.js";

export class JavaEngineSource {
    constructor(engine) {
        this._engine = engine;
    }

    _buildShootAction(possibleAction, gameState, player) {
        let {range} = possibleAction.fields.find(field => field.name == "target");

        // Parse positions and remove invalid ones
        range = range.map(position => {
            try {
                return Position.fromHumanReadable(position);
            }
            catch(err) {
                logger.warn({ msg: "Recieved invalid position from engine (dropping)", err, position });
            }
        }).filter(position => position && gameState.board.isInBounds(position));

        if(player.entities.length != 1) {
            throw new Error(`Expected player ${player.name} to have exactly 1 entity for shooting`);
        }

        const playerEntity = player.entities[0];

        return new ShootAction({
            targets: range.map(position => {
                const target = gameState.board.getEntityAt(position);
                let dice = [];

                // This target has health we must roll
                if(target.resources.health !== undefined) {
                    const distance = playerEntity.position.distanceTo(target.position);
                    const numDice = (playerEntity.resources.range.value - distance) + 1;

                    for(let i = 0; i < numDice; ++i) dice.push(hitDie);
                }

                return {
                    position: position.humanReadable,
                    dice,
                };
            })
        });
    }

    async getActionFactoriesForPlayer({playerName, gameState, interactor}) {
        const player = gameState.players.getPlayerByName(playerName);
        if(!player) return [];

        const isCouncil = ["senator", "councilor"].includes(player.type);
        const subject = playerName;

        await interactor.sendPreviousState();
        let possibleActions = await this._engine.getPossibleActions(isCouncil ? "Council" : playerName);

        return possibleActions.map(possibleAction => {
            const actionName = possibleAction.rule || possibleAction.name;

            // Shoot has a custom action to handle determining how many dice to roll
            if(actionName == "shoot") {
                return this._buildShootAction(possibleAction, gameState, player);
            }

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
                        const position = tank.entities?.[0]?.position?.humanReadable || tank.position;
                        if(typeof position !== "string") {
                            logger.error({
                                msg: "Expected a object with position or player",
                                obj: tank,
                            });
                            throw new Error(`Got bad data expected a position but got ${position}`);
                        }

                        return {
                            position,
                            value: tank.name,
                        };
                    }),
                    ...commonFields,
                });
            }

            if(field.data_type == "position") {
                return new LogFieldSpec({
                    type: "select-position",
                    options: field.range.map(position => ({ position, value: position })),
                    ...commonFields,
                });
            }

            // Generic data type with a list of options
            if(field.range?.length > 0) {
                let options = field.range;
                let description;

                if(field.data_type == "boolean") {
                    options = [true, false];
                }

                if(field.name == "hit") {
                    description = "If your target is a tank roll (Range – Distance) + 1 dice if any are hits you hit.  For other targets you always hit.";

                    options = [
                        { display: "hit", value: true },
                        { display: "miss", value: false },
                    ];
                }

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
