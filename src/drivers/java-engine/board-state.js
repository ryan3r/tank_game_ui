// State translation functions
//
// These functions serve to create an abstraction between tank_game_ui and TankGame engine.
// By doing so we limit the scope of the changes required to support new versions of the engine.

import Board from "../../game/state/board/board.js";
import Entity from "../../game/state/board/entity.js";
import { GameState } from "../../game/state/game-state.js";
import Player from "../../game/state/players/player.js";
import Players from "../../game/state/players/players.js";
import { Position } from "../../game/state/board/position.js";
import { logger } from "#platform/logging.js";


const deadTankAttributesToRemove = ["ACTIONS", "RANGE", "BOUNTY"];

function mapTypeToClass(type, boardType, gameVersion) {
    if(type == "empty") {
        return boardType == "entity" ? "EmptyUnit" : "WalkableFloor";
    }

    if(type == "tank") {
        switch(gameVersion) {
            case "3": return "TankV3";
            case "4": return "TankV3";
        }
    }

    const className = {
        wall: "Wall",
        gold_mine: "GoldMine",
    }[type];

    if(className === undefined) throw new Error(`Could not find class name for ${type}`);

    return className;
}

function mapClassToType(className) {
    const type = {
        Wall: "wall",
        GoldMine: "gold_mine",
        TankV3: "tank",
        EmptyUnit: "empty",
        WalkableFloor: "empty",
        GlobalCooldownTank: "tank",
    }[className];

    if(type === undefined) throw new Error(`Could not find type for ${className}`);

    return type;
}


export function gameStateFromRawState(rawGameState) {
    let councilPlayers = [];
    const playersByName = buildUserLists(rawGameState, councilPlayers);

    let board = convertBoard(undefined, rawGameState.attributes.BOARD.unit_board, (newBoard, rawEntity, position) => {
        newBoard.setEntity(entityFromBoard(rawEntity, position, playersByName));
    });

    board = convertBoard(board, rawGameState.attributes.BOARD.floor_board, (newBoard, space, position) => {
        newBoard.setFloorTile(new Entity({
            type: mapClassToType(space.class),
            position,
        }));
    });

    let gameState = new GameState(
        new Players(Object.values(playersByName)),
        board,
        {
            council: convertCouncil(rawGameState.attributes.COUNCIL, councilPlayers),
        },
    );

    let victoryInfo;

    if(rawGameState.attributes.WINNER?.length > 1) {
        victoryInfo = {
            type: rawGameState.attributes.WINNER == "Council" ? "armistice_vote" : "last_tank_standing",
            winners: rawGameState.attributes.WINNER == "Council" ?
                gameState.metaEntities.council.players :
                [gameState.players.getPlayerByName(rawGameState.attributes.WINNER)],
        };
    }

    return {
        gameState,
        victoryInfo,
    };
}

function getAttributeName(name, type, rawAttributes) {
    name = name.toLowerCase();

    if(type == "tank" && !rawAttributes.DEAD && name == "durability") {
        return "health";
    }

    return name;
}

function shouldKeepAttribute(attributeName, type, rawAttributes) {
    if(["DEAD", "POSITION", "PLAYER"].includes(attributeName)) {
        return false;
    }

    if(type == "tank" && rawAttributes.DEAD) {
        return !deadTankAttributesToRemove.includes(attributeName);
    }

    return true;
}

function decodeAttributes(type, rawAttributes) {
    let attributes = {};

    for(const attributeName of Object.keys(rawAttributes)) {
        if(!shouldKeepAttribute(attributeName, type, rawAttributes)) continue;

        const actualName = getAttributeName(attributeName, type, rawAttributes);
        attributes[actualName] = rawAttributes[attributeName];
    }

    return attributes;
}

function convertPlayer(rawPlayer, playerType) {
    if(rawPlayer.class != "Player") throw new Error(`Expected player but got ${rawPlayer.class}`);

    let attributes = decodeAttributes(playerType, rawPlayer.attributes);
    attributes.type = playerType;
    return new Player(attributes);
}

function convertCouncil(rawCouncil, players) {
    let attributes = {
        coffer: rawCouncil.attributes.COFFER,
    };

    if(rawCouncil.armistice_vote_cap !== undefined) {
        attributes.armistice = {
            value: rawCouncil.attributes.ARMISTICE_VOTE_COUNT,
            max: rawCouncil.attributes.ARMISTICE_VOTE_CAP
        };
    }

    return new Entity({ type: "council", attributes, players });
}

function entityFromBoard(rawEntity, position, playersByName) {
    const type = mapClassToType(rawEntity.class);
    let attributes = decodeAttributes(type, rawEntity.attributes);

    let entity = new Entity({
        type,
        position,
        attributes,
    });

    const {PLAYER} = rawEntity.attributes;
    if(PLAYER) {
        const player = playersByName[PLAYER.attributes.NAME];
        entity.addPlayer(player);
    }

    return entity;
}

function convertBoard(newBoard, board, boardSpaceFactory) {
    if(!newBoard) {
        if(board.length === 0) throw new Error("Zero length boards are not allowed");

        newBoard = new Board(board[0].length, board.length);
    }

    if(newBoard.height != board.length) {
        throw new Error(`Board has a length of ${board.length} but previous boards had a length of ${newBoard.height}`);
    }

    for(let y = 0; y < board.length; ++y) {
        const row = board[y];

        if(newBoard.width != row.length) {
            throw new Error(`Row at index ${y} has a length of ${row.length} but previous rows had a length of ${newBoard.width}`);
        }

        for(let x = 0; x < row.length; ++x) {
            const position = new Position(x, y);
            boardSpaceFactory(newBoard, board[y][x], position);
        }
    }

    return newBoard;
}

