import { useMap } from "../../drivers/rest/fetcher.js";
import { getGameVersion } from "../../versions/index.js";
import { AppContent } from "../app-content.jsx";
import { ErrorMessage } from "../error_message.jsx";
import { GameBoard } from "../game_state/board.jsx";

export function MapBuilder({ mapName, debug, navigate }) {
    const [map, error] = useMap(mapName);

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

    const versionConfig = map?.game?.gameVersion !== undefined ?
        getGameVersion(map.game.gameVersion) : undefined;
    // END TODO: Remove boiler plate

    const toolBar = (
        <>
            {backToGamesButton}
        </>
    );

    return (
        <AppContent debugMode={debug} toolbar={toolBar} buildInfo={map?.buildInfo}>
            <GameBoard
                board={map?.initialState?.board}
                config={versionConfig}
                canSubmitAction={false}
                locationSelector={{}}></GameBoard>
        </AppContent>
    );
}