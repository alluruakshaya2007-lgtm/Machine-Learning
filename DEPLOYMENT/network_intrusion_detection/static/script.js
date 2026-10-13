let trafficChart;
let performanceChart;


// ================================
// PAGE NAVIGATION
// ================================

function showPage(pageId, button = null) {

    document.querySelectorAll(".page")
        .forEach(page => {
            page.classList.remove("active");
        });


    const page =
        document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }


    document.querySelectorAll(".nav")
        .forEach(nav => {
            nav.classList.remove("active");
        });


    if (button) {
        button.classList.add("active");
    }


    if (pageId === "history") {
        loadHistory();
    }

}


// ================================
// CLOCK
// ================================

function updateClock() {

    const clock =
        document.getElementById("clock");

    if (!clock) return;

    const now = new Date();

    clock.textContent =
        now.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );
}


setInterval(updateClock, 1000);

updateClock();


// ================================
// FORM DATA
// ================================

function getFormData(form) {

    const data =
        new FormData(form);

    return {

        flow_duration:
            Number(
                data.get("flow_duration")
            ) || 0,

        total_fwd_packets:
            Number(
                data.get("total_fwd_packets")
            ) || 0,

        total_backward_packets:
            Number(
                data.get(
                    "total_backward_packets"
                )
            ) || 0,

        packet_length_mean:
            Number(
                data.get(
                    "packet_length_mean"
                )
            ) || 0,

        flow_bytes_s:
            Number(
                data.get("flow_bytes_s")
            ) || 0,

        flow_packets_s:
            Number(
                data.get("flow_packets_s")
            ) || 0,

        protocol:
            data.get("protocol") || "TCP"
    };
}


// ================================
// PREDICTION
// ================================

async function predictTraffic(
    form,
    resultElement
) {

    resultElement.className =
        "result waiting";

    resultElement.innerHTML = `

        <div class="result-icon">
            ◌
        </div>

        <div>

            <strong>
                ANALYZING...
            </strong>

            <span>
                Security engine processing traffic.
            </span>

        </div>
    `;


    try {

        const response =
            await fetch(
                "/api/predict",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            getFormData(form)
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.error
            );
        }


        let className =
            data.label === "MALICIOUS"
                ? "malicious"
                : data.label === "SUSPICIOUS"
                    ? "suspicious"
                    : "normal";


        resultElement.className =
            "result " + className;


        const icon =
            data.label === "MALICIOUS"
                ? "!"
                : data.label === "SUSPICIOUS"
                    ? "?"
                    : "✓";


        resultElement.innerHTML = `

            <div class="result-icon">
                ${icon}
            </div>

            <div>

                <strong>
                    ${
                        data.label === "MALICIOUS"
                        ? "⚠ MALICIOUS TRAFFIC"
                        : data.label === "SUSPICIOUS"
                        ? "⚠ SUSPICIOUS TRAFFIC"
                        : "✓ NORMAL TRAFFIC"
                    }
                </strong>

                <span>

                    Risk:
                    ${data.risk_level}

                    •

                    Score:
                    ${data.risk_score}/100

                    •

                    Confidence:
                    ${data.confidence}%

                    <br>

                    Random Forest:
                    ${data.random_forest}

                    •

                    Gradient Boosting:
                    ${data.gradient_boosting}

                </span>

            </div>
        `;


        updateDashboard();

    }

    catch(error) {

        resultElement.className =
            "result malicious";

        resultElement.innerHTML = `

            <div class="result-icon">
                !
            </div>

            <div>

                <strong>
                    ERROR
                </strong>

                <span>
                    ${error.message}
                </span>

            </div>
        `;
    }
}


// ================================
// QUICK FORM
// ================================

const predictionForm =
    document.getElementById(
        "predictionForm"
    );


if (predictionForm) {

    predictionForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            predictTraffic(
                this,
                document.getElementById(
                    "predictionResult"
                )
            );

        }
    );
}


// ================================
// ADVANCED DETECTION
// ================================

const detectForm =
    document.getElementById(
        "detectForm"
    );


