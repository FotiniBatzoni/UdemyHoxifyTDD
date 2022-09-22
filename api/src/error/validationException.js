module.exports = function ValidationException(errors){
    console.log('here')
    this.status = 400;
    this.errors = errors;
    this.message = 'validation_failure';
}