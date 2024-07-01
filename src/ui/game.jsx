import { GameBoard } from "./game_state/board.jsx";
import { useCallback, useMemo, useState } from "preact/hooks";
import { useGameInfo, useGameState } from "../drivers/rest/fetcher.js";
import { LogEntrySelector } from "./game_state/log_entry_selector.jsx"
import { SubmitTurn } from "./game_state/submit-turn/submit-turn.jsx";
import { Council } from "./game_state/council.jsx";
import { LogBook } from "./game_state/log_book.jsx";
import { ErrorMessage } from "./error_message.jsx";
import { OpenHours } from "./open-hours.jsx";
import { AppContent } from "./app-content.jsx";
import { GameManual } from "./game-manual.jsx";
import { goToEntryId, goToLatestTurn, useCurrentTurnManager } from "../interface-adapters/current-turn-manager.js";
import { getGameVersion } from "../versions/index.js";
import { selectLocation, setSubject, useBuildTurn } from "../interface-adapters/build-turn.js";


export function Game({ game, navigate, debug }) {
    // We want to be able to force refresh out game info after submitting an action
    // so we create this state that game info depends on so when change it game info
    // gets refreshed
    const [gameInfoTrigger, setGameInfoTrigger] = useState();
    const [gameInfo, infoError] = useGameInfo(game, gameInfoTrigger);
    const refreshGameInfo = useCallback(() => {
        setGameInfoTrigger(!gameInfoTrigger);
    }, [gameInfoTrigger, setGameInfoTrigger]);

    const [currentTurnMgrState, distachLogEntryMgr] = useCurrentTurnManager(gameInfo?.logBook);
    const [gameState, stateError] = useGameState(game, currentTurnMgrState.entryId);

    const [builtTurnState, buildTurnDispatch] = useBuildTurn();

    const versionConfig = gameInfo?.game?.gameVersion !== undefined ?
        getGameVersion(gameInfo.game.gameVersion) : undefined;

    const possibleActionsContext = useMemo(() => ({
        gameState,
        versionConfig,
    }), [gameState, versionConfig]);

    const error = infoError || stateError;
    const canSubmitAction = gameInfo?.game?.state == "running";

    const setSelectedUser = user => {
        buildTurnDispatch(setSubject(user));
        distachLogEntryMgr(goToLatestTurn());
    };

    const backToGamesButton = <button onClick={() => navigate("home")}>Back to games</button>;

    // The backend is still loading the game
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

    let gameMessage;
    if(gameInfo !== undefined && gameInfo.game?.state != "running") {
        const colorClass = gameInfo.game?.state == "game-over" ? "success" : "warning";

        gameMessage = <div className={`${colorClass} message`}>{gameInfo.game?.statusText}</div>;
    }

    const toolBar = (
        <LogEntrySelector
            extraButtonsLeft={backToGamesButton}
            debug={debug}
            logBook={gameInfo?.logBook}
            currentTurnMgrState={currentTurnMgrState}
            distachLogEntryMgr={distachLogEntryMgr}></LogEntrySelector>
    );

    return (
        <>
            <div className="app-sidebar">
                <LogBook
                    logBook={gameInfo?.logBook}
                    currentEntryId={currentTurnMgrState.entryId}
                    changeEntryId={entryId => distachLogEntryMgr(goToEntryId(entryId))}></LogBook>
            </div>
            <AppContent withSidebar debugMode={debug} toolbar={toolBar} buildInfo={gameInfo?.buildInfo}>
                <div className="app-side-by-side centered">
                    <div className="app-side-by-side-main">
                        {gameMessage !== undefined ? <div>{gameMessage}</div> : undefined}
                        <GameBoard
                            board={gameState?.board}
                            config={versionConfig}
                            canSubmitAction={canSubmitAction}
                            setSelectedUser={setSelectedUser}
                            locationSelector={builtTurnState.locationSelector}
                            selectLocation={location => buildTurnDispatch(selectLocation(location))}></GameBoard>
                    </div>
                    <div>
                        <Council
                            gameState={gameState}
                            config={versionConfig}
                            setSelectedUser={setSelectedUser}
                            canSubmitAction={canSubmitAction}></Council>
                        <OpenHours openHours={gameInfo?.openHours} debug={debug}></OpenHours>
                        <GameManual manualPath={versionConfig?.getManual?.()}></GameManual>
                    </div>
                </div>
                <div className="centered">
                    <div>
                        {canSubmitAction ? <SubmitTurn
                            context={possibleActionsContext}
                            game={game}
                            builtTurnState={builtTurnState}
                            buildTurnDispatch={buildTurnDispatch}
                            canSubmitAction={canSubmitAction}
                            refreshGameInfo={refreshGameInfo}
                            debug={debug}
                            entryId={currentTurnMgrState.entryId}
                            isLatestEntry={currentTurnMgrState.isLatestEntry}
                            allowManualRolls={gameInfo?.gameSettings?.allowManualRolls}></SubmitTurn> : undefined}
                    </div>
                </div>
            </AppContent>
        </>
    );
}