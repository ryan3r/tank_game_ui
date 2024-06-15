import assert from "node:assert";
import Board from "../../../../../src/game/state/board/board.js";
import Entity from "../../../../../src/game/state/board/entity.js";
import { Position } from "../../../../../src/game/state/board/position.js";
import { AttributeHolder } from "../../../../../src/game/state/attribute.js";

let board = new Board(7, 5);

const tank1 = new Entity("tank", new AttributeHolder({ position: "A1"}));
const destroyedTank = new Entity("dead-tank", new AttributeHolder({ position: "C4"}));
const tank2 = new Entity("tank", new AttributeHolder({ position: "G5"}));
const baloon = new Entity("baloon", new AttributeHolder({ position: "B2"}));

board.setEntity(tank1);
board.setEntity(destroyedTank);
board.setEntity(tank2);
board.setEntity(baloon);

const goldMine1 = new Entity("gold_mine", new AttributeHolder({ position: "E5"}));
const goldMine2 = new Entity("gold_mine", new AttributeHolder({ position: "B4"}));
const base = new Entity("base", new AttributeHolder({ position: "C4" }));
board.setFloorTile(goldMine1);
board.setFloorTile(goldMine2);
board.setFloorTile(base);

const empty = new Entity("empty", new AttributeHolder({ position: "D3"}));
const emptyTile = new Entity("empty", new AttributeHolder({ position: "G5"}));


describe("Board", () => {
    it("can find the entity at a space", () => {
        assert.deepEqual(board.getEntityAt(Position.fromHumanReadable("A1")), tank1);
        assert.deepEqual(board.getEntityAt(Position.fromHumanReadable("C4")), destroyedTank);
        assert.deepEqual(board.getEntityAt(Position.fromHumanReadable("D3")), empty);
    });

    it("can find the floor tile at a space", () => {
        assert.deepEqual(board.getFloorTileAt(Position.fromHumanReadable("B4")), goldMine2);
        assert.deepEqual(board.getFloorTileAt(Position.fromHumanReadable("C4")), base);
        assert.deepEqual(board.getFloorTileAt(Position.fromHumanReadable("G5")), emptyTile);
    });

    it("can be serialize and deserialized", () => {
        const reSerializedBoard = Board.deserialize(board.serialize());
        assert.deepEqual(reSerializedBoard, board);
    });

    it("can check if a position is in bounds", () => {
        assert.ok(!board.isInBounds(new Position(7, 5)));
        assert.ok(!board.isInBounds(new Position(7, 0)));
        assert.ok(!board.isInBounds(new Position(0, 5)));
        assert.ok(!board.isInBounds(new Position(50, 50)));
    });
});