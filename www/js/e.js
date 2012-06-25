
var connection = new WebSocket("ws://localhost:28080/eport.yaws");
// connection.send('CONNECT'); // Send the message 'Ping' to the server
connection.onopen = function () {
  connection.send('ES_ONLINE'); // Notification that the XServer is online
};
connection.onmessage = function(e) {
    switch(e.data)
    { 
    case 'Alert':
        alert("This is an Alert");
	break;
    case 'CreateWindow':
        Ext.namespace('E');
	E.Window = 
	    Ext.extend(Ext.Window, {
		title: 'E Window',
		width:400,
		height:300,
		autoscroll:true		
	    });
	var win = new E.Window;
	win.show();
	break;
    default:
	alert(e.data + " is not a valid emessage.");
    }
    console.log(e.data); 
};