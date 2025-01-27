import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../../errors/bad-request.js';
import NotFoundError from '../../errors/not-found.js';
import cloudinary from '../../configs/cloudinaryConfig.js';
import fs from 'fs';

export const getChats = async (req, res) => {
  const userId = req.user.userId;
  const role = req.user.role;

  const client = await prisma.client.findUnique({
    where: { id: userId },
  });

  if (client) {
    const chats = await prisma.chat.findMany({
      where: { clientId: userId },
      include: {
        serviceItem: { select: { name: true } },
        employee: { select: { name: true, email: true } },
        appointment: true,
        client: { select: { commissioner: true } },
      },
    });

    return res.status(StatusCodes.OK).json(chats);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (employee) {
    const chats = await prisma.chat.findMany({
      where: { employeeId: userId },
      include: {
        serviceItem: { select: { name: true } },
        client: { select: { name: true, email: true } },
        appointment: true,
      },
    });
    return res.status(StatusCodes.OK).json(chats);
  }

  const admin = await prisma.admin.findUnique({
    where: { id: userId },
  });

  if (admin) {
    const chats = await prisma.chat.findMany({});
    return res.status(StatusCodes.OK).json(chats);
  }

  const commissioner = await prisma.commissioner.findUnique({
    where: { id: userId },
  });

  if (commissioner) {
    const chats = await prisma.chat.findMany({
      where: {
        commissionerId: userId,
      },
      include: {
        serviceItem: { select: { name: true } },
        employee: { select: { name: true, email: true } },
        appointment: true,
        client: { select: { name: true, email: true } },
      },
    });

    return res.status(StatusCodes.OK).json(chats);
  }
  throw new BadRequestError('User not found or not authorized to access chats');
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.userId;
  const role = req.user.role;

  if (role === 'ADMIN') {
    const messages = await prisma.message.findMany({
      where: { chatId: parseInt(chatId, 10) },
      orderBy: { createdAt: 'asc' },
    });
    return res.status(StatusCodes.OK).json(messages);
  }

  const chat = await prisma.chat.findUnique({
    where: { id: parseInt(chatId, 10) },
  });

  const client = await prisma.client.findUnique({
    where: { id: chat.clientId },
    include: { commissioner: true },
  });
  const isCommissioner = client.commissioner.some(
    (commissioner) => commissioner.id === userId
  );
  const isClient = chat.clientId === userId;
  const isEmployee = chat.employeeId === userId;

  if (!isClient && !isEmployee && !isCommissioner) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'You do not have access to this chat',
    });
  }

  const messages = await prisma.message.findMany({
    where: { chatId: parseInt(chatId, 10) },
    orderBy: { createdAt: 'asc' },
  });

  res.status(StatusCodes.OK).json(messages);
};

export const sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const sender = req.user.userId;
  const role = req.user.role;

  const chat = await prisma.chat.findUnique({
    where: { id: parseInt(chatId, 10) },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (
    role !== 'ADMIN' &&
    sender !== chat.clientId &&
    sender !== chat.employeeId &&
    sender !== chat.commissionerId
  ) {
    throw new BadRequestError(
      'You are not authorized to send messages in this chat'
    );
  }

  let fileUrl = null;
  if (req.files && req.files.fileUrl) {
    const result = await cloudinary.uploader.upload(
      req.files.fileUrl.tempFilePath,
      {
        use_filename: true,
        folder: 'product-images',
      }
    );
    fs.unlinkSync(req.files.fileUrl.tempFilePath);
    fileUrl = result.secure_url;
  }

  if (!content && !fileUrl) {
    throw new BadRequestError('Message content or a file must be provided.');
  }

  const message = await prisma.message.create({
    data: {
      chatId: parseInt(chatId, 10),
      sender,
      content: content || null,
      fileUrl: fileUrl || null,
    },
  });

  const io = req.app.get('io');
  if (io) {
    const x = chatId;
    io.to(Number(chatId)).emit('receive-message', {
      fileUrl,
      content,
      sender: sender,
      chatId: chatId,
      createdAt: message.createdAt,
    });
    console.log('Message sent successfully');
  }

  res.status(StatusCodes.CREATED).json(message);
};

export const getAllChats = async (req, res) => {
  const chats = await prisma.chat.findMany({
    include: {
      serviceItem: { select: { name: true } },
      client: { select: { name: true, email: true } },
      employee: { select: { name: true, email: true } },
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: chats,
  });
};

export const getChatByUserId = async (req, res) => {
  const { userId } = req.params;

  const chats = await prisma.chat.findMany({
    where: {
      OR: [{ clientId: userId }, { employeeId: userId }],
    },
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: chats,
  });
};
