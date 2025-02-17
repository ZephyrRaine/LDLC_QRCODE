const mysql = require('mysql');

// Create a connection to the database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'groupe2',
    password: 'groupe2',
    database: 'groupe2'
});

// Connect to the database
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database');
});

// Function to execute SQL queries
function execute(query, callback) {
    connection.query(query, (err, result) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, result);
    });
}

// // Usage example
// const msg = 'SELECT * FROM users';
// execute(msg, (err, result) => {
//     if (err) {
//         console.error('Error executing query: ' + err);
//         return;
//     }
//     console.log('Query result:', result);
// });

// // Close the database connection
// connection.end();

module.exports = { execute };