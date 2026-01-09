import "dotenv/config";
import { dbClient } from "@db/client.js";
import { users, address, parcel, driver, notification, parcelSensorData } from "@db/schema.js";
import cors from "cors";
import Debug from "debug";
import { eq, sql } from "drizzle-orm";
import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { desc } from "drizzle-orm";
import e from "cors";
import fs from 'fs/promises';
import path from "path";

const debug = Debug("pf-backend");
const app = express();

const JWT_SECRET =
  process.env.JWT_SECRET || "34tgefdswe345t6y4e5htndbfgdder45tyhertw";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    iat?: number;
    exp?: number;
  };
}

app.use(morgan("dev"));
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    token = req.cookies?.auth_token;
  }

  if (!token) {
    res.status(401).json({ msg: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, user: any) => {
    if (err) {
      res.status(403).json({ msg: "Invalid or expired token" });
      return;
    }
    req.user = user;
    next();
  });
};

function generateTrackingNumber(): string {
  const digits = Math.floor(1000000000000 + Math.random() * 9000000000000);
  return `#${digits}`;
}

// SIGNIN
app.post("/signin", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    if (!email || !password) {
      res.status(400).json({
        msg: "Email and password are required",
      });
      return;
    }

    const userResult = await dbClient.query.users.findMany({
      where: eq(users.email, email),
    });

    if (userResult.length === 0) {
      res.status(401).json({
        msg: "Invalid email or password",
      });
      return;
    }

    const user = userResult[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        msg: "Invalid email or password",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("auth_token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie(
      "user_data",
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    next(err);
  }
});

// LOGOUT
app.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("auth_token");
  res.clearCookie("user_data");
  res.json({ msg: "Logged out successfully" });
});

app.post(
  "/verify-token",
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      msg: "Token is valid",
      user: req.user,
    });
  }
);