function buildUserLists(rawGameState, councilPlayers) {
    let playersByName = {};
    processCouncil(rawGameState, playersByName, councilPlayers);
    findUsersOnGameBoard(rawGameState, playersByName);

    return playersByName;
}

function processCouncil(rawGameState, playersByName, councilPlayers) {
    // Ensure that players remain in the same order
    rawGameState.attributes.COUNCIL.attributes.COUNCILLORS.elements.sort();
    rawGameState.attributes.COUNCIL.attributes.SENATORS.elements.sort();

    const councilGroups = [
        [rawGameState.attributes.COUNCIL.attributes.COUNCILLORS.elements, "councilor"],
        [rawGameState.attributes.COUNCIL.attributes.SENATORS.elements, "senator"]
    ];

    for(const [users, userType] of councilGroups) {
        for(const userName of users) {
            if(playersByName[userName]) {
                // Being a councelor overrides the user's previous state
                playersByName[userName].attributes.type = userType;
            }
            else {
                playersByName[userName] = new Player({ name: userName, type: userType });
            }

            councilPlayers.push(playersByName[userName]);
        }
    }
}

function findUsersOnGameBoard(rawGameState, playersByName) {
    for(const row of rawGameState.attributes.BOARD.unit_board) {
        for(const rawEntity of row) {
            let rawPlayer = rawEntity.attributes.PLAYER;
            if(rawPlayer) {
                let player = playersByName[rawPlayer.attributes.NAME];
                if(!player) {
                    const type = rawEntity.attributes.DEAD ? "council" : "tank";
                    player = convertPlayer(rawPlayer, type);
                    playersByName[player.name] = player;
                }
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////

function buildPosition(position) {
    return {
        class: "Position",
        x: position.x,
        y: position.y,
    };
}

function buildBoard(board, entityFn) {
    let rawBoard = [];

    for(let y = 0; y < board.height; ++y) {
        let row = [];
        rawBoard.push(row);

        for(let x = 0; x < board.width; ++x) {
            row.push(entityFn(new Position(x, y), board));
        }
    }

    return rawBoard;
}

function buildPlayer(player) {
    let attributes = {};

    for(const attributeName of Object.keys(player.attributes)) {
        attributes[attributeName.toUpperCase()] = player.attributes[attributeName];
    }

    return {
        class: "Player",
        attributes,
    };
}

function buildUnit(position, board, gameVersion) {
    const entity = board.getEntityAt(position);

    let attributes = {};
    for(const attributeName of Object.keys(entity.attributes)) {
        attributes[attributeName.toUpperCase()] = entity.attributes[attributeName];
    }

    if(entity.type == "tank") {
        attributes.DEAD = entity.attributes.durability !== undefined;

        for(const removedAttibute of deadTankAttributesToRemove) {
            if(attributes[removedAttibute] === undefined) {
                attributes[removedAttibute] = 0;
            }
        }

        if(attributes.DURABILITY === undefined) {
            attributes.DURABILITY = attributes.HEALTH;
            delete attributes.HEALTH;
        }
    }

    attributes.POSITION = buildPosition(entity.position);

    if(entity.players.length > 0) {
        attributes.PLAYER = buildPlayer(entity.players[0]);
    }

    return {
        class: mapTypeToClass(entity.type, "entity", gameVersion),
        attributes,
    };
}

function buildFloor(position, board, gameVersion) {
    const tile = board.getFloorTileAt(position);

    return {
        class: mapTypeToClass(tile.type, "floorTile", gameVersion),
        attributes: {
            POSITION: buildPosition(tile.position),
        },
    };
}

function makeCouncilList(council, playerType) {
    const players = council.players
        .filter(player => player.type == playerType)
        .map(player => player.name);

    return {
        "class": "AttributeList",
        elements: players,
    }
}

function makeCouncil(councilEntity) {
    let additionalAttributes = {};

    if(councilEntity.attributes.armistice !== undefined) {
        additionalAttributes = {
            ...additionalAttributes,
            ARMISTICE_COUNT: councilEntity.attributes.armistice.value,
            ARMISTICE_MAX: councilEntity.attributes.armistice.max,
        };
    }

    return {
        class: "Council",
        attributes: {
            COFFER: councilEntity.attributes.coffer,
            ...additionalAttributes,
            COUNCILLORS: makeCouncilList(councilEntity, "councilor"),
            SENATORS: makeCouncilList(councilEntity, "senator"),
        },
    };
}

export function gameStateToRawState(gameState, gameVersion) {
    return {
        class: "State",
        attributes: {
            // It's assumed that we only interact with the engine when the game is active
            RUNNING: true,
            TICK: 0,
            BOARD: {
                class: "Board",
                unit_board: buildBoard(gameState.board, (position, board) => buildUnit(position, board, gameVersion)),
                floor_board: buildBoard(gameState.board, (position, board) => buildFloor(position, board, gameVersion)),
            },
            COUNCIL: makeCouncil(gameState.metaEntities.council),
            PLAYERS: {
                class: "AttributeList",
                elements: gameState.players.getAllPlayers().map(player => buildPlayer(player)),
            }
        },
    };
}
