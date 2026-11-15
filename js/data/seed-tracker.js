import { saveState } from '../storage.js';

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Draws `count` unseen items from `pool` under `poolKey`, persisting seen IDs in `state.seen`
 * so players never encounter repeated questions, words, boards, or shapes across 3+ months of play.
 */
export function drawFreshItems(state, poolKey, pool, count, getIdFn) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  if (!state.seen || typeof state.seen !== 'object') {
    state.seen = {};
  }
  const seenList = Array.isArray(state.seen[poolKey]) ? state.seen[poolKey].slice() : [];
  const seenSet = new Set(seenList);

  const idOf = function (item, idx) {
    if (getIdFn) return String(getIdFn(item, idx));
    if (item && item.id !== undefined) return String(item.id);
    return String(idx);
  };

  const indexed = pool.map(function (item, idx) {
    return { item: item, id: idOf(item, idx) };
  });

  const unseen = indexed.filter(function (entry) {
    return !seenSet.has(entry.id);
  });

  const picked = [];
  if (unseen.length >= count) {
    const chosen = shuffleArray(unseen).slice(0, count);
    for (let i = 0; i < chosen.length; i++) {
      picked.push(chosen[i].item);
      seenList.push(chosen[i].id);
    }
  } else {
    const firstPart = shuffleArray(unseen);
    const justPickedIds = new Set();
    for (let i = 0; i < firstPart.length; i++) {
      picked.push(firstPart[i].item);
      justPickedIds.add(firstPart[i].id);
    }
    const needMore = Math.min(pool.length - picked.length, count - picked.length);
    const freshPool = shuffleArray(
      indexed.filter(function (entry) {
        return !justPickedIds.has(entry.id);
      })
    ).slice(0, Math.max(0, needMore));

    // Keep seen history of items not in this pool (e.g. if filtered by region/level), reset only current pool IDs
    const currentPoolIds = new Set(
      indexed.map(function (e) {
        return e.id;
      })
    );
    const retainedOtherIds = seenList.filter(function (id) {
      return !currentPoolIds.has(id);
    });

    seenList.length = 0;
    for (let i = 0; i < retainedOtherIds.length; i++) seenList.push(retainedOtherIds[i]);
    for (let i = 0; i < firstPart.length; i++) seenList.push(firstPart[i].id);
    for (let i = 0; i < freshPool.length; i++) {
      picked.push(freshPool[i].item);
      seenList.push(freshPool[i].id);
    }
  }

  state.seen[poolKey] = seenList;
  saveState(state);
  return picked;
}

export function hasSeenSignature(state, poolKey, sig) {
  if (!state || !state.seen || !Array.isArray(state.seen[poolKey])) return false;
  return state.seen[poolKey].indexOf(String(sig)) !== -1;
}

export function markSeenSignature(state, poolKey, sig, maxKeep) {
  if (!state.seen || typeof state.seen !== 'object') {
    state.seen = {};
  }
  const limit = maxKeep || 600;
  const list = Array.isArray(state.seen[poolKey]) ? state.seen[poolKey].slice() : [];
  const s = String(sig);
  if (list.indexOf(s) === -1) {
    list.push(s);
  }
  state.seen[poolKey] = list.length > limit ? list.slice(list.length - limit) : list;
  saveState(state);
}
