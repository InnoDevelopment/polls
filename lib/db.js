class PollsDB {

	constructor(api, options) {
		this.api = api;
		var PollsDB = this;
		PollsDB._options = options;
		switch(PollsDB._options.type) {
			case 'mongodb': return new PollsMongoDB(PollsDB, options); break;
			case 'mysql': return new PollsMySQLDB(PollsDB, options); break;
			default: return new PollsMongoDB(PollsDB, options);
		}
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
		var url = PollsMongoDB._options.protocol+PollsMongoDB._options.host+':'+PollsMongoDB._options.port+'/'+PollsMongoDB._options.database;
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

	getPoll(filter, callback) {
		var PollsMongoDB = this;
		var pollsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_list');
		pollsCollection.findOne(filter, {'_id': false}, function(err, doc) {
			var data = (err||!doc) ? null : {
				pid: doc.pid,
				title: doc.title,
				description: doc.description,
				privacy_type: doc.privacy_type,
				password: doc.password,
				author: doc.author
			};
			var pollsQuestionsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_questions');
			pollsQuestionsCollection.find({'pid': data.pid}, {'pid': false}).toArray(function(err, docs) {
				data.questions = docs;
				if(callback) callback(err, data);
			});
		});
	}

	getPollList(filter, limit, callback) {
		var PollsMongoDB = this;
		var pollsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_list');
		limit = (limit ? (limit<=30 ? limit : 30) : 30);
		pollsCollection.find(filter, {'_id': false}).limit(parseInt(limit)).toArray(function(err, docs) {
			if(callback) callback(err, docs);
		});
	}

	createPoll(fields, userdata, callback) {
		var PollsMongoDB = this;
		var pollsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_list');
		var options = { "sort": [['pid','desc']] };
		pollsCollection.findOne({}, options , function(err, doc) {
			var newId = 1 + (doc ? doc.pid : 0);
			var createdAt = new Date().getTime();
			var data = {
				title: fields.title,
				description: fields.description,
				privacy_type: fields.privacy_type,
				password: fields.password,
				author: userdata.id,
				created_at: createdAt,
				pid: newId,
				questions: []
			};
			pollsCollection.insertOne(data, function(err, result) {
				if(callback) callback(err, data);
			});
		});
	}

	deletePoll(poll_id, userdata, callback) {
		var PollsMongoDB = this;
		var pollsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_list');
		pollsCollection.findOne({pid: poll_id} , function(err, doc) {
			if(doc) {
				if(doc.author == userdata.id) {
					pollsCollection.remove({pid: poll_id}, function(err, result) {
						if(!err) {
							var pollsQuestionsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_questions');
							pollsQuestionsCollection.remove({pid: poll_id}, function(err, result) {
								if(callback) callback(err, true, "Poll has been deleted");
							});
						}
					});
				} else {
					if(callback) callback(err, false, "You have no access to delete this poll");
				}
			} else {
				if(callback) callback(err, false, "No such poll");
			}
		});
	}

	addQuestions(poll_id, questions, userdata, callback) {
		var PollsMongoDB = this;
		var pollsQuestionsCollection = PollsMongoDB.PollsDB.connection.collection(PollsMongoDB._options.table_prefix+'_questions');
		var options = { "sort": {'qid': -1} };
		pollsQuestionsCollection.findOne({}, options , function(err, doc) {
			var newId = 1 + (doc ? doc.qid : 0);
			for(var i = 0; i<questions.length; i++) {
				questions[i].qid = newId++;
				questions[i].pid = poll_id;
			}
			pollsQuestionsCollection.insertMany(questions, function(err, result) {
				if(callback) callback(err, questions);
			});
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

	/*find(table, filter, callback) {
		var PollsMySQLDB = this;
		PollsMySQLDB._connection.query('SELECT 1', function(err, rows) {
			f(err) {
				PollsMySQLDB.PollsDB.api.debug('Query error in MySQL module\r\n'+err);
			}
			if(callback) callback(rows);
		});
	}*/
}

module.exports = PollsDB;