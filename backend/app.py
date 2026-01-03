from flask import Flask, request, jsonify
from flask_cors import CORS
from pension import calculate_pension
import datetime


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.before_request
def log_visitor():
    # Cloudflare Header für IP und Standort
    visitor_ip = request.headers.get('Cf-Connecting-Ip') or request.remote_addr
    city = request.headers.get('Cf-Ipcity', 'Unbekannt')
    country = request.headers.get('Cf-Ipcountry', 'Unbekannt')
    
    # Hier holen wir die Koordinaten STILL aus den Headern (kein Popup nötig!)
    lat = request.headers.get('Cf-Iplatitude')
    lng = request.headers.get('Cf-Iplongitude')
    
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    print(f"\n--- [{timestamp}] ANFRAGE (SILENT TRACKING) ---")
    print(f"IP: {visitor_ip} ({city}, {country})")
    
    if lat and lng:
        print(f"📍 STANDORT VIA IP: Lat {lat}, Lng {lng}")
        print(f"🔗 Google Maps: https://www.google.com/maps?q={lat},{lng}")
    else:
        print("📍 STANDORT: Keine Cloudflare-Geo-Daten empfangen.")

@app.post("/api/calculate")
def calculate():
    data = request.get_json(silent=True) or {}

    try:
        res = calculate_pension(
            ovz_monthly=float(data.get("ovz_monthly", 0)),
            years=int(data.get("years", 0)),
            year=int(data.get("year", 2025)),
            early_days=int(data.get("early_days", 0)),
        )
        return jsonify(res)
    except Exception as e:
        print(f"❌ Fehler: {str(e)}")
        return jsonify({"error": str(e)}), 400

@app.get("/api/geoip")
def geoip():
    ip = request.headers.get("CF-Connecting-IP") \
         or request.headers.get("X-Forwarded-For", "").split(",")[0].strip() \
         or request.remote_addr

    return jsonify({"ip": ip})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)