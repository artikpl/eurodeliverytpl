const socket  = io(':3000/');
$(document).ready(function () {
    socket.on("connect", () => {
        console.log('poloczono2', socket.id); // ojIckSD2jqNzOqIrAGzL
    });
    socket.on('hello',function(a,b,c){
        console.log('xx',a,b,c);
    });
});