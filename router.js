const net = require('net');
const express = require('express');
const app = express();
const http = require('http').createServer(app).listen(5002, function () {
    console.log('Web socket server running at 5002 port!!')
});
const io = require('socket.io').listen(http);

let clients = new Array();

setTimeout(function () {
    io.sockets.on('connection', function (socket) {
        console.log('   --- Web socket connection!! ---');
        socket.emit('connected', 123);
    });
});

const tcpServer = net.createServer(function (client) {
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
                let sensorBooth = {code: 'median', device: 'booth', value: msg.smoke};
                writeData(clients['process'], JSON.stringify(sensorBooth));

                let boothSend = {trash: msg.trash, lat: msg.lat, lon: msg.lon};
                io.sockets.emit('gps', JSON.stringify(boothSend));
                break;

            case 'kiosk' :
                let sensorKiosk = {code: 'median', device: 'kiosk', value: msg.smoke};
                writeData(clients['process'], JSON.stringify(sensorKiosk));
                break;

            case 'register':
                clients[msg.service] = client;
                console.log(msg.service + ' 서비스 등록 성공');
                let register = {code: 'register', response: 'successful'};
                writeData(clients[msg.service], JSON.stringify(register));
                break;

            case 'median':
                if (msg.device === 'booth') {
                    io.sockets.emit('booth', msg.value); 
                } else {
					io.sockets.emit('kiosk', msg.value); 
                }
                break;

			case 'login':
				console.log(msg);
				writeData(clients['process'], JSON.stringify(msg)); 
				break; 

			case 'result': 
				console.log(msg); 
				writeData(clients['service'], JSON.stringify(msg)); 
				break; 

			case 'sign': 
				console.log(msg); 
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
        tcpServer.getConnections(function (err, count) {
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

tcpServer.listen(5001, function () {
    console.log('Server listening: ' + JSON.stringify(tcpServer.address()));
    tcpServer.on('close', function () {
        console.log('Server Terminated');
    });
    tcpServer.on('error', function (err) {
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
