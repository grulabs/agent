var stream = require('stream');

module.exports = {
  readable: function(socket) {
    var streamHandler = stream.Readable();
    streamHandler._read = function () {}
    socket.on('data', function (data) {
      streamHandler.push(data)
    });

    return streamHandler;
  },

  writable: function (socket) {
    var streamHandler = new stream.Writable();
    streamHandler._write = function (chunk, encoding, done) {
      socket.emit('data', chunk.toString());
      done();
    };

    return streamHandler;
  }
}
