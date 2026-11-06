import {
    getTrain,
    getJourney,
    getCategoryInfo,
    getTime
} from "./api.js";

const params = new URLSearchParams(window.location.search);
const trainId = params.get("id");

const trainName = document.getElementById("trainName");
const trainInfo = document.getElementById("trainInfo");
const stopsTable = document.getElementById("stops");
const mcTimeSpan = document.getElementById("mcTime");
const serverStatus = document.getElementById("serverStatus");

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
function translateLiveState(state) {
    if (!state) return "-";
    const stateClean = String(state).toLowerCase().trim();

    switch (stateClean) {
        case "en_route":
        case "running":
        case "moving":
        case "in_transit":
            return `<span class="status-running">In corsa</span>`;
        case "station":
        case "stopped":
        case "at_station":
        case "in_station":
            return `<span class="status-station">In stazione</span>`;
        case "waiting":
        case "idle":
        case "delayed":
            return `<span class="status-waiting">In attesa</span>`;
        case "ended":
        case "terminated":
        case "completed":
            return `<span>Terminato</span>`;
        default:
            return stateClean.replace(/_/g, " ");
    }
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

function getStationTagName(stationObj) {
    if (!stationObj) return null;
    if (typeof stationObj === "string") return stationObj;
    return stationObj.tag_name || stationObj.name || stationObj.station?.tag_name || stationObj.station?.name || null;
}

async function loadTrain() {
    if (!trainId) {
        trainName.innerHTML = "⚠️ Nessun treno specificato nell'URL";
        return;
    }

    try {
        const [train, journey] = await Promise.all([
            getTrain(trainId),
            getJourney(trainId)
        ]);

        if (serverStatus) {
            serverStatus.innerHTML = `<span class="status-online">✅ SERVER ONLINE</span>`;
        }

        const tName = train.train_name || train.name || train.id || "Treno";
        const catKey = train.category?.code || train.category?.name || train.category;
        const categoryInfo = await getCategoryInfo(catKey);

        let categoryLogoHtml = "";
        if (categoryInfo && categoryInfo.logo) {
            categoryLogoHtml = `
                <div class="operator-info">
                    <img src="./${categoryInfo.logo}" class="operator-logo-large" alt="${categoryInfo.name || 'Categoria'}">
                </div>
            `;
        }

        trainName.innerHTML = `
            ${categoryLogoHtml}
            <span class="train-header">${tName}</span>
        `;

        const destName = getStationTagName(train.destination) || "-";
        const currStationName = getStationTagName(train.current_station) || "-";
        const nextStationName = getStationTagName(train.next_station) || "-";

        const distance = train.position?.distance_to_next_stop !== undefined 
            ? `${Math.round(train.position.distance_to_next_stop)} m` 
            : "-";

        trainInfo.innerHTML = `
            <div class="info-box">
                <h4>Destinazione</h4>
                <br>
                <strong>${destName}</strong>
            </div>

            <div class="info-box">
                <h4>Stazione attuale</h4>
                <br>
                <strong>${currStationName}</strong>
            </div>

            <div class="info-box">
                <h4>Prossima fermata</h4>
                <br>
                <strong>${nextStationName}</strong>
            </div>

            <div class="info-box">
                <h4>Distanza</h4>
                <br>
                <strong>${distance}</strong>
            </div>

            <div class="info-box">
                <h4>Stato</h4>
                <br>
                ${translateLiveState(train.live_state)}
            </div>
        `;

        stopsTable.innerHTML = "";

        const stops = Array.isArray(journey) ? journey : (journey.stops || []);
        const currentStopIndex = journey.current_stop_index ?? -1;

        stops.forEach((stop, index) => {
            let rowClass = "future-stop";

            if (index < currentStopIndex) {
                rowClass = "completed-stop";
            } else if (index === currentStopIndex) {
                rowClass = "current-train";
            }

            const stName = getStationTagName(stop) || getStationTagName(stop.station) || "-";
            const platform = stop.info?.platform || stop.platform || stop.station?.info?.platform || "-";

            const rawArrival = stop.scheduled?.arrival ?? stop.arrivalTime ?? stop.arrival;
            const rawDeparture = stop.scheduled?.departure ?? stop.departureTime ?? stop.departure;

            const arrival = minecraftTimeToClock(rawArrival);
            const departure = minecraftTimeToClock(rawDeparture);

            stopsTable.innerHTML += `
                <tr class="${rowClass}">
                    <td><strong>${stName}</strong></td>
                    <td>${platform}</td>
                    <td>${arrival}</td>
                    <td>${departure}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Errore durante il caricamento del treno:", error);
        trainName.innerHTML = "🔴 Impossibile caricare il treno";
        if (serverStatus) {
            serverStatus.innerHTML = `<span class="status-offline">🔴 SERVER OFFLINE</span>`;
        }
    }
}

updateClock();
loadTrain();

setInterval(updateClock, 2000);
setInterval(loadTrain, 5000);
