const request = require('supertest');
const app = require('../src/app');
const en = require('../locales/en/translation.json');
const gr = require('../locales/gr/translation.json');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcrypt  = require('bcrypt');


beforeAll( async () => {
    if(process.env.NODE_ENV === 'test'){
      await sequelize.sync();
  }
  });

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
};


const postHoax = async (body = null,options ={} ) =>{
    let agent = request(app);
    let token;
        if(options.auth){
          const response = await agent.post('/api/1.0/auth').send(options.auth);
          token = response.body.token;
  
        }
  
       agent = request(app).post('/api/1.0/hoaxes');
        if (options.language) {
            agent.set('Accept-Language', options.language)
        }
  
        if(token){
          agent.set('Authorization', `Bearer ${token}`)
        }
  
        if(options.token){
          agent.set('Authorization', `Bearer ${options.token}`)
        }
  
        return agent.send(body);
};


describe('Post Hoax', () =>{

    it('returns 401 when hoax post request has no authentication', async() =>{
        const response = await postHoax();
        expect(response.status).toBe(401)
    });

    it.each`
    language | message
    ${'gr'}    | ${gr.unauthorized_hoax_submit} 
    ${'en'}    | ${en.unauthorized_hoax_submit} 
    `('returns error body $message for unauthorised request when language is $language', async ({ language, message }) => {
        const nowInMillis = new Date().getTime();
        const response = await postHoax(null, {language});
        const error = response.body;
        expect(error.path).toBe('/api/1.0/hoaxes');
        expect(error.timestamp).toBeGreaterThan(nowInMillis);
        expect(error.message).toBe(message);
      });


    it('returns 200 when valid hoax submitted with authorized user', async() =>{
        await addUser();
       const response = await postHoax({ content: 'Hoax content' }, { auth : credentials});
        expect(response.status).toBe(200);
    })
})