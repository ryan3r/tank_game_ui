import { useCallback, useRef, useState } from "preact/hooks";
import "./tank.css";
import { Popup } from "../../generic/popup.jsx";

export function Tank({ tank, clickHandlerSet }) {
    const cardRef = useRef();
    const [opened, setOpened] = useState(false);

    let tankStats;
    if(tank.type == "dead-tank") {
        tankStats = (
            <div className={`board-space-centered board-space-tank-dead board-space-wall-${tank.resources.health.value}`}>
                {tank.resources.health.value}
            </div>
        );
    }
    else {
        tankStats = (
            <div className="board-space-tank-stats">
                <div className="board-space-tank-lives board-space-centered">{tank.resources.health.value}</div>
                <div className="board-space-tank-range board-space-centered">{tank.resources.range.value}</div>
                <div className="board-space-tank-gold board-space-centered">{tank.resources.gold.value}</div>
                <div className="board-space-tank-actions board-space-centered">{tank.resources.actions.value}</div>
            </div>
        );
    }

    const close = useCallback(() => setOpened(false), [setOpened]);

    return (
        <>
            <div className="board-space-entity" ref={cardRef} onClick={() => clickHandlerSet || setOpened(o => !o)}>
                <div className="board-space-tank-title board-space-centered">
                    <div className="board-space-tank-title-inner">{tank.player.name}</div>
                </div>
                {tankStats}
            </div>
            <Popup opened={opened} anchorRef={cardRef} onClose={close}>
                <div style={{ padding: "5px" }}>
                    <table>
                        <tr>
                            <th>Resource</th>
                            <th>Current</th>
                        </tr>
                        {Array.from(tank.resources).map(resource => {
                            return (
                                <tr><td>{resource.name}</td><td>{resource.value}</td></tr>
                            );
                        })}
                    </table>
                </div>
            </Popup>
        </>
    );
}
