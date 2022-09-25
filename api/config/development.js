module.exports = {
    "database":{
        "database":"hoaxify",
        "username":"my-db-user",
        "password":"db-p4ss",
        "dialect":"sqlite",
        "storage":"./database.sqlite",
        "logging":false
    },
    "mail":{ 
            "host": "smpt.gmail.com",
            "port": 587,
            "secure": false,
              "auth": {
                "user": "f.batzoni@gmail.com",
                "pass": "tddcdklrokotihqg"
              }
    },
    uploadDir : 'uploads-dev',
    profileDir : 'profile',
    attachmentDir: 'attachment'
}