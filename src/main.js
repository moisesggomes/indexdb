const DB_NAME = "db-test";

async function main() {
    const result = await createObjectStore("people", "id");
    console.log(result);
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
            db.createObjectStore(storeName, { keyPath });
            resolve(`Store ${storeName} successfully created!`);
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

main();