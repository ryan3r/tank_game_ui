import { useCallback, useRef, useState } from "preact/hooks";
import "./entity-tile.css";
import { Popup } from "../generic/popup.jsx";
import { prettyifyName } from "../../../../common/state/utils.mjs";


function AttributeValue({ attribute }) {
    return <>
        {attribute.max === undefined ? attribute.value : `${attribute.value} / ${attribute.max}`}
    </>;
}


function EntityDetails({ entity }) {
    const title = prettyifyName(entity.player?.name || entity.type);
    const subTitle = prettyifyName(entity.type);

    return (
        <>
            <div className="entity-details-title-wrapper">
                <h2>{title}</h2>
                {title != subTitle ? <i className="entity-details-title-type">{subTitle}</i> : undefined}
            </div>
            <table>
                {Array.from(entity.resources).map(resource => {
                    return (
                        <tr>
                            <td>{prettyifyName(resource.name)}</td>
                            <td><AttributeValue attribute={resource}></AttributeValue></td>
                        </tr>
                    );
                })}
            </table>
        </>
    )
}

export function EntityTile({ entity, clickHandlerSet, config }) {
    const cardRef = useRef();
    const [opened, setOpened] = useState(false);

    const close = useCallback(() => setOpened(false), [setOpened]);

    const label = entity.player && (
        <div className="board-space-entity-title board-space-centered">
            <div className="board-space-entity-title-inner">{prettyifyName(entity.player?.name || "")}</div>
        </div>
    );

    const spec = config.getEntityDescriptor(entity.type) || { color: {} };
    const featuredAttribute = entity.resources[spec.featuredAttribute];
    const color = spec.color[featuredAttribute?.value] || spec.color.$else;

    return (
        <>
            <div className="board-space-entity" ref={cardRef} onClick={() => clickHandlerSet || setOpened(open => !open)}>
                {label}
                <div className={`board-space-centered board-space-resource-featured ${label ? "" : "board-space-no-label"}`} style={{ background: color }}>
                    {featuredAttribute ?
                        <AttributeValue attribute={featuredAttribute}></AttributeValue> :
                        prettyifyName(entity.type)}
                </div>
            </div>
            <Popup opened={opened} anchorRef={cardRef} onClose={close}>
                <EntityDetails entity={entity}></EntityDetails>
            </Popup>
        </>
    );
}
