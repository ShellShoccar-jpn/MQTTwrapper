#!/bin/sh -u

######################################################################
#
# MQTT_VIA_HTTP_DOWN.CGI: Realtime Server-Push Web I/F without WebSocket
#
# See also for the Server-Sent Event protocol:
# https://developer.mozilla.org/ja/docs/Web/API/Server-sent_events/Using_server-sent_events
#
# Written by @colrichie on 2025-09-15
#
######################################################################


# ===== Init =========================================================
http_exit() {
  cat <<-HTTP_RES
	Status: ${1:-}
	Content-Type: text/plain
	
	${1:-}
	(${2:-})
	HTTP_RES
  exit 0
}

type mosquitto_sub >/dev/null 2>&1 || {
  http_exit '500 Internal Server Error' 'mosquitto_sub does not exist'
}

# ===== Get CGI parameters ===========================================

[ "${REQUEST_METHOD:-}" = 'POST' ] && [ ${CONTENT_LENGTH:-0} -gt 1024 ] && {
  http_exit '400 Bad Request' 'Content-Length is too big'
}

cgivars=$(case "${REQUEST_METHOD:-GET}" in                                    #
            POST) dd bs=1 count=${CONTENT_LENGTH:-0} 2>/dev/null             ;;
            *)    printf '%s\n' "${QUERY_STRING:-}"                          ;;
          esac                                                                |
          tr '&' '\n'                                                         |
          awk -v OFS="" -v ORS="" '                                           #
            BEGIN {                                                           #
              for (i=0; i<256; i++) {                                         #
                c=sprintf("%c",i); x=sprintf("%02x",i); X=toupper(x);         #
                t[x]=c; t[X]=c;                                               #
              }                                                               #
              t["%00"]=""; t["%0a"]=" "; t["%0A"]=" ";                        #
              while (getline line) {                                          #
                if (! match(line,/^[^=]+=/)) {continue;}                      #
                print substr(line,1,RLENGTH); line=substr(line,RLENGTH+1);    #
                gsub(/\+/, " ", line);                                        #
                while (length(line)) {                                        #
                  if (match(line,/%[0-9A-Fa-f][0-9A-Fa-f]/)) {                #
                    print substr(line,1,RSTART-1),t[substr(line,RSTART+1,2)]; #
                    line = substr(line,RSTART+RLENGTH);                       #
                  } else {                                                    #
                    print line;                                               #
                    break;                                                    #
                  }                                                           #
                }                                                             #
                print "\n";                                                   #
              }                                                               #
            }'                                                                )
topic=$(printf '%s\n' "$cgivars" | sed -nr '/^topic=/{s/^.{6}//;p;}' )
host=$( printf '%s\n' "$cgivars" | sed -nr  '/^host=/{s/^.{5}//;p;}' |
        tr -cd '0-9A-Za-z.:-'                                        )
port=$( printf '%s\n' "$cgivars" | sed -nr  '/^port=/{s/^.{5}//;p;}' |
        tr -cd '0-9'                                                 )
host=${host:-localhost}
port=${port:-1883}

[ -n "$topic" ] || {
  http_exit '400 Bad Request' 'MQTT topic is not specified'":$REQUEST_METHOD@$QUERY_STRING"
}
[ "$port" -ge 1024 ] || [ "$port" -le 65535 ] || {
  http_exit '400 Bad Request' 'MQTT port number is not applicable'
}


# ===== Start SSE and MQTT subscription ==============================

cat <<-HTTP_HEADER
	X-Accel-Buffering: no
	Content-Type: text/event-stream
	Cache-Control: no-cache
	
	HTTP_HEADER

case $(awk -W interactive 'BEGIN{print}' 2>&1 >/dev/null) in
  '') alias awk='awk -W interactive';;
esac
if ! mosquitto_sub -h "$host" -p "$port" -t "$topic"; then                #
  echo 'data: {"status":1,"text":"mosquitto_sub does not work normally"}' #
  exit 0                                                                  #
fi                                                                        |
awk -v OFS="" -v ORS="" '                                                 #
  BEGIN {                                                                 #
    for (i=0; i<32; i++) {e[sprintf("%c",i)]=sprintf("\\u%04X",i);}       #
    e["\\"]="\\\\"; e["\""]="\\\""; e["/" ]="\\/" ; e["\b"]="\\b" ;       #
    e["\f"]="\\f" ; e["\r"]="\\r" ; e["\t"]="\\t" ;                       #
    while (getline line) {                                                #
      while (length(line)) {                                              #
        if (match(line,/[\x01-\x1F"\\\/]/)) {                             #
          print substr(line,1,RSTART-1),e[substr(line,RSTART,1)];         #
          line = substr(line,RSTART+1);                                   #
        } else {                                                          #
          print line;                                                     #
          break;                                                          #
        }                                                                 #
      }                                                                   #
      print "\n"; fflush();                                               #
    }                                                                     #
  }'                                                                      |
while IFS= read -r line; do                                               #
  printf 'data: {"status":0,"text":"%s"}\n\n' "$line" || break            #
done                                                                      &

mypid=$$
MQ_PID=$(ps -Ao ppid,pid,comm                                            |
         awk -v mypid=$mypid '                                           #
           BEGIN {                                                       #
             i=0                                                         #
             split("",parent,""); split("",candidate,"");                #
             while (getline line) {                                      #
               sub(/^[[:blank:]]+/,"",line);                             #
               if(!match(line,/^[0-9]+[[:blank:]]+[0-9]+[[:blank:]]+/)){ #
                 continue;                                               #
               }                                                         #
               args=substr(line,RLENGTH+1);                              #
               s=substr(line,1,RLENGTH);sub(/[[:blank:]]+$/,s);          #
               match(line,/[[:blank:]]+/);                               #
               pid =substr(s,RSTART+RLENGTH         )+0;                 #
               ppid=substr(s,1             ,RSTART-1)+0;                 #
               if(pid!=ppid){parent[pid]=ppid;}                          #
               if(index(args,"mosquitto_sub")){i++;candidate[i]=pid;}    #
             }                                                           #
             for (i in candidate) {                                      #
               i=candidate[i];                                           #
               j=i;                                                      #
               while (j in parent) {                                     #
                 if (j==mypid) {print i; exit;}                          #
                 j=parent[j];                                            #
               }                                                         #
             }                                                           #
           }'                                                            )


# ===== Keep-Alive ===================================================

{                                      #
  while :; do                          #
   printf ': keepalive\n\n' || exit 1  #
   sleep 10 || exit 1                  #
 done                                  #
}                                      &
KA_PID=$!

# ===== Watchdog =====================================================

while :; do
  if ! kill -0 "$MQ_PID" 2>/dev/null; then
    kill "$KA_PID"       2>/dev/null
    wait "$KA_PID"       2>/dev/null
    break
  fi
  if ! kill -0 "$KA_PID" 2>/dev/null; then
    kill "$MQ_PID"       2>/dev/null
    wait "$MQ_PID"       2>/dev/null
    break
  fi
  sleep 1
done

exit 0
