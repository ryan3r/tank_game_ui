import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { useGameState } from "./fetcher";
import { GameState } from "../../../common/state/game-state.mjs";


const TURN_SWITCH_FREQENCY = 700;  // 0.7 seconds in ms


export function useGameStateManager(logBook, game) {
    const [entryId, setEntryId] = useState();
    const [trackingLastEntry, setTrackingLastEntry] = useState();
    const [playback, setPlayback] = useState(false);
    const [state, __] = useGameState(game, entryId);

    // Change the current entry and track the latest entry if we set it to that
    const setEntryIdAndTrackLastEntry = useCallback((newEntryId) => {
        setEntryId(newEntryId);

        // If the user moves to the latest entry stay on the latest entry
        setTrackingLastEntry(newEntryId >= logBook.getLastEntryId());
    }, [setTrackingLastEntry, setEntryId, logBook]);


    // If entry hasn't been set jump to the latest entry
    if(logBook && entryId === undefined) {
        setEntryIdAndTrackLastEntry(logBook.getLastEntryId());
    }


    useEffect(() => {
        // Not playing nothing to do
        if(!playback || !logBook) return () => {};

        // Hit the end stop playing
        if(entryId == logBook.getLastEntryId()) {
            setPlayback(false);
            return () => {};
        }

        const handle = setTimeout(() => {
            setEntryIdAndTrackLastEntry(Math.min(entryId + 1, logBook.getLastEntryId()));
        }, TURN_SWITCH_FREQENCY);

        return () => clearTimeout(handle);
    }, [logBook, entryId, setEntryIdAndTrackLastEntry, playback]);

    const togglePlayback = useCallback(() => {
        setPlayback(!playback);
    }, [playback, setPlayback]);


    // If we're following the last entry and a new entry gets added change to that one
    useEffect(() => {
        if(trackingLastEntry && logBook) {
            setEntryId(logBook.getLastEntryId());
        }
    }, [logBook, trackingLastEntry, setEntryId]);


    const isLatestEntry = logBook ? entryId >= logBook.getLastEntryId() : false;


    const playerSetEntry = newEntryId => {
        setEntryIdAndTrackLastEntry(newEntryId);
        // If the user changes the entry stop playback
        setPlayback(false);
    };

    const gameState = useMemo(() => state ? GameState.deserialize(state) : undefined, [state]);

    return {
        gameState,
        entryId,
        isLatestEntry,
        isPlayingBack: playback,
        togglePlayback,
        playerSetEntry,
    };
}
