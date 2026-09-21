const STORAGE_KEY = "spectres.thread_id";

function newThreadId(): string {
  return crypto.randomUUID();
}

export function loadThreadId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }
  const id = newThreadId();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function resetThreadId(): string {
  const id = newThreadId();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
