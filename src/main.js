class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
        this.id = crypto.randomUUID();
    }
}





const data = document.querySelector("#data");
const save = document.querySelector("#save");
const info = document.querySelector("#info");

const DB_NAME = "db-test";
let DB;










async function main() {
    DB = await openDatabase(DB_NAME);
}

function appendInfo(info) {
    const newInfo = document.createElement("li");
    newInfo.innerHTML = info;
    info.append(newInfo);
}















async function openDatabase(dbName, version) {
    try {
        return await new Promise((resolve, reject) => {
            indexedDB.open(dbName, version).onsuccess = (event) => {
                const db = event.target.result;
                setGenericEventHandlers(db);
                resolve(db);
            };
        });
    } catch (error) { console.log(error) }
}

function setGenericEventHandlers(db) {
    db.onerror = (event) => console.error(`Database error: ${event.target.result}`);
    db.onversionchange = (event) => {
        console.log(`Database v${db.version} closing. New version requested`);
        db.close();
    };
}

async function upgradeDatabase(
    db,
    upgradeneeded=(db, end) => end(db),
    success
) {
    try {
        return await new Promise(async (resolve, reject) => {
            const request = indexedDB.open(db.name, await getDatabaseVersion(db.name) + 1);
            let DB;
            request.onupgradeneeded = (event) => {
                DB = event.target.result;
                setGenericEventHandlers(DB);
                upgradeneeded(DB, resolve);
            };
            request.onsuccess = success ? (event)=>success(DB, resolve) : (event)=>resolve(DB);
            request.onblocked = (event) => console.log("Another version is already opened");
        });
    } catch (error) { console.log("Error:", error) }
}

async function getDatabaseVersion(dbName) {
    const databaseInfo = (await indexedDB.databases()).find((value) => value.name == dbName);
    return databaseInfo ? databaseInfo.version : 0 ;
}

async function addDataToObjectStore(database, storeName, data) {
    return await new Promise((resolve, reject) => {
        const objectStore = database.transaction([ storeName ], "readwrite").objectStore(storeName);
        objectStore.add(data).onsuccess = (event) => resolve(data);
    });
}

main();