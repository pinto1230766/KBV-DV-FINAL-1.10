// utils/idb.ts
const DB_NAME = 'kbv-app-db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

async function reopenDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      // Close the existing connection if it's still open
      if (db) {
        try {
          db.close();
        } catch (e) {
          console.warn('Error closing database connection:', e);
        }
      }
    } catch (error) {
      console.warn('Database connection issue, reopening:', error);
    }
  }
  
  dbPromise = null; // Reset the promise
  return getDB();
}

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        dbPromise = null; // Reset on error
        reject(request.error);
    };
    request.onsuccess = () => {
        const db = request.result;
        // Handle database connection close events
        db.onclose = () => {
          console.warn('Database connection closed unexpectedly');
          dbPromise = null;
        };
        db.onerror = (event) => {
          console.error('Database error:', event);
        };
        resolve(db);
    };
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
  });
  return dbPromise;
}

export async function get<T>(key: IDBValidKey): Promise<T | undefined> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const db = await getDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        
        transaction.onerror = () => {
          console.error('Transaction error in get():', transaction.error);
          reject(transaction.error);
        };
        
        transaction.onabort = () => {
          console.warn('Transaction aborted in get()');
          reject(new Error('Transaction aborted'));
        };
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T | undefined);
      });
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed in get():`, error);
      
      // Check for specific database connection errors
      const isConnectionError = lastError instanceof DOMException && 
        (lastError.name === 'InvalidStateError' || 
         lastError.message.includes('database connection is closing') ||
         lastError.message.includes('Database connection is closed'));
      
      if (attempt < maxRetries - 1) {
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        // Try to reopen the database connection
        await reopenDB();
      } else if (isConnectionError) {
        // For connection errors, try one more immediate reconnect
        try {
          await reopenDB();
          const db = await getDB();
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(new Error('Transaction aborted'));
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result as T | undefined);
          });
        } catch (finalError) {
          console.error('Final retry attempt failed:', finalError);
        }
      }
    }
  }
  
  console.error('All retries failed in get():', lastError);
  throw lastError || new Error('Failed to get data after multiple attempts');
}

export async function set(key: IDBValidKey, value: any): Promise<void> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const db = await getDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        
        transaction.onerror = () => {
          console.error('Transaction error in set():', transaction.error);
          reject(transaction.error);
        };
        
        transaction.onabort = () => {
          console.warn('Transaction aborted in set()');
          reject(new Error('Transaction aborted'));
        };
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          // Data written successfully, wait for transaction to complete
        };
      });
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed in set():`, error);
      
      // Check for specific database connection errors
      const isConnectionError = lastError instanceof DOMException && 
        (lastError.name === 'InvalidStateError' || 
         lastError.message.includes('database connection is closing') ||
         lastError.message.includes('Database connection is closed'));
      
      if (attempt < maxRetries - 1) {
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        // Try to reopen the database connection
        await reopenDB();
      } else if (isConnectionError) {
        // For connection errors, try one more immediate reconnect
        try {
          await reopenDB();
          const db = await getDB();
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(new Error('Transaction aborted'));
            transaction.oncomplete = () => resolve();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {};
          });
        } catch (finalError) {
          console.error('Final retry attempt failed:', finalError);
        }
      }
    }
  }
  
  console.error('All retries failed in set():', lastError);
  throw lastError || new Error('Failed to set data after multiple attempts');
}

export async function del(key: IDBValidKey): Promise<void> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const db = await getDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        
        transaction.onerror = () => {
          console.error('Transaction error in del():', transaction.error);
          reject(transaction.error);
        };
        
        transaction.onabort = () => {
          console.warn('Transaction aborted in del()');
          reject(new Error('Transaction aborted'));
        };
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          // Data deleted successfully, wait for transaction to complete
        };
      });
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed in del():`, error);
      
      // Check for specific database connection errors
      const isConnectionError = lastError instanceof DOMException && 
        (lastError.name === 'InvalidStateError' || 
         lastError.message.includes('database connection is closing') ||
         lastError.message.includes('Database connection is closed'));
      
      if (attempt < maxRetries - 1) {
        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        // Try to reopen the database connection
        await reopenDB();
      } else if (isConnectionError) {
        // For connection errors, try one more immediate reconnect
        try {
          await reopenDB();
          const db = await getDB();
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(new Error('Transaction aborted'));
            transaction.oncomplete = () => resolve();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {};
          });
        } catch (finalError) {
          console.error('Final retry attempt failed:', finalError);
        }
      }
    }
  }
  
  console.error('All retries failed in del():', lastError);
  throw lastError || new Error('Failed to delete data after multiple attempts');
}
