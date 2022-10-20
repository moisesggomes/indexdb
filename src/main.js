class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
        this.id = crypto.randomUUID();
    }

    // #generateRandomId() {
    //     let randomId = "";

    //     randomId += this.#randomSequence(8) + "-";
    //     randomId += this.#randomSequence(4) + "-";
    //     randomId += this.#randomSequence(4) + "-";
    //     randomId += this.#randomSequence(4) + "-";
    //     randomId += this.#randomSequence(12);

    //     return randomId;
    // }

    // #randomSequence(size) {
    //     return Math.random().toString(36).slice(2, 2 + size)
    // }
}





const DB_NAME = "db-test";
let DB;










async function main() {
    DB = await openDatabase(DB_NAME);
    let people = [
        new Person("Moises", 23),
        new Person("Ana", 18),
        new Person("Carter", 20),
        new Person("David", 24),
        new Person("Ana", 20),
        new Person("Ana", 16),
    ];

    const getPeopleTransaction = DB.transaction([ "people" ], "readonly");
    const peopleObjectStore = getPeopleTransaction.objectStore("people");

    // const getPeopleRequest = peopleObjectStore.getAll().onsuccess = (event) => people=event.target.result;
    // getPeopleRequest.onerror = (event) => console.error(event.error);

    getPeopleTransaction.oncomplete = async (event) => {
        DB = await upgradeDatabase(
            DB,
            (db, end) => {
                db.deleteObjectStore("people");
                const peopleObjectStore = db.createObjectStore("people", { autoIncrement: true, keyPath: "id" });
                peopleObjectStore.createIndex("id"  , "id"  , { unique: true  });
                peopleObjectStore.createIndex("name", "name", { unique: false });
                peopleObjectStore.createIndex("age" , "age" , { unique: false });
            },
            (db, end) => {
                const transaction = db.transaction([ "people" ], "readwrite");
                const peopleObjectStore = transaction.objectStore("people");

                people.forEach((value, index) => {
                    peopleObjectStore.add(value).onerror = (event) => event.stopPropagation();
                });
                
                // (new IDBIndex()).getAll()
                peopleObjectStore.index("age").openCursor(IDBKeyRange.upperBound(18)).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        console.log("Data:", cursor.value);
                        cursor.continue();
                    }
                };

                end(db);
            }
        );
    };
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
    } catch (error) { console.log(error) }
}

function setGenericErrorHandlerToDatabase(db) {
    db.onerror = (event) => console.error(`Database error: ${event.target.result}`);
}

async function upgradeDatabase(db, upgradeneeded=(db, end)=>end(db), success) {
    try {
        return await new Promise(async (resolve, reject) => {
            db.close();
            const request = indexedDB.open(db.name, await getDatabaseVersion(db.name) + 1);

            request.onupgradeneeded = (event) => {
                setGenericErrorHandlerToDatabase(event.target.result);
                upgradeneeded(event.target.result, resolve);
            };

            if (success) request.onsuccess = (event) => success(event.target.result, resolve);
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