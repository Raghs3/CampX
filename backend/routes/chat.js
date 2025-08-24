// routes/chat.js - Real-time Chat Routes
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const Item = require('../models/Item');
const { auth } = require('../middleware/auth');

// GET all chats for user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId,
      isActive: true
    })
    .populate('participants', 'name avatar initials lastActive')
    .populate('item', 'title images price status')
    .populate({
      path: 'messages',
      options: { sort: { createdAt: -1 }, limit: 1 }
    })
    .sort({ lastActivity: -1 });

    // Format chats for frontend
    const formattedChats = chats.map(chat => {
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== req.userId
      );
      
      return {
        id: chat._id,
        participant: otherParticipant,
        item: chat.item,
        lastMessage: chat.messages[0] || null,
        lastActivity: chat.lastActivity,
        unreadCount: chat.messages.filter(msg => 
          !msg.readBy.some(read => read.user.toString() === req.userId)
        ).length
      };
    });

    res.json({ chats: formattedChats });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// GET specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    })
    .populate('participants', 'name avatar initials lastActive verified')
    .populate('item', 'title images price status seller condition')
    .populate('messages.sender', 'name avatar initials');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark messages as read
    const unreadMessages = chat.messages.filter(msg => 
      !msg.readBy.some(read => read.user.toString() === req.userId) &&
      msg.sender.toString() !== req.userId
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        msg.readBy.push({
          user: req.userId,
          readAt: new Date()
        });
      });
      await chat.save();
    }

    res.json({ chat });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// POST create or get existing chat
router.post('/create', auth, async (req, res) => {
  try {
    const { itemId, participantId } = req.body;

    // Validate item exists and is available
    const item = await Item.findById(itemId).populate('seller');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.status !== 'Available') {
      return res.status(400).json({ error: 'Item is no longer available' });
    }

    // Can't chat with yourself
    if (item.seller._id.toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot start chat with yourself' });
    }

    const otherUserId = participantId || item.seller._id;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, otherUserId] },
      item: itemId
    });

    if (chat) {
      // Reactivate if inactive
      if (!chat.isActive) {
        chat.isActive = true;
        await chat.save();
      }
    } else {
      // Create new chat
      chat = new Chat({
        participants: [req.userId, otherUserId],
        item: itemId,
        messages: []
      });
      await chat.save();
    }

    // Populate for response
    await chat.populate([
      { path: 'participants', select: 'name avatar initials lastActive verified' },
      { path: 'item', select: 'title images price status seller condition' }
    ]);

    res.status(201).json({ 
      message: 'Chat created successfully',
      chat 
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// POST send message
router.post('/:chatId/message', auth, async (req, res) => {
  try {
    const { content, messageType = 'text', offer } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId,
      isActive: true
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or inactive' });
    }

    // Create message
    const message = {
      sender: req.userId,
      content: content.trim(),
      messageType,
      readBy: [{
        user: req.userId,
        readAt: new Date()
      }]
    };

    // Add offer data if it's an offer message
    if (messageType === 'offer' && offer) {
      message.offer = {
        amount: Number(offer.amount),
        status: 'pending'
      };
    }

    chat.messages.push(message);
    chat.lastActivity = new Date();
    await chat.save();

    // Populate the new message for response
    const newMessage = chat.messages[chat.messages.length - 1];
    await chat.populate('messages.sender', 'name avatar initials');

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: newMessage
    });

    // Here you would emit the message via Socket.IO
    // req.io.to(req.params.chatId).emit('newMessage', newMessage);

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT respond to offer
router.put('/:chatId/message/:messageId/offer', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid offer status' });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    }).populate('item');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const message = chat.messages.id(req.params.messageId);
    if (!message || message.messageType !== 'offer') {
      return res.status(404).json({ error: 'Offer message not found' });
    }

    // Only item owner can respond to offers
    if (chat.item.seller.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the seller can respond to offers' });
    }

    message.offer.status = status;
    chat.lastActivity = new Date();
    await chat.save();

    // Send response message
    const responseMessage = {
      sender: req.userId,
      content: status === 'accepted' 
        ? `I accept your offer of ₹${message.offer.amount}!` 
        : `Thank you for your offer, but I cannot accept ₹${message.offer.amount} at this time.`,
      messageType: 'text',
      readBy: [{
        user: req.userId,
        readAt: new Date()
      }]
    };

    chat.messages.push(responseMessage);
    await chat.save();

    res.json({
      message: `Offer ${status} successfully`,
      offerStatus: status
    });

  } catch (error) {
    console.error('Respond to offer error:', error);
    res.status(500).json({ error: 'Failed to respond to offer' });
  }
});

// DELETE chat (deactivate)
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.chatId,
        participants: req.userId
      },
      { isActive: false },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router;
