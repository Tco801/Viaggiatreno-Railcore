import {
    getStations,
    getTrains,
    getJourney
}
from "./api.js";

const params =
    new URLSearchParams(
        window.location.search
    );

const stationName =
    params.get("name");

const board =
    document.getElementById(
        "board"
    );

document.getElementById(
    "stationTitle"
).textContent = stationName;


function formatStatus(status) {

    switch(status) {

        case "EN_ROUTE":
            return "🚄 In corsa";

        case "WAITING_FOR_SIGNAL":
            return "🚦 Attesa";

        case "AT_STATION":
            return "🚉 In stazione";

        default:
            return status;
    }
}


function ticksToMcTime(ticks) {

    const totalMinutes =
        Math.floor(
            ticks / 20
        );

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;

    return `${String(hours)
        .padStart(2,"0")}:${String(minutes)
        .padStart(2,"0")}`;
}


async function loadBoard() {

    try {

        const stations =
            await getStations();

        const trains =
            await getTrains();

        const rows = [];

        const platforms =
            stations.filter(
                station =>
                    station.station.tag_name ===
                    stationName
            );

        for(const platform of platforms) {

            for(const trainId of platform.train_ids) {

                const train =
                    trains.find(
                        t =>
                            t.train_id ===
                            trainId
                    );

                if(!train)
                    continue;

                try {

                    const journey =
                        await getJourney(
                            trainId
                        );

                    const currentStop =
                        journey.stops.find(
                            stop =>
                                stop.station.tag_name ===
                                stationName
                        );

                    if(!currentStop)
                        continue;

                    rows.push({

   			 trainId,

  			  trainName:
   			     train.train_name,

  			  category:
  			      train.category.name,

 			   categoryColor:
  			      parseColor(
  			          train.category.color
   			     ),

 			   destination:
      			  train.destination.tag_name,

   			 platform:
   			     platform.station.info.platform,

  			  status:
  			      train.live_state,
		
  			  arrival:
       			 currentStop.scheduled.arrival

			});

                }

                catch(error) {

                    console.error(
                        error
                    );

                }

            }

        }

        rows.sort(
            (a,b) =>
                a.arrival -
                b.arrival
        );

        board.innerHTML = "";

        rows.forEach(
            row => {

                board.innerHTML += `

                <tr>

                    <td>

                        ${
                            ticksToMcTime(
                                row.arrival
                            )
                        }

                    </td>

                    <td>

                        <a
                            href="
                            train.html?id=${row.trainId}
                            "
                        >

                            ${row.trainName}

                        </a>

                    </td>

                    <td>

                        <span
                            class="category-pill"
                            style="
                                background:
                                ${row.categoryColor};
                            "
                        >

                            ${row.category}

                        </span>

                    </td>

                    <td>

                        ${row.destination}

                    </td>

                    <td>

                        ${row.platform}

                    </td>

                    <td>

                        ${
                            formatStatus(
                                row.status
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

        board.innerHTML = `

        <tr>

            <td
                colspan="6"
                style="
                    color:red;
                    font-weight:bold;
                    text-align:center;
                "
            >

                SERVER OFFLINE

            </td>

        </tr>

        `;
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

loadBoard();

setInterval(
    loadBoard,
    5000
);
