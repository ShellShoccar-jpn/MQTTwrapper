#!/bin/sh

######################################################################
#
# DUMMY_CHART.SH : Dummy-data Publisher for "examples/chart.html"
#
# Usage   : dummy_chart.sh [-t topicname] [-h hostname]
# Options : -h hostname ... Specify the hostname of the MQTT broker you
#                           want to use.
#                           Default is "localhost."
#           -t topicname .. Specify the MQTT topicname when you publish
#                           dummy data to the MQTT broker.
#                           Default is "hwexample/chart."
#
# * When you execute this program, it start working as a MQTT publisher
#   and sending dummy data for the "examples/chart.html."
# * The format of the dummy data is like that:
#     plot 0.24 -5.51
#   + "plot" is a command for the chart.html to plot points on the chart.
#     - The following two values are the heights of the plots. This
#       program generetes the values in -1<y<+1 range every two seconds.
# * If you omit any options, this program assume that the MQTT broker works
#   on the localhost, and the MQTT topic name is "hwexample/chart."
#   However, you can change them with the "-h" and "-t" options.
#
#
# Written by Shell-Shoccar Japan (@shellshoccarjpn) on 2023-07-22
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
	Version : 2023-07-22 17:59:02 JST
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
mqtttopic='hwexample/chart'

# === Read options ===================================================
while [ $# -gt 0 ]; do
  case "${1:-}" in
    -h) [ $# -eq 0 ] && print_usage_and_exit
        mqttbroker=$2
        shift; shift
        ;;
    -t) [ $# -eq 0 ] && print_usage_and_exit
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

cat /dev/urandom                                                       |
od -A n -t u8                                                          |
awk 'BEGIN{OFMT="%.14g";a=2^64;                                     }  #
          {print "plot",int($1/a*2000)/1000-1,int($2/a*2000)/1000-1;}' |
while :; do                                                            #
  read line && echo "$line"                                            #
  sleep 2                                                              #
done                                                                   |
mosquitto_pub -l -t "$mqtttopic" -h "$mqttbroker"
