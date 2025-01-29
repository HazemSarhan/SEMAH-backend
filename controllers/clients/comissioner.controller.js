import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../../errors/bad-request.js';
import NotFoundError from '../../errors/not-found.js';
import bcrypt from 'bcryptjs';
import UnauthenticatedError from '../../errors/unauthenticated.js';
import createTokenUser from '../../utils/createTokenUser.js';
import { attachCookiesToResponse } from '../../utils/jwt.js';
import UnauthorizedError from '../../errors/unauthorized.js';
import { token } from 'morgan';

export const createCommissioner = async (req, res) => {
  const { name, identityNumber, phoneNumber, password, serviceItemId } =
    req.body;
  const clientId = req.user.userId;
  if (!name || !identityNumber || !phoneNumber || !password) {
    throw new BadRequestError('Please provide all required fields');
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const commissioner = await prisma.commissioner.create({
    data: {
      name,
      identityNumber,
      phoneNumber,
      password: hashedPassword,
      serviceItemId,
      clientId,
    },
  });

  res.status(StatusCodes.OK).json({ commissioner });
};

export const loginCommissioner = async (req, res) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber || !password) {
    throw new BadRequestError(
      'Please provide a valid phone number and password'
    );
  }

  // Check if the commissioner is exists
  const commissioner = await prisma.commissioner.findFirst({
    where: { phoneNumber },
  });

  if (!commissioner) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  // Comparing passwords
  const isPasswordCorrect = await bcrypt.compare(
    password,
    commissioner.password
  );
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const commissionerToken = createTokenUser(commissioner);
  attachCookiesToResponse({ res, user: commissionerToken });

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
  const headers = res.getHeaders();
  const setCookieHeader = headers['set-cookie'];
  let refreshToken = '';
  if (setCookieHeader) {
    const tokenMatch = setCookieHeader.match(/token=(s%3A[^;]*)/);
    if (tokenMatch) {
      refreshToken = decodeURIComponent(tokenMatch[1]);
    } else {
      console.log('Token not found in Set-Cookie header');
    }
  }
  await prisma.token.create({
    data: {
      refreshToken,
      ip: req.ip,
      commissionerId: commissioner.id,
      userAgent: req.headers['user-agent'],
      isValid: true,
    },
  });

  res.status(StatusCodes.OK).json({
    message: 'Login Success',
    user: commissionerToken,
    token: refreshToken,
  });
};

export const getAllCommissioners = async (req, res) => {
  const clientId = req.user.userId;
  if (!req.user.role) {
    throw new UnauthorizedError('Unauthorized to access this route');
  }
  if (!clientId) {
    throw new BadRequestError('No client ID is logged in!');
  }
  const client = await prisma.commissioner.findMany({
    where: {
      clientId,
    },
    include: {
      orders: true,
    },
  });

  res.status(StatusCodes.OK).json({ client });
};

export const showCurrentCommissioner = async (req, res) => {
  const commissionerId = req.user.userId;
  const commissioner = await prisma.commissioner.findUnique({
    where: { id: commissionerId },
    select: {
      id: true,
      name: true,
      identityNumber: true,
      phoneNumber: true,
      clientId: true,
      canAccessMessages: true,
      canPurchaseServices: true,
    },
  });
  if (!commissioner) {
    throw new BadRequestError('No commissioner logged in!');
  }
  res.status(StatusCodes.OK).json(commissioner);
};

export const getCommissionerById = async (req, res) => {
  const clientId = req.user.userId;
  if (!req.user.role) {
    throw new UnauthorizedError('Unauthorized to access this route');
  }
  const { id: commissionerId } = req.params;
  const commissioner = await prisma.commissioner.findFirst({
    where: { id: commissionerId },
    include: { orders: true },
  });
  if (!commissioner) {
    throw new NotFoundError(`No commissioners Found!`);
  }

  res.status(StatusCodes.OK).json({ commissioner });
};

export const updateCommissioner = async (req, res) => {
  const {
    name,
    identityNumber,
    phoneNumber,
    password,
    serviceItemId,
    canAccessMessages,
    canPurchaseServices,
  } = req.body;
  const clientId = req.user.userId;
  if (!req.user.role) {
    throw new UnauthorizedError('Unauthorized to access this route');
  }
  const { id: commissionerId } = req.params;
  const commissioner = await prisma.commissioner.findFirst({
    where: { id: commissionerId },
  });
  if (!commissioner) {
    throw new NotFoundError(`No commissioners Found!`);
  }

  const updateData = {};
  if (name) {
    updateData.name = name;
  }
  if (identityNumber) {
    updateData.identityNumber = identityNumber;
  }
  if (phoneNumber) {
    updateData.phoneNumber = phoneNumber;
  }
  if (serviceItemId) {
    updateData.serviceItemId = parseInt(serviceItemId);
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }
  if (canAccessMessages) {
    updateData.canAccessMessages = Boolean(canAccessMessages);
  }
  if (canPurchaseServices) {
    updateData.canPurchaseServices = Boolean(canPurchaseServices);
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { commissioner: true },
  });

  const isCommissionerAssociated = client.commissioner.some(
    (commissioner) => commissioner.id === commissionerId
  );

  if (!isCommissionerAssociated) {
    throw new UnauthorizedError(
      'You are not authorized to modify this commissioner'
    );
  }

  const updateCommissioner = await prisma.commissioner.update({
    where: { id: commissionerId },
    data: updateData,
  });
  res.status(StatusCodes.OK).json({ updateCommissioner });
};

export const deleteCommissioner = async (req, res) => {
  const clientId = req.user.userId;
  if (!req.user.role) {
    throw new UnauthorizedError('Unauthorized to access this route');
  }
  const { id: commissionerId } = req.params;
  const commissioner = await prisma.commissioner.findFirst({
    where: { id: commissionerId },
  });
  if (!commissioner) {
    throw new NotFoundError(`No commissioners Found!`);
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { commissioner: true },
  });

  const isCommissionerAssociated = client.commissioner.some(
    (commissioner) => commissioner.id === commissionerId
  );

  if (!isCommissionerAssociated) {
    throw new UnauthorizedError(
      'You are not authorized to modify this commissioner'
    );
  }

  const deleteCommissioner = await prisma.commissioner.delete({
    where: { id: commissionerId },
  });

  res.status(StatusCodes.OK).json({ msg: 'Commissioner has beed deleted!' });
};
export const assignCommissionerToChat = async (req, res) => {
  const { commissionerId, chatId } = req.body;

  if (!commissionerId || !chatId) {
    throw new BadRequestError('Please provide commissionerId and chatId');
  }

  const commissioner = await prisma.commissioner.findUnique({
    where: { id: commissionerId },
  });

  if (!commissioner) {
    throw new NotFoundError('Commissioner not found');
  }

  const chat = await prisma.chat.findUnique({
    where: { id: parseInt(chatId, 10) },
  });

  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  const updatedChat = await prisma.chat.update({
    where: { id: parseInt(chatId, 10) },
    data: {
      commissioner: {
        connect: { id: commissionerId },
      },
    },
  });

  res
    .status(StatusCodes.OK)
    .json({ message: 'Commissioner assigned to chat', chat: updatedChat });
};
