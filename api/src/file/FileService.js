const fs = require('fs');
const path = require('path');

const createFolders = () =>{
    const uploadDir = 'upload';
    if(!fs.existsSync(uploadDir)){
        fs.mkdirSync('upload');
    };
    const profileFolder = path.join('.' , 'upload', 'profile');
    console.log(profileFolder)
    if(!fs.existsSync(profileFolder)){
        console.log('here')
        fs.mkdirSync(profileFolder);
    };
};

module.exports = {
    createFolders
}