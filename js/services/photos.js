import { PHOTO_DB_NAME, PHOTO_STORE } from '../constants.js';
import { isYmd } from '../utils.js';
import { state, todayStr, today, saveState } from '../state.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml } from '../utils.js';

export function openPhotoDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(PHOTO_STORE);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = ()  => reject(req.error);
  });
}

export async function savePhotoData(id, dataUrl) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(dataUrl, id);
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

export async function getPhotoData(id) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(PHOTO_STORE, 'readonly');
    const req = tx.objectStore(PHOTO_STORE).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

export async function removePhotoData(id) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

export async function clearAllPhotoData() {
  if (!('indexedDB' in window)) return;
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror    = () => reject(tx.error);
  });
}

export function compressImage(file, maxDim = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be loaded'));
    };
    img.src = url;
  });
}

export function hasPhotoThisWeek() {
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return state.weeklyPhotos.some(p => isYmd(p.date) && new Date(p.date + 'T00:00:00') >= weekStart);
}

export async function addWeeklyPhoto(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Choose an image file');
    return;
  }
  try {
    showToast('Saving photo…');
    const dataUrl = await compressImage(file);
    const id = 'photo_' + Date.now();
    await savePhotoData(id, dataUrl);

    const weekNum = (state.weeklyPhotos.length + 1);
    state.weeklyPhotos.push({ id, date: todayStr, label: `Week ${weekNum}` });

    if (state.weeklyPhotos.length > 6) {
      const removed = state.weeklyPhotos.shift();
      await removePhotoData(removed.id);
    }

    saveState();
    await renderWeeklyPhotos();
  } catch (e) {
    console.warn('Photo save failed', e);
    showToast('Could not save photo');
  }
}

export async function deleteWeeklyPhoto(id) {
  if (!confirm('Delete this photo?')) return;
  try {
    await removePhotoData(id);
    state.weeklyPhotos = state.weeklyPhotos.filter(p => p.id !== id);
    saveState();
    await renderWeeklyPhotos();
  } catch (e) {
    console.warn('Photo delete failed', e);
    showToast('Could not delete photo');
  }
}

export async function renderWeeklyPhotos() {
  const grid = document.getElementById('weekly-photos-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!state.weeklyPhotos.length) {
    grid.innerHTML = '<p class="empty-photos">No photos yet. Use Add Photo for your first weekly shot.</p>';
    return;
  }

  const photos = [...state.weeklyPhotos].reverse();
  let missingPhotos = 0;
  for (const photo of photos) {
    let dataUrl = null;
    try {
      dataUrl = await getPhotoData(photo.id);
    } catch (e) {
      console.warn('Photo read failed', e);
      missingPhotos++;
      continue;
    }
    if (!dataUrl) { missingPhotos++; continue; }

    const date = new Date(photo.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const item = document.createElement('div');
    item.className = 'photo-item';
    item.innerHTML = `
      <img class="photo-img" src="${dataUrl}" alt="${escapeHtml(photo.label)}" />
      <div class="photo-overlay">
        <span class="photo-label-text">${escapeHtml(photo.label)}</span>
        <span class="photo-date-text">${dateStr}</span>
      </div>
      <button class="photo-delete-btn" aria-label="Delete photo">✕</button>
    `;
    item.querySelector('.photo-delete-btn').addEventListener('click', e => {
      e.stopPropagation();
      deleteWeeklyPhoto(photo.id);
    });
    grid.appendChild(item);
  }

  if (!grid.children.length) {
    grid.innerHTML = '<p class="empty-photos">Photo history exists, but images are stored only on the device where they were added.</p>';
  } else if (missingPhotos) {
    const note = document.createElement('p');
    note.className = 'empty-photos';
    note.textContent = `${missingPhotos} synced photo ${missingPhotos === 1 ? 'entry is' : 'entries are'} not stored on this device.`;
    grid.appendChild(note);
  }
}
