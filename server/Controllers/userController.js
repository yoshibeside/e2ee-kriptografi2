import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import {getAllUsers, getEmail, createUser, findUserByID} from '../lib/firebase.js';

const createToken = (_id) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  return jwt.sign({ _id }, jwtSecretKey, { expiresIn: "3d" });
};

const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {

    if (!name || !email || !password)
      return res.status(400).json("All fields are required...");

    if (!validator.isEmail(email))
      return res.status(400).json("Email must be a valid email...");

    if (!validator.isStrongPassword(password))
      return res.status(400).json("Password must be a strong password (Include Capital, small letter, number and special character)");

    const user = await getEmail(email);

    if (user) return res.status(400).json("User already exists...");

    const salt = await bcrypt.genSalt(10);
    const pass_hash = await bcrypt.hash(password, salt);

    const user_newid = await createUser({name, email, pass_hash})

    const token = createToken(user_newid);

    res.status(200).json({ _id: user_newid, name, email, token });
  } catch (error) {
    next(error)
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = await getEmail(email);

    if (!user) return res.status(400).json("Invalid email or password...");

    const validPassword = await bcrypt.compare(password, user.pass_hash);
    if (!validPassword)
      return res.status(400).json("Invalid email or password...");

    const token = createToken(user.id);

    res.status(200).json({ _id: user.id, name: user.name, email, token });
  } catch (error) {
    next(error)
  }
};

const findUser = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const user = await findUserByID(userId);
    res.status(200).json(user);
  } catch (error) {
    next(error)
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error)
  }
};

export { registerUser, loginUser, findUser, getUsers };
