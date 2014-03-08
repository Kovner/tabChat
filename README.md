[TabChat](http://tabchat.tabcmd.com) is a web application I built using the SocketIO module for NodeJS in conjunction with Tableau's JavaScript API. It allows multiple people to log in to the same view, chat about it, and see each other's interactions. [Check it out](http://tabchat.tabcmd.com).

[Here's my blog post on the basics of that integration](http://tabcmd.com/tabchat-socketio-javascript-api/)

##SocketIO + JavaScript API

At its heart TabChat is a demo of integrating SocketIO with Tableau's JavaScript API. Here's a simple example of integrating SocketIO's event-based nature with Tableau's event listeners.

Client:
```
viz.addEventListener('marksselection', function(event) {
    event.getMarksAsync().then(function(marks) {
        socket.emit('clientMarks', marks);
    });
});

socket.on('serverMarks', function(marks) {
    viz.getWorkbook().getActiveSheet().selectMarksAsync(marks);
});
```
Server:
```
socket.on('clientMarks', function(marks) {
    io.sockets.emit('serverMarks', marks);
});
```
When a user selects marks, it sends a message to the server and passes the array of marks that were selected. The server responds by sending those marks to all of the clients, and each of the clients then use the JS API to select those same marks on their screen.

## Notes

* selectMarksAsync() doesn't actually work as shown above. SocketIO converts the tableauSoftware.Mark objects into plain JSON. See the code for the hack to convert them back.
* There's a lot more going on with TabChat than the above example. For instance, instead of the clients instantly selecting the marks that are sent to them, instead we get a message that another client selected marks. That message has a link that causes the marks to be selected. To see the actual implementation details, see the code.