// GET users
app.get("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await dbClient.select().from(users);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// CREATE users
app.post("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      password,
    }: { name: string; email: string; password: string } = req.body;
    if (!name || !email || !password) throw new Error("Missing fields");

    const existingUser = await dbClient.query.users.findMany({
      where: eq(users.email, email),
    });

    if (existingUser.length > 0) {
      res.status(409).json({ msg: "Email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbClient
      .insert(users)
      .values({ name, email, password: hashedPassword })
      .returning();
    res.json({ msg: "User created", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE users
app.patch(
  "/users/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, password } = req.body;

      if (!id) {
        res.status(400).json({ msg: "Missing id" });
        return;
      }

      const exists = await dbClient.query.users.findMany({
        where: eq(users.id, id),
      });
      if (exists.length === 0) {
        res.status(404).json({ msg: "User not found" });
        return;
      }

      if (req.user?.userId !== id) {
        res.status(403).json({ msg: "Unauthorized" });
        return;
      }

      const updateData: { name?: string; email?: string; password?: string } =
        {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (password !== undefined) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const result = await dbClient
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      res.cookie(
        "user_data",
        JSON.stringify({
          id: result[0].id,
          name: result[0].name,
          email: result[0].email,
          createdAt: result[0].createdAt,
        }),
        {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }
      );

      res.json({ msg: "User updated", data: result[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE users
app.delete(
  "/users",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id }: { id: string } = req.body;
      if (!id) throw new Error("Missing id");

      const exists = await dbClient.query.users.findMany({
        where: eq(users.id, id),
      });
      if (exists.length === 0) throw new Error("Invalid id");

      await dbClient.delete(users).where(eq(users.id, id));
      res.json({ msg: "User deleted", data: { id } });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== DRIVER ROUTES ====================

// GET all drivers
app.get(
  "/driver",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const drivers = await dbClient.query.driver.findMany({
        orderBy: [desc(driver.createdAt)],
      });
      res.json(drivers);
    } catch (err) {
      next(err);
    }
  }
);

// CREATE driver
app.post(
  "/driver",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, regNumber, imageUrl, email, phoneNumber } = req.body;

      if (!name) {
        res.status(400).json({ msg: "Name is required" });
        return;
      }

      const result = await dbClient
        .insert(driver)
        .values({
          name,
          regNumber: regNumber || null,
          imageUrl: imageUrl || null,
          email: email || null,
          phoneNumber: phoneNumber || null,
        })
        .returning();

      res.json({ msg: "Driver created", data: result[0] });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE driver
app.patch(
  "/driver/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, regNumber, imageUrl, email, phoneNumber } = req.body;

      if (!id) {
        res.status(400).json({ msg: "Missing id" });
        return;
      }

      const exists = await dbClient.query.driver.findMany({
        where: eq(driver.id, id),
      });

      if (exists.length === 0) {
        res.status(404).json({ msg: "Driver not found" });
        return;
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (regNumber !== undefined) updateData.regNumber = regNumber;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (email !== undefined) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

      const result = await dbClient
        .update(driver)
        .set(updateData)
        .where(eq(driver.id, id))
        .returning();

      res.json({ msg: "Driver updated", data: result[0] });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE driver
app.delete(
  "/driver/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ msg: "Missing id" });
        return;
      }

      const exists = await dbClient.query.driver.findMany({
        where: eq(driver.id, id),
      });

      if (exists.length === 0) {
        res.status(404).json({ msg: "Driver not found" });
        return;
      }

      await dbClient.delete(driver).where(eq(driver.id, id));
      res.json({ msg: "Driver deleted", data: { id } });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== ADDRESS ROUTES ====================

// GET saved address
app.get(
  "/address",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId, saved } = req.query;

      if (!userId) {
        res.status(400).json({ error: "userId is required" });
        return;
      }

      const isSaved = saved === "true";

      const results = await dbClient.query.address.findMany({
        where: (address, { eq, and }) =>
          and(
            eq(address.userId, userId as string),
            eq(address.isSaved, isSaved)
          ),
        orderBy: (address, { desc }) => [desc(address.createdAt)],
      });

      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// CREATE address
app.post(
  "/address",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        name,
        company,
        email,
        phoneNumber,
        type,
        address: addr,
        province,
        district,
        subdistrict,
        postalCode,
        isSaved,
      } = req.body;

      if (!userId || !name || !addr) throw new Error("Missing fields");

      const result = await dbClient
        .insert(address)
        .values({
          userId,
          name,
          company,
          email,
          phoneNumber,
          type,
          address: addr,
          province,
          district,
          subdistrict,
          postalCode,
          isSaved,
        })
        .returning({ id: address.id });
      res.json({ msg: "Address created", data: result[0] });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE address
app.patch(
  "/address/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const allowedFields = [
        "name",
        "company",
        "email",
        "phoneNumber",
        "type",
        "address",
        "province",
        "district",
        "subdistrict",
        "postalCode",
        "isSaved",
      ];

      const updateData: any = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const exists = await dbClient.query.address.findMany({
        where: eq(address.id, id),
      });

      if (!exists.length) {
        return res.status(404).json({ msg: "Address not found" });
      }

      const result = await dbClient
        .update(address)
        .set(updateData)
        .where(eq(address.id, id))
        .returning();

      res.json({ msg: "Address updated", data: result[0] });
    } catch (err: any) {
      console.error("Update error:", err);
      res.status(500).json({ msg: err.message });
    }
  }
);

// DELETE address by id
app.delete(
  "/address/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ msg: "Missing id" });

      const exists = await dbClient.query.address.findMany({
        where: eq(address.id, id),
      });
      if (exists.length === 0)
        return res.status(404).json({ msg: "Address not found" });

      await dbClient.delete(address).where(eq(address.id, id));
      res.json({ msg: "Address deleted", data: { id } });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== PARCEL ROUTES ====================

// GET parcel by tracking number (public - ไม่ต้อง login)
app.get(
  "/parcel/track/:trackingNo",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { trackingNo } = req.params;

      if (!trackingNo) {
        res.status(400).json({ error: "trackingNo is required" });
        return;
      }

      const result = await dbClient.query.parcel.findFirst({
        where: eq(parcel.trackingNo, trackingNo),
      });

      if (!result) {
        res.status(404).json({ error: "Parcel not found" });
        return;
      }

      let senderAddress = null;
      let recipientAddress = null;
      let driverData = null;

      if (result.senderAddressId) {
        const sender = await dbClient.query.address.findFirst({
          where: eq(address.id, result.senderAddressId),
        });
        if (sender) {
          senderAddress = {
            id: sender.id,
            name: sender.name,
            company: sender.company,
          };
        }
      }

      if (result.recipientAddressId) {
        const recipient = await dbClient.query.address.findFirst({
          where: eq(address.id, result.recipientAddressId),
        });
        if (recipient) {
          recipientAddress = {
            id: recipient.id,
            name: recipient.name,
            company: recipient.company,
            address: recipient.address,
            province: recipient.province,
            district: recipient.district,
            subdistrict: recipient.subdistrict,
            postalCode: recipient.postalCode,
            email: recipient.email,
            phoneNumber: recipient.phoneNumber,
          };
        }
      }

      if (result.driverId) {
        const driverInfo = await dbClient.query.driver.findFirst({
          where: eq(driver.id, result.driverId),
        });
        if (driverInfo) {
          driverData = {
            id: driverInfo.id,
            name: driverInfo.name,
            regNumber: driverInfo.regNumber,
            email: driverInfo.email,
            phoneNumber: driverInfo.phoneNumber,
          };
        }
      }

      res.json({
        id: result.id,
        trackingNo: result.trackingNo,
        isDelivered: result.isDelivered,
        isShipped: result.isShipped,
        createdAt: result.createdAt,
        shippedAt: result.shippedAt,
        deliveredAt: result.deliveredAt,
        parcelName: result.parcelName,
        quantity: result.quantity,
        weight: result.weight,
        signature: result.signature,
        signedAt: result.signedAt,
        temperatureRangeMin: result.temperatureRangeMin,
        temperatureRangeMax: result.temperatureRangeMax,
        senderAddress,
        recipientAddress,
        driver: driverData,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET parcel (user)
app.get(
  "/parcel",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "userId is required" });

      const parcels = await dbClient.query.parcel.findMany({
        where: eq(parcel.userId, userId as string),
        orderBy: [desc(parcel.createdAt)],
      });

      const addressIds = new Set<string>();
      parcels.forEach((p) => {
        if (p.senderAddressId) addressIds.add(p.senderAddressId);
        if (p.recipientAddressId) addressIds.add(p.recipientAddressId);
      });

      const driverIds = new Set<string>();
      parcels.forEach((p) => {
        if (p.driverId) driverIds.add(p.driverId);
      });

      const addresses = await dbClient.query.address.findMany({
        where: (address, { inArray }) =>
          inArray(address.id, Array.from(addressIds)),
      });

      const drivers = await dbClient.query.driver.findMany({
        where: (driver, { inArray }) =>
          inArray(driver.id, Array.from(driverIds)),
      });

      const addressMap = new Map(addresses.map((a) => [a.id, a]));
      const driverMap = new Map(drivers.map((d) => [d.id, d]));

      const results = parcels.map((p) => ({
        id: p.id,
        trackingNo: p.trackingNo,
        isDelivered: p.isDelivered,
        isShipped: p.isShipped,
        driverId: p.driverId,
        createdAt: p.createdAt,
        shippedAt: p.shippedAt,
        deliveredAt: p.deliveredAt,
        signature: p.signature, 
        signedAt: p.signedAt,
        parcelName: p.parcelName,
        quantity: p.quantity,
        weight: p.weight,
        dimensionLength: p.dimensionLength,
        dimensionWidth: p.dimensionWidth,
        dimensionHeight: p.dimensionHeight,
        temperatureRangeMin: p.temperatureRangeMin,
        temperatureRangeMax: p.temperatureRangeMax,
        specialNotes: p.specialNotes,
        senderAddress: p.senderAddressId
          ? {
              id: addressMap.get(p.senderAddressId)?.id,
              name: addressMap.get(p.senderAddressId)?.name,
              company: addressMap.get(p.senderAddressId)?.company,
            }
          : null,
        recipientAddress: p.recipientAddressId
          ? {
              id: addressMap.get(p.recipientAddressId)?.id,
              name: addressMap.get(p.recipientAddressId)?.name,
              company: addressMap.get(p.recipientAddressId)?.company,
              address: addressMap.get(p.recipientAddressId)?.address,
              province: addressMap.get(p.recipientAddressId)?.province,
              district: addressMap.get(p.recipientAddressId)?.district,
              subdistrict: addressMap.get(p.recipientAddressId)?.subdistrict,
              postalCode: addressMap.get(p.recipientAddressId)?.postalCode,
              email: addressMap.get(p.recipientAddressId)?.email,
              phoneNumber: addressMap.get(p.recipientAddressId)
                ?.phoneNumber,
            }
          : null,
        driver: p.driverId
          ? {
              id: driverMap.get(p.driverId)?.id,
              name: driverMap.get(p.driverId)?.name,
              regNumber: driverMap.get(p.driverId)?.regNumber,
              email: driverMap.get(p.driverId)?.email,
              phoneNumber: driverMap.get(p.driverId)?.phoneNumber,
            }
          : null,
      }));

      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// GET all parcels (admin)
app.get(
  "/parcel/all",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parcels = await dbClient.query.parcel.findMany({
        orderBy: [desc(parcel.createdAt)],
      });

      const addressIds = new Set<string>();
      parcels.forEach((p) => {
        if (p.senderAddressId) addressIds.add(p.senderAddressId);
        if (p.recipientAddressId) addressIds.add(p.recipientAddressId);
      });

      const addresses = await dbClient.query.address.findMany({
        where: (address, { inArray }) =>
          inArray(address.id, Array.from(addressIds)),
      });

      const addressMap = new Map(addresses.map((a) => [a.id, a]));

      const results = parcels.map((p) => ({
        id: p.id,
        trackingNo: p.trackingNo,
        isDelivered: p.isDelivered,
        isShipped: p.isShipped,
        driverId: p.driverId,
        createdAt: p.createdAt,
        shippedAt: p.shippedAt, 
        deliveredAt: p.deliveredAt,
        signedAt: p.signedAt,
        parcelName: p.parcelName,
        quantity: p.quantity,
        weight: p.weight,
        temperatureRangeMin: p.temperatureRangeMin,
        temperatureRangeMax: p.temperatureRangeMax,
       
        senderAddress: p.senderAddressId
          ? {
              id: addressMap.get(p.senderAddressId)?.id,
              name: addressMap.get(p.senderAddressId)?.name,
              company: addressMap.get(p.senderAddressId)?.company,
            }
          : null,
        recipientAddress: p.recipientAddressId
          ? {
              id: addressMap.get(p.recipientAddressId)?.id,
              name: addressMap.get(p.recipientAddressId)?.name,
              company: addressMap.get(p.recipientAddressId)?.company,
              address: addressMap.get(p.recipientAddressId)?.address,
              province: addressMap.get(p.recipientAddressId)?.province,
              district: addressMap.get(p.recipientAddressId)?.district,
              subdistrict: addressMap.get(p.recipientAddressId)?.subdistrict,
              postalCode: addressMap.get(p.recipientAddressId)?.postalCode,
              email: addressMap.get(p.recipientAddressId)?.email,
              phoneNumber: addressMap.get(p.recipientAddressId)
                ?.phoneNumber,
            }
          : null,
        
      }));

      res.json(results);
    } catch (err) {
      next(err);
    }
  }
);

// CREATE parcel
app.post(
  "/parcel",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        senderAddressId,
        recipientAddressId,
        parcelName,
        quantity,
        weight,
        dimensionLength,
        dimensionWidth,
        dimensionHeight,
        temperatureRangeMin,
        temperatureRangeMax,
     
        specialNotes,
      } = req.body;

      if (!userId || !parcelName || !quantity || !weight) {
        throw new Error("Missing required parcel fields");
      }

      let trackingNo = generateTrackingNumber();
      let exists = await dbClient.query.parcel.findMany({
        where: eq(parcel.trackingNo, trackingNo),
      });

      while (exists.length > 0) {
        trackingNo = generateTrackingNumber();
        exists = await dbClient.query.parcel.findMany({
          where: eq(parcel.trackingNo, trackingNo),
        });
      }

      const result = await dbClient
        .insert(parcel)
        .values({
          userId,
          trackingNo,
          senderAddressId,
          recipientAddressId,
          parcelName,
          quantity: Number(quantity),
          weight: Number(weight),
          dimensionLength: dimensionLength ? Number(dimensionLength) : null,
          dimensionWidth: dimensionWidth ? Number(dimensionWidth) : null,
          dimensionHeight: dimensionHeight ? Number(dimensionHeight) : null,
          temperatureRangeMin: temperatureRangeMin
            ? Number(temperatureRangeMin)
            : null,
          temperatureRangeMax: temperatureRangeMax
            ? Number(temperatureRangeMax)
            : null,
          
          specialNotes: specialNotes || null,
          isDelivered: false,
          isShipped: false,
        })
        .returning();

      res.json({ msg: "Parcel created", data: result[0] });
    } catch (err) {
      next(err);
    }
  }
);

// POST /parcel/:id/signature - Save signature for delivered parcel
app.post(
  "/parcel/:id/signature",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { signature } = req.body;

      if (!id) {
        res.status(400).json({ msg: "Missing parcel id" });
        return;
      }

      if (!signature) {
        res.status(400).json({ msg: "Signature is required" });
        return;
      }

      const exists = await dbClient.query.parcel.findFirst({
        where: eq(parcel.id, id),
      });

      if (!exists) {
        res.status(404).json({ msg: "Parcel not found" });
        return;
      }

      if (!exists.isDelivered) {
        res.status(400).json({ msg: "Parcel must be delivered before signing" });
        return;
      }

      const result = await dbClient
        .update(parcel)
        .set({
          signature: signature,
          signedAt: sql`NOW()`,
        })
        .where(eq(parcel.id, id))
        .returning();

      console.log("Signature saved for parcel:", result[0].trackingNo);

      res.json({
        msg: "Signature saved successfully",
        data: result[0],
      });
    } catch (err: any) {
      console.error("Error saving signature:", err);
      next(err);
    }
  }
);

// UPDATE parcel by ID (support driverId and isShipped)
app.patch(
  "/parcel/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ msg: "Missing parcel id" });
        return;
      }

      const exists = await dbClient.query.parcel.findFirst({
        where: eq(parcel.id, id),
      });

      if (!exists) {
        res.status(404).json({ msg: "Parcel not found" });
        return;
      }

      const allowedFields = [
        "parcelName",
        "quantity",
        "weight",
        "dimensionLength",
        "dimensionWidth",
        "dimensionHeight",
        "temperatureRangeMin",
        "temperatureRangeMax",
       
        "specialNotes",
        "isDelivered",
        "isShipped",
        "driverId",
      ];

      const updateData: any = {};

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      if (req.body.isShipped !== undefined) {
        if (req.body.isShipped === true) {
          if (!exists.shippedAt) {
            updateData.shippedAt = sql`NOW()`;
          }
        } else {
          updateData.shippedAt = null;
        }
      }

      if (req.body.isDelivered !== undefined) {
        if (req.body.isDelivered === true) {
          if (!exists.deliveredAt) {
            updateData.deliveredAt = sql`NOW()`;
          }
        } else {
          updateData.deliveredAt = null;
        }
      }

      console.log("Updating parcel with data:", updateData);

      const result = await dbClient
        .update(parcel)
        .set(updateData)
        .where(eq(parcel.id, id))
        .returning();

      console.log("Update result:", result[0]);

      res.json({ msg: "Parcel updated", data: result[0] });
    } catch (err: any) {
      console.error("Error updating parcel:", err);
      next(err);
    }
  }
);

// DELETE parcel
app.delete(
  "/parcel",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id }: { id: string } = req.body;
      if (!id) throw new Error("Missing id");

      const exists = await dbClient.query.parcel.findMany({
        where: eq(parcel.id, id),
      });
      if (exists.length === 0) throw new Error("Invalid id");

      await dbClient.delete(parcel).where(eq(parcel.id, id));
      res.json({ msg: "Parcel deleted", data: { id } });
    } catch (err) {
      next(err);
    }
  }
);

