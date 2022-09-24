const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const Hoax = require('../src/hoax/Hoax');
const sequelize = require('../src/config/database');
// const SMTPServer = require('smtp-server').SMTPServer;
// const en = require('../locales/en/translation.json');
// const gr = require('../locales/gr/translation.json');
// const bcrypt = require('bcrypt');
// const { response } = require('../src/app');

//to call the database before calling the tests
beforeAll(async () => {
  if(process.env.NODE_ENV === 'test'){
    await sequelize.sync();
}
  });
  
  //Cleaning the user table before each test
beforeEach(async () => {
  await User.destroy({ truncate : { cascade : true} });
  });

//   const auth = async (options = {}) => {
//     let token;
//     if (options.auth) {
//       const response = await request(app).post('/api/1.0/auth').send(options.auth);
//       token = response.body.token;
//     }
//     return token;
//   };


  
describe('Listing All Hoaxes', () => {

    const getHoaxes = () => {
        const agent = request(app).get('/api/1.0/hoaxes');
        return agent;
      };

    const addHoaxes = async ( count ) => {
    for (let i = 0; i < count; i++) {
      const user = await User.create({
        username: `user${i + 1}`,
        email: `user${i + 1}@mail.com`
      });
      await Hoax.create({
        content: `hoax content ${ i + 1}`,
        timestamp: Date.now(),
        userId: user.id
      })
    }
  };


    it('returns 200 ok when there are no user in database', async () => {
        const response = await getHoaxes();
        expect(response.status).toBe(200)
      });

    it('returns page object as response body', async () => {
        const response = await getHoaxes();
        expect(response.body).toEqual({
          content: [],
          page: 0,
          size: 10, 
          totalPages: 0,
        });
      });

    
  it('returns 10 hoaxes in page content when there are 11 users in database', async () => {
    await addHoaxes(11);
    const response = await getHoaxes();
    expect(response.body.content.length).toBe(10);
  });

  it('returns only id, content, timestamp and user object having id, username, email and inmage in content array for each hoax', async () => {
    await addHoaxes(11);
    const response = await getHoaxes();
    const hoax = response.body.content[0];
    const hoaxKeys = Object.keys(hoax);
    const userKeys = Object.keys(hoax.user);
    expect (hoaxKeys).toEqual(['id','content','timestamp', 'user']);
    expect(userKeys).toEqual(['id', 'username', 'email', 'image']);
  });

//   it('returns 2 as totalPages when there are 15 active and 7 inactive users', async () => {
//     await addHoaxes(15, 7);
//     const response = await getHoaxes();
//     expect(response.body.totalPages).toBe(2);
//   });

//   it('returns second page users and page indicator when page is set as 1 in request parameter', async () => {
//     await addHoaxes(11);
//     const response = await getHoaxes().query({ page: 1 });  //it means   request(app).get('/api/1.0/users?page=1')
//     expect(response.body.content[0].username).toBe('user11');
//     expect(response.body.page).toBe(1);
//   });

//   it('returns first page when page is set below zero as request parameter', async () => {
//     await addHoaxes(11);
//     const response = await getHoaxes().query({ page: -5 });  
//     expect(response.body.page).toBe(0);
//   });

//   it('returns 5 users and corresponding size indicator when size is set as 5 in request parameter', async () => {
//     await aaddHoaxes(11);
//     const response = await getHoaxes().query({ size: 5 });  
//     expect(response.body.content.length).toBe(5);
//     expect(response.body.size).toBe(5);
//   })

//   it('returns 10 users and corresponding size indicator when size is set as 1000 in request parameter', async () => {
//     await addHoaxes(11);
//     const response = await getHoaxes().query({ size: 1000 });  
//     expect(response.body.content.length).toBe(10);
//     expect(response.body.size).toBe(10);
//   })

//   it('returns 10 users and corresponding size indicator when size is set as 0 in request parameter', async () => {
//     await addHoaxes(11);
//     const response = await getHoaxes().query({ size: 0 });  
//     expect(response.body.content.length).toBe(10);
//     expect(response.body.size).toBe(10);
//   });

//   it('returns page as zero and size as 10 when non numeric query params provide for both', async () => {
//     await addHoaxes(11);
//     const response = await getHoaxes().query({ size: 'size', page : 'page' });  
//     expect(response.body.size).toBe(10);
//     expect(response.body.page).toBe(0);
//   });

  //doesnt work
//   it('returns user page without logged in user when request has valid authorization', async () => {
//     await addHoaxes(11);
//     const token = await auth({ auth: { email: 'user1@mail.com', password: 'P4ssword' } });
  
//     const response = await getHoaxes({ token: token });

//     expect(response.body.totalPages).toBe(1);
//   })
});

// describe('Get User', () => {

//     const getUser = (id = 5) => {
//         return request(app).get('/api/1.0/users/' + id);
//     };

//     it('returns 404 when user not found', async () => {
//         const response = await getUser();
//         expect(response.status).toBe(404);
//       });

//     it.each`
//     language | message
//     ${'gr'}    | ${gr.user_not_found} 
//     ${'en'}    | ${en.user_not_found} 
//     `('returns $message for unknown user when language is set to $language', async ({ language, message }) => {
//         const response = await getUser().set('Accept-Language', language);
//         expect(response.body.message).toBe(message);
//       });
      
//       it('returns proper error body when user not found', async () => {
//         const nowInMillis = new Date().getTime();
//         const response = await getUser();
//         const error = response.body;
//         expect(error.path).toBe('/api/1.0/users/5');
//         expect(error.timestamp).toBeGreaterThan(nowInMillis);
//         expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
//       });

//       it('returns 200 when an active user exist', async () => {
//         const user = await User.create({
//           username: 'user1',
//           email: 'user1@mail.com',
//           inactive: false,
//         });
//         const response = await getUser(user.id);
//         expect(response.status).toBe(200);
//       });

//       it('returns id, username, email and image in response body when an active user exist', async () => {
//         const user = await User.create({
//           username: 'user1',
//           email: 'user1@mail.com',
//           inactive: false,
//         });
//         const response = await getUser(user.id);
//         expect(Object.keys(response.body)).toEqual(['id', 'username', 'email', 'image']);
//       });

//       it('returns 404 when the user is inactive', async () => {
//         const user = await User.create({
//           username: 'user1',
//           email: 'user1@mail.com',
//           inactive: true,
//         });
//         const response = await getUser(user.id);
//         expect(response.status).toBe(404);
//       });
// })