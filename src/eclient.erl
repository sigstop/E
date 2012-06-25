-module(eclient).
-export([start/0,
	 start/3,
	 stop/0]).
-include("../include/e.hrl").
-compile([export_all]).

start()->
    start(?E_DEFAULT_HOST,?E_DEFAULT_ADDRESS,?E_DEFAULT_PORT).

start(Name,Address,Port)->
    crypto:start(),
    {ok,ParsedAddress} = inet_parse:ipv4_address(Address),
    econnect:start(Name,ParsedAddress,Port,?YAWS_DOC_ROOT).


stop()->
    yaws:stop(),
    error_logger:info_msg("eclient: stopped~n").