// GET notification status for a user
app.get(
  "/users/:userId/notification-status",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ msg: "Missing userId" });
        return;
      }

      if (req.user?.userId !== userId) {
        res.status(403).json({ msg: "Unauthorized" });
        return;
      }

      const statuses = await dbClient.query.notification.findMany({
        where: eq(notification.userId, userId),
      });

      const read: string[] = [];
      const deleted: string[] = [];

      statuses.forEach((status) => {
        if (status.isRead) read.push(status.notificationId);
        if (status.isDeleted) deleted.push(status.notificationId);
      });

      res.json({ read, deleted });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE notification status (mark as read/deleted)
app.patch(
  "/users/:userId/notification-status",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { read, deleted } = req.body;

      if (!userId) {
        res.status(400).json({ msg: "Missing userId" });
        return;
      }

      if (req.user?.userId !== userId) {
        res.status(403).json({ msg: "Unauthorized" });
        return;
      }

      if (Array.isArray(read)) {
        const allUserNotifications = await dbClient.query.notification.findMany({
          where: (n, { eq }) => eq(n.userId, userId),
        });

        const readSet = new Set(read);

        for (const notificationId of read) {
          const existing = allUserNotifications.find(
            n => n.notificationId === notificationId
          );

          if (existing) {
            await dbClient
              .update(notification)
              .set({ isRead: true, updatedAt: sql`NOW()` })
              .where(eq(notification.id, existing.id));
          } else {
            await dbClient.insert(notification).values({
              userId,
              notificationId,
              isRead: true,
              isDeleted: false,
            });
          }
        }

        for (const existing of allUserNotifications) {
          if (!readSet.has(existing.notificationId) && existing.isRead) {
            await dbClient
              .update(notification)
              .set({ isRead: false, updatedAt: sql`NOW()` })
              .where(eq(notification.id, existing.id));
          }
        }
      }

      if (Array.isArray(deleted)) {
        for (const notificationId of deleted) {
          const existing = await dbClient.query.notification.findFirst({
            where: (n, { and, eq }) =>
              and(
                eq(n.userId, userId),
                eq(n.notificationId, notificationId)
              ),
          });

          if (existing) {
            await dbClient
              .update(notification)
              .set({ isDeleted: true, updatedAt: sql`NOW()` })
              .where(eq(notification.id, existing.id));
          } else {
            await dbClient.insert(notification).values({
              userId,
              notificationId,
              isRead: false,
              isDeleted: true,
            });
          }
        }
      }

      res.json({ msg: "Notification status updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/parcel/save-sensor-data",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { trackingNo, sensorDataList } = req.body;

      if (!trackingNo || !Array.isArray(sensorDataList) || sensorDataList.length === 0) {
        res.status(400).json({ error: "Invalid request data" });
        return;
      }

      const parcelData = await dbClient.query.parcel.findFirst({
        where: eq(parcel.trackingNo, trackingNo),
      });

      if (!parcelData) {
        res.status(404).json({ error: "Parcel not found" });
        return;
      }

      if (!parcelData.deliveredAt) {
        res.status(400).json({ error: "Parcel not delivered yet" });
        return;
      }

      // สร้าง directory สำหรับเก็บไฟล์เซ็นเซอร์ (ถ้ายังไม่มี)
      const sensorDataDir = path.join(process.cwd(), 'sensor-data');
      await fs.mkdir(sensorDataDir, { recursive: true });

      // ใช้ tracking number เป็นชื่อไฟล์
      const filePath = path.join(sensorDataDir, `${trackingNo}.json`);

      // ตรวจสอบว่าไฟล์มีอยู่แล้วหรือไม่
      try {
        await fs.access(filePath);
        res.json({
          success: true,
          alreadySaved: true,
          message: "Sensor data file already exists for this parcel",
          filePath: filePath,
        });
        return;
      } catch {
        // ไฟล์ยังไม่มี ให้ดำเนินการต่อ
      }

      // จัดรูปแบบข้อมูลที่จะบันทึก
      const sensorDataToSave = {
        trackingNo,
        parcelId: parcelData.id,
        savedAt: new Date().toISOString(),
        totalRecords: sensorDataList.length,
        data: sensorDataList.map((item: any) => ({
          temperature: item.temp,
          sensorId: item.sensorId || "unknown",
          timestamp: item.timestamp,
        })),
      };

      // บันทึกลงไฟล์
      await fs.writeFile(
        filePath,
        JSON.stringify(sensorDataToSave, null, 2),
        'utf8'
      );

      console.log(`Saved ${sensorDataList.length} sensor records to file: ${filePath}`);

      res.json({
        success: true,
        alreadySaved: false,
        savedCount: sensorDataList.length,
        filePath: filePath,
      });
    } catch (error: any) {
      console.error("Error saving sensor data:", error);
      next(error);
    }
  }
);

// Endpoint เพิ่มเติม: อ่านข้อมูลเซ็นเซอร์จากไฟล์
app.get(
  "/parcel/sensor-data/:trackingNo",
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { trackingNo } = req.params;

      const sensorDataDir = path.join(process.cwd(), 'sensor-data');
      const filePath = path.join(sensorDataDir, `${trackingNo}.json`);

      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const sensorData = JSON.parse(fileContent);
        
        res.json({
          success: true,
          data: sensorData,
        });
      } catch (error) {
        res.status(404).json({ 
          success: false,
          error: "Sensor data file not found" 
        });
      }
    } catch (error: any) {
      console.error("Error reading sensor data:", error);
      next(error);
    }
  }
);



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