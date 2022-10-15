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

const h1 = document.querySelector("h1");
const fileInput = document.querySelector("input[type='file']");

const DB_NAME = "db-test";
let DATABASE;

async function main() {
    
}

async function openDatabase(dbName) {
    const result = new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
    
        request.onsuccess = (event) => {
            console.log("Database opened!");

            request.result.onerror = () => console.log("Error in the database!");

            resolve(request.result);
        };
    
        request.onupgradeneeded = (event) => console.log("Upgrade needed!");
    
        request.onerror = (event) => {
            console.log("Error with the database!");
            reject("Error with the database!");
        };
    });

    try {
        return await result
    } catch(error) {
        return error;
    }
}

async function getDatabaseVersion(dbName) {
    const databases = await indexedDB.databases();
    const databaseInfo = databases.find((value) => value.name == dbName);
    if (databaseInfo) return databaseInfo.version;
    return -1;
}

async function createObjectStore(storeName, keyPath) {
    const result = new Promise(async (resolve, reject) => {
        const actualDBVersion = await getDatabaseVersion(DB_NAME);
        const request = indexedDB.open(DB_NAME, actualDBVersion + 1);

        request.onupgradeneeded = (event) => {
            const database = request.result;

            if (keyPath) database.createObjectStore(storeName, { keyPath });
            else database.createObjectStore(storeName, { autoIncrement: true });

            const successfullyCreatedMessage = `Store "${storeName}" successfully created!`;
            console.log(successfullyCreatedMessage);
            resolve(successfullyCreatedMessage);
        };

        request.onerror = (event) => {
            const errorMessage = "Couldn't create store";
            console.log(errorMessage);
            reject(errorMessage);
        };
    });

    try {
        return await result;
    } catch(error) {
        console.error(error);
        return error;
    }
}

async function addData(database, data, objectStoreName) {
    const result = new Promise((resolve, reject) => {
        const transaction = database.transaction(objectStoreName, "readwrite");
        const objectStore = transaction.objectStore(objectStoreName);
        const action = objectStore.add(data);

        action.onsuccess = (event) => {
            const successMessage = `Data successfully added to "${objectStoreName}" store`;
            console.log(successMessage);
            resolve(successMessage);
        }

        action.onerror = (event) => {
            const errorMessage = `Couldn't add the data to "${objectStoreName}" store`;
            console.log(errorMessage);
            reject(new Error(errorMessage));
        }
    });

    try {
        return await result;
    } catch (error) {
        console.error(error);
        return error;
    }
}

main();