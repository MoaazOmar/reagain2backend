const {
  pushTheCommentToProduct,
  editComment,
  deleteComment,
  getCommentById,
  toggleLikeComment,
  toggleDislikeComment,
  toggleLoveComment,
  
} = require('../Models/products.model');
const sharedSession = require('express-socket.io-session');

module.exports = (io, sessionMiddleware) => {
  io.use(sharedSession(sessionMiddleware, { autoSave: true }));

  io.on('connection', socket => {
      console.log('New socket connection. Session data:', socket.handshake.session);

      if (socket.handshake.session.user?.id) {
          const userRoom = socket.handshake.session.user.id.toString();
          socket.join(userRoom);
          console.log(`Socket joined user room: ${userRoom}`);
      } else {
          console.warn('No authenticated user found in session on connection.');
      }

      socket.on('joinRoom', (roomId) => {
          socket.join(roomId);
          console.log(`Socket joined room: ${roomId}`);
      });

      // Handle new comment or reply
      socket.on('newComment', async (data) => {
        try {
            const userId = socket.handshake.session.user?.id;
            if (!userId) {
                return socket.emit('commentError', 'Authentication required');
            }
            // Correct destructuring:
            const { productId } = data;
            const { text, parentId, rating } = data.comment;
            const newComment = await pushTheCommentToProduct(productId, userId, text, parentId, rating);
            io.to(productId).emit('receiveComment', { productId, comment: newComment });
            // If it’s a top-level comment with a rating, update the product’s average rating        

        } catch (error) {
            console.error('Error handling newComment:', error);
            socket.emit('commentError', error.message);
        }
      });
      
      // Edit comment
      socket.on('editComment', async (data) => {
          try {
              const userId = socket.handshake.session.user?.id;
              if (!userId) {
                  return socket.emit('commentError', 'Authentication required');
              }
              const updatedComment = await editComment(
                  data.productId,
                  data.commentId,
                  userId,
                  data.newText,
                  socket.handshake.session.user?.isAdmin
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

      // Delete comment
      socket.on('deleteComment', async (data) => {
          try {
              const userId = socket.handshake.session.user?.id;
              if (!userId) {
                  return socket.emit('commentError', 'Authentication required');
              }
              await deleteComment(
                  data.productId,
                  data.commentId,
                  userId,
                  socket.handshake.session.user?.isAdmin
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

      // Toggle reactions
      socket.on('toggleLikeComment', async (data) => {
          try {
              const { productId, commentId } = data;
              const userId = socket.handshake.session.user?.id;
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
              const userId = socket.handshake.session.user?.id;
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
              const userId = socket.handshake.session.user?.id;
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