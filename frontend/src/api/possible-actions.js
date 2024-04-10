import { useMemo } from "preact/hooks";
import { useActionTemplate } from "./game";
import { Position } from "../../../common/position.mjs";
import { LOG_BOOK_FIELD_MAPPINGS, TARGET_TYPE_FOR_ACTION } from "../config.js";


export function usePossibleActions(game, turnState, selectedUser) {
    const [actionTemplate, __] = useActionTemplate(game);

    return useMemo(() => {
        return buildPossibleActionsForUser(actionTemplate, turnState, selectedUser)
    }, [actionTemplate, turnState, selectedUser]);
}


function buildPossibleActionsForUser(actionTemplate, turnState, selectedUser) {
    if(!turnState || !actionTemplate || !selectedUser) return {};
    const user = turnState.getEntityByName(selectedUser);

    // Get the action template for this user's class
    actionTemplate = actionTemplate[user.playerClass];

    // No actions for this user class
    if(!actionTemplate) return {};

    let possibleActions = {};
    for(const actionName of Object.keys(actionTemplate)) {
        let uiActionSpec = possibleActions[actionName] = [];

        for(const fieldTemplate of actionTemplate[actionName].fields) {
            let uiFieldSpec = {
                name: fieldTemplate.name,
                logBookField: LOG_BOOK_FIELD_MAPPINGS[`${actionName}-${fieldTemplate.name}`] || fieldTemplate.name,
            };

            uiActionSpec.push(uiFieldSpec);

            if(fieldTemplate.type == "integer") {
                uiFieldSpec.type = "input-number";
            }
            else if(fieldTemplate.type == "boolean") {
                uiFieldSpec.type = "select";
                uiFieldSpec.options = [true, false];
            }
            else if(fieldTemplate.type == "position") {
                uiFieldSpec.targetTypes = TARGET_TYPE_FOR_ACTION[actionName] || ["any"];
                uiFieldSpec.type = "select-position";

                uiFieldSpec.options = turnState.getAllSpaces()
                    .filter(entity => uiFieldSpec.targetTypes.includes(entity.type) || uiFieldSpec.targetTypes.includes("any"))
                    .map(entity => entity.position.humanReadable);
            }
            else if(fieldTemplate.type == "tank") {
                uiFieldSpec.type = "select";
                uiFieldSpec.options = turnState.getEntitiesByType("tank").map(tank => tank.name);
            }
            else {
                uiFieldSpec.type = "input";
            }
        }
    }

    return possibleActions;
}
