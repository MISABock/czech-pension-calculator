from flask import Flask, request, jsonify
from flask_cors import CORS
from pension import calculate_pension

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.post("/api/calculate")
def calculate():
    data = request.get_json(silent=True) or {}
    try:
        ovz_monthly = float(data.get("ovz_monthly", 0))
        years = int(data.get("years", 0))
        year = int(data.get("year", 2025))
        early_days = int(data.get("early_days", 0))

        result = calculate_pension(
            ovz_monthly=ovz_monthly,
            years=years,
            year=year,
            early_days=early_days,
        )
        return jsonify(result)
    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
