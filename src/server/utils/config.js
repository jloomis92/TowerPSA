import dotenv from 'dotenv';

dotenv.config();

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in environment');
  }

  return process.env.JWT_SECRET;
};

export { getJwtSecret };
