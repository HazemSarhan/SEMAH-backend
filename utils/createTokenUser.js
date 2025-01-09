const createTokenUser = (user) => {
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    companyName: user.companyName,
    role: user.role,
    phoneNumber: user.phoneNumber,
    customerClass: user.customerClass,
    isVerified: user.isVerified,
  };
};

export default createTokenUser;
