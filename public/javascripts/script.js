$(function() {
  console.log('ready');
  // socket.on('data', function (data) {
  //   console.log(data.data)
  // })

  function getCharSize() {
    var $span = $("<span>", {text: "qwertyuiopasdfghjklzxcvbnm"});
    $('#terminal').append($span);
    var size = {
        width: $span.outerWidth()/26,
        height: $span.outerHeight()
    };
    $span.remove();
    return size;
  }
  function getwindowSize() {
    var e = window,
        a = 'inner';
    if (!('innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return {width: e[a + 'Width'], height: e[a + 'Height']};
  }

  function textSize() {
    var charSize = {width: 6.7, height: 17} ;
        //getCharSize();
    var windowSize = getwindowSize();
    return {
        x: Math.floor(windowSize.width / charSize.width),
        y: Math.floor(windowSize.height / charSize.height)
    };
  }

  function launchTerminal() {
    var rc = textSize();
    console.log(rc);
    var term = new Terminal({
      rows: 48,
      cols: 160,
      convertEol: true,
      useStyle: true,
      screenKeys: true,
      cursorBlink: false
    });

    term.on('data', function(data) {
      socket.emit('data', data);
    });
    term.on('title', function(title) {
      document.title = title;
    });
    term.open(document.body);
    
    term.write('\x1b[31mWelcome to term.js!\x1b[m\r\n');

    socket.on('data', function(evt) {
      console.log(evt);
      term.write(evt);
    })
    socket.on('disconnect', function(evt) {
      term.destroy();
    })
  }

  launchTerminal();
})