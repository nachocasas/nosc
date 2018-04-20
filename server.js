const fs = require('fs');
var websocket = require('websocket-stream')
var wss = websocket.createServer({ port: 9000, perMessageDeflate: false }, handle)
 
function handle(stream, request) {
    console.log("Handling");
    console.log(request);
    
  // `request` is the upgrade request sent by the client.
    fs.createReadStream('./wav/1.wav').pipe(stream);
}

function handleInput(tone, stream){

    const filePath = path.resolve(__dirname, 'wav', `${tone}.wav`);
    const file = fs.createReadStream(filePath);
    file.pipe(stream);
    file.on('end', () => {
        file.unpipe(stream);
    });
}