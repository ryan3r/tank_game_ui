export class GenericPossibleAction {
    constructor({ subject, actionName, displayName, fieldSpecs }) {
        this._actionName = actionName;
        this._displayName = displayName || actionName;
        this._subject = subject;
        this._fieldSpecs = fieldSpecs;
    }

    getType() {
        return "generic-possible-action";
    }

    static deserialize(rawGenericPossibleAction) {
        return new GenericPossibleAction(rawGenericPossibleAction);
    }

    serialize() {
        return {
            actionName: this._actionName,
            fieldSpecs: this._fieldSpecs,
            displayName: this._displayName,
            subject: this._subject,
        };
    }

    areParemetersValid(actionSpecific) {
        for(const field of this._fieldSpecs) {
            if(actionSpecific[field.logBookField] === undefined) return false;
        }

        return true;
    }

    getParameterSpec() {
        return this._fieldSpecs;
    }

    buildRawEntry(actionSpecific) {
        return {
            type: "action",
            action: this._actionName,
            subject: this._subject,
            ...actionSpecific,
        };
    }

    toString() {
        return this._displayName;
    }
}