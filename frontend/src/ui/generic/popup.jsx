import "./popup.css";
import { useCallback, useEffect, useState } from "preact/hooks";


const POPUP_PADDING = 5;

export function Popup({ opened, anchorRef, children, onClose }) {
    const [position, setPosition] = useState();
    const [ownSize, setOwnSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Either we're closed or we don't have an element to attach our self to
        if(!opened || !anchorRef.current) {
            setPosition(undefined);
            return;
        }

        // Hide the element if we don't know it's size
        // This also means that the opacity transition will trigger when we render it
        if(ownSize.width === 0 && ownSize.height === 0) {
            setPosition({
                left: 0,
                top: 0,
                opacity: 0,
            });
            return;
        }

        const rect = anchorRef.current.getBoundingClientRect();
        const centerOfAnchor = window.scrollY + rect.y + (rect.width / 2);

        setPosition({
            left: window.scrollX + rect.x + rect.width + POPUP_PADDING,
            top: centerOfAnchor - (ownSize.height / 2),
        });

        if(onClose) {
            // Close if anything else is clicked
            window.addEventListener("click", onClose);
            return () => window.removeEventListener("click", onClose);
        }
    }, [opened, anchorRef, onClose, ownSize]);

    // Once the popup has been rendered save it's size
    const updateOwnSize = useCallback(element => {
        // Reset the size when the popup is closed so we cando our animation again
        if(!element) {
            setOwnSize({ width: 0, height: 0 });
            return;
        }

        const rect = element.getBoundingClientRect();

        setOwnSize({
            width: rect.width,
            height: rect.height,
        });
    }, [setOwnSize]);

    // Popup closed or we haven't determined the position
    if(!position) return;

    return (
        <div style={position} className="popup" onClick={e => e.stopPropagation()} ref={updateOwnSize}>
            {children}
        </div>
    );
}