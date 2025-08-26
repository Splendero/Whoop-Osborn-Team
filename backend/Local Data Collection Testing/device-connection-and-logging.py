import asyncio
from bleak import BleakScanner, BleakClient
import csv
import os
from datetime import datetime, timezone 
import aiohttp
import json
import pandas as pd
import numpy as np
from typing import Dict, Optional

HR_SERVICE = "0000180d-0000-1000-8000-00805f9b34fb"
HR_MEASUREMENT = "00002a37-0000-1000-8000-00805f9b34fb"

# Configuration for API endpoint
API_ENDPOINT = "http://localhost:8000/heart-rate-data"  # Change this to your actual API endpoint
API_SEND_INTERVAL = 1.0  # Send data every 1 second

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

async def send_data_to_api(session, hr, rr):
    """Send single data point to API endpoint"""
    try:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hr": hr,
            "rr": rr
        }
        
        async with session.post(API_ENDPOINT, json=payload) as response:
            if response.status == 200:
                rr_info = f", RR: {rr}" if rr is not None else ""
                print(f"✅ API data sent successfully: HR: {hr}{rr_info}")
            else:
                print(f"❌ API request failed with status {response.status}")
    except Exception as e:
        print(f"❌ API send error: {e}")

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

    # Data collection for API
    last_api_send = 0

    async with BleakClient(target) as client:
        async with aiohttp.ClientSession() as session:
            def cb(_, data):
                nonlocal last_api_send
                hr, energy, rrs = parse_hrm(bytearray(data))
                print(f"HR={hr} bpm rr={rrs}")
                ts = datetime.now(timezone.utc).isoformat()
                
                try:
                    # Always record HR when > 0, regardless of RR presence
                    if isinstance(hr, int) and hr > 0:
                        # Write to CSV
                        with open(log_path, "a", newline="") as f:
                            csv.writer(f).writerow([ts, hr, ""])  # HR-only row
                        
                        # Send HR-only data to API
                        current_time = asyncio.get_event_loop().time()
                        if current_time - last_api_send >= API_SEND_INTERVAL:
                            last_api_send = current_time
                            asyncio.create_task(send_data_to_api(session, hr, None))
                    
                    # Record any non-zero RR values as separate rows (skip zeros)
                    for rr in (rrs or []):
                        if rr and rr > 0:
                            # Write to CSV
                            with open(log_path, "a", newline="") as f:
                                csv.writer(f).writerow([ts, hr, rr])  # RR-only row
                            
                            # Send HR+RR data to API
                            current_time = asyncio.get_event_loop().time()
                            if current_time - last_api_send >= API_SEND_INTERVAL:
                                last_api_send = current_time
                                asyncio.create_task(send_data_to_api(session, hr, rr))
                        
                except Exception as e:
                    print(f"Log write error: {e}")

            await client.start_notify(HR_MEASUREMENT, cb)
            print("Subscribed. Streaming… Ctrl+C to stop.")
            print(f"API data will be sent to {API_ENDPOINT} every {API_SEND_INTERVAL} second(s)")
            
            while True:
                await asyncio.sleep(1)

asyncio.run(main())