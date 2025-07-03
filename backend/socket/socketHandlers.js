function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-board', (data) => {
      // TODO: Handle user joining board
      console.log('join-board', data);
    });

    socket.on('task-update', (data) => {
      // TODO: Handle real-time task update
      console.log('task-update', data);
    });

    socket.on('task-create', (data) => {
      // TODO: Handle real-time task creation
      console.log('task-create', data);
    });

    socket.on('task-delete', (data) => {
      // TODO: Handle real-time task deletion
      console.log('task-delete', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = { setupSocket }; 