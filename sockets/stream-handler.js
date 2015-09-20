var stream = require('stream');
var util = require('util');

var MyStream = function(socket) {
  stream.Readable.call(this);
  this.socket = socket; // pass through the options to the Readable constructor
  // this.counter = 1000;
};

util.inherits(MyStream, stream.Readable);

MyStream.prototype._read = function() {

}

module.exports = {
  readable: function(socket) {
    var mystream = new MyStream(socket);
    socket.on('data', function(data) {
      mystream.push(String(data))
    });
    return mystream;

    // var streamHandler = new stream.Readable();
    // streamHandler._read = function () {}
    // socket.on('data', function (data) {
    //   streamHandler.push(data)
    // });
    // return streamHandler;
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
