javascript:(function() {
    const style = document.createElement('style');
    style.innerHTML = `
      .indexeddb-viewer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 45%;
        background: white;
        border-top: 1px solid #ccc;
        overflow-y: auto;
        z-index: 10000;
        padding: 10px;
        box-sizing: border-box;
      }
      .indexeddb-viewer textarea {
        width: 100%;
        height: 150px;
      }
      .indexeddb-viewer button {
        display: block;
        margin: 10px 0;
      }
      .indexeddb-viewer .close-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        background: #f44336;
        color: white;
        border: none;
        padding: 5px 10px;
      }
      .indexeddb-viewer .section {
        border: 1px solid #ccc;
        padding: 10px;
        margin-bottom: 10px;
      }
    `;
    document.head.appendChild(style);
  
    const container = document.createElement('div');
    container.className = 'indexeddb-viewer';
    container.innerHTML = `
      <button class="close-btn">X</button>
      <h2>IndexedDB Viewer</h2>
      <div class="content"></div>
    `;
    document.body.appendChild(container);
  
    document.querySelector('.indexeddb-viewer .close-btn').addEventListener('click', () => {
      document.body.removeChild(container);
    });
  
    const contentDiv = container.querySelector('.content');
  
    function showData(dbName, storeName, data) {
      const section = document.createElement('div');
      section.className = 'section';
      section.innerHTML = `
        <h3>Database: ${dbName}</h3>
        <h4>Object Store: ${storeName}</h4>
        <textarea>${JSON.stringify(data, null, 2)}</textarea>
        <button class="update-btn">Update</button>
      `;
      section.querySelector('.update-btn').addEventListener('click', async () => {
        const updatedData = section.querySelector('textarea').value;
        try {
          const parsedData = JSON.parse(updatedData);
          await updateIndexedDB(dbName, storeName, parsedData);
          alert('Data updated successfully');
        } catch (e) {
          alert('Invalid JSON data.');
          console.error('Error parsing JSON:', e);
        }
      });
      contentDiv.appendChild(section);
    }
  
    async function readIndexedDB() {
      contentDiv.innerHTML = '';
      const dbNames = await indexedDB.databases();
      for (const dbInfo of dbNames) {
        const dbName = dbInfo.name;
        const db = await new Promise((resolve, reject) => {
          const openRequest = indexedDB.open(dbName);
          openRequest.onsuccess = () => resolve(openRequest.result);
          openRequest.onerror = () => reject(openRequest.error);
        });
  
        for (const storeName of db.objectStoreNames) {
          const data = await new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
          });
          showData(dbName, storeName, data);
        }
  
        db.close();
      }
    }
  
    async function updateIndexedDB(dbName, storeName, updatedData) {
      const db = await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(dbName);
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onerror = () => reject(openRequest.error);
      });
  
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = resolve;
        clearRequest.onerror = reject;
      });
  
      for (const item of updatedData) {
        await new Promise((resolve, reject) => {
          const addRequest = store.add(item);
          addRequest.onsuccess = resolve;
          addRequest.onerror = reject;
        });
      }
  
      db.close();
    }
  
    readIndexedDB();
  })();
  