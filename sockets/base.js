var Docker = require('dockerode');
var docker = new Docker();
var streamHandler = require('./stream-handler');

module.exports = function (io) {

  // Handle socket io events
  io.on('connection', function (socket) {
    var taskId = socket.handshake.query.id
    console.log('new connection: ' + taskId);

    proxyContainerOutput(docker, taskId);

    // socket.emit('news', { hello: 'world' });
    
    // socket.on('my other event', function (data) {
    //   console.log(data);
    // });

    function proxyContainerOutput(docker, taskId, cb) {
      docker.listContainers(function (err, containers) {
        containers.forEach(function (containerInfo) {
          var container = docker.getContainer(containerInfo.Id)
          container.inspect(function (err, data) {
            if (data.Config.Image === 'ubuntu') {
              container.attach({stream: true, stdin: true, stdout: true, stderr: true, logs: true}, function (err, stream) {
                stream.pipe(streamHandler.writable(socket));
                streamHandler.readable(socket).pipe(stream);
              });
            }
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


