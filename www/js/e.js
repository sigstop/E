//    document.write(e.data.type);

var connection = new WebSocket("ws://" + location.host + "/eport.yaws");
Ext.namespace('E');

var windows = new Object();
var images = new Object();
var object_cache = new Object();
var global_image;

function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
};

// connection.send('CONNECT'); // Send the message 'Ping' to the server
connection.onopen = function () {
    var Value = 1;
    connection.send('ES_ONLINE');
    connection.send(Bert.encode(Bert.tuple(Bert.atom("hello"),Value))); // Notification that th EServer is online
};

var ProcCode; 

var emsg_handle = function(tuple) {
    var command = tuple[0];
    switch(command.value)
    {
    case 'new':
	constructE(tuple);
	break;
    case 'add':
	addComponent(tuple);
	break;
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
    case 'launch_processing':
        launchProcessing(tuple);
        break;
    case 'erl_form_result':
	deliverResult(tuple);
	break;
    default: 
	eClientStub(tuple);
    }
};

var sendEvent = function(Component,Event,Value)
{
    console.log("Sending: " + Value);
    connection.send(Bert.encode(Bert.tuple(Bert.atom('event'),
					   Bert.atom(Component),
					   Bert.atom(Event),
					   Value)));
}; 

var addComponent = function(tuple){
    var Parent = windows[tuple[1].value];
    var Child = object_cache[tuple[2].value];
    Parent.add(Child);
    Parent.doLayout();
    Child.setWidth(Parent.lastSize.width);
    Child.setHeight(Parent.lastSize.height);
};
    

var constructE = function(tuple) {
    var Type = tuple[2].value;
    switch(Type)
    {
    case 'textarea':
	constructTextArea(tuple);
        break;
    default:
	alert("Invalid type argument to new: " + Type)
    }
};

var deliverResult = function(tuple) {
    var ID = tuple[1].value;
    var Result = tuple[2];
    object_cache[ID].eDeliver(object_cache[ID],Result);
};

var constructTextArea = function(tuple) {
    var ID = tuple[1].value;
    TextArea = new Ext.form.TextArea({eid: ID, 
				      value: ">",
				      linestart: 1,
				      lineend: 1,
				      readOnly: false,
				      eDeliver : function(textarea, result) {
					  textarea.setValue( textarea.getValue() + result +"\n>" );
					  textarea.linestart = textarea.getValue().length;
					  textarea.lineend = textarea.linestart;
					  textarea.setReadOnly(false);
				      },
				      enableKeyEvents: true,listeners: {
					  'keyup': function(textarea, event) { 
					      switch( event.getKey() )
					      {
					      case event.ENTER:
						  if( textarea.readOnly == false) {
						  Buffer = textarea.getValue();
						  Value = Buffer.slice(textarea.linestart,textarea.lineend);
						  console.log("Sending: " + Value);
						  sendEvent(textarea.eid,'erl_form',Value);

						  textarea.linestart = textarea.linestart + 1;
						  textarea.lineend = textarea.linestart + 1;
						  textarea.setReadOnly(true);
						  };
						  break;
					      default:
						  textarea.lineend = textarea.lineend + 1;
					      }
					  } }});
    console.log("New TextArea: " + ID);
    object_cache[ID] = TextArea;
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
    console.log("New Window: " + ID);
    windows[ID] = new E.Window;
    windows[ID].doLayout();
    windows[ID].show();
};

var windowAddImage = function(tuple) {
    var WindowID = tuple[1].value;
    var ImageID = tuple[2].value;
    var ImageWidth = tuple[3];
    var ImageHeight = tuple[4];
    var Data = tuple[5].value;

    console.log("Window add image: " + WindowID );

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

function launchProcessing(tuple)
{
    var Width = tuple[1];
    var Height = tuple[2];
    var FuncName = tuple[3];

    //console.log( "launchProcessing" , FuncName );

    canvasWindow = new Ext.Window({
	title: FuncName
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
			var processingInstance = new Processing(canvasWindow.items.items[0].el.dom, window[FuncName]);
			processingInstance.size(Width,Height);

		    }
		}
	    }
	}
    });
    canvasWindow.show();
};
	
var m_data;

connection.onmessage = function(msg) {
    var blob = msg.data;
    var Message;
    var reader = new FileReader();
    reader.onloadend = function() {
        var string = reader.result;
	console.log(string);
	m_data = string;
	Message = Bert.decode(string);
	console.log(Message.toString());
	var tuple = Message.value;
	console.log(tuple[2].toString());
	emsg_handle(tuple);
    };
    reader.readAsBinaryString(blob );
};

