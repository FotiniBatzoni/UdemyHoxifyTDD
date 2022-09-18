const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const bcrypt  = require('bcrypt');
const en = require('../locales/en/translation.json');
const gr = require('../locales/gr/translation.json');
const fs = require('fs');
const path = require('path');
const config = require('config');


const { uploadDir, profileDir } = config;
const profileDirectory = path.join('.', uploadDir, profileDir);


beforeAll( async () => {
    await sequelize.sync();
});

beforeEach( async () => {
  await User.destroy({ truncate : { cascade : true} });
});

//No need for that because it runs posttest (test-cleanup)
// afterAll (() =>{

//   const files = fs.readdirSync(profileDirectory)
//   for (const file of files ){
//     fs.unlinkSync( path.join(profileDirectory, file))
//   }
// } )

const activeUser =  {
    username : 'user1',
    email : 'user1@mail.com',
    password : 'P4ssword',
    inactive : false
};

const addUser = async (user = {...activeUser}) =>{

    const hash = await bcrypt.hash(user.password,10);
    user.password = hash;
    return await User.create(user);
}

const putUser = async  (id = 5, body = null, options = {} ) => {
  let agent = request(app);
  let token;
      if(options.auth){
        const response = await agent.post('/api/1.0/auth').send(options.auth);
        token = response.body.token;

      }

     agent = request(app).put('/api/1.0/users/' + id);
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

    // const agent = request(app).put('/api/1.0/users/' + id);
    // if (options.language) {
    //     agent.set('Accept-Language', options.language)
    // }
    // if(options.auth){
    //     const { email, password } = options.auth;
    // agent.auth(email,password);

        // token
        // const merged = `${email}:${password}`;
        // const base64 = Buffer.from(merged).toString('base64');
        // agent.set('Authorization', `Basic ${base64 }`);
        //}
    //return agent.send(body);
};

const readFileAsBase64 = () =>{
  const filePath = path.join('.', '__tests__', 'resources', 'test-png.png');
  return fileInBase64 = fs.readFileSync(filePath, { encoding: 'base64'});
}


describe('User Update', () => {

    it('returns forbidden when request sent without basic authorization', async () => {
        const response = await putUser();
        expect(response.status).toBe(403);
    });

    it.each`
    language | message
    ${'gr'}    | ${gr.unauthorised_user_update} 
    ${'en'}    | ${en.unauthorised_user_update} 
    `('returns error body $message for unauthorised request when language is $language', async ({ language, message }) => {
        const nowInMillis = new Date().getTime();
        const response = await putUser(5, null, {language});
        expect(response.body.path).toBe('/api/1.0/users/5');
        expect(response.body.timestamp).toBeGreaterThan(nowInMillis);
        expect(response.body.message).toBe(message);
      });

      it('returns forbidden when request sent with incorrect email in basic authorization', async () => {
        await addUser();
        const response = await putUser( 5, null, { auth : { email: 'user1000@email.com' , password : 'P4ssword'}});
        expect(response.status).toBe(403);
      } );

      it('returns forbidden when request sent with incorrect password in basic authorization', async () => {
        await addUser();
        const response = await putUser( 5, null, { auth : { email: 'user1@email.com' , password : 'p4ssword'}});
        expect(response.status).toBe(403);
      } );

      it('returns forbidden when update request is sent with correct credentials but for different user', async () =>{ 
        await addUser();
        const userToBeUpdated = await addUser({ ...activeUser, username: 'user2', email: 'user2@gmail.com' , password: 'P4ssword'})
        const response = await putUser( userToBeUpdated.id, null, { auth : { email: 'user1@email.com' , password : 'P4ssword'}});
        expect(response.status).toBe(403);
      } );

      it('returns forbidden when update request is sent by inactive user with correct credentials but for its own user', async () =>{ 
        const inactiveUser = await addUser({...activeUser, inactive: true});
        const response = await putUser( inactiveUser.id, null, { 
            auth : { email: 'user1@email.com' , password : 'P4ssword'}
        });
        expect(response.status).toBe(403);
      } );

      it('returns 200 ok when valid update request is sent by an authorised user', async () =>{
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-updated'};
        const response =  await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});
     
        expect(response.status).toBe(200);

      });

      it('updates username in database  when valid update request is sent by an authorised user', async () =>{
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-updated'};
        await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});
     
        const inDBUser = await User.findOne({ where  : { id: savedUser.id}});

        expect(inDBUser.username).toBe(validUpdate.username);
      });

      it('returns 403 when token is not valid', async () =>{
        const response = await putUser(5,null,{ token :'123 '});
        expect(response.status).toBe(403);
      });

      it('saves the user image when update contains image as base64', async () =>{
        const fileInBase64 = readFileAsBase64();
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-updated', image : fileInBase64};
        await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});
     
        const inDBUser = await User.findOne({ where  : { id: savedUser.id}});

        expect(inDBUser.image).toBeTruthy();
      });

      it('returns success body having only id, username, email and image', async () =>{
        const fileInBase64 = readFileAsBase64();
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-updated', image : fileInBase64};
        const response =  await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});
        expect(Object.keys(response.body)).toEqual([ 'id', 'username', 'email', 'image'])
      });


      
      it('saves the user image to upload folder  and stores filename in user when update has image', async () =>{
        const fileInBase64 = readFileAsBase64();
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-updated', image : fileInBase64};
        await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});
     
        const inDBUser = await User.findOne({ where  : { id: savedUser.id}});
        const profileImagePath = path.join(profileDirectory, inDBUser.image );
        expect(fs.existsSync(profileImagePath)).toBe(true);
      }, 15000);


      it('removes the old image after user upload new one', async () =>{
        const fileInBase64 = readFileAsBase64();
        const savedUser = await addUser();
        const validUpdate = { username: 'user1-updated', image : fileInBase64};
        const response = await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});

        const firstImage = response.body.image;

        await putUser(savedUser.id, validUpdate, { auth: { email: 'user1@mail.com' , password : 'P4ssword' }});
     
        const profileImagePath = path.join(profileDirectory, firstImage );
        expect(fs.existsSync(profileImagePath)).toBe(false);
      }, 15000);
   
 })
