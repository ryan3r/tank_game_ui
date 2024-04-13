export class Resource {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}


export class ResourceHolder {
    constructor(resources = []) {
        for(const resource of resources) {
            this[resource.name] = resource;
        }
    }

    // Helper to reduce the number of Object.keys calls
    *[Symbol.iterator]() {
        for(const resource of Object.keys(this)) {
            yield resource;
        }
    }
}