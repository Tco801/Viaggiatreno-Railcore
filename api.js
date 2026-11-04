const API_BASE = "http://89.106.78.103:25580/crn/api/v1";

export async function getStations() {

    const response = await fetch(`${API_BASE}/stations`);

    return await response.json();
}

export async function getTrains() {

    const response = await fetch(`${API_BASE}/trains`);

    return await response.json();
}

export async function getTrain(id) {

    const response = await fetch(
        `${API_BASE}/train/${id}`
    );

    return await response.json();
}

export async function getJourney(id) {

    const response = await fetch(
        `${API_BASE}/train/${id}/journey`
    );

    return await response.json();
}

export async function navigate(from, to) {

    const response = await fetch(
        `${API_BASE}/navigate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    return await response.json();
}
