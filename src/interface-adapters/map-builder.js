import { useReducer } from "preact/hooks";
import { Position } from "../game/state/board/position.js";
import Entity from "../game/state/board/entity.js";

function generateAllLocations(board) {
    let positions = [];

    for(let x = 0; x < board.width; ++x) {
        for(let y = 0; y < board.height; ++y) {
            positions.push(new Position(x, y).humanReadable);
        }
    }

    return positions;
}

function makeInitalState() {
    return {
        locationSelector: {
            isSelecting: false,
            selectableLocations: [],
        },
    };
}

export function mapBuilderReducer(state, action) {
    if(action.type == "set-map") {
        return {
            ...action.map,
            locationSelector: {
                isSelecting: true,
                selectableLocations: generateAllLocations(action.map.initialState.board),
            },
        };
    }

    if(state?.gameSettings === undefined && state?.initialState === undefined) {
        throw new Error("set-map must be called before any other action");
    }

    if(action.type == "select-location") {
        return {
            ...state,
            locationSelector: {
                ...state.locationSelector,
                location: action.location,
            },
        };
    }

    if(action.type == "set-selected-attribute" || action.type == "set-selected-entity-type") {
        if(state.locationSelector.location === undefined) {
            throw new Error(`You must have a location selected to perform ${action.type}`);
        }

        let newBoard = state.initialState.board.clone();
        const position = new Position(state.locationSelector.location);

        const {board} = state.initialState;

        let getTarget = action.targetType == "entity" ?
                board.getEntityAt.bind(board) :
                board.getFloorTileAt.bind(board);

        let setTarget = action.targetType == "entity" ?
            newBoard.setEntity.bind(newBoard) :
            newBoard.setFloorTile.bind(newBoard);

        if(action.type == "set-selected-attribute") {
            let newEnity = getTarget(position).clone();
            newEnity.attributes[action.name] = action.value;
            setTarget(newEnity);
        }
        else if(action.type == "set-selected-entity-type") {
            setTarget(new Entity({
                type: action.entityType,
                position,
            }));
        }

        return {
            ...state,
            initialState: {
                ...state.initialState,
                board: newBoard,
            },
        };
    }
}

export function useMapBuilder() {
    return useReducer(mapBuilderReducer, makeInitalState());
}

export const setMap = (map) => ({ type: "set-map", map });
export const selectLocation = (location) => ({ type: "select-location", location });
export const setSelectedAttibute = (targetType, name, value) => ({ type: "set-selected-attribute", targetType, name, value });
export const setSelectedEntityType = (targetType, entityType) => ({ type: "set-selected-entity-type", targetType, entityType });