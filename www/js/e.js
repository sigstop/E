//    document.write(e.data.type);

var connection = new WebSocket("ws://localhost:28080/eport.yaws");
Ext.namespace('E');

var windows = new Object();
var images = new Object();
var global_image;


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
    case 'window_update_image':
	windowUpdateImage(tuple);
	break;
    default: 
	alert("The EClient sent unknown command: " + command)
    }
};
    
var createWindow = function(tuple) {
    var ID = tuple[1].value;
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
    console.log(ID);
    windows[ID] = new E.Window;
    windows[ID].show();
};

var windowAddImage = function(tuple) {
    var WindowID = tuple[1].value;
    var ImageID = tuple[2].value;
    var ImageWidth = tuple[3];
    var ImageHeight = tuple[4];
    var Data = tuple[5].value;

    var img =  "data:image/png;base64," + window.btoa(Data);

    var Image = new Ext.Component({
	autoEl: { tag: 'img', width: ImageWidth, height: ImageHeight, src: img}
    });

    windows[WindowID].add( Image );
    windows[WindowID].doLayout();
    images[ImageID] = Image;
};

var windowUpdateImage = function(tuple) {
    var WindowID = tuple[1].value;
    var ImageID = tuple[2].value;
    var Data = tuple[3].value;

    var img =  "data:image/png;base64," + window.btoa(Data);

    var Image = new Ext.Component({
	autoEl: { tag: 'img', width: images[ImageID].autoEl.width, height: images[ImageID].autoEl.height, src: img}
    });

    windows[WindowID].remove(images[ImageID]);
    windows[WindowID].add(Image);
    windows[WindowID].doLayout();
    images[ImageID] = Image;
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