var Docker = require('dockerode');
var docker = new Docker();
var streamHandler = require('./stream-handler');

module.exports = function (io) {

  // Handle socket io events
  io.on('connection', function (socket) {
    var taskId = socket.handshake.query.taskId;
    var cmd = (socket.handshake.query.cmd || '/bin/bash').split(' ');
    console.log('new connection: ' + taskId + ', ' + cmd);

    proxyContainerOutput(docker, taskId);

    // socket.on('error', function(error) {
    //   console.log(error)
    // })

    // socket.emit('news', { hello: 'world' });
    
    // socket.on('my other event', function (data) {
    //   console.log(data);
    // });

    function proxyContainerOutput(docker, taskId, cb) {
      docker.listContainers(function (err, containers) {
        containers.forEach(function (containerInfo) {
          var container = docker.getContainer(containerInfo.Id)
          container.inspect(function (err, data) {
            data.Config.Env.forEach(function (envVar) {
              var splitVar = envVar.split('=');
              if (splitVar[0] === 'DC_TASK_ID') {
                if (splitVar[1] === taskId) {
                  console.log('found it!');
                  var opts = {
                    AttachStdin: true,
                    AttachStdout: true,
                    AttachStderr: true,
                    Tty: true,
                    Cmd: cmd
                  }

                  container.exec(opts, function (err, exec) {
                    if (err) return;

                    exec.start({stdin: true}, function(err, stream) {
                      if (err) return;
                      // stream.write('ls');
                      stream.setEncoding('utf8');
                      stream.pipe(streamHandler.writable(socket));
                      streamHandler.readable(socket).pipe(stream);
                      // stream.pipe(process.stdout);
                    });
                    
                  });
                }
              }
            })
            // forEach(function (envVar) {
            //   envVars = envVar.split('=');
            //   if (envVars[0] === 'DC_TASK_ID') {
            //     if (envVars[1] === taskId) {
            //       cb()
            //     }
            //   }
            // });
          });
        });
      });
    }

  });
}


