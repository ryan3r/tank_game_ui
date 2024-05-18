function makeInitalState() {
    return {
        actionNames: [],
        currentSpecs: [],
        uiFieldValues: {},
        locationSelector: {},
        isValid: false,
        logBookEntry: {},
    };
}

function updateActionData(state) {
    if(!state._currentFactory) {
        throw new Error("An action must be selected before modifing action fields");
    }

    const currentSpecs = state._currentFactory.getParameterSpec();

    // Configure the location selector with the new specs
    let locationSelector = {};
    const locationSpecs = currentSpecs.filter(spec => spec.type == "select-position");
    if(locationSpecs.length == 1) {
        locationSelector.isSelecting = true;
        locationSelector.selectableLocations = locationSpecs[0].options.map(({ position }) => position);
        locationSelector._specName = locationSelector[0].name;

        // Reuse the location if it still makes sense
        if(locationSelector._specName == state.locationSelector._specName && locationSelector.selectableLocations.includes(state.locationSelector.location)) {
            locationSelector.location = state.locationSelector.location;
        }
    }
    else if(locationSpecs.length > 1) {
        throw new Error("Only one select-position is allowed at a time");
    }

    // Build the log book entry from the UI values
    let logBookEntry = {
        type: "action",
        action: state._currentFactory.getActionName(),
    };

    for(const spec of currentSpecs) {
        const value = spec.name == locationSelector._specName ?
            locationSelector.location :
            state.uiFieldValues[spec.name];

        logBookEntry[spec.logEntryField] = spec.translateValue(value);
    }

    return {
        ...state,
        currentSpecs,
        locationSelector,
        logBookEntry,
        isValid: state._currentFactory.isValidEntry(logBookEntry),
    };
}

function buildTurnReducer(state, invocation) {
    if(invocation.type == "set-possible-actions") {
        return {
            ...makeInitalState(),
            _possibleActions: invocation.possibleActions,
            actionNames: invocation.possibleActions.map(factory => ({
                type: factory.getActionName,
            })),
        };
    }
    else if(invocation.type == "reset") {
        return {
            ...makeInitalState(),
            _possibleActions: state._possibleActions,
        };
    }

    // No possible actions reset our state
    if(state._possibleActions === undefined) {
        return makeInitalState();
    }

    switch(invocation.type) {
        case "select-action-type":
            const currentFactory = state._possibleActions.find(factory => factory.getActionName == invocation.actionName);

            return updateActionData({
                ...state,
                _currentFactory: currentFactory,
                uiFieldValues: {},
                logBookEntry: {},
            });

        case "set-action-specific-field":
            return updateActionData({
                ...state,
                uiFieldValues: {
                    ...state.uiFieldValues,
                    [invocation.name]: invocation.value,
                }
            });

        case "select-location":
            if(!state.locationSelector.isSelecting) {
                throw new Error("Cannot select a location because location selection is not active");
            }

            return updateActionData({
                ...state,
                locationSelector: {
                    ...state.locationSelector,
                    location: invocation.location,
                },
            });
    }
}