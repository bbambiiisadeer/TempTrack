import "dotenv/config";
import { dbClient } from "@db/client.js";
import { users, address, parcel } from "@db/schema.js";
import cors from "cors";
import Debug from "debug";
import { eq } from "drizzle-orm";
import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const debug = Debug("pf-backend");
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || '34tgefdswe345t6y4e5htndbfgdder45tyhertw';

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
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser()); 

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
 
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    token = req.cookies?.auth_token;
  }

  if (!token) {
    res.status(401).json({ msg: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, user: any) => {
    if (err) {
      res.status(403).json({ msg: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
};

// SIGNIN API with Cookie Support
app.post("/signin", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ 
        msg: "Email and password are required" 
      });
      return;
    }

    const userResult = await dbClient.query.users.findMany({
      where: eq(users.email, email)
    });

    if (userResult.length === 0) {
      res.status(401).json({ 
        msg: "Invalid email or password" 
      });
      return;
    }

    const user = userResult[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ 
        msg: "Invalid email or password" 
      });
      return;
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' } 
    );

    res.cookie('auth_token', token, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.cookie('user_data', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    next(err);
  }
});

// LOGOUT API
app.post("/logout", (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.clearCookie('user_data');
  res.json({ msg: "Logged out successfully" });
});

app.post("/verify-token", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    msg: "Token is valid",
    user: req.user
  });
});

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
    const { name, email, password }: { name: string; email: string; password: string } = req.body;
    if (!name || !email || !password) throw new Error("Missing fields");

    const existingUser = await dbClient.query.users.findMany({
      where: eq(users.email, email)
    });

    if (existingUser.length > 0) {
      res.status(409).json({ msg: "Email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbClient.insert(users).values({ name, email, password: hashedPassword }).returning();
    res.json({ msg: "User created", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE users 
// UPDATE user by ID (RESTful style)
app.patch("/users/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    
    if (!id) {
      res.status(400).json({ msg: "Missing id" });
      return;
    }

    const exists = await dbClient.query.users.findMany({ where: eq(users.id, id) });
    if (exists.length === 0) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // ตรวจสอบว่าเป็นเจ้าของ account หรือไม่
    if (req.user?.userId !== id) {
      res.status(403).json({ msg: "Unauthorized" });
      return;
    }

    const updateData: { name?: string; email?: string; password?: string } = {};
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

    // Update cookie with new user data
    res.cookie('user_data', JSON.stringify({
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
      createdAt: result[0].createdAt
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ msg: "User updated", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE users
app.delete("/users", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id }: { id: string } = req.body;
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
app.get("/address", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// CREATE address 
app.post("/address", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      userId, 
      name, 
      company, 
      email, 
      phoneNumber, 
      type, 
      address: addr, 
      city, 
      state, 
      postalCode, 
      isSaved 
    } = req.body;
    
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
app.patch("/address/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const allowedFields = [
      'name', 'company', 'email', 'phoneNumber', 
      'type', 'address', 'city', 'state', 'postalCode', 'isSaved'
    ];
    
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const exists = await dbClient.query.address.findMany({ 
      where: eq(address.id, id) 
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
});

// DELETE address by id
app.delete("/address/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ msg: "Missing id" });

    const exists = await dbClient.query.address.findMany({ where: eq(address.id, id) });
    if (exists.length === 0) return res.status(404).json({ msg: "Address not found" });

    await dbClient.delete(address).where(eq(address.id, id));
    res.json({ msg: "Address deleted", data: { id } });
  } catch (err) {
    next(err);
  }
});


// GET parcel 
app.get("/parcel", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const results = await dbClient.query.parcel.findMany();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// CREATE parcel 
app.post("/parcel", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { 
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
      specialNotes 
    } = req.body;

    if (!parcelName || !quantity || !weight) throw new Error("Missing required parcel fields");

    const result = await dbClient
      .insert(parcel)
      .values({ 
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
        specialNotes 
      })
      .returning();
    res.json({ msg: "Parcel created", data: result[0] });
  } catch (err) {
    next(err);
  }
});

// UPDATE parcel 
app.patch("/parcel", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

// DELETE parcel 
app.delete("/parcel", authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id }: { id: string } = req.body;
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