const WindowsComPort     = require('./index') ;

let port = "COM1" ;
port = "/dev/tty.Bluetooth-Incoming-Port" ; // <<< macos tests, for windows comment this line
var comPort = new WindowsComPort() ;
comPort.showLog = true ;
/*
Port name on macOS:

/dev/tty.Bluetooth-Incoming-Port
*/
// * opcional set config info to port
comPort.setConfigToPort(port, {
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false
} ) ;
comPort.addPortConnection(port) ;
//Listener on Ready
comPort.onReady.add(()=>{
    //its ready, show avaible ports
    let ports = comPort.getAvaiblePorts() ;
    console.log("Avaible ports", ports) ;
    let messageInt = 0 ;
    setInterval(()=>{
        try{
            var message = "TEST,1,2,"+messageInt++ ;
            comPort.write(port, message) ;
            console.log("Message sent to port", port, message)
        } catch(e){
            console.log("Error writing port", e)
        }
    }, 2000) ; 
}) ;

comPort.onConnect.add((info)=>{
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

//TO READ
comPort.addOnData(port, (data)=>{
    console.log("Recived data on port ("+port+"):", data) ;
}) ;

//TO WRITE
