/* Almacén local (IndexedDB): las canciones quedan guardadas en el teléfono y se escuchan sin internet.
   - tracks:    datos de cada canción (título, artista, portada…), ligeros para listar rápido.
   - files:     el audio en sí, aparte, para no cargarlo hasta que se reproduce.
   - playlists: listas creadas por la persona. */
(function (root) {
  const NAME = 'onda-musica';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
        if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  async function tx(stores, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(stores, mode);
      let out;
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Operación cancelada'));
      const s = Array.isArray(stores) ? stores.map((n) => t.objectStore(n)) : [t.objectStore(stores)];
      const r = fn(...s);
      if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
    });
  }

  const DB = {
    allTracks: () => tx('tracks', 'readonly', (s) => s.getAll()),
    allPlaylists: () => tx('playlists', 'readonly', (s) => s.getAll()),
    getFile: (id) => tx('files', 'readonly', (s) => s.get(id)),
    addTrack: (meta, blob) => tx(['tracks', 'files'], 'readwrite', (t, f) => { t.put(meta); f.put(blob, meta.id); }),
    putTrack: (meta) => tx('tracks', 'readwrite', (s) => { s.put(meta); }),
    deleteTrack: (id) => tx(['tracks', 'files'], 'readwrite', (t, f) => { t.delete(id); f.delete(id); }),
    putPlaylist: (p) => tx('playlists', 'readwrite', (s) => { s.put(p); }),
    deletePlaylist: (id) => tx('playlists', 'readwrite', (s) => { s.delete(id); }),
    clearAll: () => tx(['tracks', 'files', 'playlists'], 'readwrite', (a, b, c) => { a.clear(); b.clear(); c.clear(); })
  };

  root.OndaDB = DB;
})(window);
