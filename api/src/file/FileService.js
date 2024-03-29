const fs = require('fs');
const path = require('path');
const config = require('config');
const { randomString } = require('../shared/generator');
const FileAttachment = require('./FileAttachment');
const Sequelize = require('sequelize');
const Hoax = require('../hoax/Hoax');

const { uploadDir, profileDir, attachmentDir} = config;
const profileFolder = path.join('.' , uploadDir, profileDir);
const attachmentFolder = path.join('.' , uploadDir, attachmentDir);



const createFolders = () =>{
    if(!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir);
    };
    
    if(!fs.existsSync(profileFolder)){
        fs.mkdirSync(profileFolder);
    };

    if(!fs.existsSync(attachmentFolder)){
      fs.mkdirSync(attachmentFolder);
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
  };

  const saveAttachment = async (file) =>{
    let fileType= file.mimetype;
    let ext = fileType.split('/')[1]
    let filename = `${randomString(32)}.${ext}`;
    await fs.promises.writeFile(path.join(attachmentFolder, filename), file.buffer)
    const savedAttachment = await FileAttachment.create({
      filename,
      uploadDate: new Date(),
      fileType
    });

    return {
      id: savedAttachment.id
    }

  };

  const associateFileToHoax = async( attachmentId, hoaxId ) => {
    const attachment = await FileAttachment.findOne({ where: { id: attachmentId } });
    if (!attachment) {
      return;
    }
    if (attachment.hoaxId) {
      return;
    }
    attachment.hoaxId = hoaxId;
    await attachment.save();
   
  }
 
  const removeUnusedAttachments = async () =>{
    const ONE_DAY = 24 * 60 * 60 * 1000;
    setInterval( async () =>{
      const oneDayOld = new Date(Date.now() - ONE_DAY );
      const attachments = await FileAttachment.findAll({
        where:{
          uploadDate:{
            [Sequelize.Op.lt] : oneDayOld
          },
          hoaxId :{
            [Sequelize.Op.is]: null
          }
        }
      })
  
      for(let attachment of attachments){
       const { filename} =  attachment.get({ plain: true})
       await fs.promises.unlink(path.join(attachmentFolder, filename));
       await attachment.destroy();
      }

    }, ONE_DAY)

  }

  const deleteAttachment = async (filename) => {
    const filePath = path.join(attachmentFolder, filename );
    try{
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath)
    }catch(err){

    }
  };

  const deleteUserFiles = async (user) => {
    if (user.image) {
      await deleteProfileImage(user.image);
    }
    const attachments = await FileAttachment.findAll({
      attributes: ['filename'],
      include: {
        model: Hoax,
        where: {
          userId: user.id,
        },
      },
    });
    if (attachments.length === 0) {
      return;
    }
    for (let attachment of attachments) {
      await deleteAttachment(attachment.getDataValue('filename'));
    }
  };

module.exports = {
    createFolders,
    saveProfileImage,
    deleteProfileImage,
    isLessThan2MB,
    isSupportedFileType,
    saveAttachment,
    associateFileToHoax,
    removeUnusedAttachments,
    deleteAttachment,
    deleteUserFiles
  }