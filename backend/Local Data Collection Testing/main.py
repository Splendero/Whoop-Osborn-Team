import asyncio
from bleak import BleakScanner, BleakClient
from enum import Enum, Flag
from dataclasses import dataclass
from typing import Optional, List
import time
import aiohttp
from datetime import datetime, timezone

class DataType(Flag):
    NONE = 0
    HR_MEASUREMENT = 1
    BATTERY = 2


@dataclass
class WhoopData:
    hr: Optional[int] = None
    rr_intervals: Optional[List[float]] = None
    battery: Optional[int] = None


# Characteristic UUIDs
CHAR_UUIDS = {
    DataType.HR_MEASUREMENT: "00002a37-0000-1000-8000-00805f9b34fb",
    DataType.BATTERY: "00002a19-0000-1000-8000-00805f9b34fb",
}

# API Configuration
API_ENDPOINT = "http://localhost:8000/whoop-data"
API_SEND_INTERVAL = 0.5  # Send data every 0.5 seconds

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

def parse_battery(data: bytearray) -> int:
    return data[0] if len(data) >= 1 else 0

def parse_string(data: bytearray) -> str:
    try:
        return data.decode('utf-8').strip('\x00')
    except:
        return data.hex()

async def send_to_api(session, data: WhoopData):
    """Send data to the API"""
    try:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hr": data.hr,
            "rr_intervals": data.rr_intervals,
            "battery": data.battery
        }
        
        # Debug: Print what we're sending
        print(f" Sending payload: {payload}")
        
        async with session.post(API_ENDPOINT, json=payload) as response:
            if response.status == 200:
                print(f"✅ API data sent: HR={data.hr}, RR={data.rr_intervals}, Battery={data.battery}")
            else:
                print(f"❌ API request failed with status {response.status}")
    except Exception as e:
        print(f"❌ API send error: {e}")

class WhoopCollector:
    def __init__(self, client, data_types: DataType):
        self.client = client
        self.data_types = data_types
        self.data = WhoopData()
        self.callbacks = {}
        self.last_api_send = 0
        
    def create_callback(self, data_type: DataType):
        def callback(_, data):
            if data_type == DataType.HR_MEASUREMENT:
                hr, energy, rrs = parse_hrm(bytearray(data))
                self.data.hr = hr
                self.data.rr_intervals = rrs
                print(f"HR={hr} bpm rr={rrs}")
                
            elif data_type == DataType.BATTERY:
                battery = parse_battery(bytearray(data))
                self.data.battery = battery
                print(f" Battery: {battery}%")
        
        return callback
    
    async def read_static_data(self):
        if DataType.BATTERY in self.data_types:
            try:
                value = await self.client.read_gatt_char(CHAR_UUIDS[DataType.BATTERY])
                self.data.battery = parse_battery(bytearray(value))
                print(f" Initial Battery: {self.data.battery}%")
            except Exception as e:
                print(f"❌ Failed to read initial battery: {e}")
    
    async def subscribe_to_streaming_data(self):
        streaming_types = [
            DataType.HR_MEASUREMENT,
            DataType.BATTERY,
        ]
        
        for data_type in streaming_types:
            if data_type in self.data_types:
                try:
                    callback = self.create_callback(data_type)
                    await self.client.start_notify(CHAR_UUIDS[data_type], callback)
                    self.callbacks[data_type] = callback
                    print(f"✅ Subscribed to {data_type.name}")
                except Exception as e:
                    print(f"❌ Failed to subscribe to {data_type.name}: {e}")
    
    async def send_data_periodically(self, session):
        """Send data to API periodically"""
        while True:
            current_time = asyncio.get_event_loop().time()
            if current_time - self.last_api_send >= API_SEND_INTERVAL:
                self.last_api_send = current_time
                await send_to_api(session, self.data)
            await asyncio.sleep(1)
    
    def get_data(self) -> WhoopData:
        return self.data

async def main():
    data_types = DataType.HR_MEASUREMENT | DataType.BATTERY
    
    print(" Scanning for WHOOP devices…")
    devs = await BleakScanner.discover()
    target = next((d for d in devs if "WHOOP" in (d.name or "").upper()), None)
    if not target:
        candidates = [d for d in devs]
        print("Pick device manually:", [d.name for d in candidates])
        return
    
    print(f"✅ Found: {target.name}")
    print(f"📊 Collecting: {[dt.name for dt in DataType if dt in data_types and dt != DataType.NONE]}")
    
    async with BleakClient(target) as client:
        async with aiohttp.ClientSession() as session:
            collector = WhoopCollector(client, data_types)
            
            await collector.read_static_data()
            await collector.subscribe_to_streaming_data()
            
            # Start API sending task
            api_task = asyncio.create_task(collector.send_data_periodically(session))
            
            print("📡 Streaming data... Press Ctrl+C to stop")
            print(f"📤 Sending data to API every {API_SEND_INTERVAL} seconds")
            
            try:
                while True:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Stopping...")
                api_task.cancel()
                final_data = collector.get_data()
                print(f"📊 Final collected data: {final_data}")

asyncio.run(main())
