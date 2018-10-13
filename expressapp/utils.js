crypto = require("crypto");

module.exports.promisify = (fn)=> {
  return new Promise((resolve, reject) => {
    fn((err, res)=>{
      if (err) {
        return reject(err);
      }
      return resolve(res);
    })
  })
};


module.exports.getSHA1 = (str)=> {
  return crypto.createHash('sha1').update(str).digest('hex')
};
