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
let db;







async function main() {
    const people = [
        { name: "Moises", age: 23 },
        { name: "Carter", age: 20 },
        { name: "Emma", age: 18 }
    ];

    console.time("timer");

    db = await upgradeDatabase(DB_NAME, (database) => {
        const peopleStore = database.createObjectStore("people", { keyPath: "id" });
        peopleStore.createIndex("id", "id", { unique: true });
        peopleStore.createIndex("name", "name", { unique: false });
        peopleStore.createIndex("age", "age", { unique: false });

        peopleStore.transaction.oncomplete = (event) => {
            const transaction = database.transaction([ "people" ], "readwrite");
            const peopleStore = transaction.objectStore("people");

            people.forEach((person) => {
                peopleStore.add(new Person(person.name, person.age));
            });

            transaction.oncomplete = (event) => {
                const transaction = database.transaction([ "people" ], "readonly");
                const peopleStore = transaction.objectStore("people");
                const getPeopleRequest = peopleStore.getAll();

                getPeopleRequest.onsuccess = (event) => {
                    console.log(getPeopleRequest.result);

                    console.timeEnd("timer");
                }
            }
        }
    });
    console.log(db);
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
    db.onerror = (event) => console.error(`Database error: ${event.target.result}`);
}

async function upgradeDatabase(
    database,
    doStuff = (database, end) => end(database)
) {
    try {
        return await new Promise(async (resolve, reject) => {
            let dbName;
            if (typeof database === "string") {
                dbName = database;
            } else {
                dbName = database.name;
                database.close();
            }

            const actualDBVersion = await getDatabaseVersion(dbName);
            const request = indexedDB.open(dbName, actualDBVersion + 1);
            let db;

            request.onupgradeneeded = (event) => {
                db = request.result;
                setGenericErrorHandlerToDatabase(db);

                doStuff(db, resolve);
            };

            request.onerror = (event) => {
                console.error("Couldn't update the database");
                reject();
            };

            request.onsuccess = (event) => resolve(db);
        });
    } catch (error) { console.log(error) }
}

async function getDatabaseVersion(dbName) {
    const databases = await indexedDB.databases();
    const databaseInfo = databases.find((value) => value.name == dbName);
    if (databaseInfo) return databaseInfo.version;
    return 0;
}

async function addDataToObjectStore(
    database,
    data,
    objectStoreName
) {
    try {
        return await new Promise((resolve, reject) => {
            const transaction = database.transaction([ objectStoreName ], "readwrite");
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