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
    case 'launch_eclock':
	launchEClock(tuple);
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
    
//    images[ImageID].autoEl.src = img;
//    images[ImageID].doAutoRender();
//    images[ImageID].show();

    windows[WindowID].remove(images[ImageID]);
    windows[WindowID].add(Image);
    windows[WindowID].doLayout();
    images[ImageID] = Image;
};

function sketchClock(processing) {
    // Override draw function, by default it will be called 60 times per second
    processing.draw = function() {

	// determine center and max clock arm length
	var centerX = processing.width / 2, centerY = processing.height / 2;
	var maxArmLength = Math.min(centerX, centerY);
	
	function drawArm(position, lengthScale, weight) {
            processing.strokeWeight(weight);
	    processing.line(centerX, centerY,
			    centerX + Math.sin(position * 2 * Math.PI) * lengthScale * maxArmLength,
			    centerY - Math.cos(position * 2 * Math.PI) * lengthScale * maxArmLength);
	}
	
	// erase background
	processing.background(224);
	
	var now = new Date();
	
	// Moving hours arm by small increments
	var hoursPosition = (now.getHours() % 12 + now.getMinutes() / 60) / 12;
	drawArm(hoursPosition, 0.5, 5);
	
	// Moving minutes arm by small increments
	var minutesPosition = (now.getMinutes() + now.getSeconds() / 60) / 60;
	drawArm(minutesPosition, 0.80, 3);
	
	// Moving hour arm by second increments
	var secondsPosition = now.getSeconds() / 60;
	drawArm(secondsPosition, 0.90, 1);
    }
};

function launchEClock(tuple)
{
    var Width = tuple[1];
    var Height = tuple[2];
    canvasWindow = new Ext.Window({
	title:'EClock'
	,height:Height + 32   //132
	,width:Width + 14    //114
	,items:{
	    xtype: 'box',
	    autoEl:{
		tag: 'canvas'
	    }
	    ,listeners:{
		render:{
		    scope:this
		    ,fn:function(){
			var processingInstance = new Processing(canvasWindow.items.items[0].el.dom, sketchClock);
			processingInstance.size(Width,Height);

		    }
		}
	    }
	}
    });
    canvasWindow.show();
//    var processingInstance = new Processing(canvasWindow.items.items[0].el.dom, sketchProc);
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