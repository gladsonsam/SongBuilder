const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('../en.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
  
  // Get table names
  db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      return;
    }
    
    console.log('Tables in the database:');
    tables.forEach(table => {
      console.log(` - ${table.name}`);
      
      // Get column info for each table
      db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
        if (err) {
          console.error(`Error getting columns for ${table.name}:`, err.message);
          return;
        }
        
        console.log(`   Columns in ${table.name}:`);
        columns.forEach(col => {
          console.log(`     - ${col.name} (${col.type})`);
        });
        
        // If this is the songs table, get a sample row
        if (table.name === 'songs') {
          db.get(`SELECT * FROM ${table.name} LIMIT 1`, [], (err, row) => {
            if (err) {
              console.error(`Error getting sample from ${table.name}:`, err.message);
              return;
            }
            
            console.log(`\nSample row from ${table.name}:`);
            console.log(JSON.stringify(row, null, 2));
            
            // Close the database connection after we're done
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err.message);
              } else {
                console.log('Database connection closed.');
              }
            });
          });
        }
      });
    });
  });
});
