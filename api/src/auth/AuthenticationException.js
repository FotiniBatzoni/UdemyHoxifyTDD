module.exports = function AuthenticationException() {
    this.message = 'authentication_failure';
    this.status = 401;
  };
  