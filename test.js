const WindowComPort     = require('./index') ;

var comPort = new WindowComPort(start) ;
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