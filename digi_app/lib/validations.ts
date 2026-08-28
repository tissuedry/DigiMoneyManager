import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["Karyawan", "Project Manager", "Tim Keuangan", "Direktur / Manajemen", "Superadmin", "superadmin"], {
    error: "Role harus salah satu dari: Karyawan, Project Manager, Tim Keuangan, Direktur / Manajemen, Super Admin"
  }),
  proyekId: z.union([z.number(), z.string()]).optional().nullable(),
});
