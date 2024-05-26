import { logger } from "#platform/logging.js";
import { PossibleActionSourceSet } from "../../game/possible-actions/index.js";
import { EntityDescriptor, FloorTileDescriptor } from "./descriptors.js";

export class GameVersion {
    constructor({ logFormatter, entryDescriptors, floorTileDescriptors, councilPlayerTypes, manualPath, possibleActionsFactory, entryFinalizers, diceFactories }) {
        this._logFormatter = logFormatter;
        this._entryDescriptors = entryDescriptors;
        this._floorTileDescriptors = floorTileDescriptors;
        this._councilPlayerTypes = councilPlayerTypes;
        this._manualPath = manualPath;
        this._possibleActionsFactory = possibleActionsFactory;
        this._entryFinalizers = entryFinalizers || {};
        this._diceFactories = diceFactories || {};
    }

    formatLogEntry(logEntry, gameState) {
        return this._logFormatter.format(logEntry, gameState, this);
    }

    finalizeLogEntry(rawLogEntry) {
        const finalizer = this._entryFinalizers[rawLogEntry.action] || this._entryFinalizers.default;
        return finalizer?.(rawLogEntry) || rawLogEntry;
    }

    getDiceFor(actionType, field, opts) {
        return this._diceFactories?.[actionType]?.[field]?.(opts) || [];
    }

    getEntityDescriptor(entity) {
        const Descriptor = this._entryDescriptors[entity.type] || EntityDescriptor;
        return new Descriptor(entity);
    }

    getFloorTileDescriptor(floorTile) {
        const Descriptor = this._floorTileDescriptors[floorTile.type] || FloorTileDescriptor;
        return new Descriptor(floorTile);
    }

    getCouncilPlayerTypes() {
        return this._councilPlayerTypes || [];
    }

    getManual() {
        return this._manualPath;
    }

    constructActionSources(engine) {
        return new PossibleActionSourceSet(this._possibleActionsFactory(engine));
    }
}