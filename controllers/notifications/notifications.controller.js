import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../../errors/bad-request.js';
import NotFoundError from '../../errors/not-found.js';

export const getAllNotifications = async (req, res) => {
  const notifications = await prisma.notification.findMany({});
  res.status(StatusCodes.OK).json({ notifications });
};

export const getNotificationById = async (req, res) => {
  const { id: notificationId } = req.params;
  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(notificationId) },
  });
  if (!notification) {
    throw new NotFoundError(
      `No notification found with this id ${notificationId}`
    );
  }
  res.status(StatusCodes.OK).json({ notification });
};

export const getAuthenticatedClientNotifications = async (req, res) => {
  const clientId = req.user.userId;
  const notification = await prisma.notification.findMany({
    where: { clientId },
    orderBy: {
      createdAt: 'desc',
    },
  });
  if (!notification) {
    throw new BadRequestError('No notification found!');
  }
  res.status(StatusCodes.OK).json({ notification });
};

export const getAuthenticatedEmployeeNotifications = async (req, res) => {
  const employeeId = req.user.userId;
  const notification = await prisma.notification.findMany({
    where: { employeeId },
  });
  if (!notification) {
    throw new BadRequestError('No notification found!');
  }
  res.status(StatusCodes.OK).json({ notification });
};
