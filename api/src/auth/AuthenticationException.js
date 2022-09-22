module.exports = function AuthenticationException( message ) {
  console.log(message)
    this.message = message || 'authentication_failure';
    this.status = 401;
  };
  