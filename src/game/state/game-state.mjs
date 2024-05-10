import Board from "./board/board.mjs";
import Players from "./players/players.mjs";
import { ResourceHolder } from "./resource.mjs";

export class GameState {
    constructor(players, board, councilAttributes, running = true, winner = "") {
        this.players = players;
        this.board = board;
        this.council = councilAttributes;
        this.running = running;
        this.winner = winner?.length > 0 ? winner : undefined;
    }

    static deserialize(rawGameState) {
        let board = Board.deserialize(rawGameState.board);

        return new GameState(
            Players.deserialize(rawGameState.players, board),
            board,
            ResourceHolder.deserialize(rawGameState.council),
            rawGameState.running,
            rawGameState.winner,
        );
    }

    serialize() {
        let raw = {
            players: this.players.serialize(),
            board: this.board.serialize(),
            council: this.council.serialize(),
            running: this.running,
        };

        if(this.winner !== undefined) {
            raw.winner = this.winner;
        }

        return raw;
    }
}