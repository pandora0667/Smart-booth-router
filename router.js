const net = require('net');

let clients = new Array();

const server = net.createServer(function (client) {
    console.log('Client connection: ');
    console.log('   local = %s:%s', client.localAddress, client.localPort);
    console.log('   remote = %s:%s', client.remoteAddress, client.remotePort);
    client.setEncoding('utf8');

    client.on('data', function (data) {
     // data parsing
    let re = /\0/g;
	let str = data.toString().replace(re, "");
    let msg = JSON.parse(str);

	switch (msg.code) {
            case 'booth':
                //console.log('booth sensor data input');
				// process data send
				let sensorBooth = {code: 'median', device: 'booth', value: msg.smoke}; 
				writeData(clients['process'], JSON.stringify(sensorBooth)); 
				
				// homepage data send
				let undefinedSend = {code: 'undefined', trash: msg.trash, lat: msg.lat, lon: msg.lon};
                break;

            case 'kiosk' :
                //console.log('kiosk sensor data input');
				// process data send 
				let sensorKiosk = {code: 'median', device: 'kiosk', value: msg.smoke}; 
				writeData(clients['process'], JSON.stringify(sensorKiosk)); 
                break;

            case 'register':
				clients[msg.service] = client; 
                console.log(msg.service  + ' 서비스 등록 성공');
				let register = {code: 'register', response: 'successful'}; 
                writeData(clients[msg.service], JSON.stringify(register)); 
                break;
			
			case 'median': 
				if (msg.device === 'booth') {
					console.log('booth median  ' + msg.value); 
				} else {
					console.log('kiosk median  ' + msg.value);
				}
				break;

            default:
                console.log("error");
                let error = {code: 'error', title: 'undefined', message: 'undefined'};
                broadcastData(JSON.stringify(error));
                break;
        }
    });

client.on('end', function () {
        console.log('Client disconnected');
        clients.splice(this);
        server.getConnections(function (err, count) {
        console.log('Remaining Connections: ' + count);
        });
    });
    client.on('error', function (err) {
        console.log('Socket Error: ', JSON.stringify(err));
    });
    client.on('timeout', function () {
        console.log('Socket Timed out');
    });
});

server.listen(5001, function () {
    console.log('Server listening: ' + JSON.stringify(server.address()));
    server.on('close', function () {
        console.log('Server Terminated');
    });
    server.on('error', function (err) {
        console.log('Server Error: ', JSON.stringify(err));
    });
});

function writeData(socket, data) { // unicast send
    socket.write(data);
}

function broadcastData(data) {  // broadcast send
    clients.forEach(function (client) {
        client.write(data);
        console.log('connect client ->  ' + clients.length);
    });
}
