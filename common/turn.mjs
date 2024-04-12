export default class Turn {
    constructor(options) {
        Object.assign(this, options);
    }

    get valid() {
        return this.error === undefined;
    }
}