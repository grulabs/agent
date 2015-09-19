var Docker = require('Dockerode');
var docker = new Docker();

module.exports = function (io) {

  // Handle socket io events
  io.on('connection', function (socket) {
    var taskId = socket.handshake.query.id
    console.log('new connection: ' + taskId);

    getContainerWithId(docker, taskId)

    socket.emit('news', { hello: 'world' });
    
    socket.on('my other event', function (data) {
      console.log(data);
    });
  
  });
}

function getContainerWithId(docker, taskId, cb) {
  docker.listContainers(function (err, containers) {
    console.log(containers)
    containers.forEach(function (containerInfo) {
      docker.getContainer(containerInfo.Id).inspect(function (err, data) {
        data.Config.Env.forEach(function (envVar) {
          console.log('ENVAR: ' + envVar)
        })
      })
    });
  });
}
