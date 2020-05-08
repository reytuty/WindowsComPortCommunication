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
  let parsersPort = new Map() ;
  let onDataSignals = new Map() ;
  let portConnectionsInfo = [] ;
  let arrayPorts = [] ;
  let connected = false ;
  this.showLog = false ;
  /**
   * {totalPorts:me.totalPorts, totalConnected:me.totalPortsConnection, ports:portConnectionsInfo}
   */
  this.onConnect = new Signal() ;
  this.totalPorts = 0;
  this.totalPortsConnection = 0 ;
  function getSignalToPort( port ){
    if(!onDataSignals.has(port)){
      onDataSignals.set(port, new Signal()) ;
    }
    return onDataSignals.get(port) ;
  }
  /**
   * retorna array de objetos com port e connected
   * [{port, connected},{port, connected},...]
   */
  this.getPortConnectionsInfo = ()=>{
    return portConnectionsInfo ;
  }
  function updateTotalConnection(){
    portConnectionsInfo = [] ;
    me.totalPortsConnection = 0;
    portConnections.forEach((value, key)=>{
      if(value && value.isConnected){
        me.totalPortsConnection++;
      }
      portConnectionsInfo.push({port:key, connected:value.isConnected});
    });
    me.onConnect.dispatch({totalPorts:me.totalPorts, totalConnected:me.totalPortsConnection, ports:portConnectionsInfo});
  }
  this.addOnData = (portName, method)=>{
    getSignalToPort(portName).add( method ) ;
  }
  var configToPort = new Map() ;
  this.setConfigToPort = (port, config)=>{
    configToPort.set(port, config);
  }
  /**
   * OnReady Event called when it is ready to send message
   */
  this.onReady = new Signal() ; 
  
  this.connect = ()=>{
      if(connected){
          return;
      }
      connected = true;
      avaiblePorts.clear() ;
      arrayPorts = [] ;
      SerialPort.list(function (err, ports) {
        if(me.showLog) console.log('######################################');
        if(me.showLog) console.log('Avaible Ports:');
        me.totalPorts = ports.length ;
        ports.forEach(function(port) {
          avaiblePorts.set(port.comName, port.pnpId) ;
          arrayPorts.push(port.comName) ;
          //criando a conexão imediatamente com todas as portas
          getPortConnection(port.comName);
          if(me.showLog) console.log(port.comName, "\t\t" , port.pnpId);
        });
        if(me.showLog) console.log('######################################');
        me.onReady.dispatch() ;
        
    });
  }
  this.reconnect = ()=>{
      connected = false ;
      me.connect() ;
  }
  function dispatchTo( portName, data ){
    getSignalToPort(portName).dispatch( data ) ;
  }
  function getPortConnection(portName){
    if(!portConnections.has(portName)){
      let portConfig = configToPort.get( portName ) ;
      let p = new SerialPort(portName, portConfig ) ;
      p.isConnected = false ;
      portConnections.set(portName, p )
      
      let parser = new StreamSocket2Eevent( 10 ) ;
      parsersPort.set(portName, parser) ;
      
      parser.addOnData((data)=>{
        dispatchTo(portName, data );
      }) ;
      p.on("open", ()=>{
        p.isConnected = true ;
        updateTotalConnection();
        p.on('data', (data)=>{
          parser.parseData(data) ;
        }) ;
      }) ;
      
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
  this.init = ()=>{
    me.connect() ;
  }
}

module.exports = WindowsComPortCommunication ;