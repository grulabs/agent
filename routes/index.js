var express = require('express');
var router = express.Router();
var Docker = require('dockerode');
var uuid = require('node-uuid');
var AWS = require('aws-sdk');
var ecs = new AWS.ECS({apiVersion: '2014-11-13', region: 'us-east-1'});
var findPort = require('find-port');

var counter = 0;

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
						},
						{
							name: 'TERM',
							value: 'xterm'
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

function stopTask(params, cb) {
	ecs.stopTask(params, function(err, data) {
	  if (err) cb(err);
	  else cb(null, data);
	});
}

/* GET home page. */
router.get('/', function(req, res, next) {
  var taskId = req.query.taskId;
  res.render('index', { title: 'Express' , taskId: taskId});
});

/* GET home page. */
router.get('/term', function(req, res, next) {
  var taskId = req.query.taskId;
  res.render('term', { title: 'Express' , taskId: taskId});
});

/* Launch container */
router.post('/create', function(req, res, next) {
	task_id = uuid.v4();
	createContainer(task_id, req.query.image, {cmd: ['sleep', 'infinity']}, function(err, data){
		if (err) res.status(500).json({'status': 'failed', 'message': err.stack});
		else {
			res.json({'status': 'success', 'id': task_id, 'message': data});
		}
	});
});

router.post('/delete', function(req, res, next) {
	var params = {
		task: req.query.id, /* required */
		cluster: 'default'
	};
	stopTask(params, function(err, data){
		if (err) res.status(500).json({'status': 'failed', 'message': err.stack});
		else {
			res.json({'status': 'success', 'message': data});
		}
	});
});

router.post('/port', function(req, res, next) {
  var docker = new Docker();
  var port = req.query.port;
  var taskId = req.query.taskId;
  docker.listContainers(function (err, containers) {
    containers.forEach(function (containerInfo) {
      var container = docker.getContainer(containerInfo.Id)
      container.inspect(function (err, data) {
        data.Config.Env.forEach(function (envVar) {
          var splitVar = envVar.split('=');
          if (splitVar[0] === 'DC_TASK_ID') {
            if (splitVar[1] === taskId) {
              var ipAddr = data.NetworkSettings.IPAddress
              findPort(50000, 60000, function(ports) {
                  var cmd = 'sudo iptables -t nat -A  DOCKER -p tcp --dport ' + ports[counter] + ' -j DNAT --to-destination ' + ipAddr + ':' + port;
                  var exec = require('child_process').exec;
                  console.log(cmd);
                  exec(cmd, function (err, stdout, stderr) {
                    console.log('in exec');
                    if (!err) console.log('error: ' + err);
                    res.json({port: ports[counter++]});
                  });
              });
            }
          }
        });
      });
    });
  });
});

router.get('/status', function(req, res, next) {
  var docker = new Docker();
  var taskId = req.query.taskId;
  docker.listContainers(function (err, containers) {
    console.log(containers);
    var c = containers.length;
    containers.forEach(function(containerInfo) {
      c--;
      var container = docker.getContainer(containerInfo.Id);
      container.inspect(function(err, data) {
        data.Config.Env.forEach(function (envVar) {
          var splitVar = envVar.split('=');
          if (splitVar[0] === 'DC_TASK_ID') {
            if (splitVar[1] === taskId) {
              res.json({status: 'running'});
            } else if (c === 0) {
              res.json({status: 'failed'});
            }
          }
        });
      })
    })
  })
});

module.exports = router;
