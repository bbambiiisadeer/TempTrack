import "dotenv/config";
import { dbClient } from "@db/client.js";
import { users, address, parcel, driver, notification } from "@db/schema.js";
import cors from "cors";
import Debug from "debug";
import { eq } from "drizzle-orm";
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
        signature: result.signature,        // เพิ่มบรรทัดนี้
        signedAt: result.signedAt,          // เพิ่มบรรทัดนี้
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

      // Collect all address IDs
      const addressIds = new Set<string>();
      parcels.forEach((p) => {
        if (p.senderAddressId) addressIds.add(p.senderAddressId);
        if (p.recipientAddressId) addressIds.add(p.recipientAddressId);
      });

      // Collect all driver IDs
      const driverIds = new Set<string>();
      parcels.forEach((p) => {
        if (p.driverId) driverIds.add(p.driverId);
      });

      // Fetch addresses
      const addresses = await dbClient.query.address.findMany({
        where: (address, { inArray }) =>
          inArray(address.id, Array.from(addressIds)),
      });

      // Fetch drivers
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
        shippedAt: p.shippedAt, // เพิ่มบรรทัดนี้
        deliveredAt: p.deliveredAt, // เพิ่มบรรทัดนี้
        parcelName: p.parcelName,
        quantity: p.quantity,
        weight: p.weight,
        dimensionLength: p.dimensionLength,
        dimensionWidth: p.dimensionWidth,
        dimensionHeight: p.dimensionHeight,
        temperatureRangeMin: p.temperatureRangeMin,
        temperatureRangeMax: p.temperatureRangeMax,
        allowedDeviation: p.allowedDeviation,
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
        shippedAt: p.shippedAt, // เพิ่มบรรทัดนี้
        deliveredAt: p.deliveredAt, // เพิ่มบรรทัดนี้
        parcelName: p.parcelName,
        quantity: p.quantity,
        weight: p.weight,
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
        allowedDeviation,
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
          allowedDeviation: allowedDeviation ? Number(allowedDeviation) : null,
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

      // Check if parcel exists
      const exists = await dbClient.query.parcel.findFirst({
        where: eq(parcel.id, id),
      });

      if (!exists) {
        res.status(404).json({ msg: "Parcel not found" });
        return;
      }

      // Check if parcel is delivered
      if (!exists.isDelivered) {
        res.status(400).json({ msg: "Parcel must be delivered before signing" });
        return;
      }

      // Update parcel with signature
      const result = await dbClient
        .update(parcel)
        .set({
          signature: signature,
          signedAt: new Date(),
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
        "allowedDeviation",
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

      // จัดการ timestamp สำหรับ isShipped
      if (req.body.isShipped !== undefined) {
        if (req.body.isShipped === true) {
          // Set shippedAt เฉพาะเมื่อยังไม่มีค่า
          if (!exists.shippedAt) {
            updateData.shippedAt = new Date(); // ใช้ new Date() ตรงๆ
          }
        } else {
          // Clear shippedAt เมื่อ unset
          updateData.shippedAt = null;
        }
      }

      // จัดการ timestamp สำหรับ isDelivered
      if (req.body.isDelivered !== undefined) {
        if (req.body.isDelivered === true) {
          // Set deliveredAt เฉพาะเมื่อยังไม่มีค่า
          if (!exists.deliveredAt) {
            updateData.deliveredAt = new Date(); // ใช้ new Date() ตรงๆ
          }
        } else {
          // Clear deliveredAt เมื่อ unset
          updateData.deliveredAt = null;
        }
      }

      console.log("Updating parcel with data:", updateData); // เพิ่ม log

      const result = await dbClient
        .update(parcel)
        .set(updateData)
        .where(eq(parcel.id, id))
        .returning();

      console.log("Update result:", result[0]); // เพิ่ม log

      res.json({ msg: "Parcel updated", data: result[0] });
    } catch (err: any) {
      console.error("Error updating parcel:", err); // เพิ่ม log
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

      // ตรวจสอบว่าเป็น user เดียวกัน
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

      // ตรวจสอบว่าเป็น user เดียวกัน
      if (req.user?.userId !== userId) {
        res.status(403).json({ msg: "Unauthorized" });
        return;
      }

      // อัพเดท read status
      if (Array.isArray(read)) {
        // ดึง notifications ทั้งหมดของ user นี้
        const allUserNotifications = await dbClient.query.notification.findMany({
          where: (n, { eq }) => eq(n.userId, userId),
        });

        const readSet = new Set(read);

        // อัพเดทหรือสร้าง notifications
        for (const notificationId of read) {
          const existing = allUserNotifications.find(
            n => n.notificationId === notificationId
          );

          if (existing) {
            // อัพเดท isRead = true
            await dbClient
              .update(notification)
              .set({ isRead: true, updatedAt: new Date() })
              .where(eq(notification.id, existing.id));
          } else {
            // สร้างใหม่
            await dbClient.insert(notification).values({
              userId,
              notificationId,
              isRead: true,
              isDeleted: false,
            });
          }
        }

        // อัพเดท notifications ที่ไม่อยู่ใน read array ให้เป็น unread
        for (const existing of allUserNotifications) {
          if (!readSet.has(existing.notificationId) && existing.isRead) {
            await dbClient
              .update(notification)
              .set({ isRead: false, updatedAt: new Date() })
              .where(eq(notification.id, existing.id));
          }
        }
      }

      // อัพเดท deleted status
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
              .set({ isDeleted: true, updatedAt: new Date() })
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
