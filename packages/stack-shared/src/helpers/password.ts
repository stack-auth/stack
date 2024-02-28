function checkPasswordTooShort(password: string) {
  return password.length >= 8;
}

function checkPasswordTooLong(password: string) {
  return password.length <= 64;
}

function checkPasswordCharacters(password: string) {
  return /^[a-zA-Z0-9!@#$%^&*()_+?]+$/.test(password);
}

function checkPasswordContainsLetter(password: string) {
  return /[a-zA-Z]/.test(password);
}

function checkPasswordContainsNumber(password: string) {
  return /[0-9]/.test(password);
}

export function getPasswordError(password: string): string | null {
  if (!checkPasswordTooShort(password)) {
    return "password must be at least 8 characters long";
  }

  if (!checkPasswordTooLong(password)) {
    return "password must be at most 64 characters long";
  }

  if (!checkPasswordCharacters(password)) {
    return "password must contain only letters, numbers, and the following special characters: !@#$%^&*()_+?";
  }

  if (!checkPasswordContainsLetter(password)) {
    return "password must contain at least one letter";
  }

  if (!checkPasswordContainsNumber(password)) {
    return "password must contain at least one number";
  }

  return null;
}