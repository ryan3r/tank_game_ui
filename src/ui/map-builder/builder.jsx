import { useEffect } from "preact/hooks";
import { useMap } from "../../drivers/rest/fetcher.js";
import { selectLocation, setMap, useMapBuilder } from "../../interface-adapters/map-builder.js";
import { getGameVersion } from "../../versions/index.js";
import { AppContent } from "../app-content.jsx";
import { ErrorMessage } from "../error_message.jsx";
import { GameBoard } from "../game_state/board.jsx";
import { EditSpace } from "./edit-entity.jsx";

export function MapBuilder({ mapName, debug, navigate }) {
    const [mapBuilderState, dispatch] = useMapBuilder();
    const [map, error] = useMap(mapName);

    const versionConfig = map?.game?.gameVersion !== undefined ?
        getGameVersion(map.game.gameVersion) : undefined;

    useEffect(() => {
        if(map) dispatch(setMap(map));
    }, [map, dispatch]);

    // TODO: Remove boiler plate
    const backToGamesButton = <button onClick={() => navigate("home")}>Back to games</button>;

    if(error?.code == "game-loading") {
        return <AppContent>
            {backToGamesButton}
            <p>Loading Game...</p>
        </AppContent>;
    }

    if(error) {
        return <AppContent>
            {backToGamesButton}
            <ErrorMessage error={error}></ErrorMessage>
        </AppContent>;
    }
    // END TODO: Remove boiler plate

    const toolBar = (
        <>
            {backToGamesButton}
        </>
    );

    return (
        <>
            <div className="app-sidebar">
                <EditSpace mapBuilderState={mapBuilderState} dispatch={dispatch}></EditSpace>
            </div>
            <AppContent withSidebar debugMode={debug} toolbar={toolBar} buildInfo={map?.buildInfo}>
                <GameBoard
                    board={mapBuilderState?.initialState?.board}
                    config={versionConfig}
                    canSubmitAction={false}
                    locationSelector={mapBuilderState.locationSelector}
                    selectLocation={location => dispatch(selectLocation(location))}></GameBoard>
            </AppContent>
        </>
    );
}
