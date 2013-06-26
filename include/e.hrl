-define(E_DEFAULT_HOST,"localhost").
-define(E_DEFAULT_ADDRESS,"127.0.0.1").
-define(E_DEFAULT_PORT,28080).

-define(E_ROOT,"./lib/E").
-define(YAWS_EBIN_DIRS,[lists:append("?E_ROOT","/ebin")]).
-define(YAWS_DOC_ROOT,lists:append(?E_ROOT,"/www")).
-define(YAWS_LOG_DIR,lists:append(?E_ROOT,"/log")).
-define(YAWS_ID,"elib").
-define(YAWS_LOCAL_PORT,{0,0,0,0}).

-define(BERT_VERSION,194).
