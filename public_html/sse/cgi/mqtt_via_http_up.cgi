#!/bin/sh -u

######################################################################
#
# MQTT_VIA_HTTP_UP.CGI: Realtime Client-Push Web I/F without WebSocket
#
# See also for the Server-Sent Event protocol:
#
# Written by @colrichie on 2025-09-16
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

type mosquitto_pub >/dev/null 2>&1 || {
  http_exit '500 Internal Server Error' 'mosquitto_pub does not exist'
}

# ===== Get CGI parameters ===========================================

[ "${REQUEST_METHOD:-}" = 'POST' ] && [ ${CONTENT_LENGTH:-0} -gt 1048576 ] && {
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
              t["00"]=""; t["0a"]=sprintf("%c",127); t["0A"]=t["0a"];         #
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
  http_exit '400 Bad Request' 'MQTT topic is not specified'
}
[ "$port" -ge 1024 ] || [ "$port" -le 65535 ] || {
  http_exit '400 Bad Request' 'MQTT port number is not applicable'
}

# ===== Publish the text to a MQTT broker ============================

cat <<-HTTP_HEADER
	Content-Type: application/json; charset=UTF-8
	
	HTTP_HEADER

errmsg=$(printf '%s\n'"$cgivars"                                |
         sed -nr  '/^text=/{s/^.{5}//;p;}'                      |
         tr '\177' '\n'                                         |
         mosquitto_pub -l -h "$host" -p "$port" -t "$topic" 2>&1)
ret=$?

case $ret in
  0) echo '{"status":0, "text":"success"}'                  ;;
  *) printf '%s\n' "$errmsg"                                 |
     tr '"\t\r\\' "'   "                                     |
     awk -v ret=$ret '                                       #
       BEGIN{                                                #
         getline line;                                       #
         printf("{\"status\":%d,\"text\":\"%s\"}",ret,line); #
       }'                                                   ;;
esac

# ===== Release resources ============================================

exit $ret
