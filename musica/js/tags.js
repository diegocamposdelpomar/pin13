/* Lee los datos de un archivo de audio: título, artista, álbum, número de pista y portada.
   Entiende etiquetas ID3v2 (MP3). Si no hay etiquetas, deduce «Artista - Título» del nombre del archivo. */
(function (root) {
  const latin1 = new TextDecoder('iso-8859-1');
  const utf8 = new TextDecoder('utf-8');
  const u16le = new TextDecoder('utf-16le');
  const u16be = new TextDecoder('utf-16be');

  const syncsafe = (b, o) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
  const be32 = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];

  function decodeText(enc, bytes) {
    let s;
    if (enc === 0) s = latin1.decode(bytes);
    else if (enc === 3) s = utf8.decode(bytes);
    else if (enc === 2) s = u16be.decode(bytes);
    else { // UTF-16 con BOM
      if (bytes[0] === 0xfe && bytes[1] === 0xff) s = u16be.decode(bytes.subarray(2));
      else if (bytes[0] === 0xff && bytes[1] === 0xfe) s = u16le.decode(bytes.subarray(2));
      else s = u16le.decode(bytes);
    }
    return s.replace(/\u0000+$/g, '').split('\u0000')[0].trim();
  }

  // Posición tras el terminador nulo (1 byte en latin1/utf8, 2 bytes alineados en utf16).
  function skipString(enc, b, o) {
    if (enc === 1 || enc === 2) {
      for (let i = o; i + 1 < b.length; i += 2) if (b[i] === 0 && b[i + 1] === 0) return i + 2;
      return b.length;
    }
    const i = b.indexOf(0, o);
    return i < 0 ? b.length : i + 1;
  }

  function unsync(b) {
    const out = new Uint8Array(b.length); let j = 0;
    for (let i = 0; i < b.length; i++) { out[j++] = b[i]; if (b[i] === 0xff && b[i + 1] === 0x00) i++; }
    return out.subarray(0, j);
  }

  async function readID3(file) {
    const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    if (head.length < 10 || head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return null; // "ID3"
    const ver = head[3]; const flags = head[5];
    const size = syncsafe(head, 6);
    if (ver < 2 || ver > 4 || size <= 0 || size > 30e6) return null;
    let b = new Uint8Array(await file.slice(10, 10 + size).arrayBuffer());
    if ((flags & 0x80) && ver < 4) b = unsync(b);
    let o = 0;
    if ((flags & 0x40) && ver >= 3) o = ver === 4 ? syncsafe(b, 0) : be32(b, 0) + 4;

    const tags = {};
    const idLen = ver === 2 ? 3 : 4; const hdrLen = ver === 2 ? 6 : 10;
    while (o + hdrLen <= b.length) {
      const id = latin1.decode(b.subarray(o, o + idLen));
      if (!/^[A-Z0-9]+$/.test(id)) break;
      let fsize = ver === 2 ? (b[o + 3] << 16) | (b[o + 4] << 8) | b[o + 5] : ver === 4 ? syncsafe(b, o + 4) : be32(b, o + 4);
      const fflags = ver === 2 ? 0 : b[o + 9];
      o += hdrLen;
      if (fsize <= 0 || o + fsize > b.length) break;
      let data = b.subarray(o, o + fsize);
      o += fsize;
      if (ver === 4) {
        if (fflags & 0x01) data = data.subarray(4); // indicador de longitud
        if (fflags & 0x02) data = unsync(data);
        if (fflags & 0x0c) continue; // comprimido o cifrado: lo saltamos
      }
      const key = { TIT2: 'title', TT2: 'title', TPE1: 'artist', TP1: 'artist', TALB: 'album', TAL: 'album', TRCK: 'track', TRK: 'track', TPE2: 'albumArtist', TP2: 'albumArtist' }[id];
      if (key && data.length > 1) { if (!tags[key]) tags[key] = decodeText(data[0], data.subarray(1)); continue; }
      if ((id === 'APIC' || id === 'PIC') && !tags.cover && data.length > 8) {
        const enc = data[0]; let p = 1, mime;
        if (id === 'PIC') { const fmt = latin1.decode(data.subarray(1, 4)).toLowerCase(); mime = fmt === 'png' ? 'image/png' : 'image/jpeg'; p = 4; }
        else { const e = skipString(0, data, 1); mime = latin1.decode(data.subarray(1, e - 1)).toLowerCase() || 'image/jpeg'; p = e; }
        p += 1; // tipo de imagen
        p = skipString(enc, data, p);
        if (!mime.includes('/')) mime = 'image/' + (mime === 'png' ? 'png' : 'jpeg');
        if (p < data.length) tags.cover = new Blob([data.slice(p)], { type: mime });
      }
    }
    return tags;
  }

  function fromName(name) {
    const base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const clean = base.replace(/^\d{1,3}\s*[-.)]\s*/, '');
    const m = clean.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    return m ? { artist: m[1].trim(), title: m[2].trim() } : { title: clean || base || 'Sin título' };
  }

  function duration(blob) {
    return new Promise((resolve) => {
      const a = document.createElement('audio');
      const url = URL.createObjectURL(blob);
      let done = false;
      const end = (d) => { if (done) return; done = true; URL.revokeObjectURL(url); a.removeAttribute('src'); a.load(); resolve(isFinite(d) && d > 0 ? d : 0); };
      a.preload = 'metadata';
      a.onloadedmetadata = () => {
        if (a.duration === Infinity) { // algunos archivos (webm/ogg) no informan duración hasta buscar al final
          a.ontimeupdate = () => { a.ontimeupdate = null; end(a.duration); };
          a.currentTime = 1e9;
        } else end(a.duration);
      };
      a.onerror = () => end(-1);
      setTimeout(() => end(a.duration), 6000);
      a.src = url;
    });
  }

  async function read(file) {
    let tags = null;
    try { tags = await readID3(file); } catch (e) { tags = null; }
    const byName = fromName(file.name || '');
    const tn = tags && tags.track ? parseInt(tags.track, 10) : NaN;
    return {
      title: (tags && tags.title) || byName.title,
      artist: (tags && (tags.artist || tags.albumArtist)) || byName.artist || 'Artista desconocido',
      album: (tags && tags.album) || 'Sin álbum',
      trackNo: isFinite(tn) ? tn : 0,
      cover: (tags && tags.cover) || null,
      duration: await duration(file)
    };
  }

  root.OndaTags = { read, fromName };
})(window);
