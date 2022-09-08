const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const nodemailerStub = require('nodemailer-stub');
const SMTPServer = require('smtp-server').SMTPServer;
const EmailService = require('../src/email/EmailService');
const c = require('config');
const { response } = require('../src/app');
const { describe } = require('../src/user/User');

let lastMail, server;
let simulateSmtpFailure = false;

//to call the database before calling the tests
beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  await server.listen(8587, 'localhost');

  await sequelize.sync();
});

//Cleaning the user table before each test
beforeEach(() => {
  simulateSmtpFailure = false;
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

afterAll(async () => {
  await server.close();
});

const postUser = async (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) {
    agent.set('Accept-Language', options.language);
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

  it('creates user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user in inactive mode even if request body contains inactive is false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates an activationToken for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('sends an Account activation email with activationToken', async () => {
    await postUser();

    //with nodemailer
    // const lastMail = nodemailerStub.interactsWithMail.lastMail();
    // expect(lastMail.to[0]).toBe('user1@mail.com');
    // const users = await User.findAll();
    // const savedUser = users[0];
    // expect(lastMail.content).toContain(savedUser.activationToken);

    //with SMTPServer
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail).toContain('user1@mail.com');
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it(`returns 502 Bad Gateaway when email fails`, async () => {
    //with mock
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // const response = await postUser();
    // expect(response.status).toBe(502);
    // mockSendAccountActivation.mockRestore();

    //with server
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.status).toBe(502);
  });

  it(`returns email failure message when email fails`, async () => {
    //with mock
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // const response = await postUser();
    // mockSendAccountActivation.mockRestore();
    // expect(response.body.message).toBe('Email failure');

    //with server
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.body.message).toBe('Email failure');
  });

  //fails
  it(`does not save user to database if activation mail fails`, async () => {
    //with mock
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // await postUser();
    // mockSendAccountActivation.mockRestore();
    // const users = await User.findAll();
    // expect(users.length).toBe(0);

    //with server
    simulateSmtpFailure = true;
    await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  it('returns Validation Failure in error response body if validation fails', async ()  => {
    await postUser(
      {
        username: null,
        email: validUser.email,
        password: 'P4ssword'
      }
    );
    expect(response.body.message).toBe('Validation Failure');
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
  const user_create_success = 'Ο χρήστης δημιουργήθηκε επιτυχώς';
  const email_failure = 'Η αποστολή του email απέτυχε';
  const validation_failure = 'Λάθος στοιχεία'

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
      const response = await postUser(user, { language: 'gr' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`returns ${email_inuse} when the same email is already in use when greek is set as language`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'gr' });
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`returns success message of ${user_create_success} when signup request is in greek`, async () => {
    const response = await postUser({ ...validUser }, { language: 'gr' });
    expect(response.body.message).toBe(user_create_success);
  });

  it(`returns ${email_failure} message when email fails and language is greek`, async () => {
    //with mock
    // const mockSendAccountActivation = jest
    //   .spyOn(EmailService, 'sendAccountActivation')
    //   .mockRejectedValue({ message: 'Failed to deliver email' });
    // const response = await postUser({ ...validUser }, { language: 'gr' });
    // mockSendAccountActivation.mockRestore();
    // expect(response.body.message).toBe(email_failure);

    //with server
    simulateSmtpFailure = true;
    const response = await ({ ...validUser }, { language: 'gr' });
    expect(response.body.message).toBe(email_failure);
  });

  it(`returns ${validation_failure} message when sending email fails and language id greek`, async() =>{
    const response = await postUser(
      {
        username: null,
        email: validUser.email,
        password: 'P4ssword'
      },
      {
        language: 'gr'
      }
    );
    expect(response.body.message).toBe(validation_failure);
  })
});

describe('Account activation', () => {
  it('activates the account when correct token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('removes the token from user table after successfull activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });

  it('does not activate the acoount when token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';
    let users = await User.findAll();

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('returns bad request when token is wrong', async () => {
    await postUser();
    const token = 'this-token-does-not-exist';

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });

  it.each`
    language | tokenStatus  | message
    ${'tr'}  | ${'wrong'}   | ${tr.account_activation_failure}
    ${'en'}  | ${'wrong'}   | ${en.account_activation_failure}
    ${'tr'}  | ${'correct'} | ${tr.account_activation_success}
    ${'en'}  | ${'correct'} | ${en.account_activation_success}
  `(
    'returns $message when token is $tokenStatus and language is $language',
    async ({ language, tokenStatus, message }) => {
      await postUser();
      let token = 'this-token-does-not-exist';
      if (tokenStatus === 'correct') {
        let users = await User.findAll();
        token = users[0].activationToken;
      }
      const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .set('Accept-Language', language)
        .send();
      expect(response.body.message).toBe(message);
    }
  );
});

describe('Error Model', () => {
  it('returns path, timestamp, message and validationErrors in response when validation failure', async () => {
    const response = await postUser({ ...validUser, username: null });
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message', 'validationErrors']);
  });

  it('returns path, timestamp and message in response when request fails other than validation error', async () => {
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(Object.keys(body)).toEqual(['path', 'timestamp', 'message']);
  });

  it('returns path in error body', async () => {
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(body.path).toEqual('/api/1.0/users/token/' + token);
  });

  
  it('returns timestamp in milliseconds within 5 seconds value in error body', async () => {
    const nowInMillis = new Date().getTime(); //current time
    const fiveSecondsLater = nowInMillis + 5 * 1000;
    const token = 'this-token-does-not-exist';
    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const body = response.body;
    expect(body.timestamp).toBeGreaterThan(nowInMillis);
    expect(body.timestamp).toBeLessThan(fiveSecondsLater);
  });
});
