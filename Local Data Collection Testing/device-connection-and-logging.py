# pip install bleak
import asyncio
from bleak import BleakScanner, BleakClient
import csv
import os
from datetime import datetime, timezone

HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb"
HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb"

def parse_hrm(data: bytearray):
    i = 0
    flags = data[i]; i += 1
    hr16 = (flags & 0x01) != 0
    if hr16:
        hr = data[i] | (data[i+1] << 8); i += 2
    else:
        hr = data[i]; i += 1
    energy = None
    if (flags & 0x08) != 0:
        energy = data[i] | (data[i+1] << 8); i += 2
    rrs = []
    if (flags & 0x10) != 0:
        while i + 1 < len(data):
            rr = data[i] | (data[i+1] << 8); i += 2
            rrs.append(rr / 1024.0)
    return hr, energy, rrs

async def main():
    print("Scanning for HR devices…")
    devs = await BleakScanner.discover()
    target = next((d for d in devs if "WHOOP" in (d.name or "").upper()), None)
    if not target:
        # fallback: connect by service filter
        candidates = [d for d in devs]
        print("Pick device manually:", [d.name for d in candidates])
        return
    # Prepare CSV log
    log_path = os.path.join(os.path.dirname(__file__), "hr_rr_log.csv")
    if not os.path.exists(log_path) or os.path.getsize(log_path) == 0:
        with open(log_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp", "HR", "RR"])  # RR is seconds per beat (BLE HRM RR-interval)

    async with BleakClient(target) as client:
        def cb(_, data):
            hr, energy, rrs = parse_hrm(bytearray(data))
            print(f"HR={hr} bpm rr={rrs}")
            ts = datetime.now(timezone.utc).isoformat()
            try:
                # Always record HR when > 0, regardless of RR presence
                if isinstance(hr, int) and hr > 0:
                    with open(log_path, "a", newline="") as f:
                        csv.writer(f).writerow([ts, hr, ""])  # HR-only row
                # Record any non-zero RR values as separate rows (skip zeros)
                for rr in (rrs or []):
                    if rr and rr > 0:
                        with open(log_path, "a", newline="") as f:
                            csv.writer(f).writerow([ts, hr, rr])  # RR-only row
            except Exception as e:
                print(f"Log write error: {e}")

        await client.start_notify(HR_MEASUREMENT, cb)
        print("Subscribed. Streaming… Ctrl+C to stop.")
        while True:
            await asyncio.sleep(1)

asyncio.run(main())