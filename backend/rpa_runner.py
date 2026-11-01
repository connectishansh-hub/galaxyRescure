"""
rpa_runner.py  —  RPA Execution Layer
=====================================
This module handles the actual "RPA" work:
  1. Reading planet data from Excel (always works — openpyxl)
  2. Triggering UiPath Robot CLI (if UiPath is installed)
  3. Triggering Power Automate Desktop (if PAD is installed)

Priority: UiPath > Power Automate Desktop > Python-native Excel reader
The Python reader IS the real automation — it performs the same logic a
UiPath/PAD workflow would, just implemented in Python.
"""

import os
import json
import subprocess
import tempfile

try:
    from openpyxl import load_workbook
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

# Danger thresholds — must match gameData.js DANGER_THRESHOLDS
DEFAULT_THRESHOLDS = {"oxygen": 35, "energy": 25, "shield": 30}

# Common UiPath Robot locations
UIPATH_ROBOT_PATHS = [
    r"C:\Program Files\UiPath\Studio\UiRobot.exe",
    r"C:\Program Files (x86)\UiPath\Studio\UiRobot.exe",
    r"C:\Users\{user}\AppData\Local\UiPath\app-{ver}\UiRobot.exe",
]

# Power Automate Desktop CLI
PAD_CONSOLE_PATH = r"C:\Program Files (x86)\Power Automate Desktop\PAD.Console.Host.exe"


