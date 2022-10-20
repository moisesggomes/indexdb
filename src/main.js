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
let DATABASE;










async function main() {
    const people = [
        { name: "Moises", age: 23 },
        { name: "Carter", age: 20 },
        { name: "Emma"  , age: 18 }
    ];

    DATABASE = await upgradeDatabase(DB_NAME, (database, end) => {
        const peopleStore = database.createObjectStore("people", { keyPath: "id" });
        // peopleStore.createIndex("id"  , "id"  , { unique: true  });
        // peopleStore.createIndex("name", "name", { unique: false });
        // peopleStore.createIndex("age" , "age" , { unique: false });

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
                    console.log("people:", getPeopleRequest.result);
                    end(database);
                }
            }
        }
    });

    // db = await upgradeDatabase(db, (database, end) => {
    //     database.deleteObjectStore("people");
    // });

    console.log(DATABASE);
}
















async function openDatabase(dbName, version) {
    try {
        return await new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);
            request.onsuccess = (event) => {
                setGenericErrorHandlerToDatabase(request.result);
                resolve(request.result);
            };
        });
    } catch (error) { console.log("Error:", error) }
}

function setGenericErrorHandlerToDatabase(db) {
    db.onerror = (event) => console.error(`Database error: ${event.target.result}`);
}

async function upgradeDatabase(db, doStuff=(db, end)=>end(db)) {
    try {
        return await new Promise(async (resolve, reject) => {
            const request = indexedDB.open(db.name, await getDatabaseVersion(dbName) + 1);

            request.onupgradeneeded = (event) => {
                setGenericErrorHandlerToDatabase(request.result);
                doStuff(request.result, resolve);
            };
        });
    } catch (error) { console.log("Error:", error) }
}

async function getDatabaseVersion(dbName) {
    const databases = await indexedDB.databases();
    const databaseInfo = databases.find((value) => value.name == dbName);
    return databaseInfo ? databaseInfo.version : 0 ;
}

async function addDataToObjectStore(database, data, storeName) {
    try {
        return await new Promise((resolve, reject) => {
            const objectStore = database.transaction([ storeName ], "readwrite").objectStore(storeName);
            const action = objectStore.add(data);
            action.onsuccess = (event) => resolve(data);
        });
    } catch (error) { console.log("Error:", error) }
}

main();