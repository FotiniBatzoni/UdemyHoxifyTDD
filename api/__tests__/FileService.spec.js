const FileService = require('../src/file/FileService');
const fs = require('fs');
const path = require('path');

describe('createFolders', () =>{

    it('creates upload folder', () =>{
        FileService.createFolders();
        const folderName = 'upload'
        expect(fs.existsSync(folderName)).toBe(true);
    });

    it('creates profile folder under upload folder', () =>{
        FileService.createFolders();
        const profileFolder = path.join('.','upload', 'profile');
        expect(fs.existsSync(profileFolder)).toBe(true);
    })
})