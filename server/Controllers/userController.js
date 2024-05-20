import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import {getAllUsers, getEmail, createUser, findUserByID} from '../lib/firebase.js';
import encryptResponse from '../lib/encryptresponse.js';

const createToken = (_id) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  return jwt.sign({ _id }, jwtSecretKey, { expiresIn: "3d" });
};

const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {

    if (!name || !email || !password)
      return res.status(400).jsonencryptResponse(req.body.shared, ("All fields are required..."));

    if (!validator.isEmail(email))
      return res.status(400).json(encryptResponse(req.body.shared, "Email must be a valid email..."));

    if (!validator.isStrongPassword(password))
      return res.status(400).json(encryptResponse(req.body.shared, "Password must be a strong password (Include Capital, small letter, number and special character)"));

    const user = await getEmail(email);

    if (user) return res.status(400).json(encryptResponse(req.body.shared, "User already exists..."));

    const salt = await bcrypt.genSalt(10);
    const pass_hash = await bcrypt.hash(password, salt);

    const user_newid = await createUser({name, email, pass_hash})

    const token = createToken(user_newid);

    const encrypt = encryptResponse(req.body.shared, { _id: user_newid, name, email, token })
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = await getEmail(email);

    if (!user) return res.status(400).json(encryptResponse(req.body.shared, "Invalid email or password..."));

    const validPassword = await bcrypt.compare(password, user.pass_hash);
    if (!validPassword)
      return res.status(400).json(encryptResponse(req.body.shared, "Invalid email or password..."));

    const token = createToken(user.id);

    const encrypt = encryptResponse(req.body.shared, { _id: user.id, name: user.name, email, token })
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
    
  } catch (error) {
    next(error)
  }
};

const findUser = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const user = await findUserByID(userId);

    const encrypt = encryptResponse(req.body.shared, user)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();

    const encrypt = encryptResponse(req.body.shared, users)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

export { registerUser, loginUser, findUser, getUsers };
