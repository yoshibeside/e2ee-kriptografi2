import encryptResponse from "../lib/encryptresponse.js";

export const generateParam = async (req, res, next) => {
 
    try {
      const encrypt = encryptResponse(req.body.shared, {p: (100003n).toString(),q: (2n).toString(), alpha:(2n).toString()})
      res.status(200).json({encrypted: encrypt, key: req.body.shared});
    } catch (error) {
      next(error)
    }
};