import React from 'react';
import './App.css';
import MapView from './MapView';
import 'leaflet/dist/leaflet.css';


function App() {
return (
<div className="App">
<header className="app-header">
<h1>SchoolBus 2.0 – Vehicle Movement</h1>
</header>


<main className="app-main">
<MapView />
</main>


<footer className="app-footer">
<small>
Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | Built with React + Leaflet
</small>
</footer>
</div>
);
}


export default App;