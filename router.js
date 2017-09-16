'use strict';

const net = require('net');
const express = require('express');
const app = express();
const http = require('http').createServer(app).listen(5002, function () {
    console.log('Web socket server running at 5002 port!!');
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
    let count = 0;

    client.on('data', function (data) {
        // data parsing
        let msg = null;
        try {
            let re = /\0/g;
            let str = data.toString().replace(re, "");
            msg = JSON.parse(str);
        } catch (exception) {
            console.log('오류 발생');
        }

        switch (msg.code) {
            case 'booth':
                let sensorBooth = {code: 'median', device: 'booth', value: msg.smoke};
                if (clients['process'])
                    writeData(clients['process'], JSON.stringify(sensorBooth));

                let gpsSend = {lat: msg.lat, lon: msg.lon};
                io.sockets.emit('gps', JSON.stringify(gpsSend));
                io.sockets.emit('trash', msg.trash);
                break;

            case 'kiosk' :
                let sensorKiosk = {code: 'median', device: 'kiosk', value: msg.smoke};
                if (clients['process'])
                    writeData(clients['process'], JSON.stringify(sensorKiosk));
                break;

            case 'register':
                clients[msg.service] = client;
                console.log(msg.service + ' 서비스 등록 성공');
                let register = {code: 'register', response: 'successful'};
                if (clients[msg.service])
                    writeData(clients[msg.service], JSON.stringify(register));
                break;

            case 'median':

                if (msg.device === 'booth')
                    io.sockets.emit('booth', msg.value);
                else {
                    io.sockets.emit('media', msg.value);
                    io.sockets.emit('kiosk', msg.value);
                }

                break;

            case 'login':
                console.log(msg);
                if (clients['process'])
                    writeData(clients['process'], JSON.stringify(msg));
                break;

            case 'result':
                console.log(msg);
                if (clients['service'])
                    writeData(clients['service'], JSON.stringify(msg));
                break;

            case 'sign':
                console.log(msg);
                if (clients['process'])
                    writeData(clients['process'], JSON.stringify(msg));
                break;

            default:
                console.log("error");
                console.log(msg);
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
