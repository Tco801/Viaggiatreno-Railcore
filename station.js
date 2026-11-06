import {
    getTrains,
    getJourney,
    getCategoryInfo,
    getTime
} from "./api.js";

const params = new URLSearchParams(window.location.search);
const stationName = params.get("name");

const board = document.getElementById("board");
const mcTimeSpan = document.getElementById("mcTime");

document.getElementById("stationTitle").textContent = stationName 
    ? `Stazione di ${stationName}` 
    : "Stazione non specificata";

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

function extractPlatform(currentStop, train) {
    if (currentStop) {
        if (currentStop.info?.platform) return currentStop.info.platform;
        if (currentStop.platform) return currentStop.platform;
        if (currentStop.station?.info?.platform) return currentStop.station.info.platform;
        if (currentStop.station?.platform) return currentStop.station.platform;
    }

    if (train?.next_station) {
        if (train.next_station.info?.platform) return train.next_station.info.platform;
        if (train.next_station.platform) return train.next_station.platform;
    }

    return "-";
}

async function loadBoard() {
    if (!stationName) {
        board.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    Nessuna stazione selezionata nell'URL (es. <code>?name=NomeStazione</code>).
                </td>
            </tr>`;
        return;
    }

    try {
        const trains = await getTrains();

        if (!Array.isArray(trains) || trains.length === 0) {
            board.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        Nessun treno attivo al momento.
                    </td>
                </tr>`;
            return;
        }

        const journeyPromises = trains.map(train => {
            const journeyId = train.id ?? train.train_id ?? train.uuid ?? train.train_name;

            if (journeyId === undefined || journeyId === null) {
                return Promise.resolve(null);
            }

            return getJourney(journeyId)
                .then(journey => ({ train, journey }))
                .catch(err => {
                    console.warn(`Impossibile caricare il percorso per l'ID ${journeyId}:`, err);
                    return null;
                });
        });

        const results = await Promise.all(journeyPromises);
        const departures = [];

        const targetStationClean = stationName.trim().toLowerCase();

        for (const res of results) {
            if (!res || !res.journey) continue;

            const { train, journey } = res;
            const stops = Array.isArray(journey) ? journey : (journey.stops || []);

            if (!Array.isArray(stops) || stops.length === 0) continue;

            const stopIndex = stops.findIndex(s => {
                const name = getStationTagName(s) || getStationTagName(s.station);
                return typeof name === "string" && name.trim().toLowerCase() === targetStationClean;
            });

            if (stopIndex === -1 || stopIndex === stops.length - 1) {
                continue;
            }

            const currentStop = stops[stopIndex];
            const lastStop = stops[stops.length - 1];

            // LOG DIAGNOSTICO: Ispezione della struttura degli orari per la fermata corrente
            console.log("Fermata trovata per train", train.train_name, "-> Struttura fermata:", currentStop);

            const destName = getStationTagName(lastStop) || getStationTagName(lastStop.station) || "Destinazione Sconosciuta";

            const nextStops = stops
                .slice(stopIndex + 1)
                .map(s => getStationTagName(s) || getStationTagName(s.station))
                .filter(Boolean);

            const platform = extractPlatform(currentStop, train);

            // Ricerca flessibile su tutti i possibili percorsi dell'oggetto fermata
            const rawTime = currentStop.scheduled?.departure 
                ?? currentStop.scheduled?.arrival 
                ?? currentStop.departure_time 
                ?? currentStop.arrival_time
                ?? currentStop.departureTime 
                ?? currentStop.arrivalTime 
                ?? currentStop.time 
                ?? currentStop.departure
                ?? currentStop.arrival;

            departures.push({
                train,
                currentStop,
                destination: destName,
                nextStops,
                platform,
                arrivalTime: rawTime
            });
        }

        departures.sort((a, b) => {
            const timeA = typeof a.arrivalTime === 'number' ? a.arrivalTime : 0;
            const timeB = typeof b.arrivalTime === 'number' ? b.arrivalTime : 0;
            return timeA - timeB;
        });

        if (departures.length === 0) {
            board.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">
                        Nessuna partenza prevista per la stazione <strong>${stationName}</strong>.
                    </td>
                </tr>`;
            return;
        }

        const rowsHtml = await Promise.all(departures.map(async (dep) => {
            const trainName = dep.train.train_name || dep.train.name || dep.train.id || "Treno";
            const trainIdParam = dep.train.id ?? dep.train.train_id ?? dep.train.uuid ?? trainName;
            
            const categoryInfo = await getCategoryInfo(dep.train.category);

            let categoryHtml = "";
            if (categoryInfo && categoryInfo.logo) {
                categoryHtml = `<img src="${categoryInfo.logo}" class="operator-logo" alt="${categoryInfo.name || 'Categoria'}">`;
            } else {
                const rawCat = dep.train.category;
                const catText = typeof rawCat === 'object' ? (rawCat.name || rawCat.code || 'Treno') : (rawCat || 'Treno');
                categoryHtml = `<span class="category-pill" style="background-color: #173252;">${catText}</span>`;
            }

            return `
                <tr>
                    <td>${categoryHtml}</td>
                    <td>
                        <a href="train.html?id=${encodeURIComponent(trainIdParam)}" style="color: #173252; font-weight: bold; text-decoration: underline;">
                            ${trainName}
                        </a>
                    </td>
                    <td><strong>${dep.destination}</strong></td>
                    <td>${minecraftTimeToClock(dep.arrivalTime)}</td>
                    <td class="stops-preview">${dep.nextStops.join(", ")}</td>
                    <td><strong>${dep.platform}</strong></td>
                </tr>
            `;
        }));

        board.innerHTML = rowsHtml.join("");

    } catch (err) {
        console.error("Errore tabellone:", err);
        board.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #dc2626; padding: 20px;">
                    Errore nel recupero dei dati dal server.
                </td>
            </tr>`;
    }
}

updateClock();
loadBoard();

setInterval(updateClock, 2000);
setInterval(loadBoard, 10000);
