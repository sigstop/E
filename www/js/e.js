//    document.write(e.data.type);

var connection = new WebSocket("ws://localhost:28080/eport.yaws");
Ext.namespace('E');

var windows = new Object();
var images = new Object();


// connection.send('CONNECT'); // Send the message 'Ping' to the server
connection.onopen = function () {
    var Value = 1;
    connection.send(Bert.encode(Bert.tuple(Bert.atom("hello"),Value))); // Notification that the XServer is online
    connection.send('ES_ONLINE');
};

var emsg_handle = function(tuple) {
    var command = tuple[0];
    switch(command.value)
    {
    case 'create_window':
	createWindow(tuple);
	break;
    case 'window_add_image':
	windowAddImage(tuple);  
	break;
    default: 
	alert("The EClient sent unknown command: " + command)
    }
};
    
var createWindow = function(tuple) {
    var ID = tuple[1];
    var Width = tuple[2];
    var Height = tuple[3];
    var Title = tuple[4];
    E.Window = 
	Ext.extend(Ext.Window, {
	    title:Title,
	    width:Width,
	    height:Height,
	    autoscroll:true		
	});
    windows[tuple[1].value] = new E.Window;
    windows[tuple[1].value].show();
};

var windowAddImage = function(tuple) {
    var WindowID = tuple[1];
    var ImageID = tuple[2];
    var Data = tuple[3];
    var Image;
    var image_reader = new FileReader();
    image_reader.onloadend = function() {
	RawData = image_reader.result;
	Image = Bert.decode(RawData);
    };
    image_reader.readAsBinaryString(Data);
    images[ImageID.value] = Image;
};
	
connection.onmessage = function(msg) {
    var blob = msg.data;
    var Message;
    var reader = new FileReader();
    reader.onloadend = function() {
        var string = reader.result;
	Message = Bert.decode(string);
	console.log(Message.toString());
	var tuple = Message.value;
	emsg_handle(tuple);
    };
    reader.readAsBinaryString(blob );
};