import {
    getJourney
}
from "./api.js";

const params =
    new URLSearchParams(window.location.search);

const trainId =
    params.get("id");

async function loadTrain() {

    const journey =
        await getJourney(trainId);

    const stopList =
        document.getElementById("stops");

    stopList.innerHTML = "";

    if (!journey.stops) return;

    journey.stops.forEach(stop => {

        stopList.innerHTML += `
            <li>
                ${stop.station.tag_name}
            </li>
        `;
    });
}

loadTrain();