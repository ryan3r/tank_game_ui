export function objectMap(obj, mapFn) {
    let mappedObject = {};

    for(const key of Object.keys(obj)) {
        mappedObject[key] = mapFn(obj[key], key);
    }

    return mappedObject;
}