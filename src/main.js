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

async function main() {
    const names = [ "mons", "carter", "emma", "percy", "ana", "ron", "harry" ];
    let db;
    const request = indexedDB.open(DB_NAME);

    request.onerror = (event) => console.error(`Database error: ${event.target.error}`);

    request.onupgradeneeded = (event) => {
        db = request.result;

        const objectStore = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex( "id",   "id",   { unique: true }  );
        objectStore.createIndex( "name", "name", { unique: false } );
        objectStore.createIndex( "age",  "age",  { unique: false } );
    };

    request.onsuccess = (event) => {
        db = request.result;
        db.onerror = (event) => console.error(`Database error: ${event.target.errorCode}`);

        const transaction = db.transaction([ "users" ], "readwrite");
        const users = transaction.objectStore("users");
        
        // names.forEach((name) => {
        //     const requestAddUsers = users.add({ name, age: Math.floor(Math.random() * 20) + 1 });

        //     requestAddUsers.onsuccess = (event) => console.log(`${requestAddUsers.result} added!`);
        // });

        const requestGetUsers = users.getAll(IDBKeyRange.lowerBound(11), 3);
        requestGetUsers.onsuccess = (event) => console.log(event.target.result);
    };

}

















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
    return 0;
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

main();