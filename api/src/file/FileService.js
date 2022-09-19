const fs = require('fs');
const path = require('path');
const config = require('config');
const { randomString } = require('../shared/generator');
const { uploadDir, profileDir} = config;
const profileFolder = path.join('.' , uploadDir, profileDir);


const createFolders = () =>{
    if(!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir);
    };
    
    if(!fs.existsSync(profileFolder)){
        fs.mkdirSync(profileFolder);
    };
};


const saveProfileImage = async (base64File) =>{
    const filename = randomString(32);
    const filePath = path.join( profileFolder, filename);


    //fs.writeFileSync(filePath, base64File, { encoding : 'base64 '});
    await fs.promises.writeFile( `${filePath}`, `${base64File}`, 'base64')
    return filename;
};


const deleteProfileImage = async (filename) =>{
    const filePath = path.join(profileFolder, filename);
    await fs.promises.unlink(filePath)
}

const isLessThan2MB = (buffer) =>{
    return buffer.length < 2 * 1024 * 1024
  }
  
  const isSupportedFileType = async (ext) =>{
    const type = ext;
    if(!type){
      return false
    };
    if(type === 'png' || type === 'jpg' || type === 'jpeg'){
      return true
    };
    return false;
    //return !type ? false : type === 'png' || type === 'jpg' || type === 'jpeg
  }
  

module.exports = {
    createFolders,
    saveProfileImage,
    deleteProfileImage,
    isLessThan2MB,
    isSupportedFileType
}