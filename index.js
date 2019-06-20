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
  let portInterval = new Map();
  let portMessagePool = new Map();
  let portConnectionsInfo = [] ;
  let arrayPorts = [] ;
  let initialized = false ;
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
    console.log('set config');
    if( !config.hasOwnProperty('delay') ){
      config.delay = 1000;
    }
    if( config.delay > 0 ){
      clearInterval(portInterval.get( port));
      var interval = setInterval((a)=>{
        console.log(new Date());
        sendNextMessage(a);
        
      }, config.delay ,port);
      portInterval.set( port, interval );
    }

    delete config.delay;
    configToPort.set(port, config);
  }
  /**
   * OnReady Event called when it is ready to send message
   */
  this.onReady = new Signal() ; 
  
  this.connect = ( comName) => {
    getPortConnection(comName);
  }

  this.init = ()=>{
      if(initialized){
          return;
      }
      initialized = true;
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
          if(me.showLog) console.log(port.comName, "\t\t" , port.pnpId);
        });
        if(me.showLog) console.log('######################################');
        me.onReady.dispatch() ;
    });
  }
  this.restart = ()=>{
      initialized = false ;
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
      p.on('error', function(err) {
        console.log('Error: ', err.message)
      })
      
    }
    return portConnections.get(portName) ;
  }
  
  function appendMessage( portName, message){
    var list = [];
    if( portMessagePool.has(portName) ){
      list = portMessagePool.get(portName)
    }
    list.push(message);
    portMessagePool.set(portName, list);
  }

  function getNextMessage( portName ){
    if( !portMessagePool.has(portName) ){
      return null;
    }

    var list = portMessagePool.get(portName);

    var message = list.shift();
    if( message == undefined){
      portMessagePool.delete(portName);
      return null;
    }
    return message;
  }

  function sendNextMessage( portName ){
    var message = getNextMessage( portName );
    if( message == null ){
      return;
    }
    let portConnection = getPortConnection(portName);
    console.log(message);
    portConnection.write( message );
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
    console.log('write');
    if( portInterval.has(portName) ){
      appendMessage( portName, value);
      return;
    }
    
    let portConnection = getPortConnection(portName);
    portConnection.write(value);
    
  }
}

module.exports = WindowsComPortCommunication ;