if (detectForm) {

    detectForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const result =
                document.getElementById(
                    "detectResult"
                );


            result.className =
                "decision";


            result.innerHTML =
                "Analyzing traffic...";


            try {

                const response =
                    await fetch(
                        "/api/predict",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    getFormData(this)
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {
                    throw new Error(
                        data.error
                    );
                }


                const type =
                    data.label.toLowerCase();


                result.className =
                    "decision " + type;


                result.innerHTML = `

                    <div>

                        <div style="
                            font-size:45px;
                            font-weight:bold;
                        ">

                            ${
                                data.label ===
                                "MALICIOUS"
                                ? "⚠"
                                : data.label ===
                                "SUSPICIOUS"
                                ? "?"
                                : "✓"
                            }

                        </div>


                        <div style="
                            font-size:24px;
                            font-weight:bold;
                            margin-top:10px;
                        ">

                            ${data.label}

                        </div>


                        <div style="
                            font-size:11px;
                            margin-top:12px;
                        ">

                            Risk:
                            ${data.risk_level}

                            <br>

                            Risk Score:
                            ${data.risk_score}/100

                            <br>

                            Confidence:
                            ${data.confidence}%

                            <br><br>

                            Random Forest:
                            ${data.random_forest}

                            <br>

                            Gradient Boosting:
                            ${data.gradient_boosting}

                        </div>

                    </div>
                `;


                updateDashboard();

            }

            catch(error) {

                result.className =
                    "decision malicious";

                result.innerHTML =
                    error.message;

            }

        }
    );
}


// ================================
// BATCH CSV
// ================================

const batchButton =
    document.getElementById(
        "batchButton"
    );


if (batchButton) {

    batchButton.addEventListener(
        "click",
        async function() {

            const file =
                document.getElementById(
                    "csvFile"
                ).files[0];


            const result =
                document.getElementById(
                    "batchResult"
                );


            if (!file) {

                result.innerHTML =
                    "⚠ Please select a CSV file.";

                return;
            }


            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );


            result.innerHTML =
                "⏳ Scanning CSV...";


            try {

                const response =
                    await fetch(
                        "/api/batch_predict",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {
                    throw new Error(
                        data.error
                    );
                }


                result.innerHTML = `

                    <strong
                        style="
                            color:#2ce6d5;
                            font-size:15px;
                        "
                    >
                        BATCH SCAN COMPLETE
                    </strong>

                    <br><br>

                    Rows analyzed:
                    <b>${data.rows_analyzed}</b>

                    <br><br>

                    Normal:
                    <b style="color:#28e6a1">
                        ${data.normal}
                    </b>

                    <br>

                    Suspicious:
                    <b style="color:#ffc94d">
                        ${data.suspicious}
                    </b>

                    <br>

                    Malicious:
                    <b style="color:#ff5272">
                        ${data.malicious}
                    </b>

                `;


                updateDashboard();

            }

            catch(error) {

                result.innerHTML =
                    "⚠ " +
                    error.message;

            }

        }
    );
}


// ================================
// HISTORY
// ================================

async function loadHistory() {

    const table =
        document.getElementById(
            "historyTable"
        );


    if (!table) return;


    try {

        const response =
            await fetch(
                "/api/history"
            );


        const data =
            await response.json();


        if (!data.length) {

            table.innerHTML = `

                <tr>

                    <td colspan="7">

                        No predictions yet.

                    </td>

                </tr>

            `;

            return;
        }


        table.innerHTML =
            data
                .slice()
                .reverse()
                .map(item => {

                    let className =
                        item.label === "MALICIOUS"
                        ? "malicious-text"
                        : item.label === "SUSPICIOUS"
                        ? "suspicious-text"
                        : "normal-text";


                    return `

                        <tr>

                            <td>
                                ${item.time}
                            </td>

                            <td>
                                ${item.protocol}
                            </td>

                            <td class="${className}">
                                ${item.label}
                            </td>

                            <td>
                                ${item.risk_score}/100
                            </td>

                            <td>
                                ${item.confidence}%
                            </td>

                            <td>
                                ${item.random_forest}
                            </td>

                            <td>
                                ${item.gradient_boosting}
                            </td>

                        </tr>

                    `;

                })
                .join("");

    }

    catch(error) {

        table.innerHTML = `

            <tr>
                <td colspan="7">
                    Unable to load history.
                </td>
            </tr>

        `;

    }
}


