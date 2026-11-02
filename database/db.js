const Database = require('better-sqlite3');
const path = require('path');

// Sciezka do pliku bazy SQLite
const dbPath = path.join(__dirname, 'restaurant.sqlite');

// Polaczenie z baza
const db = new Database(dbPath, {
    // verbose: console.log // odkomentuj, jesli chcesz widziec kazde zapytanie SQL w konsoli
});

// Wlaczenie obslugi kluczy obcych (foreign keys) w SQLite
db.pragma('foreign_keys = ON');

module.exports = db;
