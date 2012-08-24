-module(econnect).

-compile([export_all]).

-include("../include/e.hrl").

start(_Servername,IPAddress,Port) -> 
    code:add_patha(?YAWS_EBIN_DIRS),
    file:make_dir(?YAWS_LOG_DIR),
    error_logger:info_msg("Starting Embedded Yaws!~n"),
    GL = [{logdir,?YAWS_LOG_DIR},
	  {ebin_dir, ?YAWS_EBIN_DIRS}],
    SL = [{doc_root,?YAWS_DOC_ROOT},
	  {port,Port},
	  {listen,?YAWS_LOCAL_PORT}],
    yaws:start_embedded(?YAWS_DOC_ROOT,SL,GL),
    self().

stop(_Servername,IPAddress,Port,Docroot) -> 
    error_logger:info_msg("Stopping Embedded Yaws!~n"),
    GL = [{logdir,?YAWS_LOG_DIR},
	  {ebin_dir, ?YAWS_EBIN_DIRS},
	  {id, ?YAWS_ID}],
    SL = [{doc_root,?YAWS_DOC_ROOT},
	  {port,Port},
	  {listen,IPAddress}],
    yaws:stop_embedded(Docroot,SL,GL).

handle_message({text, <<"ES_ONLINE">>}) ->
    Pid = self(),
    register(eserver,self()),
    error_logger:info_msg("EServer Registered as {eserver,~p}~n",[Pid]);
handle_message({close,_Num,_Bin}) ->
    unregister(eserver),
    error_logger:info_msg("EServer Disconnected and Unregistered~n");
handle_message({text,B})->
    <<_H,T/binary>> = B,
    Term = binary_to_term(T),
    error_logger:info_msg("Binary Received:~n~p~n",[B]),
    error_logger:info_msg("Term Received:~n~p~n",[Term]),
    error_logger:info_msg("My Pid = ~p~n",[self()]);
handle_message(A)->
    error_logger:info_msg("Received:~n~p~n",[A]),
    error_logger:info_msg("My Pid = ~p~n",[self()]),
    {reply, {text, <<"Pong">>}}.

send(ID,Message) when is_atom(ID) ->
    Pid = whereis(ID),
    send(Pid,Message);
send(Pid,Message) when is_pid(Pid) ->
    Term = term_to_binary(Message),
    Payload = <<?BERT_VERSION,Term/binary>>,
    yaws_api:websocket_send(Pid, {binary, Term}).

