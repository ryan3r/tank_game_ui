import { setSelectedAttibute, setSelectedEntityType } from "../../interface-adapters/map-builder.js";
import { prettyifyName } from "../../utils.js";

export function EditSpace({ mapBuilderState, dispatch }) {
    return (
        <div>
            <h2>Entity</h2>
            <EditEntity dispatch={dispatch} targetType="entity" mapBuilderState={mapBuilderState}></EditEntity>
            <h2>Floor</h2>
            <EditEntity dispatch={dispatch} targetType="floor" mapBuilderState={mapBuilderState}></EditEntity>
        </div>
    );
}

function EditEntity({ dispatch, targetType, mapBuilderState }) {
    const selectEntityType = e => {
        dispatch(setSelectedEntityType(targetType, e.target.value));
    };

    const editableKey = targetType == "entity" ? "entityEditable" : "floorTileEditable";
    const editable = mapBuilderState?.editor?.[editableKey];
    if(!editable) {
        return (
            <p>Select one or more {prettyifyName(targetType, { capitalize: false, plural: true })} that have the same type and attributes to edit</p>
        );
    }

    const typeKey = targetType == "entity" ? "entityType" : "floorTileType";
    const attributeKey = targetType == "entity" ? "entityAttribute" : "floorTileAttribute";
    const attributes = mapBuilderState.editor[attributeKey];

    // Stop propagation to keep key presses inside the editor from reaching the global key bindings
    return (
        <div onKeyDown={e => e.stopPropagation()}>
            <select value={mapBuilderState.editor[typeKey]} onChange={selectEntityType}>
                <option key="empty" value="empty">Empty</option>
                {mapBuilderState[`${targetType}Types`].map(type => {
                    return (
                        <option key={type} value={type}>{prettyifyName(type)}</option>
                    );
                })}
            </select>
            {Object.keys(attributes).map(attributeName => {
                const updateAttribute = e => {
                    dispatch(setSelectedAttibute(targetType, attributeName, e.target.value));
                };

                return (
                    <label key={attributeName}>
                        <h4>{prettyifyName(attributeName)}</h4>
                        <input value={attributes[attributeName]} onInput={updateAttribute}/>
                    </label>
                );
            })}
        </div>
    );
}