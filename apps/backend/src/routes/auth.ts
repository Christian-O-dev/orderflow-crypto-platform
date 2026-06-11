import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateJWT, JWT_SECRET } from "../middleware/auth.js";
import { Database } from "../database/index.js";

export function createAuthRouter(database: Database) {
  const router = Router();

  router.post("/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
      }

      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "El email ya está registrado" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await database.createUser(email, passwordHash);

      if (!newUser) {
        return res.status(500).json({ error: "Error al crear el usuario en la base de datos" });
      }

      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        token,
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
      }

      const user = await database.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  router.get("/me", authenticateJWT, async (req, res) => {
    try {
      // @ts-ignore
      const user = await database.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error("Me error:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  return router;
}
