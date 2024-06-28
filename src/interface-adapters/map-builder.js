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

        let locations = (state.locationSelector.locations || []).slice(0);
        const locationIndex = locations.indexOf(action.location);
        if(locationIndex !== -1) {
            locations.splice(locationIndex, 1);
        }
        else {
            locations.push(action.location);
        }

        const position = locations.length > 0 ? new Position(locations[0]) : undefined;
        const entity = position ? board.getEntityAt(position) : undefined;
        const floorTile = position ? board.getFloorTileAt(position) : undefined;

        const entityEditable = areEntriesCompatible(locations, board.getEntityAt.bind(board));
        const floorTileEditable = areEntriesCompatible(locations, board.getFloorTileAt.bind(board));

        return {
            ...state,
            locationSelector: {
                ...state.locationSelector,
                locations,
            },
            editor: {
                entityEditable,
                entityType: entity?.type,
                entityAttribute: Object.assign({}, entity?.attributes),
                floorTileEditable,
                floorTileType: floorTile?.type,
                floorTileAttribute: Object.assign({}, floorTile?.attributes),
            },
        };
    }

    if(action.type == "set-selected-attribute" || action.type == "set-selected-entity-type") {
        if(state.locationSelector.locations?.length < 1) {
            throw new Error(`You must have a location selected to perform ${action.type}`);
        }

        let newBoard = state.initialState.board.clone();
        const positions = state.locationSelector.locations.map(location => new Position(location));

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
                for(const position of positions) {
                    let newEnity = getTarget(position).clone();
                    newEnity.attributes[action.name] = entityValue;
                    setTarget(newEnity);
                }
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
            for(const position of positions) {
                setTarget(new Entity({
                    type: action.entityType,
                    position,
                    attributes: Object.assign({}, targetConfig?.defaultAttributes),
                }));
            }

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

function areEntriesCompatible(locations, getEntityAt) {
    if(locations.length === 0) return false;

    const firstEntity = getEntityAt(new Position(locations[0]));
    let firstAttributeKeys = Object.keys(firstEntity.attributes);
    firstAttributeKeys.sort();

    for(let i = 1; i < locations.length; ++i) {
        const entity = getEntityAt(new Position(locations[i]));

        if(firstEntity.type != entity.type) return false;

        let attributeKeys = Object.keys(firstEntity.attributes);
        if(attributeKeys.length != firstAttributeKeys.length) return false;
        attributeKeys.sort();

        for(let j = 0; j < attributeKeys.length; ++j) {
            const key = attributeKeys[j];
            const firstKey = firstAttributeKeys[j];
            if(key != firstKey || entity.attributes[key] != firstEntity.attributes[key]) {
                return false;
            }
        }
    }

    return true;
}

export function useMapBuilder() {
    return useReducer(mapBuilderReducer, makeInitalState());
}

export const setMap = (map, builderConfig) => ({ type: "set-map", map, builderConfig });
export const selectLocation = (location) => ({ type: "select-location", location });
export const setSelectedAttibute = (targetType, name, value) => ({ type: "set-selected-attribute", targetType, name, value });
export const setSelectedEntityType = (targetType, entityType) => ({ type: "set-selected-entity-type", targetType, entityType });
