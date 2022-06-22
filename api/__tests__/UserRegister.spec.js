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

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = async (user = validUser, options = {}) => {

  const agent = request(app).post('/api/1.0/users')
  if (options.language) {
    agent.set('Accept-Language', options.language)
  }
  return agent.send(user);
};

describe('User Registration', () => {
  it(`returns 200 OK when signup request is valid`, async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it(`returns success message when signup request is valid`, async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User Created');
  });

  it(`saves the user to Database`, async () => {
    await postUser();
    //query user table
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it(`saves the username and email to Database`, async () => {
    await postUser();
    //query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it(`hashes the password in Database`, async () => {
    await postUser();
    //query user table
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;

    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);

    // validatioErrors = {
    //   username: '...',
    //   email: '...'
    // }
  });

  // it('returns Username cannot be null when username is null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   });
  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe('Username cannot be null');
  // });

  // it('returns Email cannot be null when email is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: null,
  //     password: 'P4ssword',
  //   });
  //   const body = response.body;
  //   expect(body.validationErrors.email).toBe('Email cannot be null');
  // });

  // it('returns Password cannot be null message when password is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: 'user@mail.com',
  //     password: null,
  //   });
  //   const body = response.body;

  //   expect(body.validationErrors.password).toBe('Password cannot be null');
  // });

  // it.each([
  //   ['username', 'Username cannot be null'],
  //   ['email', 'Email cannot be null'],
  //   ['password', 'Password cannot be null'],
  // ])('when %s is null %s is received', async (field, expectedMessage) => {
  //   const user = {
  //     username: 'user1',
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   };
  //   user[field] = null;
  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors[field]).toBe(expectedMessage);
  // });

  const username_null = 'Username cannot be null';
  const username_size = 'Must have min 4 and max 32 characters';
  const email_null = 'Email cannot be null';
  const email_invalid = 'Email is not valid';
  const password_null = 'Password cannot be null';
  const password_size = 'Password can be at least 6 characters';
  const password_pattern = 'Password can have at least 1 uppercase, 1 lowercase and 1 number';
  const email_inuse = 'Email in use';

  it.each`
  field         | value              | expectedMessage
  ${'username'} | ${null}            | ${username_null}
  ${'username'} | ${'usr'}           | ${username_size}
  ${'username'} | ${'a'.repeat(33)}  | ${username_size}
  ${'email'}    | ${null}            | ${email_null}
  ${'email'}    | ${'mail.com'}      | ${email_invalid}
  ${'email'}    | ${'user.mail.com'} | ${email_invalid}
  ${'email'}    | ${'user@mail'}     | ${email_invalid}
  ${'password'} | ${null}            | ${password_null}
  ${'password'} | ${'P4ss'}          | ${password_size}
  ${'password'} | ${'alllowercase'}  | ${password_pattern}
  ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
  ${'password'} | ${'125899'}        | ${password_pattern}
  ${'password'} | ${'lower1234'}     | ${password_pattern}
  ${'password'} | ${'UPPER125899'}   | ${password_pattern}
  ${'password'} | ${'lowerUPPER'}    | ${password_pattern}
`('returns $expectedMessage when $field is $value', async ({ field, expectedMessage, value }) => {
  const user = {
    username: 'user1',
    email: 'user1@mail.com',
    password: 'P4ssword',
  };
  user[field] = value;
  const response = await postUser(user);
  const body = response.body;
  expect(body.validationErrors[field]).toBe(expectedMessage);
});

  // it('returns size validation error when username is less than 4 characters', async () => {
  //   const user = {
  //     username: 'usr',
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   };
  //   const response = await postUser(user);
  //   const body = response.body;
  //   expect(body.validationErrors.username).toBe('Must have min 4 and max 32 characters');
  // });

  it('returns Email in use when the same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});

  describe('Internationalization', () => {

      const username_null = 'Το όνομα χρήστη δεν μπορεί να είναι κενό πεδίο';
      const username_size = 'Απαιτούνται τουλάχιστον 4 και το πολύ 32 χαρακτήρες';
      const email_null = 'Το email δεν μπορεί να είναι κενό πεδίο';
      const email_invalid = 'Λάθος email';
      const password_null = 'Τo password δεν μπορεί να είναι κενό πεδίο';
      const password_size = 'Απαιτούνται τουλάχιστον 6 χαρακτήρες';
      const password_pattern = 'Απαιτείται τουλάχιστον 1 κεφαλαίο, 1 μικρό γραμμα και 1 χαρακτήρας';
      const email_inuse = 'Το email χρησιμοποιείται ήδη';
      const user_create_success = 'Ο χρήστης δημιουργήθηκε επιτυχώς'
  
      it.each`
        field         | value              | expectedMessage
        ${'username'} | ${null}            | ${username_null}
        ${'username'} | ${'usr'}           | ${username_size}
        ${'username'} | ${'a'.repeat(33)}  | ${username_size}
        ${'email'}    | ${null}            | ${email_null}
        ${'email'}    | ${'mail.com'}      | ${email_invalid}
        ${'email'}    | ${'user.mail.com'} | ${email_invalid}
        ${'email'}    | ${'user@mail'}     | ${email_invalid}
        ${'password'} | ${null}            | ${password_null}
        ${'password'} | ${'P4ss'}          | ${password_size}
        ${'password'} | ${'alllowercase'}  | ${password_pattern}
        ${'password'} | ${'ALLUPPERCASE'}  | ${password_pattern}
        ${'password'} | ${'125899'}        | ${password_pattern}
        ${'password'} | ${'lower1234'}     | ${password_pattern}
        ${'password'} | ${'UPPER125899'}   | ${password_pattern}
        ${'password'} | ${'lowerUPPER'}    | ${password_pattern}
      `(
        'returns $expectedMessage when $field is $value when greek is set as language',
        async ({ field, expectedMessage, value }) => {
          const user = {
            username: 'user1',
            email: 'user1@mail.com',
            password: 'P4ssword',
          };
          user[field] = value;
          const response = await postUser(user, {language:'gr'});
          const body = response.body;
          expect(body.validationErrors[field]).toBe(expectedMessage);
        }
      );
  
      it(`returns ${email_inuse} when the same email is already in use when greek is set as language`, async () => {
        await User.create({ ...validUser });
        const response = await postUser({ ...validUser }, {language:'gr'});
        expect(response.body.validationErrors.email).toBe(email_inuse);
      });

      it(`returns success message when signup request is valid and language greek`, async () => {
        const response = await postUser({ ...validUser }, {language:'gr'});
        expect(response.body.message).toBe(user_create_success);
      });
  });