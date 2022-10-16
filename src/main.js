class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
        this.id = this.#generateRandomId();
    }
    #generateRandomId() {
        let randomId = "";

        randomId += this.#randomSequence(8) + "-";
        randomId += this.#randomSequence(4) + "-";
        randomId += this.#randomSequence(4) + "-";
        randomId += this.#randomSequence(4) + "-";
        randomId += this.#randomSequence(12);

        return randomId;
    }
    #randomSequence(size) {
        return Math.random().toString(36).slice(2, 2 + size)
    }
}

const DB_NAME = "db-test";

async function openDatabase(dbName) {
    try {
        return await new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);
            request.onsuccess = (event) => {
                setGenericErrorHandlerToDatabase(request.result);
                resolve(request.result);
            };
            request.onerror = (event) => {
                console.error("Couldn't open the database");
            };
        });
    } catch (error) {}
}

function setGenericErrorHandlerToDatabase(db) {
    db.onerror = (event) => console.error(`Database error: ${event.target.error}`);
}

async function createObjectStore(database, storeName, options) {
    try {
        return await new Promise(async (resolve, reject) => {
            const actualDBVersion = await getDatabaseVersion(database.name);
            database.close();
            const request = indexedDB.open(database.name, actualDBVersion + 1);

            request.onupgradeneeded = (event) => {
                const database = request.result;
                setGenericErrorHandlerToDatabase(database);
                database.createObjectStore(storeName, options);
                resolve(database);
            };
            request.onerror = (event) => {
                console.error("Couldn't update the database");
                reject();
            };
        });
    } catch (error) {}
}

async function deleteObjectStore(database, storeName) {
    try {
        return await new Promise(async (resolve, reject) => {
            const actualDBVersion = await getDatabaseVersion(database.name);
            database.close();
            const request = indexedDB.open(database.name, actualDBVersion + 1);

            request.onupgradeneeded = (event) => {
                const database = request.result;
                setGenericErrorHandlerToDatabase(database);
                database.deleteObjectStore(storeName);
                resolve(database);
            };
            request.onerror = (event) => {
                console.error("Couldn't delete the database");
                reject();
            };
        });
    } catch (error) {}
}

async function getDatabaseVersion(dbName) {
    const databases = await indexedDB.databases();
    const databaseInfo = databases.find((value) => value.name == dbName);
    if (databaseInfo) return databaseInfo.version;
    return -1;
}

async function addData(database, data, objectStoreName) {
    try {
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction(objectStoreName, "readwrite");
            const objectStore = transaction.objectStore(objectStoreName);
            const action = objectStore.add(data);

            action.onsuccess = (event) => {
                resolve(data);
            };
        });
    } catch (error) {
        console.error(error);
    }
}