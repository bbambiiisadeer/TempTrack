import "dotenv/config";
import { dbClient } from "@db/client.js";
import { users, address, parcel } from "@db/schema.js";
import cors from "cors";
import Debug from "debug";
import { eq } from "drizzle-orm";
import type { ErrorRequestHandler } from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

const debug = Debug("pf-backend");
const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

// GET users
app.get("/users", async (req, res, next) => {
  try {
    const results = await dbClient.select().from(users);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// CREATE users
app.put("/users", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new Error("Missing fields");

    const result = await dbClient.insert(users).values({ name, email, password }).returning();
    res.json({ msg: "User created", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE users
app.patch("/users", async (req, res, next) => {
  try {
    const { id, name, email, password } = req.body;
    if (!id) throw new Error("Missing id");

    const exists = await dbClient.query.users.findMany({ where: eq(users.id, id) });
    if (exists.length === 0) throw new Error("Invalid id");

    const result = await dbClient
      .update(users)
      .set({ name, email, password })
      .where(eq(users.id, id))
      .returning();
    res.json({ msg: "User updated", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE users
app.delete("/users", async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Missing id");

    const exists = await dbClient.query.users.findMany({ where: eq(users.id, id) });
    if (exists.length === 0) throw new Error("Invalid id");

    await dbClient.delete(users).where(eq(users.id, id));
    res.json({ msg: "User deleted", data: { id } });
  } catch (err) {
    next(err);
  }
});

// GET saved address
app.get("/address", async (req, res, next) => {
  try {
    const { userId, saved } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const isSaved = saved === "true";

    const results = await dbClient.query.address.findMany({
      where: (address, { eq, and }) =>
        and(
          eq(address.userId, userId as string),
          eq(address.isSaved, isSaved)
        ),
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// CREATE address
app.post("/address", async (req, res, next) => {
  try {
    const { userId, name, company, email, phoneNumber, type, address: addr, city, state, postalCode, isSaved } = req.body;
    if (!userId || !name || !addr) throw new Error("Missing fields");

    const result = await dbClient
      .insert(address)
      .values({ userId, name, company, email, phoneNumber, type, address: addr, city, state, postalCode, isSaved })
      .returning({ id: address.id }); 
    res.json({ msg: "Address created", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE address
app.patch("/address", async (req, res, next) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) throw new Error("Missing id");

    const exists = await dbClient.query.address.findMany({ where: eq(address.id, id) });
    if (exists.length === 0) throw new Error("Invalid id");

    const result = await dbClient.update(address).set(rest).where(eq(address.id, id)).returning();
    res.json({ msg: "Address updated", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE address
app.delete("/address", async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Missing id");

    const exists = await dbClient.query.address.findMany({ where: eq(address.id, id) });
    if (exists.length === 0) throw new Error("Invalid id");

    await dbClient.delete(address).where(eq(address.id, id));
    res.json({ msg: "Address deleted", data: { id } });
  } catch (err) {
    next(err);
  }
});

// GET pracel
app.get("/parcel", async (req, res, next) => {
  try {
    const results = await dbClient.query.parcel.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// CREATE pracel
app.post("/parcel", async (req, res, next) => {
  try {
    const { senderAddressId, recipientAddressId, parcelName, quantity, weight, dimensionLength, dimensionWidth, dimensionHeight, temperatureRangeMin, temperatureRangeMax, allowedDeviation, specialNotes } = req.body;

    if (!parcelName || !quantity || !weight) throw new Error("Missing required parcel fields");

    const result = await dbClient
      .insert(parcel)
      .values({ senderAddressId, recipientAddressId, parcelName, quantity, weight, dimensionLength, dimensionWidth, dimensionHeight, temperatureRangeMin, temperatureRangeMax, allowedDeviation, specialNotes })
      .returning();
    res.json({ msg: "Parcel created", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE pracel
app.patch("/parcel", async (req, res, next) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) throw new Error("Missing id");

    const exists = await dbClient.query.parcel.findMany({ where: eq(parcel.id, id) });
    if (exists.length === 0) throw new Error("Invalid id");

    const result = await dbClient.update(parcel).set(rest).where(eq(parcel.id, id)).returning();
    res.json({ msg: "Parcel updated", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE pracel
app.delete("/parcel", async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Missing id");

    const exists = await dbClient.query.parcel.findMany({ where: eq(parcel.id, id) });
    if (exists.length === 0) throw new Error("Invalid id");

    await dbClient.delete(parcel).where(eq(parcel.id, id));
    res.json({ msg: "Parcel deleted", data: { id } });
  } catch (err) {
    next(err);
  }
});

const jsonErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  debug(err.message);
  res.status(500).json({
    message: err.message || "Internal Server Error",
    type: err.name || "Error",
    stack: err.stack,
  });
};
app.use(jsonErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  debug(`Listening on port ${PORT}: http://localhost:${PORT}`);
});
