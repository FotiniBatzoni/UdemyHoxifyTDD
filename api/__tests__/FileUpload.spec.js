const request = require('supertest');
const app = require('../src/app');
const path = require('path');



describe('Upload File For Hoax', () =>{
    it('returns 200 ok  after successful upload', async () =>{
      const response =  await request(app)
        .post('/api/1.0/hoaxes/attachments')
        .attach('file', path.join('.', '__tests___','resources','test-png.png'));
        expect(response.status).toBe(200);
    })
})