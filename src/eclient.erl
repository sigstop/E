-module(eclient).
-export([start/0,
	 start/1,
	 start/4,
	 stop/0]).
-include("../include/e.hrl").
-compile([export_all]).

start()->
    start([]).

start(YawsConfOptions) when is_list(YawsConfOptions)->
    start(?E_DEFAULT_HOST,?E_DEFAULT_ADDRESS,?E_DEFAULT_PORT,YawsConfOptions).

start(Name,Address,Port,YawsConfOptions)->
    crypto:start(),
    {ok,ParsedAddress} = inet_parse:ipv4_address(Address),
    econnect:start(Name,ParsedAddress,Port,YawsConfOptions).


stop()->
    yaws:stop(),
    error_logger:info_msg("eclient: stopped~n").


