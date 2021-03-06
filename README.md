# WindowsComPortCommunication
Node js Library to read and write in windows port using socket. Good for Arduino projects.

## Install

```

npm install windows-com-port

```

## Inport

```

const WindowsComPort = require('windows-com-port') ;

```

## Connect

```

var comPort = new WindowsComPort(start) ;
let port = "COM1" ;

//Listener on Ready
comPort.onReady.add(()=>{
    //its ready, show avaible ports
    let ports = comPort.getAvaiblePorts() ;
    console.log("Avaible ports", ports) ;
}) ;
comPort.onConnected.add((info)=>{
    console.log(info) ;
    //info has:
    //{totalPorts, totalConnected, ports}
    info.totalPorts;
    info.tltalConnected;
    info.ports.forEach((portInfo)=>{
        //inf has: {port:string, connected:bool}
        console.log(portInfo);
    });
});
comPort.connect() ;

```

## READ 

```

//TO READ
comPort.addOnData(port, (data)=>{
    console.log("Recived data on port ("+port+"):", data) ;
}) ;

```

## WRITE

```

//TO WRITE
try{
    var message = "TEST,1,2,3" ;
    comPort.write(port, message) ;
    console.log("Message sent to port", port, message)
} catch(e){
    console.log("Error writing port", e)
}

```

## Complete example

```

const WindowsComPort     = require('./index') ;

var comPort = new WindowsComPort(start) ;
let port = "COM1" ;

//Listener on Ready
comPort.onReady.add(()=>{
    //its ready, show avaible ports
    let ports = comPort.getAvaiblePorts() ;
    console.log("Avaible ports", ports) ;
}) ;

comPort.connect() ;

//TO READ
comPort.addOnData(port, (data)=>{
    console.log("Recived data on port ("+port+"):", data) ;
}) ;

//TO WRITE
try{
    var message = "TEST,1,2,3" ;
    comPort.write(port, message) ;
    console.log("Message sent to port", port, message)
} catch(e){
    console.log("Error writing port", e)
}


```