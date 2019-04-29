const SerialPort = require('serialport')
const StreamSocket2Eevent = require('socketstream2event') ;
const Signal = require('signals')

/**
 * Conecta na porta COM do Windows
 * A ideia seria para conectar na porta COM com Arduino
 * O Arduino por padrão envia na porta com os pinos separados por virgula, ex: 1,0.2323,3 
 * E faz isso via socket de bytes separado por pulo de linha (char 10) 
 */
function WindowsComPortCommunication(){
  let me = this ;
  let avaiblePorts = new Map();
  let portConnections = new Map() ;
  let onDataSignals = new Map() ;
  let arrayPorts = [] ;
  let connected = false ;
  this.showLog = false ;
  function getSignalToPort( port ){
    if(!onDataSignals.has(port)){
      onDataSignals.set(port, new Signal()) ;
    }
    return onDataSignals.get(port) ;
  }
  this.addOnData = (portName, method)=>{
    getSignalToPort(portName).add( method ) ;
    getPortConnection(portName) ;
  }
  /**
   * OnReady Event called when it is ready to send message
   */
  this.onReady = new Signal() ; 
  if(callBackOnReady){
    me.onReady.add(callBackOnReady) ;
  }
  this.connect = ()=>{
      if(connected){
          return;
      }
      avaiblePorts.clear() ;
      SerialPort.list(function (err, ports) {
        if(me.showLog) console.log('######################################');
        if(me.showLog) console.log('Avaible Ports:')
        ports.forEach(function(port) {
          avaiblePorts.set(port.comName, port.pnpId);
          arrayPorts.push(port.comName) ;
          if(me.showLog) console.log(port.comName, "\t\t" , port.pnpId);
        });
        if(me.showLog) console.log('######################################');
        me.onReady.dispatch() ;
        connected = true;
    });
  }
  function dispatchTo( portName, data ){
    getSignalToPort(portName).dispatch( data ) ;
  }
  function getPortConnection(portName){
    if(!portConnections.has(portName)){
      let p = new SerialPort(portName) ;
      let parser = new StreamSocket2Eevent( 10 ) ;
      parser.addOnData((data)=>{
        dispatchTo(portName, data );
      }) ;
      p.on('data', (data)=>{
        parser.parseData(data) ;
      }) ;
      portConnections.set(portName, p )
    }
    return portConnections.get(portName) ;
  }
  /**
   * Returns Avaible ports
   * Remember: Windows 
   */
  this.getAvaiblePorts = ()=>{
    return arrayPorts ; 
  }
  this.write = (portName, value)=>{
    if(!avaiblePorts.has(portName)){
      throw new Error( "There is no port with name "+ portName ) ;
    }
    let portConnection = getPortConnection(portName);
    portConnection.write(value) ;
  }
}

module.exports = WindowsComPortCommunication ;