import {
    getStations,
    getTrains
}
from "./api.js";

const params =
    new URLSearchParams(window.location.search);

const stationName =
    params.get("name");

document.getElementById(
    "stationTitle"
).textContent = stationName;

async function loadBoard() {

    const stations =
        await getStations();

    const trains =
        await getTrains();

    const relatedPlatforms =
        stations.filter(
            station =>
                station.station.tag_name === stationName
        );

    const board =
        document.getElementById("board");

    board.innerHTML = "";

    relatedPlatforms.forEach(platform => {

        platform.train_ids.forEach(trainId => {

            const train =
                trains.find(
                    t =>
                        t.train_id === trainId
                );

            if (!train) return;

            const category =
                platform.categories[0]?.name || "-";

            const track =
                platform.station.info.platform || "-";

            board.innerHTML += `
                <tr>

                    <td>
                        <a href="train.html?id=${trainId}">
                            ${train.train_name}
                        </a>
                    </td>

                    <td>
                        ${category}
                    </td>

                    <td>
                        ${track}
                    </td>

                </tr>
            `;
        });

    });
}

loadBoard();

setInterval(loadBoard, 5000);