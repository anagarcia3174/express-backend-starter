import mongoose from "mongoose";
import { mongoConfig } from "../src/config/mongo.config";

export const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect(mongoConfig.testUrl);
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};