/* global window */
import { useCallback, useEffect } from "preact/hooks";

// Key codes for key events
export const UP = window.KeyEvent?.DOM_VK_UP || 38;
export const DOWN = window.KeyEvent?.DOM_VK_DOWN || 40;
export const LEFT = window.KeyEvent?.DOM_VK_LEFT || 37;
export const RIGHT = window.KeyEvent?.DOM_VK_RIGHT || 39;
export const ESCAPE = window.KeyEvent?.DOM_VK_ESCAPE || 27;
export const DELETE = window.KeyEvent?.DOM_VK_DELETE || 46;


export function useGlobalKeyHandler(globalKeyHandler, dependencies = []) {
    globalKeyHandler = useCallback(globalKeyHandler, [globalKeyHandler].concat(dependencies)); // eslint-disable-line

    useEffect(() => {
        window.addEventListener("keydown", globalKeyHandler);

        return () => window.removeEventListener("keydown", globalKeyHandler);
    }, [globalKeyHandler]);
}