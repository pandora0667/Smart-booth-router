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
                console.log('booth sensor data input'); 	
				writeData(clients['process'], str); 
                break;

            case 'kiosk' :
                console.log('kiosk sensor data input');
				writeData(clients['process'], str); 
                break;

            case 'register':
				clients[msg.service] = client; 
                console.log(msg.service  + ' 서비스 등록 성공');
				let register = {code: 'register', response: 'successful'}; 
                writeData(clients[msg.service], JSON.stringify(register)); 
                break;

            default:
                console.log("error");
                let error = {code: '10', title: 'undefined', message: 'undefined'};
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
