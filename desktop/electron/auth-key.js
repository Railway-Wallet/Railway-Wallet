const AUTH_KEY_PATTERN = /^[0-9a-fA-F]{64}$/;

const isValidAuthKey = authKey =>
  typeof authKey === 'string' && AUTH_KEY_PATTERN.test(authKey);

module.exports = { isValidAuthKey };
