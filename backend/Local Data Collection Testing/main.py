import asyncio
from bleak import BleakScanner, BleakClient
from enum import Enum, Flag
from dataclasses import dataclass
from typing import Optional, List
import time
import aiohttp
from datetime import datetime, timezone
import logging
import random

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

# Reconnection Configuration
MAX_RECONNECT_ATTEMPTS = 10
INITIAL_RECONNECT_DELAY = 1.0  # seconds
MAX_RECONNECT_DELAY = 60.0  # seconds
RECONNECT_BACKOFF_MULTIPLIER = 1.5
CONNECTION_CHECK_INTERVAL = 5.0  # seconds

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

class ConnectionManager:
    """Manages BLE connection with automatic reconnection capabilities"""
    
    def __init__(self, target_device, data_types: DataType):
        self.target_device = target_device
        self.data_types = data_types
        self.client = None
        self.collector = None
        self.is_connected = False
        self.reconnect_attempts = 0
        self.reconnect_delay = INITIAL_RECONNECT_DELAY
        self.connection_task = None
        self.should_reconnect = True
        
    async def connect(self):
        """Establish initial connection to the device"""
        try:
            logger.info(f"🔌 Connecting to {self.target_device.name}...")
            self.client = BleakClient(self.target_device)
            await self.client.connect()
            self.is_connected = True
            self.reconnect_attempts = 0
            self.reconnect_delay = INITIAL_RECONNECT_DELAY
            
            # Create collector
            self.collector = WhoopCollector(self.client, self.data_types)
            await self.collector.read_static_data()
            await self.collector.subscribe_to_streaming_data()
            
            logger.info("✅ Successfully connected and initialized")
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            self.is_connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from the device"""
        self.should_reconnect = False
        if self.client and self.is_connected:
            try:
                await self.client.disconnect()
                logger.info("🔌 Disconnected from device")
            except Exception as e:
                logger.error(f"❌ Error during disconnect: {e}")
        self.is_connected = False
    
    async def check_connection(self):
        """Check if the connection is still alive"""
        if not self.client or not self.is_connected:
            return False
        
        try:
            # Try to read a simple characteristic to test connection
            await self.client.read_gatt_char(CHAR_UUIDS[DataType.BATTERY])
            return True
        except Exception as e:
            logger.warning(f"⚠️ Connection check failed: {e}")
            return False
    
    async def reconnect(self):
        """Attempt to reconnect with exponential backoff"""
        if not self.should_reconnect:
            return False
            
        while self.reconnect_attempts < MAX_RECONNECT_ATTEMPTS and self.should_reconnect:
            try:
                logger.info(f"🔄 Reconnection attempt {self.reconnect_attempts + 1}/{MAX_RECONNECT_ATTEMPTS}")
                
                # Clean up previous connection
                if self.client:
                    try:
                        await self.client.disconnect()
                    except:
                        pass
                
                # Wait before reconnecting
                if self.reconnect_attempts > 0:
                    delay = min(self.reconnect_delay, MAX_RECONNECT_DELAY)
                    # Add jitter to prevent thundering herd
                    jitter = random.uniform(0.1, 0.5) * delay
                    logger.info(f"⏳ Waiting {delay + jitter:.1f}s before reconnecting...")
                    await asyncio.sleep(delay + jitter)
                
                # Attempt reconnection
                if await self.connect():
                    logger.info("✅ Reconnection successful!")
                    return True
                
                self.reconnect_attempts += 1
                self.reconnect_delay = min(
                    self.reconnect_delay * RECONNECT_BACKOFF_MULTIPLIER,
                    MAX_RECONNECT_DELAY
                )
                
            except Exception as e:
                logger.error(f"❌ Reconnection attempt failed: {e}")
                self.reconnect_attempts += 1
                self.reconnect_delay = min(
                    self.reconnect_delay * RECONNECT_BACKOFF_MULTIPLIER,
                    MAX_RECONNECT_DELAY
                )
        
        logger.error(f"❌ Failed to reconnect after {MAX_RECONNECT_ATTEMPTS} attempts")
        return False
    
    async def start_connection_monitoring(self):
        """Start monitoring connection and handle reconnections"""
        while self.should_reconnect:
            try:
                if not await self.check_connection():
                    logger.warning("⚠️ Connection lost, attempting to reconnect...")
                    self.is_connected = False
                    if not await self.reconnect():
                        logger.error("❌ Reconnection failed, stopping monitoring")
                        break
                
                await asyncio.sleep(CONNECTION_CHECK_INTERVAL)
                
            except Exception as e:
                logger.error(f"❌ Error in connection monitoring: {e}")
                await asyncio.sleep(CONNECTION_CHECK_INTERVAL)
    
    def get_collector(self):
        """Get the current collector instance"""
        return self.collector
    
    def is_device_connected(self):
        """Check if device is currently connected"""
        return self.is_connected and self.client is not None

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
    
    logger.info("🔍 Scanning for WHOOP devices…")
    devs = await BleakScanner.discover()
    target = next((d for d in devs if "WHOOP" in (d.name or "").upper()), None)
    if not target:
        candidates = [d for d in devs]
        logger.error("❌ No WHOOP device found. Available devices:")
        for d in candidates:
            logger.info(f"  - {d.name or 'Unknown'}")
        return
    
    logger.info(f"✅ Found: {target.name}")
    logger.info(f"📊 Collecting: {[dt.name for dt in DataType if dt in data_types and dt != DataType.NONE]}")
    
    # Create connection manager
    connection_manager = ConnectionManager(target, data_types)
    
    # Connect initially
    if not await connection_manager.connect():
        logger.error("❌ Failed to establish initial connection")
        return
    
    async with aiohttp.ClientSession() as session:
        # Start connection monitoring task
        monitoring_task = asyncio.create_task(connection_manager.start_connection_monitoring())
        
        # Start API sending task
        api_task = None
        
        logger.info("📡 Streaming data... Press Ctrl+C to stop")
        logger.info(f"📤 Sending data to API every {API_SEND_INTERVAL} seconds")
        
        try:
            while True:
                # Check if we have a valid collector and connection
                collector = connection_manager.get_collector()
                if collector and connection_manager.is_device_connected():
                    # Start API task if not already running
                    if api_task is None or api_task.done():
                        api_task = asyncio.create_task(collector.send_data_periodically(session))
                        logger.info("📤 API data sending started")
                else:
                    # Stop API task if no connection
                    if api_task and not api_task.done():
                        api_task.cancel()
                        logger.warning("⚠️ API data sending paused - no connection")
                
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("\n🛑 Stopping...")
            
            # Cancel tasks
            monitoring_task.cancel()
            if api_task and not api_task.done():
                api_task.cancel()
            
            # Disconnect
            await connection_manager.disconnect()
            
            # Get final data
            collector = connection_manager.get_collector()
            if collector:
                final_data = collector.get_data()
                logger.info(f"📊 Final collected data: {final_data}")

if __name__ == "__main__":
    asyncio.run(main())
