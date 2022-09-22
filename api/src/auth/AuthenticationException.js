module.exports = function AuthenticationException( message ) {
    this.message = message || 'authentication_failure';
    this.status = 401;
  };
  