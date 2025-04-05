const jwt = require('jsonwebtoken');
const {
  pushTheCommentToProduct,
  editComment,
  deleteComment,
  getCommentById,
  toggleLikeComment,
  toggleDislikeComment,
  toggleLoveComment,
} = require('../Models/products.model');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token; // Expect token from client
    if (!token) {
      return next(new Error('Authentication required'));
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) {
        return next(new Error('Invalid or expired token'));
      }
      socket.user = decoded; // Attach user data
      next();
    });
  });

  io.on('connection', socket => {
    console.log('New socket connection. User:', socket.user);

    if (socket.user?.id) {
      const userRoom = socket.user.id.toString();
      socket.join(userRoom);
      console.log(`Socket joined user room: ${userRoom}`);
    }

    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Socket joined room: ${roomId}`);
    });

    socket.on('newComment', async (data) => {
      try {
        const userId = socket.user?.id;
        if (!userId) {
          return socket.emit('commentError', 'Authentication required');
        }
        const { productId } = data;
        const { text, parentId, rating } = data.comment;
        const newComment = await pushTheCommentToProduct(productId, userId, text, parentId, rating);
        io.to(productId).emit('receiveComment', { productId, comment: newComment });
      } catch (error) {
        console.error('Error handling newComment:', error);
        socket.emit('commentError', error.message);
      }
    });

    socket.on('editComment', async (data) => {
      try {
        const userId = socket.user?.id;
        if (!userId) {
          return socket.emit('commentError', 'Authentication required');
        }
        const updatedComment = await editComment(
          data.productId,
          data.commentId,
          userId,
          data.newText,
          socket.user?.isAdmin
        );
        io.to(data.productId).emit('commentEdited', {
          productId: data.productId,
          commentId: data.commentId,
          newText: data.newText,
          edited: true
        });
      } catch (error) {
        console.error('Error editing comment:', error);
        socket.emit('commentError', error.message);
      }
    });

    socket.on('deleteComment', async (data) => {
      try {
        const userId = socket.user?.id;
        if (!userId) {
          return socket.emit('commentError', 'Authentication required');
        }
        await deleteComment(
          data.productId,
          data.commentId,
          userId,
          socket.user?.isAdmin
        );
        io.to(data.productId).emit('commentDeleted', {
          productId: data.productId,
          commentId: data.commentId
        });
      } catch (error) {
        console.error('Error deleting comment:', error);
        socket.emit('commentError', error.message);
      }
    });

    socket.on('toggleLikeComment', async (data) => {
      try {
        const { productId, commentId } = data;
        const userId = socket.user?.id;
        if (!userId) {
          return socket.emit('commentError', 'Authentication required');
        }
        const updatedComment = await toggleLikeComment(productId, commentId, userId);
        io.to(productId).emit('commentReactionUpdated', {
          productId,
          commentId,
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes,
          loves: updatedComment.loves
        });
        socket.emit('userReactionUpdated', {
          productId,
          commentId,
          userReaction: updatedComment.likers.includes(userId) ? 'like' : null
        });
      } catch (error) {
        console.error('Error handling toggleLikeComment:', error);
        socket.emit('commentError', error.message);
      }
    });

    socket.on('toggleDislikeComment', async (data) => {
      try {
        const { productId, commentId } = data;
        const userId = socket.user?.id;
        if (!userId) {
          return socket.emit('commentError', 'Authentication required');
        }
        const updatedComment = await toggleDislikeComment(productId, commentId, userId);
        io.to(productId).emit('commentReactionUpdated', {
          productId,
          commentId,
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes,
          loves: updatedComment.loves
        });
        socket.emit('userReactionUpdated', {
          productId,
          commentId,
          userReaction: updatedComment.dislikers.includes(userId) ? 'dislike' : null
        });
      } catch (error) {
        console.error('Error handling toggleDislikeComment:', error);
        socket.emit('commentError', error.message);
      }
    });

    socket.on('toggleLoveComment', async (data) => {
      try {
        const { productId, commentId } = data;
        const userId = socket.user?.id;
        if (!userId) {
          return socket.emit('commentError', 'Authentication required');
        }
        const updatedComment = await toggleLoveComment(productId, commentId, userId);
        io.to(productId).emit('commentReactionUpdated', {
          productId,
          commentId,
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes,
          loves: updatedComment.loves
        });
        socket.emit('userReactionUpdated', {
          productId,
          commentId,
          userReaction: updatedComment.lovers.includes(userId) ? 'love' : null
        });
      } catch (error) {
        console.error('Error handling toggleLoveComment:', error);
        socket.emit('commentError', error.message);
      }
    });
  });
};