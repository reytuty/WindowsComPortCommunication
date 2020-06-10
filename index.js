const SerialPort = require('serialport')
const StreamSocket2Eevent = require('socketstream2event') ;
const Signal = require('signals')

/**
 * Conecta na porta COM do Windows
 * A ideia seria para conectar na porta COM com Arduino
 * O Arduino por padrão envia na porta com os pinos separados por virgula, ex: 1,0.2323,3 
 * E faz isso via socket de bytes separado por pulo de linha (char 10) 
 */
function WindowsComPortCommunication( p_portsToConnect = [] ){
  let me = this ;
  let avaiblePorts        = new Map();
  let portConnections     = new Map() ;
  let parsersPort         = new Map() ;
  let onDataSignals       = new Map() ;
  let portConnectionsInfo = [] ;
  let portsToConnect  = p_portsToConnect ? p_portsToConnect : [] ;
  let connectedPorts      = new Map() ;
  let connected       = false ;
  this.showLog        = false ;
  /**
   * {totalPorts:me.totalPorts, totalConnected:me.totalPortsConnection, ports:portConnectionsInfo}
   */
  this.onConnect  = new Signal() ;
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
  this.isReady = false ;
  this.addPortConnection = (portName)=>{
    portsToConnect.push(portName) ;
    if(avaiblePorts.has(portName)){
      return getPortConnection(portName) ;
    }
    return false ;
  }
  function connectToAvaiblePorts(){
    avaiblePorts.forEach((pnpId, path)=>{
      if(portsToConnect.indexOf( path ) >= 0){
        getPortConnection( path );
      }
    }) ;
  }
  this.connect = ()=>{
      if(connected){
          return;
      }
      if(!me.isReady){
        me.onReady.addOnce(()=>{
          me.connect();
        }) ;
        return ;
      }
      connected = true;
      connectToAvaiblePorts();
  }
  this.reconnect = ()=>{
      connected = false ;
      me.connect() ;
  }
  function dispatchTo( portName, data ){
    getSignalToPort(portName).dispatch( data ) ;
  }
  function getPortConnection(p_portName, forceConnect = true){
    let portName = p_portName ;
    if(!portConnections.has(portName) && forceConnect){
      let portConfig = configToPort.get( portName ) ;
      let p = new SerialPort(portName, portConfig ) ;
      p.isConnected = false ;
      portConnections.set(portName, p )
      
      let parser = new StreamSocket2Eevent( 10 ) ;
      parsersPort.set(portName, parser) ;
      
      parser.addOnData((data)=>{
        dispatchTo(portName, data );
      }) ;
      p.on("close", ()=>{
        if( connectedPorts.has(portName) ){
          connectedPorts.delete(portName) ;
        }
      })
      p.on("open", ()=>{
        connectedPorts.set(portName, p) ;
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
    return Array.from( avaiblePorts.keys() ) ; 
  }
  this.write = (portName, value)=>{
    if(!avaiblePorts.has(portName)){
      throw new Error( "There is no port with name "+ portName ) ;
    }
    let portConnection = getPortConnection(portName, false);
    if(!portConnection){
      throw new Error( "The port with name "+ portName +" is not connected. Put this port on the list to connect") ;
    }
    if(!portConnection.isConnected){
      console.log(portName, "message probably not set because port is disconnected. Message:", value)
    }
    portConnection.write(value) ;
  }
  this.init = ()=>{
    me.connect() ;
  }
  SerialPort.list().then((ports) =>{
    if(me.showLog) console.log('######################################');
    if(me.showLog) console.log('Avaible Ports:');
    me.totalPorts = ports.length ;
    ports.forEach(function(port) {
      avaiblePorts.set(port.path, port.pnpId) ;
      //criando a conexão imediatamente com todas as portas
      if(me.showLog) console.log(port.path, "\t\t" , port.pnpId);
    });
    if(me.showLog) console.log('######################################');
    me.isReady = true ;
    me.onReady.dispatch() ;
  }).catch((e)=>{
    console.log(e) ;
  });
}

module.exports = WindowsComPortCommunication ;