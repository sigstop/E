//    document.write(e.data.type);

var connection = new WebSocket("ws://localhost:28080/eport.yaws");
Ext.namespace('E');

// connection.send('CONNECT'); // Send the message 'Ping' to the server
connection.onopen = function () {
    var Value = 1;
    connection.send(Bert.encode(Bert.tuple(Bert.atom("hello"),Value))); // Notification that the XServer is online
    connection.send('ES_ONLINE');
};

connection.onmessage = function(msg) {
    var blob = msg.data;
    var reader = new FileReader();
    var Message;
    reader.onloadend = function() {
        var string = reader.result;
	Message = Bert.decode(string);
	console.log(Message.toString());
	var tuple = Message.value;
	var command = tuple[0];
	var Width = tuple[1];
	var Height = tuple[2];
	var Title = tuple[3];
	E.Window = 
	    Ext.extend(Ext.Window, {
		title:Title,
		width:Width,
		height:Height,
		autoscroll:true		
	    });
	var win = new E.Window;
	win.show();
    };
    reader.readAsBinaryString(blob );
};