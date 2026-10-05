from flask import Flask, render_template, request, jsonify
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}
    return jsonify({
        "prediction": "Normal",
        "message": "Demo prediction. Connect your trained model in app.py.",
        "received_features": len(data)
    })

if __name__ == "__main__":
    app.run(debug=True)
