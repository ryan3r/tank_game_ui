import { useCallback, useRef, useState } from "preact/hooks";
import "./tank.css";
import { Popup } from "../../generic/popup.jsx";
import { prettyifyName } from "../../../../../common/state/utils.mjs";

const COLOR_MAPPING = {
    "tank": "yellow",
    "dead-tank": "brown",
};


function EntityDetails({ entity }) {
    const title = prettyifyName(entity.player?.name || entity.type);

    return (
        <>
            <div className="entity-details-title-wrapper">
                <h2>{title}</h2>
                {entity.player ? <i className="entity-details-title-type">{prettyifyName(entity.type)}</i> : undefined}
            </div>
            <table>
                {Array.from(entity.resources).map(resource => {
                    return (
                        <tr>
                            <td>{prettyifyName(resource.name)}</td>
                            <td>{resource.max === undefined ? resource.value : `${resource.value} / ${resource.max}`}</td>
                        </tr>
                    );
                })}
            </table>
        </>
    )
}

export function Tank({ entity, clickHandlerSet }) {
    const cardRef = useRef();
    const [opened, setOpened] = useState(false);

    const close = useCallback(() => setOpened(false), [setOpened]);

    const label = entity.player && (
        <div className="board-space-tank-title board-space-centered">
            <div className="board-space-tank-title-inner">{prettyifyName(entity.player?.name || "")}</div>
        </div>
    );

    const color = COLOR_MAPPING[entity.type];

    return (
        <>
            <div className="board-space-entity" ref={cardRef} onClick={() => clickHandlerSet || setOpened(o => !o)}>
                {label}
                <div className={`board-space-centered board-space-resource-featured board-space-wall-${entity.resources?.health?.value} ${label ? "" : "board-space-no-label"}`} style={{ background: color }}>
                    {entity.resources?.health?.value}
                </div>
            </div>
            <Popup opened={opened} anchorRef={cardRef} onClose={close}>
                <EntityDetails entity={entity}></EntityDetails>
            </Popup>
        </>
    );
}
