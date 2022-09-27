const request = require('supertest');
const app = require('../src/app');
const en = require('../locales/en/translation.json');
const gr = require('../locales/gr/translation.json');
const User = require('../src/user/User');
const Hoax = require('../src/hoax/Hoax');
const FileAttachment = require('../src/file/FileAttachment');
const sequelize = require('../src/config/database');
const bcrypt  = require('bcrypt');
const path =require('path');


beforeAll( async () => {
    if(process.env.NODE_ENV === 'test'){
      await sequelize.sync();
  }
  });

  beforeEach( async () => {
    await FileAttachment.destroy({ truncate: true});
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

const uploadFile = (file = 'test-png.png', options = {}) => {
  const agent = request(app).post('/api/1.0/hoaxes/attachments');
  if (options.language) {
    agent.set('Accept-Language', options.language);
  }
  return agent.attach('file', path.join('.', '__tests__', 'resources', file));
};


const postHoax = async (body = null, options ={} ) =>{
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
        const nowInMillis =new Date().getTime();
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
    });

    it('saves the hoax to database when authorized user sends valid request', async () =>{
        
        await addUser();
        await postHoax({ content: 'Hoax content' }, { auth : credentials});
        const hoaxes = await Hoax.findAll();
        expect(hoaxes.length).toBe(1)
    });

    it('saves the hoax content and timestamp to database', async () =>{
      await addUser();
      const beforeSubmit = Date.now();
      await postHoax({ content: 'Hoax content' }, { auth : credentials});
      const hoaxes = await Hoax.findAll();
      const saveHoax = hoaxes[0];
      expect(saveHoax.content).toBe('Hoax content');
      expect(saveHoax.timestamp).toBeGreaterThan(beforeSubmit);
      expect(saveHoax.timestamp).toBeLessThan(Date.now());
    });

    it.each`
    language | message
    ${'gr'}    | ${gr.hoax_submit_success} 
    ${'en'}    | ${en.hoax_submit_success} 
    `('returns $message to success submit when language is $language', async ({ language, message }) => {
       await addUser();
        const response = await postHoax({content: 'Hoax content'} , {auth: credentials, language});
        expect(response.body.message).toBe(message)
      });

    it.each`
      language | message
      ${'gr'}    | ${gr.validation_failure} 
      ${'en'}    | ${en.validation_failure} 
      `('returns 400 and $message when hoax content is less than 10 characters and language is $language', async ({ language, message }) => {
         await  addUser();
          const response = await postHoax({content: '123456789'} , {auth: credentials, language});
          expect(response.status).toBe(400)
          expect(response.body.message).toBe(message)
        });

     it('returns validation error body when an invalid hoax post by authorized user ', async () =>{
          await  addUser();
          const nowInMillis =  Date.now();
          const response = await postHoax({content: '123456789'} , {auth: credentials});
          const error = response.body;
          expect(error.timestamp).toBeGreaterThan(nowInMillis);
          expect(error.path).toBe('/api/1.0/hoaxes');
          expect(Object.keys(error)).toEqual(['path','timestamp', 'message', 'validationErrors'])
    });

    it.each`
        language | content             | contentForDescription | message
        ${'gr'}  | ${null}             | ${'null'}             | ${gr.hoax_content_size}
        ${'gr'}  | ${'a'.repeat(9)}    | ${'short'}            | ${gr.hoax_content_size}
        ${'gr'}  | ${'a'.repeat(5001)} | ${'very long'}        | ${gr.hoax_content_size}
        ${'en'}  | ${null}             | ${'null'}             | ${en.hoax_content_size}
        ${'en'}  | ${'a'.repeat(9)}    | ${'short'}            | ${en.hoax_content_size}
        ${'en'}  | ${'a'.repeat(5001)} | ${'very long '}       | ${en.hoax_content_size}
        `('returns $message when the content is $contentForDescription and language is $language', async ({ language, content, message }) => {
           await  addUser();
            const response = await postHoax({content: content} , {auth: credentials, language});
            expect(response.body.validationErrors.content).toBe(message)
    });

  it('stores hoax owner id in database', async () =>{
    const user =await addUser();
    await postHoax({content: 'Hoax content'} , {auth: credentials});

    const hoaxes = await Hoax.findAll();
    const hoax = hoaxes[0];
   expect(hoax.userId).toBe(user.id);
  });

  it('associates hoax with attachment in database', async () =>{
    const uploadResponse = await uploadFile();
    const uploadedFileId = uploadResponse.body.id;
    await addUser();
    await postHoax(
      {
        content: 'Hoax content',
        fileAttachment: uploadedFileId,
      },
      { auth: credentials }
    );
    const hoaxes = await Hoax.findAll();
    const hoax = hoaxes[0];

      // console.log('hoax.id '+hoax.id)
      // console.log('uploadedFileId '+uploadedFileId)


    const attachmentInDb = await FileAttachment.findOne({ where: { id: uploadedFileId } });

    // console.log(attachmentInDb.dataValues)
    expect(attachmentInDb.hoaxId).toBe(hoax.id);
  });

  it('returns 200 ok even the attachment does not exist', async () =>{
    await addUser();
    const response = await postHoax({ content: 'Hoax content', fileAttachment: 1000 } , {auth: credentials});
    expect(response.status).toBe(200);
  });

  it('keeps the old associated hoax when new hoax submitted with old attachment id', async () =>{
    const uploadResponse = await uploadFile();
    const uploadedFileId = uploadResponse.body.id;
    await addUser();
    await postHoax({
      content: 'Hoax content',
      fileAttachment: uploadedFileId
    } , 
    {auth: credentials}
    );

    const attachment = await FileAttachment.findOne({ where: { id: uploadedFileId}})

    await postHoax({
      content: 'Hoax content 2',
      fileAttachment: uploadedFileId
    } , 
    {auth: credentials}
    );

    const attachmentAfterSecondPost = await FileAttachment.findOne({ where: { id: uploadedFileId}})

    expect(attachment.hoaxId).toBe(attachmentAfterSecondPost.hoaxId);
  });
})