-module(elib).
-include("../include/e.hrl").
-compile([export_all]).

create_window(ID,Width,Height,Title ) when is_atom(ID),
					   is_list(Title)->
    econnect:send(eserver,{create_window,ID,float(Width),float(Height),Title}).

new(ID,Type,Options) when is_atom(ID),
			  is_atom(Type),
			  is_list(Options)->
    case Type of
	textarea ->
	    econnect:send(eserver,{new,ID,Type});
	_ -> io:format("error")
    end.

add(Parent,Child) when is_atom(Parent),
		       is_atom(Child)->
    econnect:send(eserver,{add,Parent,Child}).

send(MessageType, Component, Value ) when is_atom(MessageType),
					  is_atom(Component)->
    econnect:send(eserver,{MessageType,Component,Value}).
					  

window_add_image(WindowID,ImageID,ImageWidth,ImageHeight,ImageData) when is_atom(WindowID),
									 is_atom(ImageID),
									 is_binary(ImageData)->
    econnect:send(eserver,{window_add_image,WindowID,
			   ImageID,float(ImageWidth),float(ImageHeight),ImageData}).

window_update_image(WindowID,ImageID,ImageData) when is_atom(WindowID),
						     is_atom(ImageID),
						     is_binary(ImageData)->
    econnect:send(eserver,{window_update_image,WindowID,ImageID,ImageData}).

launch_eclock(Width,Height)->
    econnect:send(eserver,{launch_eclock,float(Width),float(Height)}).


launch_processing(Width,Height,Name)->
    econnect:send(eserver,{launch_processing,float(Width),float(Height),Name}).

