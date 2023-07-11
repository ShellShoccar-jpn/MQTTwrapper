//////////////////////////////////////////////////////////////////////
//
// MQTTwrapper.js - A Redundant MQTT JavaScript Library Wrapper
//                  with MQTT.js and Paho
//
// Written by Shell-Shoccar Japan (@shellshoccarjpn) / USP-NCNT prj.
//         on 2023-05-19
//
// ===================================================================
//
// WHAT IS THIS:
//   This library is to make the MQTT libraries "MQTT.js" and "Paho"
//   more robust. If you use this library instead of them, your program
//   can get longer life than the two libraries because this library
//   works as a wrapper choosing available one of them. If one of them
//   gets unavailable, this wrapper loads the other one.
//
// HOW TO USE:
//  1) Load the MQTT libraries you want to wrap and this file on your
//     HTML file using the <script> tags,
//     like this:
//       -----
//       <script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
//       <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js"></script>
//       <script src="MQTTwrapper.js"></script>
//       -----
//     THE <script> TAG OF THIS FILE MUST BE LATER THAN THE MQTT LIBRARY
//     TAGS!!! Otherwise, this file will fail to wrap them.
//
//     If you want to specify the location URL of those libraries,
//     specify the alternative URLs with the <script> "src" properties.
//       -----
//       <script src="./js/mqtt.min.js"></script>
//       <script src="./js/mqttws31.min.js"></script>
//       <script src="MQTTwrapper.js"></script>
//       -----
//     If you want to specify the order to try to wrap the MQTT libraries,
//     you can write the order inside the script tag of the wrapper,
//     like the following JSON:
//       -----
//       <script src="./js/mqtt.min.js"></script>
//       <script src="./js/mqttws31.min.js"></script>
//       <script src="MQTTwrapper.js">
//         { "order" : [ "Paho", "MQTT.js" ] }
//       </script>
//       -----
//     The current names you can specify are only "MQTT.js" and "Paho."
//     Be careful of typos in those spells. (Case sensitive)
//     When not specified, the current default order is 1."MQTT.js" 2."Paho."
//
//  2) Use the "MQTTwrapper" class in your JavaScript. Here is an example.
//       -----
//       client = new MQTTwrapper('ws://broker.mqttdashboard.com:8000/mqtt');
//       if (client) {
//         client.connect({
//           "cbConnected"   :
//             function(){console.log('Connected'                       );
//                        client.subscribe('testtopic/#'                );
//                        client.publish('testtopic/ch1','Hello, world!');},
//           "cbDisconnected":
//             function(){console.log('Discnnected normally'            );},
//           "cbKilled"      :
//             function(){console.log('Discnnected abnomally'           );},
//           "cbFailed"      :
//             function(){console.log('Failed to connect'               );},
//           "will"          : {"topic"  :"testtopic/ch1"                ,
//                              "message":"Disconnected by some trouble." }
//         });
//         client.setReceiverCallback(
//           function(message,topic){console.log(topic+':'+message);}
//         );
//       } else {
//         console.error('Cannot create an instance');
//       }
//       -----
//     See the reference section for detail.
//
// REFERENCE ("MQTTwrapper" Class):
//  * <Property,static> sLibname
//      Usage : str = MQTTerapper.sLibname;
//              - str ........ String variable to know which library
//                             is wrapped.
//      Return: At this version, this property returns one of the following
//              names.
//              - "MQTT.js" .. When this class wraps the MQTT.js.
//              - "Paho" ..... When this class wraps the Eclipse Paho.
//      Desc. : You can know which library is wrapped this time by
//              reading this property. But note that we may change the
//              word or spell of the name in the future. So the behavior
//              of your program should not strictly depend on the strict
//              spell.
//              This property is a readonly one.
//  * <Function> constructor()
//      Usage : obj = new MQTTwrapper(url, [id]);
//              - obj ... Variable to stock an object instance.
//              - url ... URL to connect the MQTT broker.
//                        (It must support "MQTT over WebSocket")
//              - id .... MQTT Client ID. You can omit this, and we
//                        recommend doing so. In that case, this wrapper
//                        generates an ID randomly. to do so. In that
//                        case, this wrapper generates the ID.
//      Desc. : You have to call this at first. However, the constructor
//              does not connect to the broker yet. The "connect()" method
//              is to connect to it.
//  * <Function> connect()
//      Usage : obj.connect([opt])
//              - opt .. Option parameter object. You can contain the
//                       following properties.
//                       (1) Callback functions
//                         [cbConnected]   : Callback function that is called
//                                           when connected successfully.
//                         [cbDisconnected]: Callback function that is called
//                                           when dicconnected normally. When
//                                           you do not omit the "onKilled,"
//                                           this value will be copied to it.
//                         [cbKilled]      : Callback function that is called
//                                           when dicconnected unintentionally.
//                                           In case you need to reconnect,
//                                           you can use this callback as a
//                                           trigger.
//                                           If you do not give me a valid
//                                           value, the value of the
//                                           "onDisconnected" will be copied.
//                         [cbFailed]      : Callback function that is called
//                                           when failed to connect to the
//                                           broker. This function accept one
//                                           argument.
//                                             1. (string type) To get the error
//                                                message
//                       (2) "Will message" parameters (optional)
//                         [will].topic    : Topic name (string type) for
//                                           the will message. (Mandatory when
//                                           you set the "will" property)
//                         [will].message  : Message body (string type)
//                                           for the will message. (Mandatory
//                                           when you set the "will" property)
//                         [will].[qos]    : MQTT QoS for the will message.
//                                           (You can omit this)
//                         [will].[retain] : MQTT Retain flag for the will
//                                           message. (You can omit this)
//      Return: Nothing.
//      Desc. : This method will try to establish the connection when you
//              call. And these callback functions will start being called
//              when the connection is established, closed, or failed.
//  * <Function> dicconnect()
//      Usage : obj.disconnect();
//              - obj ............. Variable stocking the object instance.
//      Return: Nothing.
//      Desc. : This method is to close the connection. And the
//              "onDisconnected" callback function you registered by the
//              "connect()" method may be called soon if the connection
//              is alive and it has been closed.
//              It is meaningless to call this method when you had not
//              called the "connect()" method, but also harmless.
//  * <Function> setReceiverCallback()
//      Usage : ret = obj.setReceiverCallback([cbReceived]);
//              - ret ......... Boolean variable to receive success or
//                              failure.
//              - obj ......... Variable stocking the object instance.
//              - cbReceived .. Callback function that is called when
//                              a message string has arrived.
//                              This function accepts three arguments.
//                                1. (string type) To get the message body.
//                                2. (string type) To get the topic name.
//                                3. (object type) To get other info.
//                                   This object has the following
//                                   properties.
//                                     qos    : (number type) MQTT QoS
//                                              parameter. (0,1,2)
//                                     retain : (boolean type) MQTT retain
//                                              flag. (true/false)
//                                     payloadBytes :
//                                              (Uint8Array type) The
//                                              message body. It means
//                                              the same data as the first
//                                              argument but with a
//                                              different data type.
//                                   Other properties are also visible,
//                                   but you must not depend on them.
//                                   They are only for debugging.
//      Return: Returns true when this method registers/unregisters the
//              callback function successfully. Or returns false when
//              something wrong happens.
//      Desc. : This method is to register the callback function that is
//              called when a subscribing message arrives. You can get both
//              the message body and the topic name with the function.
//              Therefore, you should call this method before calling the
//              "subscribe()" method.
//              If no function is registered, the arrived messages will
//              be purged.
//              The function will be unregistered when you call this method
//              with no argument or null value.
//  * <Function> subcscribe()
//      Usage : ret = obj.subcscribe(topic, [opt]);
//              - ret .... Boolean variable to receive whether success
//                         or failure.
//              - obj .... Variable stocking the object instance.
//              - topic .. Topic name (string type) to subscribe.
//              - opt ...... Option parameter object. You can contain the
//                           following properties.
//                             [qos]    : MQTT QoS. (Number type, 0, 1,
//                                        or 2. Default is 0)
//      Return: Returns true when this method can call the wrapping
//              "subscribe()" method. (However, it does not mean that
//              it succeeded in getting the acknowledgment for the request)
//              The cases in this method return false are:
//              - When the connection is not established.
//              - When the "topic" is omitted.
//              - When the "topic" is neither a string nor a number.
//              - When the "topic" is empty.
//      Desc. : Start subscribing to the MQTT topic. And the callback
//              function registerd by the "setReceiverCallback()" method
//              will start being called.
//              If no callback function is registered by the
//              "setReceiverCallback()" method, the arrived messages will
//              be purged.
//              Be careful that it will probably be failed to call this
//              method just after calling the "connect()" method because
//              the connection is not established yet.
//  * <Function> unsubcscribe()
//      Usage : ret = obj.subcscribe(topic);
//              - ret .... Boolean variable to receive whether success
//                         or failure.
//              - obj .... Variable stocking the object instance.
//              - topic .. Topic name (string type) to subscribe.
//      Return: Returns true when this method can call the wrapping
//              "unsubscribe()" method. (However, it does not mean that
//              it succeeded in getting the acknowledgment for the request)
//              The cases this method returns false are:
//              - When the connection is not established.
//              - When the "topic" is omitted.
//              - When the "topic" is neither a string nor a number.
//              - When the "topic" is empty.
//      Desc. : Finish subscribing to the MQTT topic. And the callback
//              function registerd by the "setReceiverCallback()" method
//              will finish being called.
//              You have to specify the same topic as when you set it
//              by calling the "subscribe()" method. Otherwise, maybe
//              you cannot stop the subscribing.
//  * <Function> publish()
//      Usage : ret = obj.publish(topic, message, opt);
//              - ret ...... Boolean variable to receive whether success
//                           or failure.
//              - obj ...... Variable stocking the object instance.
//              - topic .... (string type) Topic name to publish.
//              - message .. (number or string or Uint8Array type)
//                           Message body to publish.
//              - opt ...... Option parameter object. You can contain the
//                           following properties.
//                             [qos]    : (Number type) MQTT QoS. (0, 1,
//                                        or 2. Default is 0)
//                             [retain] : (Boolean type) MQTT Retain flag.
//                                        (true or false. Default is false)
//      Return: Returns true when this method can call the wrapping
//              "publish()" method. (However, it does not mean that it
//              succeeded in getting the acknowledgment for the request)
//              The cases this method returns false are:
//              - When the connection is not established.
//              - When the "topic" is omitted.
//              - When the "topic" is neither a string nor a number.
//              - When the "topic" is empty.
//              - When the "message" is omitted.
//              - When the "message" is neither a string nor a number.
//      Desc. : Publish a message to the topic channel specified the
//              "topic" argument.
//              Be careful that it will probably be failed to call this
//              method just after calling the "connect()" method because
//              the connection is not established yet.
//  * <Property> bConnected
//      Usage : status = obj.bConnected;
//              - status ..... Boolean variable to know now is connected
//                             or not.
//              - obj ........ Variable stocking the object instance
//      Return: True when the connection is established and alive.
//              False when not in the case.
//      Desc. : You can get the current status the connection to the
//              broker is alive or not by reading the property.
//              This property MUST BE a readonly one. So you MUST NOT
//              write the new status into it.
//
// LICENSE:
//   This is a public-domain software (CC0). It means that all of the
//   people can use this for any purposes with no restrictions at all.
//   By the way, We are fed up with the side effects which are brought
//   about by the major licenses.
//
//////////////////////////////////////////////////////////////////////

