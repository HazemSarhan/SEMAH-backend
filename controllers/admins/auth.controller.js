import { PrismaClient } from '@prisma/client';
let prisma = new PrismaClient();
import { StatusCodes } from 'http-status-codes';
import BadRequestError from '../../errors/bad-request.js';
import UnauthenticatedError from '../../errors/unauthenticated.js';
import { attachCookiesToResponse } from '../../utils/jwt.js';
import createTokenUser from '../../utils/createTokenUser.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '../../configs/sendgridConfig.js';
// import { sendEmail } from '../../configs/awsConfig.js';

export const registerAdmin = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  if (!name || !email || !password || !phoneNumber) {
    throw new BadRequestError('All fields are required');
  }
  // Check if the email already exists
  const normalizedEmail = email.toLowerCase();

  const isEmailExists = await prisma.client.findUnique({
    where: {
      email: normalizedEmail,
    },
  });
  if (isEmailExists) {
    throw new BadRequestError('Email already exists');
  }

  // Check if the phone number already exists
  const isPhoneNumberExists = await prisma.client.findFirst({
    where: {
      phoneNumber: phoneNumber,
    },
  });
  if (isPhoneNumberExists) {
    throw new BadRequestError('Phone number already exists');
  }

  // Hashing the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate a verification code
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString(); // 6-digit code
  const hashedCode = crypto
    .createHash('sha256')
    .update(verificationCode)
    .digest('hex');
  const codeExpiration = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

  const admin = await prisma.admin.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      verificationToken: hashedCode,
      tokenExpiration: codeExpiration,
      isVerified: false,
    },
  });
  // Send verification code to the owner's email
  const emailSubject = 'Admin Account Verification Code';
  const emailBody = `
    <p>Hi ${name},</p>
    <p>Your verification code for registering an admin account with email ${email} is:</p>
    <h1>${verificationCode}</h1>
    <p>This code will expire in 15 minutes.</p>
  `;

  await sendEmail(process.env.OWNER_EMAIL, emailSubject, emailBody);

  res.status(StatusCodes.CREATED).json({
    message:
      'Verification code sent to owner email. Please complete the verification process.',
  });
};

export const verifyAdmin = async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) {
    throw new BadRequestError('Email and verification token are required');
  }

  const normalizedEmail = email.toLowerCase();
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find admin by email and verification code
  const admin = await prisma.admin.findFirst({
    where: {
      email: normalizedEmail,
      verificationToken: hashedToken,
      tokenExpiration: {
        gt: new Date(),
      },
    },
  });
  if (!admin) {
    throw new BadRequestError('Invalid or expired token');
  }

  await prisma.admin.update({
    where: {
      email: normalizedEmail,
    },
    data: {
      isVerified: true,
      verificationToken: null,
      tokenExpiration: null,
    },
  });
  res.status(StatusCodes.OK).json({ message: 'Admin verified successfully.' });
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  // Check if the email exists
  const admin = await prisma.admin.findUnique({
    where: {
      email: email,
    },
  });
  if (!admin) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  // Check if the email is verified
  if (!admin.isVerified) {
    throw new UnauthenticatedError('Please verify your email first');
  }

  // Comparing password
  const isPasswordCorrect = await bcrypt.compare(password, admin.password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const adminToken = createTokenUser(admin);
  attachCookiesToResponse({ res, user: adminToken });

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
      adminId: admin.id,
      userAgent: req.headers['user-agent'],
      isValid: true,
    },
  });

  res.status(StatusCodes.OK).json({ admin: adminToken, token: refreshToken });
};

export const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + 1 * 1000),
  });
  res
    .status(StatusCodes.OK)
    .json({ msg: `User has been logged out successfully!` });
};
