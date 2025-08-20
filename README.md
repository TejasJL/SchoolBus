# 🚍 SchoolBus 2.0 – Vehicle Movement on a Map

A frontend React.js application that simulates a vehicle (bus) moving along a predefined route on a map.  
The app uses **Leaflet.js** and **dummy location data** to animate the bus in real-time while providing useful statistics.

---

## 🎯 Objective
To create an interactive map-based simulation of a bus moving along a route using dummy JSON data,  
with smooth animation and intuitive controls.

---

## 🛠 Features

### 🗺 Map Integration
- Interactive map powered by **Leaflet.js**
- Displays bus route with polyline
- Bus stops shown with custom icons
- Auto-follow option to keep the bus centered

### 🚍 Vehicle Simulation
- Smooth animated movement of the bus  
- Controls: **Play / Pause / Restart / Reset**  
- Real-time updates for bus position and speed  

### 📊 Live Stats
- Elapsed Time  
- Current Speed  
- Total Distance Travelled  
- Current Coordinates  

### 📱 Responsive UI
- Works on both desktop and mobile  
- Clean card-style display for statistics  

---

## 📂 Example Dummy Data

The app uses a local `dummy-route.json` file stored inside the **public** folder.

```json
[
  { "latitude": 18.520430, "longitude": 73.856743, "timestamp": "2024-07-20T10:00:00Z", "stop": true },
  { "latitude": 18.520900, "longitude": 73.858200, "timestamp": "2024-07-20T10:00:10Z" },
  { "latitude": 18.521700, "longitude": 73.859600, "timestamp": "2024-07-20T10:00:20Z", "stop": true },
  { "latitude": 18.523300, "longitude": 73.862400, "timestamp": "2024-07-20T10:00:40Z" }
]
  ```
---

 ## ⚡ Technology Stack

React.js (Functional Components + Hooks)

Leaflet.js (Map & Animation)

JavaScript (ES6+)

Custom Icons (bus.png, stop.png)

---

## 🎮 Controls

| Button            | Action                              |
| ----------------- | ----------------------------------- |
| ▶ **Play**        | Starts bus animation                |
| ⏸ **Pause**       | Pauses animation                    |
| ⏯ **Restart**     | Resumes animation from paused point |
| 🔄 **Reset**      | Resets bus to starting position     |
| ☑ **Auto-Follow** | Keeps bus centered on the map       |


---

## 📊 Stats Displayed

Elapsed Time – Time since start of journey

Speed – Real-time speed in km/h

Total Distance – Distance covered in km

Coordinates – Current latitude and longitude

---

## 🌐 Live Demo

🔗 SchoolBus 2.0 Live app – https://school-bus-beta.vercel.app/

---

## 👨‍💻 Author

Tejas Lahurikar

Frontend Developer – Assignment Submission
