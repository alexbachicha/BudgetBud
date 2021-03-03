const indexedDB = 
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
// Create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  // Create object store called "pending" and set autoIncrement to true
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = target.result;

  // Check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  // Create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // Access pending object store
  const store = transaction.objectStore("pending");

  // Add record to your store with add method.
  store.add(record);
}

function checkDatabase() {
  // Open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // Access your pending object store
  const store = transaction.objectStore("pending");
  // Get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        return response.json();
      })
      .then(() => {
        // If successful, delete records
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
