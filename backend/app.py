"""
app.py  —  Galaxy Rescue RPA Bridge Server
==========================================
This Flask server acts as the bridge between the React game frontend
and the RPA automation layer.

ARCHITECTURE:
  React UI  ─►  POST /api/scan  ─►  rpa_runner.py  ─►  planet_data.xlsx
                                        │
                                        ▼ (optional, if installed)
                                  UiPath CLI / Power Automate Desktop
                                        │
                                        ▼
              React UI  ◄─  JSON scan results  ◄─  Flask backend

ENDPOINTS:
  GET  /api/health           — health check
  POST /api/scan             — trigger RPA scan, returns scan results (SSE stream)
  GET  /api/scan/results     — return cached latest scan results
  GET  /api/planets          — return raw planet data from Excel
  POST /api/scan/reset       — clear cached results (for replay)
"""

import os
import json
import time
import threading
from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS

from rpa_runner import RpaRunner

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Shared state (simple in-memory for single-machine demo)
_scan_lock    = threading.Lock()
_latest_scan  = None   # dict of last completed scan
_scan_running = False  # flag to prevent parallel scans

EXCEL_PATH = os.path.join(os.path.dirname(__file__), "planet_data.xlsx")


# ── Health check ────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    runner = RpaRunner(EXCEL_PATH)
    return jsonify({
        "status": "online",
        "excel_found": os.path.exists(EXCEL_PATH),
        "rpa_mode": runner.detect_rpa_mode(),
        "version": "1.0.0",
    })


# ── Raw planet data (from Excel) ────────────────────────────────────────────
@app.route("/api/planets", methods=["GET"])
def get_planets():
    runner = RpaRunner(EXCEL_PATH)
    try:
        planets = runner.read_excel_direct()
        return jsonify({"success": True, "planets": planets})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Streaming scan (Server-Sent Events) ─────────────────────────────────────
@app.route("/api/scan/stream", methods=["GET"])
def scan_stream():
    """
    SSE endpoint.  The frontend connects here and receives real-time log
    messages as the RPA bot processes the Excel file row by row.
    Finally sends the 'done' event with the full scan result JSON.
    """
    global _scan_running, _latest_scan

    def generate():
        global _scan_running, _latest_scan

        with _scan_lock:
            if _scan_running:
                yield _sse("error", {"message": "Scan already in progress"})
                return
            _scan_running = True

        runner = RpaRunner(EXCEL_PATH)
        result = {"planets": [], "errors": []}

        try:
            yield _sse("log", {"text": "Initializing Galaxy Bot v3.1...",            "status": "RUNNING"})
            time.sleep(0.6)
            yield _sse("log", {"text": f"RPA mode: {runner.detect_rpa_mode()}",      "status": "RUNNING"})
            time.sleep(0.5)
            yield _sse("log", {"text": "Opening planetary database (Excel)...",       "status": "RUNNING"})
            time.sleep(0.7)

            planets = runner.read_excel_direct()
            yield _sse("log", {"text": f"Loaded {len(planets)} planetary records.",   "status": "RUNNING"})
            time.sleep(0.5)

            yield _sse("log", {"text": "Reading danger threshold configuration...",   "status": "RUNNING"})
            time.sleep(0.4)
            yield _sse("log", {"text": "Thresholds: O2<35% | Energy<25% | Shield<30%", "status": "RUNNING"})
            time.sleep(0.5)
            yield _sse("log", {"text": "Beginning per-planet analysis loop...",       "status": "RUNNING"})
            time.sleep(0.6)

            thresholds = runner.get_thresholds()

            for i, planet in enumerate(planets):
                time.sleep(0.5)
                yield _sse("log", {
                    "text": f"[Row {i+1}] Scanning planet: {planet['name']}...",
                    "status": "RUNNING"
                })
                time.sleep(0.4)

                # Check each reading
                flags = []
                if planet["oxygen"] < thresholds["oxygen"]:
                    flags.append(f"O2={planet['oxygen']}% (CRITICAL)")
                if planet["energy"] < thresholds["energy"]:
                    flags.append(f"Energy={planet['energy']}% (CRITICAL)")
                if planet["shield"] < thresholds["shield"]:
                    flags.append(f"Shield={planet['shield']}% (CRITICAL)")

                planet["in_danger"] = len(flags) > 0
                planet["danger_reasons"] = flags
                result["planets"].append(planet)

                status_text = "IN DANGER" if planet["in_danger"] else "SAFE"
                reason_text = " | ".join(flags) if flags else "All readings nominal"
                yield _sse("log", {
                    "text": f"  -> {planet['name']}: {status_text} — {reason_text}",
                    "status": "RUNNING"
                })
                time.sleep(0.3)

            time.sleep(0.5)
            danger_count = sum(1 for p in result["planets"] if p["in_danger"])
            yield _sse("log", {
                "text": f"Analysis complete. {danger_count} planet(s) require immediate rescue.",
                "status": "RUNNING"
            })
            time.sleep(0.4)
            yield _sse("log", {
                "text": "Generating mission report...",
                "status": "RUNNING"
            })
            time.sleep(0.5)
            yield _sse("log", {"text": "RPA scan completed successfully.", "status": "COMPLETED"})

            _latest_scan = result
            yield _sse("done", result)

        except Exception as e:
            yield _sse("log",   {"text": f"ERROR: {str(e)}", "status": "FAILED"})
            yield _sse("error", {"message": str(e)})
        finally:
            _scan_running = False

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


# ── Non-streaming scan (simple fallback POST) ─────────────────────────────
@app.route("/api/scan", methods=["POST"])
def scan():
    """
    Simple synchronous scan — processes the Excel file and returns results.
    The frontend polls this for environments where SSE is tricky.
    """
    global _latest_scan
    runner = RpaRunner(EXCEL_PATH)
    try:
        planets   = runner.read_excel_direct()
        thresholds = runner.get_thresholds()
        for p in planets:
            flags = []
            if p["oxygen"] < thresholds["oxygen"]:
                flags.append(f"O2={p['oxygen']}% critical")
            if p["energy"] < thresholds["energy"]:
                flags.append(f"Energy={p['energy']}% critical")
            if p["shield"] < thresholds["shield"]:
                flags.append(f"Shield={p['shield']}% critical")
            p["in_danger"]      = len(flags) > 0
            p["danger_reasons"] = flags

        result = {"planets": planets, "rpa_mode": runner.detect_rpa_mode()}
        _latest_scan = result
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Get cached results ───────────────────────────────────────────────────────
@app.route("/api/scan/results", methods=["GET"])
def get_results():
    if _latest_scan:
        return jsonify({"success": True, **_latest_scan})
    return jsonify({"success": False, "message": "No scan run yet"}), 404


# ── Reset scan state (replay) ────────────────────────────────────────────────
@app.route("/api/scan/reset", methods=["POST"])
def reset_scan():
    global _latest_scan, _scan_running
    _latest_scan  = None
    _scan_running = False
    return jsonify({"success": True})


# ── SSE helper ───────────────────────────────────────────────────────────────
def _sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


if __name__ == "__main__":
    print("[Galaxy Rescue RPA Server] Starting on port 5050...")
    print(f"[Galaxy Rescue RPA Server] Excel path: {EXCEL_PATH}")
    print(f"[Galaxy Rescue RPA Server] Excel exists: {os.path.exists(EXCEL_PATH)}")
    app.run(host="0.0.0.0", port=5050, debug=False, threaded=True)
