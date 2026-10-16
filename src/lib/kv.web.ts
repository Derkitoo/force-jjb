// Navigateur : localStorage natif (expo-sqlite web exige des en-têtes COOP/COEP que GitHub Pages n'envoie pas)
export const kv = {
  getItem: (k: string) => localStorage.getItem(k),
  setItem: (k: string, v: string) => localStorage.setItem(k, v),
  removeItem: (k: string) => localStorage.removeItem(k),
};