var MQTTwrapper = null;
(() => {
  'use strict';
  let e,le,l,i,o;

  le=document.querySelectorAll('script');
  e =le[le.length-1];
  try{o=Function('"use strict";return (' + e.innerHTML + ')')();}catch(o){;}
  if ((typeof o === 'object') && ('order' in o) && Array.isArray(o.order)) {
    l = o.order;
  } else                                                                   {
    l = ['MQTT.js', 'Paho'];
  }

  for (i=0; i<l.length; i++) {
    if (typeof l[i] !== 'string') {continue;}
    if (l[i] === 'MQTT.js') {
      if (typeof mqtt !== 'function') {continue;}
      MQTTwrapper = Set_MQTTjs_wrapper_class();
      console.log('MQTTwrapper: MQTT.js is wrapped');
      return true;
    }
    if (l[i] === 'Paho'   ) {
      if (typeof Paho !== 'object'  ) {continue;}
      MQTTwrapper = Set_Paho_wrapper_class();
      console.log('MQTTwrapper: Paho is wrapped');
      return true;
    }
  }

  MQTTwrapper = class MQTTwrapper {static sLibname = '';};
  console.log('MQTTwrapper: No class is wrapped!');
  return false;

  function Set_MQTTjs_wrapper_class() {
    // Wrapper class definition for MQTT.js
    // https://github.com/mqttjs/MQTT.js#api (reference manual)
    return class MQTTwrapper {
      static sLibname = 'MQTT.js';
      constructor(sUrl, sClientId) {
        sUrl      = (typeof sUrl      === 'string') ? sUrl      : ''                                                 ;
        sClientId = (typeof sClientId === 'string') ? sClientId : 'mqttjs_' + Math.random().toString(16).substr(2, 8);
        if (typeof sUrl !== 'string') {return null;}
        this.sUrl       = sUrl     ;
        this.sClientId  = sClientId;
        this.bConnected = false    ;
        this.oClient    = null     ;
        this.bShutting  = false    ;
      }
      connect(oOpt) {
        let that             = this;
        let oU8e             = new TextDecoder("utf-8");
        let o                = new Object();
        oOpt                 = (typeof oOpt === 'object') ? oOpt : new Object();
        this.fCBconnected    = (('cbConnected'    in oOpt) && (typeof oOpt.cbConnected    === 'function')) ? oOpt.cbConnected    : null;
        this.fCBdisconnected = (('cbDisconnected' in oOpt) && (typeof oOpt.cbDisconnected === 'function')) ? oOpt.cbDisconnected : null;
        this.fCBkilled       = (('cbKilled'       in oOpt) && (typeof oOpt.cbKilled       === 'function')) ? oOpt.cbKilled       : null;
        this.fCBerror        = (('cbFailed'       in oOpt) && (typeof oOpt.cbFailed       === 'function')) ? oOpt.cbFailed       : null;
        this.bShutting       = false;
        this.fCBreceiver     = null;
        o['reconnectPeriod'] = 0;               // Disable reconnection for compatibility with other libraries
        o['clientId'       ] = this.sClientId;
        if ('will' in oOpt) {
          if ((!('topic'   in oOpt.will))||(typeof oOpt.will.topic   !== 'string')) {
            throw new Error('MQTTwrapper: MQTT.js: Will message data has no topic name.');
          }
          if ((!('message' in oOpt.will))||(typeof oOpt.will.message !== 'string')) {
            throw new Error('MQTTwrapper: MQTT.js: Will message data has no message.'   );
          }
          o['will'] = new Object();
          o.will['topic'  ] = oOpt.will.topic;
          o.will['payload'] = oOpt.will.message;
          o.will['qos'    ] = (('qos'    in oOpt.will) && (typeof oOpt.will.qos    === 'number' )) ? oOpt.will.qos    : 0    ;
          o.will['retain' ] = (('retain' in oOpt.will) && (typeof oOpt.will.retain === 'boolean')) ? oOpt.will.retain : false;
        }
        //
        try {
          this.oClient = mqtt.connect(this.sUrl,o);
            
        } catch (o) {
          that.bShutting = false;
          console.error('MQTTwrapper: MQTT.js: connection error: '+o.message);
          if (typeof that.fCBerror !== 'function') {return;}
          that.fCBerror((('code' in o)?o.code:-1).toString()+': '+o.message);
          return;
        }
        if (! this.oClient) { console.error('MQTTwrapper: MQTT.js: Failed to connect'); return; };
        //
        this.oClient.on('connect', (oConnack) => {
          if (typeof oConnack === 'undefined') {return;}
          console.log('MQTTwrapper: MQTT.js: connected');
          that.bConnected = true ;
          if (typeof that.fCBconnected !== 'function') {return false;}
          return that.fCBconnected();
        });
        //
        this.oClient.on('close', () => {
          that.bConnected = false;
          if (that.bShutting) {
            that.bShutting  = false;
            console.log('MQTTwrapper: MQTT.js: dicconnected normally');
            if (typeof that.fCBdisconnected !== 'function') {return false;}
            return that.fCBdisconnected();
          } else              {
            console.log('MQTTwrapper: MQTT.js: dicconnected unintentionally');
            if (typeof that.fCBkilled       !== 'function') {return false;}
            return that.fCBkilled();
          }
        });
        //
        this.oClient.on('error', (error) => {
          if (typeof error === 'undefined') {return;}
          that.bShutting = false;
          console.log('MQTTwrapper: MQTT.js: connection error: '+e.message);
          if (typeof that.fCBerror !== 'function') {return false;}
          return that.fCBerror(error+'');
        });
        //
        this.oClient.on('message', (sTopic, oMessage, oPacket) => {
          if (typeof oPacket === 'undefined') {return;}
          if (typeof that.fCBreceiver !== 'function') {return false;}
          oPacket['payloadBytes']=oMessage;
          return that.fCBreceiver(oU8e.decode(oMessage),sTopic,oPacket);
        });
      }
      disconnect() {
        if (! this.oClient) {return;}
        this.bShutting = true;
        this.oClient.end();
      }
      publish(sTopic,Message,oOpt) {
        oOpt = (typeof oOpt === 'object') ? oOpt : new Object();
        if (! this.oClient              ) {return false;}
        if (! this.bConnected           ) {return false;}
        sTopic   = (typeof sTopic   === 'number') ?   sTopic.toString() : sTopic  ;
        if (typeof sTopic   !== 'string') {return false;}
        if (sTopic          === ''      ) {return false;}
        Message = (typeof Message === 'number') ? Message.toString() : Message;
        if (typeof Message === 'undefined') {return false;}
        this.oClient.publish(sTopic,Message,oOpt);
        return true;
      }
      setReceiverCallback(fCB) {
        if      (fCB        === null       ) {this.fCBreceiver = null; return true ;}
        else if (typeof fCB === 'undefined') {this.fCBreceiver = null; return true ;}
        else if (typeof fCB === 'function' ) {this.fCBreceiver = fCB ; return true ;}
        else                                 {                         return false;}
      }
      subscribe(sTopic, oOpt) {
        oOpt = (typeof oOpt === 'object') ? oOpt : new Object();
        if (! this.oClient            ) {return false;}
        if (! this.bConnected         ) {return false;}
        sTopic   = (typeof sTopic   === 'number') ?   sTopic.toString() : sTopic  ;
        if (typeof sTopic !== 'string') {return false;}
        if (sTopic === ''             ) {return false;}
        this.oClient.subscribe(sTopic, oOpt);
        return true;
      }
      unsubscribe(sTopic) {
        if (! this.oClient            ) {return false;}
        if (! this.bConnected         ) {return false;}
        sTopic   = (typeof sTopic   === 'number') ?   sTopic.toString() : sTopic  ;
        if (typeof sTopic !== 'string') {return false;}
        if (sTopic === ''             ) {return false;}
        this.oClient.unsubscribe(sTopic);
        return true;
      }
    };
  }

  function Set_Paho_wrapper_class() {
    // Wrapper class definition for Paho MQTT Client
    // https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Client.html (reference manual)
    // https://www.eclipse.org/paho/index.php?page=clients/js/index.php (offical example)
    // https://lipoyang.hatenablog.com/entry/2019/03/05/110524 (example)
    return class MQTTwrapper {
      static sLibname = 'Paho';
      constructor(sUrl, sClientId) {
        let bSecure, sId, sPasswd, sHost, iPort, sPath, oU8e, s, s1, that;
        //
        sUrl      = (typeof sUrl      === 'string') ? sUrl      : ''                                   ;
        sClientId = (typeof sClientId === 'string') ? sClientId : 'web_'+parseInt(Math.random()*100,10);
        oU8e    = new TextDecoder("utf-8");
        //
        bSecure = (sUrl.match(/^wss:/)) ? true : false;
        s       = sUrl.replace(/^wss?:\/\//,'').replace(/\/.*$/,'');
        s1      = s.replace(/^.*:([0-9]+)$/,'$1');
        iPort   = (s1.match(/^[0-9]+$/)) ? s1*1 : (bSecure) ? 443 : 80;
        s       = s.replace(/:[0-9]+$/,'');
        sHost   = s.replace(/^.*@/,'');
        s       = s.replace(/@[^@]+$/,'');
        s       = (s===sHost) ? '' : s;
        sId     = s.replace(/:.*$/,'');
        sPasswd = s.substr(sId.length+1);
        s       = sUrl.replace(/^wss?:\/\/[^\/]+/,'');
        sPath   = (s!=='') ? s : '/';
        //
        this.oPaho = new Paho.MQTT.Client(sHost, iPort, sPath, sClientId);
        if (! this.oPaho) {return null;}
        this.bSecure                = bSecure;
        this.sId                    = sId    ;
        this.sPasswd                = sPasswd;
        this.fCBreceiver            = null   ;
        this.bConnected             = false  ;
        this.bShutting              = false  ;
        this.fCBconnected           = null   ;
        that                        = this   ;
        this.fSucessHook            = function(){
                                        console.log('MQTTwrapper: Paho: connected');
                                        that.bConnected = true;
                                        if (typeof that.fCBconnected !== 'function') {return false;}
                                        return that.fCBconnected();
                                     };
        this.fCBdisconnected        = null;
        this.oPaho.onConnectionLost = function(){
                                        that.bConnected = false;
                                        if (that.bShutting) {
                                          that.bShutting  = false;
                                          if (typeof that.fCBdisconnected !== 'function') {return false;}
                                          console.log('MQTTwrapper: Paho: disconnected normally');
                                          return that.fCBdisconnected();
                                        } else              {
                                          console.log('MQTTwrapper: Paho: disconnected unintentionally');
                                          if (typeof that.fCBkilled       !== 'function') {return false;}
                                          return that.fCBdisconnected();
                                        }
                                     };
        this.fCBerror               = null;
        this.fErrorHook             = function(o){
                                        console.error('MQTTwrapper: Paho: connection error: '+o.errorCode+': '+o.errorMessage);
                                        that.bConnected = false;
                                        if (typeof that.fCBerror !== 'function') {return false;}
                                        return that.fCBerror(o.errorCode+': '+o.errorMessage);
                                     };
        this.oPaho.onMessageArrived = function(oMessage){
                                        if (typeof that.fCBreceiver !== 'function') {return false;}
                                        // Note:
                                        //   You should read the "payloadBytes"
                                        //   (ArrayBuffer-type) instead of the
                                        //   "payloadString" (String-type) and
                                        //   convert it into String-type data.
                                        //   When some bunches of binary data
                                        //   that is not valid as UTF-8 byte
                                        //   string arrive, and you read it with
                                        //   the payloadString, the Paho library
                                        //   suspends the processing.
                                        //   That behavior is unfavorable for
                                        //   this class.
                                        if ('retained' in oMessage) {oMessage['retain']=oMessage.retained;}
                                        return that.fCBreceiver(oU8e.decode(oMessage.payloadBytes),
                                                                oMessage.destinationName          ,
                                                                oMessage                           );
                                      };
      }
      connect(oOpt) {
        let o                = new Object();
        oOpt                 = (typeof oOpt === 'object') ? oOpt : new Object();
        this.fCBconnected    = (('cbConnected'    in oOpt) && (typeof oOpt.cbConnected    === 'function')) ? oOpt.cbConnected    : null;
        this.fCBdisconnected = (('cbDisconnected' in oOpt) && (typeof oOpt.cbDisconnected === 'function')) ? oOpt.cbDisconnected : null;
        this.fCBkilled       = (('cbKilled'       in oOpt) && (typeof oOpt.cbKilled       === 'function')) ? oOpt.cbKilled       : null;
        this.fCBerror        = (('cbFailed'       in oOpt) && (typeof oOpt.cbFailed       === 'function')) ? oOpt.cbFailed       : null;
        this.bShutting       = false                                                                                                   ;
        o['useSSL'   ]       = this.bSecure                                                                                            ;
        o['userName' ]       = this.sId                                                                                                ;
        o['password' ]       = this.sPasswd                                                                                            ;
      //o['reconnect']       = true;        // Unsupported even though the API doc mentions it.
        o['onSuccess']       = this.fSucessHook                                                                                        ;
        o['onFailure']       = this.fErrorHook                                                                                         ;
        if ('will' in oOpt) {
          if ((!('topic'   in oOpt.will))||(typeof oOpt.will.topic   !== 'string')) {
            throw new Error('MQTTwrapper: Paho: Will message data has no topic name.');
          }
          if ((!('message' in oOpt.will))||(typeof oOpt.will.message !== 'string')) {
            throw new Error('MQTTwrapper: Paho: Will message data has no message.'   );
          }
          o['willMessage'] = new Paho.MQTT.Message(oOpt.will.message);
          o.willMessage['destinationName'] = oOpt.will.topic;
          o.willMessage['qos'            ] = (('qos'    in oOpt.will) && (typeof oOpt.will.qos    === 'number' )) ? oOpt.will.qos      : 0    ;
          o.willMessage['retained'       ] = (('retain' in oOpt.will) && (typeof oOpt.will.retain === 'boolean')) ? oOpt.will.retained : false;
        }
        //
        try {
          this.oPaho.connect(o);
        } catch (o) {
          this.fErrorHook({"errorCode":('code' in o)?o.code:-1,"errorMessage":o.message});
        }
      }
      disconnect() {
        this.bShutting = true;
        try      {this.oPaho.disconnect();} // This try-catch is to ensure
        catch(e) {                       ;} // calling this method is always
      }                                     // safe even when not connected.
      publish(sTopic,Message,oOpt) {
        oOpt = (typeof oOpt === 'object') ? oOpt : new Object();
        let iQos    = ("qos"    in oOpt) ? oOpt['qos'   ] : 0    ;
        let bRetain = ("retain" in oOpt) ? oOpt['retain'] : false;
        if (! this.bConnected           ) {return false;}
        sTopic   = (typeof sTopic   === 'number') ?   sTopic.toString() : sTopic  ;
        if (typeof sTopic   !== 'string') {return false;}
        if (sTopic          === ''      ) {return false;}
        Message = (typeof Message === 'number') ? Message.toString() : Message;
        if (typeof Message === 'undefined') {return false;}
        this.oPaho.send(sTopic,Message,iQos,bRetain);
        return true;
      }
      setReceiverCallback(fCB) {
        if      (fCB        === null       ) {this.fCBreceiver = null; return true ;}
        else if (typeof fCB === 'undefined') {this.fCBreceiver = null; return true ;}
        else if (typeof fCB === 'function' ) {this.fCBreceiver = fCB ; return true ;}
        else                                 {                         return false;}
      }
      subscribe(sTopic,oOpt) {
        oOpt = (typeof oOpt === 'object') ? oOpt : new Object();
        if (! this.bConnected         ) {return false;}
        sTopic   = (typeof sTopic   === 'number') ?   sTopic.toString() : sTopic  ;
        if (typeof sTopic !== 'string') {return false;}
        if (sTopic === ''             ) {return false;}
        this.oPaho.subscribe(sTopic, oOpt);
        return true;
      }
      unsubscribe(sTopic) {
        if (! this.bConnected         ) {return false;}
        sTopic   = (typeof sTopic   === 'number') ?   sTopic.toString() : sTopic  ;
        if (typeof sTopic !== 'string') {return false;}
        if (sTopic === ''             ) {return false;}
        this.oPaho.unsubscribe(sTopic);
        return true;
      }
    };
  }
})();
