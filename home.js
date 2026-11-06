import {
    getStations,
    getTrains,
    getCategoryInfo,
    getTime
} from "./api.js";

const stationList = document.getElementById("stationList");
const serverStatus = document.getElementById("serverStatus");
const dashboardStats = document.getElementById("dashboardStats");
const nextDepartures = document.getElementById("nextDepartures");
const mcTime = document.getElementById("mcTime");

function minecraftTimeToClock(time) {
    if (time === undefined || time === null) return "--:--";
    const totalMinutes = Math.floor(time * 0.06);
    let hours = Math.floor(totalMinutes / 60) + 6;
    const minutes = totalMinutes % 60;
    hours = hours % 24;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

async function loadHome() {
    try {
        const stations = await getStations();
        const trains = await getTrains();
        const timeData = await getTime();

        if (timeData && timeData.time !== undefined && mcTime) {
            mcTime.textContent = `🕒 Ora Minecraft: ${minecraftTimeToClock(timeData.time)}`;
        }

        serverStatus.innerHTML = `<span class="status-online">✅ SERVER ONLINE</span>`;

        const visibleStations = stations.filter(
            station => !station.blacklisted && station.station?.tag_name
        );

        const uniqueStations = [...new Set(
            visibleStations.map(station => station.station.tag_name)
        )];

        dashboardStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${trains.length}</div>
                Treni attivi
            </div>
            <div class="stat-card">
                <div class="stat-number">${uniqueStations.length}</div>
                Stazioni
            </div>
            <div class="stat-card">
                <div class="stat-number">ONLINE</div>
                Stato rete
            </div>
        `;

        stationList.innerHTML = "";
        uniqueStations.sort().forEach(station => {
            stationList.innerHTML += `
                <a class="station-card" href="station.html?name=${encodeURIComponent(station)}">
                    🚉 ${station}
                </a>
            `;
        });

        nextDepartures.innerHTML = "";
        for (const train of trains.slice(0, 5)) {
            const categoryInfo = await getCategoryInfo(train.category);
            const platform = train.next_station?.info?.platform || "-";
            const trainIdParam = train.id ?? train.train_id ?? train.uuid ?? train.train_name;

            let categoryLogoHtml = "";
            if (categoryInfo && categoryInfo.logo) {
                categoryLogoHtml = `
                    <div class="operator-info">
                        <img src="./${categoryInfo.logo}" class="operator-logo" alt="${categoryInfo.name || 'Categoria'}">
                    </div>
                `;
            }

            nextDepartures.innerHTML += `
                <a href="train.html?id=${encodeURIComponent(trainIdParam)}" style="text-decoration: none; color: inherit;">
                    <div class="departure-card">
                        ${categoryLogoHtml}
                        <h3>🚆 ${train.train_name}</h3>
                        <div class="departure-detail">
                            <strong>Destinazione</strong>
                            <p>${train.destination?.tag_name || "-"}</p>
                        </div>
                        <div class="departure-detail">
                            <strong>Prossima fermata</strong>
                            <p>${train.next_station?.tag_name || "-"}</p>
                        </div>
                        <div class="departure-detail">
                            <strong>Binario</strong>
                            <p>${platform}</p>
                        </div>
                    </div>
                </a>
            `;
        }

    } catch (error) {
        console.error(error);
        serverStatus.innerHTML = `<span class="status-offline">🔴 SERVER OFFLINE</span>`;
    }
}

loadHome();
setInterval(loadHome, 10000);
