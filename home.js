import { getStations } from "./api.js";

const stationList =
    document.getElementById("stationList");

async function loadStations() {

    const stations = await getStations();

    const visibleStations = stations.filter(
        station =>
            !station.blacklisted &&
            station.station.tag_name
    );

    const uniqueStations = [
        ...new Set(
            visibleStations.map(
                station => station.station.tag_name
            )
        )
    ];

    stationList.innerHTML = "";

    uniqueStations.sort().forEach(name => {

        stationList.innerHTML += `
            <a
                class="station-card"
                href="station.html?name=${encodeURIComponent(name)}"
            >
                ${name}
            </a>
        `;
    });
}

loadStations();