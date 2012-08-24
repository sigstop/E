-module(elib).
-include("../include/e.hrl").
-compile([export_all]).

create_window(ID,Height,Width,Title ) when is_atom(ID),
					   is_list(Title)->
    econnect:send(eserver,{create_window,ID,float(Height),float(Width),Title}).

