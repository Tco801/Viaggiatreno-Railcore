import {
    getStations,
    getTrains
} from "./api.js";

const stationList = document.getElementById("stationList");
const serverStatus = document.getElementById("serverStatus");
const dashboardStats = document.getElementById("dashboardStats");
const nextDepartures = document.getElementById("nextDepartures");

function parseColor(color) {
    if (!color) return "#173252";
    if (color.startsWith("#FF")) {
        return "#" + color.substring(3);
    }
    return color;
}

async function loadHome() {
    try {
        const stations = await getStations();
        const trains = await getTrains();

        serverStatus.innerHTML = `
            <span class="status-online">
                ✅ SERVER ONLINE
            </span>`;

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
        uniqueStations
            .sort()
            .forEach(name => {
                stationList.innerHTML += `
                    <a class="station-card" href="station.html?name=${encodeURIComponent(name)}">
                        🚉 ${name}
                    </a>
                `;
            });

        nextDepartures.innerHTML = "";
        const upcomingTrains = trains.slice(0, 3);

        upcomingTrains.forEach(train => {
            const categoryColor = parseColor(train.category?.color);
            const platform = train.next_station?.info?.platform ||
                             train.destination?.info?.platform ||
                             "-";

            nextDepartures.innerHTML += `
                <div class="departure-card">
                    <h3>🚆 ${train.train_name || "-"}</h3>
                    <span class="category-pill" style="background: ${categoryColor};">
                        ${train.category?.name || "-"}
                    </span>
                    <br><br>
                    <strong>Destinazione</strong>
                    <br>
                    ${train.destination?.tag_name || "-"}
                    <br><br>
                    <strong>Prossima fermata</strong>
                    <br>
                    ${train.next_station?.tag_name || "-"}
                    <br><br>
                    <strong>Binario</strong>
                    <br>
                    ${platform}
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        serverStatus.innerHTML = `
            <span class="status-offline">
                🔴 SERVER OFFLINE
            </span>`;
    }
}

loadHome();
setInterval(loadHome, 10000);
