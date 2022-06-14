const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

//to call the database before calling the tests
beforeAll(() => {
  return sequelize.sync();
});

//Cleaning the user table before each test
beforeEach(() => {
  return User.destroy({ truncate: true });
});

describe('User Registration', () => {
  const postValidUser = () => {
    return request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
  };
  it(`returns 200 OK when signup request is valid`, async () => {
    const response = await postValidUser();
    expect(response.status).toBe(200);
  });

  it(`returns success message when signup request is valid`, async () => {
    const response = await postValidUser();
    expect(response.body.message).toBe('User Created');
  });

  it(`saves the user to Database`, async () => {
    await postValidUser();
    //query user table
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it(`saves the username and email to Database`, async () => {
    await postValidUser();
    //query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it(`hashes the password in Database`, async () => {
    await postValidUser();
    //query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });
});
