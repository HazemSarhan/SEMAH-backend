import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../../errors/bad-request.js';
import NotFoundError from '../../errors/not-found.js';
import stripe from '../../configs/stripeConfig.js';

export const createIncorporateService = async (req, res) => {
  const {
    activityType,
    outsideKSA,
    anotherLocation,
    price,
    contract,
    employees,
  } = req.body;

  const validEmployees = await prisma.employee.findMany({
    where: { id: { in: employees } },
  });

  if (validEmployees.length !== employees.length) {
    throw new BadRequestError('Some employee IDs are invalid!');
  }

  const incorporate = await prisma.incorporationServices.create({
    data: {
      activityType,
      outsideKSA,
      anotherLocation,
      price,
      contract,
      employees: {
        connect: employees.map((id) => ({ id })),
      },
    },
  });
  res.status(StatusCodes.CREATED).json({ incorporate });
};

export const getAllIncorporates = async (req, res) => {
  const incorporate = await prisma.incorporationServices.findMany({
    include: { employees: { select: { id: true, name: true } } },
  });
  res.status(StatusCodes.OK).json({ incorporate });
};

export const getIncorporateServiceById = async (req, res) => {
  let { anotherLocation, outsideKSA } = req.query;

  var isTrueSet = String(outsideKSA).toLowerCase() === 'true';

  const incorporate = await prisma.incorporationServices.findMany({
    where: {
      AND: [{ outsideKSA: isTrueSet }, { anotherLocation }],
    },
    include: { employees: { select: { id: true, name: true } } },
  });

  res.status(StatusCodes.OK).json({ incorporate });
};

export const purchaseIncorporateService = async (req, res) => {
  const clientId = req.user.userId;
  const { incorporateId } = req.body;

  const incorporate = await prisma.incorporationServices.findUnique({
    where: { id: parseInt(incorporateId) },
  });

  if (!incorporate) {
    throw new BadRequestError('No incorporate found with this id');
  }

  const lineItems = [
    {
      price_data: {
        currency: 'sar',
        product_data: {
          name: incorporate.activityType,
        },
        unit_amount: Math.round(incorporate.price * 100),
      },
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.BACKEND_URL}/api/v1/incorporate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/incorporate/cancel`,
    metadata: {
      clientId,
      incorporateId,
    },
  });

  res.status(StatusCodes.OK).json({ url: session.url });
};

export const handleIncorporateService = async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    throw new BadRequestError('Session ID is missing!');
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const clientId = session.metadata.clientId;
  const incorporateId = session.metadata.incorporateId;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });
  if (!client) {
    throw new BadRequestError('Invalid Client ID');
  }

  const incorporate = await prisma.incorporationServices.findUnique({
    where: { id: parseInt(incorporateId) },
    include: { employees: true },
  });

  if (!incorporate) {
    throw new BadRequestError('No incorporate services found');
  }

  if (!incorporate.employees || incorporate.employees.length === 0) {
    throw new BadRequestError(
      'No employees assigned to this incorporate service'
    );
  }

  const order = await prisma.order.create({
    data: {
      clientId,
      totalPrice: incorporate.price,
      status: 'PENDING',
      orderItems: {
        create: [
          {
            serviceItemId: null,
            consultationId: null,
            priceAtTime: incorporate.price,
            quantity: 1,
            incorporationServiceId: incorporate.id,
          },
        ],
      },
    },
  });

  const payment = await prisma.payment.create({
    data: {
      paymentId: session.payment_intent,
      clientId,
      orderId: order.id,
      provider: 'Stripe',
      method: session.payment_method_types[0],
      status: 'SUCCESS',
      amount: incorporate.price,
      currency: 'sar',
    },
  });

  const assignedEmployee = incorporate.employees[0];
  const chat = await prisma.chat.create({
    data: {
      serviceItemId: null,
      appointmentId: null,
      incorporationServiceId: incorporate.id,
      employeeId: assignedEmployee.id,
      clientId,
    },
  });

  const redirectUrl = `${process.env.FRONTEND_URL}/myOrders/${order.id}`;
  // res.redirect(redirectUrl);

  res.status(StatusCodes.OK).json({
    order,
    payment,
    chat,
  });
};