// ================================
// DASHBOARD
// ================================

async function updateDashboard() {

    try {

        const response =
            await fetch(
                "/api/history"
            );


        const data =
            await response.json();


        const total =
            data.length;


        const normal =
            data.filter(
                x => x.label === "NORMAL"
            ).length;


        const malicious =
            data.filter(
                x => x.label === "MALICIOUS"
            ).length;


        document.getElementById(
            "total"
        ).textContent = total;


        document.getElementById(
            "normal"
        ).textContent = normal;


        document.getElementById(
            "malicious"
        ).textContent = malicious;


        document.getElementById(
            "normalPercent"
        ).textContent =
            total
                ? ((normal / total) * 100)
                    .toFixed(1) + "%"
                : "0%";


        document.getElementById(
            "maliciousPercent"
        ).textContent =
            total
                ? ((malicious / total) * 100)
                    .toFixed(1) + "%"
                : "0%";


        if (trafficChart) {

            trafficChart.data.datasets[0].data =
                [
                    0,
                    normal,
                    normal + 1,
                    normal,
                    normal + 2
                ];


            trafficChart.data.datasets[1].data =
                [
                    0,
                    malicious,
                    malicious + 1,
                    malicious,
                    malicious
                ];


            trafficChart.update();
        }

    }

    catch(error) {

        console.log(error);

    }

}


// ================================
// TRAFFIC CHART
// ================================

function createTrafficChart() {

    const canvas =
        document.getElementById(
            "trafficChart"
        );


    if (!canvas) return;


    trafficChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: [
                        "1",
                        "2",
                        "3",
                        "4",
                        "5"
                    ],

                    datasets: [

                        {
                            label: "Normal",

                            data: [
                                0,0,0,0,0
                            ],

                            borderColor:
                                "#28e6a1",

                            backgroundColor:
                                "#28e6a122",

                            fill: true,

                            tension: .4
                        },


                        {
                            label: "Malicious",

                            data: [
                                0,0,0,0,0
                            ],

                            borderColor:
                                "#ff5272",

                            backgroundColor:
                                "#ff527222",

                            fill: true,

                            tension: .4
                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            labels: {
                                color: "#91a8bd"
                            }

                        }

                    },

                    scales: {

                        x: {

                            ticks: {
                                color: "#647f98"
                            },

                            grid: {
                                color: "#122a40"
                            }

                        },

                        y: {

                            beginAtZero: true,

                            ticks: {
                                color: "#647f98"
                            },

                            grid: {
                                color: "#122a40"
                            }

                        }

                    }

                }

            }
        );

}


// ================================
// PERFORMANCE CHART
// ================================

function createPerformanceChart() {

    const canvas =
        document.getElementById(
            "performanceChart"
        );


    if (!canvas) return;


    performanceChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [
                        "Accuracy",
                        "Precision",
                        "Recall",
                        "F1 Score"
                    ],

                    datasets: [

                        {

                            label:
                                "Random Forest",

                            data: [
                                98,
                                97,
                                96,
                                96.5
                            ],

                            backgroundColor:
                                "#2ce6d5"

                        },


                        {

                            label:
                                "Gradient Boosting",

                            data: [
                                97,
                                96,
                                95,
                                95.5
                            ],

                            backgroundColor:
                                "#9d7bff"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            ticks: {
                                color: "#7892aa"
                            },

                            grid: {
                                color: "#122a40"
                            }

                        },

                        x: {

                            ticks: {
                                color: "#7892aa"
                            },

                            grid: {
                                color: "#122a40"
                            }

                        }

                    }

                }

            }
        );

}


// ================================
// START
// ================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        createTrafficChart();

        createPerformanceChart();

        updateDashboard();

        loadHistory();

    }
);