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
			PollsMongoDB.PollsDB.api.debug('MongoDB module loaded');
		} catch (e) {
			PollsMongoDB.PollsDB.api.debug('Error: Module "mongodb" not found. Use `npm install mongodb` command to fix this problem');
			process.exit(1);
		}
	}

	connect(callback) {
		var PollsMongoDB = this;
		// Connect to the server
		var url = PollsMongoDB._options.protocol+PollsMongoDB._options.host+':'+PollsMongoDB._options.port+PollsMongoDB._options.path;
		PollsMongoDB._mongo.connect(url, function(err, db) {
			if(err) {
				PollsMongoDB.PollsDB.api.debug('Connection error in MongoDB module\r\n'+err);
				process.exit(1);
			}
			PollsMongoDB.PollsDB.connection = db;
			PollsMongoDB.PollsDB.api.debug('MongoDB connection established');
			if(callback) callback();
		});
	}

	find(filter, callback) {
		var PollsMongoDB = this;

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
			PollsMySQLDB.PollsDB.api.debug('MySQL module loaded');
		} catch (e) {
			PollsMySQLDB.PollsDB.api.debug('Error: Module "mysql" not found. Use `npm install mysql` command to fix this problem');
			process.exit(1);
		}
	}

	createScheme(callback) {
		var PollsMySQLDB = this;

		if(!PollsMySQLDB.PollsDB.connection) { // just in case
			PollsMySQLDB.PollsDB.api.debug('Error: No connection!');
			process.exit(1);
		}

		var TP = PollsMySQLDB._options.table_prefix;

		var sql = 
		'CREATE TABLE IF NOT EXISTS `'+TP+'_list` ('+
			'`poll_id` int(11) NOT NULL AUTO_INCREMENT,'+
			'`token` text NOT NULL,'+
			'`title` text NOT NULL,'+
			'`description` text,'+
			'`privacy_type` text NOT NULL,'+
			'`password` text,'+
			'`author` text,'+
			'PRIMARY KEY (`poll_id`)'+
		');'+
		'CREATE TABLE IF NOT EXISTS `'+TP+'_questions` ('+
			'`question_id` int(11) NOT NULL AUTO_INCREMENT,'+
			'`type` text NOT NULL,'+
			'`description` text NOT NULL,'+
			'`data` text,'+
			'`poll_id` int(11),'+
			'PRIMARY KEY (`question_id`)'+
		');'+
		'CREATE TABLE IF NOT EXISTS `'+TP+'_result` ('+
			'`result_id` int(11) NOT NULL AUTO_INCREMENT,'+
			'`date` text NOT NULL,'+
			'`poll_id` text NOT NULL,'+
			'`user` text,'+
			'PRIMARY KEY (`result_id`)'+
		')';

		PollsMySQLDB.PollsDB.connection.query(sql, function(err, rows, fields) {
			if(err) {
				PollsMySQLDB.PollsDB.api.debug('Scheme creation error in MySQL module\r\n'+err);
				process.exit(1);
			}
			if(rows.warningCount == 0) {
				PollsMySQLDB.PollsDB.api.debug('MySQL tables were successfuly created');
				if(callback) callback();
			}
		});
	}

	dropTables(callback) {
		var PollsMySQLDB = this;

		if(!PollsMySQLDB.PollsDB.connection) { // just in case
			PollsMySQLDB.PollsDB.api.debug('Error: No connection!');
			process.exit(1);
		}

		var sql = 'DROP TABLE `poll_list`';
		PollsMySQLDB.PollsDB.connection.query(sql, function(err, rows, fields) {
			if(err) {
				PollsMySQLDB.PollsDB.api.debug('Tables dropping error in MySQL module\r\n'+err);
				process.exit(1);
			}
			if(rows.warningCount == 0) {
				PollsMySQLDB.PollsDB.api.debug('MySQL tables were successfuly dropped');
				if(callback) callback();
			}
		});
	}

	connect(callback) {
		var PollsMySQLDB = this;
		// Connect to the server
		var connection = PollsMySQLDB._mysql.createConnection({
			host     : 	 PollsMySQLDB._options.host,
			user     : 	 PollsMySQLDB._options.username,
			password : 	 PollsMySQLDB._options.password,
			database : 	 PollsMySQLDB._options.database
		});
		connection.connect(function(err) {
			if(err) {
				PollsMySQLDB.PollsDB.api.debug('Connection error in MySQL module\r\n'+err);
				process.exit(1);
			}
			PollsMySQLDB.PollsDB.connection = connection;
			PollsMySQLDB.PollsDB.api.debug('MySQL connection established');
			PollsMySQLDB.createScheme(callback);
		});
	}

	// find(table, filter, callback) {
	// 	var PollsMySQLDB = this;
	// 	PollsMySQLDB._connection.query('SELECT 1', function(err, rows) {
	// 		f(err) {
	// 			PollsMySQLDB.PollsDB.api.debug('Query error in MySQL module\r\n'+err);
	// 		}
	// 		if(callback) callback(rows);
	// 	});
	// }
}

module.exports = PollsDB;