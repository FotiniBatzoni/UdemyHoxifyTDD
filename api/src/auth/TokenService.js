const jwt = require('jsonwebtoken');
const createToken = (user) => {
    const token = jwt.sign( { id:user.id }, 'this-is-our-secret');
    return token

};

module.exports = {
    createToken
}