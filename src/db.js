"use strict";

class PollsDB {

	constructor(api, options) {
		this.api = api;
		var PollsDB = this;
		PollsDB._options = options;
		switch(PollsDB._options.type) {
			case 'mongodb': PollsDB._instance = new PollsMongoDB(PollsDB, options); break;
			case 'mysql': PollsDB._instance = new PollsMySQLDB(PollsDB, options); break;
			default: PollsDB._instance = new PollsMongoDB(PollsDB, options);
		}
	}

	connect(callback) {
		var PollsDB = this;
		PollsDB._instance.connect(callback);
	}
}

class PollsMongoDB {

	constructor(PollsDB, options) {
		var PollsMongoDB = this;
		PollsMongoDB.PollsDB = PollsDB;
		PollsMongoDB._connection = null;

		// Setting up default params
		options = options || {};
		options.port = options.port || 27017;
		options.database = options.database || 'mongodb';
		options.path = options.path || '';
		options.protocol = options.protocol || 'mongodb://';
		PollsMongoDB._options = options;

		// Include MongoDB library
		try {
			var mongo = require('mongodb');
			PollsMongoDB._mongo = mongo;
			console.log('MongoDB module loaded');
		} catch (e) {
			console.log('Error: Module "mongodb" not found. Use `npm install mongodb` command to fix this problem');
			process.exit(1);
		}
	}

	connect(callback) {
		var PollsMongoDB = this;
		// Connect to the server
		var url = PollsMongoDB._options.protocol+PollsMongoDB._options.host+':'+PollsMongoDB._options.port+PollsMongoDB._options.path;
		PollsMongoDB._mongo.connect(url, function(err, db) {
			if(err) {
				console.log('Connection error in MongoDB module\r\n'+err);
				process.exit(1);
			}
			PollsMongoDB.PollsDB.connection = db;
			console.log('MongoDB connection established');
			if(callback) callback();
		});
	}
}

class PollsMySQLDB {

	constructor(PollsDB, options) {
		var PollsMySQLDB = this;
		PollsMySQLDB.PollsDB = PollsDB;

		// Setting up default params
		options = options || {};
		options.port = options.port || 3306;
		options.database = options.database || 'mysql';
		PollsMySQLDB._options = options;

		// Include MySQL library
		try {
			var mysql = require('mysql');
			PollsMySQLDB._mysql = mysql;
			console.log('MySQL module loaded');
		} catch (e) {
			console.log('Error: Module "mysql" not found. Use `npm install mysql` command to fix this problem');
			process.exit(1);
		}
	}

	connect(callback) {
		var PollsMySQLDB = this;
		// Connect to the server
		var connection = PollsMySQLDB._mysql.createConnection({
			host     : PollsMySQLDB._options.host,
			user     : PollsMySQLDB._options.username,
			password : PollsMySQLDB._options.password,
			database : PollsMySQLDB._options.database
		});
		connection.connect(function(err) {
			if(err) {
				console.log('Connection error in MySQL module\r\n'+err);
				process.exit(1);
			}
			PollsMySQLDB.PollsDB.connection = connection;
			console.log('MySQL connection established');
			if(callback) callback();
		});
	}

	// find(table, filter, callback) {
	// 	var PollsMySQLDB = this;
	// 	PollsMySQLDB._connection.query('SELECT 1', function(err, rows) {
	// 		f(err) {
	// 			console.log('Query error in MySQL module\r\n'+err);
	// 		}
	// 		if(callback) callback(rows);
	// 	});
	// }
}

module.exports = PollsDB;