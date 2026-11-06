const API_BASE = "http://localhost:25580/crn/api/v1";

/*
 * FUNZIONE GENERICA API
 */
async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`Errore API [${response.status}]: ${response.statusText}`);
    }

    return await response.json();
}

/*
 * STAZIONI
 */
export async function getStations() {
    return await apiFetch("/stations");
}

/*
 * TRENI
 */
export async function getTrains() {
    return await apiFetch("/trains");
}

/*
 * CATEGORIE
 */
export async function getCategories() {
    return await apiFetch("/categories");
}

/*
 * SINGOLO TRENO
 */
export async function getTrain(id) {
    return await apiFetch(`/train/${encodeURIComponent(id)}`);
}

/*
 * PERCORSO TRENO
 */
export async function getJourney(id) {
    return await apiFetch(`/train/${encodeURIComponent(id)}/journey`);
}

/*
 * NAVIGAZIONE
 */
export async function navigate(from, to) {
    const query = new URLSearchParams({ from, to }).toString();
    return await apiFetch(`/navigate?${query}`);
}

/*
 * LINEE
 */
export async function getLines() {
    return await apiFetch("/lines");
}

/*
 * ORA DEL MONDO
 */
export async function getTime() {
    return await apiFetch("/time");
}

/*
 * CATEGORIE E LOGHI
 */
export async function getCategoryLogos() {
    const response = await fetch("./categories.json");
    if (!response.ok) {
        throw new Error("Impossibile caricare categories.json");
    }
    return await response.json();
}

/*
 * OTTIENI INFO LOGO CATEGORIA DA NOME O CODICE
 */
export async function getCategoryInfo(categoryInput) {
    if (!categoryInput) return null;
    try {
        const categories = await getCategoryLogos();

        let key = categoryInput;
        if (typeof categoryInput === "object") {
            key = categoryInput.code || categoryInput.name || categoryInput.id || "";
        }

        const cleanKey = String(key).trim().toUpperCase();

        if (categories[cleanKey]) {
            return categories[cleanKey];
        }

        const foundByName = Object.values(categories).find(
            cat => cat.name && cat.name.toUpperCase() === cleanKey
        );

        return foundByName || null;
    } catch (e) {
        console.warn("Impossibile recuperare il logo della categoria:", e);
        return null;
    }
}
