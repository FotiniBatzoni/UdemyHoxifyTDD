const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const Hoax = require('../src/hoax/Hoax');
const bcrypt  = require('bcrypt');
const en = require('../locales/en/translation.json');
const gr = require('../locales/gr/translation.json');




beforeEach( async () => {
    await User.destroy({ truncate : { cascade : true} });
});

const activeUser =  {
    username : 'user1',
    email : 'user1@mail.com',
    password : 'P4ssword',
    inactive : false
};

const credentials = {email: 'user1@mail.com', password:'P4ssword'};

const addUser = async (user = {...activeUser}) =>{

    const hash = await bcrypt.hash(user.password,10);
    user.password = hash;
    return await User.create(user);
}

const auth = async (options = {}) => {
    let token;
    if (options.auth) {
      const response = await request(app).post('/api/1.0/auth').send(options.auth);
      token = response.body.token;

    
    }
    return token;
  };

const deleteHoax = async  (id = 5, options = {} ) => {
  const agent = request(app).delete('/api/1.0/hoaxes/' + id);
      if (options.language) {
          agent.set('Accept-Language', options.language)
      }
      if(options.token){
        agent.set('Authorization', `Bearer ${options.token}`)
      }

      return agent.send();
}

describe('Delete Hoax', () =>{
    it('returns 403 when request is unauthorised', async () =>{
        const response = await deleteHoax();
        expect(response.status).toBe(403);
    });

    it('returns 403 when token is invalid', async () =>{
        const response = await deleteHoax(5, { token : 'abcde'});
        expect(response.status).toBe(403);
    });

    it.each`
    language | message
    ${'gr'}    | ${gr.unauthorized_hoax_delete} 
    ${'en'}    | ${en.unauthorized_hoax_delete} 
    `('returns error body $message for unauthorised request when language is $language', async ({ language, message }) => {
        const nowInMillis = new Date().getTime();
        const response = await deleteHoax(5, {language});
        expect(response.body.path).toBe('/api/1.0/hoaxes/5');
        expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
        expect(response.body.message).toBe(message);
      });
})

