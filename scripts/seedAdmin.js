import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../model/auth.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
      console.error("Error: MONGODB_URL is not set in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for admin seeding...");

    const name = process.env.ADMIN_NAME || "Akatsuki Admin";
    const email = (process.env.ADMIN_EMAIL || "admin@postevent.com").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || "AdminPassword123!";

    if (password.length < 8) {
      console.error("Admin password must be at least 8 characters long.");
      process.exit(1);
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log(`User ${email} already exists and is already an Admin.`);
      } else {
        existingUser.role = "admin";
        await existingUser.save();
        console.log(`Existing user ${email} successfully promoted to Admin role!`);
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`Admin account created successfully:`);
      console.log(` - ID: ${newAdmin._id}`);
      console.log(` - Name: ${newAdmin.name}`);
      console.log(` - Email: ${newAdmin.email}`);
      console.log(` - Role: ${newAdmin.role}`);
    }

    console.log("Seeding complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Admin Seeding Failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
