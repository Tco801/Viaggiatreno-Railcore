import {
    navigate
}
from "./api.js";

const fromInput =
    document.getElementById(
        "fromStation"
    );

const toInput =
    document.getElementById(
        "toStation"
    );

const button =
    document.getElementById(
        "searchBtn"
    );

const results =
    document.getElementById(
        "results"
    );

button.addEventListener(
    "click",
    searchRoute
);

async function searchRoute() {

    const from =
        fromInput.value.trim();

    const to =
        toInput.value.trim();

    if(!from || !to) {

        alert(
            "Inserisci entrambe le stazioni."
        );

        return;
    }

    results.innerHTML = `
        <div class="card">
            Ricerca in corso...
        </div>
    `;

    try {

        const data =
            await navigate(
                from,
                to
            );

        renderResults(data);

    }

    catch(error) {

        console.error(error);

        results.innerHTML = `

            <div class="card">

                <h3>
                    🔴 Server Offline
                </h3>

            </div>

        `;
    }

}

function renderResults(data) {

    results.innerHTML = "";

    if(
        !data.journeys ||
        data.journeys.length === 0
    ) {

        results.innerHTML = `

            <div class="card">

                Nessun percorso trovato.

            </div>

        `;

        return;
    }

    data.journeys.forEach(
        (journey,index) => {

            let html = `

            <div class="card">

                <h3>
                    Percorso ${
                        index + 1
                    }
                </h3>

            `;

            journey.legs.forEach(
                leg => {

                    html += `

                    <div
                        style="
                        margin-top:15px;
                        padding:15px;
                        border-left:
                        6px solid
                        ${
                            leg.category.color
                        };
                        ">

                        <strong>

                        ${
                            leg.train_name
                        }

                        </strong>

                        <br>

                        Categoria:

                        ${
                            leg.category.name
                        }

                        <br>

                        Destinazione:

                        ${
                            leg.destination_text
                        }

                        <br><br>

                        Fermate:

                        <ul>

                    `;

                    leg.calls.forEach(
                        call => {

                            html += `

                            <li>

                            ${
                                call.station.tag_name
                            }

                           

                            (Bin.
                            ${
                                call.station.info.platform
                            })

                            </li>

                            `;
                        }
                    );

                    html += `
                        </ul>
                    </div>
                    `;
                }
            );

            html += "</div>";

            results.innerHTML += html;
        }
    );
}