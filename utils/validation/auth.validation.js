import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

export const loginWithPhoneSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': `Phone number must start with ' + ' followed by 8 to 15 digits`,
    }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

export const clientRegisterSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  companyName: Joi.string().min(3).max(50).required(),
  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': `Phone number must start with ' + ' followed by 8 to 15 digits`,
    }),
});

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': `Phone number must start with ' + ' followed by 8 to 15 digits`,
    }),
});

export const employeeRegisterSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
  identityNumber: Joi.string().min(5).max(50).required(),
  dob: Joi.date().required(),
  phoneNumber: Joi.string()
    .pattern(/^\+?[0-9]{8,15}$/)
    .required()
    .messages({
      'string.pattern.base': `Phone number must start with ' + ' followed by 8 to 15 digits`,
    }),
});
