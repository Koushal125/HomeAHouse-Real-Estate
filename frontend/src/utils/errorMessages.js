const pickServerMessage = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  // Validation errors return { message, errors: { field: message } }.
  // Scan field-level messages so keyword matching in getApiErrorMessage works.
  if (data.errors && typeof data.errors === 'object') {
    const errorValues = Object.values(data.errors).filter((v) => typeof v === 'string');
    if (errorValues.length > 0) {
      return errorValues.join(' ');
    }
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  if (typeof data.details === 'string') {
    return data.details;
  }

  return '';
};

const hasAnyKeyword = (value, keywords) => {
  if (!value) {
    return false;
  }

  const normalized = String(value).toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export const getApiErrorMessage = (error, fallbackMessage, context = 'default') => {
  const status = error?.response?.status;
  const serverMessage = pickServerMessage(error);

  if (!error?.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (context === 'login') {
    if (status === 401 || hasAnyKeyword(serverMessage, ['invalid credential', 'bad credential', 'unauthorized', 'wrong password'])) {
      return 'Incorrect email or password.';
    }
  }

  if (context === 'change-password') {
    if (hasAnyKeyword(serverMessage, ['current password', 'incorrect password', 'invalid password', 'wrong password'])) {
      return 'Incorrect Password. Please enter your current password correctly.';
    }

    if (hasAnyKeyword(serverMessage, ['passwords do not match', 'confirm password'])) {
      return 'New password and confirm password must match.';
    }
  }

  if (context === 'register') {
    if (status === 409 || hasAnyKeyword(serverMessage, ['already exists', 'duplicate', 'email'])) {
      return 'An account with this email already exists.';
    }
  }

  if (context === 'property') {
    if (hasAnyKeyword(serverMessage, ['bedroom', 'bedrooms'])) {
      return 'Bedrooms should be at least 1.';
    }

    if (hasAnyKeyword(serverMessage, ['bathroom', 'bathrooms'])) {
      return 'Bathrooms should be at least 1.';
    }

    if (hasAnyKeyword(serverMessage, ['price', 'cost', 'offercost'])) {
      return 'Price should be greater than 0.';
    }

    if (hasAnyKeyword(serverMessage, ['area', 'sqft'])) {
      return 'Area should be greater than 0.';
    }
  }

  return serverMessage || fallbackMessage;
};
