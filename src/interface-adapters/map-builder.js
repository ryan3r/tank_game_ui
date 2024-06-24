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
            _builderConfig: action.builderConfig,
            entityTypes: Object.keys(action.builderConfig.entities),
            floorTypes: Object.keys(action.builderConfig.floorTiles),
            locationSelector: {
                isSelecting: true,
                selectableLocations: generateAllLocations(action.map.initialState.board),
            },
            editor: {},
        };
    }

    if(state?.gameSettings === undefined && state?.initialState === undefined) {
        throw new Error("set-map must be called before any other action");
    }

    if(action.type == "select-location") {
        const {board} = state.initialState;
        const position = new Position(action.location);
        const entity = board.getEntityAt(position);
        const floorTile = board.getFloorTileAt(position);

        return {
            ...state,
            locationSelector: {
                ...state.locationSelector,
                location: action.location,
            },
            editor: {
                entityType: entity.type,
                entityAttribute: Object.assign({}, entity.attributes),
                floorTileType: floorTile.type,
                floorTileAttribute: Object.assign({}, floorTile.attributes),
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

        let editor = state.editor;

        const typeKey = action.targetType == "entity" ? "entityType" : "floorTileType";
        const attributeKey = action.targetType == "entity" ? "entityAttribute" : "floorTileAttribute";
        const targetConfig = state._builderConfig[action.targetType == "entity" ? "entities" : "floorTiles"][action.entityType || state.editor[typeKey]];

        if(action.type == "set-selected-attribute") {
            const entityValue = makeAttibuteValue(targetConfig, action.name, action.value)

            if(entityValue !== undefined) {
                let newEnity = getTarget(position).clone();
                newEnity.attributes[action.name] = entityValue;
                setTarget(newEnity);
            }

            editor = {
                ...editor,
                [attributeKey]: {
                    ...editor[attributeKey],
                    [action.name]: action.value,
                },
            };
        }
        else if(action.type == "set-selected-entity-type") {
            setTarget(new Entity({
                type: action.entityType,
                position,
                attributes: Object.assign({}, targetConfig?.defaultAttributes),
            }));

            editor = {
                ...editor,
                [typeKey]: action.entityType,
                [attributeKey]: Object.assign({}, targetConfig?.defaultAttributes),
            };
        }

        return {
            ...state,
            initialState: {
                ...state.initialState,
                board: newBoard,
            },
            editor,
        };
    }
}

function makeAttibuteValue(targetConfig, name, value) {
    const attributeConfig = targetConfig.attributes[name];
    if(attributeConfig.type == "number") {
        value = +value;
        if(isNaN(value)) return;

        if(attributeConfig.min !== undefined && value < attributeConfig.min) return;
        if(attributeConfig.max !== undefined && value > attributeConfig.max) return;

        return value;
    }
}

export function useMapBuilder() {
    return useReducer(mapBuilderReducer, makeInitalState());
}

export const setMap = (map, builderConfig) => ({ type: "set-map", map, builderConfig });
export const selectLocation = (location) => ({ type: "select-location", location });
export const setSelectedAttibute = (targetType, name, value) => ({ type: "set-selected-attribute", targetType, name, value });
export const setSelectedEntityType = (targetType, entityType) => ({ type: "set-selected-entity-type", targetType, entityType });
