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


function getBadgesForEntity(spec, entity) {
    const badgeAttribute = entity.get(spec.badgeAttribute);

    const rightBadge = badgeAttribute ? (
        <div className="board-space-entity-badge right-badge" style={{ background: spec.badgeColor, color: spec.badgeTextColor }}>
            {badgeAttribute.value}
        </div>
    ): undefined;

    const indicators = (spec.indicators || [])
        // Display indictors for any attributes that are "truthy"
        .filter(indicator => entity.get(indicator.name)?.value)
        .map(indicator => <span key={indicator.name} style={{ color: indicator.color }}>{indicator.symbol}</span>);

    const leftBadge = indicators.length > 0 ? (
        <div className="board-space-entity-badge left-badge" style={{ background: spec.indicatorBackground, color: spec.indicatorDefaultColor }}>
            {indicators}
        </div>
    ): undefined;

    return leftBadge || rightBadge ?
        <div className="board-space-entity-badges">{leftBadge}<div className="separator"></div>{rightBadge}</div> : undefined;
}


export function EntityTile({ entity, showPopupOnClick, config }) {
    const cardRef = useRef();
    const [opened, setOpened] = useState(false);

    const close = useCallback(() => setOpened(false), [setOpened]);

    const label = entity.player && (
        <div className="board-space-entity-title board-space-centered">
            <div className="board-space-entity-title-inner">{prettyifyName(entity.player?.name || "")}</div>
        </div>
    );

    const spec = (config && config.getEntityDescriptor(entity.type)) || { color: {} };
    const featuredAttribute = entity.get(spec.featuredAttribute);
    const color = spec.color[featuredAttribute?.toString()] || spec.color.$else;

    const badges = getBadgesForEntity(spec, entity);

    return (
        <>
            <div className="board-space-entity" ref={cardRef} onClick={() => showPopupOnClick && setOpened(open => !open)} style={{ background: color }}>
                {label}
                <div className={`board-space-centered board-space-resource-featured ${label ? "" : "board-space-no-label"}`}>
                    {featuredAttribute ? featuredAttribute.value : undefined}
                </div>
                {badges}
            </div>
            <Popup opened={opened} anchorRef={cardRef} onClose={close}>
                <EntityDetails entity={entity}></EntityDetails>
            </Popup>
        </>
    );
}
