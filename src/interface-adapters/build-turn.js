function makeInitalState() {
    return {
        currentFactory: undefined,
        actionSpecificData: {},
        locationSelector: {},
        isValid: false,
    };
}

function buildTurnReducer(state, action) {
    if(action.type == "set-possible-actions") {
        state._possibleActions = action.possibleActions;
    }

    // No possible actions reset our state
    if(state._possibleActions === undefined) {
        return makeInitalState();
    }


}