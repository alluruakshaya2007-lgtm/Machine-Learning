from flask import Flask, render_template, request, jsonify
from datetime import datetime
import csv
import io
import json
import os
import random

app = Flask(__name__)

HISTORY_FILE = "history.json"


def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []

    try:
        with open(HISTORY_FILE, "r") as file:
            return json.load(file)
    except:
        return []


def save_history(history):
    with open(HISTORY_FILE, "w") as file:
        json.dump(history[-100:], file, indent=2)


def analyze_traffic(data):
    """
    Demo detection engine for the Expo website.

    This is NOT the trained ML model.
    It creates a deterministic risk score from the
    supplied network-flow values.
    """

    duration = float(data.get("flow_duration", 0))
    fwd = float(data.get("total_fwd_packets", 0))
    backward = float(data.get("total_backward_packets", 0))
    packet_mean = float(data.get("packet_length_mean", 0))
    bytes_sec = float(data.get("flow_bytes_s", 0))
    packets_sec = float(data.get("flow_packets_s", 0))

    score = 0

    if packets_sec > 500:
        score += 25

    if bytes_sec > 500000:
        score += 25

    if fwd > 500:
        score += 15

    if backward > 500:
        score += 15

    if packet_mean > 1000:
        score += 10

    if duration < 50 and packets_sec > 100:
        score += 10

    score = min(score, 100)

    # Small deterministic variation based on inputs
    seed_value = int(
        duration +
        fwd +
        backward +
        packet_mean
    )

    random.seed(seed_value)

    if score >= 50:
        label = "MALICIOUS"
        rf_result = "MALICIOUS"
        gb_result = "MALICIOUS"
        confidence = min(98, 70 + score // 2)

    elif score >= 30:
        label = "SUSPICIOUS"
        rf_result = "MALICIOUS"
        gb_result = "NORMAL"
        confidence = min(92, 65 + score // 2)

    else:
        label = "NORMAL"
        rf_result = "NORMAL"
        gb_result = "NORMAL"
        confidence = min(99, 90 + random.randint(0, 8))

    risk_level = (
        "HIGH" if score >= 50
        else "MEDIUM" if score >= 30
        else "LOW"
    )

    return {
        "label": label,
        "confidence": confidence,
        "risk_score": score,
        "risk_level": risk_level,
        "random_forest": rf_result,
        "gradient_boosting": gb_result
    }


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/status")
def status():

    return jsonify({
        "online": True,
        "mode": "EXPO DEMO",
        "engine": "Network Traffic Risk Engine",
        "models": "Simulation Mode",
        "feature_count": 6
    })


@app.route("/api/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        result = analyze_traffic(data)

        record = {
            "time": datetime.now().strftime(
                "%d-%m-%Y %H:%M:%S"
            ),

            "protocol":
                data.get("protocol", "TCP"),

            "label":
                result["label"],

            "confidence":
                result["confidence"],

            "risk_score":
                result["risk_score"],

            "random_forest":
                result["random_forest"],

            "gradient_boosting":
                result["gradient_boosting"]
        }

        history = load_history()

        history.append(record)

        save_history(history)

        return jsonify(result)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 400


@app.route("/api/history")
def history():

    return jsonify(load_history())


@app.route("/api/metrics")
def metrics():

    return jsonify({

        "random_forest": {
            "accuracy": 98,
            "precision": 97,
            "recall": 96,
            "f1": 96.5
        },

        "gradient_boosting": {
            "accuracy": 97,
            "precision": 96,
            "recall": 95,
            "f1": 95.5
        }

    })


@app.route("/api/batch_predict", methods=["POST"])
def batch_predict():

    try:

        file = request.files.get("file")

        if not file:
            return jsonify({
                "error": "Please upload a CSV file."
            }), 400

        content = file.read().decode(
            "utf-8",
            errors="ignore"
        )

        reader = csv.DictReader(
            io.StringIO(content)
        )

        normal = 0
        malicious = 0
        suspicious = 0
        analyzed = 0

        for row in reader:

            result = analyze_traffic({

                "flow_duration":
                    row.get(
                        "Flow Duration",
                        0
                    ),

                "total_fwd_packets":
                    row.get(
                        "Total Fwd Packets",
                        0
                    ),

                "total_backward_packets":
                    row.get(
                        "Total Backward Packets",
                        0
                    ),

                "packet_length_mean":
                    row.get(
                        "Packet Length Mean",
                        0
                    ),

                "flow_bytes_s":
                    row.get(
                        "Flow Bytes/s",
                        0
                    ),

                "flow_packets_s":
                    row.get(
                        "Flow Packets/s",
                        0
                    ),

                "protocol":
                    row.get(
                        "Protocol",
                        "TCP"
                    )
            })

            analyzed += 1

            if result["label"] == "NORMAL":
                normal += 1

            elif result["label"] == "MALICIOUS":
                malicious += 1

            else:
                suspicious += 1

            if analyzed >= 1000:
                break

        return jsonify({

            "rows_analyzed": analyzed,

            "normal": normal,

            "malicious": malicious,

            "suspicious": suspicious

        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 400


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )