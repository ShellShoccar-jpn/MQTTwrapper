# MQTTwrapper

A Redundant MQTT JavaScript Library Wrapper with MQTT.js and Paho

## WHAT IS THIS

This library is to make the MQTT libraries ["MQTT.js"](https://github.com/mqttjs/MQTT.js) and ["Paho"](https://www.eclipse.org/paho/index.php?page=clients/js/index.php) more robust. If you use this library instead of them, your program can get longer life than the two libraries because this library works as a wrapper choosing available one of them. If one of them gets unavailable, this wrapper loads the other one.

## FIRST, TRY THE "Hello, world!" EXAMPLE

The best way to understand what the library is and how easy to use is to try the "Hello, world!" example first! Just after you have done "git clone" me, open the "./public_html/examples/helloworld.html" with a web browser. Then try each step written in the "How to Use Me" section on the HTML document.

## HOW TO USE THIS LIBRARY

Now that you know this library, we will tell you how to use this library in your web programs.

1. Load the MQTT libraries you want to wrap and this file on your HTML file using the <script> tags, like this:

```HTML:example1
<script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js"></script>
<script src="MQTTwrapper.js"></script>
```

(The place of the library file "MQTTwrapper.js" is written in the ["CONTENTS OF THIS PACKAGE"](#contents-of-this-package) section.)

**THE <script> TAG OF THIS FILE MUST BE LATER THAN THE MQTT LIBRARY TAGS!!!** Otherwise, this file will fail to wrap them.

If you want to specify the location URL of those libraries, specify the alternative URLs with the <script> "src" properties.

```HTML:example2
<script src="./js/mqtt.min.js"></script>
<script src="./js/mqttws31.min.js"></script>
<script src="MQTTwrapper.js"></script>
```

If you want to specify the order to try to wrap the MQTT libraries, you can write the order inside the script tag of the wrapper, like the following JSON:

```HTML:example3
<script src="./js/mqtt.min.js"></script>
<script src="./js/mqttws31.min.js"></script>
<script src="MQTTwrapper.js">
  { "order" : [ "Paho", "MQTT.js" ] }
</script>
```

The current names you can specify are only "MQTT.js" and "Paho." Be careful of typos in those spells. (Case sensitive) When not specified, the current default order is 1."MQTT.js" 2."Paho."

2. Use the "MQTTwrapper" class in your JavaScript. Here is an example.

```Javascript:example1
client = new MQTTwrapper('ws://broker.mqttdashboard.com:8000/mqtt');
if (client) {
  client.connect({
    "cbConnected"   :()=>{console.log('Connected'                       );
                          client.subscribe('testtopic/#'                );
                          client.publish('test/channel1','Hello, world!');},
    "cbDisconnected":()=>{console.log('Discnnected normally'            );},
    "cbKilled"      :()=>{console.log('Discnnected suddenly'            );},
    "cbFailed"      :()=>{console.log('Failed to connect'               );}
  });
  client.setReceiverCallback(
    function(message,topic){console.log(topic+':'+message);}
  );
} else {
  console.error('Cannot create an instance');
}
```

See the reference section for detail.

## CONTENTS OF THIS PACKAGE

This package contains the following files and directories.

```
./
|-- README.md .................. This file
|-- LICENSE .................... License information for this package
|
|-- public_html/ ............... Directory you may publish with a web browser
|   |                            - It contains the library file and example HTML files.
|   |                            - If you want to put this package on a web server,
|   |                              we recommend you publish only the files in this
|   |                              directory.
|   |                            - Of course, unnecessary to care about it if you
|   |                              put this package within your local computer.
|   |
|   |-- lib.js/ ................ Directory for library files
|   |   |
|   |   `-- MQTTwrapper.js ..... The "MQTTwrapper Class Library" file
|   |
|   `-- examples/ .............. Directory for examples to understand the library
|       |
|       |-- index.html ......... Just a Link HTML file for the following examples
|       |
|       |-- helloworld.html .... "Hello, world!" example (Try it first!)
|       |-- messageboard.html .. "Japanese Nostalgic Message Board" example (DOM operation)
|       |-- realtimechart.html . "Realtime Chart" example (using the Chart.js library)
|       |-- mapworm.html ....... "Map Worm" example (using the Leaflet library)
|       |-- whereareweat.html .. "Where are we at?" example (using Geo API and the Leaflet library)
|       |
|       `-- mqttbrokers.js ..... Public MQTT broker list; It is loaded by the above examples.
|
`-- sh_for_examples/ ........... Directory for shell scripts to help the above examples
    |
    |-- dummy_chart.sh ......... Dummy data generator for the "Realtime Chart" examples
    |
    |-- mapworm.sh ............. Sample coordinates publisher for the "Map Worm" examples
    `-- mapworm.data/ .......... Directory for sample coordinates files
```

## REFERENCE ("MQTTwrapper" Class)

```
* <Property,static> sLibname
    Usage : str = MQTTerapper.sLibname;
            - str ........ String variable to know which library
                           is wrapped.
    Return: At this version, this property returns one of the following
            names.
            - "MQTT.js" .. When this class wraps the MQTT.js.
            - "Paho" ..... When this class wraps the Eclipse Paho.
    Desc. : You can know which library is wrapped this time by
            reading this property. But note that we may change the
            word or spell of the name in the future. So the behavior
            of your program should not strictly depend on the strict
            spell.
            This property is a readonly one.
* <Function> constructor()
    Usage : obj = new MQTTwrapper(url, [id]);
            - obj ... Variable to stock an object instance.
            - url ... URL to connect the MQTT broker.
                      (It must support "MQTT over WebSocket")
            - id .... MQTT Client ID. You can omit this, and we
                      recommend doing so. In that case, this wrapper
                      generates an ID randomly. to do so. In that
                      case, this wrapper generates the ID.
    Desc. : You have to call this at first. However, the constructor
            does not connect to the broker yet. The "connect()" method
            is to connect to it.
* <Function> connect()
    Usage : obj.connect([opt])
            - opt .. Option parameter object. You can contain the
                     following properties.
                     (1) Callback functions
                       [cbConnected]   : Callback function that is called
                                         when connected successfully.
                       [cbDisconnected]: Callback function that is called
                                         when dicconnected normally. When
                                         you do not omit the "onKilled,"
                                         this value will be copied to it.
                       [cbKilled]      : Callback function that is called
                                         when dicconnected unintentionally.
                                         In case you need to reconnect,
                                         you can use this callback as a
                                         trigger.
                                         If you do not give me a valid
                                         value, the value of the
                                         "onDisconnected" will be copied.
                       [cbFailed]      : Callback function that is called
                                         when failed to connect to the
                                         broker. This function accept one
                                         argument.
                                           1. (string type) To get the error
                                              message
                     (2) "Will message" parameters (optional)
                       [will].topic    : Topic name (string type) for
                                         the will message. (Mandatory when
                                         you set the "will" property)
                       [will].message  : Message body (string type)
                                         for the will message. (Mandatory
                                         when you set the "will" property)
                       [will].[qos]    : MQTT QoS for the will message.
                                         (You can omit this)
                       [will].[retain] : MQTT Retain flag for the will
                                         message. (You can omit this)
    Return: Nothing.
    Desc. : This method will try to establish the connection when you
            call. And these callback functions will start being called
            when the connection is established, closed, or failed.
* <Function> dicconnect()
    Usage : obj.disconnect();
            - obj ............. Variable stocking the object instance.
    Return: Nothing.
    Desc. : This method is to close the connection. And the
            "onDisconnected" callback function you registered by the
            "connect()" method may be called soon if the connection
            is alive and it has been closed.
            It is meaningless to call this method when you had not
            called the "connect()" method, but also harmless.
* <Function> setReceiverCallback()
    Usage : ret = obj.setReceiverCallback([cbReceived]);
            - ret ......... Boolean variable to receive success or
                            failure.
            - obj ......... Variable stocking the object instance.
            - cbReceived .. Callback function that is called when
                            a message string has arrived.
                            This function accepts three arguments.
                              1. (string type) To get the message body.
                              2. (string type) To get the topic name.
                              3. (object type) To get other info.
                                 This object has the following
                                 properties.
                                   qos    : (number type) MQTT QoS
                                            parameter. (0,1,2)
                                   retain : (boolean type) MQTT retain
                                            flag. (true/false)
                                   payloadBytes :
                                            (Uint8Array type) The
                                            message body. It means
                                            the same data as the first
                                            argument but with a
                                            different data type.
                                 Other properties are also visible,
                                 but you must not depend on them.
                                 They are only for debugging.
    Return: Returns true when this method registers/unregisters the
            callback function successfully. Or returns false when
            something wrong happens.
    Desc. : This method is to register the callback function that is
            called when a subscribing message arrives. You can get both
            the message body and the topic name with the function.
            Therefore, you should call this method before calling the
            "subscribe()" method.
            If no function is registered, the arrived messages will
            be purged.
            The function will be unregistered when you call this method
            with no argument or null value.
* <Function> subcscribe()
    Usage : ret = obj.subcscribe(topic, [opt]);
            - ret .... Boolean variable to receive whether success
                       or failure.
            - obj .... Variable stocking the object instance.
            - topic .. Topic name (string type) to subscribe.
            - opt ...... Option parameter object. You can contain the
                         following properties.
                           [qos]    : MQTT QoS. (Number type, 0, 1,
                                      or 2. Default is 0)
    Return: Returns true when this method can call the wrapping
            "subscribe()" method. (However, it does not mean that
            it succeeded in getting the acknowledgment for the request)
            The cases in this method return false are:
            - When the connection is not established.
            - When the "topic" is omitted.
            - When the "topic" is neither a string nor a number.
            - When the "topic" is empty.
    Desc. : Start subscribing to the MQTT topic. And the callback
            function registerd by the "setReceiverCallback()" method
            will start being called.
            If no callback function is registered by the
            "setReceiverCallback()" method, the arrived messages will
            be purged.
            Be careful that it will probably be failed to call this
            method just after calling the "connect()" method because
            the connection is not established yet.
* <Function> unsubcscribe()
    Usage : ret = obj.subcscribe(topic);
            - ret .... Boolean variable to receive whether success
                       or failure.
            - obj .... Variable stocking the object instance.
            - topic .. Topic name (string type) to subscribe.
    Return: Returns true when this method can call the wrapping
            "unsubscribe()" method. (However, it does not mean that
            it succeeded in getting the acknowledgment for the request)
            The cases this method returns false are:
            - When the connection is not established.
            - When the "topic" is omitted.
            - When the "topic" is neither a string nor a number.
            - When the "topic" is empty.
    Desc. : Finish subscribing to the MQTT topic. And the callback
            function registerd by the "setReceiverCallback()" method
            will finish being called.
            You have to specify the same topic as when you set it
            by calling the "subscribe()" method. Otherwise, maybe
            you cannot stop the subscribing.
* <Function> publish()
    Usage : ret = obj.publish(topic, message, opt);
            - ret ...... Boolean variable to receive whether success
                         or failure.
            - obj ...... Variable stocking the object instance.
            - topic .... (string type) Topic name to publish.
            - message .. (number or string or Uint8Array type)
                         Message body to publish.
            - opt ...... Option parameter object. You can contain the
                         following properties.
                           [qos]    : (Number type) MQTT QoS. (0, 1,
                                      or 2. Default is 0)
                           [retain] : (Boolean type) MQTT Retain flag.
                                      (true or false. Default is false)
    Return: Returns true when this method can call the wrapping
            "publish()" method. (However, it does not mean that it
            succeeded in getting the acknowledgment for the request)
            The cases this method returns false are:
            - When the connection is not established.
            - When the "topic" is omitted.
            - When the "topic" is neither a string nor a number.
            - When the "topic" is empty.
            - When the "message" is omitted.
            - When the "message" is neither a string nor a number.
    Desc. : Publish a message to the topic channel specified the
            "topic" argument.
            Be careful that it will probably be failed to call this
            method just after calling the "connect()" method because
            the connection is not established yet.
* <Property> bConnected
    Usage : status = obj.bConnected;
            - status ..... Boolean variable to know now is connected
                           or not.
            - obj ........ Variable stocking the object instance
    Return: True when the connection is established and alive.
            False when not in the case.
    Desc. : You can get the current status the connection to the
            broker is alive or not by reading the property.
            This property MUST BE a readonly one. So you MUST NOT
            write the new status into it.
```

## LICENSE

This is a public-domain software (CC0). It means that all of the people can use this for any purposes with no restrictions at all. By the way, We are fed up with the side effects which are brought about by the major licenses.
