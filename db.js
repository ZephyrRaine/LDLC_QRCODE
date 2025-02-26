const mysql = require('mysql');

class Database {
    constructor(dbName) {
        this.connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: dbName
        });

        this.connection.connect((err) => {
            if (err) {
                console.error('Error connecting to the database: ' + err.stack);
                return;
            }
            console.log('Connected to the database');
        });
    }

    execute(query, callback) {
        this.connection.query(query, (err, result) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, result);
        });
    }

    close() {
        this.connection.end((err) => {
            if (err) {
                console.error('Error closing the database connection: ' + err.stack);
                return;
            }
            console.log('Database connection closed');
        });
    }
}

module.exports = Database;