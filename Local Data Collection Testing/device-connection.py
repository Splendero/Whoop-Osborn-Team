# pip install bleak
import asyncio
from bleak import BleakScanner, BleakClient

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
    async with BleakClient(target) as client:
        def cb(_, data):
            hr, energy, rrs = parse_hrm(bytearray(data))
            print(f"HR={hr} bpm rr={rrs}")
        await client.start_notify(HR_MEASUREMENT, cb)
        print("Subscribed. Streaming… Ctrl+C to stop.")
        while True:
            await asyncio.sleep(1)

asyncio.run(main())