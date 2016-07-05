var PollsAPI = require('./../src/polls').PollsAPI;
var params = require('./config.json');

var Polls = new PollsAPI(params);

function queryProcess(Polls) {
	var api = Polls.api;
	var bodyParser = require('body-parser');
	var url = params.pre_uri+params.version+params.service_name;
	api.use( bodyParser.json() );       // to support JSON-encoded bodies
	api.use(bodyParser.urlencoded({     // to support URL-encoded bodies
		extended: true
	}));

	/* Accounting check */
	api.use([url+':token/:id', url+':token', url], function(req, res, next) {
		var token = req.params.token || req.body.token;
		if(!token) {
			res.json({
				error: "You are not logged in",
				status: false
			});
		} else {
			var fields = {
				token: token
			};
			Polls.user.account.runCommand('exists', fields, function(result, fail_msg) {
				if(!result) {
					res.json({
						error: "Your token has been expired",
						status: false
					});
				} else {
					Polls.user.account.runCommand('getUser', fields, function(result, fail_msg) {
						if(!result) {
							res.json({
								error: "Your token has been expired",
								status: false
							});
						} else {
							req.user = result;
							next();
						}
					});
				}
			});
		}
	});

	// api.post(url+'auth', function(request, response) {
	// 	Polls.user.account.runCommand('auth', request.body, function(result, fail_msg) {
	// 		if(result) {
	// 			response.json({
	// 				result: result,
	// 				status: true
	// 			});
	// 		} else {
	// 			response.json({
	// 				error: fail_msg,
	// 				status: false
	// 			});
	// 		}
	// 	});
	// });

	api.get(url+':token', function(request, response) {
		var token = request.params.token;
		var userdata = request.user;
		Polls.db.getPollList({"author": userdata.id}, function(err, docs) {
			if(err) {
				response.json({
					error: "Query error",
					status: false
				});
			} else {
				response.json({
					result: docs,
					status: true
				});
			}
		});
	});

	api.get(url+':token/:id([0-9]*?)', function(request, response) {
		var token = request.params.token;
		var poll_id = request.params.id;
		var userdata = request.user;
		Polls.db.getPoll({"author": userdata.id, "pid": parseInt(poll_id)}, function(err, doc) {
			if(err) {
				response.json({
					error: "Query error",
					status: false
				});
			} else {
				response.json({
					result: doc,
					status: true
				});
			}
		});
	});

	/* Create poll */
	api.post(url, function(request, response) {
		var token = request.body.token;
		var userdata = request.user;
		request.body.fields.userdata = userdata;
		request.body.fields.token = request.body.token
		Polls.db.createPoll(request.body.fields, function(err, result) {
			if(err) {
				response.json({
					error: "Insert error",
					status: false
				});
			} else {
				response.json({
					result: result,
					status: true
				});
			}
		});
	});

	/* Create a question for a poll */
	api.post(url+':id', function(request, response) {
		response.json({
			error: "Not implemented",
			status: false
		});
	});

	/* Delete a poll */
	api.delete(url+':id', function(request, response) {
		response.json({
			error: "Not implemented",
			status: false
		});
	});

	api.get(url, function(request, response) {

		/* For MongoDB */
		var pollsCollection = Polls.db.connection.collection('polls');

		response.json({
			data: "rows"
		});

		/* For MySQL */
		// Polls.db.connection.query('SELECT user_name FROM user;', function(err, rows) {
		// 	response.json({
		// 		data: rows
		// 	});
		// });
	});

	/* No such action */
	api.all(url+'*', function(request, response) {
		response.json({
			error: "No such action",
			status: false
		});
	});

}

Polls.init(function() {
	console.log("API is ready to use!");
	queryProcess(Polls);
});