import { Position } from "../../game/state/board/position.js";
import { setSelectedAttibute, setSelectedEntityType } from "../../interface-adapters/map-builder.js";

export function EditSpace({ mapBuilderState, dispatch }) {
    if(mapBuilderState.locationSelector.location === undefined) {
        return <p>Select a location to start editing</p>;
    }

    const position = new Position(mapBuilderState.locationSelector.location);
    const {board} = mapBuilderState.initialState;
    const entity = board.getEntityAt(position);
    const floor = board.getFloorTileAt(position);

    return (
        <div>
            <h3>Entity</h3>
            <EditEntity entity={entity} dispatch={dispatch} targetType="entity"></EditEntity>
            <h3>Floor</h3>
            <EditEntity entity={floor} dispatch={dispatch} targetType="floor"></EditEntity>
        </div>
    );
}

function EditEntity({ entity, dispatch, targetType }) {
    const selectEntityType = e => {
        dispatch(setSelectedEntityType(targetType, e.target.value));
    };

    return (
        <div>
            <select value={entity.type} onChange={selectEntityType}>
                <option>empty</option>
                <option>tank</option>
                <option>wall</option>
                <option>gold_mine</option>
            </select>
            {Object.keys(entity.attributes).map(attributeName => {
                const updateAttribute = e => {
                    dispatch(setSelectedAttibute(targetType, attributeName, +e.target.value));
                };

                return (
                    <label key={attributeName}>
                        <div>{attributeName}</div>
                        <input type="number" value={entity.attributes[attributeName]} onInput={updateAttribute}/>
                    </label>
                );
            })}
        </div>
    );
}