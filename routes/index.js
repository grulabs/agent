var express = require('express');
var router = express.Router();
var Docker = require('dockerode');
var uuid = require('node-uuid');
var AWS = require('aws-sdk');
var ecs = new AWS.ECS({apiVersion: '2014-11-13', region: 'us-east-1'});

function createContainer(id, image, args, cb){

	// Create new task definition
	var taskParams = {
	  containerDefinitions: [
	    {
			cpu: args.cpu || 1,
			essential: true ,
			image: image,
			memory: args.memory || 100,
			name: 'user-container',
	    },
	  ],
	  family: task_id
	};

	createTaskDefinition(taskParams, function(err, data) {
		if (err) cb(err);
		else {
			var params = {
			  taskDefinition: task_id,
			  cluster: 'default',
			  count: 1,
			  overrides: {
			    containerOverrides: [
			      {
			        name: 'user-container',
			        command: args.cmd || null,
					environment: [
						{
							name: 'DC_TASK_ID',
							value: task_id
						}
					],
			      }
			    ]
			  },
			  startedBy: 'docklet'
			};
			launchTask(params, function(err, data) {
				if (err) cb(err);
				else cb(null, data);
			});
		}
	});

}

function createTaskDefinition(params, cb) {
	ecs.registerTaskDefinition(params, function(err, data) {
		if (err) cb(err);
		else cb(null, data)
	});
}

function launchTask(params, cb) {
	ecs.runTask(params, function(err, data) {
	  if (err) cb(err);
	  else cb(null, data);
	});
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Launch container */
router.post('/create', function(req, res, next) {
	task_id = uuid.v4();
	createContainer(task_id, req.body.image, {cmd: req.body.cmd}, function(err, data){
		if (err) res.json({'status': 'failed', 'message': err.stack});
		else {
			res.json({'status': 'success', 'id': task_id, 'message': data});
		}
	});
});

module.exports = router;
