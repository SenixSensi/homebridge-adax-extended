# 🌡️ Homebridge ADAX Extended Plugin

An extended and improved version of the original [homebridge-adax](https://github.com/eirikeikaas/homebridge-adax) plugin by **Eirik Eikaas**,  
adapted and maintained by **SenixSensi (2025)** for easier testing, development, and updated Homebridge compatibility.

This plugin integrates **Adax WiFi heaters** with HomeKit through **Homebridge**, exposing each room as a **Thermostat accessory** in the Apple Home app.  
You can view and adjust current and target temperatures, and toggle heating directly from HomeKit.

---

## ⚙️ Configuration

To use this plugin, you’ll need your Adax **Account ID** and **API Secret**.

Get them from the **Adax app**:

1. Open the **Account** page.  
2. Note the **Account ID** listed at the bottom.  
3. Go to **Remote user client API** → **Add credential**.  
4. Note the generated password — this is your **API secret**.  
5. Add both values to your Homebridge configuration and restart Homebridge.

Example configuration:

JSON
{
  "platform": "ADAX",
  "name": "ADAX",
  "clientId": "your-account-id",
  "secret": "your-api-secret"
}

If you want to run in **Dummy Mode** (for testing without real Adax devices), simply set:

JSON
{
  "clientId": "dummy",
  "secret": "dummy",
  "dummyMode": true
}

You can also define optional custom names for the dummy rooms:

JSON
{
  "platform": "ADAX",
  "name": "ADAX",
  "dummyMode": true,
  "clientId": "dummy",
  "secret": "dummy",
  "roomNames": {
    "1": "Living Room",
    "2": "Bedroom"
  }
}

Dummy Mode automatically provides simulated thermostat accessories for testing automations and verifying configuration behaviour.

---

## 🔧 Features

- 🧪 **Dummy/Test Mode** – test without any physical Adax heaters (using \`"clientId": "dummy"\` and \`"secret": "dummy"\`)  
- 🏷️ **Custom Room Names** – rename simulated rooms directly in config  
- 🔁 **Improved Polling** – smarter caching and error handling  
- 🪵 **Enhanced Logging** – clearer messages about discovery and updates  
- ⚙️ **Full compatibility** with Homebridge v1.9+ and Node.js 18+  

---

## 📜 License and Credits

This project is licensed under the [Apache 2.0 License](./LICENSE).  
It is based on the original **homebridge-adax** plugin by *Eirik Eikaas* and extends it with new features and modernised compatibility.

**Modifications by SenixSensi include:**

- Added Dummy Mode for development  
- Added Custom Room Names for dummy mode  
- Improved logging, polling, and error handling  
- Updated configuration schema  
- Verified for Homebridge v1.9+

---

⭐ If you find this plugin useful, please consider starring it on GitHub or sharing feedback in the Homebridge community.