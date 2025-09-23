#!/bin/sh

######################################################################
#
# MAPWORM.SH : Station Pointer for "examples/mapworm.html"
#
# Usage   : mapworm.sh [-t topicname] [-h hostname]
# Options : -h hostname ... Specify the hostname of the MQTT broker you
#                           want to use.
#                           Default is "localhost."
#           -t topicname .. Specify the MQTT topicname when you publish
#                           dummy data to the MQTT broker.
#                           Default is "hwexample/mapworm."
#
# * When you execute this program, it start working as a MQTT publisher
#   and location data for the "examples/mapworm.html."
# * The format of the dummy data is like that:
#     plot 35.681382 139.766084 東京 (Tokyo)
#     wait
#     erase all
#   + "plot" is a command for the mapworm.html to plot a pin on the chart.
#     - The following two values are the latitude and longitude of the
#       pin.
#     - The remain string is the name of the pin. You can contain any
#       space characters.
#   + "wait" is a command to do nothing. It is helpful to wait for a
#     while.
#   + "erase all" is a command to erase all pins pinned already.
# * This program outputs lines like the above every two seconds.
# * If you omit any options, this program assume that the MQTT broker works
#   on the localhost, and the MQTT topic name is "hwexample/mapworm."
#   However, you can change them with the "-h" and "-t" options.
#
#
# Written by Shell-Shoccar Japan (@shellshoccarjpn) on 2025-09-24
#
# This is a public-domain software (CC0). It means that all of the
# people can use this for any purposes with no restrictions at all.
# By the way, We are fed up with the side effects which are brought
# about by the major licenses.
#
######################################################################


######################################################################
# Initial Configuration
######################################################################

# === Initialize shell environment ===================================
set -u
umask 0022
export LC_ALL=C
export PATH="$(command -p getconf PATH 2>/dev/null)${PATH+:}${PATH-}"
case $PATH in :*) PATH=${PATH#?};; esac
export UNIX_STD=2003  # to make HP-UX conform to POSIX

# === Define the functions for printing usage and error message ======
print_usage_and_exit () {
  cat <<-USAGE 1>&2
	Usage   : ${0##*/} [-t topicname] [-h hostname]
	Options : -h hostname ... Specify the hostname of the MQTT broker you
	                          want to use.
	                          Default is "localhost."
	          -t topicname .. Specify the MQTT topicname when you publish
	                          dummy data to the MQTT broker.
	                          Default is "hwexample/chart."
	USAGE
	Version : 2023-07-23 01:09:56 JST
  exit 1
}
error_exit() {
  ${2+:} false && echo "${0##*/}: $2" 1>&2
  exit $1
}

# === Make sure of the existence of some depending commands ==========
if ! type mosquitto_pub >/dev/null 2>&1; then
  error_exit 1 '"mosquitto_pub" is not found. Install it before using me.'
fi


######################################################################
# Argument Parsing
######################################################################

# === Initialize parameters ==========================================
mqttbroker='localhost'
mqtttopic='mwexample/mapworm'

# === Read options ===================================================
while [ $# -gt 0 ]; do
  case "${1:-}" in
    -h) [ $# -ge 2 ] || print_usage_and_exit
        mqttbroker=$2
        shift; shift
        ;;
    -t) [ $# -ge 2 ] || print_usage_and_exit
        mqtttopic=$2
        shift; shift
        ;;
  esac
done

# === Validate them ==================================================
[ -n "$mqttbroker" ] || error_exit 1 'Invalid -h option'
[ -n "$mqtttopic"  ] || error_exit 1 'Invalid -t option'


######################################################################
# Main
######################################################################

Homedir="$(d=${0%/*}/; [ "_$d" = "_$0/" ] && d='./'; cd "$d"; pwd)"
progname=${0##*/}; progname=${progname%.*}
while :; do
  find "$Homedir/$progname.data" -type f |
  while IFS= read -r file; do
    cat "$file"
    cat <<-TRAILER
		wait
		wait
		wait
		wait
		wait
		erase all
		TRAILER
  done
done                                     |
while :; do                              #
  read line && echo "$line"              #
  sleep 2                                #
done                                     |
mosquitto_pub -l -t "$mqtttopic" -h "$mqttbroker"