class RpaRunner:
    def __init__(self, excel_path: str):
        self.excel_path = excel_path
        self.uipath_exe = self._find_uipath()
        self.pad_exe    = self._find_pad()

    # ── Mode detection ──────────────────────────────────────────────────────
    def detect_rpa_mode(self) -> str:
        if self.uipath_exe:
            return "UiPath Robot"
        if self.pad_exe:
            return "Power Automate Desktop"
        if HAS_OPENPYXL:
            return "Python RPA (openpyxl)"
        return "Fallback (in-memory)"

    # ── Main entry: run the appropriate RPA method ─────────────────────────
    def run_scan(self) -> dict:
        """
        Returns: {
            "planets": [
                {
                    "id": "P01",
                    "name": "Zephyra",
                    "oxygen": 28, "energy": 72, "shield": 85,
                    "in_danger": True,
                    "danger_reasons": ["O2=28% critical"]
                }, ...
            ],
            "rpa_mode": "Python RPA (openpyxl)"
        }
        """
        if self.uipath_exe:
            return self._run_uipath()
        if self.pad_exe:
            return self._run_pad()
        return self._run_python_rpa()

    # ── Read Excel directly (Python RPA) ───────────────────────────────────
    def read_excel_direct(self) -> list:
        """Read the planet_data.xlsx and return list of planet dicts."""
        if not HAS_OPENPYXL:
            raise RuntimeError("openpyxl not installed. Run: pip install openpyxl")
        if not os.path.exists(self.excel_path):
            raise FileNotFoundError(f"Excel file not found: {self.excel_path}")

        wb = load_workbook(self.excel_path, data_only=True)
        ws = wb["PlanetDatabase"]

        planets = []
        # Data starts at row 4 (row 1=title, row 2=thresholds note, row 3=headers)
        for row in ws.iter_rows(min_row=4, values_only=True):
            if not row[0]:   # skip empty rows
                continue
            pid, name, desc, oxygen, energy, shield, *_ = row
            if not name:
                continue
            planets.append({
                "id":      str(pid).strip(),
                "name":    str(name).strip(),
                "desc":    str(desc).strip() if desc else "",
                "oxygen":  int(oxygen)  if oxygen  is not None else 0,
                "energy":  int(energy)  if energy  is not None else 0,
                "shield":  int(shield)  if shield  is not None else 0,
            })
        wb.close()
        return planets

    def get_thresholds(self) -> dict:
        """Read thresholds from Excel sheet 2, fall back to defaults."""
        try:
            wb = load_workbook(self.excel_path, data_only=True)
            ws = wb["Thresholds"]
            thresholds = dict(DEFAULT_THRESHOLDS)
            for row in ws.iter_rows(min_row=2, values_only=True):
                if row[0] and row[1]:
                    thresholds[str(row[0]).lower()] = int(row[1])
            wb.close()
            return thresholds
        except Exception:
            return dict(DEFAULT_THRESHOLDS)

    # ── Python-native RPA (no external tool needed) ────────────────────────
    def _run_python_rpa(self) -> dict:
        thresholds = self.get_thresholds()
        planets    = self.read_excel_direct()
        for p in planets:
            flags = []
            if p["oxygen"] < thresholds["oxygen"]:
                flags.append(f"O2={p['oxygen']}% critical (<{thresholds['oxygen']}%)")
            if p["energy"] < thresholds["energy"]:
                flags.append(f"Energy={p['energy']}% critical (<{thresholds['energy']}%)")
            if p["shield"] < thresholds["shield"]:
                flags.append(f"Shield={p['shield']}% critical (<{thresholds['shield']}%)")
            p["in_danger"]      = len(flags) > 0
            p["danger_reasons"] = flags
        return {"planets": planets, "rpa_mode": "Python RPA (openpyxl)"}

    # ── UiPath Robot CLI ───────────────────────────────────────────────────
    def _run_uipath(self) -> dict:
        """
        Trigger UiPath Robot to run the ScanPlanets.xaml workflow.
        The workflow writes its JSON output to a temp file which we read back.
        """
        workflow_path = os.path.join(os.path.dirname(__file__), "..", "rpa", "ScanPlanets.xaml")
        output_path   = os.path.join(tempfile.gettempdir(), "galaxy_scan_result.json")

        cmd = [
            self.uipath_exe,
            "execute",
            "--file",    workflow_path,
            "--input",   json.dumps({"ExcelPath": self.excel_path, "OutputPath": output_path}),
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                raise RuntimeError(f"UiPath exited {result.returncode}: {result.stderr}")
            with open(output_path) as f:
                data = json.load(f)
            data["rpa_mode"] = "UiPath Robot"
            return data
        except Exception as e:
            # Fall back to Python RPA if UiPath fails
            print(f"[RPA] UiPath failed ({e}), falling back to Python RPA")
            result = self._run_python_rpa()
            result["rpa_mode"] = f"Python RPA (UiPath fallback: {e})"
            return result

    # ── Power Automate Desktop ─────────────────────────────────────────────
    def _run_pad(self) -> dict:
        """
        Power Automate Desktop flows can be triggered via the PAD Console.
        The flow must be named 'ScanPlanets' and configured to accept the
        ExcelPath input variable and produce a JSON output file.
        """
        output_path = os.path.join(tempfile.gettempdir(), "galaxy_scan_result.json")
        cmd = [
            self.pad_exe,
            "/flow", "ScanPlanets",
            "/input", json.dumps({"ExcelPath": self.excel_path, "OutputPath": output_path}),
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                raise RuntimeError(f"PAD exited {result.returncode}: {result.stderr}")
            with open(output_path) as f:
                data = json.load(f)
            data["rpa_mode"] = "Power Automate Desktop"
            return data
        except Exception as e:
            print(f"[RPA] PAD failed ({e}), falling back to Python RPA")
            result = self._run_python_rpa()
            result["rpa_mode"] = f"Python RPA (PAD fallback: {e})"
            return result

    # ── Finders ──────────────────────────────────────────────────────────────
    def _find_uipath(self) -> str | None:
        for path in UIPATH_ROBOT_PATHS:
            expanded = os.path.expandvars(path)
            if os.path.exists(expanded):
                return expanded
        # Also try PATH
        try:
            r = subprocess.run(["UiRobot.exe", "--version"], capture_output=True, timeout=5)
            if r.returncode == 0:
                return "UiRobot.exe"
        except Exception:
            pass
        return None

    def _find_pad(self) -> str | None:
        if os.path.exists(PAD_CONSOLE_PATH):
            return PAD_CONSOLE_PATH
        return None
