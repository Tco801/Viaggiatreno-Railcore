import { navigate, getStations, getCategoryInfo, getTime } from "./api.js";

const searchForm = document.getElementById("searchForm");
const fromInput = document.getElementById("fromStation");
const toInput = document.getElementById("toStation");
const swapBtn = document.getElementById("swapBtn");
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("results");
const stationsList = document.getElementById("stationsList");
const mcTimeSpan = document.getElementById("mcTime");
const serverStatus = document.getElementById("serverStatus");

function parseColor(color) {
    if (!color) return "#173252";
    if (typeof color === "number") {
        return "#" + color.toString(16).padStart(6, "0");
    }
    color = String(color).trim();
    if (color.startsWith("#")) {
        if (color.length === 9) {
            return "#" + color.substring(3);
        }
        if (color.length === 7 || color.length === 4) {
            return color;
        }
    }
    return color;
}

function minecraftTimeToClock(time) {
    if (time === undefined || time === null) return "--:--";

    // Se è già una stringa formattata "HH:MM"
    if (typeof time === "string" && time.includes(":")) {
        return time;
    }

    let numTime = Number(time);
    if (isNaN(numTime)) return "--:--";

    // Normalizza i tick negativi nel range di 24 ore (24000 tick per giorno in Minecraft)
    if (numTime < 0) {
        numTime = (numTime % 24000 + 24000) % 24000;
    }

    // Calcola i minuti totali trascorsi dalle 06:00
    let totalMinutes = Math.floor(numTime * 0.06);
    
    // Normalizza i minuti nel formato delle 24 ore (1440 minuti in un giorno)
    totalMinutes = (totalMinutes % 1440 + 1440) % 1440;

    let hours = (Math.floor(totalMinutes / 60) + 6) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getStationName(stationObj) {
    if (!stationObj) return null;
    if (typeof stationObj === "string") return stationObj;
    return stationObj.tag_name || stationObj.name || stationObj.station?.tag_name || stationObj.station?.name || null;
}

async function updateClock() {
    try {
        const timeData = await getTime();
        if (timeData && timeData.time !== undefined && mcTimeSpan) {
            mcTimeSpan.textContent = `🕒 Ora Minecraft: ${minecraftTimeToClock(timeData.time)}`;
        }
    } catch (err) {
        console.error("Errore recupero ora:", err);
    }
}

async function loadStations() {
    try {
        const stations = await getStations();
        if (serverStatus) {
            serverStatus.innerHTML = `<span class="status-online">✅ Server Online</span>`;
        }
        if (Array.isArray(stations)) {
            const visible = stations.filter(s => !s.blacklisted);
            const names = visible.map(s => getStationName(s)).filter(Boolean);
            const uniqueNames = [...new Set(names)].sort();

            stationsList.innerHTML = uniqueNames
                .map(name => `<option value="${name}"></option>`)
                .join("");
        }
    } catch (err) {
        console.warn("Impossibile caricare l'elenco stazioni per l'autocompletamento:", err);
        if (serverStatus) {
            serverStatus.innerHTML = `<span class="status-offline">🔴 Server Offline</span>`;
        }
    }
}

loadStations();
updateClock();
setInterval(updateClock, 2000);

swapBtn?.addEventListener("click", () => {
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
});

searchForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const from = fromInput.value.trim();
    const to = toInput.value.trim();
    if (!from || !to) return;

    searchBtn.disabled = true;
    resultsContainer.innerHTML = `
        <div class="card state-card">
            <div class="spinner"></div>
            <p>Ricerca percorsi in corso...</p>
        </div>
    `;

    try {
        const data = await navigate(from, to);
        await renderResults(data);
    } catch (error) {
        console.error("Errore durante la ricerca:", error);
        resultsContainer.innerHTML = `
            <div class="card state-card error">
                <h3>⚠️ Si è verificato un errore</h3>
                <p>Impossibile recuperare i percorsi per le stazioni indicate.</p>
            </div>
        `;
    } finally {
        searchBtn.disabled = false;
    }
});

async function renderResults(data) {
    resultsContainer.innerHTML = "";
    const journeys = data?.journeys || data;

    if (!Array.isArray(journeys) || journeys.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card state-card">
                <h3>Nessun percorso trovato</h3>
                <p>Prova a verificare i nomi delle stazioni di partenza e arrivo.</p>
            </div>
        `;
        return;
    }

    for (let index = 0; index < journeys.length; index++) {
        const journey = journeys[index];
        const journeyCard = document.createElement("article");
        journeyCard.className = "card journey-card";

        let legsHtml = "";
        const legs = journey.legs || [journey];

        for (const leg of legs) {
            const catColor = parseColor(leg.category?.color || leg.color);
            const trainName = leg.train_name || leg.name || leg.id || "";
            
            // Estrazione flessibile della categoria della tratta
            const rawCategory = leg.category || leg.train_category || leg.category_code;
            const categoryInfo = await getCategoryInfo(rawCategory);

            let logoHtml = "";
            if (categoryInfo && categoryInfo.logo) {
                logoHtml = `<img src="${categoryInfo.logo}" class="operator-logo" style="height: 24px; width: auto; object-fit: contain; vertical-align: middle;" alt="${categoryInfo.name || 'Logo'}">`;
            } else {
                logoHtml = `<span style="display: inline-block; width: 10px; height: 10px; background: white; border-radius: 50%;"></span>`;
            }

            let callsHtml = "";
            const calls = leg.calls || leg.stops;

            if (Array.isArray(calls)) {
                callsHtml = calls.map(call => {
                    const stName = getStationName(call) || getStationName(call.station) || "-";
                    const platform = call.info?.platform || call.platform || call.station?.info?.platform;

                    return `
                        <li class="timeline-item">
                            <span class="station-name">${stName}</span>
                            ${platform ? `<span class="platform-badge">Bin. ${platform}</span>` : ""}
                        </li>
                    `;
                }).join("");
            }

            const destinationText = leg.destination_text || getStationName(leg.destination) || "N/D";

            legsHtml += `
                <div class="leg-item" style="border-left-color: ${catColor};">
                    <div class="leg-header" style="display: flex; align-items: center; gap: 12px;">
                        <span class="train-badge" style="background-color: ${catColor}; color: #ffffff; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px;">
                            ${logoHtml}
                            <strong>${trainName}</strong>
                        </span>
                        <span class="destination">Direzione: <strong>${destinationText}</strong></span>
                    </div>

                    ${callsHtml ? `
                        <details class="timeline-details">
                            <summary>Mostra fermate (${calls.length})</summary>
                            <ul class="timeline">
                                ${callsHtml}
                            </ul>
                        </details>
                    ` : ""}
                </div>
            `;
        }

        journeyCard.innerHTML = `
            <div class="journey-header">
                <h3>Soluzione #${index + 1}</h3>
                <span class="transfers-count">${legs.length === 1 ? 'Diretto' : (legs.length - 1) + ' cambio/i'}</span>
            </div>
            <div class="journey-body">
                ${legsHtml}
            </div>
        `;

        resultsContainer.appendChild(journeyCard);
    }
}
