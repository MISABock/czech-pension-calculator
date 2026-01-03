from flask import Flask, request, jsonify
from flask_cors import CORS
from pension import calculate_pension
import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.before_request
def log_visitor():
    visitor_ip = request.headers.get('Cf-Connecting-Ip') or request.remote_addr
    city = request.headers.get('Cf-Ipcity', 'Unbekannt')
    country = request.headers.get('Cf-Ipcountry', 'Unbekannt')
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\n--- [{timestamp}] ANFRAGE ---")
    print(f"IP: {visitor_ip} ({city}, {country})")

@app.post("/api/calculate")
def calculate():
    data = request.get_json(silent=True) or {}
    
    # GPS Daten aus dem Frontend-Request
    lat = data.get("user_lat")
    lng = data.get("user_lng")
    
    if lat and lng:
        print(f"📍 GPS (VOM BROWSER): Lat {lat}, Lng {lng}")
        print(f"🔗 Google Maps: https://www.google.com/maps?q={lat},{lng}")
    else:
        print("📍 GPS: Zugriff verweigert oder nicht gesendet.")

    try:
        res = calculate_pension(
            ovz_monthly=float(data.get("ovz_monthly", 0)),
            years=int(data.get("years", 0)),
            year=int(data.get("year", 2025)),
            early_days=int(data.get("early_days", 0)),
        )
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)