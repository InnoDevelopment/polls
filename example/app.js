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
	api.use([url+':token', url+':token/:id'], function(req, res, next) {
		var token = req.params.token;
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
		var pollsCollection = Polls.db.connection.collection(Polls._options.db.table_prefix+'_list');
		pollsCollection.find({
			token: token
		}).toArray(function(err, docs) {
			response.json({
				result: docs,
				status: true
			});
		});
	});

	api.get(url+':token/:id', function(request, response) {
		var token = request.params.token;
		var poll_id = request.params.id;
		var userdata = request.user;
		var pollsCollection = Polls.db.connection.collection(Polls._options.db.table_prefix+'_list');
		pollsCollection.findOne({
			token: token,
			pid: poll_id
		}, function(err, doc) {
			response.json({
				result: doc,
				status: true
			});
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

}

Polls.init(function() {
	console.log("API is ready to use!");
	queryProcess(Polls);
});