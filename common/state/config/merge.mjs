export function getCombinedKeys(...objects) {
    let keys = [];
    for(const object of objects) {
        if(object) keys = keys.concat(Object.keys(object));
    }

    return keys;
}

export function deepMerge(objects, options) {
    let merged = objects[0];
    for(let i = 1; i < objects.length; ++i) {
        merged = deepMergeTwoObjects(merged, objects[i], options);
    }

    return merged;
}

function deepMergeTwoObjects(objectA, objectB, { currentPath = "", objectsToOverwrite = [], pathsToIgnore = [] } = {}) {
    if(objectB === undefined) {
        return objectA;
    }

    if(typeof objectA != typeof objectB || typeof objectB != "object" ||
            Array.isArray(objectA) != Array.isArray(objectB) || objectsToOverwrite.includes(currentPath)) {
        return objectB;
    }

    if(Array.isArray(objectA)) {
        return objectA.concat(objectB);
    }

    let combined = {};
    for(const key of getCombinedKeys(objectA, objectB)) {
        const keyPath = `${currentPath}/${key}`;

        if(pathsToIgnore.includes(keyPath)) continue;

        combined[key] = deepMergeTwoObjects(objectA[key], objectB[key], {
            currentPath: keyPath,
            objectsToOverwrite,
            pathsToIgnore,
        });
    }

    return combined;
}