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
    // const result = await createObjectStore("people", "id");
    // console.log(result);
}

async function createObjectStore(storeName, keyPath) {
    const result = new Promise(async (resolve, reject) => {
        const databases = await indexedDB.databases();
        const actualDB = databases.find((value) => value.name === DB_NAME);
        const newVersion = actualDB?.version ? actualDB?.version + 1 : 1 ;

        console.log("DB_NAME:", DB_NAME, "\nnewVersion:", newVersion);
        const request = indexedDB.open(DB_NAME, newVersion);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (keyPath) {
                db.createObjectStore(storeName, { keyPath });
            } else {
                db.createObjectStore(storeName);
            }
            resolve(`Store "${storeName}" successfully created!`);
        };

        request.onerror = (event) => {
            reject("Couldn't create store");
        };
    });

    try {
        return await result;
    } catch(error) {
        console.error(error);
        return error;
    }
}

async function addData(data, dbName, objectStoreName) {
    const result = new Promise((resolve, reject) => {
        let db;
        const request = indexedDB.open(dbName);

        request.onsuccess = (event) => {
            db = request.result;

            const transaction = db.transaction(objectStoreName, "readwrite");
            const objectStore = transaction.objectStore(objectStoreName);
            const requestAdd = objectStore.add(data);

            requestAdd.onsuccess = (event) => {
                resolve(`Data successfully added to "${objectStoreName}" store`);
            }

            requestAdd.onerror = (event) => {
                reject(new Error(`Couldn't add the data to "${objectStoreName}" store`));
            }
        }

        request.onerror = (event) => {
            reject(new Error("Couldn't open", dbName, "database"));
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