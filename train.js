import {
    getTrain,
    getJourney
}
from "./api.js";

const params =
    new URLSearchParams(
        window.location.search
    );

const trainId =
    params.get("id");

const trainName =
    document.getElementById(
        "trainName"
    );

const trainInfo =
    document.getElementById(
        "trainInfo"
    );

const stopsTable =
    document.getElementById(
        "stops"
    );

function ticksToMcTime(ticks) {

    const minutes =
        Math.floor(
            ticks / 20
        );

    const hours =
        Math.floor(
            minutes / 60
        );

    const mins =
        minutes % 60;

    return `${String(hours)
        .padStart(2,"0")}:${
        String(mins)
        .padStart(2,"0")
    }`;
}

async function loadTrain() {

    try {

        const train =
            await getTrain(
                trainId
            );

        const journey =
            await getJourney(
                trainId
            );

        trainName.innerHTML = `

            <span class="train-header">

            ${train.train_name}

            </span>

        `;

        trainInfo.innerHTML = `

            <div class="info-box">

                <h4>Categoria</h4>

                <br>

                <div
                    class="category-box"
                    style="
                        background:
                        ${parseColor(
     		    	   train.category.color
 		       )};

                    "
                >

                    ${train.category.name}

                </div>

            </div>

            <div class="info-box">

                <h4>Destinazione</h4>

                <br>

                ${train.destination.tag_name}

            </div>

            <div class="info-box">

                <h4>Stazione attuale</h4>

                <br>

                ${train.current_station.tag_name}

            </div>

            <div class="info-box">

                <h4>Prossima fermata</h4>

                <br>

                ${train.next_station.tag_name}

            </div>

            <div class="info-box">

                <h4>Distanza</h4>

                <br>

                ${Math.round(
                    train.position
                    .distance_to_next_stop
                )} m

            </div>

            <div class="info-box">

                <h4>Stato</h4>

                <br>

                ${train.live_state}

            </div>

        `;

        stopsTable.innerHTML = "";

        journey.stops.forEach(
            (stop,index) => {

                let rowClass =
                    "future-stop";

                if(
                    index <
                    journey.current_stop_index
                ) {

                    rowClass =
                    "completed-stop";
                }

                if(
                    index ===
                    journey.current_stop_index
                ) {

                    rowClass =
                    "current-train";
                }

                stopsTable.innerHTML += `

                <tr
                    class="${rowClass}"
                >

                    <td>
                        ${
                            stop.station
                            .tag_name
                        }
                    </td>

                    <td>
                        ${
                            stop.station
                            .info
                            ?.platform || "-"
                        }
                    </td>

                    <td>

                        ${
                            ticksToMcTime(
                                stop.scheduled
                                .arrival
                            )
                        }

                    </td>

                    <td>

                        ${
                            ticksToMcTime(
                                stop.scheduled
                                .departure
                            )
                        }

                    </td>

                </tr>

                `;
            }
        );

    }

    catch(error) {

        console.error(error);

        trainName.innerHTML =
            "🔴 Server Offline";
    }
}

function parseColor(color) {

    if (!color) {
        return "#173252";
    }

    if (color.length === 9) {

        return "#" + color.substring(3);

    }

    return color;
}

loadTrain();

setInterval(
    loadTrain,
    5000
);
